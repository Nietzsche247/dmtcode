#!/usr/bin/env python3
"""
earth2/validate_graph.py
Structural checks and counts for the Earth2 graph. Python 3.8+, standard library only. Read only.

USAGE
  python3 earth2/validate_graph.py public/future/earth2/graph.json [--against OLD.json] [--json]

  --against OLD.json   also check that odds_now is unchanged on every node both files share
  --json               print the counts as JSON (the same families of counts as verification_v5.1.json)

Exit code 0 when every check passes, 1 otherwise, 3 when the scorecard lock is on.

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
  board reference; date_state (LOCKED, SCHEDULED, ESTIMATED) on every live node with a window.

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
import collections
import json
import os
import sys

KINDS = {"NECESSARY", "LIKELY", "MAGNIFIES", "OPPOSES"}
STATES = {"LOCKED", "SCHEDULED", "ESTIMATED"}


def fired(n):
    return str(n.get("status", "")).upper().startswith("FIRED") or n.get("odds_now") == 100


def aliases(g):
    out = {}
    for m in g.get("merges", []) or []:
        for old, v in (m.get("alias_map") or {}).items():
            out[old] = v["survivor"] if isinstance(v, dict) else v
    return out


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
