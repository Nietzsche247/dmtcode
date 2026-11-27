# Earth2 graph

Live page: https://dmtcode.com/future/earth2 (static, not indexed).

## Rules for every session (people and AIs)

1. Before any Earth2 work run `python3 earth2/scorecard.py due` and settle everything it lists.
2. Questions live in `earth2/scorecard/questions.json` and are changed only through the CLI (`earth2/scorecard.py`). Never edit that file by hand.
3. Odds move only through `earth2/cascade.py`, on dated, sourced events. Never edit `odds_now` by hand.
4. One writer at a time. Pull first. Run `python3 earth2/validate_graph.py public/future/earth2/graph.json` before every push.
5. New main events enter only through `earth2/deepdives/merge_nodes.py`, starting from `earth2/templates/arm_template.json`.
6. Log any big real event the graph had no node for: `python3 earth2/scorecard.py miss add --date ... --what ... --source ... --area ... --why ...`

These rules are enforced by code, not by memory. The sections below say how.

## Files

- `public/future/earth2/index.html` . the page (scorecard panel, 2D, 3D, timeline lanes, heat view, collisions queue, live cascade). It reads `graph.json` and `scorecard.json` beside it.
- `public/future/earth2/graph.json` . the graph data.
- `public/future/earth2/scorecard.json` . what the page's scorecard panel reads. Written by `scorecard.py score`. Never edit it.
- `public/future/earth2/vendor/` . force-graph 1.47.4 and 3d-force-graph 1.76.0, vendored so the page needs no CDN.
- `earth2/scorecard.py` . the scorecard CLI and the rules (questions, lock, odds stamp, gate, score). Python 3.8+, standard library only.
- `earth2/scorecard/questions.json` . the one canonical questions file.
- `earth2/scorecard/misses.json` . big real events the graph had no node for.
- `earth2/scorecard/corrections.json` . written by `score`: how far off each judgment tag and arm has been.
- `earth2/scorecard/legacy_main_events.json` . the 130 main events from before the gate, with the gaps each may keep.
- `earth2/scorecard/test_scorecard.py` . the tests. `python3 earth2/scorecard/test_scorecard.py` (works on temp copies; the page test needs node and Chrome).
- `earth2/cascade.py` . the cascade engine (Python 3.8+, standard library only).
- `earth2/validate_graph.py` . structural checks, scorecard checks and counts. Run it before every commit (add `--against OLD.json` to prove no odds moved).
- `earth2/deepdives/merge_nodes.py` . the only way new nodes enter the graph.
- `earth2/templates/arm_template.json` and `earth2/templates/README.md` . a blank arm with every required field, and one line of guidance per field.
- `earth2/readme_v5.1.txt`, `earth2/verification_v5.1.json`, `earth2/sample_runs_v5.1.txt` . schema, checks and the first two runs.
- `earth2/plumbing_2026-11-25.py` and `earth2/plumbing_2026_11_25_data.py` . the session 1 plumbing (folds, link strengths, kill conditions, calendar). Already applied; it refuses to run twice. What it did: `earth2/plumbing_2026-11-25.md`.

## Daily update (odds move on real, dated events only)

1. `python3 earth2/scorecard.py due` and settle what is overdue.
2. `python3 earth2/cascade.py public/future/earth2/graph.json --updates updates.json`
   updates.json: `[{"id": "O1", "new_odds": 100, "date": "2026-12-01", "reason": "Brent settled $101.20", "source": "ICE"}]`
3. `python3 earth2/validate_graph.py public/future/earth2/graph.json`
4. Commit and push to main. Netlify builds main, so the page shows the new odds after the deploy.

## The scorecard

Why: the graph makes hundreds of calls and none had ever been scored. The scorecard turns the main events into dated yes or no questions, locks Earth2's odds on the day each question is written, and grades the answers.

A main event is a node of type END EVENT, or a board row (`model_layer` "board"). That is 130 nodes today: 49 end events and 82 board rows, with one that is both. A tree trigger that carries a `board_reference` is not a main event; it points at a board row and is named as `path_node`. The rule lives in one function, `is_main_event` in `earth2/scorecard.py`; the page keeps one copy and a test checks the two give the same count.

### A question

