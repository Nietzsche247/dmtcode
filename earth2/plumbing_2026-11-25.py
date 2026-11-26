#!/usr/bin/env python3
"""
plumbing_2026-11-25.py
Earth2 session 1 plumbing: folds, link strengths, kill conditions, calendar, date check.
Python 3.8+, standard library only. Reads the graph, writes it back atomically.

USAGE
  python3 earth2/plumbing_2026-11-25.py public/future/earth2/graph.json [--out PATH] [--dry-run]

It is not meant to run twice on the same file: it refuses if graph["merges"] already holds the
"session 1 plumbing 2026-11-25" entry. Odds (odds_now) are never changed; the script checks that
before it writes.
"""
import argparse
import copy
import datetime as dt
import json
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from plumbing_2026_11_25_data import (FOLDS, TWIN_REASON, WIRE, KILL, CALENDAR, WINDOW_FIXES)  # noqa: E402

TAG = "session 1 plumbing 2026-11-25"
TODAY = "2026-11-25"

ORIGIN_RANK = {
    "board A to about B": 9,
    "trigger tree lift points": 8,
    "new arm research agent, A to about B": 7,
    "rare-earth deep dive Nov 23 (A to about B, deep-dive odds)": 7,
    "food deep dive Nov 23 (A to about B, deep-dive odds)": 7,
    "hard pass Nov 25 (A to about B, estimate)": 6,
}


def link_rank(e):
    """Higher is better evidence: carries a move, measured (not estimated), source rank, strength."""
    return (0 if e.get("display_only") else 1,
            0 if e.get("estimated") else 1,
            ORIGIN_RANK.get(e.get("origin"), 0),
            e.get("strength") or 0)


def short(e):
    return {k: e.get(k) for k in ("source", "target", "strength", "delay_days", "kind", "origin", "display_only")}


def twin_folds(g, explicit):
    """Every upcoming spark X.spark.NN whose sealed twin sealed-spark:X:NN is identical apart from id,
    odds_history and spark_set."""
    nodes = {n["id"]: n for n in g["nodes"]}
    done = {o for o, _, _ in explicit}
    out = []
    for n in g["nodes"]:
        if ".spark." not in n["id"] or n["id"] in done:
            continue
        trig, _, k = n["id"].partition(".spark.")
        twin = nodes.get(f"sealed-spark:{trig}:{k}")
        if not twin:
            continue
        diff = {x for x in set(n) | set(twin) if n.get(x) != twin.get(x)} - {"id", "odds_history", "spark_set"}
        if diff:
            raise SystemExit(f"spark twin {n['id']} differs on {diff}")
        out.append((n["id"], twin["id"], TWIN_REASON))
    return out


