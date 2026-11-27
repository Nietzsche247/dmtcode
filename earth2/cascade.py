#!/usr/bin/env python3
"""
earth2/cascade.py
Push a real, dated event through the Earth2 graph and list the collisions it opens up.
Python 3.8+, standard library only.

USAGE
  python3 earth2/cascade.py GRAPH.json --set F2=42 --date 2026-11-22 \
      --reason "CoreWeave default insurance 1,232.6 bp; $4B loan still not launched" --source "board read 2"

  python3 earth2/cascade.py GRAPH.json --updates updates.json

  updates.json is a list:
    [{"id": "F2", "new_odds": 42, "date": "2026-11-22", "reason": "...", "source": "..."}]
  Every update needs an id, new_odds (percent), a date and a reason. Odds move on real, dated
  events only, never on a price swing by itself (rule 10). new_odds 100 means the event FIRED.

OPTIONS
  --out PATH          where to write the updated graph (default: overwrite GRAPH.json)
  --dry-run           print what would move, write nothing
  --max-hops 4        how far a move travels
  --fade 0.5          multiplier per hop after the first
  --collision-days 120  how close two windows must be to count as a collision
  --report PATH       also write this run's log entry to its own JSON file
  --collisions        list the standing collisions (every arm counted) and stop if no update is given
  --restamp --reason "..."   reset the odds stamp by hand after a real repair; the reason goes into cascade_log
  --rebase            the one-time level correction: see THE REBASE below

THE REBASE (one time only)
  python3 earth2/cascade.py GRAPH.json --rebase --updates updates.json
  A rebase corrects levels; it is not news. It forces max hops to 0 (nothing cascades), reads its re-rates from
  --updates FILE only (no --set, no --reason, no --date: every row carries its own date, a reason that starts
  with "REBASE" and a source), writes no collisions queue, leaves each node's status as it was, and tags its
  cascade_log entry "kind": "rebase". It refuses to run if cascade_log already holds a rebase entry.

THE SCORECARD LOCK (earth2/scorecard.py)
  Every mode of this script stops, with the list and the commands to fix it, while any scorecard question
  is past due and not answered, or while earth2/scorecard/questions.json fails its checks. Run
  python3 earth2/scorecard.py due first. No flag and no environment variable skips this.

THE ODDS STAMP
  meta.odds_stamp is a short hash of every node's odds_now. A real run restamps the graph. If the stamp does
  not match the odds, someone edited odds outside this engine, and this script refuses to run until the
  edit is undone or recorded with --restamp --reason "...". validate_graph.py and the page check the same stamp.

CORRECTED ODDS
  For a main event with judgment_tags, the run also prints corrected odds: raw odds_now minus the mean signed
  error of its active tags (a tag is active at 10 answers), held between 1 and 99. Printed only. odds_now is
  never overwritten with a corrected number; the raw number is what keeps getting scored.

OLD IDS (folded duplicates)
  When two ids were the same real event, the copy was folded into the survivor and recorded in
  graph["merges"] as an alias_map (old id -> survivor). An update that names an old id is applied to
  its survivor, with a one-line NOTICE, so saved prompts keep working. Example: E16 -> D4.

THE RULE (same rule the page runs live)
  A node set by hand moves by d = new - old (percentage points).
  Its effect spreads along every outgoing link that has a strength:
      change at the target = d x strength x sign          (hop 1)
      each further hop is multiplied by the fade (0.5)    (hop 2 = half, hop 3 = a quarter ...)
  At most 4 hops. Each node is visited once per run (the first wave that reaches it), so loops
  cannot run forever. Contributions that reach a node in the same wave are added.
  Odds are clamped to 1..99. FIRED nodes (status FIRED or odds 100) are pinned: a cascade never
  moves them and a path stops there. Nodes set by hand are pinned for the run.
  An effect is dropped if it would land (run date + summed delay_days) after the target's
  window_end, because a closed window cannot move.
  Links with no strength are display only and never carry a move.

COLLISIONS (rule 8), listed after every run
  A node counts only if it rose 3 or more points this run, sat under 90 before the move, and is neither FIRED
  (before or after the move) nor dated SCHEDULED (a known release or meeting is a calendar, not a collision).
  (a) a counted node pushed by two or more different arms
  (b) two counted nodes from different arms whose windows overlap or sit within 120 days
  (c) a company that sits on two or more counted nodes
  Each is scored: joint odds x number of arms pushing x unpriced share, where a node's unpriced share is
  1 - odds/100 after the move (averaged over the nodes in the item), so a move that is already priced near
  certain weighs little. Where a node carries a like-for-like market (node "market"), its unpriced share is the
  measured gap |ours - market| / 100 instead, so the queue ranks by the gap wherever a market exists. Ties go to the shortest window. The top 5 is THE NEXT COLLISIONS QUEUE.

STANDING COLLISIONS (every arm counted; no arm list is written into this file)
  A live node pushed by links that carry a move from two or more different arms, where each pushing
  node's window overlaps the target's window or sits within --collision-days (120) of it. The arms are
  read from meta.arms plus every arm found on a node, so a new arm is counted the day it is added.
"""

