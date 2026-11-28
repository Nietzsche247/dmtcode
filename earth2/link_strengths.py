#!/usr/bin/env python3
"""
earth2/link_strengths.py
Rank the link strengths that are still estimates by how much the main events lean on them, and replace
them with sourced numbers. Python 3.8+, standard library only.

USAGE
  python3 earth2/link_strengths.py rank GRAPH.json [--top 50] [--json OUT.json] [--date YYYY-MM-DD]
  python3 earth2/link_strengths.py apply GRAPH.json FILE.json [--dry-run]

WHAT A STRENGTH MEANS (the rule in earth2/cascade.py, function cascade)
  change at the target, in points = change at the source, in points x strength x sign
  Full size on the first hop; each further hop is multiplied by the fade (0.5). The kind of a link (NECESSARY,
  LIKELY, MAGNIFIES, OPPOSES) does not change this arithmetic: only strength, sign and delay_days do. The
  result is held between 1 and 99, a step under 0.01 points is dropped, a FIRED target is never moved, and an
  effect that would land (run date + delay_days) after the target's window_end is dropped.
  So a strength is a slope: points at the target per point at the source. If a source at S percent fires
  (goes to 100), the target moves (100 - S) x strength points. To turn history into a strength:
      strength = (B - A) / (100 - S)
  where A is the target's odds now, S is the source's odds now, and B is the share of past cases, in percent,
  in which the target happened inside its window once the source had happened. With both rates in hand that
  is the same as (share with the source) minus (share without it), as a fraction. On a link with sign -1 the
  target falls, so strength = (A - B) / (100 - S). The allowed range is above 0, up to 1.

THE ESTIMATE FLAG
  A link whose strength is still an estimate carries "estimated": true. That is the field the page shows as
  "estimate" and validate_graph.py counts. Links with "display_only": true carry no strength and no move.

RANK (read only: the graph file is never written)
  For every link that carries a move and is still an estimate, a what-if with the engine's own cascade
  function, in memory: the link's SOURCE is pushed up 10 points (or to 99 if that is nearer), with the engine's
  normal hop limit (4) and fade (0.5), once with this link's strength halved and once with it doubled (capped
  at 1). Every other link stays as it is.
      score = sum over the live main events (not FIRED, odds above 1) of
              | odds with the strength doubled - odds with the strength halved |      (points)
  Odds are held between 1 and 99 as the engine holds them. The engine's rounding to one decimal is left off,
  so small links do not all tie at zero. A link whose source is FIRED or settled at 1 is skipped, because it
  will never push again; the count is printed. The what-if is dated today (America/Phoenix) unless --date is
  given; the date matters only for the engine's rule that drops an effect landing after a window has closed.
  Printed: the top N with rank, source, target, kind, sign, strength, delay, score, the three main events the
  link moves most and the source's odds now; then how concentrated the total is, so it is plain whether
  fixing N links is enough. --top 0 lists every ranked link. --json OUT writes the same rows with the detail
  a researcher needs (labels, odds, settlement tests, window ends, the link's reason, what the strength means).

APPLY (structure only: no odds move, no cascade runs)
  FILE is a JSON list of rows:
    {"source": "WK2", "target": "W6", "strength": 0.55, "delay_days": null,
     "evidence": "the historical count or dated facts the number rests on",
     "source_note": "named source with URL", "method": "how the number was computed", "date": "2026-11-28"}
  delay_days null keeps the link's delay. A number replaces it and marks the delay as measured too.
  For each row the link is found (old folded ids resolve through the alias map, with a NOTICE), the old strength
  and delay are kept in link["strength_history"] with the row's date, the new values are set, "estimated"
  becomes false, and evidence, source_note, method and strength_date are stored on the link.
  A row is refused when its link does not exist or is display only, when the strength is not above 0 and up to
  1, when delay_days is not null or a whole number of days from 0 up, when evidence, source_note or method is
  missing, when the date is not YYYY-MM-DD or is after today, or when two rows name one link.
  All or nothing: one bad row refuses the whole file and every bad row is listed. Nothing is written if any
  odds_now or the odds stamp would change. One line is added to the structure change list in meta.
  A row that is already in place changes nothing, so a second run of the same file writes nothing.

THE SCORECARD LOCK AND THE ODDS STAMP
  Both commands stop, like cascade.py, while a scorecard question is overdue (run python3 earth2/scorecard.py
  due) or while the graph's odds stamp does not match its odds. No flag skips this.

Exit codes: 0 done, 2 refused, 3 the scorecard lock is on, 4 the odds stamp does not match.
"""
import argparse
import datetime as dt
import json
import math
import os
import sys

