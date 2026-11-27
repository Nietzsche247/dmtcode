#!/usr/bin/env python3
"""
apply_rebase.py
The one-time Earth2 rebase of Nov 25, 2026: STRUCTURE ONLY. Python 3.8+, standard library only.

USAGE
  python3 apply_rebase.py GRAPH.json [--updates updates.json] [--repo REPO_ROOT] [--changes OUT.json] [--dry-run]

  GRAPH.json   the graph to change in place (normally REPO/public/future/earth2/graph.json)
  --updates    the odds re-rates that cascade.py --rebase will apply next (default: updates.json beside this
               script). Read only, to know the target odds of every re-rated node, so each curve is rescaled
               to the odds it will carry after the rebase. This script never writes odds_now.
  --repo       the repo root (default: four folders up from GRAPH.json). earth2/scorecard.py and
               earth2/plumbing_2026-11-25.py are loaded from there.
  --changes    also write every change as JSON (used to build REPORT.md)
  --dry-run    print every change, write nothing

WHAT IT DOES, in order
  1. Folds (A2). R6 -> 27-6, E12 -> 27-4, E17 -> 29-2, E26 -> 29-1, with the session 1 plumbing fold function
     (earth2/plumbing_2026-11-25.py fold_all): links, companies and chains repointed, self links and duplicate
     pairs dropped (the better link kept), the copy's full record (its own odds, curve, window, history and every
     model field) kept on the survivor under folded_from, and every folded id added to a NEW alias_map entry in
     graph["merges"]. 28-3 and C4 are NOT folded (they are not the same event; see NOT_FOLDED).
     SURVIVOR ODDS RULE: the survivor keeps its own odds_now (the plumbing precedent). Nothing else about odds
     changes here. The re-rates of 27-6 and 27-4 come next, from updates.json, through cascade.py --rebase.
     The survivor also takes, where it has none, the copy's curve (odds_by) and model fields (settlement_test,
     next_watch, what_changed, if_it_fires, hit, board_arm and the like).
  2. Text fixes (A4 settlement tests, A5 label numbers and the Oracle results date) and one window fix (HP09).
  3. The link fix: 28-1 -> 29-3 is relabelled LIKELY with a corrected reason (it is not a necessary condition).
  4. Curves (odds_by) on every live node: the value at the node's deadline (window_end) equals its target odds
     (odds_now, or the new odds in updates.json); the rest of the curve is rescaled proportionally; explicit
     curve points from the proposals are set; a cumulative curve is kept non-decreasing; every point is held
     between 1 and 99. Then the containment pass (a part is at most its whole) and the D5 floor (any shutdown
     is at least a 5+ day shutdown).
  5. odds_now is checked unchanged on every surviving node. Removing the four folded nodes changes the odds
     stamp (a hash over every node's odds), so the stamp is reset and the reset is logged in cascade_log as a
     "restamp" entry, the same record cascade.py --restamp writes.

It refuses to run twice (graph["merges"] already holds the rebase entry), refuses a graph whose odds stamp does
not match (odds edited outside the engine), and stops while the scorecard lock is on.
"""
import argparse
import calendar
import copy
import datetime as dt
import importlib.util
import json
import os
import sys
import tempfile

sys.dont_write_bytecode = True  # never leave __pycache__ inside the repo

TAG = "rebase 2026-11-25"
DATE = "2026-11-25"
PREFIX = "REBASE (Nov 25 proposals): "
ODDS_MIN, ODDS_MAX = 1.0, 99.0
TOL = 0.1  # rounding to one decimal can leave an interpolated deadline value off by up to 0.05

# ---------------------------------------------------------------- A2 folds (old id, survivor, reason)
# Precedent (plumbing_2026-11-25.md): the copy folds into the id of the primary set. The 27-x/28-x/29-x ids are
# the original 62-event model, the primary tier, so the major survives every pair.
FOLDS = [
    ("R6", "27-6", "Same event: a Western car, aircraft or robot maker announces a production line stopped for lack "
                   "of heavy rare earths or magnets. Same window (Nov 22, 2026 to Nov 30, 2027) and both read 70 by "
                   "Nov 2027 (R6 69.9, 27-6 70.0). G2 called 27-6 the third copy of R6 (E20 was folded into R6 on "
                   "Nov 25). The major survives (primary tier, 62-event model); R6's board test and curve move onto it."),
    ("E12", "27-4", "Same event: 'The AI debt break'. E12 is the driver model's challenger estimate of major 27-4; at "
                    "27-4's Nov 2027 deadline E12 reads 59 against 27-4's 58.4. The major survives; E12's settlement "
                    "test (a $1B+ neocloud, miner-host or data-center vehicle default or distressed exchange, or "
                    "Oracle cut to junk) and curve move onto it."),
    ("E17", "29-2", "Same event: 'The backstop'. E17 is the driver model's challenger estimate of major 29-2; at "
                    "29-2's Nov 2029 deadline E17 reads 61 against 29-2's 65. The major survives; E17's test (Fed "
                    "buys bonds or Treasury caps long-bond sales while core inflation is above 2%, or an emergency "
                    "facility) and curve move onto it."),
    ("E26", "29-1", "Same event: 'The networks are not safe'. E26 is the driver model's challenger estimate of major "
                    "29-1 (G3: duplicate; 29-1's kill condition is E26's test). The major survives; E26's test "
                    "(physical or nationwide effect officially attributed to an AI-run attack, or a military command "
                    "compromise) and curve move onto it. At Nov 2029 E26 read 74 against 29-1's 50: see REPORT flags."),
    # ("C4", "28-3", "..."),  # NOT folded: see NOT_FOLDED. Add this line only if the owner rules they are one event.
]
NOT_FOLDED = [
    {"pair": ["28-3", "C4"], "why": (
        "Not the same event. (1) 28-3's own one_number_rule says 'Model 35 is the major (55%); C4 78% and C9 60% are "
        "legs under it', so C4 is a component of 28-3, not a copy. (2) The windows do not overlap: C4 runs Nov 22, "
        "2026 to Mar 31, 2027; 28-3 runs Jun 1, 2027 to Nov 30, 2028. The plumbing rule folds only when label, window "
        "and settlement test describe the same event. (3) At 28-3's Nov 2028 deadline C4's curve reads 78 against "
        "28-3's 57. C4 (with E25 inside) stays a board row; its Nov 2027 re-rate is applied to C4's own curve.")},
]
# Fields the survivor takes from the copy when it has none ("keep the model fields on the survivor").
CARRY = ["odds_by", "settlement_test", "next_watch", "who_it_hits_text", "what_changed", "if_it_fires", "hit",
         "board_arm", "description", "year", "one_number_rule"]

