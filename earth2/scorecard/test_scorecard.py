#!/usr/bin/env python3
"""
earth2/scorecard/test_scorecard.py
Tests for the Earth2 scorecard, the question lock, the odds stamp and the gate on new main events.
Python 3.8+, standard library only. Test 8 also uses node and headless Chrome (through playwright) when
they are installed, and is skipped with a plain message when they are not.

  python3 earth2/scorecard/test_scorecard.py

Every test works on a temporary copy of the repo's Earth2 files. The repo files are never written;
the last test proves it by comparing every file with its hash from the start of the run.

The tests do not depend on what the live scorecard holds. Each temp copy is reset to a blank state first:
no questions, no misses, no judgment_tags or base_rate on any node, a fresh odds stamp, and a legacy list
rebuilt from the copied graph. Only the "real files" tests (Test9) read the live, populated files as they are.
"""
import datetime as dt
import functools
import hashlib
import http.server
import importlib.util
import itertools
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import unittest

sys.dont_write_bytecode = True
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GRAPH = "public/future/earth2/graph.json"
QUESTIONS = "earth2/scorecard/questions.json"
PUBLIC = "public/future/earth2/scorecard.json"
SC = "earth2/scorecard.py"
CASCADE = "earth2/cascade.py"
VALIDATE = "earth2/validate_graph.py"
MERGE = "earth2/deepdives/merge_nodes.py"
TEMPLATE = "earth2/templates/arm_template.json"
MISSES = "earth2/scorecard/misses.json"
CORRECTIONS = "earth2/scorecard/corrections.json"
LEGACY = "earth2/scorecard/legacy_main_events.json"
COPY = [SC, CASCADE, VALIDATE, MERGE, QUESTIONS, MISSES, CORRECTIONS, LEGACY, TEMPLATE, "earth2/templates/README.md",
        GRAPH, PUBLIC, "public/future/earth2/index.html"]
TODAY = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=7)).date()  # America/Phoenix
_n = itertools.count(1)


def day(offset):
    return (TODAY + dt.timedelta(days=offset)).isoformat()


def tree_hashes():
    out = {}
    for top in ("earth2", os.path.join("public", "future", "earth2")):
        for folder, _, files in os.walk(os.path.join(REPO, top)):
            for name in files:
                path = os.path.join(folder, name)
                with open(path, "rb") as f:
                    out[os.path.relpath(path, REPO)] = hashlib.sha256(f.read()).hexdigest()
    return out


START = tree_hashes()


def fresh(case, vendor=False, live=False):
    """A temp copy of the Earth2 files. Reset to a blank state unless live is true (the real-files tests)."""
    root = tempfile.mkdtemp(prefix="earth2_test_")
    case.addCleanup(shutil.rmtree, root, True)
    for rel in COPY:
        os.makedirs(os.path.dirname(os.path.join(root, rel)), exist_ok=True)
        shutil.copy2(os.path.join(REPO, rel), os.path.join(root, rel))
    if vendor:
        shutil.copytree(os.path.join(REPO, "public/future/earth2/vendor"), os.path.join(root, "public/future/earth2/vendor"))
    if not live:
        blank(root)
    return root


def blank(root):
    """The same starting point whatever the repo holds: an empty scorecard on an untagged, freshly stamped graph."""
    mod = module(root)
    g = load(root, GRAPH)
    for n in g["nodes"]:
        n.pop("judgment_tags", None)
        n.pop("base_rate", None)
    g["meta"]["odds_stamp"] = mod.odds_stamp(g["nodes"])
    save(root, GRAPH, g)
    save(root, QUESTIONS, {"version": 1, "questions": []})
    save(root, MISSES, {"version": 1, "misses": []})
    events = {n["id"]: mod.node_gaps(n) for n in sorted(g["nodes"], key=lambda n: n["id"]) if mod.is_main_event(n)}
    save(root, LEGACY, {"version": 1, "as_of": day(0), "what": "test copy: every main event in the copied graph",
                        "gap_fields": mod.GAP_FIELDS, "events": events})
    mod.write_score([], quiet=True)


def run(root, script, *args, env=None):
    e = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
    e.update(env or {})
    r = subprocess.run([sys.executable, os.path.join(root, script)] + [str(x) for x in args], cwd=root,
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True, env=e)
    return r.returncode, r.stdout


def load(root, rel):
    with open(os.path.join(root, rel), encoding="utf-8") as f:
        return json.load(f)


def save(root, rel, obj):
    with open(os.path.join(root, rel), "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)


def sha(root, rel):
    with open(os.path.join(root, rel), "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def module(root):
    spec = importlib.util.spec_from_file_location("sc_" + os.path.basename(root), os.path.join(root, SC))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def live_mid(n, low=10, high=80):
    """A node that is live with odds in the middle, so a test can move it either way."""
    o = n.get("odds_now")
    return o is not None and low <= o <= high and not str(n.get("status", "")).upper().startswith("FIRED")


with open(os.path.join(REPO, GRAPH), encoding="utf-8") as _f:
    _REAL = json.load(_f)
_ENDS = [n["id"] for n in _REAL["nodes"] if n.get("type") == "END EVENT" and live_mid(n, 20, 90)]
EVENT = "27-5" if "27-5" in _ENDS else _ENDS[0]  # a live end event; the tests hang their questions on it
del _REAL, _f


def question(event=EVENT, due=None, written=None, odds=40, tags=("timing",), side="YES", **kw):
    q = {"event_id": event, "path_node": None, "text": f"Test question {next(_n)}: did the dated step arrive?",
         "test": "YES when the named source shows it on or before the due date.", "source": "Test source",
         "tags": list(tags), "script_side": side, "due": due or day(10), "odds_locked": odds,
         "odds_basis": "test fixture", "market": None, "consensus": None, "kind": "live"}
    if written:
        q["written"] = written
    q.update(kw)
    return q


def backfilled(outcome, odds, side="YES", tags=("timing",), event=EVENT, **kw):
    q = question(event=event, due=day(-20), odds=odds, tags=tags, side=side, kind="backfilled")
    q.update({"outcome": outcome, "settled_as_of": day(-21), "evidence": "The source showed it.",
              "evidence_source": "Test source", "odds_date": day(-30)})
    q.update(kw)
    return q


def import_seed(case, root, expect=0, **parts):
    path = os.path.join(root, "seed_%d.json" % next(_n))
    with open(path, "w", encoding="utf-8") as f:
        json.dump(parts, f)
    code, out = run(root, SC, "import-seed", path)
    case.assertEqual(code, expect, out)
    return out


def by_id(root, qid):
    return next(q for q in load(root, QUESTIONS)["questions"] if q["id"] == qid)


def timing_ten():
    """Ten backfilled timing answers whose mean signed error is exactly +12.0 points and Brier 0.26."""
    return ([backfilled("YES", 70) for _ in range(5)] + [backfilled("NO", 70) for _ in range(3)]
            + [backfilled("NO", 20, side="NO"), backfilled("YES", 20, side="NO")])


class Test1Lock(unittest.TestCase):
    def test_overdue_blocks_and_a_late_answer_releases(self):
        root = fresh(self)
        self.assertEqual(run(root, VALIDATE, GRAPH)[0], 0)
        import_seed(self, root, questions=[question(written=day(-10), due=day(-3))])
        graph_before = sha(root, GRAPH)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 3, out)
        self.assertIn("EARTH2 IS LOCKED", out)
        self.assertIn("Q-0001", out)
        self.assertIn(f"python3 earth2/scorecard.py settle Q-0001 --outcome YES_OR_NO --as-of {day(-3)}", out)
        modes = [["--collisions"], ["--set", "D4=40", "--date", day(0), "--reason", "test", "--dry-run"],
                 ["--set", "D4=40", "--date", day(0), "--reason", "test"], ["--restamp", "--reason", "test"]]
        for args in modes:
            code, out = run(root, CASCADE, GRAPH, *args)
            self.assertEqual(code, 3, (args, out))
            self.assertIn("EARTH2 IS LOCKED", out)
            self.assertIn("scorecard.py settle Q-0001", out)
        code, out = run(root, MERGE, GRAPH, TEMPLATE, "--dry-run")
        self.assertEqual(code, 3, out)
        # no flag and no environment variable gets around it
        for flag in ("--force", "--no-lock", "--skip-lock", "--unlock"):
            self.assertNotEqual(run(root, CASCADE, GRAPH, "--collisions", flag)[0], 0)
            self.assertNotEqual(run(root, VALIDATE, GRAPH, flag)[0], 0)
        env = {"EARTH2_NO_LOCK": "1", "EARTH2_SKIP_LOCK": "1", "EARTH2_TODAY": "2020-01-01", "SKIP_LOCK": "1", "FORCE": "1"}
        self.assertEqual(run(root, VALIDATE, GRAPH, env=env)[0], 3)
        self.assertEqual(run(root, CASCADE, GRAPH, "--collisions", env=env)[0], 3)
        for rel in (SC, CASCADE, VALIDATE, MERGE):
            with open(os.path.join(root, rel), encoding="utf-8") as f:
                src = f.read()
            self.assertFalse(re.search(r"os\.environ|getenv\(|putenv\(", src), rel + " reads the environment")
        self.assertEqual(sha(root, GRAPH), graph_before)
        # a missing questions file is a lock, not an empty scorecard
        os.rename(os.path.join(root, QUESTIONS), os.path.join(root, QUESTIONS + ".away"))
        self.assertEqual(run(root, VALIDATE, GRAPH)[0], 3)
        self.assertEqual(run(root, CASCADE, GRAPH, "--collisions")[0], 3)
        os.rename(os.path.join(root, QUESTIONS + ".away"), os.path.join(root, QUESTIONS))
        # the scorecard itself is never blocked
        code, out = run(root, SC, "due")
        self.assertEqual(code, 0, out)
        self.assertIn("OVERDUE (1)", out)
        self.assertIn("3 days late", out)
        # what happened after the due date does not count
        code, out = run(root, SC, "settle", "Q-0001", "--outcome", "NO", "--as-of", day(-1), "--source", "Test source", "--evidence", "x")
        self.assertEqual(code, 2, out)
        code, out = run(root, SC, "settle", "Q-0001", "--outcome", "NO", "--as-of", day(-3), "--source", "Test source",
                        "--evidence", "The source showed no such step by the due date.")
        self.assertEqual(code, 0, out)
        self.assertIn("LATE", out)
        q = by_id(root, "Q-0001")
        self.assertEqual((q["status"], q["outcome"], q["due"], q["due_current"], q["settled_as_of"], q["answered_on"], q["late"]),
                         ("SETTLED", "NO", day(-3), day(-3), day(-3), day(0), True))
        self.assertEqual(run(root, VALIDATE, GRAPH)[0], 0)
        self.assertEqual(run(root, CASCADE, GRAPH, "--collisions")[0], 0)
        code, out = run(root, CASCADE, GRAPH, "--set", "D4=40", "--date", day(0), "--reason", "test", "--dry-run")
        self.assertEqual(code, 0, out)
        # an answer is recorded once
        self.assertEqual(run(root, SC, "settle", "Q-0001", "--outcome", "YES", "--as-of", day(-3), "--source", "s", "--evidence", "e")[0], 2)


class Test2LockedFields(unittest.TestCase):
    def test_hand_edits_to_a_question_fail_the_validator(self):
        root = fresh(self)
        base = ["add", "--event", EVENT, "--text", "Will the market number hold?", "--test", "YES when it holds.",
                "--source", "Test source", "--script-side", "YES", "--due", day(10), "--odds", "40", "--odds-basis", "fixture"]
        code, out = run(root, SC, *base, "--tags", "market")
        self.assertEqual(code, 2, out)
        self.assertIn("tag market needs market", out)
        code, out = run(root, SC, *base, "--tags", "pace")
        self.assertEqual(code, 2, out)
        self.assertIn("tag pace needs consensus", out)
        self.assertEqual(run(root, SC, *base, "--tags", "speed")[0], 2)
        self.assertEqual(run(root, SC, *(base[:-3] + ["40.5", "--odds-basis", "fixture"]), "--tags", "timing")[0], 2)
        code, out = run(root, SC, *base, "--tags", "market,timing", "--market-odds", "25", "--market-source", "Test market",
                        "--market-as-of", day(0))
        self.assertEqual(code, 0, out)
        self.assertEqual(run(root, VALIDATE, GRAPH)[0], 0)
        good = load(root, QUESTIONS)
        self.assertEqual(good["questions"][0]["tags"], ["timing", "market"])
        self.assertEqual(good["questions"][0]["arm"], next(n["arm"] for n in load(root, GRAPH)["nodes"] if n["id"] == EVENT))

        def edited(change):
            doc = json.loads(json.dumps(good))
            change(doc["questions"][0])
            save(root, QUESTIONS, doc)
            code, out = run(root, VALIDATE, GRAPH)
            save(root, QUESTIONS, good)
            return code, out

        code, out = edited(lambda q: q.update(odds_locked=q["odds_locked"] + 5))
        self.assertEqual(code, 1, out)
        self.assertIn("Q-0001: LOCK BROKEN", out)
        code, out = edited(lambda q: q.update(due=day(40), due_current=day(40)))
        self.assertEqual(code, 1, out)
        self.assertIn("Q-0001: LOCK BROKEN", out)
        code, out = edited(lambda q: q.update(due_current=day(40)))
        self.assertEqual(code, 1, out)
        self.assertIn("moves only by defer", out)
        code, out = edited(lambda q: q["market"].update(odds=60))
        self.assertEqual(code, 1, out)
        self.assertIn("LOCK BROKEN", out)
        code, out = edited(lambda q: q.update(text=q["text"] + " (reworded)"))
        self.assertIn("LOCK BROKEN", out)
        code, out = edited(lambda q: q.update(event_id="DA1"))  # a tree trigger with a board_reference
        self.assertEqual(code, 1, out)
        self.assertIn("event_id 'DA1' is not a main event", out)
        # a hand edit to an unlocked field still shows: the page file no longer matches
        code, out = edited(lambda q: q.update(odds_basis="changed by hand"))
        self.assertEqual(code, 0, out)
        code, out = edited(lambda q: q.update(status="VOID", void_reason="quietly dropped", answered_on=day(0)))
        self.assertEqual(code, 1, out)
        self.assertIn("run python3 earth2/scorecard.py score", out)
        # the engine refuses to run on a broken questions file
        doc = json.loads(json.dumps(good))
        doc["questions"][0]["odds_locked"] = 90
        save(root, QUESTIONS, doc)
        code, out = run(root, CASCADE, GRAPH, "--collisions")
        self.assertEqual(code, 3, out)
        self.assertIn("LOCK BROKEN", out)
        save(root, QUESTIONS, good)
        self.assertEqual(run(root, VALIDATE, GRAPH)[0], 0)


class Test3OddsStamp(unittest.TestCase):
    def test_hand_edit_to_odds_fails_and_restamp_fixes_and_logs(self):
        root = fresh(self)
        g = load(root, GRAPH)
        stamp0 = g["meta"]["odds_stamp"]
        node, other = [n for n in g["nodes"] if n.get("model_layer") == "board" and live_mid(n)][:2]
        edited, move = node["id"], "%s=%s" % (other["id"], other["odds_now"] + 7)
        node["odds_now"] = node["odds_now"] + 5
        save(root, GRAPH, g)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 1, out)
        self.assertIn("Odds were edited outside the engine", out)
        self.assertIn(edited, out)
        self.assertIn("--restamp --reason", out)
        code, out = run(root, CASCADE, GRAPH, "--set", move, "--date", day(0), "--reason", "test", "--dry-run")
        self.assertEqual(code, 4, out)
        self.assertIn("CASCADE REFUSED", out)
        code, out = run(root, MERGE, GRAPH, TEMPLATE, "--dry-run")
        self.assertEqual(code, 2, out)
        self.assertIn("Odds were edited outside the engine", out)
        code, out = run(root, CASCADE, GRAPH, "--restamp")
        self.assertNotEqual(code, 0, out)
        self.assertIn("--reason", out)
        log_before = len(g["cascade_log"])
        code, out = run(root, CASCADE, GRAPH, "--restamp", "--reason", "test repair of one node")
        self.assertEqual(code, 0, out)
        g2 = load(root, GRAPH)
        entry = g2["cascade_log"][-1]
        self.assertEqual(len(g2["cascade_log"]), log_before + 1)
        self.assertEqual((entry["kind"], entry["reason"], entry["stamp_before"]), ("restamp", "test repair of one node", stamp0))
        self.assertEqual(entry["stamp_after"], g2["meta"]["odds_stamp"])
        self.assertIn(edited, entry["odds_not_matching_history"])
        self.assertNotEqual(g2["meta"]["odds_stamp"], stamp0)
        self.assertEqual(run(root, VALIDATE, GRAPH)[0], 0)
        code, out = run(root, CASCADE, GRAPH, "--restamp", "--reason", "again")
        self.assertIn("already matches", out)
        self.assertEqual(len(load(root, GRAPH)["cascade_log"]), log_before + 1)
        # a real run stamps the graph itself
        code, out = run(root, CASCADE, GRAPH, "--set", move, "--date", day(0), "--reason", "test event", "--source", "test")
        self.assertEqual(code, 0, out)
        g3 = load(root, GRAPH)
        self.assertNotEqual(g3["meta"]["odds_stamp"], g2["meta"]["odds_stamp"])
        self.assertEqual(g3["meta"]["odds_stamp"], module(root).odds_stamp(g3["nodes"]))
        self.assertEqual(run(root, VALIDATE, GRAPH)[0], 0)
        # a missing stamp fails too
        del g3["meta"]["odds_stamp"]
        save(root, GRAPH, g3)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 1, out)
        self.assertIn("no odds stamp", out)