PUSH_POINTS = 10.0     # the what-if push on a link's source, in points
MAX_HOPS = 4           # the engine's normal hop limit (cascade.py --max-hops default)
FADE = 0.5             # the engine's fade per hop after the first (cascade.py --fade default)
STRENGTH_MAX = 1.0     # the engine's top strength: cascade.load refuses more, validate_graph.py wants above 0 up to 1
ESTIMATE_FIELD = "estimated"   # true on a link whose strength is still an estimate
ROW_TEXT = ("evidence", "source_note", "method")
ROW_KEYS = ("source", "target", "strength", "delay_days") + ROW_TEXT + ("date",)
SHARE_STEPS = (10, 25, 50, 100, 200)
TOOL = "link_strengths.py"


def load_engine():
    """The cascade engine and the scorecard rules, loaded from beside this file. This tool has no cascade
    arithmetic of its own: every what-if runs through cascade.cascade."""
    import importlib.util
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cascade.py")
    if not os.path.exists(path):
        raise SystemExit("earth2/cascade.py is missing, so the engine's cascade math cannot be used. Restore it from git.")
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location("earth2_cascade", path)
    cas = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cas)
    return cas, cas.load_scorecard()


def open_graph(cas, sc, path):
    """Load the graph through the engine's own loader, then the lock and the stamp check, as cascade.py does."""
    if not os.path.exists(path):
        raise SystemExit(f"Graph file not found: {path}")
    g, nodes, links = cas.load(path)
    sc.enforce_lock(g, tool=TOOL)  # exits 3 while a question is overdue
    issue = sc.stamp_problem(g, path)
    if issue:
        print("REFUSED. " + issue)
        sys.exit(4)
    return g, nodes, links


def carries(e):
    """True when a link passes a move: it has a strength and is not display only (the engine's own test)."""
    return e.get("strength") is not None and not e.get("display_only")


def is_estimate(e):
    return bool(e.get(ESTIMATE_FIELD))


def estimate_counts(links):
    """(links whose strength is still an estimate, links that carry a move)."""
    live = [e for e in links if carries(e)]
    return sum(1 for e in live if is_estimate(e)), len(live)


def num(x):
    """A number in short plain form: 0.3, 12, 45.5."""
    return f"{float(x):g}"


def short(text, width=110):
    s = " ".join(str(text or "").split())
    return s if len(s) <= width else s[:width - 3].rstrip() + "..."


# ---------------------------------------------------------------- what a strength means, in plain words
def strength_meaning(e, s, t):
    """One line saying exactly what this link's strength does in the engine, with this link's own numbers,
    and how to turn a historical frequency into a strength for it."""
    sid, tid = e["source"], e["target"]
    st, sign = float(e["strength"]), int(e.get("sign", 1))
    way = "the same way" if sign > 0 else "the opposite way"
    line = (f"Engine rule: change at the target in points = change at the source in points x strength x sign "
            f"(full size on the first hop). Here every 1 point {sid} moves, {tid} moves {num(st)} of a point {way}.")
    so, to = s.get("odds_now"), t.get("odds_now")
    if so is not None and to is not None and float(so) < 100:
        gap = 100.0 - float(so)
        step = gap * st * sign
        land = min(99.0, max(1.0, float(to) + step))
        line += (f" If {sid} goes from {num(so)} to 100 (it fires), {tid} moves {step:+.2f} points, from {num(to)} "
                 f"to about {land:.1f}.")
    a_now = num(to) if to is not None else "A"
    s_now = num(so) if so is not None else "S"
    if sign > 0:
        line += (f" From history: strength = (B - A) / (100 - S), with A = {tid}'s odds now ({a_now}), S = {sid}'s "
                 f"odds now ({s_now}) and B = the percent of past cases in which {tid} happened inside its window "
                 f"once {sid} had happened. Same thing with both rates in hand: (share with {sid}) minus (share "
                 f"without it), as a fraction.")
    else:
        line += (f" From history: strength = (A - B) / (100 - S), with A = {tid}'s odds now ({a_now}), S = {sid}'s "
                 f"odds now ({s_now}) and B = the percent of past cases in which {tid} still happened inside its "
                 f"window once {sid} had happened. Same thing with both rates in hand: (share without {sid}) minus "
                 f"(share with it), as a fraction.")
    return line + " Allowed: above 0, up to 1."


