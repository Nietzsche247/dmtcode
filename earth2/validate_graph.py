#!/usr/bin/env python3
"""
earth2/validate_graph.py
Structural checks and counts for the Earth2 graph. Python 3.8+, standard library only. Read only.

USAGE
  python3 earth2/validate_graph.py public/future/earth2/graph.json [--against OLD.json] [--json]

  --against OLD.json   also check that odds_now is unchanged on every node both files share
  --json               print the counts as JSON (the same families of counts as verification_v5.1.json)

Exit code 0 when every check passes, 1 otherwise, 3 when the scorecard lock is on.
The CONTRADICTIONS list is warn only and never changes the exit code.

THE SCORECARD LOCK (earth2/scorecard.py)
  While any scorecard question is past due and not answered, this script stops before any check and prints
  the questions with the exact commands to settle them. Run python3 earth2/scorecard.py due first. No flag
  and no environment variable skips this.

CHECKS
  JSON loads; node ids unique; every link endpoint exists; no self links; no repeated source-target pair;
  odds_now is None or 0..100; window_start <= window_peak <= window_end on every node that has a window
  (drivers carry none); every link that is not display_only has a numeric strength in (0, 1] and an integer
  delay_days; every display_only link says why (display_only_reason); sign is +1 or -1; kind is a known kind;
  alias map entries point at a node that exists and the old id no longer exists; company and chain node
  references exist; kill_condition and kill_check on every live END EVENT, board row and tree trigger with a
  board reference; date_state (LOCKED, SCHEDULED, ESTIMATED) on every live node with a window; every row of
  meta.contains names two different nodes that exist (old ids resolve through the alias map).

CONTRADICTIONS (warn only: a cascade run can create one, and the next read fixes it)
  Printed as WARN lines with both numbers, then a count. Two kinds, compared like for like, with 1 point of slack:
  (a) a NECESSARY link whose source is less likely than its target. When both nodes carry a live date curve
      (odds_by), the source's curve value at the target's deadline (window_end) is set against the target's
      odds_now; otherwise odds_now against odds_now. FIRED nodes are skipped.
  (b) a pair in meta.contains, {"whole": id, "part": id, "note": "..."}: the whole happens whenever the part
      does, so the whole must be at least as likely as the part at every shared date. Both curves: every curve
      date inside both curves' spans. Only the whole has a curve: its value at the part's deadline against the
      part's odds_now. Only the part has a curve: the whole's odds_now against the part's curve at the whole's
      deadline. No curves: odds_now against odds_now when the whole's deadline is the same or later (else the
      pair cannot be compared and is counted as such). A pair with a FIRED node, or a node at 1, is skipped.
  A curve value between two points is the straight line between them; before the first point it is the first
  point and after the last point the last point. A node at 1 or FIRED has no live curve; its odds_now is used.

SCORECARD CHECKS (the rules live in earth2/scorecard.py)
  the odds stamp: meta.odds_stamp must match the odds in the file, so a hand edit to odds_now fails here;
  earth2/scorecard/questions.json: schema, every lock hash, event_id is a main event, tags valid, a market
  tag carries market odds, a pace tag carries a consensus, due_current moves only by a logged deferral;
  public/future/earth2/scorecard.json and earth2/scorecard/corrections.json match questions.json;
  the gate: a main event (type END EVENT, or model_layer "board"; one definition, scorecard.is_main_event) that is not on
  earth2/scorecard/legacy_main_events.json must have settlement_test, judgment_tags, base_rate {value,
  reference_class, source}, kill_condition, kill_check and at least one question; an older main event must
  not lose a field it had. The gaps the older events still carry are printed as a NOTE.
"""
import argparse
import calendar
import collections
import datetime as dt
import json
import os
import sys

KINDS = {"NECESSARY", "LIKELY", "MAGNIFIES", "OPPOSES"}
STATES = {"LOCKED", "SCHEDULED", "ESTIMATED"}
CONTRADICTION_SLACK = 1.0  # points: a gap this small is rounding, not a contradiction


def fired(n):
    return str(n.get("status", "")).upper().startswith("FIRED") or n.get("odds_now") == 100


