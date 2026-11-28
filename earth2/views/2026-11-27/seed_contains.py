#!/usr/bin/env python3
"""
seed_contains.py
Seed the containment pairs in the Earth2 graph: meta.contains. STRUCTURE ONLY. Python 3.8+, standard library only.

USAGE
  python3 seed_contains.py GRAPH.json [--repo REPO_ROOT] [--dry-run]

  GRAPH.json   the graph to change in place (normally REPO/public/future/earth2/graph.json)
  --repo       the repo root (default: four folders up from GRAPH.json). earth2/scorecard.py is loaded from
               there for the scorecard lock and the odds stamp.
  --dry-run    print what would be written, write nothing

WHAT IT WRITES
  meta.contains: a list of {"whole": id, "part": id, "note": "..."}. The whole happens whenever the part does,
  so the whole must be at least as likely as the part at every shared date. earth2/validate_graph.py and
  earth2/cascade.py read the list and print a WARN line for every pair that is broken (warn only).

  The pairs below are the "part of a whole" contradictions the Nov 25 rebase fixed by hand
  (earth2/views/2026-11-26/apply_rebase.py: CONTAIN, CURVE_FLOOR, D5_FLOOR and the 28-5 re-rate), plus 28-3 and
  C4, which the rebase looked at and did not fold. Each one is justified from the two nodes' labels and
  settlement tests; the note says how. Old ids resolve through the alias map.

SAFETY
  No odds_now is read into a write and none is changed. The script checks every node's odds_now and the odds
  stamp before and after, and refuses to write if either moved. It stops while the scorecard lock is on and
  refuses a graph whose odds stamp does not match. A pair already in the list is skipped, so a second run
  writes nothing. The change is noted in meta beside the other structure changes.
"""
import argparse
import datetime as dt
import importlib.util
import json
import os
import shutil
import sys
import tempfile

sys.dont_write_bytecode = True  # never leave __pycache__ inside the repo

# (whole, part, note). Direction: the whole happens whenever the part does.
PAIRS = [
    ("29-1", "C9",
     "29-1's test counts a physical or nationwide effect officially attributed to an AI-run attack, which is "
     "C9's event, or a military command compromise. Fixed by hand in the Nov 25 rebase (29-1 floor at Nov 2027)."),
    ("29-2", "D9",
     "29-2's test is D9's event (the Fed buys bonds or Treasury caps long-bond sales while inflation is above "
     "target) or an emergency facility. Nov 25 rebase containment pass."),
    ("29-2", "B4",
     "29-2's test counts an emergency facility for banks or credit funds, which covers B4 (emergency support "
     "to credit funds). Nov 25 rebase containment pass."),
    ("27-4", "F4",
     "27-4's test counts a rating agency cutting Oracle to junk, which is F4. Nov 25 rebase containment pass."),
    ("27-4", "MR4",
     "27-4's test counts a neocloud, miner-host or data-center vehicle with $1B+ of debt that defaults, does a "
     "distressed exchange or files, which covers MR4 (a GPU cloud or chip-backed borrower with $1B+ of debt "
     "defaults, restructures or files). Nov 25 rebase containment pass."),
    ("E07", "T1",
     "E07's test is T1's event (a Taiwan-bound ship boarded, or an outlying island isolated for 48 hours) or a "
     "quarantine, blockade or armed conflict. Small wording gap: T1's test also counts an attempted boarding. "
     "Nov 25 rebase containment pass."),
    ("E07", "T2",
     "E07's test counts a quarantine or blockade, which covers T2 (a full quarantine or blockade of Taiwan for "
     "more than 7 days). Nov 25 rebase containment pass."),
    ("E09", "W2",
     "E09's test is W2 (NY Fed recent-graduate unemployment at 6.0% or higher) or W3. Nov 25 rebase containment pass."),
    ("E09", "W3",
     "E09's test is W2 or W3 (office payrolls 200,000 or more below a year earlier while total payrolls are "
     "higher). Nov 25 rebase containment pass."),
    ("E31", "BB4",
     "E31's test names BB4's two legs: the RAS drug wins a pivotal trial in a second big tumor, or the "
     "personalized vaccine wins in lung. Nov 25 rebase containment pass."),
    ("D5", "HP11",
     "D5 is any government shutdown; HP11 is a shutdown of 5 days or more that begins Dec 12, 2026 to Jun 30, "
     "2027. D5's own test stops at Dec 12, so the pair is read on D5's curve at HP11's deadline. Fixed by hand "
     "in the Nov 25 rebase (D5 curve floor at Jun 30, 2027)."),
    ("BT6", "28-5",
     "28-5's test is BT6's event (authorities confirm a person or small group held a working agent or toxin and "
     "meant a mass attack) inside Jun 1, 2027 to Nov 30, 2028, so 28-5 cannot be above BT6's curve at Nov 30, "
     "2028. Fixed by hand in the Nov 25 rebase (28-5 40 to 37)."),
]


