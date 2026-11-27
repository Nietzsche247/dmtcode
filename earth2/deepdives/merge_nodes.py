#!/usr/bin/env python3
"""
merge_nodes.py
Generic merge of a node-link file (event nodes, company nodes and links) into an Earth2 graph.json.
Same pattern as merge_food.py, with every label read from the input file's "graph" block instead of
being written into the script. Python 3.8+, standard library only.

USAGE
  python3 merge_nodes.py GRAPH.json NODES_LINKS.json [--dry-run] [--out PATH]

THE INPUT "graph" BLOCK
  short_name   required, for example "hard pass Nov 25". Used in odds_text, the odds_history note
               and the merges entry.
  origin       required. Written to the origin field of every link added.
  created      required ISO date. The merge date (odds_history, odds_as_of, merges entry).
  note         optional. Goes into the merges entry notes, with the block name.
  model_layer  optional. Defaults to "deep dive", the value the earlier merges used. A node may carry its
               own model_layer, which then wins for that node.
  new_arms     optional list of arm names (capitals) this file adds. Each is appended to meta.arms.

THE INPUT "questions" LIST (optional)
  Scorecard questions for the new events, in the seed format of earth2/scorecard.py (event_id, path_node,
  text, test, source, tags, script_side, due, odds_locked, odds_basis, market, consensus). They are added
  through the same code path as scorecard.py add, so the same rules apply. A blank file to start from:
  earth2/templates/arm_template.json (guide: earth2/templates/README.md).

WHAT IT DOES
  1. Event nodes (type other than COMPANY) are added as graph nodes. The arm must already be a graph
     arm name (meta.arms); there is no arm mapping. odds_now is clamped to 1..99 (100 only for a
     FIRED status), status is copied as given, and estimated, odds_by and next_watch are kept when
     the node has them. odds_text reads "70% by 2027-03-31 (SHORT_NAME, estimate)" and odds_history
     starts with one row noted "SHORT_NAME, first load".
  2. Event links are added with the ten fields graph links carry: source, target, sign, strength,
     delay_days, kind, reason, estimated, delay_estimated, origin. A link whose source and target
     pair already exists in the graph is skipped and logged (graph strength kept).
  3. Links from an event node into a company id (CO:TICKER) are not added to graph links. Each one
     becomes a sits_on entry on that company (exposure_weight, kind, delay_days, reason, estimated).
     A company the graph already has is EXTENDED: the new sits_on entries are appended and
     event_nodes, arms and collision_candidate (3 or more event nodes from 2 or more arms) are
     recomputed. Its listed_options, listed_options_basis, options_check and every other field are
     left alone. A company the graph does not have must be described by a COMPANY node in the file
     and is added with the standard company fields.
  4. One entry is appended to graph["merges"]: date, source_file, short_name, nodes_added,
     links_added (count), links_skipped, companies_added, companies_extended, notes.
  5. The questions in the file are added to earth2/scorecard/questions.json, the score files are
     rewritten, and the graph's odds stamp (meta.odds_stamp) is set again. Questions are only written
     when the merge writes the repo's own graph (public/future/earth2/graph.json), not with --out elsewhere.

THE GATE ON NEW MAIN EVENTS
  A new node that is a main event (type END EVENT, or model_layer "board", whether the node says so or
  the graph block does) must carry
  settlement_test, judgment_tags, base_rate {value, reference_class, source}, kill_condition and
  kill_check, and must have at least one scorecard question (in this file or already in questions.json).
  The merge refuses and prints exactly what is missing for each node. validate_graph.py applies the same gate.

SAFETY
  - Stops (exit 3) while any scorecard question is past due and not answered (python3 earth2/scorecard.py due).
  - Refuses when meta.odds_stamp does not match the odds in the graph (odds edited outside the engine).
  - Refuses (exit 2) on: a missing short_name, origin or created date; a node id duplicated in the
    file, already used by a graph node that did not come from this file, or colliding with a company
    id; an arm that is not in meta.arms; a link endpoint that is in neither the graph nor the file
    (dangling); a link pair repeated in the file; a strength outside 0..1; a sign that is not +1 or
    -1; an unknown kind; a self loop; a window that is not ISO dated in order; a live node with no
    date_state; an id or field still holding a template placeholder ("FILL IN ..."); a new main event
    that fails the gate; a question that fails the scorecard rules.
  - Never changes odds_now of a node the graph already has (checked again before writing).
  - Idempotent: a second run with the same files adds nothing and writes nothing.
  - Writes atomically (temp file in the same folder, then rename). --dry-run writes nothing.
"""