class Test4DeferAndVoid(unittest.TestCase):
    def test_defer_limits_and_void_left_out_of_the_score(self):
        root = fresh(self)
        import_seed(self, root, questions=[question(due=day(5)), question(written=day(-40), due=day(-30)),
                                           question(written=day(-9), due=day(-2)), question(written=day(-9), due=day(-2))])
        self.assertEqual(run(root, SC, "defer", "Q-0001", "--to", day(5 + 22), "--reason", "too far")[0], 2)
        self.assertEqual(run(root, SC, "defer", "Q-0001", "--to", day(5), "--reason", "same day")[0], 2)
        self.assertEqual(run(root, SC, "defer", "Q-0001", "--to", day(8), "--reason", " ")[0], 2)
        code, out = run(root, SC, "defer", "Q-0001", "--to", day(5 + 21), "--reason", "release moved by the agency")
        self.assertEqual(code, 0, out)
        code, out = run(root, SC, "defer", "Q-0001", "--to", day(5 + 42), "--reason", "moved again")
        self.assertEqual(code, 0, out)
        code, out = run(root, SC, "defer", "Q-0001", "--to", day(5 + 50), "--reason", "third time")
        self.assertEqual(code, 2, out)
        self.assertIn("2 is the limit", out)
        q = by_id(root, "Q-0001")
        self.assertEqual((q["due"], q["due_current"], len(q["deferrals"])), (day(5), day(5 + 42), 2))
        self.assertEqual(q["deferrals"][0], {"on": day(0), "from": day(5), "to": day(26), "reason": "release moved by the agency"})
        self.assertEqual(q["lock"], module(root).lock_hash(q))
        # a deferral cannot rescue a question that is a long way overdue
        code, out = run(root, SC, "defer", "Q-0002", "--to", day(-10), "--reason", "late")
        self.assertEqual(code, 2, out)
        self.assertIn("void it", out)
        # a hand-made third deferral fails the checks
        doc = load(root, QUESTIONS)
        doc["questions"][0]["deferrals"].append({"on": day(0), "from": day(47), "to": day(60), "reason": "by hand"})
        doc["questions"][0]["due_current"] = day(60)
        mod = module(root)
        self.assertTrue(any("at most 2" in p for p in mod.check_questions(doc)))
        # void: logged, shown, and left out of the score
        self.assertEqual(run(root, SC, "void", "Q-0002", "--reason", " ")[0], 2)
        code, out = run(root, SC, "void", "Q-0002", "--reason", "the series was discontinued")
        self.assertEqual(code, 0, out)
        run(root, SC, "settle", "Q-0003", "--outcome", "YES", "--as-of", day(-2), "--source", "Test source", "--evidence", "it arrived")
        self.assertEqual(run(root, SC, "void", "Q-0003", "--reason", "do not like the answer")[0], 2)
        pub = load(root, PUBLIC)
        self.assertEqual((pub["counts"]["void"], pub["counts"]["settled"], pub["overall"]["n"], pub["tags"]["timing"]["n"]), (1, 1, 1, 1))
        self.assertEqual(pub["counts"]["deferred"], 1)
        self.assertEqual(pub["counts"]["deferrals"], 2)
        void_row = next(r for r in pub["questions"] if r["id"] == "Q-0002")
        self.assertEqual((void_row["status"], void_row["void_reason"]), ("VOID", "the series was discontinued"))
        self.assertEqual(run(root, VALIDATE, GRAPH)[0], 3)  # Q-0004 is still overdue
        run(root, SC, "void", "Q-0004", "--reason", "test over")
        self.assertEqual(run(root, VALIDATE, GRAPH)[0], 0)
        self.assertEqual(load(root, PUBLIC)["overall"]["n"], 1)