def fold_all(g, log):
    nodes = {n["id"]: n for n in g["nodes"]}
    alias = {}
    records = []
    plan = list(FOLDS) + twin_folds(g, FOLDS)
    for old, surv, reason in plan:
        if old not in nodes or surv not in nodes:
            raise SystemExit(f"fold {old} -> {surv}: missing node")
        c, s = nodes[old], nodes[surv]
        rec = {"old_id": old, "survivor_id": surv, "reason": reason, "fields_added": [], "links_repointed": 0,
               "links_dropped": [], "companies_repointed": []}
        # keep a full record of the copy on the survivor
        keep = {k: c.get(k) for k in ("id", "label", "type", "model_layer", "odds_now", "odds_text", "odds_by",
                                      "window_start", "window_peak", "window_end", "status", "source",
                                      "settlement_test", "spark_set", "odds_history") if c.get(k) is not None}
        keep["folded_on"] = TODAY
        s.setdefault("folded_from", []).append(keep)
        # union useful fields the survivor lacks
        # (least_capability_basis and links_text describe the copy itself, so they stay in folded_from only)
        for k in ("settlement_test", "who_it_hits_text", "next_watch"):
            if c.get(k) and not s.get(k):
                s[k] = c[k]
                rec["fields_added"].append(k)
        # layers: add the copy's own layers; a tree spark's layers are inherited from its trigger, so skip those
        if c.get("type") != "SPARK":
            extra = [x for x in (c.get("layers_hit") or []) if x not in (s.get("layers_hit") or [])]
            if extra:
                s["layers_hit"] = list(s.get("layers_hit") or []) + extra
                rec["fields_added"].append("layers_hit +" + "+".join(extra))
        if c.get("spark_set") and s.get("spark_set") and c["spark_set"] != s["spark_set"]:
            s["spark_set"] = "; ".join(sorted({s["spark_set"], c["spark_set"]}, key=lambda x: (x != "sealed Nov 19", x)))
            rec["fields_added"].append("spark_set")
        if s.get("model_layer") == "tree" and c.get("model_layer") == "tree":
            # identical spark twins: both rows of history belong to the one spark
            hist = s.get("odds_history", []) + [h for h in c.get("odds_history", []) if h not in s.get("odds_history", [])]
            s["odds_history"] = sorted(hist, key=lambda h: h.get("date", ""))
        # repoint links
        for e in g["links"]:
            for end in ("source", "target"):
                if e[end] == old:
                    e[end] = surv
                    rec["links_repointed"] += 1
        # companies
        for co in g.get("companies", []):
            hit = False
            for fld in ("event_nodes", "context_nodes"):
                if old in (co.get(fld) or []):
                    co[fld] = list(dict.fromkeys(surv if x == old else x for x in co[fld]))
                    hit = True
            for so in co.get("sits_on", []) or []:
                if so.get("node") == old:
                    so["node"] = surv
                    hit = True
            if hit:
                rec["companies_repointed"].append(co.get("ticker"))
        for ch in g.get("chains", []):
            ch["legs"] = [surv if x == old else x for x in ch.get("legs", [])]
        g["nodes"] = [n for n in g["nodes"] if n["id"] != old]
        del nodes[old]
        alias[old] = {"survivor": surv, "reason": reason, "date": TODAY}
        records.append(rec)
    # drop self links and duplicate pairs created by the folds
    by_pair = {}
    kept = []
    for e in g["links"]:
        if e["source"] == e["target"]:
            rec = next(r for r in records if r["survivor_id"] == e["source"])
            rec["links_dropped"].append({"link": short(e), "why": "self link after fold"})
            continue
        key = (e["source"], e["target"])
        if key in by_pair:
            a = by_pair[key]
            win, lose = (a, e) if link_rank(a) >= link_rank(e) else (e, a)
            if win is e:
                kept[kept.index(a)] = e
                by_pair[key] = e
            surv = e["source"] if any(r["survivor_id"] == e["source"] for r in records) else e["target"]
            rec = next((r for r in records if r["survivor_id"] in key), None)
            why = ("kept the link that carries a move" if bool(win.get("display_only")) != bool(lose.get("display_only"))
                   else "kept the higher strength of two estimates" if (win.get("strength") or 0) != (lose.get("strength") or 0)
                   else "kept the first of two identical links")
            rec["links_dropped"].append({"link": short(lose), "kept": short(win), "why": why})
            continue
        by_pair[key] = e
        kept.append(e)
    g["links"] = kept
    log["folds"] = records
    log["alias_map"] = alias
    return alias


def strength_of(a_now, b_now, b_if):
    return min(1.0, round(abs(b_if - b_now) / (100.0 - a_now), 4))