# ---------------------------------------------------------------- A4 and A5 text fixes, one window fix
ORACLE_EST = ("Oracle fiscal Q2 2027 results, ESTIMATED Dec 18, 2026 (Oracle had not set the date as of Nov 26, 2026; "
              "Dec 18 is the scorecard Q-0008 due date; FQ2 FY26 was reported Dec 10, 2025)")
TEXT = [
    # (node, field, new value, why, source)
    ("E02", "settlement_test",
     "Any one of: a frontier lab states in writing that AI systems do most of its AI research; METR or a government AI "
     "institute reports a headline frontier capability doubling time under two months on its main combined task suite "
     "(a doubling time on one sub-suite, such as METR's TH2 at 1.65 months, does not count); a G7 government or the UN "
     "AI science panel states in an official document that self-accelerating AI progress is under way.",
     "A4: say whether a doubling on one suite counts. It does not: only the headline doubling time on the main combined suite.",
     "G3_report.md section 7 (E02 row) and section 8 Settlement fixes"),
    ("O3", "settlement_test",
     "IMF PortWatch daily Hormuz transit calls (a count of ships, not oil volume) average at or above 50% of their "
     "Jan to Feb 2026 average over a full 30 days, by May 31, 2027.",
     "A4: the test named no metric, and by oil volume Hormuz already passed half of normal in October; settle on IMF PortWatch ship transits.",
     "G2_report.md section 5 Settlement tests to add or fix (O3); section 1B table row O3"),
    ("DA2", "label",
     "Heavy rare-earth price outside China hits 25 times the China price",
     "A4: the label said 16 times (already met: 16.3 times at end Q3) while the test says 25 times; label now agrees with the test.",
     "G2_report.md section 5 Settlement tests to add or fix (DA2); section 2a item 5"),
    ("DA3", "settlement_test",
     "China lets the rare-earth pause lapse with no extension, or customs data show China's magnet exports averaging "
     "under 4,000 t a month over two consecutive months (a two-month average, so the normal Chinese New Year dip in a "
     "single month does not settle it).",
     "A4: a normal Chinese New Year dip (Feb 6, 2027) could trip a single-month 4,000 t test with no policy change.",
     "G2_report.md section 5 Settlement tests to add or fix (DA3); section 1A table row DA3"),
    ("DA3", "kill_condition",
     "MOFCOM extends the rare-earth pause past Jan 10, 2027 and China's magnet exports, averaged over any two "
     "consecutive months, stay above 4,000 t in every customs release through Aug 2027.",
     "Kept in step with the new two-month DA3 test.",
     "G2_report.md section 5 (DA3)"),
    ("HP14", "label",
     "The Ellison complex cracks: Skydance (SKYD; about $86.8B of debt, rated BB) announces a distressed exchange or a "
     "forced asset sale of $5B or more, or Larry Ellison sells any of the 413M Oracle shares he has pledged for "
     "personal loans.",
     "A4: drop 'or adds to'. More pledged shares after Oracle's fall is defence, not a crack (as worded about 65%).",
     "G1_report.md section 4(e) HP14 and section 2.2 row HP14"),
    ("HP14", "settlement_test",
     "YES if, between Nov 25, 2026 and Nov 30, 2027, Skydance (SKYD) announces a distressed exchange or a forced asset "
     "sale of $5B or more, or an SEC Form 4 shows Larry Ellison selling or disposing of Oracle shares, including any "
     "sale of pledged shares by a lender. A rise in the number of pledged shares does not count.",
     "A4: the HP14 test written out without 'adds to'.",
     "G1_report.md section 4(e) HP14; section 6 New events item 8"),
    ("HP14", "next_watch", ORACLE_EST,
     "A5: Oracle results date not set; one note everywhere.", "G1_report.md section 1 F-21 and data quality notes; scorecard Q-0008"),
    ("HP09", "label",
     "Europe's gas wall: by Mar 31, 2027 EU storage falls below 15% full, or Dutch TTF gas settles above EUR 150/MWh, "
     "or a large member state raises its gas emergency plan to Alert or Emergency (early warning does not count), or "
     "the EU suspends its Jan 1 ban on long-term Russian LNG. Storage was 68.9% on Nov 23 against an 89% five-year "
     "average; TTF about EUR 90; Qatar loading about half its pre-war volume.",
     "A4: Germany has been at early warning since Jul 1, 2025, so early warning cannot be the trigger.",
     "G2_report.md section 2e; Bundesnetzagentur Nov 24, 2026"),
    ("HP09", "settlement_test",
     "By Mar 31, 2027, any of: (1) GIE AGSI EU aggregate storage below 15.0% on any gas day; (2) the ICE Endex TTF "
     "front month settles above EUR 150/MWh; (3) Germany, Italy, France, the Netherlands, Spain or Poland raises its "
     "national gas emergency plan to Alert or Emergency level under Regulation 2017/1938, or the Council declares a "
     "Union alert (early warning does not count); (4) the Commission formally suspends the Russian LNG import ban. "
     "The window opens Nov 25, 2026, so the current cold snap counts.",
     "A4: HP09 had no test; window from Nov 25.",
     "G2_report.md section 2e Proposed test"),
    ("HP09", "window_start", "2026-11-25",
     "A4: move window_start from Dec 15 to Nov 25 so the current cold snap counts.",
     "G2_report.md section 2e"),
    ("M13", "settlement_test",
     "YES if, by Nov 30, 2028, either (1) verified AI-contributed new results on the Erdos problems database "
     "(erdosproblems.com) reach 440 or more in one calendar quarter, 10 times the Q2 2026 pace of 44 a quarter, or "
     "(2) a G7 government science agency report credits AI systems as the primary discoverer of a stated count of "
     "peer-reviewed results that is at least 10 times the count it gives for 2026. A declaration with no stated count "
     "does not settle it.",
     "A4: M13 had no settlement test. Composed: G3 gives no exact wording; built from G3's DISC-A (a G7 agency count) "
     "and the node's own kill condition (the Erdos database pace of 44 a quarter).",
     "G3_report.md section 4 and section 8 New events item 10 (DISC-A); M13 kill_condition"),
    ("M55", "settlement_test",
     "YES if CDC provisional data published by Nov 30, 2027 show the US age-adjusted suicide rate at a record high "
     "for a 12-month period.",
     "A4: M55 had no settlement test.",
     "G4_report.md section 7 Settlement fixes (M55)"),
    ("M56", "settlement_test",
     "YES if ACLED data published by Nov 30, 2027 show US political-violence events in a 12-month period up 50% or "
     "more on the 12 months before.",
     "A4: M56 had no settlement test.",
     "G4_report.md section 7 Settlement fixes (M56)"),
    ("M57", "settlement_test",
     "YES if, by Nov 30, 2029, at least three materials described as AI-discovered by their developer and by a "
     "peer-reviewed paper reach pilot-scale production or an independent peer-reviewed replication, at least one of "
     "them a battery or magnet material.",
     "A4: M57 had no settlement test. Composed: G3 says no agreed metric exists; built from the node's own kill "
     "condition (AI-discovered battery or magnet material at pilot production or replicated).",
     "G3_report.md section 4; M57 kill_condition"),
    ("M62", "settlement_test",
     "YES if the Federal Reserve Distributional Financial Accounts published by Nov 30, 2027 show the top 1% share of "
     "US household wealth above 32.5% (the Q2 2026 record) in any quarter.",
     "A4: M62 had no settlement test.",
     "G4_report.md section 7 Settlement fixes (M62); FRED WFRBST01134"),
    ("HP07", "label",
     "The credit index catches down: the US high-yield bond spread (ICE BofA) closes at 500 bp or more (372 bp on "
     "Nov 24 per FRED, while CoreWeave's default insurance is 1,314 bp and a $500M data-center loan auction failed).",
     "A5: the spread was 372 bp on Nov 24 (FRED BAMLH0A0HYM2), not 364.",
     "G1_report.md section 1 F-9 and data quality notes; FRED BAMLH0A0HYM2"),
    ("F4", "next_watch", ORACLE_EST,
     "A5: the Oracle results date read 'about Dec 9 to 10' here and 'about Dec 14' elsewhere; Oracle has not set it.",
     "G1_report.md section 1 F-21; Oracle investor relations (no FQ2 FY27 date notice found Nov 26); scorecard Q-0008"),
    ("F4", "date_catalyst", ORACLE_EST,
     "A5: one Oracle date, marked estimated.", "G1_report.md section 1 F-21; scorecard Q-0008"),
    ("F4", "window_peak", "2026-12-18",
     "A5: the peak sits on the Oracle results catalyst, now estimated Dec 18 (date_state stays ESTIMATED).",
     "G1_report.md section 4(d) F4; scorecard Q-0008"),
    ("HP04", "next_watch", ORACLE_EST + ": backlog",
     "A5: one Oracle date, marked estimated.", "G1_report.md section 1 F-21; scorecard Q-0008"),
    ("HP05", "next_watch", ORACLE_EST,
     "A5: one Oracle date, marked estimated.", "G1_report.md section 1 F-21; scorecard Q-0008"),
    ("HP05", "date_catalyst", ORACLE_EST,
     "A5: one Oracle date, marked estimated.", "G1_report.md section 1 F-21; scorecard Q-0008"),
    ("HP05", "window_peak", "2026-12-18",
     "A5: the peak sits on the Oracle results catalyst, now estimated Dec 18 (date_state stays ESTIMATED).",
     "G1_report.md section 1 F-21; scorecard Q-0008"),
]

