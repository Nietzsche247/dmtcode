# Earth2 graph

Live page: https://dmtcode.com/future/earth2 (static, not indexed).

Files
- `public/future/earth2/index.html` . the page (2D, 3D, timeline lanes, heat view, collisions queue, live cascade). It reads `graph.json` beside it.
- `public/future/earth2/graph.json` . the graph data. This is the only file a daily update changes.
- `public/future/earth2/vendor/` . force-graph 1.47.4 and 3d-force-graph 1.76.0, vendored so the page needs no CDN.
- `earth2/cascade.py` . the cascade engine (Python 3.8+, standard library only).
- `earth2/readme_v5.1.txt`, `earth2/verification_v5.1.json`, `earth2/sample_runs_v5.1.txt` . schema, checks and the first two runs.
- `earth2/validate_graph.py` . structural checks and counts. Run it before every commit: `python3 earth2/validate_graph.py public/future/earth2/graph.json` (add `--against OLD.json` to prove no odds moved).
- `earth2/plumbing_2026-11-25.py` and `earth2/plumbing_2026_11_25_data.py` . the session 1 plumbing (folds, link strengths, kill conditions, calendar). Already applied; it refuses to run twice. What it did: `earth2/plumbing_2026-11-25.md`.

Daily update (odds move on real, dated events only)
1. `python3 earth2/cascade.py public/future/earth2/graph.json --updates updates.json`
   updates.json: `[{"id": "O1", "new_odds": 100, "date": "2026-12-01", "reason": "Brent settled $101.20", "source": "ICE"}]`
2. Commit `public/future/earth2/graph.json` and push to main. Netlify builds main, so the page shows the new odds after the deploy.

Old ids still work. When two ids were the same real event, the copy was folded into the survivor and the pair is kept in `graph["merges"]` as an `alias_map` (old id to survivor, with the reason and date). The engine applies an update that names an old id to its survivor and prints a one-line NOTICE, for example `E16` goes to `D4` and `GB7.spark.01` goes to `sealed-spark:GB7:01`. The page does the same in Find and when a link or log row names an old id. Never reuse an old id for a new node.

Standing collisions: `python3 earth2/cascade.py public/future/earth2/graph.json --collisions` lists every live node pushed by two or more arms whose windows sit within 120 days, with a count for every arm in the data (no arm list is written into the code). Add `--collisions` to a normal run to print the same list after the run.

Fields added Nov 25 (session 1)
- `kill_condition` (every live END EVENT, board row and tree trigger with a board reference): one observable, dated fact that would rule the event out or send it near zero inside its window. It is a test, not a claim.
- `kill_check`: where to look for that fact (a named data series, filing or official source).
- `date_state` (every live node with a window): `LOCKED` (fixed by law, contract or exchange calendar), `SCHEDULED` (a known dated release or meeting) or `ESTIMATED` (best guess).
- `date_catalyst`: the dated catalyst behind a LOCKED or SCHEDULED peak, or behind an ESTIMATED peak whose catalyst date is itself an estimate.
- `peak_placeholder`: true when the window peak is a filler date with no catalyst behind it. Anything that turns the graph into tickets must not lean on such a peak.
- `folded_from` (on a survivor): the full record of each copy folded into it, including its own odds and window, so the second estimate is not lost.
- `display_only_reason` (on links that stay display only): driver curve, challenger of the same major, or shared source curve.

The page also accepts `?data=<url>` to load another graph file, and Save data downloads the current state.
Not financial advice.
