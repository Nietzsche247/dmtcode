#!/usr/bin/env python3
"""
merge_food.py
Merge EARTH2 deep dive 2 (the food collision) into an Earth2 graph.json, the same way deep dive 1
was merged (graph.json merges[0]). Python 3.8+, standard library only.

USAGE
  python3 merge_food.py GRAPH.json NODES_LINKS.json [--dry-run] [--out PATH]

WHAT IT DOES
  1. Event nodes (type other than COMPANY) are added as graph nodes: graph arm names, odds_now clamped
     to 1..99 (100 only for FIRED), odds_text, odds_history, odds_as_of, layers in capitals,
     status mapped (RUNNING, OPEN, WATCH, SCHEDULED load as ON TRACK; the original is kept in
     status_deepdive; FIRED loads as FIRED with the date), model_layer "deep dive", origin_file.
  2. Event links are added with estimated, delay_estimated, origin and display_only. A link whose
     source and target pair already exists in the graph is skipped and logged (graph strength kept).
  3. Company nodes become entries in graph["companies"]. Links from an event node into a company
     become sits_on entries (exposure_weight, kind, delay_days, reason, estimated). A company that
     already exists keeps its record and gets the new sits_on entries appended; event_nodes, arms and
     collision_candidate (3 or more event nodes from 2 or more arms) are recomputed.
  4. One entry is appended to graph["merges"] with date, source_file, nodes_added, links_added,
     links_skipped, companies_added, companies_extended (also written as companies_updated, the
     key merges[0] used) and notes.

SAFETY
  - Refuses (exit 2) if a deep-dive node id is duplicated in the file, already used by a graph node
    that did not come from this file, or collides with a company id; if any link endpoint is missing;
    if a strength is outside 0..1, a sign is not +1/-1, a kind is unknown, an arm is unknown, or a
    window is not ISO dated in order.
  - Idempotent: re-running with the same files adds nothing and writes nothing.
  - Writes atomically (temp file then rename). --dry-run writes nothing.
"""

import argparse
import datetime as dt
import json
import os
import sys
import tempfile

ODDS_MIN, ODDS_MAX = 1.0, 99.0
ORIGIN = "food deep dive Nov 23 (A to about B, deep-dive odds)"
ARM_MAP = {  # deep-dive arm names to graph arms (same idea as merges[0] arm_map)
    "EL NINO": "WEATHER AND FOOD",
    "FOOD LAYER": "WEATHER AND FOOD",
    "COLLISION": "WEATHER AND FOOD",
    "GULF FERTILIZER": "OIL AND GULF",
    "CHINA FERTILIZER POLICY": "OIL AND GULF",
    "RUSSIAN GRAIN AND FERTILIZER": "RUSSIA AND EUROPE",
    "WEATHER AND FOOD": "WEATHER AND FOOD",
    "OIL AND GULF": "OIL AND GULF",
    "RUSSIA AND EUROPE": "RUSSIA AND EUROPE",
}
STATUS_ON_TRACK = {"RUNNING", "OPEN", "WATCH", "SCHEDULED"}
EXPOSURE_TAIL = " Sign shows the node moves the stock, not which way."


def fail(msgs):
    if isinstance(msgs, str):
        msgs = [msgs]
    print("MERGE REFUSED:")
    for m in msgs[:40]:
        print("  - " + m)
    sys.exit(2)


def iso(d):
    try:
        return dt.date.fromisoformat(str(d)[:10])
    except (TypeError, ValueError):
        return None


def clamp_odds(v, status):
    if str(status).upper().startswith("FIRED"):
        return 100.0
    return float(min(ODDS_MAX, max(ODDS_MIN, float(v))))


def map_arm(arm, graph_arms):
    if arm in graph_arms:
        return arm
    base = str(arm or "").split(" (")[0].strip().upper()
    return ARM_MAP.get(base)