# ---------------------------------------------------------------- the link fix
LINK_FIX = {
    "source": "28-1", "target": "29-3", "kind_from": "NECESSARY", "kind_to": "LIKELY",
    "reason": ("Recursive self-improvement makes an ASI claim more credible and more likely, but it is not a "
               "necessary condition: a claim can rest on a label alone (the cheap path is a loose federal "
               "'Super Intelligence' definition), and a self-improvement year that lands after Nov 2028 would fall "
               "outside 28-1's window anyway. Relabelled LIKELY in the Nov 25 rebase; it was NECESSARY with the "
               "reason 'An ASI claim needs recursive learning first'."),
    "why": ("House rule NECESSARY BEATS LIKELY: 28-1 (61.0) sat below 29-3 (61.1). Recommended fix: relabel, not raise "
            "28-1. G3 section 1.2: an ASI claim is far from credible on capability and its cheap path is a label; "
            "nobody is forced by capability to make it. Raising 28-1 would also need a basis the proposals do not give."),
    "source_doc": "G3_report.md section 1.2 (least-capability test, ASI claim) and section 1.3",
}

# ---------------------------------------------------------------- explicit curve points from the proposals (B)
# Keys use the graph's own curve grid (the 19th of the month) for the reports' Feb 25 / May 25 / Nov 25 dates.
CURVE_SET = {
    "27-4": ({"2027-02-19": 15.0, "2027-05-19": 35.0, "2027-11-19": 55.0},
             "B: 27-4 / E12 curve 47 May, 58 Nov 2027 to 15 Feb, 35 May, 55 Nov 2027 (BASE RATE telecom 2000 to 2002; rescues first)",
             "G1_report.md section 2.2 row 27-4 and E12"),
    "X1": ({"2027-05-19": 10.0, "2027-11-19": 28.0},
           "B: AGI declared 57 to 28 by Nov 2027 (10 by May) (JUDGMENT, nobody forced to declare); X1's Jun 30 deadline then reads 14.1",
           "G3_report.md section 1.2 and 1.3 row E01"),
    "D6": ({"2027-11-19": 38.0},
           "B: recession call 32 to 38 by Nov 2027 (BASE RATE 2000, 2007: with hikes P(recession given a debt break) about 0.6). "
           "D6's deadline is May 31, 2027, so odds_now stays 20 and only the Nov 2027 point moves",
           "G1_report.md section 4(a) item 3"),
    "C4": ({"2027-11-19": 72.0},
           "B: plumbing breached (E25 folded into C4) 60 to 72 by Nov 2027 (FACT two $1B+ thefts in 21 months: Bybit Feb 21, 2025 $1.5B; "
           "Binance Oct 29, 2026 $6.34B). C4's deadline is Mar 31, 2027, so odds_now stays 39.4 and only the Nov 2027 point moves",
           "G3_report.md section 2.3 rows E25 and 28-3, precursor paragraph"),
    "C8": ({"2027-05-19": 35.0},
           "B: cyber insurance rates rise, 20 to 35 by May 19, 2027 (US rates already flat; Marsh Q4 index late Jan; AI and widespread-event "
           "wording spreading). C8's deadline is Nov 30, 2027, so odds_now stays 54.4 and only the May point moves",
           "G3_report.md section 2.3 precursor paragraph; Marsh Q3 2026 index (Oct 21)"),
    "E09": ({"2027-11-19": 20.0},
            "B: E09 30 to 20 by Nov 2027 and 40 by Nov 2028 (FACT BLS office payrolls up 51k y/y, NACE hiring +14%, Challenger AI-named cuts at a 2026 low)",
            "G4_report.md section 1b row E09 and section 1c"),
    "E31": ({"2027-11-19": 35.0},
            "B: E31 15 to 35 by Nov 2027 (FACT RASolve 301 initial readout anticipated in 2027). E31's deadline is Nov 2028 and the proposals "
            "give no Nov 2028 number, so odds_now stays 41 and only the Nov 2027 point moves",
            "G4_report.md section 3b row E31; Revolution Medicines Q3 2026 release (Nov 4)"),
}
# Floors applied after the rescale (a value of at least this much at this date).
CURVE_FLOOR = {
    "29-1": ({"2027-11-19": 40.0},
             "B and A3: E26 (now folded into 29-1) 31 to at least 40 by Nov 2027, because it contains C9 (34.7 by Nov 2027). "
             "29-1's own odds_now (50 by Nov 2029) already exceeds 40, so only the curve moves",
             "G3_report.md section 2.3 row E26 and section 6(a) item 1"),
}
# A3: "any shutdown" (D5) must be at least "a 5+ day shutdown beginning Dec 12 to Jun 30" (HP11) at Jun 30, 2027.
D5_FLOOR = ("D5", "2027-06-30", "HP11",
            "A3: D5 (any shutdown) sat below HP11 (a 5+ day shutdown) over the same span. Smallest move: D5's curve gets a "
            "Jun 30, 2027 point equal to HP11's re-rated 40 (later points lifted to stay non-decreasing). D5's odds_now "
            "(21 by Dec 12) and HP11's 40 do not move",
            "G1_report.md section 4(a) item 1 (G1 suggested D5's May 19 point about 42)")
