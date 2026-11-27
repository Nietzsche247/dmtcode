#!/usr/bin/env python3
"""
earth2/ticket_guard.py
Check every open ticket against the node it bets on. Python 3.8+, standard library only. Read only: it never
writes the graph or the register.

USAGE
  python3 earth2/ticket_guard.py REGISTER.json [--graph public/future/earth2/graph.json] [--json] [--today YYYY-MM-DD]

THE REGISTER IS PRIVATE. This repo is public, so real tickets never go in it. Keep the register in the Project
(or anywhere outside the repo) and pass its path. earth2/tickets.json is gitignored in case it is saved here by
mistake. The shape is in earth2/templates/tickets_example.json:
  {"tickets": [{"id": "T-001", "node": "J5", "ticker": "FXY", "contract": "FXY Jan 15 2027 59 call",
                "expiry": "2027-01-15", "odds_at_entry": 85, "entry_date": "2026-11-25", "status": "OPEN"}]}
  status: PLANNED, OPEN, DAY0, SALVAGE are checked; CLOSED and EXPIRED are skipped. A stock or fund held with no
  expiry gives expiry null.

THE RULES (Nov 25 build list, from Aaron's record: early, never late)
  1. EXPIRES TOO SOON: warn when a ticket expires before its node's 50% date plus one quarter (91 days).
     A SCHEDULED or LOCKED event has no timing error, so its buffer is three weeks after the fixed date
     (time for the move to play out) instead of a quarter.
     The 50% date is the first date the node's odds_by curve reaches 50, by straight-line steps between points.
     No curve: the node's window_end stands in. A curve that never reaches 50: window_end stands in and the
     line says the ticket is on a less-likely-than-not event inside its window.
  2. ODDS FELL: warn when the node's odds are 10 or more points under odds_at_entry.
  3. PLACEHOLDER DATE: note when the date the rule leans on is an estimate (date_state ESTIMATED or a placeholder
     peak), so the 50% date may move. SCHEDULED and LOCKED dates are firm.
  4. FIRED: note that the node fired; the register's Day 0 rules take over.
  5. KILLED: warn when the node's status says killed or its odds sit at 1.
  Old ids resolve through graph["merges"] alias_map, so a ticket keyed to a folded id still finds its node.

EXIT CODE: 0 when every checked ticket is clear, 1 when any ticket has a WARN, 2 on a bad register.
The scorecard lock does not block this script: a guard on live money must run even when a question is overdue.
It prints the overdue count at the top instead.
"""
import argparse
import datetime as dt
import json
import os
import sys

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
QUARTER = 91
FIXED_BUFFER = 21
FALL = 10.0
CHECKED = {"PLANNED", "OPEN", "DAY0", "DAY 0", "SALVAGE"}