def wire_all(g, log):
    nodes = {n["id"]: n for n in g["nodes"]}
    wired, kept = [], {"driver curve": 0, "challenger of the same major": 0, "shared source curve": 0}
    spec = {(w["source"], w["target"]): w for w in WIRE}
    used = set()
    for e in g["links"]:
        if not e.get("display_only"):
            continue
        key = (e["source"], e["target"])
        s, t = nodes[e["source"]], nodes[e["target"]]
        if key in spec:
            w = spec[key]
            used.add(key)
            a_now = w.get("a_used", s["odds_now"])
            b_now = t["odds_now"]
            st = strength_of(a_now, w.get("b_base", b_now), w["b_if"])
            if st <= 0:
                raise SystemExit(f"wire {key}: zero strength")
            base = e["reason"].replace(" Display only.", "").replace("Display only.", "").strip()
            nums = f"A now {fmt(s['odds_now'])}" + (f" ({w['a_note']})" if w.get("a_note") else "") + \
                   f", B now {fmt(b_now)}, B if A fires {fmt(w['b_if'])}"
            e.update({"strength": st, "delay_days": int(w["delay"]), "display_only": False, "estimated": True,
                      "delay_estimated": True, "kind": w.get("kind", e.get("kind")),
                      "reason": f"{base} Wired Nov 25: {w['why']} ({nums}).",
                      "origin": "trigger tree board reference, wired Nov 25 (A to about B, estimate)"})
            wired.append({"source": key[0], "target": key[1], "strength": st, "delay_days": int(w["delay"]),
                          "a_now": s["odds_now"], "b_now": b_now, "b_if": w["b_if"]})
            continue
        if s["type"] == "DRIVER":
            e["display_only_reason"] = "driver curve: a measured series with no odds, so no strength can be set and a cascade can neither start nor land on it"
            kept["driver curve"] += 1
        elif s.get("challenger") and t.get("model_layer") == "majors":
            e["display_only_reason"] = "challenger: the driver model's second estimate of the same major; weighting it would count the major twice"
            kept["challenger of the same major"] += 1
        elif "Shares a source curve" in e.get("reason", ""):
            e["display_only_reason"] = "shared source curve: both ends read the same measured curve; weighting it would count one piece of evidence twice"
            kept["shared source curve"] += 1
        else:
            raise SystemExit(f"display-only link with no decision: {key}")
    missing = set(spec) - used
    if missing:
        raise SystemExit(f"wire spec links not found as display-only: {sorted(missing)}")
    log["links_wired"] = wired
    log["links_kept_display_only"] = kept
    return wired, kept


def fmt(x):
    return ("%g" % x) if isinstance(x, (int, float)) else str(x)


def kill_all(g, log):
    nodes = {n["id"]: n for n in g["nodes"]}
    targets = [n for n in g["nodes"] if n["type"] == "END EVENT" or n.get("model_layer") in ("board", "v5.1")
               or n.get("board_reference")]
    done, fired, missing = [], [], []
    for n in targets:
        if str(n.get("status", "")).upper().startswith("FIRED") or n.get("odds_now") == 100:
            fired.append(n["id"])
            continue
        k = KILL.get(n["id"])
        if not k:
            missing.append(n["id"])
            continue
        n["kill_condition"], n["kill_check"] = k
        done.append(n["id"])
    extra = sorted(set(KILL) - set(done))
    if missing or extra:
        raise SystemExit(f"kill conditions missing for {missing}; written for non-targets {extra}")
    log["kill_conditions"] = {"written": len(done), "fired_skipped": fired}
    return done, fired