def main(argv=None):
    p = argparse.ArgumentParser(description="Merge the food deep dive into an Earth2 graph.json.")
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
    if "nodes" not in dd or "links" not in dd:
        fail("NODES_LINKS.json needs 'nodes' and 'links'.")

    source_file = os.path.basename(a.nodes_links)
    block = dd.get("graph", {})
    merge_date = str(block.get("created") or dt.date.today().isoformat())
    graph_arms = set(g.get("meta", {}).get("arms", []))
    link_kinds = set(g.get("meta", {}).get("link_kinds", ["NECESSARY", "LIKELY", "MAGNIFIES", "OPPOSES"]))
    g.setdefault("companies", [])
    g.setdefault("merges", [])

    gnodes = {n["id"]: n for n in g["nodes"]}
    gcos = {c["id"]: c for c in g["companies"]}
    glinks = {(l["source"], l["target"]): l for l in g["links"]}

    # ---------- validate the deep-dive file ----------
    errs, seen = [], set()
    for n in dd["nodes"]:
        nid = n.get("id")
        if not nid:
            errs.append("a node has no id")
            continue
        if nid in seen:
            errs.append(f"duplicate id inside the deep-dive file: {nid}")
        seen.add(nid)
    ev_nodes = [n for n in dd["nodes"] if n.get("type") != "COMPANY"]
    co_nodes = [n for n in dd["nodes"] if n.get("type") == "COMPANY"]
    ev_ids = {n["id"] for n in ev_nodes}
    co_ids = {n["id"] for n in co_nodes}

    already_nodes, new_nodes = [], []
    for n in ev_nodes:
        nid = n["id"]
        if nid in gcos:
            errs.append(f"node id {nid} collides with a company id in the graph")
        if nid in gnodes:
            if gnodes[nid].get("origin_file") == source_file:
                already_nodes.append(nid)
            else:
                errs.append(f"node id {nid} already exists in the graph and did not come from {source_file}")
            continue
        if map_arm(n.get("arm"), graph_arms) is None:
            errs.append(f"{nid}: arm '{n.get('arm')}' is not a graph arm and has no mapping")
        ws, wp, we = iso(n.get("window_start")), iso(n.get("window_peak")), iso(n.get("window_end"))
        if None in (ws, wp, we):
            errs.append(f"{nid}: window_start, window_peak and window_end must be ISO dates")
        elif not (ws <= wp <= we):
            errs.append(f"{nid}: window dates out of order ({ws} {wp} {we})")
        odds = n.get("odds_now", n.get("odds"))
        if odds is None:
            errs.append(f"{nid}: no odds")
        new_nodes.append(n)
    for c in co_nodes:
        if c["id"] in gnodes:
            errs.append(f"company id {c['id']} collides with a graph node id")
        if not str(c["id"]).startswith("CO:"):
            errs.append(f"company id {c['id']} must start with CO:")

    known = set(gnodes) | ev_ids
    for i, l in enumerate(dd["links"]):
        s, t = l.get("source"), l.get("target")
        is_co_link = t in co_ids or t in gcos
        if s not in known:
            errs.append(f"link {i} {s}->{t}: source not in graph or deep dive (dangling)")
        if not is_co_link and t not in known:
            errs.append(f"link {i} {s}->{t}: target not in graph or deep dive (dangling)")
        if is_co_link and t not in co_ids:
            errs.append(f"link {i} {s}->{t}: company link to a company the file does not describe")
        st = l.get("strength")
        if st is None or not (0 <= float(st) <= 1):
            errs.append(f"link {i} {s}->{t}: strength {st} outside 0..1")
        if l.get("sign") not in (1, -1):
            errs.append(f"link {i} {s}->{t}: sign must be +1 or -1")
        if l.get("kind") not in link_kinds:
            errs.append(f"link {i} {s}->{t}: kind {l.get('kind')} not in {sorted(link_kinds)}")
        if s == t:
            errs.append(f"link {i}: self loop on {s}")
    if errs:
        fail(errs)

    # ---------- build additions ----------
    nodes_added = []
    for n in new_nodes:
        status_dd = str(n.get("status", "OPEN")).upper()
        odds = clamp_odds(n.get("odds_now", n.get("odds")), status_dd)
        if status_dd.startswith("FIRED"):
            status = status_dd if status_dd != "FIRED" else f"FIRED {n.get('window_start')}"
        elif status_dd in STATUS_ON_TRACK:
            status = "ON TRACK"
        else:
            status = status_dd
        rec = {
            "id": n["id"], "label": n["label"], "arm": map_arm(n.get("arm"), graph_arms),
            "deepdive_arm": n.get("deepdive_arm", n.get("arm")), "type": n["type"],
            "odds_now": odds,
            "odds_text": f"{odds:g}% by {n['window_end']} (food deep dive, Nov 23)",
            "odds_history": [{"date": merge_date, "odds": odds, "note": "food deep dive, first load"}],
            "odds_as_of": merge_date,
            "window_start": n["window_start"], "window_peak": n["window_peak"], "window_end": n["window_end"],
            "layers_hit": [str(x).upper() for x in n.get("layers_hit", [])],
            "least_capability": n.get("least_capability"),
            "status": status, "status_deepdive": status_dd,
            "source": n.get("source"), "model_layer": "deep dive", "origin_file": source_file,
        }
        for k in ("settlement_test", "current_fact"):
            if n.get(k):
                rec[k] = n[k]
        nodes_added.append(rec)

    links_added, links_skipped, co_links = [], [], {}
    for l in dd["links"]:
        s, t = l["source"], l["target"]
        if t in co_ids:
            co_links.setdefault(t, []).append(l)
            continue
        if (s, t) in glinks:
            ex = glinks[(s, t)]
            if ex.get("origin") != ORIGIN:
                links_skipped.append({"why": "graph already has this link; graph strength kept", "deepdive_link": l,
                                      "graph_link": ex})
            continue
        links_added.append({
            "source": s, "target": t, "sign": int(l["sign"]), "strength": round(float(l["strength"]), 4),
            "delay_days": int(l.get("delay_days") or 0), "kind": l["kind"], "reason": l.get("reason", ""),
            "estimated": bool(l.get("estimated", True)), "delay_estimated": True, "origin": ORIGIN,
            "display_only": False})

    all_nodes = dict(gnodes)
    all_nodes.update({n["id"]: n for n in nodes_added})

    def recompute(co):
        ev = sorted({s["node"] for s in co.get("sits_on", []) if not s.get("context_only") and s["node"] in all_nodes})
        ctx = sorted({s["node"] for s in co.get("sits_on", []) if s.get("context_only")})
        arms = sorted({all_nodes[x]["arm"] for x in ev if all_nodes[x].get("arm")})
        co["event_nodes"] = ev
        co["context_nodes"] = ctx
        co["arms"] = arms
        co["collision_candidate"] = len(ev) >= 3 and len(arms) >= 2

    companies_added, companies_extended, co_records = [], [], []
    for c in co_nodes:
        cid = c["id"]
        entries = []
        linked = set()
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
        profile = {
            "deepdive_id": cid, "source_file": source_file, "ticker_text": c.get("ticker_text"),
            "listed_options": c.get("listed_options_text", c.get("listed_options")),
            "verified": bool(c.get("verified")), "flag_3plus_nodes_2plus_arms": bool(c.get("flag_3plus_nodes_2plus_arms")),
            "note": c.get("note"), "source": c.get("source"), "status": c.get("status", "ACTIVE"),
            "window_start": c.get("window_start"), "window_peak": c.get("window_peak"), "window_end": c.get("window_end"),
            "nodes_on": c.get("nodes_on", [])}
        if cid in gcos:
            co = gcos[cid]
            have = {(s["node"], s.get("source")) for s in co.get("sits_on", [])}
            fresh = [e for e in entries if (e["node"], e["source"]) not in have]
            prof_done = (co.get("deepdive_profile", {}) or {}).get("source_file") == source_file or any(
                (x or {}).get("source_file") == source_file for x in co.get("deepdive_profiles", []))
            if not fresh and prof_done:
                continue
            co_records.append(("extend", cid, fresh, profile))
            companies_extended.append(cid)
        else:
            rec = {
                "id": cid, "ticker": c.get("ticker"), "name": c.get("name", c.get("label")),
                "exchange": c.get("exchange"), "other_listings": c.get("other_listings", []),
                "listed_options": c.get("listed_options", "no"),
                "listed_options_basis": c.get("listed_options_basis", "food deep dive Nov 23"),
                "verified": False, "verified_source": None, "deepdive_verified": bool(c.get("verified")),
                "sits_on": entries, "event_nodes": [], "context_nodes": [], "arms": [],
                "collision_candidate": False, "deepdive_profile": profile}
            if c.get("options_check"):
                rec["options_check"] = c["options_check"]
            co_records.append(("add", cid, rec, None))
            companies_added.append(cid)

    # ---------- idempotency ----------
    prior = [m for m in g["merges"] if m.get("source_file") == source_file]
    nothing = not nodes_added and not links_added and not co_records
    if nothing:
        print(f"ALREADY MERGED: {source_file} is in this graph ({len(already_nodes)} nodes present, "
              f"{len(prior)} merges entry). Nothing to add; nothing written.")
        return 0

    # ---------- apply ----------
    g["nodes"].extend(nodes_added)
    g["links"].extend(links_added)
    for kind, cid, payload, profile in co_records:
        if kind == "add":
            recompute(payload)
            g["companies"].append(payload)
        else:
            co = gcos[cid]
            co.setdefault("sits_on", []).extend(payload)
            if not co.get("deepdive_profile"):
                co["deepdive_profile"] = profile
            elif co["deepdive_profile"].get("source_file") != source_file:
                if not any((x or {}).get("source_file") == source_file for x in co.get("deepdive_profiles", [])):
                    co.setdefault("deepdive_profiles", []).append(profile)
            recompute(co)

    entry = {
        "date": merge_date,
        "source_file": source_file,
        "source_drive_id": None,
        "deepdive_graph_block": block,
        "board_refs_used_note": "board_refs_used are graph.json odds_now values on the merge date; no existing node odds were changed by this merge.",
        "nodes_added": [n["id"] for n in nodes_added],
        "nodes_mapped_to_v5": [],
        "links_added": len(links_added),
        "links_skipped": links_skipped,
        "companies_added": companies_added,
        "companies_extended": companies_extended,
        "companies_updated": companies_extended,
        "arm_map": ARM_MAP,
        "status_map": "deep-dive RUNNING, OPEN, WATCH and SCHEDULED load as ON TRACK (original kept in status_deepdive); FIRED loads as FIRED with the date",
        "strength_note": "Link strengths are the deep dive's own, computed on graph odds_now of the merge date (NECESSARY links use B now / A now as in deep dive 1).",
        "notes": [
            "Deep dive 2: the food collision (El Nino, Gulf fertilizer behind Hormuz, Russian grain) on WF8, Jan to Jun 2027.",
            "Company links became sits_on entries; existing companies were extended, not duplicated.",
            "Odds clamped to 1..99 on load; no FIRED nodes in this file.",
        ],
    }
    if prior:
        entry["notes"].append(f"re-run added items missing after an earlier merge of the same file ({len(prior)} earlier entry)")
    g["merges"].append(entry)

    # ---------- summary ----------
    co_new_flag = [c for c in g["companies"] if c["id"] in companies_added + companies_extended and c.get("collision_candidate")]
    print(f"EARTH2 MERGE  {source_file}  ->  {a.out or a.graph}")
    print(f"  nodes added        {len(nodes_added):>4}   ({', '.join(n['id'] for n in nodes_added[:6])}{' ...' if len(nodes_added) > 6 else ''})")
    print(f"  links added        {len(links_added):>4}   (skipped, graph already had them: {len(links_skipped)})")
    print(f"  companies added    {len(companies_added):>4}   ({', '.join(companies_added)})")
    print(f"  companies extended {len(companies_extended):>4}   ({', '.join(companies_extended) or 'none'})")
    print(f"  collision candidates among them (3+ event nodes, 2+ graph arms): {', '.join(c['id'] for c in co_new_flag) or 'none'}")
    print(f"  totals now: {len(g['nodes'])} nodes, {len(g['links'])} links, {len(g['companies'])} companies, {len(g['merges'])} merges")

    # final integrity check (same checks cascade.py runs on load)
    ids = {n["id"] for n in g["nodes"]}
    bad = [f"{l['source']}->{l['target']}" for l in g["links"] if l["source"] not in ids or l["target"] not in ids]
    if bad:
        fail([f"dangling link after merge: {b}" for b in bad])
    if len(ids) != len(g["nodes"]):
        fail("duplicate node ids after merge")

    if a.dry_run:
        print("DRY RUN: nothing written.")
        return 0
    target = a.out or a.graph
    folder = os.path.dirname(os.path.abspath(target))
    fd, tmp = tempfile.mkstemp(dir=folder, suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(g, f, indent=1, ensure_ascii=False)
    os.replace(tmp, target)
    print(f"WROTE {target}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
