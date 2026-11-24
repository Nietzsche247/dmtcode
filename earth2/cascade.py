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
  (a) a node that rose this run, pushed by two or more different arms
  (b) two risen nodes from different arms whose windows overlap or sit within 120 days
  (c) a company that sits on two or more risen nodes
  Each is scored: joint odds x number of arms pushing. Ties go to the shortest window.
  The top 5 is THE NEXT COLLISIONS QUEUE.
"""

import argparse
import calendar
import datetime as dt
import json
import os
import sys
import tempfile

ODDS_MIN, ODDS_MAX = 1.0, 99.0
MIN_STEP = 0.01


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


def read_updates(args, nodes):
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
    for u in raw:
        nid = str(u.get("id", "")).strip()
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


def collisions(nodes, companies, rose, after, pushers, limit_days):
    far = dt.date(2100, 1, 1)
    end_of = lambda nid: parse_date(nodes[nid].get("window_end"), end=True) or far
    items = []
    for nid, arms in pushers.items():
        arms = {a for a in arms if a}
        if nid in rose and len(arms) >= 2:
            items.append({"kind": "a", "what": f"{nid} rose {rose[nid]:+.1f}, pushed by {len(arms)} arms", "nodes": [nid],
                          "arms": sorted(arms), "joint_odds": round(after[nid], 1),
                          "score": round(after[nid] / 100 * len(arms), 3), "window_end": end_of(nid).isoformat()})
    ids = sorted(rose)
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            a, b = nodes[ids[i]], nodes[ids[j]]
            if (a.get("arm") or "") == (b.get("arm") or ""):
                continue
            gap = window_gap(a, b)
            if gap is None or gap > limit_days:
                continue
            joint = after[a["id"]] / 100 * after[b["id"]] / 100
            shared = sorted(set(a.get("layers_hit") or []) & set(b.get("layers_hit") or []))
            items.append({"kind": "b", "what": f"{a['id']} ({rose[a['id']]:+.1f}) x {b['id']} ({rose[b['id']]:+.1f})" + (f", same layer: {', '.join(shared)}" if shared else ""),
                          "nodes": [a["id"], b["id"]], "arms": sorted({a.get("arm"), b.get("arm")}),
                          "gap_days": gap, "shared_layers": shared, "joint_odds": round(joint * 100, 1),
                          "score": round(joint * 2, 3), "window_end": min(end_of(a["id"]), end_of(b["id"])).isoformat()})
    for co in companies or []:
        on = [x for x in co.get("event_nodes", []) if x in rose]
        if len(on) >= 2:
            top = sorted(on, key=lambda x: -after[x])[:2]
            joint = after[top[0]] / 100 * after[top[1]] / 100
            arms = sorted({nodes[x].get("arm") for x in on})
            items.append({"kind": "c", "what": f"{co['ticker']} sits on {len(on)} risen nodes: {', '.join(on)}",
                          "nodes": on, "company": co["ticker"], "arms": arms, "joint_odds": round(joint * 100, 1),
                          "score": round(joint * len(arms), 3), "window_end": min(end_of(x) for x in on).isoformat(),
                          "listed_options": co.get("listed_options"), "verified": co.get("verified")})
    items.sort(key=lambda h: (-h["score"], h["window_end"]))
    return items


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
    a = p.parse_args(argv)

    g, nodes, links = load(a.graph)
    ups = read_updates(a, nodes)
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
    coll = collisions(nodes, g.get("companies"), rose, after, pushers, a.collision_days)
    queue = coll[:5]

    entry = {"date": run_date.isoformat(), "run_at": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
             "trigger": [{"id": k, "before": float(nodes[k]["odds_now"]), "after": u["new"], "date": u["date"],
                          "reason": u["reason"], "source": u["source"]} for k, u in ups.items()],
             "rule": {"move": "d x strength x sign", "fade": a.fade, "max_hops": a.max_hops, "visit": "once per run",
                      "clamp": [ODDS_MIN, ODDS_MAX], "fired_pinned": True, "collision_days": a.collision_days},
             "moved": moved, "skipped": [{"id": k, "reason": v} for k, v in sorted(skipped.items())], "stats": stats,
             "collisions": {"a_multi_arm_nodes": [c for c in coll if c["kind"] == "a"],
                            "b_cross_arm_pairs": [c for c in coll if c["kind"] == "b"][:40],
                            "c_companies": [c for c in coll if c["kind"] == "c"]},
             "queue": queue}

    print(f"EARTH2 CASCADE  {entry['date']}  hops {a.max_hops}  fade {a.fade}")
    for t in entry["trigger"]:
        print(f"SET {t['id']} {t['before']} -> {t['after']}  ({t['date']}) {t['reason']}")
    print(f"\n{'ID':<14}{'ARM':<24}{'BEFORE':>7}{'AFTER':>7}{'MOVE':>7}  HOW")
    for m in moved:
        how = m["role"] if m["role"] != "cascade" else m["paths"][0]["path"]
        print(f"{m['id']:<14}{(m['arm'] or '')[:23]:<24}{m['before']:>7.1f}{m['after']:>7.1f}{m['delta']:>+7.1f}  {how}")
    print(f"\nLINKS USED {stats['links_used']}, closed windows {stats['dropped_window_closed']}, "
          f"blocked at fired or hand-set nodes {stats['blocked_fired_or_hand_set']}, too small {stats['dropped_tiny']}")
    print("\nTHE NEXT COLLISIONS QUEUE")
    for i, c in enumerate(queue, 1):
        print(f"  {i}. [{c['kind']}] {c['what']}  arms: {', '.join(c['arms'])}  joint {c['joint_odds']}%  score {c['score']}  window ends {c['window_end']}")
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
        if m["role"] == "set by hand":
            if m["after"] == 100:
                n["status"] = "FIRED " + m["date"]
            elif m["delta"] > 0:
                n["status"] = "AHEAD"
            elif m["delta"] < 0:
                n["status"] = "BEHIND"
        n["last_move"] = {"date": run_date.isoformat(), "delta": m["delta"]}
    g["cascade_log"].append(entry)
    target = a.out or a.graph
    folder = os.path.dirname(os.path.abspath(target))
    fd, tmp = tempfile.mkstemp(dir=folder, suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(g, f, indent=1, ensure_ascii=False)
    os.replace(tmp, target)
    print(f"\nWROTE {target}  (cascade_log entries: {len(g['cascade_log'])})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