# ---------------------------------------------------------------- rank
def odds_after(cas, before, total):
    """A node's odds after a cascade total, held between 1 and 99 as the engine holds them. Not rounded."""
    return min(cas.ODDS_MAX, max(cas.ODDS_MIN, float(before) + float(total)))


def live_main_events(sc, g):
    return [n for n in g["nodes"] if sc.is_main_event(n) and not sc.is_fired(n)
            and n.get("odds_now") is not None and n["odds_now"] > 1]


def zero_reason(cas, sc, e, s, t, push, run_date):
    """Why a ranked link scores 0, in a few words."""
    if push <= 0:
        return "the source is already at 99, so the push is zero"
    if sc.is_fired(t):
        return "the target has FIRED and is never moved"
    if t.get("odds_now") is None:
        return "the target has no odds"
    w_end = cas.parse_date(t.get("window_end"), end=True)
    if w_end is not None and run_date + dt.timedelta(days=int(e.get("delay_days") or 0)) > w_end:
        return "the effect would land after the target's window closes"
    return "no live main event moves (the push stops short of one)"


def rank_links(cas, sc, g, nodes, links, run_date, max_hops=MAX_HOPS, fade=FADE):
    """Score every link that carries a move and is still an estimate. Returns (rows, skipped, mains).
    rows are sorted best first; each has index, link, score, push, moves [(main event id, doubled minus halved)]
    and zero_reason. skipped counts the links left out because their source will never push again.
    Nothing is changed: each what-if runs on a copy of the link list with one link's strength swapped."""
    mains = live_main_events(sc, g)
    skipped = {"source FIRED": 0, "source settled at 1": 0, "source has no odds": 0}
    rows = []
    for i, e in enumerate(links):
        if not is_estimate(e) or not carries(e):
            continue
        s, t = nodes[e["source"]], nodes[e["target"]]
        o = s.get("odds_now")
        if o is None:
            skipped["source has no odds"] += 1
            continue
        if sc.is_fired(s):
            skipped["source FIRED"] += 1
            continue
        if float(o) <= cas.ODDS_MIN:
            skipped["source settled at 1"] += 1
            continue
        push = min(cas.ODDS_MAX, float(o) + PUSH_POINTS) - float(o)
        st = float(e["strength"])
        totals = []
        for value in (st / 2.0, min(STRENGTH_MAX, st * 2.0)):
            if push <= 0:
                totals.append({})
                continue
            trial = list(links)
            trial[i] = dict(e, strength=value)
            totals.append(cas.cascade(nodes, trial, {s["id"]: push}, run_date, max_hops, fade)[0])
        moves = []
        for m in mains:
            if m["id"] == s["id"]:
                continue  # the source is set by hand in both runs, so it cannot differ
            before = float(m["odds_now"])
            d = odds_after(cas, before, totals[1].get(m["id"], 0.0)) - odds_after(cas, before, totals[0].get(m["id"], 0.0))
            if abs(d) > 1e-9:
                moves.append((m["id"], d))
        moves.sort(key=lambda x: (-abs(x[1]), x[0]))
        score = sum(abs(d) for _, d in moves)
        rows.append({"index": i, "link": e, "score": score, "push": push, "moves": moves,
                     "zero_reason": None if score > 0 else zero_reason(cas, sc, e, s, t, push, run_date)})
    rows.sort(key=lambda r: (-r["score"], str(r["link"]["source"]), str(r["link"]["target"])))
    return rows, skipped, mains