def load_sc():
    import importlib.util
    spec = importlib.util.spec_from_file_location("earth2_scorecard", os.path.join(HERE, "scorecard.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def d(v):
    try:
        return dt.date.fromisoformat(str(v)[:10]) if v else None
    except ValueError:
        return None


def fifty_date(node):
    """(date, basis) for when the node's curve first reaches 50%. A SCHEDULED or LOCKED event resolves on its
    fixed date (window_peak, else window_end), so that date is used and the curve is not read."""
    end = d(node.get("window_end"))
    if str(node.get("date_state") or "").upper() in ("SCHEDULED", "LOCKED"):
        fixed = d(node.get("window_peak")) or end
        if fixed:
            return fixed, "fixed date (SCHEDULED or LOCKED)"
    pts = sorted((d(k), float(v)) for k, v in (node.get("odds_by") or {}).items() if d(k) and v is not None)
    if not pts:
        return end, "no curve; window_end stands in"
    prev = None
    for day, odds in pts:
        if odds >= 50:
            if prev is None or prev[1] >= 50:
                return day, "curve"
            span = (day - prev[0]).days
            frac = (50 - prev[1]) / (odds - prev[1])
            return prev[0] + dt.timedelta(days=round(span * frac)), "curve"
        prev = (day, odds)
    return end, "curve never reaches 50; window_end stands in (less likely than not inside its window)"


def check(t, nodes, aliases, sc, today):
    warns, notes = [], []
    raw = t.get("node")
    nid = sc.resolve(raw, nodes, aliases) if raw else None
    if nid is None:
        return {"id": t.get("id"), "node": raw, "level": "WARN", "warns": [f"node {raw!r} is not on the graph"], "notes": []}
    if nid != raw:
        notes.append(f"{raw} was folded into {nid}")
    n = nodes[nid]
    odds = n.get("odds_now")
    status = str(n.get("status") or "").upper()
    if sc.is_fired(n):
        notes.append("node FIRED: the register's Day 0 rules take over")
    if "KILL" in status or (odds is not None and odds <= 1):
        warns.append(f"node looks killed (status {status or 'none'}, odds {odds})")
    entry = t.get("odds_at_entry")
    if entry is not None and odds is not None and entry - odds >= FALL:
        warns.append(f"odds fell {entry - odds:.1f} points since entry ({entry} to {odds})")
    exp = d(t.get("expiry"))
    f50, basis = fifty_date(n)
    if exp and f50:
        fixed = basis.startswith("fixed date")
        need = f50 + dt.timedelta(days=FIXED_BUFFER if fixed else QUARTER)
        if exp < need:
            pad = "three weeks" if fixed else "a quarter"
            warns.append(f"expires {exp} before the 50% date {f50} plus {pad} ({need}); {basis}")
        elif basis not in ("curve", "fixed date (SCHEDULED or LOCKED)"):
            notes.append(f"50% date {f50}: {basis}")
    elif exp and not f50:
        notes.append("node has no curve and no window_end; the expiry rule cannot be checked")
    if exp and exp < today:
        warns.append(f"expiry {exp} has passed but status is still {t.get('status')}")
    ds = str(n.get("date_state") or "").upper()
    if exp and (ds == "ESTIMATED" or n.get("peak_placeholder")) and ds not in ("SCHEDULED", "LOCKED"):
        notes.append("the date this leans on is an estimate (date_state ESTIMATED or a placeholder peak)")
    return {"id": t.get("id"), "node": nid, "ticker": t.get("ticker"), "contract": t.get("contract"),
            "expiry": t.get("expiry"), "odds_now": odds, "odds_at_entry": entry,
            "fifty_date": f50.isoformat() if f50 else None, "level": "WARN" if warns else "OK",
            "warns": warns, "notes": notes}


def main(argv=None):
    p = argparse.ArgumentParser(description="Check open Earth2 tickets against their nodes. Read only.")
    p.add_argument("register")
    p.add_argument("--graph", default=os.path.join(os.path.dirname(HERE), "public", "future", "earth2", "graph.json"))
    p.add_argument("--json", action="store_true")
    p.add_argument("--today")
    a = p.parse_args(argv)
    sc = load_sc()
    today = d(a.today) or sc.today()
    try:
        with open(a.register, encoding="utf-8") as f:
            reg = json.load(f)
        tickets = reg["tickets"]
        assert isinstance(tickets, list)
    except Exception as e:  # noqa: BLE001
        print(f"Bad register {a.register}: {e}. Shape: earth2/templates/tickets_example.json")
        return 2
    with open(a.graph, encoding="utf-8") as f:
        g = json.load(f)
    nodes = {n["id"]: n for n in g["nodes"]}
    aliases = sc.alias_map(g)
    rows = [check(t, nodes, aliases, sc, today) for t in tickets
            if str(t.get("status") or "OPEN").upper() in CHECKED]
    doc, _ = sc.load_questions()
    late = sc.overdue(doc["questions"]) if doc else []
    if a.json:
        print(json.dumps({"today": today.isoformat(), "overdue_questions": len(late), "rows": rows}, indent=1))
    else:
        print(f"TICKET GUARD  today {today}  checked {len(rows)} of {len(tickets)} tickets"
              + (f"  ({len(late)} scorecard question(s) overdue: settle them)" if late else ""))
        for r in rows:
            head = f"{r['level']:4}  {r['id']}  {r.get('ticker') or ''} {r.get('contract') or ''}  node {r['node']}"
            if r.get("odds_now") is not None:
                head += f" at {r['odds_now']}%"
            print(head)
            for w in r["warns"]:
                print(f"      WARN  {w}")
            for x in r["notes"]:
                print(f"      note  {x}")
    return 1 if any(r["level"] == "WARN" for r in rows) else 0


if __name__ == "__main__":
    sys.exit(main())