class Test5Scoring(unittest.TestCase):
    def setUp(self):
        self.root = fresh(self)
        self.sc = module(self.root)

    def row(self, odds, outcome, side="YES", tags=("timing",), arm="ARM A", market=None, kind="live", status="SETTLED"):
        return {"id": "Q-%04d" % next(_n), "odds_locked": odds, "outcome": outcome if status == "SETTLED" else None,
                "script_side": side, "tags": list(tags), "arm": arm, "kind": kind, "status": status,
                "market": {"odds": market, "source": "m", "as_of": day(-30)} if market is not None else None,
                "consensus": {"value": "x", "source": "c", "as_of": day(-30)} if "pace" in tags else None,
                "late": False, "deferrals": []}

    def fixture(self):
        r = self.row
        timing = ([r(70, "YES", tags=("timing", "brakes")) for _ in range(3)] + [r(70, "YES"), r(70, "YES", kind="backfilled")]
                  + [r(70, "NO"), r(70, "NO"), r(70, "NO", kind="backfilled")] + [r(20, "NO", side="NO"), r(20, "YES", side="NO")])
        brakes = [r(40, "NO", tags=("brakes",), arm="ARM B") for _ in range(6)]
        market = [r(80, "YES", tags=("market",), arm="ARM B", market=50), r(30, "NO", tags=("market",), arm="ARM B", market=10)]
        pace = [r(60, "YES", tags=("pace",), arm="ARM B"), r(60, "NO", tags=("pace",), arm="ARM A")]
        void = [r(99, None, tags=("timing",), status="VOID"), r(50, None, tags=("actor",), status="OPEN")]
        return timing + brakes + market + pace + void

    def test_known_answers(self):
        qs = self.fixture()
        s = self.sc.compute_score(qs)
        self.assertEqual(s["overall"]["n"], 20)
        self.assertEqual(s["overall"]["brier"], 0.2105)
        self.assertEqual(s["overall"]["coin_flip"], 0.25)
        self.assertEqual(s["overall"]["mean_signed_error"], 19.5)
        self.assertEqual(s["overall"]["backfilled"], 2)
        t = s["tags"]["timing"]
        self.assertEqual((t["n"], t["mean_signed_error"], t["brier"], t["active"], t["needs"], t["backfilled"]), (10, 12.0, 0.26, True, 0, 2))
        b = s["tags"]["brakes"]
        self.assertEqual((b["n"], b["mean_signed_error"], b["brier"], b["active"], b["needs"]), (9, 16.7, 0.1367, False, 1))
        self.assertEqual((s["tags"]["actor"]["n"], s["tags"]["actor"]["active"], s["tags"]["actor"]["needs"]), (0, False, 10))
        # script side: a NO-side question at 20% that came in NO is 20 points under on its own script
        one = self.sc.compute_score([self.row(20, "NO", side="NO")])
        self.assertEqual((one["overall"]["mean_signed_error"], one["overall"]["brier"]), (-20.0, 0.04))
        one = self.sc.compute_score([self.row(20, "YES", side="NO")])
        self.assertEqual((one["overall"]["mean_signed_error"], one["overall"]["brier"]), (80.0, 0.64))
        # market comparison, on the questions that carry market odds
        m = s["market"]
        self.assertEqual((m["n"], m["earth2_brier"], m["market_brier"], m["earth2_closer"], m["market_closer"], m["ties"]), (2, 0.065, 0.13, 1, 1, 0))
        # per arm, and the pace share
        self.assertEqual((s["arms"]["ARM A"]["n"], s["arms"]["ARM A"]["active"]), (11, True))
        self.assertEqual((s["arms"]["ARM B"]["n"], s["arms"]["ARM B"]["mean_signed_error"], s["arms"]["ARM B"]["active"]), (9, 23.3, False))
        self.assertEqual((s["pace"]["n"], s["pace"]["share_sooner"]), (2, 50.0))
        self.assertEqual(s["pace"]["by_arm"]["ARM B"], {"n": 1, "share_sooner": 100.0})
        self.assertEqual((s["counts"]["void"], s["counts"]["open"], s["counts"]["settled"], s["counts"]["backfilled"]), (1, 1, 20, 2))
        # corrected odds: only the active tag counts; raw odds are never touched
        node = {"id": "X", "type": "END EVENT", "status": "ON TRACK", "odds_now": 43, "judgment_tags": ["timing", "brakes"]}
        self.assertEqual(self.sc.corrected_odds(node, s["tags"]), (31.0, [("timing", 12.0)]))
        self.assertEqual(node["odds_now"], 43)
        # a tenth brakes answer turns the tag active, and both tags now count
        s2 = self.sc.compute_score(qs + [self.row(40, "NO", tags=("brakes",), arm="ARM B")])
        self.assertEqual((s2["tags"]["brakes"]["n"], s2["tags"]["brakes"]["active"], s2["tags"]["brakes"]["mean_signed_error"]), (10, True, 19.0))
        self.assertEqual(self.sc.corrected_odds(node, s2["tags"])[0], 27.5)
        # clamped at 1 and at 99
        self.assertEqual(self.sc.corrected_odds(dict(node, odds_now=5), s["tags"])[0], 1.0)
        high = {"actor": {"active": True, "mean_signed_error": -20.0}}
        self.assertEqual(self.sc.corrected_odds(dict(node, odds_now=95, judgment_tags=["actor"]), high)[0], 99.0)
        # no correction for a fired event, a node that is not a main event, or an event with no active tag
        self.assertIsNone(self.sc.corrected_odds(dict(node, odds_now=100, status="FIRED 2026-11-01"), s["tags"]))
        self.assertIsNone(self.sc.corrected_odds(dict(node, type="LIKELY PRECURSOR"), s["tags"]))
        self.assertIsNone(self.sc.corrected_odds(dict(node, judgment_tags=["brakes"]), s["tags"]))

    def test_pace_share_follows_the_script_side(self):
        r, score = self.row, self.sc.compute_score
        # script side NO: a NO answer is the script's way, so it counts as sooner; a YES answer does not
        self.assertEqual(score([r(30, "NO", side="NO", tags=("pace",))])["pace"]["share_sooner"], 100.0)
        self.assertEqual(score([r(30, "YES", side="NO", tags=("pace",))])["pace"]["share_sooner"], 0.0)
        # script side YES: the other way round
        self.assertEqual(score([r(30, "YES", side="YES", tags=("pace",))])["pace"]["share_sooner"], 100.0)
        self.assertEqual(score([r(30, "NO", side="YES", tags=("pace",))])["pace"]["share_sooner"], 0.0)
        mixed = score([r(30, "NO", side="NO", tags=("pace",), arm="ARM A"), r(30, "YES", side="NO", tags=("pace",), arm="ARM A"),
                       r(60, "YES", side="YES", tags=("pace",), arm="ARM B"), r(60, "YES", tags=("timing",), arm="ARM B")])["pace"]
        self.assertEqual((mixed["n"], mixed["share_sooner"]), (3, 66.7))
        self.assertEqual(mixed["by_arm"], {"ARM A": {"n": 2, "share_sooner": 50.0}, "ARM B": {"n": 1, "share_sooner": 100.0}})
        self.assertIn("script side", mixed["rule"])

    def test_cli_score_and_cascade_show_corrected_odds(self):
        root = self.root
        stamp_before = load(root, GRAPH)["meta"]["odds_stamp"]
        legacy_before = load(root, LEGACY)["events"]
        import_seed(self, root, backfilled=timing_ten(), event_tags={EVENT: ["timing", "brakes"]},
                    legacy_base_rates={EVENT: {"value": 15, "reference_class": "test class", "source": "test count"}})
        code, out = run(root, SC, "score")
        self.assertEqual(code, 0, out)
        self.assertIn("timing    10    +12.0   0.2600  active", out)
        self.assertIn("brakes     0", out)
        pub = load(root, PUBLIC)
        self.assertEqual((pub["counts"]["backfilled"], pub["overall"]["backfilled"], pub["tags"]["timing"]["active"]), (10, 10, True))
        self.assertTrue(all(r["kind"] == "backfilled" and r["status"] == "SETTLED" for r in pub["questions"]))
        self.assertEqual(load(root, QUESTIONS)["questions"][0]["odds_date"], day(-30))
        g = load(root, GRAPH)
        node = next(n for n in g["nodes"] if n["id"] == EVENT)
        self.assertEqual(node["judgment_tags"], ["timing", "brakes"])
        self.assertEqual(node["base_rate"], {"value": 15, "reference_class": "test class", "source": "test count"})
        self.assertEqual(g["meta"]["odds_stamp"], stamp_before)  # structure only: no odds moved
        old = {n["id"]: n.get("odds_now") for n in load(REPO, GRAPH)["nodes"]}
        self.assertEqual({n["id"]: n.get("odds_now") for n in g["nodes"]}, old)
        legacy = load(root, LEGACY)
        self.assertEqual(sorted(legacy["events"]), sorted(legacy_before))
        self.assertEqual(legacy_before[EVENT][-2:], ["base_rate", "judgment_tags"])
        self.assertEqual(legacy["events"][EVENT], [x for x in legacy_before[EVENT] if x == "settlement_test"])
        self.assertEqual(run(root, VALIDATE, GRAPH)[0], 0)
        # push the event up through any live node that carries a move into it, and read its corrected line
        by = {n["id"]: n for n in g["nodes"]}
        pushers = sorted(((l["strength"], l["source"]) for l in g["links"] if l["target"] == EVENT and not l.get("display_only")
                          and l.get("strength") and l.get("sign", 1) > 0 and live_mid(by[l["source"]], 5, 85)), reverse=True)
        self.assertTrue(pushers, "no live node pushes " + EVENT)
        m = None
        for _, src in pushers:
            code, out = run(root, CASCADE, GRAPH, "--set", "%s=%s" % (src, by[src]["odds_now"] + 10), "--date", day(0), "--reason", "test", "--dry-run")
            self.assertEqual(code, 0, out)
            self.assertIn("CORRECTED ODDS", out)
            m = re.search(r"^\s+" + re.escape(EVENT) + r"\s+raw\s+([\d.]+)\s+corrected\s+([\d.]+)\s+\(timing \+12\.0 points off\)", out, re.M)
            if m:
                break
        self.assertTrue(m, out)
        raw, cor = float(m.group(1)), float(m.group(2))
        self.assertGreater(raw, node["odds_now"])
        self.assertEqual(cor, self.sc.half_up(min(99.0, max(1.0, raw - 12.0)), 1))
        self.assertEqual(load(root, GRAPH)["nodes"], g["nodes"])  # the dry run and the corrected number wrote nothing


def filled_example():
    with open(os.path.join(REPO, TEMPLATE), encoding="utf-8") as f:
        t = json.load(f)
    t.pop("_how_to_use")
    t["graph"].update(short_name="water arm test", origin="water arm test (A to about B, estimate)", created=day(0),
                      note="A test load of a new arm.", new_arms=["WATER AND RIVERS"])
    end, pre, co = t["nodes"]
    end.update(id="WR9", label="A federal order suspends a major river compact by Dec 2028", arm="WATER AND RIVERS",
               odds_now=12, status="ON TRACK", window_start=day(0), window_peak=day(200), window_end="2028-12-31",
               date_state="ESTIMATED", date_catalyst="No dated catalyst yet", peak_placeholder=True, layers_hit=["FOOD", "POWER"],
               least_capability="Two dry winters in a row", source="test fixture", next_watch="The next reservoir report",
               settlement_test="A federal order published in the Federal Register suspends the compact.",
               judgment_tags=["actor", "timing"],
               base_rate={"value": 5, "reference_class": "Interstate compacts suspended by federal order since 1950",
                          "source": "test count"},
               kill_condition="Reservoir storage above 60 percent of capacity on Oct 1, 2027.",
               kill_check="Bureau of Reclamation storage tables")
    pre.update(id="WR1", label="A shortage tier is declared on the river", arm="WATER AND RIVERS", odds_now=30,
               status="ON TRACK", window_start=day(0), window_peak=day(90), window_end="2027-12-31", date_state="SCHEDULED",
               peak_placeholder=False, layers_hit=["FOOD"], least_capability="One more dry winter", source="test fixture",
               settlement_test="The bureau's August study declares a shortage tier.")
    co.update(id="CO:ZZWTR", ticker="ZZWTR", name="Test Water Company", exchange="NYSE", listed_options="no",
              listed_options_basis="test fixture", nodes_on=["WR9"])
    t["links"][0].update(source="WR1", target="WR9", sign=1, strength=0.3, delay_days=30, kind="LIKELY",
                         reason="A declared shortage makes an order more likely (30, 12, about 33)")
    t["questions"][0].update(event_id="WR9", path_node="WR1", text="Will the August study declare a shortage tier?",
                             test="YES when the bureau's August study names a shortage tier.",
                             source="Bureau of Reclamation 24-month study", tags=["timing"], script_side="YES",
                             due=day(30), odds_locked=30, odds_basis="WR1 odds on the day of the load")
    return t