def concentration(rows, top):
    """How the summed score is spread: the share the first k links hold, and how many links hold half, 80% and 90%."""
    total = sum(r["score"] for r in rows)
    steps = sorted(set(k for k in SHARE_STEPS + ((top,) if top else ())))

    def share(k):
        return sum(r["score"] for r in rows[:k]) / total if total else 0.0

    need, run, k = {}, 0.0, 0
    for mark in (0.5, 0.8, 0.9):
        while k < len(rows) and total and run < mark * total - 1e-12:
            run += rows[k]["score"]
            k += 1
        need[mark] = k
    return {"total_score": total, "ranked_links": len(rows), "scored_above_zero": sum(1 for r in rows if r["score"] > 0),
            "share_of_top": {str(k): share(k) for k in steps if k <= len(rows) or k == top},
            "links_holding_half": need[0.5], "links_holding_80_percent": need[0.8], "links_holding_90_percent": need[0.9]}


def node_brief(n):
    """What a researcher needs to know about one end of a link."""
    out = {"id": n["id"], "label": n.get("label"), "odds_now": n.get("odds_now")}
    if n.get("settlement_test"):
        out["settlement_test"] = n["settlement_test"]
    out["window_end"] = n.get("window_end")
    return out


def json_row(rank, r, nodes):
    e = r["link"]
    s, t = nodes[e["source"]], nodes[e["target"]]
    return {"rank": rank, "score": round(r["score"], 3), "source": node_brief(s), "target": node_brief(t),
            "kind": e.get("kind"), "sign": e.get("sign", 1), "strength": e.get("strength"),
            "delay_days": e.get("delay_days"), "reason": e.get("reason"), "origin": e.get("origin"),
            "moves_most": [{"id": mid, "label": nodes[mid].get("label"), "doubled_minus_halved": round(d, 3)}
                           for mid, d in r["moves"][:3]],
            "strength_means": strength_meaning(e, s, t)}