import argparse
import datetime as dt
import json
import os
import shutil
import sys
import tempfile

ODDS_MIN, ODDS_MAX = 1.0, 99.0
DEFAULT_MODEL_LAYER = "deep dive"
DEFAULT_LINK_KINDS = ["NECESSARY", "LIKELY", "MAGNIFIES", "OPPOSES"]
EXPOSURE_TAIL = " Sign shows the node moves the stock, not which way."
KEEP_WHEN_PRESENT = ("estimated", "next_watch", "settlement_test", "current_fact", "board_reference",
                     "judgment_tags", "base_rate", "kill_condition", "kill_check", "date_state", "date_catalyst",
                     "peak_placeholder")
DATE_STATES = ("LOCKED", "SCHEDULED", "ESTIMATED")


def load_scorecard():
    """Load earth2/scorecard.py (one folder up). Without it the lock and the gate cannot be checked."""
    import importlib.util
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scorecard.py")
    if not os.path.exists(path):
        raise SystemExit("EARTH2 IS LOCKED. earth2/scorecard.py is missing, so the scorecard lock cannot be checked. Restore it from git.")
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location("earth2_scorecard", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def fail(msgs):
    if isinstance(msgs, str):
        msgs = [msgs]
    print("MERGE REFUSED:")
    for m in msgs[:200]:
        print("  - " + m)
    if len(msgs) > 200:
        print(f"  ... and {len(msgs) - 200} more")
    sys.exit(2)


def iso(d):
    try:
        return dt.date.fromisoformat(str(d)[:10])
    except (TypeError, ValueError):
        return None


def is_fired(status):
    return str(status).upper().startswith("FIRED")


def clamp_odds(v, status):
    if is_fired(status):
        return 100.0
    return float(min(ODDS_MAX, max(ODDS_MIN, float(v))))


def main(argv=None):
    p = argparse.ArgumentParser(description="Merge a node-link file into an Earth2 graph.json.")
    p.add_argument("graph")
    p.add_argument("nodes_links")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--out", help="write here instead of overwriting GRAPH.json")
    a = p.parse_args(argv)

    with open(a.graph, encoding="utf-8") as f:
        g = json.load(f)
    with open(a.nodes_links, encoding="utf-8") as f:
        dd = json.load(f)
    if not isinstance(g, dict) or "nodes" not in g or "links" not in g:
        fail("GRAPH.json needs 'nodes' and 'links'.")
    if not isinstance(dd, dict) or "nodes" not in dd or "links" not in dd:
        fail("NODES_LINKS.json needs 'nodes' and 'links'.")
    sc = load_scorecard()
    qdoc = sc.enforce_lock(g, tool="merge_nodes.py")  # exits 3 while a question is overdue
    stamp_issue = sc.stamp_problem(g, a.graph)
    if stamp_issue:
        fail(stamp_issue)

    source_file = os.path.basename(a.nodes_links)
    block = dd.get("graph") or {}
    short_name = str(block.get("short_name") or "").strip()
    origin = str(block.get("origin") or "").strip()
    created = iso(block.get("created"))
    model_layer = str(block.get("model_layer") or DEFAULT_MODEL_LAYER)
    head = []
    if not sc.filled(short_name):
        head.append("the input graph block has no short_name")
    if not sc.filled(origin):
        head.append("the input graph block has no origin")
    if created is None:
        head.append("the input graph block has no ISO 'created' date")
    graph_arms = set(g.get("meta", {}).get("arms", []))
    if not graph_arms:
        head.append("GRAPH.json meta.arms is empty, so arms cannot be checked")
    new_arms = block.get("new_arms") or []
    if not isinstance(new_arms, list):
        head.append("new_arms must be a list of arm names")
        new_arms = []
    for arm in new_arms:
        if not (isinstance(arm, str) and sc.filled(arm) and arm == arm.upper().strip()):
            head.append(f"new_arms: {arm!r} is not an arm name in capitals")
    new_arms = [x for x in new_arms if isinstance(x, str) and sc.filled(x) and x == x.upper().strip() and x not in graph_arms]
    graph_arms |= set(new_arms)
    merge_date = created.isoformat() if created else None

    def layer_of(n):
        """The model_layer a node will carry in the graph: its own when it has one, else the graph block's."""
        return str(n.get("model_layer") or model_layer)
    link_kinds = set(g.get("meta", {}).get("link_kinds", DEFAULT_LINK_KINDS))
    g.setdefault("companies", [])
    g.setdefault("merges", [])

    gnodes = {n["id"]: n for n in g["nodes"]}
    gcos = {c["id"]: c for c in g["companies"]}
    glinks = {(l["source"], l["target"]): l for l in g["links"]}
    odds_before = {nid: n.get("odds_now") for nid, n in gnodes.items()}

    # ---------- validate the input file ----------
    errs, seen = [], set()
    for n in dd["nodes"]:
        nid = n.get("id")
        if not nid:
            errs.append("a node has no id")
            continue
        if nid in seen:
            errs.append(f"duplicate id inside the input file: {nid}")
        seen.add(nid)
    if errs:
        fail(head + errs)
    errs = list(head)
    q_rows = dd.get("questions") or []
    if not isinstance(q_rows, list):
        errs.append("questions must be a list")
        q_rows = []
    asked = {q.get("event_id") for q in q_rows + qdoc["questions"] if isinstance(q, dict) and isinstance(q.get("event_id"), str)}
    # questions belong with the graph they describe: they are only written when the merge writes the repo's own graph
    own_graph = os.path.realpath(a.out or a.graph) == os.path.realpath(sc.PATHS["graph"])
    ev_nodes = [n for n in dd["nodes"] if n.get("type") != "COMPANY"]
    co_nodes = [n for n in dd["nodes"] if n.get("type") == "COMPANY"]
    ev_ids = {n["id"] for n in ev_nodes}
    co_ids = {n["id"] for n in co_nodes}

    already_nodes, new_nodes = [], []
    for n in ev_nodes:
        nid = n["id"]
        if nid in gcos or str(nid).startswith("CO:"):
            errs.append(f"node id {nid} collides with a company id")
        if nid in gnodes:
            if gnodes[nid].get("origin_file") == source_file:
                already_nodes.append(nid)
            else:
                errs.append(f"node id {nid} already exists in the graph and did not come from {source_file}")
            continue
        if str(nid).upper().startswith("FILL IN"):
            errs.append(f"{nid}: the id is still the template placeholder")
        for k in ("label", "type", "status"):
            if not sc.filled(n.get(k)):
                errs.append(f"{nid}: no {k}")
        if not is_fired(n.get("status")) and n.get("date_state") not in DATE_STATES:
            errs.append(f"{nid}: date_state must be one of {', '.join(DATE_STATES)}")
        if sc.is_main_event(dict(n, model_layer=layer_of(n))):
            miss = sc.gate_missing(n, nid in asked)
            if miss:
                errs.append(f"{nid}: new main event is missing: " + "; ".join(miss))
        if n.get("arm") not in graph_arms:
            errs.append(f"{nid}: arm '{n.get('arm')}' is not a graph arm (meta.arms)")
        ws, wp, we = iso(n.get("window_start")), iso(n.get("window_peak")), iso(n.get("window_end"))
        if None in (ws, wp, we):
            errs.append(f"{nid}: window_start, window_peak and window_end must be ISO dates")
        elif not (ws <= wp <= we):
            errs.append(f"{nid}: window dates out of order ({ws} {wp} {we})")
        try:
            float(n.get("odds_now", n.get("odds")))
        except (TypeError, ValueError):
            errs.append(f"{nid}: no usable odds")
        if not isinstance(n.get("layers_hit", []), list):
            errs.append(f"{nid}: layers_hit must be a list")
        new_nodes.append(n)
    for arm in new_arms:
        if not any(n.get("arm") == arm for n in new_nodes):
            errs.append(f"new_arms lists {arm!r} but no new node uses it")
    for c in co_nodes:
        if c["id"] in gnodes:
            errs.append(f"company id {c['id']} collides with a graph node id")
        if not str(c["id"]).startswith("CO:"):
            errs.append(f"company id {c['id']} must start with CO:")
        if "FILL IN" in str(c["id"]).upper() or (c["id"] not in gcos and not (sc.filled(c.get("ticker")) and sc.filled(c.get("name", c.get("label"))))):
            errs.append(f"company {c['id']}: the id, ticker or name is missing or still a template placeholder")

    known = set(gnodes) | ev_ids
    pairs = set()
    for i, l in enumerate(dd["links"]):
        s, t = l.get("source"), l.get("target")
        tag = f"link {i} {s}->{t}"
        is_co_link = t in co_ids or t in gcos or str(t).startswith("CO:")
        if s not in known:
            errs.append(f"{tag}: source not in graph or input file (dangling)")
        if is_co_link:
            if t not in co_ids and t not in gcos:
                errs.append(f"{tag}: company is in neither the graph nor the input file (dangling)")
        elif t not in known:
            errs.append(f"{tag}: target not in graph or input file (dangling)")
        if (s, t) in pairs:
            errs.append(f"{tag}: this pair appears more than once in the input file")
        pairs.add((s, t))
        try:
            st_ok = 0 <= float(l.get("strength")) <= 1
        except (TypeError, ValueError):
            st_ok = False
        if not st_ok:
            errs.append(f"{tag}: strength {l.get('strength')} outside 0..1")
        if l.get("sign") not in (1, -1):
            errs.append(f"{tag}: sign must be +1 or -1")
        if l.get("kind") not in link_kinds:
            errs.append(f"{tag}: kind {l.get('kind')} not in {sorted(link_kinds)}")
        if s == t:
            errs.append(f"link {i}: self loop on {s}")
    # questions are checked against the graph as it will be after the merge, through the scorecard's own code
    g_after = dict(g)
    g_after["nodes"] = g["nodes"] + [dict(n, model_layer=layer_of(n)) for n in new_nodes]
    new_qs, q_errs, q_notes = sc.add_questions(q_rows, [], g_after, qdoc, on_duplicate="skip")
    errs.extend(q_errs)
    if errs:
        fail(errs)
    for note in q_notes:
        print(note)

    # ---------- build additions ----------
    nodes_added, clamped = [], []
    for n in new_nodes:
        raw = float(n.get("odds_now", n.get("odds")))
        odds = clamp_odds(raw, n["status"])
        if odds != raw:
            clamped.append(n["id"])
        tail = "" if n.get("estimated") is False else ", estimate"
        rec = {
            "id": n["id"], "label": n["label"], "arm": n["arm"], "type": n["type"],
            "odds_now": odds,
            "odds_text": f"{odds:g}% by {n['window_end']} ({short_name}{tail})",
        }
        if n.get("odds_by") is not None:
            rec["odds_by"] = n["odds_by"]
        rec.update({
            "odds_history": [{"date": merge_date, "odds": odds, "note": f"{short_name}, first load"}],
            "odds_as_of": merge_date,
            "window_start": n["window_start"], "window_peak": n["window_peak"], "window_end": n["window_end"],
            "layers_hit": [str(x).upper() for x in n.get("layers_hit", [])],
            "least_capability": n.get("least_capability"),
            "status": n["status"],
            "source": n.get("source"), "model_layer": layer_of(n), "origin_file": source_file,
        })
        for k in KEEP_WHEN_PRESENT:
            if n.get(k) is not None:
                rec[k] = n[k]
        nodes_added.append(rec)

    links_added, links_skipped, co_links = [], [], {}
    for l in dd["links"]:
        s, t = l["source"], l["target"]
        if t in co_ids or t in gcos:
            co_links.setdefault(t, []).append(l)
            continue
        if (s, t) in glinks:
            ex = glinks[(s, t)]
            if ex.get("origin") != origin:
                links_skipped.append({"why": "graph already has this link; graph strength kept", "input_link": l,
                                      "graph_link": ex})
            continue
        links_added.append({
            "source": s, "target": t, "sign": int(l["sign"]), "strength": round(float(l["strength"]), 4),
            "delay_days": int(l.get("delay_days") or 0), "kind": l["kind"], "reason": l.get("reason", ""),
            "estimated": bool(l.get("estimated", True)), "delay_estimated": bool(l.get("delay_estimated", True)),
            "origin": origin})

    all_nodes = dict(gnodes)
    all_nodes.update({n["id"]: n for n in nodes_added})

    def recompute(co):
        ev = sorted({s["node"] for s in co.get("sits_on", []) if not s.get("context_only") and s["node"] in all_nodes})
        arms = sorted({all_nodes[x]["arm"] for x in ev if all_nodes[x].get("arm")})
        co["event_nodes"] = ev
        co["arms"] = arms
        co["collision_candidate"] = len(ev) >= 3 and len(arms) >= 2

    co_by_id = {c["id"]: c for c in co_nodes}
    targets = [c["id"] for c in co_nodes] + [t for t in co_links if t not in co_ids]
    companies_added, companies_extended, co_records = [], [], []
    for cid in targets:
        c = co_by_id.get(cid, {})
        entries, linked = [], set()
        for l in co_links.get(cid, []):
            linked.add(l["source"])
            reason = str(l.get("reason", "")).replace(EXPOSURE_TAIL, "")
            entries.append({"node": l["source"], "materiality": None, "horizon": None, "context_only": False,
                            "source": f"{source_file}: link {l['source']} > {cid}",
                            "exposure_weight": float(l["strength"]), "kind": l["kind"],
                            "delay_days": int(l.get("delay_days") or 0), "reason": reason,
                            "estimated": bool(l.get("estimated", True))})
        for n_ in c.get("nodes_on", []):
            if n_ not in linked and n_ in all_nodes:
                entries.append({"node": n_, "materiality": None, "horizon": None, "context_only": False,
                                "source": f"{source_file}: nodes_on of {cid} (no weighted link)"})
        if cid in gcos:
            have = {(s.get("node"), s.get("source")) for s in gcos[cid].get("sits_on", [])}
            fresh = [e for e in entries if (e["node"], e["source"]) not in have]
            if not fresh:
                continue
            co_records.append(("extend", cid, fresh))
            companies_extended.append(cid)
        else:
            rec = {
                "id": cid, "ticker": c.get("ticker"), "name": c.get("name", c.get("label")),
                "exchange": c.get("exchange"),
                "listed_options": c.get("listed_options", "no"),
                "listed_options_basis": c.get("listed_options_basis", short_name),
                "verified": False, "verified_source": None,
                "sits_on": entries, "event_nodes": [], "context_nodes": [], "arms": [],
                "collision_candidate": False, "other_listings": c.get("other_listings", [])}
            if c.get("options_check"):
                rec["options_check"] = c["options_check"]
            co_records.append(("add", cid, rec))
            companies_added.append(cid)

    # ---------- idempotency ----------
    prior = [m for m in g["merges"] if m.get("source_file") == source_file]
    if not nodes_added and not links_added and not co_records:
        if new_qs and not a.dry_run and own_graph:
            qdoc["questions"].extend(new_qs)
            sc.write_json(sc.PATHS["questions"], qdoc)
            sc.write_score(qdoc["questions"])
            print(f"ALREADY MERGED: {source_file} is in this graph. Added {len(new_qs)} questions that were missing "
                  f"({', '.join(q['id'] for q in new_qs)}).")
            return 0
        if new_qs and own_graph:
            print(f"ALREADY MERGED: {source_file} is in this graph. {len(new_qs)} of its questions are not in "
                  "questions.json yet and would be added. DRY RUN: nothing written.")
            return 0
        print(f"ALREADY MERGED: {source_file} is in this graph ({len(already_nodes)} nodes present, "
              f"{len(prior)} merges entry). Nothing to add; nothing written.")
        return 0

    # ---------- apply ----------
    for arm in new_arms:
        g["meta"]["arms"].append(arm)
    g["nodes"].extend(nodes_added)
    g["links"].extend(links_added)
    flipped = []
    for kind, cid, payload in co_records:
        if kind == "add":
            recompute(payload)
            g["companies"].append(payload)
        else:
            co = gcos[cid]
            was = bool(co.get("collision_candidate"))
            co.setdefault("sits_on", []).extend(payload)
            recompute(co)
            if co["collision_candidate"] and not was:
                flipped.append(cid)

    notes = [str(x) for x in (block.get("name"), block.get("note")) if x]
    notes.append("Company exposure links became sits_on entries; existing companies were extended, not duplicated.")
    notes.append("Odds clamped to 1..99 on load" + (f" (clamped: {', '.join(clamped)})." if clamped else "; none needed it."))
    if prior:
        notes.append(f"re-run added items missing after an earlier merge of the same file ({len(prior)} earlier entry)")
    g["merges"].append({
        "date": merge_date,
        "source_file": source_file,
        "short_name": short_name,
        "nodes_added": [n["id"] for n in nodes_added],
        "links_added": len(links_added),
        "links_skipped": links_skipped,
        "companies_added": companies_added,
        "companies_extended": companies_extended,
        "notes": notes,
    })

    # ---------- summary ----------
    touched = set(companies_added + companies_extended)
    co_flag = [c["id"] for c in g["companies"] if c["id"] in touched and c.get("collision_candidate")]
    print(f"EARTH2 MERGE  {source_file}  ->  {a.out or a.graph}")
    print(f"  short name         {short_name}   (merge date {merge_date}, model_layer '{model_layer}')")
    print(f"  nodes added        {len(nodes_added):>4}   ({', '.join(n['id'] for n in nodes_added[:6])}{' ...' if len(nodes_added) > 6 else ''})")
    print(f"  links added        {len(links_added):>4}   (skipped, graph already had them: {len(links_skipped)})")
    print(f"  companies added    {len(companies_added):>4}   ({', '.join(companies_added) or 'none'})")
    print(f"  companies extended {len(companies_extended):>4}   ({', '.join(companies_extended) or 'none'})")
    print(f"  sits_on entries    {sum(len(x[2]['sits_on']) if x[0] == 'add' else len(x[2]) for x in co_records):>4}")
    print(f"  collision candidates among them (3+ event nodes, 2+ graph arms): {', '.join(co_flag) or 'none'}")
    print(f"  newly flagged by this merge: {', '.join(flipped) or 'none'}")
    print(f"  totals now: {len(g['nodes'])} nodes, {len(g['links'])} links, {len(g['companies'])} companies, {len(g['merges'])} merges")
    gated = [n["id"] for n in nodes_added if sc.is_main_event(n)]
    print(f"  new arms           {len(new_arms):>4}   ({', '.join(new_arms) or 'none'})")
    print(f"  new main events    {len(gated):>4}   ({', '.join(gated) or 'none'}; each passed the gate)")
    print(f"  questions added    {len(new_qs):>4}   ({', '.join(q['id'] for q in new_qs) or 'none'})")

    # ---------- final integrity check (same checks cascade.py runs on load, plus the odds guard) ----------
    ids = {n["id"] for n in g["nodes"]}
    bad = [f"{l['source']}->{l['target']}" for l in g["links"] if l["source"] not in ids or l["target"] not in ids]
    if bad:
        fail([f"dangling link after merge: {b}" for b in bad])
    if len(ids) != len(g["nodes"]):
        fail("duplicate node ids after merge")
    if len({c["id"] for c in g["companies"]}) != len(g["companies"]):
        fail("duplicate company ids after merge")
    moved = [n["id"] for n in g["nodes"] if n["id"] in odds_before and n.get("odds_now") != odds_before[n["id"]]]
    if moved:
        fail([f"odds_now of existing node {m} would change" for m in moved])

    if a.dry_run:
        print("DRY RUN: nothing written.")
        return 0
    g.setdefault("meta", {})["odds_stamp"] = sc.odds_stamp(g["nodes"])
    target = a.out or a.graph
    folder = os.path.dirname(os.path.abspath(target))
    fd, tmp = tempfile.mkstemp(dir=folder, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(g, f, indent=1, ensure_ascii=False)
        if os.path.exists(target):
            shutil.copymode(target, tmp)
        os.replace(tmp, target)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise
    print(f"WROTE {target}  (odds stamp {g['meta']['odds_stamp']})")
    if not own_graph:
        if new_qs:
            print(f"NOTE: {len(new_qs)} questions were NOT added, because this merge did not write {sc.GRAPH_REL}. "
                  "Run the merge on the repo's own graph to add them.")
        return 0
    if new_qs:
        qdoc["questions"].extend(new_qs)
        sc.write_json(sc.PATHS["questions"], qdoc)
    sc.write_score(qdoc["questions"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