class Test6Gate(unittest.TestCase):
    def put(self, root, obj, name="test_arm_nodes_links.json"):
        rel = "earth2/deepdives/" + name
        save(root, rel, obj)
        return rel

    def test_blank_template_fails_with_a_clear_list(self):
        root = fresh(self)
        before = (sha(root, GRAPH), sha(root, QUESTIONS))
        code, out = run(root, MERGE, GRAPH, TEMPLATE)
        self.assertEqual(code, 2, out)
        line = next(x for x in out.splitlines() if "new main event is missing" in x)
        for field in ("settlement_test", "judgment_tags", "base_rate.value", "base_rate.reference_class", "base_rate.source",
                      "kill_condition", "kill_check"):
            self.assertIn(field, line)
        self.assertIn("the id is still the template placeholder", out)
        self.assertEqual((sha(root, GRAPH), sha(root, QUESTIONS)), before)

    def test_each_missing_field_is_named_and_the_filled_example_passes(self):
        root = fresh(self)
        ex = filled_example()
        self.assertNotIn("FILL IN", json.dumps(ex))
        cases = {"settlement_test": lambda e: e["nodes"][0].pop("settlement_test"),
                 "judgment_tags": lambda e: e["nodes"][0].update(judgment_tags=[]),
                 "base_rate.value": lambda e: e["nodes"][0]["base_rate"].update(value=None),
                 "base_rate.reference_class": lambda e: e["nodes"][0]["base_rate"].update(reference_class=""),
                 "base_rate.source": lambda e: e["nodes"][0]["base_rate"].pop("source"),
                 "kill_condition": lambda e: e["nodes"][0].update(kill_condition="   "),
                 "kill_check": lambda e: e["nodes"][0].pop("kill_check"),
                 "a question in earth2/scorecard/questions.json": lambda e: e.update(questions=[])}
        for field, cut in cases.items():
            bad = json.loads(json.dumps(ex))
            cut(bad)
            code, out = run(root, MERGE, GRAPH, self.put(root, bad, "bad.json"), "--dry-run")
            self.assertEqual(code, 2, (field, out))
            line = next(x for x in out.splitlines() if "WR9: new main event is missing" in x)
            self.assertEqual(line.split("missing: ")[1], field, out)
        bad = json.loads(json.dumps(ex))
        bad["nodes"][0].pop("base_rate")
        bad["nodes"][0]["judgment_tags"] = ["speed"]
        out = run(root, MERGE, GRAPH, self.put(root, bad, "bad.json"), "--dry-run")[1]
        self.assertIn("unknown tag 'speed'", out)
        self.assertIn("base_rate.value; base_rate.reference_class; base_rate.source", out)
        # a board row is a main event too, whether the node says so or the graph block does
        bad = json.loads(json.dumps(ex))
        bad["nodes"][1]["model_layer"] = "board"
        code, out = run(root, MERGE, GRAPH, self.put(root, bad, "bad.json"), "--dry-run")
        self.assertEqual(code, 2, out)
        self.assertIn("WR1: new main event is missing: judgment_tags;", out)
        self.assertNotIn("WR9: new main event is missing", out)
        bad = json.loads(json.dumps(ex))
        bad["graph"]["model_layer"] = "board"
        code, out = run(root, MERGE, GRAPH, self.put(root, bad, "bad.json"), "--dry-run")
        self.assertEqual(code, 2, out)
        self.assertIn("WR1: new main event is missing: judgment_tags;", out)
        # a tree trigger that only carries a board_reference is not a main event, so the gate leaves it alone
        fine = json.loads(json.dumps(ex))
        fine["nodes"][1].update(type="TRIGGER", board_reference="WR9")
        code, out = run(root, MERGE, GRAPH, self.put(root, fine, "bad.json"), "--dry-run")
        self.assertEqual(code, 0, out)
        self.assertIn("new main events       1   (WR9; each passed the gate)", out)
        os.remove(os.path.join(root, "earth2/deepdives/bad.json"))
        # the filled example passes, dry and real
        rel = self.put(root, ex)
        before = (sha(root, GRAPH), sha(root, QUESTIONS))
        code, out = run(root, MERGE, GRAPH, rel, "--dry-run")
        self.assertEqual(code, 0, out)
        self.assertEqual((sha(root, GRAPH), sha(root, QUESTIONS)), before)
        code, out = run(root, MERGE, GRAPH, rel)
        self.assertEqual(code, 0, out)
        self.assertIn("each passed the gate", out)
        g = load(root, GRAPH)
        node = next(n for n in g["nodes"] if n["id"] == "WR9")
        for field in ("settlement_test", "judgment_tags", "base_rate", "kill_condition", "kill_check", "date_state"):
            self.assertEqual(node[field], ex["nodes"][0][field])
        self.assertIn("WATER AND RIVERS", g["meta"]["arms"])
        self.assertEqual(next(c for c in g["companies"] if c["id"] == "CO:ZZWTR")["event_nodes"], ["WR9"])
        self.assertEqual(g["meta"]["odds_stamp"], module(root).odds_stamp(g["nodes"]))
        old = {n["id"]: n.get("odds_now") for n in load(REPO, GRAPH)["nodes"]}
        self.assertTrue(all(n.get("odds_now") == old[n["id"]] for n in g["nodes"] if n["id"] in old))
        qs = load(root, QUESTIONS)["questions"]
        self.assertEqual([(q["id"], q["event_id"], q["path_node"], q["arm"], q["status"]) for q in qs],
                         [("Q-0001", "WR9", "WR1", "WATER AND RIVERS", "OPEN")])
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 0, out)
        code, out = run(root, MERGE, GRAPH, rel)
        self.assertIn("ALREADY MERGED", out)
        self.assertEqual(len(load(root, QUESTIONS)["questions"]), 1)
        self.assertNotIn("WR9", load(root, "earth2/scorecard/legacy_main_events.json")["events"])
        # the validator applies the same gate to the graph
        good_graph, good_q = load(root, GRAPH), load(root, QUESTIONS)
        for field in ("settlement_test", "judgment_tags", "base_rate", "kill_check"):
            g = json.loads(json.dumps(good_graph))
            next(n for n in g["nodes"] if n["id"] == "WR9").pop(field)
            save(root, GRAPH, g)
            code, out = run(root, VALIDATE, GRAPH)
            self.assertEqual(code, 1, out)
            self.assertIn("WR9: new main event is missing: " + ("base_rate.value" if field == "base_rate" else field), out)
        save(root, GRAPH, good_graph)
        save(root, QUESTIONS, {"version": 1, "questions": []})
        run(root, SC, "score")
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 1, out)
        self.assertIn("WR9: new main event is missing: a question in earth2/scorecard/questions.json", out)
        save(root, QUESTIONS, good_q)
        run(root, SC, "score")
        self.assertEqual(run(root, VALIDATE, GRAPH)[0], 0)

    def test_legacy_list_only_shrinks_and_a_lost_field_fails(self):
        root = fresh(self)
        legacy = load(root, LEGACY)
        count = len(legacy["events"])
        self.assertEqual(count, sum(1 for n in load(root, GRAPH)["nodes"] if module(root).is_main_event(n)))
        has_test = next(k for k, v in legacy["events"].items() if "settlement_test" not in v)
        g = load(root, GRAPH)
        good = json.loads(json.dumps(g))
        next(n for n in g["nodes"] if n["id"] == has_test).pop("settlement_test")
        save(root, GRAPH, g)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 1, out)
        self.assertIn(f"{has_test}: this older main event lost its settlement_test", out)
        # closing a gap is fine, and legacy-refresh records it without ever adding an event
        g = json.loads(json.dumps(good))
        next(n for n in g["nodes"] if n["id"] == has_test)["judgment_tags"] = ["timing"]
        g["nodes"].append({"id": "ZZ1", "label": "x", "arm": g["meta"]["arms"][0], "type": "END EVENT", "odds_now": None,
                           "status": "ON TRACK", "window_start": day(0), "window_peak": day(1), "window_end": day(2),
                           "date_state": "ESTIMATED", "kill_condition": "k", "kill_check": "c"})
        save(root, GRAPH, g)
        code, out = run(root, SC, "legacy-refresh")
        self.assertEqual(code, 0, out)
        self.assertIn("no judgment_tags %d to %d" % (count, count - 1), out)
        after = load(root, "earth2/scorecard/legacy_main_events.json")
        self.assertEqual(sorted(after["events"]), sorted(legacy["events"]))
        self.assertNotIn("judgment_tags", after["events"][has_test])
        self.assertEqual(load(root, PUBLIC)["legacy"]["gaps"]["judgment_tags"], count - 1)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertIn("ZZ1: new main event is missing: settlement_test; judgment_tags; base_rate.value", out)
        # once recorded as closed, the field cannot be lost again
        save(root, GRAPH, good)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 1, out)
        self.assertIn(f"{has_test}: this older main event lost its judgment_tags", out)
        os.remove(os.path.join(root, "earth2/scorecard/legacy_main_events.json"))
        self.assertEqual(run(root, SC, "legacy-refresh")[0], 1)
        self.assertFalse(os.path.exists(os.path.join(root, "earth2/scorecard/legacy_main_events.json")))


class Test7FoldedIds(unittest.TestCase):
    def test_e16_resolves_to_d4_in_add(self):
        root = fresh(self)
        g = load(root, GRAPH)
        nodes = {n["id"]: n for n in g["nodes"]}
        sc = module(root)
        self.assertNotIn("E16", nodes)
        self.assertTrue(sc.is_main_event(nodes["D4"]))  # a board row
        self.assertTrue(sc.is_main_event(nodes[EVENT]))  # an end event
        self.assertTrue(nodes["DA1"].get("board_reference"))
        self.assertFalse(sc.is_main_event(nodes["DA1"]))  # a tree trigger that points at a board row
        base = ["--text", "Did the 10-year close above 5.50% by the due date?", "--test", "YES when DGS10 closes above 5.50.",
                "--source", "FRED DGS10", "--tags", "timing", "--script-side", "YES", "--due", day(20), "--odds", "37",
                "--odds-basis", "D4 odds on the day"]
        # the old folded id is accepted as event_id and stored under its survivor, the board row D4
        code, out = run(root, SC, "add", "--event", "E16", *base)
        self.assertEqual(code, 0, out)
        self.assertIn("event_id 'E16' was folded into 'D4'", out)
        q = by_id(root, "Q-0001")
        self.assertEqual((q["event_id"], q["path_node"], q["arm"]), ("D4", None, nodes["D4"]["arm"]))
        # and as path_node
        base[1] = "Did the 10-year close above 5.50% on the way to the major?"
        code, out = run(root, SC, "add", "--event", EVENT, "--path-node", "E16", *base)
        self.assertEqual(code, 0, out)
        self.assertIn("path_node 'E16' was folded into 'D4'", out)
        q = by_id(root, "Q-0002")
        self.assertEqual((q["event_id"], q["path_node"]), (EVENT, "D4"))
        # a tree trigger with a board_reference is not a main event: refused as event_id, with what to do instead
        base[1] = "Did the first export step arrive by the due date?"
        code, out = run(root, SC, "add", "--event", "DA1", *base)
        self.assertEqual(code, 2, out)
        self.assertIn("event_id 'DA1' is not a main event", out)
        self.assertIn("put DA1 in path_node", out)
        self.assertIn("T1", out.split("Main events DA1 pushes:")[1])
        self.assertEqual(len(load(root, QUESTIONS)["questions"]), 2)
        # and it stays valid as path_node
        code, out = run(root, SC, "add", "--event", "T1", "--path-node", "DA1", *base)
        self.assertEqual(code, 0, out)
        q = by_id(root, "Q-0003")
        self.assertEqual((q["event_id"], q["path_node"]), ("T1", "DA1"))
        # an old id folded into an end event is accepted and stored under the survivor
        g["merges"][-1]["alias_map"]["OLD-275"] = {"survivor": EVENT, "reason": "test fold", "date": day(0)}
        save(root, GRAPH, g)
        base[1] = "Did the second dated step arrive by the due date?"
        code, out = run(root, SC, "add", "--event", "OLD-275", *base)
        self.assertEqual(code, 0, out)
        self.assertIn("'OLD-275' was folded into '%s'" % EVENT, out)
        self.assertEqual(by_id(root, "Q-0004")["event_id"], EVENT)
        self.assertEqual(run(root, SC, "add", "--event", "NOPE-1", *base)[0], 2)
        out = import_seed(self, root, expect=2, questions=[question(event="DA1")], event_tags={"DA1": ["timing"]})
        self.assertIn("questions[1]: event_id 'DA1' is not a main event", out)
        self.assertIn("event_tags: 'DA1' is not a main event", out)
        # a seed may name the old id too: tags and the question land on D4
        out = import_seed(self, root, questions=[question(event="E16")], event_tags={"E16": ["timing"]})
        self.assertIn("event_id 'E16' was folded into 'D4'", out)
        self.assertEqual(by_id(root, "Q-0005")["event_id"], "D4")
        self.assertEqual(next(n for n in load(root, GRAPH)["nodes"] if n["id"] == "D4")["judgment_tags"], ["timing"])
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 0, out)


NODE = shutil.which("node")
PAGE_JS = r"""
const [base, chrome, casesJson] = process.argv.slice(2);
const roots = (process.env.NODE_PATH || '').split(':').filter(Boolean).concat(['/opt/npm-tools/node_modules', '/usr/lib/node_modules', '/usr/local/lib/node_modules']);
let pw = null;
for (const r of [''].concat(roots)) { try { pw = require(r ? r + '/playwright' : 'playwright'); break; } catch (e) {} }
if (!pw) { console.log(JSON.stringify({skip: 'playwright is not installed'})); process.exit(0); }
(async () => {
  let browser;
  try { browser = await pw.chromium.launch(Object.assign({headless: true, args: ['--no-sandbox']}, chrome ? {executablePath: chrome} : {})); }
  catch (e) { console.log(JSON.stringify({skip: 'headless Chrome did not start: ' + String(e).slice(0, 200)})); return; }
  const out = {};
  for (const c of JSON.parse(casesJson)) {
    const ctx = await browser.newContext({viewport: {width: 380, height: 760}, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
    const page = await ctx.newPage(); const errors = [], consoleErrors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    await page.goto(base + '/' + c.name + '/index.html');
    await page.waitForFunction(() => document.getElementById('scoreSum').dataset.ready === '1' && /nodes/.test(document.getElementById('status').textContent), null, {timeout: 60000});
    const r = await page.evaluate((nodeId) => {
      const score = document.getElementById('score'); const wasOpen = score.open; score.open = true;
      const wide = [...score.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > window.innerWidth + 0.5).map(el => el.tagName + '.' + el.className);
      const res = {summary: document.getElementById('scoreSum').textContent, body: document.getElementById('scoreBody').innerText,
        openByDefault: wasOpen, docWidth: document.documentElement.scrollWidth, viewWidth: window.innerWidth,
        bodyOverflow: document.getElementById('scoreBody').scrollWidth - document.getElementById('scoreBody').clientWidth, tooWide: wide,
        badTiles: [...document.querySelectorAll('.tile.bad')].map(e => e.innerText), cmds: [...document.querySelectorAll('#scoreBody .cmd')].map(e => e.textContent),
        warnClass: document.getElementById('stampWarn').className, warnText: document.getElementById('stampWarn').textContent,
        status: document.getElementById('status').textContent, stamp: oddsStamp(G.nodes), mainCount: G.nodes.filter(isMain).length};
      if (nodeId) { selectNode(nodeId); res.node = document.getElementById('pNode').innerText; res.nodeTooWide = [...document.getElementById('pNode').querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > window.innerWidth + 0.5).length; }
      return res;
    }, c.node || null);
    r.errors = errors; r.consoleErrors = consoleErrors.filter(t => !/favicon|404/.test(t));
    if (c.shot) await page.screenshot({path: c.shot});
    out[c.name] = r; await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(out));
})().catch(e => { console.log(JSON.stringify({fail: String(e)})); process.exit(1); });
"""