def calendar_all(g, log):
    nodes = {n["id"]: n for n in g["nodes"]}
    changed, states = [], {"LOCKED": 0, "SCHEDULED": 0, "ESTIMATED": 0}
    placeholders = 0
    for nid, fix in WINDOW_FIXES.items():
        n = nodes[nid]
        before = {k: n[k] for k in ("window_start", "window_peak", "window_end")}
        n.update(fix["set"])
        changed.append({"id": nid, "before": before, "after": {k: n[k] for k in before}, "why": fix["why"]})
    for n in g["nodes"]:
        if n["type"] == "DRIVER" or not n.get("window_peak"):
            continue
        if str(n.get("status", "")).upper().startswith("FIRED") or n.get("odds_now") == 100:
            continue  # fired rows are left alone
        c = CALENDAR.get(n["id"])
        if c:
            old = n["window_peak"]
            if c.get("peak") and c["peak"] != old:
                n["window_peak"] = c["peak"]
                changed.append({"id": n["id"], "before": {"window_peak": old}, "after": {"window_peak": c["peak"]},
                                "why": c["catalyst"]})
            n["date_state"] = c["state"]
            n["date_catalyst"] = c["catalyst"]
            n["peak_placeholder"] = bool(c.get("placeholder", False))
        else:
            n["date_state"] = "ESTIMATED"
            n["peak_placeholder"] = True
        states[n["date_state"]] += 1
        placeholders += 1 if n["peak_placeholder"] else 0
        if not (n["window_start"] <= n["window_peak"] <= n["window_end"]):
            raise SystemExit(f"calendar: {n['id']} window out of order {n['window_start']} {n['window_peak']} {n['window_end']}")
    extra = sorted(set(CALENDAR) - set(nodes))
    if extra:
        raise SystemExit(f"calendar entries for unknown nodes {extra}")
    log["calendar"] = {"date_state_counts": states, "peak_placeholder_true": placeholders, "changes": changed}
    return states, placeholders, changed


def dump_targets(g):
    for n in g["nodes"]:
        if n["type"] == "END EVENT" or n.get("model_layer") in ("board", "v5.1") or n.get("board_reference"):
            print(json.dumps({k: n.get(k) for k in ("id", "type", "model_layer", "arm", "odds_now", "odds_text", "window_start",
                  "window_end", "label", "settlement_test", "least_capability", "status", "board_reference", "next_watch", "one_number_rule")},
                  ensure_ascii=False))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("graph")
    p.add_argument("--out")
    p.add_argument("--dry-run", action="store_true")
    a = p.parse_args()
    with open(a.graph, encoding="utf-8") as f:
        g = json.load(f)
    if any(m.get("short_name") == TAG for m in g.get("merges", [])):
        raise SystemExit("Already applied (merges holds the session 1 entry).")
    odds_before = {n["id"]: n.get("odds_now") for n in g["nodes"]}
    log = {"date": TODAY, "short_name": TAG, "kind": "fold and plumbing"}
    alias = fold_all(g, log)
    wired, kept = wire_all(g, log)
    if os.environ.get("DUMP_TARGETS"):
        dump_targets(g)
        return
    done, fired = kill_all(g, log)
    states, ph, changed = calendar_all(g, log)
    # odds must be unchanged on every surviving node
    for n in g["nodes"]:
        if n.get("odds_now") != odds_before.get(n["id"]):
            raise SystemExit(f"odds changed on {n['id']}")
    g.setdefault("merges", []).append(log)
    m = g["meta"]
    m["version"] = "v5.3"
    m["title"] = "Earth2 graph v5.3"
    m.setdefault("v5_3_changes", []).extend([
        f"Session 1 plumbing Nov 25: {len(alias)} duplicate ids folded into their survivors (alias map in merges; cascade.py resolves old ids).",
        f"{len(wired)} display-only links wired with strength and delay; {sum(kept.values())} kept display-only (driver curves, challenger links, shared curves).",
        f"kill_condition and kill_check on {len(done)} main events (every END EVENT, board row and tree trigger with a board reference).",
        f"date_state on every live event node (LOCKED {states['LOCKED']}, SCHEDULED {states['SCHEDULED']}, ESTIMATED {states['ESTIMATED']}); peak_placeholder true on {ph}.",
    ])
    print(f"folds {len(alias)}; wired {len(wired)}; kept display-only {kept}; kill {len(done)} (fired skipped {fired}); "
          f"date_state {states}; placeholders {ph}; window changes {len(changed)}")
    if a.dry_run:
        return
    target = a.out or a.graph
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(os.path.abspath(target)), suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(g, f, indent=1, ensure_ascii=False)
    os.replace(tmp, target)
    print("WROTE", target)


if __name__ == "__main__":
    main()