# A3 containment: (whole, part, may_cap_part, why). A part's curve may not sit above its whole's at any curve date.
CONTAIN = [
    ("29-2", "D9", True, "29-2 now carries E17's test, which is D9 OR an emergency facility"),
    ("29-2", "B4", True, "29-2 now carries E17's test, whose facility leg contains B4"),
    ("29-1", "C9", False, "29-1 now carries E26's test, which contains C9"),
    ("27-4", "F4", True, "27-4 now carries E12's test, whose second leg is F4 (Oracle cut to junk)"),
    ("27-4", "MR4", True, "27-4 now carries E12's test, whose first leg contains MR4 ($1B+ GPU cloud default)"),
    ("E07", "T1", True, "E07's test is T1's event, or a quarantine, blockade or conflict"),
    ("E07", "T2", True, "E07's test counts a blockade (T2)"),
    ("E09", "W2", True, "E09's test is W2 OR W3"),
    ("E09", "W3", True, "E09's test is W2 OR W3"),
    ("E31", "BB4", True, "E31's test names BB4's two legs (the RAS drug in a second big tumor, or the vaccine in lung)"),
]


# ================================================================ helpers
def load_module(path, name):
    if not os.path.exists(path):
        raise SystemExit(f"Cannot find {path}. Give --repo REPO_ROOT.")
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def pdate(s, end=False):
    s = str(s)
    if len(s) == 7:
        y, m = int(s[:4]), int(s[5:7])
        return dt.date(y, m, calendar.monthrange(y, m)[1] if end else 1)
    return dt.date.fromisoformat(s[:10])