class Test7bStructureImports(unittest.TestCase):
    """Settlement tests, market odds and company lens marks enter through import-seed: structure only, never odds."""

    def test_tests_markets_and_lenses_import_and_bad_rows_are_refused(self):
        root = fresh(self)
        g = load(root, GRAPH)
        stamp = g["meta"]["odds_stamp"]
        sc = module(root)
        main = [n for n in g["nodes"] if sc.is_main_event(n)]
        bare = main[0]  # every main event has a test since Nov 26; bare is used for the market row
        tested = next(n for n in main if n.get("settlement_test") and n["id"] != bare["id"])
        co = g["companies"][0]["id"]
        good_mkt = {"odds": 30, "venue": "Kalshi", "contract": "KXTEST-27", "url": "https://kalshi.com/x",
                    "as_of": day(0), "match_note": "same threshold, same deadline"}
        lens = {"lens": "commanding_heights", "class": "holds a chokepoint", "basis": "controls a scarce position",
                "source": "Manidis and Roberts, The Commanding Heights, Oct 29, 2026"}
        # refused: play money as a market, a lens with direction words, replacing a test without a reason
        out = import_seed(self, root, expect=2, event_markets={bare["id"]: dict(good_mkt, venue="Manifold")})
        self.assertIn("forecast site, not a market", out)
        out = import_seed(self, root, expect=2, company_lenses={co: dict(lens, basis="this name gets helped")})
        self.assertIn("structure only", out)
        out = import_seed(self, root, expect=2, legacy_settlement_tests={tested["id"]: "YES if a brand new rule is met by the date."})
        self.assertIn("replace_reason", out)
        # accepted: all three, and no odds move
        import_seed(self, root, legacy_settlement_tests={
            tested["id"]: {"text": "YES if the reworded rule is met by the deadline. NO otherwise.", "replace_reason": "test wording fix"}},
            event_markets={bare["id"]: good_mkt}, company_lenses={co: lens})
        g2 = load(root, GRAPH)
        nodes = {n["id"]: n for n in g2["nodes"]}
        self.assertEqual(g2["meta"]["odds_stamp"], stamp)
        self.assertEqual(nodes[bare["id"]]["market"]["odds"], 30)
        self.assertTrue(nodes[tested["id"]]["settlement_test"].startswith("YES if the reworded rule"))
        self.assertEqual(nodes[tested["id"]]["settlement_test_history"][-1]["old"], tested["settlement_test"])
        self.assertEqual(next(c for c in g2["companies"] if c["id"] == co)["lenses"]["commanding_heights"]["class"],
                         "holds a chokepoint")
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 0, out)
        # a hand edit that puts play money in the market column fails the validator
        nodes[bare["id"]]["market"]["venue"] = "Metaculus"
        save(root, GRAPH, g2)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertNotEqual(code, 0, out)
        self.assertIn("forecast site", out)


class Test7cTicketGuard(unittest.TestCase):
    """The ticket guard reads the graph and a private register, warns, and writes nothing."""

    def test_guard_rules(self):
        tmp = tempfile.mkdtemp()
        g = load(REPO, GRAPH)
        nodes = {n["id"]: n for n in g["nodes"]}
        sched = next(n for n in g["nodes"] if n.get("date_state") == "SCHEDULED" and n.get("window_peak")
                     and n.get("odds_now") is not None and 5 < n["odds_now"] < 95)
        peak = dt.date.fromisoformat(sched["window_peak"])
        reg = {"tickets": [
            {"id": "A", "node": sched["id"], "expiry": (peak + dt.timedelta(days=30)).isoformat(),
             "odds_at_entry": sched["odds_now"], "status": "OPEN"},
            {"id": "B", "node": sched["id"], "expiry": (peak + dt.timedelta(days=5)).isoformat(),
             "odds_at_entry": sched["odds_now"] + 12, "status": "OPEN"},
            {"id": "C", "node": "E16", "expiry": None, "odds_at_entry": nodes["D4"]["odds_now"], "status": "OPEN"},
            {"id": "D", "node": "NOT-A-NODE", "expiry": None, "status": "OPEN"},
            {"id": "E", "node": sched["id"], "expiry": "2000-01-01", "status": "CLOSED"}]}
        path = os.path.join(tmp, "reg.json")
        with open(path, "w") as f:
            json.dump(reg, f)
        before = sha(REPO, GRAPH)
        r = subprocess.run([sys.executable, os.path.join(REPO, "earth2", "ticket_guard.py"), path, "--json"],
                           stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
        self.assertEqual(r.returncode, 1, r.stdout)
        rows = {x["id"]: x for x in json.loads(r.stdout)["rows"]}
        self.assertNotIn("E", rows)  # closed tickets are skipped
        self.assertEqual(rows["A"]["level"], "OK", rows["A"])  # fixed date plus three weeks is enough
        self.assertTrue(any("three weeks" in w for w in rows["B"]["warns"]), rows["B"])
        self.assertTrue(any("odds fell" in w for w in rows["B"]["warns"]), rows["B"])
        self.assertEqual((rows["C"]["node"], rows["C"]["level"]), ("D4", "OK"))
        self.assertIn("E16 was folded into D4", rows["C"]["notes"])
        self.assertEqual(rows["D"]["level"], "WARN")
        self.assertEqual(sha(REPO, GRAPH), before)


def pymod(root, rel):
    """Load one of the copied scripts as a module (the cascade engine or the validator)."""
    spec = importlib.util.spec_from_file_location("m_%d" % next(_n), os.path.join(root, rel))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def board_pool(g, low=20, high=70):
    """Live board rows with odds in the middle and a dated window: fixtures the tests can move either way."""
    return [n for n in g["nodes"] if n.get("model_layer") == "board" and live_mid(n, low, high)
            and len(str(n.get("window_end"))) == 10]


def updates_file(root, rows):
    path = os.path.join(root, "updates_%d.json" % next(_n))
    with open(path, "w", encoding="utf-8") as f:
        json.dump(rows, f)
    return path


def half_up_whole(x):
    return int((x * 10 + 5) // 10)


class Test7dCurvesAndText(unittest.TestCase):
    """Curves (odds_by) and odds_text follow odds_now on every real run. Neither is part of the odds stamp."""

    def test_curves_and_odds_text_follow_a_real_run(self):
        root = fresh(self)
        g = load(root, GRAPH)
        cas = pymod(root, CASCADE)
        pool = board_pool(g)
        self.assertGreaterEqual(len(pool), 6, "not enough live board rows for the fixtures")
        rise, fall, first, between, gone, done = pool[:6]
        off = lambda n, days: (dt.date.fromisoformat(n["window_end"]) + dt.timedelta(days=days)).isoformat()
        o = {n["id"]: float(n["odds_now"]) for n in pool[:6]}
        # a rising curve with a point on the deadline, a null point, and a market note in the text
        rise["odds_by"] = {off(rise, -200): o[rise["id"]] / 2, rise["window_end"]: o[rise["id"]],
                           off(rise, 365): o[rise["id"]] + 20, off(rise, 730): None}
        rise["odds_text"] = "60% on Jan 27 (market 62)"
        # a curve that falls by design keeps its shape
        fall["odds_by"] = {fall["window_end"]: o[fall["id"]], off(fall, 365): o[fall["id"]] * 0.8, off(fall, 730): o[fall["id"]] * 0.5}
        fall["odds_text"] = "about 55% by Nov 2027"
        # the deadline is before every point: the first point covers it
        first["odds_by"] = {off(first, 40): o[first["id"]], off(first, 400): o[first["id"]] + 10}
        first["odds_text"] = "35% on Nov 27 (EST)"
        # the deadline sits between two points; the text does not start with a percent
        between["odds_by"] = {off(between, -60): o[between["id"]] - 10, off(between, 60): o[between["id"]] + 10}
        between["odds_text"] = "70 / 85 / 92 by Nov 2027 / 2028 / 2029"
        # a node that fires and a node that settles at 1 keep the curve they had
        for n in (gone, done):
            n["odds_by"] = {n["window_end"]: o[n["id"]], off(n, 365): o[n["id"]] + 5}
        gone["odds_text"], done["odds_text"] = "45% by May 31", "35% on Nov 27 (EST)"
        save(root, GRAPH, g)
        self.assertEqual(run(root, VALIDATE, GRAPH)[0], 0)  # hand edits to curves and text do not touch the stamp
        want = {rise["id"]: round(o[rise["id"]] + 10, 1), fall["id"]: round(o[fall["id"]] - 10, 1),
                first["id"]: round(o[first["id"]] + 5, 1), between["id"]: round(o[between["id"]] + 6, 1),
                gone["id"]: 100, done["id"]: 1}
        ups = updates_file(root, [{"id": k, "new_odds": v, "date": day(0), "reason": "test event", "source": "test"}
                                  for k, v in want.items()])
        before = sha(root, GRAPH)
        code, out = run(root, CASCADE, GRAPH, "--updates", ups, "--dry-run")
        self.assertEqual(code, 0, out)
        self.assertEqual(sha(root, GRAPH), before)  # a dry run moves no curve and no text
        code, out = run(root, CASCADE, GRAPH, "--updates", ups)
        self.assertEqual(code, 0, out)
        self.assertRegex(out, r"CURVES RESCALED \d+")
        self.assertRegex(out, r"ODDS TEXT REWRITTEN \d+")
        left = re.search(r"odds_text not rewritten \(\d+\): (.*)", out).group(1).split(", ")
        self.assertIn(between["id"], left)
        self.assertIn("CONTRADICTIONS:", out)
        g2 = load(root, GRAPH)
        by = {n["id"]: n for n in g2["nodes"]}
        entry = g2["cascade_log"][-1]
        scaled = lambda v, nid: round(min(99.0, max(1.0, v * (want[nid] / o[nid]))), 1)
        # rising: the deadline point is the new odds, the others scale by the same ratio, null stays null
        r = by[rise["id"]]
        self.assertEqual(r["odds_now"], want[rise["id"]])
        self.assertEqual(r["odds_by"][rise["window_end"]], want[rise["id"]])
        self.assertAlmostEqual(r["odds_by"][off(rise, -200)], scaled(o[rise["id"]] / 2, rise["id"]), delta=0.051)
        self.assertAlmostEqual(r["odds_by"][off(rise, 365)], scaled(o[rise["id"]] + 20, rise["id"]), delta=0.051)
        self.assertIsNone(r["odds_by"][off(rise, 730)])
        self.assertEqual(r["odds_text"], "%d%% on Jan 27" % half_up_whole(want[rise["id"]]))  # the market note is dropped
        # falling by design: scaled, not forced upward
        f = by[fall["id"]]
        self.assertEqual(f["odds_by"][fall["window_end"]], want[fall["id"]])
        self.assertAlmostEqual(f["odds_by"][off(fall, 365)], scaled(o[fall["id"]] * 0.8, fall["id"]), delta=0.051)
        self.assertLess(f["odds_by"][off(fall, 730)], f["odds_by"][off(fall, 365)])
        self.assertEqual(f["odds_text"], "about %d%% by Nov 2027" % half_up_whole(want[fall["id"]]))
        # first point covers an earlier deadline
        self.assertEqual(by[first["id"]]["odds_by"][off(first, 40)], want[first["id"]])
        self.assertEqual(by[first["id"]]["odds_text"], "%d%% on Nov 27 (EST)" % half_up_whole(want[first["id"]]))
        # between two points: the straight line at the deadline reads the new odds; the text is left alone
        b = by[between["id"]]
        self.assertAlmostEqual((b["odds_by"][off(between, -60)] + b["odds_by"][off(between, 60)]) / 2, want[between["id"]], delta=0.11)
        self.assertEqual(b["odds_text"], "70 / 85 / 92 by Nov 2027 / 2028 / 2029")
        self.assertIn(between["id"], entry["odds_text"]["not_rewritten"])
        # FIRED and settled at 1: the curve stays, the text follows
        self.assertEqual((by[gone["id"]]["odds_now"], by[gone["id"]]["odds_by"]), (100, gone["odds_by"]))
        self.assertTrue(by[gone["id"]]["status"].startswith("FIRED"))
        self.assertEqual(by[gone["id"]]["odds_text"], "100% by May 31")
        self.assertEqual((by[done["id"]]["odds_now"], by[done["id"]]["odds_by"]), (1, done["odds_by"]))
        self.assertEqual(by[done["id"]]["odds_text"], "1% on Nov 27 (EST)")
        rescaled = {c["id"] for c in entry["curves_rescaled"]}
        self.assertTrue({rise["id"], fall["id"], first["id"], between["id"]} <= rescaled)
        self.assertFalse({gone["id"], done["id"]} & rescaled)
        # every moved node, cascaded ones too: a live curve reads the node's odds at its deadline, inside 1..99,
        # and a curve that rose still rises
        old = {n["id"]: n for n in g["nodes"]}
        checked = 0
        for m in entry["moved"]:
            n = by[m["id"]]
            pts = cas.curve_points(n.get("odds_by"))
            if not pts or not cas.curve_follows(n, n["odds_now"]) or m["after"] == m["before"]:
                continue
            vals = [x[2] for x in pts]
            self.assertTrue(all(1 <= v <= 99 for v in vals), m["id"])
            was = [x[2] for x in cas.curve_points(old[m["id"]].get("odds_by"))]
            if all(x <= y + 1e-9 for x, y in zip(was, was[1:])):
                self.assertTrue(all(x <= y for x, y in zip(vals, vals[1:])), m["id"])
            if 1 < min(vals) and max(vals) < 99:
                value = cas.curve_deadline(cas.parse_date(n["window_end"], end=True), pts)[1]
                self.assertAlmostEqual(value, n["odds_now"], delta=0.11, msg=m["id"])
                checked += 1
        self.assertGreaterEqual(checked, 3)
        self.assertEqual(g2["meta"]["odds_stamp"], module(root).odds_stamp(g2["nodes"]))
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 0, out)
        # a rebase run carries the curve and the text too (the logged rebase is taken out of this copy first)
        g2["cascade_log"] = [e for e in g2["cascade_log"] if e.get("kind") != "rebase"]
        save(root, GRAPH, g2)
        status = by[first["id"]]["status"]
        level = round(want[first["id"]] + 7, 1)
        ups = updates_file(root, [{"id": first["id"], "new_odds": level, "date": day(0),
                                   "reason": "REBASE test level", "source": "test"}])
        code, out = run(root, CASCADE, GRAPH, "--rebase", "--updates", ups)
        self.assertEqual(code, 0, out)
        n = next(x for x in load(root, GRAPH)["nodes"] if x["id"] == first["id"])
        self.assertEqual((n["odds_by"][off(first, 40)], n["status"]), (level, status))
        self.assertEqual(n["odds_text"], "%d%% on Nov 27 (EST)" % half_up_whole(level))

    def test_fix_odds_text_is_structure_only(self):
        root = fresh(self)
        g = load(root, GRAPH)
        stamp, log_len = g["meta"]["odds_stamp"], len(g["cascade_log"])
        a, b, c = board_pool(g)[:3]
        a["odds_text"], b["odds_text"] = "60% on Jan 27 (market 62)", "about 55% by Nov 2027"
        c["odds_text"] = "70 / 85 / 92 by Nov 2027 / 2028 / 2029"
        save(root, GRAPH, g)
        self.assertEqual(run(root, VALIDATE, GRAPH)[0], 0)  # odds_text is not part of the odds stamp
        before = sha(root, GRAPH)
        code, out = run(root, CASCADE, GRAPH, "--fix-odds-text", "--set", "%s=50" % a["id"])
        self.assertNotEqual(code, 0, out)
        self.assertIn("runs alone", out)
        code, out = run(root, CASCADE, GRAPH, "--fix-odds-text", "--dry-run")
        self.assertEqual(code, 0, out)
        self.assertIn("DRY RUN", out)
        self.assertEqual(sha(root, GRAPH), before)
        code, out = run(root, CASCADE, GRAPH, "--fix-odds-text")
        self.assertEqual(code, 0, out)
        self.assertIn("structure only; odds stamp unchanged " + stamp, out)
        left = re.search(r"odds_text not rewritten \(\d+\): (.*)", out).group(1).split(", ")
        self.assertIn(c["id"], left)
        g2 = load(root, GRAPH)
        by = {n["id"]: n for n in g2["nodes"]}
        self.assertEqual(by[a["id"]]["odds_text"], "%d%% on Jan 27" % half_up_whole(a["odds_now"]))
        self.assertEqual(by[b["id"]]["odds_text"], "about %d%% by Nov 2027" % half_up_whole(b["odds_now"]))
        self.assertEqual(by[c["id"]]["odds_text"], c["odds_text"])
        # structure only: same stamp, same odds everywhere, nothing in cascade_log, one note in meta
        self.assertEqual(g2["meta"]["odds_stamp"], stamp)
        self.assertEqual({n["id"]: n.get("odds_now") for n in g2["nodes"]}, {n["id"]: n.get("odds_now") for n in g["nodes"]})
        self.assertEqual(len(g2["cascade_log"]), log_len)
        key = g2["meta"]["version"].replace(".", "_") + "_changes"
        self.assertEqual(len(g2["meta"][key]), len(g["meta"].get(key, [])) + 1)
        self.assertIn("odds_text", g2["meta"][key][-1])
        self.assertNotIn(chr(8212), g2["meta"][key][-1])  # house rule: no em dash in anything the engine writes
        # every text that starts with a percent now reads its node's odds as a whole number, with no market note
        for n in g2["nodes"]:
            m = re.match(r"\s*(?:about\s+)?(\d+(?:\.\d+)?)\s*%", n.get("odds_text") or "", re.I)
            if m and n.get("odds_now") is not None:
                self.assertEqual(m.group(1), str(half_up_whole(n["odds_now"])), n["id"])
                self.assertIsNone(re.search(r"\(market[^()]*\)\s*$", n["odds_text"]), n["id"])
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 0, out)
        after = sha(root, GRAPH)
        code, out = run(root, CASCADE, GRAPH, "--fix-odds-text")
        self.assertEqual(code, 0, out)
        self.assertIn("Nothing to rewrite", out)
        self.assertEqual(sha(root, GRAPH), after)