def aliases(g):
    out = {}
    for m in g.get("merges", []) or []:
        for old, v in (m.get("alias_map") or {}).items():
            out[old] = v["survivor"] if isinstance(v, dict) else v
    return out


# ---------------------------------------------------------------- contradictions (warn only)
def as_day(value, end=False):
    """A date from YYYY-MM-DD or YYYY-MM (the first of the month, or the last when end is true), else None."""
    s = str(value or "").strip()
    try:
        if len(s) == 7:
            y, m = int(s[:4]), int(s[5:7])
            return dt.date(y, m, calendar.monthrange(y, m)[1] if end else 1)
        return dt.date.fromisoformat(s[:10])
    except ValueError:
        return None


def curve_points(n):
    """(date, value) for every point of the node's curve (odds_by) that holds a number, in date order.
    A node at 1 or FIRED has no live curve (the engine leaves that curve as it was), so it gives no points."""
    o = n.get("odds_now")
    if o is None or fired(n) or o <= 1:
        return []
    out = []
    for k, v in (n.get("odds_by") or {}).items():
        if isinstance(v, (int, float)) and not isinstance(v, bool) and as_day(k) is not None:
            out.append((as_day(k), float(v)))
    return sorted(out)


def curve_at(pts, day):
    """The curve value on a day: the straight line between the two points around it; the first point before
    the curve starts; the last point after it ends."""
    if day <= pts[0][0]:
        return pts[0][1]
    if day >= pts[-1][0]:
        return pts[-1][1]
    for (d0, v0), (d1, v1) in zip(pts, pts[1:]):
        if d0 <= day <= d1:
            return v0 + (v1 - v0) * (day - d0).days / max(1, (d1 - d0).days)
    return pts[-1][1]


def contains_rows(g):
    """(rows, problems) from meta.contains. A row is (whole id, part id, note) with old ids resolved through
    the alias map. A problem is a row that is not in shape or names a node that does not exist."""
    by = {n["id"]: n for n in g.get("nodes", [])}
    al = aliases(g)

    def resolve(nid):
        seen = set()
        while nid not in by and nid in al and nid not in seen:
            seen.add(nid)
            nid = al[nid]
        return nid if nid in by else None

    rows, problems = [], []
    listed = (g.get("meta") or {}).get("contains")
    if listed is None:
        return rows, problems
    if not isinstance(listed, list):
        return rows, ["meta.contains must be a list of {whole, part, note}"]
    seen_pairs = set()
    for i, row in enumerate(listed):
        if not isinstance(row, dict) or not isinstance(row.get("whole"), str) or not isinstance(row.get("part"), str):
            problems.append(f"meta.contains[{i}]: needs whole and part (node ids) and a note")
            continue
        if not isinstance(row.get("note"), str) or not row["note"].strip():
            problems.append(f"meta.contains[{i}] {row['whole']} contains {row['part']}: no note saying why")
            continue
        w, p_ = resolve(row["whole"]), resolve(row["part"])
        if w is None or p_ is None:
            problems.append(f"meta.contains[{i}]: unknown node {row['whole'] if w is None else row['part']}")
            continue
        if w == p_:
            problems.append(f"meta.contains[{i}]: whole and part are the same node {w} (folded together?); remove the row")
            continue
        if (w, p_) in seen_pairs:
            problems.append(f"meta.contains[{i}]: {w} contains {p_} is listed twice")
            continue
        seen_pairs.add((w, p_))
        rows.append((w, p_, row["note"].strip()))
    return rows, problems