Each question in `questions.json` has: `id` (Q-0001 and up), `event_id` (a main event), `path_node` (a step on the path, or null), `arm` (copied from the event), `text` (a yes or no question), `test` (the exact pass or fail rule), `source` (the named primary source to settle against), `tags` (1 or 2), `script_side` (YES or NO: the answer that moves toward the main event, that is, follows the Earth2 script), `written`, `due` (never changes), `odds_locked` (Earth2's odds of YES, whole percent 1 to 99), `odds_basis`, `market` (`{odds, source, as_of}` or null), `consensus` (`{value, source, as_of}` or null), `kind` (live or backfilled), `lock`, `status` (OPEN, SETTLED, VOID), `due_current`, `deferrals`, `outcome`, `settled_as_of`, `answered_on`, `late`, `evidence`, `evidence_source`, `void_reason`.

The tags say which kind of judgment a question tests:

- `timing` . did a dated step arrive when the graph said.
- `brakes` . did someone step in to stop or soften it (rescue, extension, waiver, backstop).
- `actor` . did a government or company do the dramatic thing or the routine thing.
- `market` . Earth2's odds differ from a recorded market number; who was right. Needs `market`.
- `pace` . did it arrive sooner or larger than the recorded consensus (analyst estimates, an agency forecast, a market-implied date). Needs `consensus`. Write it so the script side (`script_side`) is the answer that means sooner or larger than the consensus.

`lock` is a sha256 over id, event_id, text, test, source, tags, script_side, written, due, odds_locked, market.odds and consensus.value. Change any of them by hand and the validator and the engine refuse to run.

Old folded ids resolve through the alias map, so `E16` is read as `D4` and accepted, because D4 is a board row. An `event_id` must end up on a main event; a tree trigger or a deep-dive node goes in `path_node`, with the main event it pushes as `event_id`.

### Commands

```
python3 earth2/scorecard.py due
python3 earth2/scorecard.py add --event 27-5 --path-node D4 --text "..." --test "..." --source "..." --tags timing --script-side YES --due 2027-01-29 --odds 37 --odds-basis "..."
python3 earth2/scorecard.py import-seed FILE.json [--dry-run]
python3 earth2/scorecard.py settle Q-0001 --outcome YES --as-of 2026-12-09 --source "..." --evidence "..."
python3 earth2/scorecard.py defer Q-0001 --to 2026-12-20 --reason "..."
python3 earth2/scorecard.py void Q-0001 --reason "..."
python3 earth2/scorecard.py miss add --date 2026-12-02 --what "..." --source "..." --area "CYBER" --why "..."
python3 earth2/scorecard.py miss list
python3 earth2/scorecard.py score
python3 earth2/scorecard.py legacy-refresh
python3 earth2/scorecard.py list | show Q-0001 | check
```

Every command that changes something runs `score` itself.

A seed file for `import-seed` is `{"questions": [...], "backfilled": [...], "event_tags": {"<main event id>": ["tag"]}, "legacy_base_rates": {"<id>": {"value": 12, "reference_class": "...", "source": "..."}}}`. Question rows carry the fields from `event_id` through `kind`; the CLI gives the id, the lock and the status. Backfilled rows add `outcome`, `settled_as_of`, `evidence`, `evidence_source` and `odds_date`; they are stored SETTLED with kind backfilled, count in the score, and are flagged everywhere. `event_tags` and `legacy_base_rates` write `judgment_tags` and `base_rate` onto graph nodes: structure only, never odds. Anything that fails a rule stops the whole import with the list.

### Settling

`settle` records `settled_as_of` (the day the answer became true in the world), `answered_on` (today) and `late` (answered after `due_current`). A late answer is allowed and expected: settle it as of its due date, from the named source. What happened after the due date does not count, so `--as-of` cannot be later than the due date. An answer is recorded once.

"Today" is the date in America/Phoenix (UTC minus 7, no daylight time).

### Defer and void

- `defer` moves `due_current`. At most 2 per question, each at most 21 days. The original `due` never changes. A deferral must land on today or later, so a question that is long overdue cannot be deferred out of the lock. Every deferral is logged in the question and shown on the page.
- `void` is for a test that became impossible to check. It needs a reason, applies only to an open question, is shown on the page, and is left out of the score.

### Scoring

- p = odds_locked / 100, o = 1 for YES. Brier = mean((p - o)^2). It is shown beside the coin flip, 0.25, and, on the questions that carry market odds, beside the market's Brier. Lower is better.
- Script side: p_s = p when `script_side` is YES, else 1 - p; o_s the same way.
- Per tag and per arm: n, mean signed error in points = mean(p_s - o_s) x 100, Brier, and active = n >= 10. A plus error means Earth2 rates its own script too high.
- For `pace`: the share that arrived sooner or larger than consensus, overall and per arm. A pace answer counts as sooner when the outcome equals the question's `script_side`, so a NO-side question that comes in NO counts and one that comes in YES does not.
- Corrected odds for a main event = raw `odds_now` minus the mean signed error of its active `judgment_tags`, held between 1 and 99. The page and the `cascade.py` output work it out on the fly. `odds_now` is never overwritten with a corrected number; the raw number is what keeps getting scored.

## The lock

A question is OVERDUE when its status is OPEN and `due_current` is before today. While any question is overdue, `cascade.py` (every mode), `validate_graph.py` and `merge_nodes.py` stop with exit code 3 and print which questions, with the exact commands to settle them. They also stop when `questions.json` is missing or fails its checks. `scorecard.py` itself is never blocked. No flag and no environment variable skips the lock. The only ways out are settle, defer and void, and each one is written into the file.

## The odds stamp

`meta.odds_stamp` is a short hash of every node's odds: FNV-1a 32-bit hex over the text built from the nodes sorted by id as `id:T;`, where T = floor(odds_now x 10 + 0.5) as an integer and null odds give `x`. Python and the page use the same integer rule.

- `cascade.py` sets the stamp after every real run, and `merge_nodes.py` after a merge.
- `validate_graph.py` fails when the stamp does not match, and says how to fix it. `cascade.py` and `merge_nodes.py` refuse to run on a graph whose stamp does not match.
- The page shows a red banner: "Odds were edited outside the engine".
- After a real repair: `python3 earth2/cascade.py public/future/earth2/graph.json --restamp --reason "..."`. The lock must pass first, and the reason is written to `cascade_log`.

A graph saved from the page after a live run carries the old stamp, so it shows as edited. Run the same move through `cascade.py` to make it real.

## The gate on new main events

`earth2/scorecard/legacy_main_events.json` lists the main events from before the gate with the gaps each may keep (no `settlement_test`, no `base_rate`, no `judgment_tags`). Any main event that is not on that list (any new node of type END EVENT or with `model_layer` "board") must have:

- `settlement_test`
- `judgment_tags`
- `base_rate` with `value`, `reference_class` and `source`
- `kill_condition` and `kill_check`
- at least one question in `questions.json`

`merge_nodes.py` checks this before it merges and prints exactly what is missing for each node. An incoming file may carry a `questions` list; those questions are added through the same code as `scorecard.py add`. `validate_graph.py` applies the same gate to the graph, prints the legacy gap totals as a NOTE, and fails if an older main event loses a field it had. `scorecard.py legacy-refresh` records gaps that have been closed; it can only shrink gaps and never adds an event. `import-seed` runs it.

Start a new arm or a new main event from `earth2/templates/arm_template.json`. The blank template is refused on purpose, with the list of what to fill in.

## Old ids

Old ids still work. When two ids were the same real event, the copy was folded into the survivor and the pair is kept in `graph["merges"]` as an `alias_map` (old id to survivor, with the reason and date). The engine applies an update that names an old id to its survivor and prints a one-line NOTICE, for example `E16` goes to `D4` and `GB7.spark.01` goes to `sealed-spark:GB7:01`. The scorecard does the same in `add` and `import-seed`. The page does the same in Find and when a link or log row names an old id. Never reuse an old id for a new node.

## Standing collisions

`python3 earth2/cascade.py public/future/earth2/graph.json --collisions` lists every live node pushed by two or more arms whose windows sit within 120 days, with a count for every arm in the data (no arm list is written into the code). Add `--collisions` to a normal run to print the same list after the run.

## Node fields

Added Nov 26 (scorecard)
- `judgment_tags` (main events): which kinds of judgment the odds lean on, from timing, brakes, actor, market, pace. They pick which corrections apply to the event.
- `base_rate` (main events): `{value, reference_class, source}`. How often events of this kind have happened, in percent.
- `meta.odds_stamp`: see the odds stamp above.

Added Nov 25 (session 1)
- `kill_condition` (every live END EVENT, board row and tree trigger with a board reference): one observable, dated fact that would rule the event out or send it near zero inside its window. It is a test, not a claim.
- `kill_check`: where to look for that fact (a named data series, filing or official source).
- `date_state` (every live node with a window): `LOCKED` (fixed by law, contract or exchange calendar), `SCHEDULED` (a known dated release or meeting) or `ESTIMATED` (best guess).
- `date_catalyst`: the dated catalyst behind a LOCKED or SCHEDULED peak, or behind an ESTIMATED peak whose catalyst date is itself an estimate.
- `peak_placeholder`: true when the window peak is a filler date with no catalyst behind it. Anything that turns the graph into tickets must not lean on such a peak.
- `folded_from` (on a survivor): the full record of each copy folded into it, including its own odds and window, so the second estimate is not lost.
- `display_only_reason` (on links that stay display only): driver curve, challenger of the same major, or shared source curve.

The page also accepts `?data=<url>` to load another graph file and `?scorecard=<url>` to load another scorecard file. Save data downloads the current state.
Not financial advice.