class Test7eContradictions(unittest.TestCase):
    """The CONTRADICTIONS list warns and never fails: NECESSARY links and the pairs in meta.contains."""

    def count(self, out):
        return int(re.search(r"^CONTRADICTIONS: (\d+)$", out, re.M).group(1))

    def test_validator_warns_like_for_like_and_still_passes(self):
        root = fresh(self)
        g = load(root, GRAPH)
        by = {n["id"]: n for n in g["nodes"]}
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 0, out)
        base = self.count(out)
        # fixtures stay clear of the graph's own NECESSARY links, so each step changes the count by exactly one
        tied = {x for e in g["links"] if e.get("kind") == "NECESSARY" for x in (e["source"], e["target"])}
        ok = lambda n: live_mid(n, 5, 95) and len(str(n.get("window_end"))) == 10 and n["id"] not in tied
        # (a) a link relabelled NECESSARY whose source is less likely than its target
        link = next(e for e in g["links"] if e.get("kind") == "LIKELY" and e.get("sign") == 1 and not e.get("display_only")
                    and ok(by[e["source"]]) and ok(by[e["target"]])
                    and by[e["source"]]["odds_now"] < by[e["target"]]["odds_now"] - 5)
        s, t = by[link["source"]], by[link["target"]]
        link["kind"] = "NECESSARY"
        s.pop("odds_by", None)
        t.pop("odds_by", None)
        save(root, GRAPH, g)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 0, out)  # warn only
        self.assertIn("ALL CHECKS PASS", out)
        self.assertIn("WARN necessary link %s -> %s: source %.1f (odds now) is below target %.1f" % (s["id"], t["id"], s["odds_now"], t["odds_now"]), out)
        self.assertEqual(self.count(out), base + 1)
        # like for like: with curves on both, the source is read on its curve at the target's deadline
        t["odds_by"] = {t["window_end"]: t["odds_now"]}
        s["odds_by"] = {"2026-12-31": 1.5, "2031-12-31": 99}
        s["odds_by"][t["window_end"]] = t["odds_now"] + 10
        save(root, GRAPH, g)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual((code, self.count(out)), (0, base), out)
        s["odds_by"][t["window_end"]] = t["odds_now"] - 0.9  # inside the 1 point of slack
        save(root, GRAPH, g)
        self.assertEqual(self.count(run(root, VALIDATE, GRAPH)[1]), base)
        s["odds_by"][t["window_end"]] = t["odds_now"] - 4
        save(root, GRAPH, g)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual((code, self.count(out)), (0, base + 1), out)
        self.assertIn("WARN necessary link %s -> %s: source %.1f (its curve at %s) is below target %.1f"
                      % (s["id"], t["id"], t["odds_now"] - 4, t["window_end"], t["odds_now"]), out)
        link["kind"] = "LIKELY"
        # (b) a containment pair, both curves: the whole is below the part at one shared date
        rest = [n for n in board_pool(g, 10, 90) if n["id"] not in (s["id"], t["id"]) and n["id"] not in tied]
        w, p = rest[:2]
        w["odds_by"] = {"2027-06-30": 10, "2028-06-30": 30}
        p["odds_by"] = {"2027-06-30": 12.5, "2028-06-30": 20}
        g["merges"][-1].setdefault("alias_map", {})["OLD-WHOLE"] = {"survivor": w["id"], "reason": "test fold", "date": day(0)}
        g["meta"]["contains"] = [{"whole": "OLD-WHOLE", "part": p["id"], "note": "test pair."}]  # an old id resolves
        save(root, GRAPH, g)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual((code, self.count(out)), (0, base + 1), out)
        self.assertIn("WARN contains %s >= %s: whole 10.0 is below part 12.5 at 2027-06-30 (both curves). test pair." % (w["id"], p["id"]), out)
        self.assertIn("1 containment pairs", out)
        p["odds_by"]["2027-06-30"] = 10.9  # inside the slack
        save(root, GRAPH, g)
        self.assertEqual(self.count(run(root, VALIDATE, GRAPH)[1]), base)
        # only the whole has a curve: its value at the part's deadline against the part's odds
        del p["odds_by"]
        w["odds_by"] = {p["window_end"]: p["odds_now"] - 5}
        save(root, GRAPH, g)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual((code, self.count(out)), (0, base + 1), out)
        self.assertIn("WARN contains %s >= %s: whole %.1f is below part %.1f at %s (the whole's curve at the part's deadline)"
                      % (w["id"], p["id"], p["odds_now"] - 5, p["odds_now"], p["window_end"]), out)
        # the engine prints the same list after a real run
        mover = next(n for n in rest[2:] if n["id"] not in (w["id"], p["id"]))
        code, out = run(root, CASCADE, GRAPH, "--set", "%s=%s" % (mover["id"], mover["odds_now"] + 1), "--date", day(0),
                        "--reason", "test event", "--source", "test", "--max-hops", "0")
        self.assertEqual(code, 0, out)
        self.assertIn("WARN contains %s >= %s" % (w["id"], p["id"]), out.split("WROTE")[1])
        self.assertRegex(out, r"(?m)^CONTRADICTIONS: \d+$")
        # no curves: odds against odds when the whole's deadline is the same or later, else not compared
        g = load(root, GRAPH)
        pool = board_pool(g, 10, 90)
        lo, hi = next((x, y) for x in pool for y in pool if x["odds_now"] < y["odds_now"] - 2 and x["window_end"] > y["window_end"])
        for n in (lo, hi):
            n.pop("odds_by", None)
        g["meta"]["contains"] = [{"whole": lo["id"], "part": hi["id"], "note": "test pair."}]
        save(root, GRAPH, g)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 0, out)
        self.assertIn("WARN contains %s >= %s: whole %.1f is below part %.1f at %s (odds now)"
                      % (lo["id"], hi["id"], lo["odds_now"], hi["odds_now"], hi["window_end"]), out)
        g["meta"]["contains"] = [{"whole": hi["id"], "part": lo["id"], "note": "test pair."}]
        save(root, GRAPH, g)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 0, out)
        self.assertIn("NOTE not compared: %s contains %s" % (hi["id"], lo["id"]), out)
        # a row that names no node is a broken reference, and that does fail
        g["meta"]["contains"] = [{"whole": "NOPE-1", "part": lo["id"], "note": "test pair."}]
        save(root, GRAPH, g)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 1, out)
        self.assertIn("meta.contains[0]: unknown node NOPE-1", out)