import argparse
import calendar
import datetime as dt
import json
import os
import shutil
import sys
import tempfile

ODDS_MIN, ODDS_MAX = 1.0, 99.0
MIN_STEP = 0.01
COLLISION_MIN_RISE = 3.0     # points a node must rise this run to count in a collision
COLLISION_MAX_BEFORE = 90.0  # a node at 90 or more before the move is already priced
COLLISION_RULE = ("a node counts if it rose 3+ points this run, sat under 90 before the move, and is not FIRED or "
                  "SCHEDULED; score = joint odds x arms x unpriced share (the gap to a like-for-like market where one exists, else 1 - odds/100 after the move; averaged)")


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


def write_graph(g, target):
    folder = os.path.dirname(os.path.abspath(target))
    fd, tmp = tempfile.mkstemp(dir=folder, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(g, f, indent=1, ensure_ascii=False)
        if os.path.exists(target):
            shutil.copymode(target, tmp)
        else:
            os.chmod(tmp, 0o644)
        os.replace(tmp, target)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def restamp(sc, g, a):
    """--restamp: reset meta.odds_stamp by hand and log why. The scorecard lock has already passed."""
    if a.set or a.updates:
        raise SystemExit("--restamp runs alone. Do not combine it with --set or --updates.")
    if not (a.reason or "").strip():
        raise SystemExit('--restamp needs --reason "why the odds changed outside the engine". The reason is logged.')
    have = (g.get("meta") or {}).get("odds_stamp")
    want = sc.odds_stamp(g["nodes"])
    if have == want:
        print(f"ODDS STAMP {have} already matches the odds. Nothing written.")
        return 0
    off = sc.odds_off_history(g)
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
    entry = {"date": sc.today().isoformat(), "run_at": now.isoformat(), "kind": "restamp",
             "reason": a.reason.strip(), "source": a.source or "", "stamp_before": have, "stamp_after": want,
             "odds_not_matching_history": off, "trigger": [], "moved": [], "skipped": [], "queue": []}
    print(f"ODDS STAMP reset by hand: {have or 'none'} -> {want}")
    print(f"  reason: {entry['reason']}")
    if off:
        print(f"  nodes whose odds_now does not match their last odds_history row: {', '.join(off[:30])}")
    if a.dry_run:
        print("DRY RUN: nothing written.")
        return 0
    g.setdefault("meta", {})["odds_stamp"] = want
    g["cascade_log"].append(entry)
    target = a.out or a.graph
    write_graph(g, target)
    print(f"WROTE {target}  (the reset is in cascade_log, entry {len(g['cascade_log'])})")
    return 0


def parse_date(value, end=False):
    if value in (None, ""):
        return None
    s = str(value).strip()
    if len(s) == 7:
        y, m = int(s[:4]), int(s[5:7])
        return dt.date(y, m, calendar.monthrange(y, m)[1] if end else 1)
    return dt.date.fromisoformat(s[:10])


def is_fired(n):
    return str(n.get("status", "")).upper().startswith("FIRED") or n.get("odds_now") == 100


def load(path):
    with open(path, encoding="utf-8") as f:
        g = json.load(f)
    links = g.get("links") if "links" in g else g.get("edges")
    if not isinstance(g, dict) or "nodes" not in g or links is None:
        raise SystemExit("Graph JSON needs 'nodes' and 'links'.")
    nodes = {n["id"]: n for n in g["nodes"]}
    bad = []
    for i, e in enumerate(links):
        if e.get("source") not in nodes or e.get("target") not in nodes:
            bad.append(f"link {i} {e.get('source')}->{e.get('target')}: unknown node")
        s = e.get("strength")
        if s is not None and not (0 <= s <= 1):
            bad.append(f"link {i}: strength {s} outside 0..1")
    if bad:
        raise SystemExit("Graph check failed:\n  " + "\n  ".join(bad[:30]))
    g.setdefault("cascade_log", [])
    return g, nodes, links


def alias_map(g):
    """old id -> (survivor id, reason, date), from every merges entry that carries an alias_map, plus the
    deep-dive ids mapped onto existing nodes (nodes_mapped_to_v5)."""
    out = {}
    for m in g.get("merges", []) or []:
        for old, v in (m.get("alias_map") or {}).items():
            if isinstance(v, dict):
                out[old] = (v.get("survivor"), v.get("reason", ""), v.get("date", m.get("date", "")))
            else:
                out[old] = (v, "", m.get("date", ""))
        for x in m.get("nodes_mapped_to_v5", []) or []:
            if x.get("deepdive_id") and x.get("v5_id"):
                out.setdefault(x["deepdive_id"], (x["v5_id"], x.get("reason", ""), m.get("date", "")))
    return out


def resolve_id(nid, nodes, aliases):
    """Follow the alias chain from an old id to a node that exists. Returns (id, notice or None)."""
    seen, cur = [], nid
    while cur not in nodes and cur in aliases and cur not in seen:
        seen.append(cur)
        cur = aliases[cur][0]
    if cur == nid:
        return nid, None
    if cur not in nodes:
        return nid, None
    first = aliases[nid]
    why = (first[1] or "").split(":")[0]
    return cur, f"NOTICE: '{nid}' was folded into '{cur}' on {first[2] or 'an earlier merge'} ({why}); applying the update to {cur}."


def read_updates(args, nodes, aliases=None):
    raw = []
    for item in args.set or []:
        nid, val = item.split("=", 1)
        raw.append({"id": nid.strip(), "new_odds": val.strip().rstrip("%"), "date": args.date,
                    "reason": args.reason, "source": args.source})
    if args.updates:
        with open(args.updates, encoding="utf-8") as f:
            raw.extend(json.load(f))
    if not raw:
        raise SystemExit("Nothing to do. Give --set ID=ODDS (with --date and --reason) or --updates FILE.")
    out = {}
    aliases = aliases or {}
    for u in raw:
        nid = str(u.get("id", "")).strip()
        if nid not in nodes:
            nid2, notice = resolve_id(nid, nodes, aliases)
            if notice:
                print(notice)
                nid = nid2
        if nid not in nodes:
            near = [k for k in nodes if k.lower().startswith(nid.lower()[:2])][:8]
            raise SystemExit(f"Unknown id '{nid}'. Close: {near}")
        if nodes[nid].get("odds_now") is None:
            raise SystemExit(f"'{nid}' has no odds (it is a driver or a number call).")
        if not u.get("date") or not u.get("reason"):
            raise SystemExit(f"'{nid}': every update needs a date and a reason (odds move on real, dated events only).")
        v = float(u["new_odds"])
        if not 0 <= v <= 100:
            raise SystemExit(f"'{nid}': odds must be 0..100")
        if nid in out and out[nid]["new"] != v:
            raise SystemExit(f"'{nid}' is set twice with different odds ({out[nid]['new']} and {v}); an old id may resolve to it.")
        out[nid] = {"new": v, "date": str(u["date"]), "reason": u["reason"], "source": u.get("source") or ""}
    return out


def cascade(nodes, links, deltas, run_date, max_hops, fade):
    out = {}
    for e in links:
        if e.get("strength") is None or e.get("display_only"):
            continue
        out.setdefault(e["source"], []).append(e)
    reached = set(deltas)
    frontier = {k: v for k, v in deltas.items() if v != 0}
    delay_at = {k: 0 for k in frontier}
    path_at = {k: (k,) for k in frontier}
    totals, routes, pushers, skipped = {}, {}, {}, {}
    stats = {"links_used": 0, "blocked_fired_or_hand_set": 0, "dropped_window_closed": 0, "dropped_tiny": 0, "cut_at_hop_limit": 0}
    for hop in range(1, max_hops + 1):
        incoming = {}
        for u, du in frontier.items():
            for e in out.get(u, []):
                v = e["target"]
                if v in reached:
                    if v in deltas:
                        stats["blocked_fired_or_hand_set"] += 1
                    continue
                if is_fired(nodes[v]):
                    stats["blocked_fired_or_hand_set"] += 1
                    continue
                if nodes[v].get("odds_now") is None:
                    continue
                # du already carries the fade of earlier hops, so each hop after the first multiplies by fade once
                step = du * float(e["strength"]) * int(e.get("sign", 1)) * (fade if hop > 1 else 1.0)
                if abs(step) < MIN_STEP:
                    stats["dropped_tiny"] += 1
                    continue
                arrive_days = delay_at[u] + int(e.get("delay_days") or 0)
                arrival = run_date + dt.timedelta(days=arrive_days)
                w_end = parse_date(nodes[v].get("window_end"), end=True)
                if w_end is not None and arrival > w_end:
                    stats["dropped_window_closed"] += 1
                    skipped.setdefault(v, f"effect would land {arrival} after its window closes {w_end}")
                    continue
                stats["links_used"] += 1
                incoming[v] = incoming.get(v, 0.0) + step
                routes.setdefault(v, []).append((step, path_at[u] + (v,), arrival))
                pushers.setdefault(v, set()).add(nodes[u].get("arm"))
                if v not in delay_at or arrive_days < delay_at[v]:
                    delay_at[v] = arrive_days
                path_at[v] = max(routes[v], key=lambda t: abs(t[0]))[1]
        if hop == max_hops:
            stats["cut_at_hop_limit"] = sum(1 for v in incoming if out.get(v))
        reached.update(incoming)
        totals.update(incoming)
        frontier = incoming
        if not frontier:
            break
    return totals, routes, pushers, skipped, stats


def window_gap(a, b):
    a0, a1 = parse_date(a.get("window_start")), parse_date(a.get("window_end"), end=True)
    b0, b1 = parse_date(b.get("window_start")), parse_date(b.get("window_end"), end=True)
    if None in (a0, a1, b0, b1):
        return None
    return max(0, (max(a0, b0) - min(a1, b1)).days)


def collision_counts(n, rise, after_odds):
    """A node counts toward a collision only if it rose 3+ points this run, sat under 90 before the move, is not
    FIRED (before or after the move) and is not dated SCHEDULED. n is the node as it was before the move."""
    before = float(n.get("odds_now") or 0)
    return (rise >= COLLISION_MIN_RISE and before < COLLISION_MAX_BEFORE and not is_fired(n) and after_odds < 100
            and str(n.get("date_state") or "").upper() != "SCHEDULED")


def unpriced(after_odds, node=None):
    """The share of the event not yet priced in. Where the node carries a like-for-like market (node["market"],
    written by scorecard.py import-seed), it is the measured gap |ours - market| / 100, so the queue ranks by the
    gap wherever one exists. Elsewhere it is the proxy 1 - odds/100 after the move."""
    m = (node or {}).get("market") or {}
    if isinstance(m.get("odds"), (int, float)):
        return abs(float(after_odds) - float(m["odds"])) / 100.0
    return max(0.0, 1.0 - float(after_odds) / 100.0)


def market_gap(node, after_odds):
    m = (node or {}).get("market") or {}
    return round(float(after_odds) - float(m["odds"]), 1) if isinstance(m.get("odds"), (int, float)) else None


def collisions(nodes, companies, rose, after, pushers, limit_days):
    far = dt.date(2100, 1, 1)
    end_of = lambda nid: parse_date(nodes[nid].get("window_end"), end=True) or far
    counted = {nid: r for nid, r in rose.items() if collision_counts(nodes[nid], r, after[nid])}
    items = []
    for nid, arms in pushers.items():
        arms = {a for a in arms if a}
        if nid in counted and len(arms) >= 2:
            u = unpriced(after[nid], nodes[nid])
            items.append({"kind": "a", "what": f"{nid} rose {rose[nid]:+.1f}, pushed by {len(arms)} arms", "nodes": [nid],
                          "arms": sorted(arms), "joint_odds": round(after[nid], 1), "unpriced": round(u, 3),
                          "score": round(after[nid] / 100 * len(arms) * u, 3), "window_end": end_of(nid).isoformat()})
    ids = sorted(counted)
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            a, b = nodes[ids[i]], nodes[ids[j]]
            if (a.get("arm") or "") == (b.get("arm") or ""):
                continue
            gap = window_gap(a, b)
            if gap is None or gap > limit_days:
                continue
            joint = after[a["id"]] / 100 * after[b["id"]] / 100
            u = (unpriced(after[a["id"]], a) + unpriced(after[b["id"]], b)) / 2
            shared = sorted(set(a.get("layers_hit") or []) & set(b.get("layers_hit") or []))
            items.append({"kind": "b", "what": f"{a['id']} ({rose[a['id']]:+.1f}) x {b['id']} ({rose[b['id']]:+.1f})" + (f", same layer: {', '.join(shared)}" if shared else ""),
                          "nodes": [a["id"], b["id"]], "arms": sorted({a.get("arm"), b.get("arm")}),
                          "gap_days": gap, "shared_layers": shared, "joint_odds": round(joint * 100, 1),
                          "unpriced": round(u, 3), "score": round(joint * 2 * u, 3),
                          "window_end": min(end_of(a["id"]), end_of(b["id"])).isoformat()})
    for co in companies or []:
        on = [x for x in co.get("event_nodes", []) if x in counted]
        if len(on) >= 2:
            top = sorted(on, key=lambda x: -after[x])[:2]
            joint = after[top[0]] / 100 * after[top[1]] / 100
            u = sum(unpriced(after[x], nodes[x]) for x in on) / len(on)
            arms = sorted({nodes[x].get("arm") for x in on})
            items.append({"kind": "c", "what": f"{co['ticker']} sits on {len(on)} risen nodes: {', '.join(on)}",
                          "nodes": on, "company": co["ticker"], "arms": arms, "joint_odds": round(joint * 100, 1),
                          "unpriced": round(u, 3), "score": round(joint * len(arms) * u, 3),
                          "window_end": min(end_of(x) for x in on).isoformat(),
                          "listed_options": co.get("listed_options"), "verified": co.get("verified")})
    for h in items:
        gaps = {x: market_gap(nodes[x], after[x]) for x in h["nodes"]}
        gaps = {x: v for x, v in gaps.items() if v is not None}
        if gaps:
            h["market_gap"] = gaps
            h["what"] += " [market gap " + ", ".join(f"{x} {v:+.1f}" for x, v in gaps.items()) + "]"
    items.sort(key=lambda h: (-h["score"], h["window_end"]))
    return items


def all_arms(g):
    """Every arm in the data: meta.arms first, then any arm found on a node. Nothing hardcoded."""
    arms = list((g.get("meta") or {}).get("arms") or [])
    for n in g["nodes"]:
        a = n.get("arm")
        if a and a not in arms:
            arms.append(a)
    return arms


def standing_collisions(g, nodes, links, limit_days, today):
    """Live nodes pushed by two or more arms whose windows overlap or sit within limit_days."""
    pushers = {}
    for e in links:
        if e.get("display_only") or e.get("strength") is None:
            continue
        u, v = nodes[e["source"]], nodes[e["target"]]
        if u.get("odds_now") is None or v.get("odds_now") is None or is_fired(v) or is_fired(u):
            continue
        end_v = parse_date(v.get("window_end"), end=True)
        if end_v is not None and end_v < today:
            continue
        gap = window_gap(u, v)
        if gap is None or gap > limit_days:
            continue
        pushers.setdefault(v["id"], {}).setdefault(u.get("arm"), []).append(u["id"])
    items = []
    far = dt.date(2100, 1, 1)
    for nid, by_arm in pushers.items():
        arms = sorted(a for a in by_arm if a)
        if len(arms) < 2:
            continue
        n = nodes[nid]
        items.append({"node": nid, "label": n.get("label"), "arm": n.get("arm"), "odds": n.get("odds_now"),
                      "arms": arms, "n_arms": len(arms), "pushers": {a: sorted(by_arm[a]) for a in arms},
                      "window_end": (parse_date(n.get("window_end"), end=True) or far).isoformat(),
                      "score": round((n.get("odds_now") or 0) / 100 * len(arms), 3)})
    items.sort(key=lambda h: (-h["score"], h["window_end"]))
    per_arm = {a: 0 for a in all_arms(g)}
    for it in items:
        for a in set(it["arms"]) | {it["arm"]}:
            if a:
                per_arm[a] = per_arm.get(a, 0) + 1
    return items, per_arm


def print_standing(g, nodes, links, limit_days, today, top=15):
    items, per_arm = standing_collisions(g, nodes, links, limit_days, today)
    print(f"STANDING COLLISIONS {today}: {len(items)} nodes pushed by 2+ arms (windows within {limit_days} days)")
    for i, c in enumerate(items[:top], 1):
        print(f"  {i}. {c['node']} ({c['arm']}, {c['odds']}%) pushed by {c['n_arms']} arms: "
              + "; ".join(f"{a}: {', '.join(p)}" for a, p in c["pushers"].items()))
    print("  ARMS IN STANDING COLLISIONS (every arm in the data): "
          + ", ".join(f"{a} {k}" for a, k in per_arm.items()))
    return items, per_arm


def main(argv=None):
    p = argparse.ArgumentParser(description="Cascade a real, dated event through the Earth2 graph.")
    p.add_argument("graph")
    p.add_argument("--set", action="append", metavar="ID=ODDS")
    p.add_argument("--date")
    p.add_argument("--reason")
    p.add_argument("--source", default="")
    p.add_argument("--updates")
    p.add_argument("--out")
    p.add_argument("--report")
    p.add_argument("--max-hops", type=int, default=4)
    p.add_argument("--fade", type=float, default=0.5)
    p.add_argument("--collision-days", type=int, default=120)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--collisions", action="store_true")
    p.add_argument("--restamp", action="store_true")
    p.add_argument("--rebase", action="store_true")
    a = p.parse_args(argv)

    sc = load_scorecard()
    g, nodes, links = load(a.graph)
    sc.enforce_lock(g, tool="cascade.py")  # every mode; exits 3 while a question is overdue
    if a.restamp:
        return restamp(sc, g, a)
    stamp_issue = sc.stamp_problem(g, a.graph)
    if stamp_issue:
        print("CASCADE REFUSED. " + stamp_issue)
        return 4
    if a.rebase:
        why = []
        if a.set:
            why.append("--rebase reads its re-rates from --updates FILE only; --set is refused.")
        if a.reason or a.date:
            why.append("--rebase takes no --reason or --date: every row in the updates file carries its own date, reason and source.")
        if not a.updates:
            why.append("--rebase needs --updates FILE.")
        done = [(i + 1, e.get("date")) for i, e in enumerate(g["cascade_log"]) if e.get("kind") == "rebase"]
        if done:
            why.append(f"cascade_log already holds a rebase entry (entry {done[0][0]}, {done[0][1]}). The rebase runs once.")
        if why:
            print("REBASE REFUSED. " + " ".join(why))
            return 5
        if a.max_hops != 0:
            print(f"REBASE: max hops forced to 0 (was {a.max_hops}). A rebase corrects levels; it does not cascade.")
        a.max_hops = 0
    if a.collisions and not (a.set or a.updates):
        today = parse_date(a.date) if a.date else dt.date.today()
        print_standing(g, nodes, links, a.collision_days, today)
        return 0
    ups = read_updates(a, nodes, alias_map(g))
    if a.rebase:
        bad = [k for k, u in ups.items() if not str(u["reason"]).startswith("REBASE") or not str(u["source"]).strip()]
        if bad:
            print("REBASE REFUSED. Every row needs a reason that starts with 'REBASE' and a source: " + ", ".join(bad))
            return 5
    run_date = max(parse_date(u["date"]) for u in ups.values())
    deltas = {k: u["new"] - float(nodes[k]["odds_now"]) for k, u in ups.items()}
    totals, routes, pushers, skipped, stats = cascade(nodes, links, deltas, run_date, a.max_hops, a.fade)

    moved, rose, after = [], {}, {}
    for nid, u in ups.items():
        before = float(nodes[nid]["odds_now"])
        new = u["new"] if u["new"] == 100 else min(ODDS_MAX, max(ODDS_MIN, u["new"]))
        moved.append({"id": nid, "label": nodes[nid].get("label"), "arm": nodes[nid].get("arm"), "before": round(before, 1),
                      "after": round(new, 1), "delta": round(new - before, 1), "role": "set by hand",
                      "reason": u["reason"], "source": u["source"], "date": u["date"]})
        after[nid] = new
        if new > before:
            rose[nid] = new - before
            pushers.setdefault(nid, set()).add(nodes[nid].get("arm"))
    for nid, tot in sorted(totals.items(), key=lambda kv: -abs(kv[1])):
        before = float(nodes[nid]["odds_now"])
        raw = before + tot
        new = round(min(ODDS_MAX, max(ODDS_MIN, raw)), 1)
        if abs(new - before) < 0.05:
            continue
        top = sorted(routes[nid], key=lambda t: -abs(t[0]))[:3]
        moved.append({"id": nid, "label": nodes[nid].get("label"), "arm": nodes[nid].get("arm"), "before": round(before, 1),
                      "after": new, "delta": round(new - before, 1), "role": "cascade", "clamped": not (ODDS_MIN <= raw <= ODDS_MAX),
                      "first_arrival": min(t[2] for t in top).isoformat(),
                      "paths": [{"path": " > ".join(t[1]), "points": round(t[0], 2)} for t in top]})
        after[nid] = new
        if new > before:
            rose[nid] = new - before
    for nid in list(skipped):
        if nid in totals:
            del skipped[nid]
    # a rebase corrects levels, so its moves are not collisions
    coll = [] if a.rebase else collisions(nodes, g.get("companies"), rose, after, pushers, a.collision_days)
    queue = coll[:5]

    entry = {"date": run_date.isoformat(), "run_at": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
             "trigger": [{"id": k, "before": float(nodes[k]["odds_now"]), "after": u["new"], "date": u["date"],
                          "reason": u["reason"], "source": u["source"]} for k, u in ups.items()],
             "rule": {"move": "d x strength x sign", "fade": a.fade, "max_hops": a.max_hops, "visit": "once per run",
                      "clamp": [ODDS_MIN, ODDS_MAX], "fired_pinned": True, "collision_days": a.collision_days,
                      "collision_rule": COLLISION_RULE},
             "moved": moved, "skipped": [{"id": k, "reason": v} for k, v in sorted(skipped.items())], "stats": stats,
             "collisions": {"a_multi_arm_nodes": [c for c in coll if c["kind"] == "a"],
                            "b_cross_arm_pairs": [c for c in coll if c["kind"] == "b"][:40],
                            "c_companies": [c for c in coll if c["kind"] == "c"]},
             "queue": queue}
    if a.rebase:
        entry = {"kind": "rebase", **entry}
        entry["rule"]["collision_rule"] = "none: a rebase corrects levels and is not news, so it opens no collisions"

    print(f"EARTH2 {'REBASE' if a.rebase else 'CASCADE'}  {entry['date']}  hops {a.max_hops}  fade {a.fade}")
    for t in entry["trigger"]:
        print(f"SET {t['id']} {t['before']} -> {t['after']}  ({t['date']}) {t['reason']}")
    print(f"\n{'ID':<14}{'ARM':<24}{'BEFORE':>7}{'AFTER':>7}{'MOVE':>7}  HOW")
    for m in moved:
        how = m["role"] if m["role"] != "cascade" else m["paths"][0]["path"]
        print(f"{m['id']:<14}{(m['arm'] or '')[:23]:<24}{m['before']:>7.1f}{m['after']:>7.1f}{m['delta']:>+7.1f}  {how}")
    print(f"\nLINKS USED {stats['links_used']}, closed windows {stats['dropped_window_closed']}, "
          f"blocked at fired or hand-set nodes {stats['blocked_fired_or_hand_set']}, too small {stats['dropped_tiny']}")
    print("\nTHE NEXT COLLISIONS QUEUE" + ("  (none: a rebase opens no collisions)" if a.rebase else f"  ({COLLISION_RULE})"))
    for i, c in enumerate(queue, 1):
        print(f"  {i}. [{c['kind']}] {c['what']}  arms: {', '.join(c['arms'])}  joint {c['joint_odds']}%  score {c['score']}  window ends {c['window_end']}")
    run_arms = {x: 0 for x in all_arms(g)}
    for c in coll:
        for x in c["arms"]:
            if x:
                run_arms[x] = run_arms.get(x, 0) + 1
    entry["collisions"]["per_arm"] = run_arms
    print("ARMS IN THIS RUN'S COLLISIONS (every arm in the data): " + ", ".join(f"{x} {k}" for x, k in run_arms.items()))
    tag_stats = sc.live_tag_stats()
    mains = [m for m in moved if sc.is_main_event(nodes[m["id"]])]
    if mains:
        print("\nCORRECTED ODDS (main events that moved; raw odds are what is stored and scored)")
        shown = 0
        for m in mains:
            fixed = sc.corrected_odds(dict(nodes[m["id"]], odds_now=m["after"]), tag_stats)
            if fixed:
                shown += 1
                print(f"  {m['id']:<12} raw {m['after']:>5.1f}  corrected {fixed[0]:>5.1f}  ("
                      + ", ".join(f"{t} {e:+.1f}" for t, e in fixed[1]) + " points off)")
        if not shown:
            print(f"  none: no judgment tag on these events has {sc.MIN_N} answers yet")
    if a.collisions:
        print()
        print_standing(g, nodes, links, a.collision_days, run_date)
    if a.report:
        with open(a.report, "w", encoding="utf-8") as f:
            json.dump(entry, f, indent=1, ensure_ascii=False)
    if a.dry_run:
        print("\nDRY RUN: nothing written.")
        return 0

    for m in moved:
        n = nodes[m["id"]]
        n["odds_now"] = m["after"]
        n["odds_as_of"] = run_date.isoformat()
        n.setdefault("odds_history", []).append({"date": run_date.isoformat(), "odds": m["after"],
                                                 "note": (m.get("reason") or "") if m["role"] == "set by hand" else "cascade from " + ", ".join(ups)})
        if m["role"] == "set by hand" and not a.rebase:  # a rebase leaves status as it was: a level correction is not news
            if m["after"] == 100:
                n["status"] = "FIRED " + m["date"]
            elif m["delta"] > 0:
                n["status"] = "AHEAD"
            elif m["delta"] < 0:
                n["status"] = "BEHIND"
        n["last_move"] = {"date": run_date.isoformat(), "delta": m["delta"]}
    g["cascade_log"].append(entry)
    g.setdefault("meta", {})["odds_stamp"] = sc.odds_stamp(g["nodes"])
    target = a.out or a.graph
    write_graph(g, target)
    print(f"\nWROTE {target}  (cascade_log entries: {len(g['cascade_log'])}, odds stamp {g['meta']['odds_stamp']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
