#!/usr/bin/env python3
"""
earth2/scorecard.py
The Earth2 scorecard. Dated yes/no questions on the main events, the lock that keeps them answered,
the odds stamp, the gate on new main events, and the score. Python 3.8+, standard library only.

RUN THIS FIRST, EVERY SESSION
  python3 earth2/scorecard.py due

COMMANDS
  due                              overdue questions and the next 10 open, each with its exact settle command
  add ...                          add one question (see: add --help)
  import-seed FILE [--dry-run]     add questions, backfilled answers, event tags and base rates from a seed file
  settle ID --outcome YES|NO --as-of DATE --source "..." --evidence "..."
  defer ID --to DATE --reason "..."      at most 2 per question, each at most 21 days
  void ID --reason "..."                 for a test that became impossible; left out of the score
  miss add --date DATE --what "..." --source "..." --area "..." --why "..."
  miss list
  score                            recompute everything; writes corrections.json and the page's scorecard.json
  legacy-refresh                   record gaps that were closed on the older main events (can only shrink)
  list [--status OPEN|SETTLED|VOID]      one line per question
  show ID                          one question in full
  check                            the scorecard checks validate_graph.py runs

THE FILES
  earth2/scorecard/questions.json           the one canonical questions file. Change it only through this CLI.
  earth2/scorecard/misses.json              big real events the graph had no node for
  earth2/scorecard/corrections.json         written by score: how far off each tag and arm has been
  earth2/scorecard/legacy_main_events.json  the main events from before the gate, with the gaps they may keep
  public/future/earth2/scorecard.json       written by score: what the page reads

MAIN EVENTS
  A main event is a node of type END EVENT, or a board row (model_layer "board"). Questions hang on main
  events. A tree trigger with a board_reference is not a main event; name it as path_node.

THE LOCK
  A question is OVERDUE when its status is OPEN and due_current is before today. While any question is
  overdue, cascade.py, validate_graph.py and merge_nodes.py stop with the list and the commands to settle
  them. This file is never blocked. No flag and no environment variable gets around the lock. The only ways
  out are to settle the question, defer it (2 times at most, 21 days each) or void it, and all three are
  written into the file.
  A late answer is allowed and expected: settle it as of its due date, using the named source.

THE SCORE
  p = odds_locked / 100, o = 1 for YES. Brier = mean((p - o)^2), shown beside the coin flip 0.25 and, on
  questions that carry market odds, beside the market's Brier.
  Script side: p_s = p when script_side is YES, else 1 - p; o_s the same way.
  Per tag and per arm: n, mean signed error in points = mean(p_s - o_s) x 100 (positive means Earth2 rates
  its own script too high), Brier, and active = n >= 10.
  Corrected odds for a main event = raw odds_now minus the mean signed error of its active judgment tags,
  held between 1 and 99. It is worked out on the fly by the page and by cascade.py. odds_now is never
  overwritten with a corrected number; the raw number is what keeps getting scored.

"Today" is the date in America/Phoenix (UTC minus 7, no daylight time).
"""
import argparse
import datetime as dt
import hashlib
import json
import math
import os
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SC_DIR = os.path.join(HERE, "scorecard")
PATHS = {
    "graph": os.path.join(ROOT, "public", "future", "earth2", "graph.json"),
    "public": os.path.join(ROOT, "public", "future", "earth2", "scorecard.json"),
    "questions": os.path.join(SC_DIR, "questions.json"),
    "misses": os.path.join(SC_DIR, "misses.json"),
    "corrections": os.path.join(SC_DIR, "corrections.json"),
    "legacy": os.path.join(SC_DIR, "legacy_main_events.json"),
}
CLI = "python3 earth2/scorecard.py"
GRAPH_REL = "public/future/earth2/graph.json"

TAGS = ["timing", "brakes", "actor", "market", "pace"]
TAG_MEANINGS = {
    "timing": "did a dated step arrive when the graph said",
    "brakes": "did someone step in to stop or soften it (rescue, extension, waiver, backstop)",
    "actor": "did a government or company do the dramatic thing or the routine thing",
    "market": "Earth2's odds differ from a recorded market number; who was right",
    "pace": "did it arrive sooner or larger than the recorded consensus",
}
MIN_N = 10
COIN_FLIP = 0.25
MAX_DEFERRALS = 2
MAX_DEFER_DAYS = 21
GAP_FIELDS = ["settlement_test", "base_rate", "judgment_tags"]
GATE_FIELDS = ["settlement_test", "judgment_tags", "base_rate", "kill_condition", "kill_check"]
BASE_RATE_KEYS = ["value", "reference_class", "source"]
QUESTION_NEEDED = "a question in earth2/scorecard/questions.json"

SEED_FIELDS = ["event_id", "path_node", "arm", "text", "test", "source", "tags", "script_side", "written", "due",
               "odds_locked", "odds_basis", "market", "consensus", "kind"]
BACKFILL_FIELDS = ["outcome", "settled_as_of", "evidence", "evidence_source", "odds_date"]
LOCKED_FIELDS = ["id", "event_id", "text", "test", "source", "tags", "script_side", "written", "due", "odds_locked",
                 "market.odds", "consensus.value"]
QUESTION_KEYS = ["id", "event_id", "path_node", "arm", "text", "test", "source", "tags", "script_side", "written",
                 "due", "odds_locked", "odds_basis", "market", "consensus", "kind", "lock", "status", "due_current",
                 "deferrals", "outcome", "settled_as_of", "answered_on", "late", "evidence", "evidence_source",
                 "void_reason"]


# ---------------------------------------------------------------- small helpers
def today():
    """The date in America/Phoenix (UTC minus 7, no daylight time)."""
    return (dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=7)).date()


def iso(v):
    """A strict YYYY-MM-DD string as a date, or None."""
    if not isinstance(v, str) or len(v) != 10:
        return None
    try:
        return dt.date.fromisoformat(v)
    except ValueError:
        return None


def is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def filled(v):
    """True when a field holds something real. Blank, null and template placeholders ("FILL IN ...") are not."""
    if v is None:
        return False
    if isinstance(v, str):
        s = v.strip()
        return bool(s) and not s.upper().startswith("FILL IN")
    if isinstance(v, (list, dict)):
        return len(v) > 0
    return True


def half_up(x, places=1):
    """Round half up with the same integer rule the page uses: floor(x * 10^places + 0.5) / 10^places."""
    f = 10 ** places
    return math.floor(x * f + 0.5) / f


def dq(s):
    """A string inside double quotes for a shell command."""
    out = str(s)
    for ch in ("\\", '"', "$", "`"):
        out = out.replace(ch, "\\" + ch)
    return '"' + out + '"'