def fired(n):
    return str(n.get("status", "")).upper().startswith("FIRED") or n.get("odds_now") == 100


def points(ob):
    return sorted((pdate(k), k, float(v)) for k, v in (ob or {}).items() if v is not None)


def value_at(ob, d):
    """Linear interpolation inside the curve's range; None outside it."""
    p = points(ob)
    for (d0, _, v0), (d1, _, v1) in zip(p, p[1:]):
        if d0 <= d <= d1:
            return v0 + (v1 - v0) * (d - d0).days / max(1, (d1 - d0).days)
    if p and p[0][0] == d:
        return p[0][2]
    return None


def deadline(n, ob):
    """(deadline date, mode, value, key). mode: key (a curve point in the deadline month, on or before it),
    interp (between two points), first (the deadline is before every point; the first point covers it),
    append (the deadline is after every point; the curve has no value there)."""
    D = pdate(n["window_end"], end=True)
    p = points(ob)
    same = [x for x in p if (x[0].year, x[0].month) == (D.year, D.month) and x[0] <= D]
    if same:
        return D, "key", same[-1][2], same[-1][1]
    if p and p[0][0] > D:
        return D, "first", p[0][2], p[0][1]
    if p and p[-1][0] < D:
        return D, "append", None, None
    return D, "interp", value_at(ob, D), None


def cumulative(ob):
    v = [x[2] for x in points(ob)]
    return all(a <= b + 1e-9 for a, b in zip(v, v[1:]))


def tidy(n, ob, T, cum):
    """Deadline point = T; for a cumulative curve, earlier points <= T, later points >= T, non-decreasing;
    clamp 1..99; round to one decimal. Null points stay null."""
    D, mode, _, dkey = deadline(n, ob)
    out = dict(ob)
    if cum:
        for k, v in out.items():
            if v is None:
                continue
            d = pdate(k)
            if k == dkey:
                out[k] = T
            elif d < D:
                out[k] = min(v, T)
            elif d > D:
                out[k] = max(v, T)
        run = None
        for d, k, v in points(out):
            run = v if run is None else max(run, v)
            out[k] = run
    for k, v in out.items():
        if v is not None:
            out[k] = round(min(ODDS_MAX, max(ODDS_MIN, v)), 1)
    return dict(sorted(out.items()))


def rescale(n, ob, T, explicit=None):
    """Proportional rescale so the deadline value equals T. Explicit points are set as given; every other point
    takes the ratio of its nearest anchor (the deadline, or an explicit point), ties to the deadline."""
    explicit = explicit or {}
    cum = cumulative(ob)
    D, mode, V, dkey = deadline(n, ob)
    new = dict(ob)
    if mode == "append":
        new[pdate(n["window_end"], True).isoformat()] = T
        for k, E in explicit.items():
            new[k] = E
        return tidy(n, new, T, cum), mode, V
    f = T / V if V else 1.0
    anchors = [(D, f, 0)]
    for k, E in explicit.items():
        old = ob.get(k)
        if old not in (None, 0):
            anchors.append((pdate(k), E / float(old), 1))
    for k, v in ob.items():
        if v is None or k in explicit:
            continue
        d = pdate(k)
        r = min(anchors, key=lambda a: (abs((a[0] - d).days), a[2]))[1]
        new[k] = float(v) * r
    for k, E in explicit.items():
        new[k] = E
    return tidy(n, new, T, cum), mode, V


def check_curve(n, ob, T, changed):
    """The deadline value equals the target on every live curve. A curve this script changed is also held to
    1..99 and, when cumulative, non-decreasing (an untouched curve may keep a point such as 0.5)."""
    D, mode, V, _ = deadline(n, ob)
    probs = []
    if V is None or abs(V - T) > TOL:
        probs.append(f"deadline value {V} != target {T}")
    if changed and any(not (ODDS_MIN <= x[2] <= ODDS_MAX) for x in points(ob)):
        probs.append("point outside 1..99")
    return probs