def contradictions(g):
    """(items, not_comparable). Each item is a dict with kind ("necessary" or "contains"), the two ids, the two
    numbers, where they were read and a ready WARN line. Warn only: nothing here fails the validator."""
    by = {n["id"]: n for n in g.get("nodes", [])}
    slack = CONTRADICTION_SLACK
    items, not_comparable = [], []
    # (a) a necessary condition is at least as likely as the event it precedes
    for e in g.get("links", []):
        if e.get("kind") != "NECESSARY" or e.get("source") not in by or e.get("target") not in by:
            continue
        s, t = by[e["source"]], by[e["target"]]
        if s.get("odds_now") is None or t.get("odds_now") is None or fired(s) or fired(t):
            continue
        sp, tp, t_end = curve_points(s), curve_points(t), as_day(t.get("window_end"), end=True)
        if sp and tp and t_end is not None:
            sv, how = curve_at(sp, t_end), f"its curve at {t_end}"
        else:
            sv, how = float(s["odds_now"]), "odds now"
        tv = float(t["odds_now"])
        if sv < tv - slack:
            items.append({"kind": "necessary", "source": s["id"], "target": t["id"], "source_value": round(sv, 1),
                          "target_value": round(tv, 1), "read": how,
                          "line": f"WARN necessary link {s['id']} -> {t['id']}: source {sv:.1f} ({how}) is below "
                                  f"target {tv:.1f} (odds now)"})
    # (b) a whole is at least as likely as its part at every shared date
    for w_id, p_id, note in contains_rows(g)[0]:
        w, p_ = by[w_id], by[p_id]
        if w.get("odds_now") is None or p_.get("odds_now") is None:
            not_comparable.append(f"{w_id} contains {p_id}: a node has no odds")
            continue
        if fired(w) or fired(p_) or w["odds_now"] <= 1 or p_["odds_now"] <= 1:
            continue  # a settled node has no live curve, and a FIRED whole cannot be below its part
        wp, pp = curve_points(w), curve_points(p_)
        w_end, p_end = as_day(w.get("window_end"), end=True), as_day(p_.get("window_end"), end=True)
        checks = []  # (date, whole value, part value, how it was read)
        if wp and pp:
            lo, hi = max(wp[0][0], pp[0][0]), min(wp[-1][0], pp[-1][0])
            for d in sorted({x[0] for x in wp} | {x[0] for x in pp}):
                if lo <= d <= hi:
                    checks.append((d, curve_at(wp, d), curve_at(pp, d), "both curves"))
        elif wp and p_end is not None:
            checks.append((p_end, curve_at(wp, p_end), float(p_["odds_now"]), "the whole's curve at the part's deadline"))
        elif pp and w_end is not None:
            checks.append((w_end, float(w["odds_now"]), curve_at(pp, w_end), "the part's curve at the whole's deadline"))
        elif w_end is not None and p_end is not None and w_end >= p_end:
            checks.append((p_end, float(w["odds_now"]), float(p_["odds_now"]), "odds now"))
        if not checks:
            not_comparable.append(f"{w_id} contains {p_id}: no shared date (no curve, and the whole's deadline is earlier)")
            continue
        broken = [c for c in checks if c[1] < c[2] - slack]
        if broken:
            d, wv, pv, how = max(broken, key=lambda c: c[2] - c[1])
            more = f"; {len(broken)} shared dates broken, the widest shown" if len(broken) > 1 else ""
            items.append({"kind": "contains", "whole": w_id, "part": p_id, "whole_value": round(wv, 1),
                          "part_value": round(pv, 1), "date": d.isoformat(), "read": how, "dates_broken": len(broken),
                          "line": f"WARN contains {w_id} >= {p_id}: whole {wv:.1f} is below part {pv:.1f} at {d} "
                                  f"({how}{more}). {note}"})
    return items, not_comparable


def print_contradictions(g):
    """Print the CONTRADICTIONS list and its count. Returns the items. Also called by cascade.py after a real run."""
    items, not_comparable = contradictions(g)
    pairs = len(contains_rows(g)[0])
    print(f"CONTRADICTIONS (warn only; the exit code is not affected). NECESSARY links and {pairs} containment "
          f"pairs from meta.contains, compared like for like, {CONTRADICTION_SLACK:g} point of slack")
    for it in items:
        print("  " + it["line"])
    for line in not_comparable:
        print("  NOTE not compared: " + line)
    print(f"CONTRADICTIONS: {len(items)}")
    return items