def cmd_rank(a):
    cas, sc = load_engine()
    g, nodes, links = open_graph(cas, sc, a.graph)
    if a.top < 0:
        raise SystemExit("--top must be 0 (every ranked link) or more.")
    try:
        run_date = cas.parse_date(a.date) if a.date else sc.today()
    except ValueError:
        raise SystemExit(f"--date {a.date!r} is not a date (YYYY-MM-DD).")
    rows, skipped, mains = rank_links(cas, sc, g, nodes, links, run_date)
    n_est, n_live = estimate_counts(links)
    n_skipped = sum(skipped.values())
    top = len(rows) if a.top == 0 else min(a.top, len(rows))
    conc = concentration(rows, top)
    total = conc["total_score"]

    print(f"EARTH2 LINK STRENGTH RANKING  what-if dated {run_date}  hops {MAX_HOPS}  fade {num(FADE)}  "
          f"push +{num(PUSH_POINTS)} points on the source (or to 99)")
    print(f"LINKS {len(links)}: {n_live} carry a move, {len(links) - n_live} are display only. "
          f"Strengths still estimates (link field \"{ESTIMATE_FIELD}\": true): {n_est} of {n_live}.")
    rule = (g.get("meta") or {}).get("cascade_rule") or {}
    if rule and (rule.get("max_hops", MAX_HOPS) != MAX_HOPS or rule.get("fade", FADE) != FADE):
        print(f"NOTE: meta.cascade_rule says hops {rule.get('max_hops')} and fade {rule.get('fade')}; this ranking "
              f"uses the engine's defaults, hops {MAX_HOPS} and fade {num(FADE)}.")
    print(f"SKIPPED {n_skipped} (the source will never push again): "
          + ", ".join(f"{k} {v}" for k, v in skipped.items()))
    print(f"RANKED {len(rows)}. Score = sum over the {len(mains)} live main events (not FIRED, odds above 1) of "
          f"|odds with the strength doubled (capped at {num(STRENGTH_MAX)}) minus odds with it halved|, in points.")
    print(f"ALLOWED STRENGTH: above 0, up to {num(STRENGTH_MAX)}.")
    print()
    print(f"TOP {top}")
    for k, r in enumerate(rows[:top], 1):
        e = r["link"]
        s, t = nodes[e["source"]], nodes[e["target"]]
        sign = "+1" if int(e.get("sign", 1)) > 0 else "-1"
        print(f"{k:>3}. score {r['score']:.2f}   {e['source']} -> {e['target']}   {e.get('kind')}  sign {sign}  "
              f"strength {num(e['strength'])}  delay {e.get('delay_days')} d  source odds {num(s['odds_now'])}")
        print(f"       from: {short(s.get('label'))}")
        print(f"       to:   {short(t.get('label'))}")
        if r["moves"]:
            print("       moves most: " + "; ".join(f"{mid} {d:+.2f} ({short(nodes[mid].get('label'), 48)})"
                                                    for mid, d in r["moves"][:3]))
        else:
            print(f"       moves no main event: {r['zero_reason']}")
    print()
    print(f"CONCENTRATION  total score {total:.1f} points over {len(rows)} ranked links")
    print("  " + ", ".join(f"top {k} hold {v * 100:.1f}%" for k, v in conc["share_of_top"].items()))
    print(f"  half the total sits in the top {conc['links_holding_half']} links; 80% needs "
          f"{conc['links_holding_80_percent']}; 90% needs {conc['links_holding_90_percent']}")
    zero = [r for r in rows if r["score"] <= 0]
    if zero:
        why = {}
        for r in zero:
            why[r["zero_reason"]] = why.get(r["zero_reason"], 0) + 1
        print(f"  {len(zero)} ranked links score 0: " + "; ".join(f"{v} where {k}" for k, v in sorted(why.items(), key=lambda x: -x[1])))
    share_top = conc["share_of_top"].get(str(top), 0.0)
    print(f"TOP {top} SHARE OF THE TOTAL: {share_top * 100:.1f}%")
    if a.json:
        out = {"what": "Earth2 link strengths that are still estimates, ranked by how much the live main events lean on them",
               "graph": a.graph, "what_if_date": run_date.isoformat(), "odds_stamp": (g.get("meta") or {}).get("odds_stamp"),
               "rule": {"push": f"+{num(PUSH_POINTS)} points on the link's source, or to 99 if nearer",
                        "max_hops": MAX_HOPS, "fade": FADE, "strength_low": "strength x 0.5",
                        "strength_high": f"strength x 2, capped at {num(STRENGTH_MAX)}",
                        "score": "sum over live main events (not FIRED, odds above 1) of |odds doubled - odds halved|, in points",
                        "odds": "held between 1 and 99 as the engine holds them; not rounded"},
               "estimate_field": ESTIMATE_FIELD, "allowed_strength": f"above 0, up to {num(STRENGTH_MAX)}",
               "counts": {"links": len(links), "links_that_carry_a_move": n_live, "still_estimated": n_est,
                          "skipped": n_skipped, "skipped_by_reason": skipped, "ranked": len(rows),
                          "live_main_events": len(mains)},
               "concentration": dict(conc, top=top, share_of_top_n=share_top),
               "links": [json_row(k, r, nodes) for k, r in enumerate(rows[:top], 1)]}
        with open(a.json, "w", encoding="utf-8") as f:
            json.dump(out, f, indent=1, ensure_ascii=False)
            f.write("\n")
        print(f"WROTE {a.json}  ({top} rows; the graph was not written)")
    return 0


# ---------------------------------------------------------------- apply
def read_rows(path):
    if not os.path.exists(path):
        raise SystemExit(f"File not found: {path}")
    try:
        with open(path, encoding="utf-8") as f:
            rows = json.load(f)
    except ValueError as err:
        raise SystemExit(f"{path} does not load as JSON: {err}")
    if not isinstance(rows, list) or not rows:
        raise SystemExit(f"{path} must be a JSON list with at least one row: " + "{" + ", ".join(f'"{k}"' for k in ROW_KEYS) + "}")
    return rows


def whole_days(v):
    """delay_days as an int when it is a whole number of days from 0 up, else None."""
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v):
        return None
    if v < 0 or int(v) != v:
        return None
    return int(v)