def load_module(path, name):
    if not os.path.exists(path):
        raise SystemExit(f"Cannot find {path}. Give --repo REPO_ROOT.")
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def write_graph(g, target):
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


def main(argv=None):
    p = argparse.ArgumentParser(description="Seed meta.contains in the Earth2 graph. Structure only.")
    p.add_argument("graph")
    p.add_argument("--repo")
    p.add_argument("--dry-run", action="store_true")
    a = p.parse_args(argv)
    repo = a.repo or os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(a.graph)))))
    sc = load_module(os.path.join(repo, "earth2", "scorecard.py"), "earth2_scorecard")
    with open(a.graph, encoding="utf-8") as f:
        g = json.load(f)
    sc.enforce_lock(g, tool="seed_contains.py")
    issue = sc.stamp_problem(g)
    if issue:
        raise SystemExit("SEED REFUSED. " + issue)

    nodes = {n["id"]: n for n in g["nodes"]}
    aliases = sc.alias_map(g)
    odds_before = {n["id"]: n.get("odds_now") for n in g["nodes"]}
    stamp_before = sc.odds_stamp(g["nodes"])
    meta = g.setdefault("meta", {})
    if not isinstance(meta.get("contains", []), list):
        raise SystemExit("meta.contains is there but is not a list. Fix it by hand first.")
    have = list(meta.get("contains", []))
    known = set()
    for row in have:
        if isinstance(row, dict):
            known.add((sc.resolve(str(row.get("whole")), nodes, aliases), sc.resolve(str(row.get("part")), nodes, aliases)))
    added, errs = [], []
    for whole, part, note in PAIRS:
        w, p_ = sc.resolve(whole, nodes, aliases), sc.resolve(part, nodes, aliases)
        if w is None or p_ is None:
            errs.append(f"{whole} contains {part}: {whole if w is None else part} is not a node in the graph")
            continue
        for old, new in ((whole, w), (part, p_)):
            if old != new:
                print(f"NOTICE: '{old}' was folded into '{new}'; using {new}.")
        if w == p_:
            errs.append(f"{whole} contains {part}: both are now the node {w}")
            continue
        if (w, p_) in known:
            print(f"  already there: {w} contains {p_}")
            continue
        if (p_, w) in known:
            errs.append(f"{w} contains {p_}: the list already holds the pair the other way round")
            continue
        known.add((w, p_))
        added.append({"whole": w, "part": p_, "note": note})
        print(f"  add: {w} contains {p_}   ({nodes[w].get('odds_now')} vs {nodes[p_].get('odds_now')} odds now)")
    if errs:
        print("SEED REFUSED. Nothing was written.")
        for e in errs:
            print("  - " + e)
        return 2
    print(f"SEED CONTAINS: {len(added)} pairs to add, {len(PAIRS) - len(added)} already there, "
          f"{len(have) + len(added)} in the list after.")
    if not added:
        print("Nothing to add. Nothing written.")
        return 0
    meta["contains"] = have + added
    key = str(meta.get("version") or "v").replace(".", "_") + "_changes"
    if not isinstance(meta.get(key), list):
        meta[key] = []
    t = sc.today()
    meta[key].append(
        f"{t.strftime('%b')} {t.day}, {t.year}: meta.contains seeded with {len(added)} containment pairs (the whole "
        f"happens whenever the part does), structure only, no odds moved: "
        + ", ".join(f"{r['whole']} contains {r['part']}" for r in added)
        + ". validate_graph.py and cascade.py print a WARN when a whole reads below its part.")
    stamp_after = sc.odds_stamp(g["nodes"])
    if {n["id"]: n.get("odds_now") for n in g["nodes"]} != odds_before or stamp_after != stamp_before \
            or meta.get("odds_stamp") != stamp_before:
        raise SystemExit("Refusing to write: an odds value or the odds stamp would change. This script writes structure only.")
    print(f"ODDS STAMP before {stamp_before}, after {stamp_after}: unchanged. odds_now unchanged on all {len(odds_before)} nodes.")
    if a.dry_run:
        print("DRY RUN: nothing written.")
        return 0
    write_graph(g, a.graph)
    print(f"WROTE {a.graph}  (structure only)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