def load_scorecard():
    """Load earth2/scorecard.py from beside this file. Without it the lock cannot be checked, so nothing runs."""
    import importlib.util
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scorecard.py")
    if not os.path.exists(path):
        raise SystemExit("EARTH2 IS LOCKED. earth2/scorecard.py is missing, so the scorecard lock cannot be checked. Restore it from git.")
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location("earth2_scorecard", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main(argv=None):
    p = argparse.ArgumentParser()
    p.add_argument("graph")
    p.add_argument("--against")
    p.add_argument("--json", action="store_true")
    a = p.parse_args(argv)
    sc = load_scorecard()
    with open(a.graph, encoding="utf-8") as f:
        g = json.load(f)
    # the lock: overdue questions stop everything (exit 3); other question problems are listed with the checks
    sc.enforce_lock(g, tool="validate_graph.py", block_on_problems=False)
    nodes, links = g["nodes"], g["links"]
    fails = []
    ids = [n["id"] for n in nodes]
    dup = [k for k, v in collections.Counter(ids).items() if v > 1]
    if dup:
        fails.append(f"duplicate node ids: {dup[:10]}")
    by = {n["id"]: n for n in nodes}
    pairs = collections.Counter()
    for i, e in enumerate(links):
        s, t = e.get("source"), e.get("target")
        if s not in by or t not in by:
            fails.append(f"link {i} {s}->{t}: unknown endpoint")
        if s == t:
            fails.append(f"link {i} {s}: self link")
        pairs[(s, t)] += 1
        if e.get("sign") not in (1, -1):
            fails.append(f"link {i} {s}->{t}: sign {e.get('sign')}")
        if e.get("kind") not in KINDS:
            fails.append(f"link {i} {s}->{t}: kind {e.get('kind')}")
        if e.get("display_only"):
            if not e.get("display_only_reason"):
                fails.append(f"link {i} {s}->{t}: display_only with no display_only_reason")
        else:
            st = e.get("strength")
            if not isinstance(st, (int, float)) or isinstance(st, bool) or not (0 < st <= 1):
                fails.append(f"link {i} {s}->{t}: strength {st!r} not in (0, 1]")
            if not isinstance(e.get("delay_days"), int) or isinstance(e.get("delay_days"), bool):
                fails.append(f"link {i} {s}->{t}: delay_days {e.get('delay_days')!r} not an integer")
    rep = [k for k, v in pairs.items() if v > 1]
    if rep:
        fails.append(f"repeated source-target pairs: {rep[:10]}")
    for n in nodes:
        o = n.get("odds_now")
        if o is not None and not (0 <= o <= 100):
            fails.append(f"{n['id']}: odds {o} outside 0..100")
        w = (n.get("window_start"), n.get("window_peak"), n.get("window_end"))
        if any(w):
            if not all(w) or not (w[0] <= w[1] <= w[2]):
                fails.append(f"{n['id']}: window out of order {w}")
        elif n.get("type") != "DRIVER":
            fails.append(f"{n['id']}: no window and not a driver")
        live = not fired(n)
        # kill conditions cover more than the main events: every END EVENT, board row and tree trigger with a board reference
        needs_kill = n.get("type") == "END EVENT" or n.get("model_layer") in ("board", "v5.1") or n.get("board_reference")
        if needs_kill and live and not (n.get("kill_condition") and n.get("kill_check")):
            fails.append(f"{n['id']}: no kill_condition or kill_check (needed on every live END EVENT, board row and tree trigger with a board reference)")
        if any(w) and live and n.get("date_state") not in STATES:
            fails.append(f"{n['id']}: date_state {n.get('date_state')!r}")
    for old, surv in aliases(g).items():
        if old in by:
            fails.append(f"alias {old} still exists as a node")
        if surv not in by and surv not in aliases(g):
            fails.append(f"alias {old} -> {surv}: survivor missing")
    for c in g.get("companies", []):
        for x in (c.get("event_nodes") or []) + (c.get("context_nodes") or []) + [s.get("node") for s in c.get("sits_on") or []]:
            if x not in by:
                fails.append(f"company {c.get('ticker')}: unknown node {x}")
    for ch in g.get("chains", []):
        for x in ch.get("legs", []):
            if x not in by:
                fails.append(f"chain {ch.get('name')}: unknown leg {x}")
    fails.extend(contains_rows(g)[1])
    if a.against:
        with open(a.against, encoding="utf-8") as f:
            old = {n["id"]: n.get("odds_now") for n in json.load(f)["nodes"]}
        moved = [k for k in by if k in old and by[k].get("odds_now") != old[k]]
        if moved:
            fails.append(f"odds changed against {a.against}: {moved[:20]}")

    sc_fails, sc_notes = sc.validator_checks(g, a.graph)
    fails.extend(sc_fails)

    # counts (verification_v5.1 families)
    live_links = [e for e in links if not e.get("display_only")]
    nec_bad = [(e["source"], e["target"]) for e in links if e.get("kind") == "NECESSARY" and not e.get("display_only")
               and by[e["source"]].get("odds_now") is not None and by[e["target"]].get("odds_now") is not None
               and not fired(by[e["source"]]) and by[e["source"]]["odds_now"] < by[e["target"]]["odds_now"]]
    arms = list(dict.fromkeys((g.get("meta", {}).get("arms") or []) + [n.get("arm") for n in nodes if n.get("arm")]))
    counts = {
        "totals": {"nodes": len(nodes), "event_nodes": sum(1 for n in nodes if n.get("type") != "DRIVER"),
                   "drivers": sum(1 for n in nodes if n.get("type") == "DRIVER"), "links": len(links),
                   "companies": len(g.get("companies", [])), "chains": len(g.get("chains", []))},
        "nodes_by_type": dict(collections.Counter(n.get("type") for n in nodes)),
        "nodes_by_arm": {arm: sum(1 for n in nodes if n.get("arm") == arm) for arm in arms},
        "arms_with_no_end_event": [arm for arm in arms if not any(n.get("arm") == arm and n.get("type") == "END EVENT" for n in nodes)],
        "links": {"cascade_links_with_strength": len(live_links),
                  "display_only": sum(1 for e in links if e.get("display_only")),
                  "display_only_by_reason": dict(collections.Counter((e.get("display_only_reason") or "").split(":")[0] for e in links if e.get("display_only"))),
                  "strength_estimated": sum(1 for e in live_links if e.get("estimated")),
                  "delay_estimated": sum(1 for e in live_links if e.get("delay_estimated")),
                  "by_kind": dict(collections.Counter(e.get("kind") for e in links)),
                  "lowering_links": sum(1 for e in links if e.get("sign") == -1),
                  "necessary_links_where_source_odds_below_target": len(nec_bad)},
        "companies": {"total": len(g.get("companies", [])),
                      "verified": sum(1 for c in g.get("companies", []) if c.get("verified")),
                      "collision_candidates": sum(1 for c in g.get("companies", []) if c.get("collision_candidate"))},
        "aliases": len(aliases(g)),
        "kill_conditions": sum(1 for n in nodes if n.get("kill_condition")),
        "date_state": dict(collections.Counter(n.get("date_state") for n in nodes if n.get("date_state"))),
        "peak_placeholder_true": sum(1 for n in nodes if n.get("peak_placeholder")),
        "fired_nodes": sum(1 for n in nodes if fired(n)),
        "main_events": sum(1 for n in nodes if sc.is_main_event(n)),
        "odds_stamp": g.get("meta", {}).get("odds_stamp"),
        "containment_pairs": len(contains_rows(g)[0]),
        "contradictions": len(contradictions(g)[0]),
    }
    if a.json:
        print(json.dumps(counts, indent=1, ensure_ascii=False))
    else:
        for k, v in counts.items():
            print(f"{k}: {v}")
    if not a.json:
        for note in sc_notes:
            print(note)
    if nec_bad:
        print(f"NOTE: {len(nec_bad)} NECESSARY links have a source less likely than its target (rule: a necessary "
              f"condition is at least as likely as the event it precedes): {nec_bad[:12]}")
    if not a.json:
        print()
        print_contradictions(g)
    if fails:
        print(f"\nFAILED {len(fails)} checks:")
        for x in fails[:200]:
            print("  - " + x)
        if len(fails) > 200:
            print(f"  ... and {len(fails) - 200} more")
        return 1
    print("\nALL CHECKS PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