class Test7fCalibration(unittest.TestCase):
    """--calibration: a level correction that is not news. No hops, no queue, status left alone, one per 30 days."""

    def test_calibration_rules(self):
        root = fresh(self)
        g = load(root, GRAPH)
        by = {n["id"]: n for n in g["nodes"]}
        # a node a normal run would cascade from
        node = None
        for e in sorted((e for e in g["links"] if not e.get("display_only") and (e.get("strength") or 0) >= 0.3 and e.get("sign") == 1
                         and live_mid(by[e["source"]], 20, 70) and live_mid(by[e["target"]], 5, 85)
                         and len(str(by[e["source"]].get("window_end"))) == 10), key=lambda e: -e["strength"]):
            code, out = run(root, CASCADE, GRAPH, "--set", "%s=%s" % (e["source"], by[e["source"]]["odds_now"] + 10),
                            "--date", day(0), "--reason", "test", "--dry-run")
            if code == 0 and re.search(r"^\S+\s.*\s%s > " % re.escape(e["source"]), out, re.M):
                node = by[e["source"]]
                break
        self.assertIsNotNone(node, "no live node cascades in this graph")
        other = next(n for n in board_pool(g) if n["id"] != node["id"])
        o = float(node["odds_now"])
        node["odds_by"] = {node["window_end"]: o, "2031-12-31": min(98.0, o + 20)}
        node["odds_text"] = "%d%% by May 31" % o
        save(root, GRAPH, g)
        up10, up12 = round(o + 10, 1), round(o + 12, 1)
        row = {"id": node["id"], "new_odds": up10, "date": day(0), "reason": "CALIBRATION base rate review: test class",
               "source": "test count", "basis": "BASE RATE"}
        before = sha(root, GRAPH)

        def refused(rows, *extra, flags=("--calibration",)):
            args = list(flags) + (["--updates", updates_file(root, rows)] if rows is not None else []) + list(extra)
            code, out = run(root, CASCADE, GRAPH, *args)
            self.assertEqual(code, 5, out)
            self.assertIn("CALIBRATION REFUSED", out)
            self.assertEqual(sha(root, GRAPH), before)
            return out

        refused(None)  # no --updates
        refused([row], "--set", "%s=50" % node["id"])
        refused([row], "--date", day(0))
        refused([row], flags=("--calibration", "--rebase"))
        self.assertIn("must start with 'CALIBRATION'", refused([dict(row, reason="base rate review")]))
        self.assertIn("no source", refused([dict(row, source="")]))
        self.assertIn("basis None", refused([{k: v for k, v in row.items() if k != "basis"}]))
        self.assertIn("basis 'NEWS'", refused([dict(row, basis="NEWS")]))
        self.assertIn("outside 1 to 99", refused([dict(row, new_odds=100)]))
        self.assertIn("after today", refused([dict(row, date=day(1))]))
        code, out = run(root, CASCADE, GRAPH, "--calibration", "--updates", updates_file(root, [row]))
        self.assertEqual(code, 0, out)
        self.assertIn("EARTH2 CALIBRATION", out)
        self.assertIn("max hops forced to 0", out)
        self.assertIn("none: a calibration opens no collisions", out)
        g2 = load(root, GRAPH)
        entry = g2["cascade_log"][-1]
        n2 = next(n for n in g2["nodes"] if n["id"] == node["id"])
        self.assertEqual((entry["kind"], entry["rule"]["max_hops"], entry["queue"]), ("calibration", 0, []))
        self.assertEqual([m["id"] for m in entry["moved"]], [node["id"]])  # nothing cascades
        self.assertEqual((entry["trigger"][0]["basis"], entry["trigger"][0]["reason"]), ("BASE RATE", row["reason"]))
        self.assertEqual((n2["odds_now"], n2["status"]), (up10, node["status"]))  # status is left alone
        self.assertEqual(n2["odds_by"][node["window_end"]], up10)  # the curve follows
        self.assertEqual(n2["odds_text"], "%d%% by May 31" % half_up_whole(up10))  # and the text
        self.assertEqual({n["id"]: n.get("odds_now") for n in g2["nodes"] if n["id"] != node["id"]},
                         {n["id"]: n.get("odds_now") for n in g["nodes"] if n["id"] != node["id"]})
        self.assertEqual(g2["meta"]["odds_stamp"], module(root).odds_stamp(g2["nodes"]))
        self.assertEqual(run(root, VALIDATE, GRAPH)[0], 0)
        # one calibration move per node in 30 days; another node may still be calibrated the same day
        before = sha(root, GRAPH)
        out = refused([dict(row, new_odds=up12, basis="TEST AUDIT")])
        self.assertIn("%s: already had a calibration move on %s" % (node["id"], day(0)), out)
        self.assertIn("allowed from " + day(30), out)
        row2 = {"id": other["id"], "new_odds": other["odds_now"] - 5, "date": day(0), "reason": "CALIBRATION test audit",
                "source": "test", "basis": "TEST AUDIT"}
        out = refused([row2, dict(row, new_odds=up12)])  # one blocked row stops the whole file
        self.assertIn(node["id"], out)
        code, out = run(root, CASCADE, GRAPH, "--calibration", "--updates", updates_file(root, [row2]))
        self.assertEqual(code, 0, out)
        g3 = load(root, GRAPH)
        self.assertEqual([e.get("kind") for e in g3["cascade_log"][-2:]], ["calibration", "calibration"])
        # once the earlier move is 30 days old the node may be calibrated again
        first = g3["cascade_log"][-2]
        first["date"] = first["trigger"][0]["date"] = day(-30)
        save(root, GRAPH, g3)
        code, out = run(root, CASCADE, GRAPH, "--calibration", "--updates",
                        updates_file(root, [dict(row, new_odds=up12, basis="CONTRADICTION")]))
        self.assertEqual(code, 0, out)
        self.assertEqual(next(n for n in load(root, GRAPH)["nodes"] if n["id"] == node["id"])["odds_now"], up12)
        self.assertEqual(run(root, VALIDATE, GRAPH)[0], 0)
        # the page treats a calibration entry as it treats the rebase: out of the queue, with its own pill
        with open(os.path.join(root, "public/future/earth2/index.html"), encoding="utf-8") as f:
            html = f.read()
        self.assertIn('e.kind!=="restamp"&&e.kind!=="rebase"&&e.kind!=="calibration"', html)
        self.assertIn("CALIBRATION: levels only, no cascade", html)


class Test7gBaseRateReasons(unittest.TestCase):
    """Why this time is different: a written reason for a main event far from its base rate. Structure only."""

    def far(self, out):
        m = re.search(r"NOTE: main events 30\+ points from their base rate with no written reason: (\d+)(?: \((.*)\))?", out)
        self.assertTrue(m, out)
        return int(m.group(1)), (m.group(2) or "").split(", ") if m.group(2) else []

    def test_gap_reason_note_and_base_rate_replace(self):
        root = fresh(self)
        g = load(root, GRAPH)
        stamp = g["meta"]["odds_stamp"]
        sc = module(root)
        ev, ev2 = [n for n in g["nodes"] if sc.is_main_event(n) and live_mid(n, 45, 80)][:2]
        rate = {"value": 5, "reference_class": "test class", "source": "test count"}
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual((code, self.far(out)), (0, (0, [])), out)
        import_seed(self, root, legacy_base_rates={ev["id"]: rate, ev2["id"]: rate})
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual((code, self.far(out)), (0, (2, [ev["id"], ev2["id"]])), out)
        why = {"text": "The buyer of last resort has left.", "dated_fact": "The facility closed on Nov 20, 2026.",
               "source": "Test release", "date": day(-7)}
        # refused: a missing field, a bad date, a node that is not a main event, an unknown id
        out = import_seed(self, root, expect=2, base_rate_reasons={ev["id"]: {k: v for k, v in why.items() if k != "dated_fact"}})
        self.assertIn("missing dated_fact", out)
        self.assertIn("date must be a date", import_seed(self, root, expect=2, base_rate_reasons={ev["id"]: dict(why, date="Nov 20")}))
        self.assertIn("'DA1' is not a main event", import_seed(self, root, expect=2, base_rate_reasons={"DA1": why}))
        self.assertIn("'NOPE-1' is not a node", import_seed(self, root, expect=2, base_rate_reasons={"NOPE-1": why}))
        self.assertNotIn("base_rate_gap_reason", next(n for n in load(root, GRAPH)["nodes"] if n["id"] == ev["id"]))
        # accepted, and an old folded id lands on its survivor
        g = load(root, GRAPH)
        g["merges"][-1].setdefault("alias_map", {})["OLD-EV2"] = {"survivor": ev2["id"], "reason": "test fold", "date": day(0)}
        save(root, GRAPH, g)
        out = import_seed(self, root, base_rate_reasons={ev["id"]: why, "OLD-EV2": dict(why, text="  A second reason.  ")})
        self.assertIn("'OLD-EV2' was folded into '%s'" % ev2["id"], out)
        g2 = load(root, GRAPH)
        by = {n["id"]: n for n in g2["nodes"]}
        self.assertEqual(by[ev["id"]]["base_rate_gap_reason"], why)
        self.assertEqual(by[ev2["id"]]["base_rate_gap_reason"]["text"], "A second reason.")
        self.assertEqual(g2["meta"]["odds_stamp"], stamp)  # structure only
        self.assertEqual({n["id"]: n.get("odds_now") for n in g2["nodes"]}, {n["id"]: n.get("odds_now") for n in g["nodes"]})
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual((code, self.far(out)), (0, (0, [])), out)
        # replacing a base rate needs a reason, and the old one is kept
        out = import_seed(self, root, expect=2, legacy_base_rates={ev["id"]: dict(rate, value=12)})
        self.assertIn("replace_reason", out)
        self.assertEqual(next(n for n in load(root, GRAPH)["nodes"] if n["id"] == ev["id"])["base_rate"], rate)
        new = dict(rate, value=12, reference_class="a better class")
        for _ in range(2):  # the same row twice changes nothing the second time
            import_seed(self, root, legacy_base_rates={ev["id"]: dict(new, replace_reason="the first class was too wide")})
        n = next(x for x in load(root, GRAPH)["nodes"] if x["id"] == ev["id"])
        self.assertEqual(n["base_rate"], new)
        self.assertEqual(n["base_rate_history"][-1], {"date": day(0), "old": rate, "reason": "the first class was too wide"})  # live nodes may already carry history
        self.assertEqual(load(root, GRAPH)["meta"]["odds_stamp"], stamp)
        # the note counts live events only: without its reason the event is listed again, and not once it has FIRED
        g3 = load(root, GRAPH)
        del next(x for x in g3["nodes"] if x["id"] == ev["id"])["base_rate_gap_reason"]
        next(x for x in g3["nodes"] if x["id"] == ev2["id"])["base_rate_gap_reason"].pop("source")
        save(root, GRAPH, g3)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 1, out)  # a note with a field missing is a broken record
        self.assertIn("%s: base_rate_gap_reason: missing source" % ev2["id"], out)
        self.assertEqual(self.far(out), (2, [ev["id"], ev2["id"]]))
        next(x for x in g3["nodes"] if x["id"] == ev2["id"])["base_rate_gap_reason"]["source"] = "Test release"
        save(root, GRAPH, g3)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual((code, self.far(out)), (0, (1, [ev["id"]])), out)
        code, out = run(root, CASCADE, GRAPH, "--set", ev["id"] + "=100", "--date", day(0), "--reason", "test: it fired", "--source", "test")
        self.assertEqual(code, 0, out)
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual((code, self.far(out)), (0, (0, [])), out)
        with open(os.path.join(root, "public/future/earth2/index.html"), encoding="utf-8") as f:
            self.assertIn("Why this time is different:", f.read())


class Test7hSharedDriver(unittest.TestCase):
    """A cross-arm pair fed by one upstream node is scored at half: not two independent pushes."""

    def test_shared_driver_flag_and_weight(self):
        root = fresh(self)
        cas = pymod(root, CASCADE)
        self.assertEqual(cas.COLLISION_SHARED_DRIVER_WEIGHT, 0.5)
        node = lambda i, arm: {"id": i, "arm": arm, "odds_now": 45, "status": "ON TRACK", "window_start": "2027-01-01", "window_end": "2027-06-30"}
        nodes = {i: node(i, arm) for i, arm in (("A", "ARM 1"), ("B", "ARM 2"), ("C", "ARM 3"), ("D", "ARM 4"), ("drv", "ARM 5"),
                                                ("mid", "ARM 5"), ("far", "ARM 5"), ("opp", "ARM 5"))}
        link = lambda s_, t_, **kw: dict({"source": s_, "target": t_, "kind": "LIKELY", "sign": 1, "strength": 0.5, "delay_days": 0}, **kw)
        links = [link("drv", "mid"), link("mid", "A"),  # drv is two hops above A
                 link("drv", "B", display_only=True, strength=None),  # a display-only driver curve still counts
                 link("opp", "A", kind="OPPOSES", sign=-1), link("opp", "C", kind="OPPOSES", sign=-1),  # a lowering link does not
                 link("far", "drv"), link("far", "D")]  # far is three hops above A: too far
        rose = {i: 5.0 for i in "ABCD"}
        after = {i: 50.0 for i in "ABCD"}
        items = {tuple(c["nodes"]): c for c in cas.collisions(nodes, [], rose, after, {}, 120, links) if c["kind"] == "b"}
        self.assertEqual(len(items), 6)
        ab = items[("A", "B")]
        self.assertEqual((ab["shared_driver"], ab["score"]), (["drv"], 0.125))  # 0.5 x 0.5 joint, x 2 arms, x 0.5 unpriced, x 0.5
        self.assertTrue(ab["what"].endswith(" [shared driver: drv]"), ab["what"])
        for pair in (("A", "C"), ("A", "D"), ("B", "C"), ("C", "D")):
            self.assertNotIn("shared_driver", items[pair], pair)
            self.assertEqual(items[pair]["score"], 0.25, pair)
        self.assertEqual(items[("B", "D")]["shared_driver"], ["far"])  # far > drv > B and far > D
        self.assertLess(ab["score"], items[("A", "C")]["score"])
        # without the links nothing is marked, as before
        plain = [c for c in cas.collisions(nodes, [], rose, after, {}, 120) if c["kind"] == "b"]
        self.assertTrue(all("shared_driver" not in c and c["score"] == 0.25 for c in plain))