def check_rows(sc, g, nodes, links, rows):
    """(plans, bad, notes). A plan is one row made ready to apply. bad holds one line per refused row."""
    aliases = sc.alias_map(g)
    by_pair = {}
    for e in links:
        by_pair.setdefault((e["source"], e["target"]), e)
    today = sc.today()
    plans, bad, notes, seen = [], [], [], {}
    for i, row in enumerate(rows, 1):
        if not isinstance(row, dict):
            bad.append(f"row {i}: not an object")
            continue
        raw_s, raw_t = row.get("source"), row.get("target")
        name = f"row {i} ({raw_s} -> {raw_t})"
        why, e = [], None
        ids = []
        for key, raw in (("source", raw_s), ("target", raw_t)):
            nid = sc.resolve(raw, nodes, aliases) if isinstance(raw, str) and raw.strip() else None
            if nid is None:
                why.append(f"{key} {raw!r} is not a node in the graph")
            elif nid != raw:
                notes.append(f"NOTICE row {i}: '{raw}' was folded into '{nid}'; using {nid}.")
            ids.append(nid)
        if None not in ids:
            e = by_pair.get((ids[0], ids[1]))
            if e is None:
                back = " (there is a link the other way, from %s to %s)" % (ids[1], ids[0]) if (ids[1], ids[0]) in by_pair else ""
                why.append(f"there is no link from {ids[0]} to {ids[1]}{back}")
            elif e.get("display_only"):
                why.append("the link is display only: it carries no strength and no move, and this tool does not switch it on")
            elif id(e) in seen:
                why.append(f"row {seen[id(e)]} names the same link")
            else:
                seen[id(e)] = i
            if e is not None and "strength_history" in e and not isinstance(e["strength_history"], list):
                why.append("the link's strength_history is not a list")
        st = row.get("strength")
        if isinstance(st, bool) or not isinstance(st, (int, float)) or not math.isfinite(st) or not 0 < st <= STRENGTH_MAX:
            why.append(f"strength {st!r} is not a number above 0 and up to {num(STRENGTH_MAX)}")
        delay = None
        if row.get("delay_days") is not None:
            delay = whole_days(row["delay_days"])
            if delay is None:
                why.append(f"delay_days {row['delay_days']!r} is not null or a whole number of days from 0 up")
        for key in ROW_TEXT:
            if not isinstance(row.get(key), str) or not sc.filled(row.get(key)):
                why.append(f"no {key}")
        day = sc.iso(row.get("date"))
        if day is None:
            why.append(f"date {row.get('date')!r} is not YYYY-MM-DD")
        elif day > today:
            why.append(f"date {day} is after today ({today})")
        if why:
            bad.append(f"{name}: " + "; ".join(why))
            continue
        extra = [k for k in row if k not in ROW_KEYS and not str(k).startswith("_")]
        if extra:
            notes.append(f"NOTE row {i}: keys not used: {', '.join(map(str, extra))}")
        if "http://" not in row["source_note"] and "https://" not in row["source_note"]:
            notes.append(f"NOTE row {i} ({ids[0]} -> {ids[1]}): source_note carries no URL.")
        plans.append({"row": i, "link": e, "name": f"{ids[0]} -> {ids[1]}", "strength": float(st), "delay": delay,
                      "evidence": row["evidence"].strip(), "source_note": row["source_note"].strip(),
                      "method": row["method"].strip(), "date": day.isoformat()})
    return plans, bad, notes


def in_place(p):
    """True when the link already holds everything this row would write, so a second run changes nothing."""
    e = p["link"]
    return (e.get("strength") == p["strength"] and e.get(ESTIMATE_FIELD) is False
            and (p["delay"] is None or (e.get("delay_days") == p["delay"] and e.get("delay_estimated") is False))
            and e.get("evidence") == p["evidence"] and e.get("source_note") == p["source_note"]
            and e.get("method") == p["method"] and e.get("strength_date") == p["date"])


def change_text(p):
    e = p["link"]
    if p["delay"] is None:
        delay = f"delay {e.get('delay_days')} d kept"
    elif p["delay"] == e.get("delay_days"):
        delay = f"delay {e.get('delay_days')} d confirmed"
    else:
        delay = f"delay {e.get('delay_days')} to {p['delay']} d"
    was = "estimate" if is_estimate(e) else "measured"
    return f"{p['name']}: strength {num(e.get('strength'))} to {num(p['strength'])}, {delay}, {was} to measured"


def apply_plan(p):
    """Write one row onto its link. The old strength and delay go to strength_history with the row's date."""
    e = p["link"]
    old = {"date": p["date"], "strength": e.get("strength"), "delay_days": e.get("delay_days"),
           ESTIMATE_FIELD: bool(e.get(ESTIMATE_FIELD)), "delay_estimated": bool(e.get("delay_estimated"))}
    for key in ROW_TEXT + ("strength_date",):
        if e.get(key) is not None:
            old[key] = e[key]  # a strength measured before keeps its own evidence in the history
    e.setdefault("strength_history", []).append(old)
    e["strength"] = p["strength"]
    if p["delay"] is not None:
        e["delay_days"] = p["delay"]
        e["delay_estimated"] = False
    e[ESTIMATE_FIELD] = False
    e["evidence"], e["source_note"], e["method"] = p["evidence"], p["source_note"], p["method"]
    e["strength_date"] = p["date"]