def read_json(path, default=None):
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write_json(path, obj):
    folder = os.path.dirname(os.path.abspath(path))
    os.makedirs(folder, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=folder, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(obj, f, indent=1, ensure_ascii=False)
        if os.path.exists(path):
            shutil.copymode(path, tmp)
        else:
            os.chmod(tmp, 0o644)
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def safe_output():
    """Never crash on a character the console cannot show (a piped Windows console, for example)."""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(errors="backslashreplace")
        except (AttributeError, ValueError):
            pass


def strip_date(obj):
    return {k: v for k, v in (obj or {}).items() if k != "generated_on"}


# ---------------------------------------------------------------- graph helpers
def load_graph(path=None):
    path = path or PATHS["graph"]
    if not os.path.exists(path):
        raise SystemExit(f"Graph file not found: {path}")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def is_fired(n):
    return str(n.get("status", "")).upper().startswith("FIRED") or n.get("odds_now") == 100


MAIN_EVENT_RULE = 'type "END EVENT", or model_layer "board"'


def is_main_event(n):
    """THE definition of a main event: an END EVENT, or a board row (model_layer "board").
    A tree trigger that only carries a board_reference is not a main event; it is a path node.
    Every script imports this function. The page keeps one copy (isMain) and a test checks the two agree."""
    return n.get("type") == "END EVENT" or n.get("model_layer") == "board"


def alias_map(g):
    """old id -> survivor id, from every merges entry (alias_map and nodes_mapped_to_v5)."""
    out = {}
    for m in g.get("merges", []) or []:
        for old, v in (m.get("alias_map") or {}).items():
            out[old] = v.get("survivor") if isinstance(v, dict) else v
        for x in m.get("nodes_mapped_to_v5", []) or []:
            if x.get("deepdive_id") and x.get("v5_id"):
                out.setdefault(x["deepdive_id"], x["v5_id"])
    return out


def resolve(nid, nodes, aliases):
    """Follow the alias chain from an old id to a node that exists. Returns the id, or None."""
    seen, cur = set(), nid
    while cur not in nodes and cur in aliases and cur not in seen:
        seen.add(cur)
        cur = aliases[cur]
    return cur if cur in nodes else None


def all_arms(g):
    arms = list((g.get("meta") or {}).get("arms") or [])
    for n in g.get("nodes", []):
        a = n.get("arm")
        if a and a not in arms:
            arms.append(a)
    return arms


# ---------------------------------------------------------------- the odds stamp
def stamp_token(odds):
    """T = floor(odds_now * 10 + 0.5) as an integer; null odds give "x". The page uses the same rule."""
    if odds is None:
        return "x"
    return str(int(math.floor(float(odds) * 10 + 0.5)))


def odds_stamp(nodes):
    """FNV-1a 32-bit hex over "id:T;" for every node, sorted by id (UTF-16 code unit order, as JavaScript sorts)."""
    items = sorted(((str(n["id"]), n.get("odds_now")) for n in nodes), key=lambda t: t[0].encode("utf-16-be"))
    text = "".join(f"{i}:{stamp_token(o)};" for i, o in items)
    h = 0x811C9DC5
    for b in text.encode("utf-8"):
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return format(h, "08x")


def odds_off_history(g):
    """Ids whose odds_now is not the odds on their last odds_history row. A hint at where a hand edit sits."""
    out = []
    for n in g.get("nodes", []):
        h = n.get("odds_history") or []
        if n.get("odds_now") is not None and h and h[-1].get("odds") != n.get("odds_now"):
            out.append(n["id"])
    return out


def stamp_problem(g, graph_rel=GRAPH_REL):
    """None when meta.odds_stamp matches the odds, else the message that says what happened and how to fix it."""
    have = (g.get("meta") or {}).get("odds_stamp")
    want = odds_stamp(g.get("nodes", []))
    if have == want:
        return None
    hint = odds_off_history(g)
    where = (" Nodes whose odds_now does not match their last odds_history row: " + ", ".join(hint[:20])
             + (" ..." if len(hint) > 20 else "") + ".") if hint else ""
    if not have:
        head = "The graph has no odds stamp (meta.odds_stamp)."
    else:
        head = (f"Odds were edited outside the engine: meta.odds_stamp is {have} but the odds in the file give {want}."
                + where)
    return (head + " To fix: put the odds back (git diff shows the edit) and move them with earth2/cascade.py on a "
            "dated, sourced event. If the change was a real repair, record it with: python3 earth2/cascade.py "
            + graph_rel + ' --restamp --reason "why the odds changed" (the reason is logged).')


# ---------------------------------------------------------------- the gate on main events
def base_rate_missing(v):
    if not isinstance(v, dict):
        return ["base_rate." + k for k in BASE_RATE_KEYS]
    out = []
    if not (is_num(v.get("value")) and 0 <= v["value"] <= 100):
        out.append("base_rate.value")
    for k in ("reference_class", "source"):
        if not (isinstance(v.get(k), str) and filled(v.get(k))):
            out.append("base_rate." + k)
    return out


def tags_problem(v):
    """None when v is a clean list of judgment tags, else a short reason."""
    if not isinstance(v, list) or not v or not all(isinstance(t, str) for t in v):
        return "judgment_tags"
    bad = [t for t in v if t not in TAGS]
    if bad:
        return f"judgment_tags (unknown tag {bad[0]!r}; use {', '.join(TAGS)})"
    if len(set(v)) != len(v):
        return "judgment_tags (a tag is repeated)"
    return None


def field_ok(node, field):
    if field == "base_rate":
        return not base_rate_missing(node.get("base_rate"))
    if field == "judgment_tags":
        return tags_problem(node.get("judgment_tags")) is None
    return isinstance(node.get(field), str) and filled(node.get(field))


def gate_missing(node, has_question):
    """What a NEW main event still lacks. An empty list means it passes the gate."""
    out = []
    for f in GATE_FIELDS:
        if f == "base_rate":
            out.extend(base_rate_missing(node.get("base_rate")))
        elif f == "judgment_tags":
            p = tags_problem(node.get("judgment_tags"))
            if p:
                out.append(p)
        elif not field_ok(node, f):
            out.append(f)
    if not has_question:
        out.append(QUESTION_NEEDED)
    return out


def node_gaps(node):
    return [f for f in GAP_FIELDS if not field_ok(node, f)]


def legacy_events():
    doc = read_json(PATHS["legacy"])
    if not isinstance(doc, dict) or not isinstance(doc.get("events"), dict):
        return None
    return doc


# ---------------------------------------------------------------- questions: lock, checks, overdue
def lock_hash(q):
    """sha256 over the locked fields. Any change to one of them changes the hash."""
    m, c = q.get("market"), q.get("consensus")
    payload = {"id": q.get("id"), "event_id": q.get("event_id"), "text": q.get("text"), "test": q.get("test"),
               "source": q.get("source"), "tags": q.get("tags"), "script_side": q.get("script_side"),
               "written": q.get("written"), "due": q.get("due"), "odds_locked": q.get("odds_locked"),
               "market_odds": m.get("odds") if isinstance(m, dict) else None,
               "consensus_value": c.get("value") if isinstance(c, dict) else None}
    text = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_questions():
    """Returns (doc, problem). A missing or unreadable file is a problem, never an empty scorecard."""
    path = PATHS["questions"]
    if not os.path.exists(path):
        return None, "earth2/scorecard/questions.json is missing. Restore it from git; the lock cannot be checked without it."
    try:
        doc = read_json(path)
    except (ValueError, OSError) as e:
        return None, f"earth2/scorecard/questions.json does not load as JSON ({e}). Restore it from git."
    if not isinstance(doc, dict) or doc.get("version") != 1 or not isinstance(doc.get("questions"), list):
        return None, 'earth2/scorecard/questions.json must be {"version": 1, "questions": [...]}.'
    return doc, None


def source_shape(v, key, need_number):
    """Problems in a market or consensus block."""
    if v is None:
        return []
    name = "market" if key == "odds" else "consensus"
    if not isinstance(v, dict):
        return [f"{name} must be null or an object"]
    out = []
    val = v.get(key)
    if need_number:
        if not (is_num(val) and 0 <= val <= 100):
            out.append(f"{name}.{key} must be a number from 0 to 100")
    elif not (is_num(val) or (isinstance(val, str) and filled(val))):
        out.append(f"{name}.{key} is empty")
    if not (isinstance(v.get("source"), str) and filled(v.get("source"))):
        out.append(f"{name}.source is empty")
    if iso(v.get("as_of")) is None:
        out.append(f"{name}.as_of must be a YYYY-MM-DD date")
    extra = [k for k in v if k not in (key, "source", "as_of")]
    if extra:
        out.append(f"{name} has unknown keys {extra}")
    return out


def check_question(q, g_ctx=None):
    """Every problem in one stored question. g_ctx = (nodes, aliases, arms) or None to skip the graph checks."""
    out = []
    if not isinstance(q, dict):
        return ["not an object"]
    want = list(QUESTION_KEYS) + (["odds_date"] if q.get("kind") == "backfilled" else [])
    missing = [k for k in want if k not in q]
    extra = [k for k in q if k not in want]
    if missing:
        out.append(f"missing fields {missing}")
    if extra:
        out.append(f"unknown fields {extra}")
    qid = q.get("id")
    if not (isinstance(qid, str) and len(qid) >= 6 and qid.startswith("Q-") and qid[2:].isdigit()):
        out.append(f"id {qid!r} is not of the form Q-0001")
    for k in ("text", "test", "source", "odds_basis", "arm", "event_id"):
        if not (isinstance(q.get(k), str) and filled(q.get(k))):
            out.append(f"{k} is empty")
    tags = q.get("tags")
    if not (isinstance(tags, list) and 1 <= len(tags) <= 2 and len(set(map(str, tags))) == len(tags)
            and all(t in TAGS for t in tags)):
        out.append(f"tags must be 1 or 2 of {', '.join(TAGS)}")
        tags = []
    if q.get("script_side") not in ("YES", "NO"):
        out.append("script_side must be YES or NO")
    if q.get("kind") not in ("live", "backfilled"):
        out.append("kind must be live or backfilled")
    o = q.get("odds_locked")
    if not (isinstance(o, int) and not isinstance(o, bool) and 1 <= o <= 99):
        out.append("odds_locked must be a whole percent from 1 to 99")
    out.extend(source_shape(q.get("market"), "odds", True))
    out.extend(source_shape(q.get("consensus"), "value", False))
    if "market" in tags and q.get("market") is None:
        out.append("tag market needs market {odds, source, as_of}")
    if "pace" in tags and q.get("consensus") is None:
        out.append("tag pace needs consensus {value, source, as_of}")
    written, due, due_cur = iso(q.get("written")), iso(q.get("due")), iso(q.get("due_current"))
    for k, v in (("written", written), ("due", due), ("due_current", due_cur)):
        if v is None:
            out.append(f"{k} must be a YYYY-MM-DD date")
    if written and due and q.get("kind") == "live" and due < written:
        out.append("due is before written")
    if q.get("lock") != lock_hash(q):
        out.append("LOCK BROKEN: a locked field was changed by hand (" + ", ".join(LOCKED_FIELDS)
                   + "). Put the question back as it was (git diff shows the edit).")
    # deferrals: the only way due_current moves
    defs = q.get("deferrals")
    if not isinstance(defs, list):
        out.append("deferrals must be a list")
        defs = []
    if len(defs) > MAX_DEFERRALS:
        out.append(f"{len(defs)} deferrals; at most {MAX_DEFERRALS} are allowed")
    cur = q.get("due")
    for i, d in enumerate(defs):
        if not isinstance(d, dict) or sorted(d) != ["from", "on", "reason", "to"]:
            out.append(f"deferral {i + 1} must have on, from, to, reason")
            continue
        d_from, d_to = iso(d.get("from")), iso(d.get("to"))
        if iso(d.get("on")) is None or d_from is None or d_to is None:
            out.append(f"deferral {i + 1} has a bad date")
            continue
        if d.get("from") != cur:
            out.append(f"deferral {i + 1} starts from {d.get('from')} but the due date then was {cur}")
        if not (0 < (d_to - d_from).days <= MAX_DEFER_DAYS):
            out.append(f"deferral {i + 1} moves the date {(d_to - d_from).days} days; it must be 1 to {MAX_DEFER_DAYS}")
        if not (isinstance(d.get("reason"), str) and filled(d.get("reason"))):
            out.append(f"deferral {i + 1} has no reason")
        cur = d.get("to")
    if q.get("due_current") != cur:
        out.append(f"due_current is {q.get('due_current')} but the due date and deferrals give {cur}; it moves only by defer")
    # status
    st = q.get("status")
    if st not in ("OPEN", "SETTLED", "VOID"):
        out.append("status must be OPEN, SETTLED or VOID")
    if q.get("kind") == "backfilled" and st != "SETTLED":
        out.append("a backfilled question must be SETTLED")
    if not isinstance(q.get("late"), bool):
        out.append("late must be true or false")
    if st == "OPEN":
        for k in ("outcome", "settled_as_of", "answered_on", "evidence", "evidence_source", "void_reason"):
            if q.get(k) is not None:
                out.append(f"an OPEN question must have {k} null")
        if q.get("late") is not False:
            out.append("an OPEN question must have late false")
    elif st == "SETTLED":
        if q.get("outcome") not in ("YES", "NO"):
            out.append("a SETTLED question needs outcome YES or NO")
        s_as, a_on = iso(q.get("settled_as_of")), iso(q.get("answered_on"))
        if s_as is None or a_on is None:
            out.append("a SETTLED question needs settled_as_of and answered_on dates")
        else:
            if s_as > a_on:
                out.append("settled_as_of is after answered_on")
            if due_cur and s_as > due_cur:
                out.append("settled_as_of is after the due date; settle as of the due date or before")
            if due_cur and q.get("late") is not (a_on > due_cur):
                out.append("late does not match answered_on and due_current")
        for k in ("evidence", "evidence_source"):
            if not (isinstance(q.get(k), str) and filled(q.get(k))):
                out.append(f"a SETTLED question needs {k}")
        if q.get("void_reason") is not None:
            out.append("a SETTLED question must have void_reason null")
        if q.get("kind") == "backfilled":
            od = iso(q.get("odds_date"))
            if od is None:
                out.append("a backfilled question needs odds_date")
            elif s_as and od > s_as:
                out.append("odds_date is after settled_as_of; the odds must come from before the answer")
    elif st == "VOID":
        if not (isinstance(q.get("void_reason"), str) and filled(q.get("void_reason"))):
            out.append("a VOID question needs void_reason")
        if q.get("outcome") is not None or q.get("settled_as_of") is not None:
            out.append("a VOID question must have outcome and settled_as_of null")
        if iso(q.get("answered_on")) is None:
            out.append("a VOID question needs answered_on (the day it was voided)")
    # graph
    if g_ctx is not None and isinstance(q.get("event_id"), str):
        nodes, aliases, arms = g_ctx
        ev = resolve(q["event_id"], nodes, aliases)
        if ev is None:
            out.append(f"event_id {q['event_id']!r} is not a node in the graph")
        elif not is_main_event(nodes[ev]):
            out.append(f"event_id {q['event_id']!r}" + (f" (now {ev})" if ev != q["event_id"] else "")
                       + f" is not a main event ({MAIN_EVENT_RULE})")
        pn = q.get("path_node")
        if pn is not None and (not isinstance(pn, str) or resolve(pn, nodes, aliases) is None):
            out.append(f"path_node {pn!r} is not a node in the graph")
        if isinstance(q.get("arm"), str) and q["arm"] not in arms:
            out.append(f"arm {q['arm']!r} is not a graph arm")
    return out


def check_questions(doc, g=None):
    """Every problem in the questions file, as plain lines."""
    out = []
    g_ctx = None
    if g is not None:
        g_ctx = ({n["id"]: n for n in g["nodes"]}, alias_map(g), set(all_arms(g)))
    extra = [k for k in doc if k not in ("version", "questions")]
    if extra:
        out.append(f"questions.json has unknown top-level keys {extra}")
    seen = set()
    for i, q in enumerate(doc["questions"]):
        qid = q.get("id") if isinstance(q, dict) else None
        name = qid if isinstance(qid, str) else f"question {i + 1}"
        if qid in seen:
            out.append(f"{name}: id is used twice")
        seen.add(qid)
        out.extend(f"{name}: {p}" for p in check_question(q, g_ctx))
    return out


def overdue(questions, today_=None):
    """OPEN questions whose due_current is before today, oldest first."""
    t = today_ or today()
    rows = []
    for q in questions:
        if not isinstance(q, dict) or q.get("status") != "OPEN":
            continue
        d = iso(q.get("due_current"))
        if d is None or d < t:
            rows.append(q)
    rows.sort(key=lambda q: (str(q.get("due_current")), str(q.get("id"))))
    return rows


def settle_cmd(q):
    return (f"{CLI} settle {q.get('id')} --outcome YES_OR_NO --as-of {q.get('due_current')} "
            f"--source {dq(q.get('source'))} --evidence \"WHAT THE SOURCE SHOWS\"")


def question_lines(q, today_=None, indent="  "):
    t = today_ or today()
    d = iso(q.get("due_current"))
    if d is None:
        when = "no readable due date"
    elif d < t:
        when = f"{(t - d).days} day{'s' if (t - d).days != 1 else ''} late"
    elif d == t:
        when = "due today"
    else:
        when = f"in {(d - t).days} day{'s' if (d - t).days != 1 else ''}"
    moved = f" (first due {q.get('due')}, deferred {len(q.get('deferrals') or [])}x)" if q.get("deferrals") else ""
    return [f"{indent}{q.get('id')}  due {q.get('due_current')}  {when}{moved}  event {q.get('event_id')}"
            + (f" via {q.get('path_node')}" if q.get("path_node") else "") + f"  ({q.get('arm')})",
            f"{indent}   {q.get('text')}",
            f"{indent}   Test: {q.get('test')}",
            f"{indent}   Source: {q.get('source')}",
            f"{indent}   {settle_cmd(q)}"]


def lock_message(rows, today_=None):
    t = today_ or today()
    n = len(rows)
    out = [f"EARTH2 IS LOCKED. {n} question{'s are' if n != 1 else ' is'} past due and not answered (today is {t}, America/Phoenix).",
           "Answer them first. Nothing else runs until they are settled.", ""]
    for q in rows:
        out.extend(question_lines(q, t))
        out.append("")
    out.append("A late answer is fine: settle it as of its due date, using the named source.")
    out.append(f"If the test can no longer be checked:   {CLI} void ID --reason \"why\"")
    out.append(f"If the answer is not published yet:     {CLI} defer ID --to YYYY-MM-DD --reason \"why\"   "
               f"(at most {MAX_DEFERRALS} times, {MAX_DEFER_DAYS} days each)")
    out.append("There is no flag or setting that skips this.")
    return "\n".join(out)


def enforce_lock(g=None, tool="This tool", block_on_problems=True):
    """Called by cascade.py, validate_graph.py and merge_nodes.py before they do anything. Exits 3 when locked."""
    safe_output()
    doc, problem = load_questions()
    if problem:
        print(f"EARTH2 IS LOCKED. {problem}")
        sys.exit(3)
    if block_on_problems:
        problems = check_questions(doc, g)
        if problems:
            print(f"EARTH2 IS LOCKED. {tool} will not run because the questions file fails its checks:")
            for p in problems[:40]:
                print("  - " + p)
            print(f"Questions are changed only through {CLI}. Put hand edits back (git diff shows them).")
            sys.exit(3)
    rows = overdue(doc["questions"])
    if rows:
        print(lock_message(rows))
        sys.exit(3)
    return doc


# ---------------------------------------------------------------- the score
def _stats(rows):
    """rows: (p, o, p_s, o_s, backfilled) for settled questions."""
    n = len(rows)
    if not n:
        return {"n": 0, "mean_signed_error": None, "brier": None, "active": False, "needs": MIN_N, "backfilled": 0}
    return {"n": n,
            "mean_signed_error": half_up(sum(r[2] - r[3] for r in rows) / n * 100, 1),
            "brier": half_up(sum((r[0] - r[1]) ** 2 for r in rows) / n, 4),
            "active": n >= MIN_N, "needs": max(0, MIN_N - n),
            "backfilled": sum(1 for r in rows if r[4])}


def compute_score(questions):
    """Everything the score is made of, from the questions alone. Nothing here depends on today's date."""
    settled = [q for q in questions if q.get("status") == "SETTLED" and q.get("outcome") in ("YES", "NO")]

    def row(q):
        p = q["odds_locked"] / 100.0
        o = 1.0 if q["outcome"] == "YES" else 0.0
        yes_side = q.get("script_side") == "YES"
        return (p, o, p if yes_side else 1 - p, o if yes_side else 1 - o, q.get("kind") == "backfilled")

    rows = [(q, row(q)) for q in settled]
    overall = _stats([r for _, r in rows])
    overall["coin_flip"] = COIN_FLIP
    overall.pop("active")
    overall.pop("needs")
    tags = {t: _stats([r for q, r in rows if t in q.get("tags", [])]) for t in TAGS}
    arm_names = sorted({q.get("arm") for q in questions if q.get("arm")})
    arms = {a: _stats([r for q, r in rows if q.get("arm") == a]) for a in arm_names}
    with_mkt = [(q, r) for q, r in rows if isinstance(q.get("market"), dict)]
    market = {"n": len(with_mkt), "earth2_brier": None, "market_brier": None, "earth2_closer": 0, "market_closer": 0, "ties": 0}
    if with_mkt:
        market["earth2_brier"] = half_up(sum((r[0] - r[1]) ** 2 for _, r in with_mkt) / len(with_mkt), 4)
        market["market_brier"] = half_up(sum((q["market"]["odds"] / 100.0 - r[1]) ** 2 for q, r in with_mkt) / len(with_mkt), 4)
        for q, r in with_mkt:
            e, m = abs(r[0] - r[1]), abs(q["market"]["odds"] / 100.0 - r[1])
            market["earth2_closer" if e < m else "market_closer" if m < e else "ties"] += 1
    pace_rows = [q for q in settled if "pace" in q.get("tags", [])]

    def sooner(qs):
        return {"n": len(qs), "share_sooner": half_up(sum(1 for q in qs if q["outcome"] == "YES") / len(qs) * 100, 1) if qs else None}

    pace = sooner(pace_rows)
    pace["by_arm"] = {a: sooner([q for q in pace_rows if q.get("arm") == a])
                      for a in sorted({q.get("arm") for q in pace_rows if q.get("arm")})}
    pace["rule"] = "share of settled pace questions answered YES; write a pace question so YES means sooner or larger than the consensus"
    live = [q for q in questions if q.get("kind") == "live"]
    counts = {"total": len(questions),
              "open": sum(1 for q in questions if q.get("status") == "OPEN"),
              "settled": len(settled),
              "answered_on_time": sum(1 for q in live if q.get("status") == "SETTLED" and not q.get("late")),
              "answered_late": sum(1 for q in live if q.get("status") == "SETTLED" and q.get("late")),
              "backfilled": sum(1 for q in questions if q.get("kind") == "backfilled"),
              "deferred": sum(1 for q in questions if q.get("deferrals")),
              "deferrals": sum(len(q.get("deferrals") or []) for q in questions),
              "void": sum(1 for q in questions if q.get("status") == "VOID")}
    return {"counts": counts, "overall": overall, "market": market, "tags": tags, "arms": arms, "pace": pace}


def corrected_odds(node, tag_stats):
    """(corrected, [(tag, error)]) for a main event when a correction is active, else None.
    corrected = raw odds_now minus the mean signed error of the event's active tags, held between 1 and 99."""
    o = node.get("odds_now")
    if o is None or is_fired(node) or not is_main_event(node):
        return None
    used = [(t, tag_stats[t]["mean_signed_error"]) for t in (node.get("judgment_tags") or [])
            if t in tag_stats and tag_stats[t].get("active") and tag_stats[t].get("mean_signed_error") is not None]
    if not used:
        return None
    raw = float(o) - sum(e for _, e in used) / len(used)
    return half_up(min(99.0, max(1.0, raw)), 1), used


def live_tag_stats():
    """Tag stats straight from questions.json, for cascade.py output. Empty when the file cannot be read."""
    doc, problem = load_questions()
    return {} if problem else compute_score(doc["questions"])["tags"]


def build_outputs(questions, misses, legacy_doc):
    """(corrections, public) as written by score. Deterministic apart from generated_on."""
    s = compute_score(questions)
    rule = ("corrected odds = raw odds_now minus the mean signed error of the event's active judgment tags, "
            "held between 1 and 99. odds_now is never overwritten; the raw number keeps getting scored.")
    corrections = {"version": 1, "generated_on": today().isoformat(), "rule": rule, "min_n": MIN_N,
                   "overall": s["overall"], "market": s["market"], "tags": s["tags"], "arms": s["arms"], "pace": s["pace"]}
    rows = []
    for q in questions:
        r = {k: q.get(k) for k in ("id", "event_id", "path_node", "arm", "text", "test", "source", "tags",
                                   "script_side", "written", "due", "due_current", "odds_locked", "kind", "status",
                                   "outcome", "settled_as_of", "answered_on", "late", "deferrals", "void_reason",
                                   "evidence", "evidence_source")}
        r["market_odds"] = q["market"]["odds"] if isinstance(q.get("market"), dict) else None
        r["consensus_value"] = q["consensus"]["value"] if isinstance(q.get("consensus"), dict) else None
        if q.get("status") == "OPEN":
            r["settle_cmd"] = settle_cmd(q)
        rows.append(r)
    events = (legacy_doc or {}).get("events") or {}
    legacy = {"main_events": len(events), "with_gaps": sum(1 for v in events.values() if v),
              "gaps": {f: sum(1 for v in events.values() if f in v) for f in GAP_FIELDS},
              "as_of": (legacy_doc or {}).get("as_of")}
    by_area = {}
    for m in misses:
        by_area[m.get("area") or "(no area)"] = by_area.get(m.get("area") or "(no area)", 0) + 1
    public = {"version": 1, "generated_on": today().isoformat(),
              "rules": {"min_n": MIN_N, "coin_flip": COIN_FLIP, "max_deferrals": MAX_DEFERRALS,
                        "max_defer_days": MAX_DEFER_DAYS, "today_is": "the date in America/Phoenix (UTC minus 7)",
                        "overdue": "status OPEN and due_current before today", "corrected": rule,
                        "tag_meanings": TAG_MEANINGS},
              "counts": s["counts"], "overall": s["overall"], "market": s["market"], "tags": s["tags"],
              "arms": s["arms"], "pace": s["pace"], "questions": rows, "legacy": legacy,
              "misses": {"total": len(misses), "by_area": dict(sorted(by_area.items(), key=lambda kv: (-kv[1], kv[0]))),
                         "recent": sorted(misses, key=lambda m: str(m.get("date")), reverse=True)[:10]}}
    return corrections, public


def load_misses():
    doc = read_json(PATHS["misses"], {"version": 1, "misses": []})
    if not isinstance(doc, dict) or not isinstance(doc.get("misses"), list):
        raise SystemExit('earth2/scorecard/misses.json must be {"version": 1, "misses": [...]}.')
    return doc


def write_score(questions=None, quiet=False):
    """Recompute and write corrections.json and the page's scorecard.json. Rewrites a file only when it changed."""
    if questions is None:
        doc, problem = load_questions()
        if problem:
            raise SystemExit(problem)
        questions = doc["questions"]
    corrections, public = build_outputs(questions, load_misses()["misses"], legacy_events())
    wrote = []
    for key, obj in (("corrections", corrections), ("public", public)):
        old = None
        try:
            old = read_json(PATHS[key])
        except ValueError:
            pass
        if not isinstance(old, dict) or strip_date(old) != strip_date(obj):
            write_json(PATHS[key], obj)
            wrote.append(os.path.relpath(PATHS[key], ROOT))
    if not quiet:
        print("Score written: " + (", ".join(wrote) if wrote else "no change"))
    return corrections, public


def sync_problems(questions):
    """Lines for validate_graph.py when the written score files do not match questions.json."""
    out = []
    try:
        corrections, public = build_outputs(questions, load_misses()["misses"], legacy_events())
    except SystemExit as e:
        return [str(e)]
    for key, obj in (("public", public), ("corrections", corrections)):
        rel = os.path.relpath(PATHS[key], ROOT)
        try:
            old = read_json(PATHS[key])
        except ValueError:
            old = None
        if not isinstance(old, dict):
            out.append(f"{rel} is missing or unreadable: run {CLI} score")
        elif strip_date(old) != strip_date(obj):
            out.append(f"{rel} is out of step with questions.json: run {CLI} score")
    return out


# ---------------------------------------------------------------- checks for validate_graph.py
def gate_report(g, questions):
    """(fails, notes) for the legacy list and the gate on new main events."""
    fails, notes = [], []
    nodes = {n["id"]: n for n in g["nodes"]}
    aliases = alias_map(g)
    for n in g["nodes"]:
        if "judgment_tags" in n and tags_problem(n["judgment_tags"]):
            fails.append(f"{n['id']}: {tags_problem(n['judgment_tags'])} is not a clean list of tags")
        if "base_rate" in n and base_rate_missing(n["base_rate"]):
            fails.append(f"{n['id']}: base_rate is missing {', '.join(base_rate_missing(n['base_rate']))}")
    legacy = legacy_events()
    if legacy is None:
        return fails + ["earth2/scorecard/legacy_main_events.json is missing or unreadable. Restore it from git."], notes
    events = legacy["events"]
    asked = set()
    for q in questions:
        ev = resolve(q.get("event_id"), nodes, aliases) if isinstance(q, dict) and isinstance(q.get("event_id"), str) else None
        if ev:
            asked.add(ev)
    closed = 0
    actual = {f: 0 for f in GAP_FIELDS}
    for eid, gaps in sorted(events.items()):
        if eid not in nodes:
            surv = resolve(eid, nodes, aliases)
            if surv is None:
                fails.append(f"{eid}: this older main event is gone from the graph and no alias points to a survivor")
            else:
                notes.append(f"NOTE: older main event {eid} was folded into {surv}.")
            continue
        n = nodes[eid]
        for f in GAP_FIELDS:
            ok = field_ok(n, f)
            if not ok:
                actual[f] += 1
            if not ok and f not in gaps:
                fails.append(f"{eid}: this older main event lost its {f}. It had one when the legacy list was written; put it back.")
            if ok and f in gaps:
                closed += 1
    notes.append(f"NOTE: {len(events)} older main events (from before the gate) may keep their gaps: "
                 + ", ".join(f"{actual[f]} with no {f}" for f in GAP_FIELDS) + ". New main events may not.")
    if closed:
        notes.append(f"NOTE: {closed} of those gaps have been closed in the graph. Record it with: {CLI} legacy-refresh")
    for n in g["nodes"]:
        if is_main_event(n) and n["id"] not in events:
            miss = gate_missing(n, n["id"] in asked)
            if miss:
                fails.append(f"{n['id']}: new main event is missing: " + "; ".join(miss)
                             + ". New main events enter through earth2/deepdives/merge_nodes.py with earth2/templates/arm_template.json.")
    return fails, notes


def validator_checks(g, graph_rel=GRAPH_REL):
    """(fails, notes) for everything the scorecard adds to validate_graph.py."""
    fails, notes = [], []
    sp = stamp_problem(g, graph_rel)
    if sp:
        fails.append(sp)
    doc, problem = load_questions()
    if problem:
        return fails + [problem], notes
    fails.extend(check_questions(doc, g))
    fails.extend(sync_problems(doc["questions"]))
    f2, n2 = gate_report(g, doc["questions"])
    fails.extend(f2)
    notes.extend(n2)
    c = compute_score(doc["questions"])["counts"]
    notes.append(f"NOTE: scorecard has {c['total']} questions: {c['open']} open, {c['settled']} settled "
                 f"({c['backfilled']} backfilled), {c['void']} void.")
    return fails, notes


# ---------------------------------------------------------------- adding questions
def _next_number(questions):
    top = 0
    for q in questions:
        qid = q.get("id") if isinstance(q, dict) else None
        if isinstance(qid, str) and qid.startswith("Q-") and qid[2:].isdigit():
            top = max(top, int(qid[2:]))
    return top + 1


def _norm_block(v, key, need_number):
    """Tidy a market or consensus block from a seed (whole numbers stored as integers)."""
    if not isinstance(v, dict):
        return v
    out = {key: v.get(key), "source": v.get("source"), "as_of": v.get("as_of")}
    if is_num(out[key]) and float(out[key]).is_integer():
        out[key] = int(out[key])
    for k in v:
        if k not in out:
            out[k] = v[k]
    return out


def build_question(raw, kind, g, t, label):
    """Turn one seed row into a stored question (without id and lock). Returns (question, errors, notes)."""
    errs, notes = [], []
    if not isinstance(raw, dict):
        return None, [f"{label}: not an object"], notes
    nodes = {n["id"]: n for n in g["nodes"]}
    aliases = alias_map(g)
    known = SEED_FIELDS + (BACKFILL_FIELDS if kind == "backfilled" else [])
    for k in ("id", "lock", "status"):
        if k in raw:
            errs.append(f"{label}: do not give {k}; the CLI assigns it")
    ignored = [k for k in raw if k not in known and k not in ("id", "lock", "status") and not k.startswith("_")]
    if ignored:
        notes.append(f"NOTE {label}: fields not used and not stored: {', '.join(ignored)}")
    if raw.get("kind") not in (None, kind):
        errs.append(f"{label}: kind is {raw.get('kind')!r} but this row is in the {'backfilled' if kind == 'backfilled' else 'questions'} list")
    # event and path
    eid_in = raw.get("event_id")
    eid = resolve(eid_in, nodes, aliases) if isinstance(eid_in, str) else None
    arm = None
    if eid is None:
        near = [k for k in nodes if isinstance(eid_in, str) and k.lower().startswith(eid_in.lower()[:2])][:8]
        errs.append(f"{label}: event_id {eid_in!r} is not a node in the graph. Close: {near}")
    else:
        if eid != eid_in:
            notes.append(f"NOTICE {label}: event_id '{eid_in}' was folded into '{eid}'; using {eid}.")
        if not is_main_event(nodes[eid]):
            pushes = sorted({str(l["target"]) for l in g.get("links", []) if l.get("source") == eid
                             and not l.get("display_only") and l.get("strength") is not None
                             and l.get("target") in nodes and is_main_event(nodes[l["target"]])})
            errs.append(f"{label}: event_id {eid!r}" + (f" (from '{eid_in}')" if eid != eid_in else "")
                        + f" is not a main event (it is a {str(nodes[eid].get('type')).lower()} in model_layer "
                        + f"{nodes[eid].get('model_layer')!r}; a main event is {MAIN_EVENT_RULE}). "
                        + f"Use a main event as event_id and put {eid} in path_node."
                        + (f" Main events {eid} pushes: {', '.join(pushes)}." if pushes else ""))
        arm = nodes[eid].get("arm")
        if raw.get("arm") not in (None, "", arm):
            notes.append(f"NOTE {label}: arm {raw.get('arm')!r} replaced by the event's arm {arm!r}.")
    pn_in = raw.get("path_node")
    pn = None
    if pn_in not in (None, ""):
        pn = resolve(pn_in, nodes, aliases) if isinstance(pn_in, str) else None
        if pn is None:
            errs.append(f"{label}: path_node {pn_in!r} is not a node in the graph")
        elif pn != pn_in:
            notes.append(f"NOTICE {label}: path_node '{pn_in}' was folded into '{pn}'; using {pn}.")
    # tags
    tags = raw.get("tags")
    if isinstance(tags, str):
        tags = [x.strip() for x in tags.split(",") if x.strip()]
    if isinstance(tags, list):
        tags = [str(x).strip().lower() for x in tags]
        tags = [x for x in TAGS if x in tags] + [x for x in tags if x not in TAGS]
    side = str(raw.get("script_side") or "").strip().upper()
    written = raw.get("written") or t.isoformat()
    w = iso(written)
    if w is None:
        errs.append(f"{label}: written {written!r} must be a YYYY-MM-DD date")
    elif w > t:
        errs.append(f"{label}: written {written} is in the future (today is {t})")
    odds = raw.get("odds_locked")
    if is_num(odds) and float(odds).is_integer():
        odds = int(odds)
    q = {"id": None, "event_id": eid or eid_in, "path_node": pn, "arm": arm, "text": raw.get("text"),
         "test": raw.get("test"), "source": raw.get("source"), "tags": tags, "script_side": side,
         "written": written, "due": raw.get("due"), "odds_locked": odds, "odds_basis": raw.get("odds_basis"),
         "market": _norm_block(raw.get("market"), "odds", True),
         "consensus": _norm_block(raw.get("consensus"), "value", False), "kind": kind}
    for k in ("text", "test", "source", "odds_basis"):
        if isinstance(q[k], str):
            q[k] = q[k].strip()
    if kind == "backfilled":
        q["odds_date"] = raw.get("odds_date")
    q.update({"lock": None, "status": "OPEN", "due_current": q["due"], "deferrals": [], "outcome": None,
              "settled_as_of": None, "answered_on": None, "late": False, "evidence": None, "evidence_source": None,
              "void_reason": None})
    if kind == "backfilled":
        s_as, d = iso(raw.get("settled_as_of")), iso(raw.get("due"))
        q.update({"status": "SETTLED", "outcome": str(raw.get("outcome") or "").strip().upper(),
                  "settled_as_of": raw.get("settled_as_of"), "answered_on": t.isoformat(),
                  "late": bool(d and t > d), "evidence": raw.get("evidence"),
                  "evidence_source": raw.get("evidence_source")})
        if s_as and s_as > t:
            errs.append(f"{label}: settled_as_of {raw.get('settled_as_of')} is in the future")
    return q, errs, notes


def add_questions(live_rows, backfilled_rows, g, doc, on_duplicate="refuse", label="row"):
    """Validate every row, then give ids and locks. Returns (new_questions, errors, notes). Writes nothing."""
    t = today()
    errs, notes, new = [], [], []
    number = _next_number(doc["questions"])
    g_ctx = ({n["id"]: n for n in g["nodes"]}, alias_map(g), set(all_arms(g)))
    have = {(q.get("event_id"), q.get("text"), q.get("due")): q.get("id") for q in doc["questions"]}
    batches = (("live", live_rows or [], "questions"), ("backfilled", backfilled_rows or [], "backfilled"))
    for kind, rows, list_name in batches:
        for i, raw in enumerate(rows):
            name = f"{list_name}[{i + 1}]" if label == "row" else label
            q, e, n = build_question(raw, kind, g, t, name)
            notes.extend(n)
            if q is None:
                errs.extend(e)
                continue
            key = (q["event_id"], q["text"], q["due"])
            if key in have and not e:
                if on_duplicate == "skip":
                    notes.append(f"NOTE {name}: already in the file as {have[key]}; skipped.")
                else:
                    errs.append(f"{name}: this question is already in the file as {have[key]} (same event, text and due date)")
                continue
            q["id"] = f"Q-{number:04d}"
            q["lock"] = lock_hash(q)
            # report every problem in the row at once, without repeating what build_question already said
            skip = ("LOCK BROKEN", "due_current")
            if any("event_id" in x for x in e):
                skip += ("event_id", "arm")
            if any("path_node" in x for x in e):
                skip += ("path_node",)
            if any(": written" in x for x in e):
                skip += ("written",)
            e = e + [f"{name}: {p}" for p in check_question(q, g_ctx) if not p.startswith(skip)]
            if e:
                errs.extend(e)
                continue
            if kind == "live" and iso(q["due"]) < t:
                notes.append(f"NOTE {name}: {q['id']} is live but its due date {q['due']} has passed. It is overdue "
                             "until settled. If the answer was already known, it belongs in the backfilled list.")
            have[key] = q["id"]
            number += 1
            new.append(q)
    return new, errs, notes


def refuse(errs, what):
    print(f"REFUSED: {what}. Nothing was written.")
    for e in errs[:80]:
        print("  - " + e)
    if len(errs) > 80:
        print(f"  ... and {len(errs) - 80} more")
    sys.exit(2)


def require_questions():
    doc, problem = load_questions()
    if problem:
        raise SystemExit(problem)
    return doc


def find_question(doc, qid):
    want = str(qid).strip().upper()
    for q in doc["questions"]:
        if str(q.get("id")).upper() == want:
            return q
    raise SystemExit(f"No question {qid}. Run: {CLI} list")


# ---------------------------------------------------------------- commands
def cmd_due(a):
    doc = require_questions()
    t = today()
    qs = doc["questions"]
    late = overdue(qs, t)
    print(f"EARTH2 SCORECARD  today {t} (America/Phoenix)")
    if late:
        print(f"\nOVERDUE ({len(late)}). Settle these now; cascade.py, validate_graph.py and merge_nodes.py are locked until you do.")
        for q in late:
            print("\n".join(question_lines(q, t)))
    else:
        print("\nNothing is overdue.")
    late_ids = {q["id"] for q in late}
    rest = sorted((q for q in qs if q.get("status") == "OPEN" and q["id"] not in late_ids),
                  key=lambda q: (q.get("due_current"), q.get("id")))
    print(f"\nNEXT OPEN ({min(10, len(rest))} of {len(rest)})")
    for q in rest[:10]:
        print("\n".join(question_lines(q, t)))
    if not rest:
        print("  none")
    if late:
        print(f"\nIf a test can no longer be checked: {CLI} void ID --reason \"why\"")
        print(f"If the answer is not published yet: {CLI} defer ID --to YYYY-MM-DD --reason \"why\"")
    return 0


def _apply_new(doc, new, g=None):
    doc["questions"].extend(new)
    write_json(PATHS["questions"], doc)
    for q in new:
        print(f"  {q['id']}  {q['kind']:<10} {q['status']:<8} due {q['due']}  {q['event_id']}  {q['odds_locked']}%  {', '.join(q['tags'])}")


def cmd_add(a):
    doc = require_questions()
    g = load_graph()
    raw = {"event_id": a.event, "path_node": a.path_node, "text": a.text, "test": a.test, "source": a.source,
           "tags": a.tags, "script_side": a.script_side, "written": a.written, "due": a.due,
           "odds_locked": a.odds, "odds_basis": a.odds_basis, "market": None, "consensus": None}
    if a.market_odds is not None or a.market_source or a.market_as_of:
        raw["market"] = {"odds": a.market_odds, "source": a.market_source, "as_of": a.market_as_of}
    if a.consensus_value is not None or a.consensus_source or a.consensus_as_of:
        v = a.consensus_value
        try:
            v = float(v) if v is not None else None
        except ValueError:
            pass
        raw["consensus"] = {"value": v, "source": a.consensus_source, "as_of": a.consensus_as_of}
    new, errs, notes = add_questions([raw], [], g, doc, label="add")
    for n in notes:
        print(n)
    if errs:
        refuse(errs, "the question fails the rules")
    print("ADDED")
    _apply_new(doc, new)
    write_score(doc["questions"])
    return 0


def cmd_import_seed(a):
    doc = require_questions()
    g = load_graph()
    try:
        seed = read_json(a.file)
    except ValueError as e:
        raise SystemExit(f"{a.file} does not load as JSON: {e}")
    if not isinstance(seed, dict):
        raise SystemExit(f"Seed file not found or not an object: {a.file}")
    known = ("questions", "backfilled", "event_tags", "legacy_base_rates")
    skipped = [k for k in seed if k not in known and not k.startswith("_")]
    nodes = {n["id"]: n for n in g["nodes"]}
    aliases = alias_map(g)
    errs, notes = [], []
    if skipped:
        notes.append(f"NOTE: seed keys not used: {', '.join(skipped)}")
    for k in ("questions", "backfilled"):
        if not isinstance(seed.get(k, []), list):
            errs.append(f"{k} must be a list")
    for k in ("event_tags", "legacy_base_rates"):
        if not isinstance(seed.get(k, {}), dict):
            errs.append(f"{k} must be an object")
    if errs:
        refuse(errs, "the seed file is not in the seed format")
    new, e2, n2 = add_questions(seed.get("questions"), seed.get("backfilled"), g, doc)
    errs.extend(e2)
    notes.extend(n2)
    tag_writes, rate_writes = [], []
    for raw_id, tags in (seed.get("event_tags") or {}).items():
        nid = resolve(raw_id, nodes, aliases)
        if nid is None:
            errs.append(f"event_tags: {raw_id!r} is not a node in the graph")
            continue
        if nid != raw_id:
            notes.append(f"NOTICE event_tags: '{raw_id}' was folded into '{nid}'; using {nid}.")
        if not is_main_event(nodes[nid]):
            errs.append(f"event_tags: {nid!r} is not a main event ({MAIN_EVENT_RULE})")
            continue
        clean = [x for x in TAGS if x in tags] + [x for x in tags if x not in TAGS] if isinstance(tags, list) else tags
        p = tags_problem(clean)
        if p:
            errs.append(f"event_tags {raw_id}: {p}")
            continue
        if nodes[nid].get("judgment_tags") not in (None, clean):
            notes.append(f"NOTE event_tags {nid}: judgment_tags change from {nodes[nid].get('judgment_tags')} to {clean}.")
        tag_writes.append((nid, clean))
    for raw_id, br in (seed.get("legacy_base_rates") or {}).items():
        nid = resolve(raw_id, nodes, aliases)
        if nid is None:
            errs.append(f"legacy_base_rates: {raw_id!r} is not a node in the graph")
            continue
        if nid != raw_id:
            notes.append(f"NOTICE legacy_base_rates: '{raw_id}' was folded into '{nid}'; using {nid}.")
        miss = base_rate_missing(br)
        if miss:
            errs.append(f"legacy_base_rates {raw_id}: missing or bad {', '.join(miss)} (value is a percent from 0 to 100)")
            continue
        clean = {"value": br["value"], "reference_class": br["reference_class"].strip(), "source": br["source"].strip()}
        if nodes[nid].get("base_rate") not in (None, clean):
            notes.append(f"NOTE legacy_base_rates {nid}: base_rate changes from {nodes[nid].get('base_rate')} to {clean}.")
        rate_writes.append((nid, clean))
    for n in notes:
        print(n)
    if errs:
        refuse(errs, f"{len(errs)} problem{'s' if len(errs) != 1 else ''} in {a.file}")
    live = sum(1 for q in new if q["kind"] == "live")
    print(f"SEED OK: live questions {live}, backfilled answers {len(new) - live}, events given judgment tags "
          f"{len(tag_writes)}, events given a base rate {len(rate_writes)}.")
    if a.dry_run:
        print("DRY RUN: nothing written.")
        return 0
    odds_before = {n["id"]: n.get("odds_now") for n in g["nodes"]}
    stamp_before = odds_stamp(g["nodes"])
    changed = 0
    for nid, tags in tag_writes:
        if nodes[nid].get("judgment_tags") != tags:
            nodes[nid]["judgment_tags"] = tags
            changed += 1
    for nid, br in rate_writes:
        if nodes[nid].get("base_rate") != br:
            nodes[nid]["base_rate"] = br
            changed += 1
    if {n["id"]: n.get("odds_now") for n in g["nodes"]} != odds_before or odds_stamp(g["nodes"]) != stamp_before:
        raise SystemExit("Refusing to write: an odds value would change. This command writes structure only.")
    if changed:
        write_json(PATHS["graph"], g)
        print(f"Graph: judgment_tags and base_rate written ({changed} node fields; structure only, no odds moved).")
    if new:
        print("ADDED")
        _apply_new(doc, new)
    _legacy_refresh(g)
    write_score(doc["questions"])
    late = overdue(doc["questions"])
    if late:
        print(f"\n{len(late)} imported question{'s are' if len(late) != 1 else ' is'} already past due. Run: {CLI} due")
    return 0


def cmd_settle(a):
    doc = require_questions()
    q = find_question(doc, a.id)
    t = today()
    errs = []
    if q["status"] != "OPEN":
        errs.append(f"{q['id']} is {q['status']}, not OPEN. An answer is recorded once and does not change.")
    outcome = str(a.outcome).strip().upper()
    if outcome not in ("YES", "NO"):
        errs.append("--outcome must be YES or NO")
    as_of = iso(a.as_of)
    if iso(q.get("due_current")) is None:
        errs.append(f"{q['id']} has no readable due date; the file was edited by hand. Put it back (git diff shows the edit).")
    if as_of is None:
        errs.append("--as-of must be a YYYY-MM-DD date: the day the answer became true in the world")
    else:
        if as_of > t:
            errs.append(f"--as-of {a.as_of} is in the future (today is {t})")
        if iso(q["due_current"]) and as_of > iso(q["due_current"]):
            errs.append(f"--as-of {a.as_of} is after the due date {q['due_current']}. Settle as of the due date or before; "
                        "what happened later does not count.")
    if not filled(a.source):
        errs.append("--source is empty: name where the answer was read")
    if not filled(a.evidence):
        errs.append("--evidence is empty: say what the source shows")
    if errs:
        refuse(errs, f"{q['id']} was not settled")
    late = t > iso(q["due_current"])
    q.update({"status": "SETTLED", "outcome": outcome, "settled_as_of": a.as_of, "answered_on": t.isoformat(),
              "late": late, "evidence": a.evidence.strip(), "evidence_source": a.source.strip()})
    write_json(PATHS["questions"], doc)
    side = "with" if outcome == q["script_side"] else "against"
    print(f"SETTLED {q['id']}: {outcome} as of {a.as_of}, recorded {t}"
          + (f", LATE (due {q['due_current']})" if late else ", on time")
          + f". Earth2 had YES at {q['odds_locked']}%. The answer went {side} the Earth2 script.")
    if a.source.strip() != q["source"]:
        print(f"NOTE: the named source was {q['source']!r}; the answer was read from {a.source.strip()!r}.")
    write_score(doc["questions"])
    left = overdue(doc["questions"], t)
    print(f"Overdue now: {len(left)}." + ("" if left else " The lock is clear."))
    return 0


def cmd_defer(a):
    doc = require_questions()
    q = find_question(doc, a.id)
    t = today()
    errs = []
    if q["status"] != "OPEN":
        errs.append(f"{q['id']} is {q['status']}, not OPEN")
    if len(q["deferrals"]) >= MAX_DEFERRALS:
        errs.append(f"{q['id']} has been deferred {len(q['deferrals'])} times already; {MAX_DEFERRALS} is the limit. Settle it or void it.")
    to, cur = iso(a.to), iso(q["due_current"])
    last = cur + dt.timedelta(days=MAX_DEFER_DAYS) if cur else None
    if to is None:
        errs.append("--to must be a YYYY-MM-DD date")
    elif cur:
        if to <= cur:
            errs.append(f"--to {a.to} is not after the current due date {q['due_current']}")
        elif to > last:
            errs.append(f"--to {a.to} is {(to - cur).days} days after {q['due_current']}; a deferral is at most "
                        f"{MAX_DEFER_DAYS} days (latest {last})")
        elif to < t:
            errs.append(f"--to {a.to} is already past (today is {t}), so the question would still be overdue."
                        + (f" The latest allowed date is {last}." if last >= t else
                           f" The latest allowed date, {last}, is past too: settle it as of {q['due_current']} or void it."))
    if not filled(a.reason):
        errs.append("--reason is empty")
    if errs:
        refuse(errs, f"{q['id']} was not deferred")
    q["deferrals"].append({"on": t.isoformat(), "from": q["due_current"], "to": a.to, "reason": a.reason.strip()})
    q["due_current"] = a.to
    write_json(PATHS["questions"], doc)
    left = MAX_DEFERRALS - len(q["deferrals"])
    print(f"DEFERRED {q['id']}: due {q['deferrals'][-1]['from']} moved to {a.to} (first due {q['due']}). "
          f"Deferrals left: {left}. This is logged and shown on the page.")
    write_score(doc["questions"])
    return 0


def cmd_void(a):
    doc = require_questions()
    q = find_question(doc, a.id)
    errs = []
    if q["status"] != "OPEN":
        errs.append(f"{q['id']} is {q['status']}, not OPEN. Only an open question can be voided.")
    if not filled(a.reason):
        errs.append("--reason is empty: say why the test can no longer be checked")
    if errs:
        refuse(errs, f"{q['id']} was not voided")
    q.update({"status": "VOID", "void_reason": a.reason.strip(), "answered_on": today().isoformat()})
    write_json(PATHS["questions"], doc)
    print(f"VOID {q['id']}: left out of the score. This is logged and shown on the page.")
    write_score(doc["questions"])
    return 0


def cmd_miss(a):
    doc = load_misses()
    if a.miss_cmd == "list":
        if not doc["misses"]:
            print("No misses logged.")
        for m in doc["misses"]:
            print(f"{m['id']}  {m['date']}  [{m['area']}]  {m['what']}\n     why no node: {m['why']}\n     source: {m['source']}")
        return 0
    errs = []
    d = iso(a.date)
    if d is None:
        errs.append("--date must be a YYYY-MM-DD date")
    elif d > today():
        errs.append("--date is in the future")
    for k in ("what", "source", "area", "why"):
        if not filled(getattr(a, k)):
            errs.append(f"--{k} is empty")
    if errs:
        refuse(errs, "the miss was not logged")
    area = a.area.strip()
    arms = all_arms(load_graph())
    match = [x for x in arms if x.lower() == area.lower()]
    if match:
        area = match[0]
    else:
        print(f"NOTE: area {area!r} is not a graph arm; stored as written. Arms: {', '.join(arms)}")
    top = max([int(m["id"][2:]) for m in doc["misses"] if str(m.get("id", "")).startswith("M-") and m["id"][2:].isdigit()] or [0])
    row = {"id": f"M-{top + 1:04d}", "date": a.date, "what": a.what.strip(), "source": a.source.strip(), "area": area,
           "why": a.why.strip(), "logged_on": today().isoformat()}
    doc["misses"].append(row)
    write_json(PATHS["misses"], doc)
    print(f"MISS LOGGED {row['id']}: {row['date']} [{area}] {row['what']}")
    write_score()
    return 0


def cmd_score(a):
    doc = require_questions()
    corrections, public = write_score(doc["questions"])
    c, o, m = public["counts"], public["overall"], public["market"]
    t = today()
    print(f"\nEARTH2 SCORE  today {t}")
    n_late = len(overdue(doc["questions"], t))
    print(f"Questions {c['total']}: overdue {n_late}, open {c['open'] - n_late}, answered on time "
          f"{c['answered_on_time']}, answered late {c['answered_late']}, backfilled {c['backfilled']}, "
          f"deferred {c['deferred']}, void {c['void']}")
    if not o["n"]:
        print("No answers yet. The score starts with the first settled question.")
    else:
        print(f"Brier {o['brier']:.4f} on {o['n']} answers ({o['backfilled']} backfilled). Coin flip is {COIN_FLIP}. Lower is better.")
        if m["n"]:
            print(f"On the {m['n']} with market odds: Earth2 {m['earth2_brier']:.4f}, market {m['market_brier']:.4f}. "
                  f"Earth2 closer on {m['earth2_closer']}, market closer on {m['market_closer']}, ties {m['ties']}.")
        print(f"Overall Earth2 is {abs(o['mean_signed_error']):.1f} points "
              + ("too high" if o["mean_signed_error"] > 0 else "too low" if o["mean_signed_error"] < 0 else "off")
              + " on its own script.")
    print(f"\n{'TAG':<8}{'N':>4}{'OFF BY':>9}{'BRIER':>9}  STATE")
    for tag in TAGS:
        s = public["tags"][tag]
        off = "" if s["mean_signed_error"] is None else f"{s['mean_signed_error']:+.1f}"
        br = "" if s["brier"] is None else f"{s['brier']:.4f}"
        print(f"{tag:<8}{s['n']:>4}{off:>9}{br:>9}  " + ("active" if s["active"] else f"needs {s['needs']} more"))
    if public["arms"]:
        print(f"\n{'ARM':<30}{'N':>4}{'OFF BY':>9}{'BRIER':>9}  STATE")
        for arm, s in public["arms"].items():
            off = "" if s["mean_signed_error"] is None else f"{s['mean_signed_error']:+.1f}"
            br = "" if s["brier"] is None else f"{s['brier']:.4f}"
            print(f"{arm[:29]:<30}{s['n']:>4}{off:>9}{br:>9}  " + ("active" if s["active"] else f"needs {s['needs']} more"))
    p = public["pace"]
    if p["n"]:
        print(f"\nPace: {p['share_sooner']}% of {p['n']} arrived sooner or larger than consensus. "
              + "; ".join(f"{k} {v['share_sooner']}% of {v['n']}" for k, v in p["by_arm"].items()))
    print("OFF BY is in points: plus means Earth2 rates its own script too high. A tag corrects main events once it has "
          f"{MIN_N} answers.")
    return 0


def _legacy_refresh(g):
    legacy = legacy_events()
    if legacy is None:
        raise SystemExit("earth2/scorecard/legacy_main_events.json is missing or unreadable. Restore it from git. "
                         "This command never creates the list and never adds an event to it.")
    nodes = {n["id"]: n for n in g["nodes"]}
    before = {f: sum(1 for v in legacy["events"].values() if f in v) for f in GAP_FIELDS}
    changed = False
    for eid, gaps in legacy["events"].items():
        if eid not in nodes:
            continue
        keep = [f for f in gaps if not field_ok(nodes[eid], f)]
        if keep != gaps:
            legacy["events"][eid] = keep
            changed = True
    after = {f: sum(1 for v in legacy["events"].values() if f in v) for f in GAP_FIELDS}
    print(f"Legacy gaps ({len(legacy['events'])} older main events): "
          + ", ".join(f"no {f} {before[f]} to {after[f]}" for f in GAP_FIELDS)
          + ("" if changed else " (no change)"))
    if changed:
        legacy["refreshed_on"] = today().isoformat()
        write_json(PATHS["legacy"], legacy)
    return changed


def cmd_legacy_refresh(a):
    _legacy_refresh(load_graph())
    write_score()
    return 0


def cmd_list(a):
    doc = require_questions()
    t = today()
    late = {q["id"] for q in overdue(doc["questions"], t)}
    rows = [q for q in doc["questions"] if not a.status or q["status"] == a.status.upper()]
    for q in rows:
        st = "OVERDUE" if q["id"] in late else q["status"]
        ans = f" {q['outcome']}" if q.get("outcome") else ""
        print(f"{q['id']}  {st:<8}{ans:<4} due {q['due_current']}  {q['event_id']:<8} {q['odds_locked']:>3}%  "
              f"{','.join(q['tags']):<14} {q['kind']:<10} {q['text'][:90]}")
    print(f"{len(rows)} question{'s' if len(rows) != 1 else ''}.")
    return 0


def cmd_show(a):
    print(json.dumps(find_question(require_questions(), a.id), indent=1, ensure_ascii=False))
    return 0


def cmd_check(a):
    fails, notes = validator_checks(load_graph())
    for n in notes:
        print(n)
    if fails:
        print(f"FAILED {len(fails)} scorecard checks:")
        for f in fails:
            print("  - " + f)
        return 1
    print("SCORECARD CHECKS PASS")
    return 0


def main(argv=None):
    p = argparse.ArgumentParser(description="The Earth2 scorecard. Run 'due' first, every session.")
    sub = p.add_subparsers(dest="cmd")
    sub.add_parser("due", help="overdue questions and the next 10 open, with the exact settle command for each")
    s = sub.add_parser("add", help="add one question")
    s.add_argument("--event", required=True, help="a main event id: an END EVENT or a board row (an old folded id resolves to its survivor)")
    s.add_argument("--path-node", help="a node id on the path, if the question is about a step on the way")
    s.add_argument("--text", required=True, help="a yes/no question")
    s.add_argument("--test", required=True, help="the exact pass or fail rule")
    s.add_argument("--source", required=True, help="the named primary source to settle against")
    s.add_argument("--tags", required=True, help="1 or 2 of: " + ", ".join(TAGS))
    s.add_argument("--script-side", required=True, help="YES or NO: the answer that follows the Earth2 script")
    s.add_argument("--due", required=True, help="YYYY-MM-DD; never changes")
    s.add_argument("--odds", required=True, type=float, help="Earth2's odds of YES, whole percent 1 to 99")
    s.add_argument("--odds-basis", required=True, help="where the odds come from")
    s.add_argument("--written", help="YYYY-MM-DD (default today)")
    s.add_argument("--market-odds", type=float)
    s.add_argument("--market-source")
    s.add_argument("--market-as-of")
    s.add_argument("--consensus-value")
    s.add_argument("--consensus-source")
    s.add_argument("--consensus-as-of")
    s = sub.add_parser("import-seed", help="add questions, backfilled answers, event tags and base rates from a seed file")
    s.add_argument("file")
    s.add_argument("--dry-run", action="store_true")
    s = sub.add_parser("settle", help="record the answer to a question")
    s.add_argument("id")
    s.add_argument("--outcome", required=True)
    s.add_argument("--as-of", required=True, help="the date the answer became true in the world, on or before the due date")
    s.add_argument("--source", required=True)
    s.add_argument("--evidence", required=True)
    s = sub.add_parser("defer", help=f"move a due date (at most {MAX_DEFERRALS} times, {MAX_DEFER_DAYS} days each)")
    s.add_argument("id")
    s.add_argument("--to", required=True)
    s.add_argument("--reason", required=True)
    s = sub.add_parser("void", help="drop a question whose test became impossible")
    s.add_argument("id")
    s.add_argument("--reason", required=True)
    s = sub.add_parser("miss", help="big real events the graph had no node for")
    ms = s.add_subparsers(dest="miss_cmd")
    m = ms.add_parser("add")
    for k in ("date", "what", "source", "area", "why"):
        m.add_argument("--" + k, required=True)
    ms.add_parser("list")
    sub.add_parser("score", help="recompute everything and write corrections.json and the page's scorecard.json")
    sub.add_parser("legacy-refresh", help="record gaps closed on the older main events (can only shrink)")
    s = sub.add_parser("list", help="one line per question")
    s.add_argument("--status")
    s = sub.add_parser("show", help="one question in full")
    s.add_argument("id")
    sub.add_parser("check", help="the scorecard checks validate_graph.py runs")
    a = p.parse_args(argv)
    safe_output()
    if a.cmd == "miss" and not a.miss_cmd:
        p.error("miss needs add or list")
    table = {"due": cmd_due, "add": cmd_add, "import-seed": cmd_import_seed, "settle": cmd_settle, "defer": cmd_defer,
             "void": cmd_void, "miss": cmd_miss, "score": cmd_score, "legacy-refresh": cmd_legacy_refresh,
             "list": cmd_list, "show": cmd_show, "check": cmd_check}
    if a.cmd not in table:
        p.print_help()
        return 0
    return table[a.cmd](a)


if __name__ == "__main__":
    sys.exit(main())