class Test8Page(unittest.TestCase):
    def script(self):
        with open(os.path.join(REPO, "public/future/earth2/index.html"), encoding="utf-8") as f:
            html = f.read()
        blocks = re.findall(r"<script>(.*?)</script>", html, re.S)
        self.assertEqual(len(blocks), 1, "the page keeps one inline script")
        return blocks[0]

    @unittest.skipUnless(NODE, "node is not installed, so the page script was not parsed")
    def test_page_script_parses_and_its_stamp_matches_python(self):
        root = fresh(self)
        js = self.script()
        path = os.path.join(root, "page_script.js")
        with open(path, "w", encoding="utf-8") as f:
            f.write(js)
        r = subprocess.run([NODE, "--check", path], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
        self.assertEqual(r.returncode, 0, r.stdout)
        m = re.search(r"function stampT\(o\).*?\n(?=function checkStamp)", js, re.S)
        self.assertTrue(m, "stampT and oddsStamp not found in the page")
        odds = [None, 0, 1, 99, 100, 37.1, 37.15, 37.25, 0.05, 99.95, 64.6, 12.345, 50, 2.675, 0.049, 33.3]
        ids = ["a", "B", "sealed-spark:GB7:01", "27-1", "é1", "Z:10", "z:2", "10", "9", "CO:X", "_x", "A b", "\U0001F600z", "￿z", "aa", "Aa"]
        tricky = [{"id": i, "odds_now": o} for i, o in zip(ids, odds)]
        with open(os.path.join(root, "nodes.json"), "w", encoding="utf-8") as f:
            json.dump({"tricky": tricky, "real": [{"id": n["id"], "odds_now": n.get("odds_now")} for n in load(root, GRAPH)["nodes"]]}, f)
        runner = m.group(0) + "\nconst d=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(oddsStamp(d.tricky)+' '+oddsStamp(d.real));"
        with open(os.path.join(root, "stamp.js"), "w", encoding="utf-8") as f:
            f.write(runner)
        r = subprocess.run([NODE, os.path.join(root, "stamp.js"), os.path.join(root, "nodes.json")], stdout=subprocess.PIPE,
                           stderr=subprocess.STDOUT, universal_newlines=True)
        self.assertEqual(r.returncode, 0, r.stdout)
        sc = module(root)
        self.assertEqual(r.stdout.split(), [sc.odds_stamp(tricky), sc.odds_stamp(load(root, GRAPH)["nodes"])])
        self.assertEqual(sc.odds_stamp(load(root, GRAPH)["nodes"]), load(root, GRAPH)["meta"]["odds_stamp"])
        # one definition of a main event: the page's copy must count the same nodes as the Python function
        copy = re.search(r"const isMain=[^;]*;", js)
        self.assertTrue(copy, "isMain not found in the page")
        with open(os.path.join(root, "main.js"), "w", encoding="utf-8") as f:
            f.write(copy.group(0) + "\nconst g=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));"
                    "const by={};for(const n of g.nodes)by[n.id]=n;"
                    "console.log(JSON.stringify({count:g.nodes.filter(isMain).length,ids:g.nodes.filter(isMain).map(n=>n.id).sort(),"
                    "d4:isMain(by['D4']),major:isMain(by[process.argv[3]]),trigger:isMain(by['DA1'])}));")
        r = subprocess.run([NODE, os.path.join(root, "main.js"), os.path.join(root, GRAPH), EVENT], stdout=subprocess.PIPE,
                           stderr=subprocess.STDOUT, universal_newlines=True)
        self.assertEqual(r.returncode, 0, r.stdout)
        page = json.loads(r.stdout)
        py_ids = sorted(n["id"] for n in load(root, GRAPH)["nodes"] if sc.is_main_event(n))
        self.assertEqual(page["count"], len(py_ids))
        self.assertEqual(page["ids"], py_ids)
        self.assertEqual(py_ids, sorted(load(root, LEGACY)["events"]))  # the blank copy lists every main event
        self.assertEqual((page["d4"], page["major"], page["trigger"]), (True, True, False))
        self.assertEqual([sc.stamp_token(x) for x in (None, 0, 37, 37.1, 37.14, 37.16, 64.6, 100)], ["x", "0", "370", "371", "371", "372", "646", "1000"])

    def rich(self, root):
        """Overdue, open, deferred, answered on time, answered late, void, backfilled, a miss, an active tag."""
        live = [question(written=day(-10), due=day(-3), tags=("actor",)), question(due=day(5), tags=("brakes",)),
                question(due=day(9), tags=("market",), market={"odds": 22, "source": "Test market", "as_of": day(0)}),
                question(due=day(2), tags=("actor",)), question(written=day(-10), due=day(-2), tags=("brakes",)),
                question(due=day(7), tags=("actor",)),
                question(due=day(12), tags=("pace",), path_node="D4", consensus={"value": "2027-06-30", "source": "Test survey", "as_of": day(0)})]
        import_seed(self, root, questions=live, backfilled=timing_ten(), event_tags={EVENT: ["timing", "brakes"]},
                    legacy_base_rates={EVENT: {"value": 15, "reference_class": "test class", "source": "test count"}},
                    base_rate_reasons={EVENT: {"text": "The usual brake is gone.", "dated_fact": "It closed on Nov 20, 2026.",
                                               "source": "Test release", "date": day(-7)}})
        steps = [("settle", "Q-0004", "--outcome", "YES", "--as-of", day(0), "--source", "Test source", "--evidence", "It arrived."),
                 ("settle", "Q-0005", "--outcome", "NO", "--as-of", day(-2), "--source", "Test source", "--evidence", "It did not."),
                 ("void", "Q-0006", "--reason", "The series was discontinued."),
                 ("defer", "Q-0003", "--to", day(20), "--reason", "The release moved."),
                 ("miss", "add", "--date", day(-1), "--what", "A big event with no node", "--source", "Test wire",
                  "--area", "cyber", "--why", "No arm covered it")]
        for s in steps:
            code, out = run(root, SC, *s)
            self.assertEqual(code, 0, out)

    @unittest.skipUnless(NODE, "node is not installed, so the page was not loaded")
    def test_page_loads_with_no_scorecard_an_empty_one_and_a_full_one(self):
        chrome = next((p for p in (shutil.which(x) for x in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser")) if p), "")
        root = fresh(self, vendor=True)
        blank_graph = load(root, GRAPH)
        n_nodes = len(blank_graph["nodes"])
        n_main = sum(1 for n in blank_graph["nodes"] if module(root).is_main_event(n))
        site = os.path.join(root, "site")
        src = os.path.join(root, "public/future/earth2")

        def case(name, with_score=True):
            shutil.copytree(src, os.path.join(site, name))
            if not with_score:
                os.remove(os.path.join(site, name, "scorecard.json"))

        case("a_none", with_score=False)
        case("b_empty")
        self.rich(root)
        pub = load(root, PUBLIC)
        self.assertEqual(pub["misses"]["by_area"], {"CYBER": 1})
        case("c_full")
        g = load(root, GRAPH)
        next(n for n in g["nodes"] if n["id"] == "D4")["odds_now"] += 5
        save(root, GRAPH, g)
        case("d_edited")
        handler = functools.partial(type("Quiet", (http.server.SimpleHTTPRequestHandler,), {"log_message": lambda *a: None}), directory=site)
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        shot = os.environ.get("EARTH2_TEST_SHOTS", "")
        cases = [{"name": "a_none"}, {"name": "b_empty"}, {"name": "c_full", "node": EVENT}, {"name": "d_edited", "node": "D4"}]
        if shot:
            for c in cases:
                c["shot"] = os.path.join(shot, c["name"] + ".png")
        with open(os.path.join(root, "page_test.js"), "w", encoding="utf-8") as f:
            f.write(PAGE_JS)
        r = subprocess.run([NODE, os.path.join(root, "page_test.js"), "http://127.0.0.1:%d" % server.server_address[1], chrome, json.dumps(cases)],
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True, timeout=300)
        try:
            res = json.loads(r.stdout.strip().splitlines()[-1])
        except (ValueError, IndexError):
            self.fail("page run gave no result: " + r.stdout + r.stderr)
        if "skip" in res:
            self.skipTest("the page was not loaded in a browser: " + res["skip"])
        self.assertNotIn("fail", res, res)
        for name, c in res.items():
            self.assertEqual(c["errors"], [], name)
            self.assertEqual(c["consoleErrors"], [], name)
            self.assertIn("%d nodes" % n_nodes, c["status"], name)
            self.assertEqual(c["viewWidth"], 380)
            self.assertLessEqual(c["docWidth"], 380, name)
            self.assertLessEqual(c["bodyOverflow"], 1, name)
            self.assertEqual(c["tooWide"], [], name)
        a, b, c, d = res["a_none"], res["b_empty"], res["c_full"], res["d_edited"]
        self.assertIn("not found", a["summary"])
        self.assertEqual(a["warnClass"], "")
        self.assertIn("no questions yet", b["summary"])
        self.assertIn("No answers yet", b["body"])
        self.assertIn("needs 10 more", b["body"])
        self.assertIn("%d main events are from before the gate" % n_main, b["body"])
        self.assertEqual(b["mainCount"], n_main)
        self.assertFalse(b["openByDefault"])
        self.assertEqual(b["stamp"], blank_graph["meta"]["odds_stamp"])
        # the full fixture: overdue in red and open by default, counts, tag table, settle command, misses
        self.assertIn("1 overdue", c["summary"])
        self.assertTrue(c["openByDefault"])
        self.assertEqual(c["badTiles"], ["1\nOVERDUE"])
        for text in ("OVERDUE", "OPEN", "ANSWERED ON TIME", "ANSWERED LATE", "DEFERRED", "VOID", "BACKFILLED", "Coin flip 0.25",
                     "Q-0001", "3 days late", "active", "needs 9 more", "A big event with no node", "CYBER 1",
                     "Still missing: settlement test", "base rate %d" % (n_main - 1), "judgment tags %d" % (n_main - 1)):
            self.assertIn(text, c["body"], text)
        self.assertTrue(any(x.startswith("python3 earth2/scorecard.py settle Q-0001 --outcome YES_OR_NO --as-of " + day(-3)) for x in c["cmds"]), c["cmds"])
        self.assertEqual(c["warnClass"], "")
        self.assertEqual(pub["tags"]["timing"]["mean_signed_error"], 12.0)
        raw = next(n for n in blank_graph["nodes"] if n["id"] == EVENT)["odds_now"]
        self.assertIn("corrected", c["node"])
        self.assertIn("corrected %g%%" % module(root).half_up(min(99.0, max(1.0, raw - 12.0)), 1), c["node"])
        for text in ("timing +12.0", "Judgment tags:", "Base rate:", "15%", "test class", "Open questions: 4", "answered: 12", "Q-0001",
                     "Why this time is different:", "The usual brake is gone.", "It closed on Nov 20, 2026."):
            self.assertIn(text, c["node"], text)
        self.assertEqual(c["nodeTooWide"], 0)
        # a hand edit to odds shows the red banner; D4 is a path node and lists its question
        self.assertEqual(d["warnClass"], "bad")
        self.assertIn("Odds were edited outside the engine", d["warnText"])
        self.assertIn("Q-0007", d["node"])


class Test9RealFiles(unittest.TestCase):
    """The only tests that read the live, populated files as they are (through an untouched copy)."""

    def test_real_files_pass_the_validator_and_hold_their_locks(self):
        root = fresh(self, live=True)
        for rel in COPY:
            self.assertEqual(sha(root, rel), sha(REPO, rel), rel)
        sc = module(root)
        g = load(root, GRAPH)
        doc, problem = sc.load_questions()
        self.assertIsNone(problem)
        late = sc.overdue(doc["questions"])
        self.assertEqual([q["id"] for q in late], [],
                         "The repo has overdue questions. Run python3 earth2/scorecard.py due and settle them.")
        for q in doc["questions"]:
            self.assertEqual(q["lock"], sc.lock_hash(q), "%s: a locked field was changed by hand" % q.get("id"))
        self.assertEqual(sc.check_questions(doc, g), [])
        self.assertEqual(sc.sync_problems(doc["questions"]), [])
        self.assertEqual(g["meta"].get("odds_stamp"), sc.odds_stamp(g["nodes"]))
        code, out = run(root, VALIDATE, GRAPH)
        self.assertEqual(code, 0, out)
        self.assertIn("ALL CHECKS PASS", out)
        self.assertEqual(run(root, CASCADE, GRAPH, "--collisions")[0], 0)  # the lock is not tripped today
        code, out = run(root, SC, "due")
        self.assertEqual(code, 0, out)
        self.assertIn("Nothing is overdue.", out)
        for rel in COPY:
            self.assertEqual(sha(root, rel), sha(REPO, rel), rel + " was written by a read-only command")

    @unittest.skipUnless(NODE, "node is not installed, so the page's count of main events was not checked")
    def test_real_graph_main_events_python_and_page_agree(self):
        root = fresh(self, live=True)
        with open(os.path.join(REPO, "public/future/earth2/index.html"), encoding="utf-8") as f:
            copy = re.search(r"const isMain=[^;]*;", f.read())
        self.assertTrue(copy, "isMain not found in the page")
        with open(os.path.join(root, "main.js"), "w", encoding="utf-8") as f:
            f.write(copy.group(0) + "\nconst g=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));"
                    "console.log(JSON.stringify(g.nodes.filter(isMain).map(n=>n.id).sort()));")
        r = subprocess.run([NODE, os.path.join(root, "main.js"), os.path.join(REPO, GRAPH)], stdout=subprocess.PIPE,
                           stderr=subprocess.STDOUT, universal_newlines=True)
        self.assertEqual(r.returncode, 0, r.stdout)
        sc = module(root)
        py_ids = sorted(n["id"] for n in load(REPO, GRAPH)["nodes"] if sc.is_main_event(n))
        self.assertEqual(json.loads(r.stdout), py_ids)
        self.assertGreaterEqual(len(py_ids), 126)

    def test_zz_the_repo_files_were_not_written(self):
        self.assertEqual(tree_hashes(), START)


def tearDownModule():
    assert tree_hashes() == START, "the tests changed a repo file"


if __name__ == "__main__":
    unittest.main(verbosity=2)