def cmd_apply(a):
    cas, sc = load_engine()
    g, nodes, links = open_graph(cas, sc, a.graph)
    rows = read_rows(a.file)
    plans, bad, notes = check_rows(sc, g, nodes, links, rows)
    for line in notes:
        print(line)
    if bad:
        print(f"REFUSED: {len(bad)} bad row{'s' if len(bad) != 1 else ''} of {len(rows)} in {a.file}. Nothing was "
              f"written. One bad row refuses the whole file.")
        for line in bad:
            print("  - " + line)
        return 2
    todo = [p for p in plans if not in_place(p)]
    done = len(plans) - len(todo)
    for p in todo:
        if not is_estimate(p["link"]):
            print(f"NOTE row {p['row']} ({p['name']}): this strength is not marked as an estimate; it is replaced all "
                  f"the same and the old value is kept in strength_history.")
    print(f"LINK STRENGTHS APPLY: {len(rows)} row{'s' if len(rows) != 1 else ''}, {len(todo)} to write, {done} already in place")
    lines = [change_text(p) for p in todo]
    for line in lines:
        print("  " + line)
    odds_before = {n["id"]: n.get("odds_now") for n in g["nodes"]}
    stamp_before = sc.odds_stamp(g["nodes"])
    stamp_held = (g.get("meta") or {}).get("odds_stamp")
    for p in todo:
        apply_plan(p)
    n_est, n_live = estimate_counts(links)
    if ({n["id"]: n.get("odds_now") for n in g["nodes"]} != odds_before or sc.odds_stamp(g["nodes"]) != stamp_before
            or (g.get("meta") or {}).get("odds_stamp") != stamp_held):
        raise SystemExit("Refusing to write: an odds value or the odds stamp would change. apply writes structure only.")
    print(f"links still estimated: {n_est} of {n_live}")
    if a.dry_run:
        print("DRY RUN: nothing written.")
        return 0
    if not todo:
        print("Nothing to change. Nothing written.")
        return 0
    today = sc.today()
    listed = "; ".join(lines[:20]) + (f"; and {len(lines) - 20} more" if len(lines) > 20 else "")
    cas.structure_log(g).append(
        f"{today.strftime('%b')} {today.day}, {today.year}: {len(todo)} link strength{'s' if len(todo) != 1 else ''} "
        f"replaced with sourced numbers ({TOOL} apply, file {os.path.basename(a.file)}), structure only, no odds moved "
        f"and no cascade run: {listed}. Each link keeps its old strength and delay in strength_history and carries "
        f"evidence, source_note, method and strength_date. Links still estimated: {n_est} of {n_live}.")
    sc.write_json(a.graph, g)
    print(f"WROTE {a.graph}  (structure only; odds stamp unchanged {stamp_before})")
    return 0


def main(argv=None):
    p = argparse.ArgumentParser(description="Rank the Earth2 link strengths that are still estimates, and replace them with sourced numbers.")
    sub = p.add_subparsers(dest="cmd")
    r = sub.add_parser("rank", help="rank the estimated link strengths by how much the main events lean on them (read only)")
    r.add_argument("graph")
    r.add_argument("--top", type=int, default=50, help="how many to list (0 lists every ranked link)")
    r.add_argument("--json", metavar="OUT", help="also write the listed rows, with researcher detail, to this file")
    r.add_argument("--date", help="date of the what-if, YYYY-MM-DD (default: today in America/Phoenix)")
    r.set_defaults(fn=cmd_rank)
    ap = sub.add_parser("apply", help="replace link strengths from a file of sourced rows (structure only)")
    ap.add_argument("graph")
    ap.add_argument("file")
    ap.add_argument("--dry-run", action="store_true")
    ap.set_defaults(fn=cmd_apply)
    a = p.parse_args(argv)
    if not getattr(a, "fn", None):
        p.print_help()
        return 2
    return a.fn(a)


if __name__ == "__main__":
    sys.exit(main())