def write_graph(g, target):
    folder = os.path.dirname(os.path.abspath(target))
    fd, tmp = tempfile.mkstemp(dir=folder, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(g, f, indent=1, ensure_ascii=False)
        if os.path.exists(target):
            import shutil
            shutil.copymode(target, tmp)
        os.replace(tmp, target)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


# ================================================================ main
def main(argv=None):
    p = argparse.ArgumentParser(description="One-time Earth2 rebase, structure only.")
    p.add_argument("graph")
    p.add_argument("--updates", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "updates.json"))
    p.add_argument("--repo")
    p.add_argument("--changes")
    p.add_argument("--dry-run", action="store_true")
    a = p.parse_args(argv)
    repo = a.repo or os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(a.graph)))))
    sc = load_module(os.path.join(repo, "earth2", "scorecard.py"), "earth2_scorecard")
    plumb = load_module(os.path.join(repo, "earth2", "plumbing_2026-11-25.py"), "earth2_plumbing_2026_11_25")

    with open(a.graph, encoding="utf-8") as f:
        g = json.load(f)
    sc.enforce_lock(g, tool="apply_rebase.py")
    if any(m.get("short_name") == TAG for m in g.get("merges", []) or []):
        raise SystemExit(f"Already applied: graph['merges'] holds the '{TAG}' entry.")
    issue = sc.stamp_problem(g)
    if issue:
        raise SystemExit("REBASE REFUSED. " + issue)
    with open(a.updates, encoding="utf-8") as f:
        ups = json.load(f)

    changes = []  # every change: {id, field, before, after, basis, source, part}

    def note(nid, field, before, after, basis, source, part):
        changes.append({"id": nid, "field": field, "before": before, "after": after, "basis": basis,
                        "source": source, "part": part})
        b = json.dumps(before, ensure_ascii=False) if not isinstance(before, str) else before
        c = json.dumps(after, ensure_ascii=False) if not isinstance(after, str) else after
        print(f"  [{part}] {nid}.{field}: {b[:140]} -> {c[:140]}")

    odds_before = {n["id"]: n.get("odds_now") for n in g["nodes"]}
    log = {"date": DATE, "short_name": TAG, "kind": "rebase structure", "applied_by": "apply_rebase.py",
           "survivor_odds_rule": ("The survivor keeps its own odds_now (the session 1 plumbing precedent). The copy's "
                                  "odds_now, curve, window and odds_history are kept on the survivor under folded_from. "
                                  "Re-rates of survivors come only from updates.json through cascade.py --rebase.")}

    # ---- 1. folds, with the plumbing fold function
    print("1. FOLDS (survivor keeps its own odds_now)")
    nodes = {n["id"]: n for n in g["nodes"]}
    snap = {old: copy.deepcopy(nodes[old]) for old, _, _ in FOLDS}
    for old, surv, _ in FOLDS:
        if old not in nodes or surv not in nodes:
            raise SystemExit(f"fold {old} -> {surv}: missing node")
    plumb.FOLDS = FOLDS
    plumb.TODAY = DATE
    plumb.twin_folds = lambda g_, explicit: []
    plumb.fold_all(g, log)
    nodes = {n["id"]: n for n in g["nodes"]}
    for rec in log["folds"]:
        old, surv = rec["old_id"], rec["survivor_id"]
        c, s = snap[old], nodes[surv]
        ff = s["folded_from"][-1]
        for k, v in c.items():  # the copy's full record
            if k not in ff:
                ff[k] = copy.deepcopy(v)
        carried = []
        for k in CARRY:
            if k in ("settlement_test", "who_it_hits_text", "next_watch") and k in rec["fields_added"]:
                carried.append(k)
                continue
            if c.get(k) not in (None, "", [], {}) and s.get(k) in (None, "", [], {}):
                s[k] = copy.deepcopy(c[k])
                carried.append(k)
        rec["fields_carried"] = carried
        note(surv, "fold", old, surv, rec["reason"], "plumbing precedent; " + ("G2_report.md section 2a item 6" if old == "R6" else
             "G1_report.md section 4(a) item 9" if old in ("E12", "E17") else "G3_report.md section 6(a) item 2"), "A2")
        print(f"     {old} -> {surv}: links repointed {rec['links_repointed']}, dropped {len(rec['links_dropped'])}, "
              f"companies {rec['companies_repointed']}, carried {carried}")
        for d in rec["links_dropped"]:
            print(f"       dropped {d['link']['source']}->{d['link']['target']} ({d['why']})")
    log["not_folded"] = NOT_FOLDED
    for nf in NOT_FOLDED:
        print(f"     NOT FOLDED {nf['pair']}: {nf['why'][:160]}...")

    # ---- 2. text and window fixes
    print("2. TEXT AND WINDOW FIXES")
    log["text_changes"] = []
    for nid, field, val, why, src in TEXT:
        n = nodes[nid]
        before = n.get(field)
        if before == val:
            continue
        n[field] = val
        part = "A5" if why.startswith("A5") or field in ("next_watch", "date_catalyst", "window_peak") or nid == "HP07" else "A4"
        note(nid, field, before, val, why, src, part)
        log["text_changes"].append({"id": nid, "field": field, "before": before, "after": val, "why": why, "source": src})
        if field.startswith("window_"):
            w = (n["window_start"], n["window_peak"], n["window_end"])
            if not (w[0] <= w[1] <= w[2]):
                raise SystemExit(f"{nid}: window out of order after the fix {w}")

    # ---- 3. the link fix
    print("3. LINK FIX")
    hit = [e for e in g["links"] if e["source"] == LINK_FIX["source"] and e["target"] == LINK_FIX["target"]]
    if len(hit) != 1 or hit[0].get("kind") != LINK_FIX["kind_from"]:
        raise SystemExit(f"link {LINK_FIX['source']}->{LINK_FIX['target']}: expected one {LINK_FIX['kind_from']} link, found {hit}")
    e = hit[0]
    before = {"kind": e["kind"], "reason": e.get("reason")}
    e["kind"], e["reason"] = LINK_FIX["kind_to"], LINK_FIX["reason"]
    note(f"{e['source']}->{e['target']}", "kind", before["kind"], e["kind"], LINK_FIX["why"], LINK_FIX["source_doc"], "LINK")
    log["link_changes"] = [{"source": e["source"], "target": e["target"], "before": before,
                            "after": {"kind": e["kind"], "reason": e["reason"]}, "why": LINK_FIX["why"],
                            "odds_then": {e["source"]: nodes[e["source"]].get("odds_now"), e["target"]: nodes[e["target"]].get("odds_now")}}]

    # ---- 4. curves
    print("4. CURVES (deadline value = target odds; rest rescaled; cumulative curves non-decreasing; 1 to 99)")
    target = {nid: n.get("odds_now") for nid, n in nodes.items()}
    for u in ups:
        if u["id"] not in nodes:
            raise SystemExit(f"updates.json names {u['id']}, which is not a node after the folds (use surviving ids)")
        if not str(u.get("reason", "")).startswith(PREFIX):
            raise SystemExit(f"updates.json row {u['id']}: reason must start with '{PREFIX}'")
        target[u["id"]] = float(u["new_odds"])
    rerated = {u["id"] for u in ups}
    log["curve_changes"] = []
    curve_before = {}
    modes = {}
    for nid, n in nodes.items():
        ob = n.get("odds_by")
        if not ob or n.get("odds_now") is None or fired(n) or not any(v is not None for v in ob.values()):
            continue
        T = float(target[nid])
        explicit = CURVE_SET.get(nid, ({},))[0]
        D, mode, V, _ = deadline(n, ob)
        needs = explicit or V is None or abs(V - T) > 0.05
        if not needs:
            continue
        new, mode, V = rescale(n, ob, T, explicit)
        modes[nid] = (mode, V)
        if new != dict(sorted(ob.items())):
            curve_before.setdefault(nid, copy.deepcopy(ob))
            n["odds_by"] = new
    for nid, (pts_, why, src) in CURVE_FLOOR.items():
        n = nodes[nid]
        ob = dict(n["odds_by"])
        curve_before.setdefault(nid, copy.deepcopy(ob))
        for k, v in pts_.items():
            ob[k] = max(float(ob.get(k) or 0), v)
        n["odds_by"] = tidy(n, ob, float(target[nid]), True)
    # D5 floor point from HP11
    nid, k, src_id, why, src = D5_FLOOR
    n = nodes[nid]
    ob = dict(n["odds_by"])
    curve_before.setdefault(nid, copy.deepcopy(ob))
    floor = float(target[src_id])
    cur = value_at(ob, pdate(k))
    if cur is None or cur < floor:
        ob[k] = floor
        n["odds_by"] = tidy(n, ob, float(target[nid]), True)
    # containment: a part's curve may not sit above its whole's at any curve date
    flags = []
    contained = set()
    for _ in range(4):
        moved = False
        for whole, part, may_cap, why_c in CONTAIN:
            W, P = nodes[whole], nodes[part]
            if not W.get("odds_by") or not P.get("odds_by"):
                continue
            Tw, Tp = float(target[whole]), float(target[part])
            Dw, _, _, wkey = deadline(W, W["odds_by"])
            Dp, _, _, pkey = deadline(P, P["odds_by"])
            dates = sorted({x[0] for x in points(W["odds_by"])} | {x[0] for x in points(P["odds_by"])})
            for d in dates:
                vw, vp = value_at(W["odds_by"], d), value_at(P["odds_by"], d)
                if vw is None or vp is None or vw >= vp - 0.05:
                    continue
                pk = next((k2 for dd, k2, _ in points(P["odds_by"]) if dd == d), None)
                wk = next((k2 for dd, k2, _ in points(W["odds_by"]) if dd == d), None)
                if may_cap and pk and d > Dp and pk != pkey:
                    curve_before.setdefault(part, copy.deepcopy(P["odds_by"]))
                    ob = dict(P["odds_by"])
                    ob[pk] = round(vw, 1)
                    P["odds_by"] = tidy(P, ob, Tp, cumulative(ob))
                    contained.add(part)
                    moved = True
                elif wk and wk != wkey and (d > Dw or vp <= Tw):
                    curve_before.setdefault(whole, copy.deepcopy(W["odds_by"]))
                    ob = dict(W["odds_by"])
                    ob[wk] = round(vp, 1)
                    W["odds_by"] = tidy(W, ob, Tw, cumulative(ob))
                    contained.add(whole)
                    moved = True
                else:
                    f_ = f"{whole} >= {part} broken at {d}: {whole} {vw:.1f} vs {part} {vp:.1f} ({why_c})"
                    if f_ not in flags:
                        flags.append(f_)
        if not moved:
            break
    # record every curve change, with its basis
    survivors = {r["survivor_id"] for r in log["folds"]}
    a3_named = {"O6", "BB2", "D1", "D2", "J5"}  # A3: curves against their own odds
    for nid, ob0 in sorted(curve_before.items()):
        n = nodes[nid]
        if dict(sorted(ob0.items())) == n["odds_by"]:
            continue
        mode = modes.get(nid, ("", None))
        bits, parts, srcs = [], [], []
        if nid in rerated:
            bits.append(f"curve follows the re-rate in updates.json to {target[nid]:g}")
            parts.append("B")
        elif nid in survivors:
            bits.append(f"fold survivor: the copy's curve rescaled to the survivor's own odds {target[nid]:g}")
            parts.append("A2")
        elif mode[0]:
            v = "none" if mode[1] is None else f"{mode[1]:.1f}"
            bits.append(f"curve value at the deadline ({v}, read as '{mode[0]}') did not equal odds_now {target[nid]:g}")
            parts.append("A3" if nid in a3_named else "CURVE")
            srcs.append("MY CALLS curve rule (task brief)" + ("; G1_report.md section 4(a) item 8" if nid in ("D1", "D2", "J5") else
                        "; G2_report.md section 2a item 2" if nid == "O6" else "; G4_report.md section 3b row BB2" if nid == "BB2" else ""))
        if nid in a3_named and "A3" not in parts:
            parts.append("A3")
            srcs.append("G1_report.md section 4(a) item 8" if nid in ("D1", "D2", "J5") else "MY CALLS curve rule (task brief)")
        if nid in CURVE_SET:
            bits.append(CURVE_SET[nid][1]); parts.append("B"); srcs.append(CURVE_SET[nid][2])
        if nid in CURVE_FLOOR:
            bits.append(CURVE_FLOOR[nid][1]); parts.append("B"); parts.append("A3"); srcs.append(CURVE_FLOOR[nid][2])
        if nid == D5_FLOOR[0]:
            bits.append(D5_FLOOR[3]); parts.append("A3"); srcs.append(D5_FLOOR[4])
        if nid in contained:
            bits.append("A3 containment: a part is at most its whole (" + "; ".join(
                f"{w} >= {p_}" for w, p_, _, _ in CONTAIN if nid in (w, p_)) + ")")
            parts.append("A3"); srcs.append("MY CALLS contradiction rule (task brief)")
        if nid in survivors and "A2" not in parts:
            parts.append("A2")
        src = "; ".join(dict.fromkeys(x for x in srcs if x)) or "MY CALLS curve rule (task brief)"
        part = ", ".join(dict.fromkeys(parts)) or "CURVE"
        note(nid, "odds_by", ob0, n["odds_by"], "; ".join(bits), src, part)
        log["curve_changes"].append({"id": nid, "before": ob0, "after": n["odds_by"], "why": "; ".join(bits),
                                     "source": src, "target_odds": target[nid]})
    # check every live curve against its target
    bad = []
    for nid, n in nodes.items():
        ob = n.get("odds_by")
        if not ob or n.get("odds_now") is None or fired(n) or not any(v is not None for v in ob.values()):
            continue
        pr = check_curve(n, ob, float(target[nid]), nid in curve_before)
        if pr:
            bad.append(f"{nid}: {'; '.join(pr)}")
    if bad:
        raise SystemExit("curve check failed:\n  " + "\n  ".join(bad))
    log["flags"] = flags
    for f_ in flags:
        print("  FLAG " + f_)

    # ---- 5. odds unchanged, stamp, log, write
    for n in g["nodes"]:
        if n.get("odds_now") != odds_before.get(n["id"]):
            raise SystemExit(f"odds changed on {n['id']}")
    g.setdefault("merges", []).append(log)
    m = g["meta"]
    m["version"] = "v5.4"
    m["title"] = "Earth2 graph v5.4"
    m.setdefault("v5_4_changes", []).extend([
        f"Rebase Nov 25 (structure): {len(log['folds'])} duplicates folded into the 62-event majors (alias map in merges; "
        f"28-3 and C4 not folded, they are not the same event).",
        f"{len(log['curve_changes'])} curves rescaled so each deadline value equals the node's odds after the rebase.",
        f"{len(log['text_changes'])} settlement test, label, date and window fixes; link 28-1 to 29-3 relabelled LIKELY.",
        "The odds re-rates themselves are one cascade.py --rebase run (no hops), logged in cascade_log with kind rebase.",
    ])
    have, want = m.get("odds_stamp"), sc.odds_stamp(g["nodes"])
    if have != want:
        now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
        reason = (f"Rebase Nov 25 folds removed {len(log['folds'])} nodes ({', '.join(r['old_id'] for r in log['folds'])}); "
                  "no odds_now changed on any surviving node (apply_rebase.py checks it before writing).")
        g.setdefault("cascade_log", []).append({
            "date": DATE, "run_at": now.isoformat(), "kind": "restamp", "reason": reason,
            "source": "apply_rebase.py", "stamp_before": have, "stamp_after": want,
            "odds_not_matching_history": sc.odds_off_history(g), "trigger": [], "moved": [], "skipped": [], "queue": []})
        m["odds_stamp"] = want
        print(f"5. ODDS STAMP reset {have} -> {want} (logged in cascade_log as kind restamp)")
    print(f"SUMMARY folds {len(log['folds'])}, text and window fixes {len(log['text_changes'])}, link fixes 1, "
          f"curve changes {len(log['curve_changes'])}, flags {len(flags)}; odds_now unchanged on every surviving node")
    if a.changes:
        with open(a.changes, "w", encoding="utf-8") as f:
            json.dump({"changes": changes, "flags": flags, "folds": log["folds"], "not_folded": NOT_FOLDED}, f,
                      indent=1, ensure_ascii=False)
    if a.dry_run:
        print("DRY RUN: nothing written.")
        return 0
    write_graph(g, a.graph)
    print(f"WROTE {a.graph}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
