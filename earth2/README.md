# Earth2 graph

Live page: https://dmtcode.com/future/earth2 (static, not indexed).

Files
- `public/future/earth2/index.html` . the page (2D, 3D, timeline lanes, heat view, collisions queue, live cascade). It reads `graph.json` beside it.
- `public/future/earth2/graph.json` . the graph data. This is the only file a daily update changes.
- `public/future/earth2/vendor/` . force-graph 1.47.4 and 3d-force-graph 1.76.0, vendored so the page needs no CDN.
- `earth2/cascade.py` . the cascade engine (Python 3.8+, standard library only).
- `earth2/readme_v5.1.txt`, `earth2/verification_v5.1.json`, `earth2/sample_runs_v5.1.txt` . schema, checks and the first two runs.

Daily update (odds move on real, dated events only)
1. `python3 earth2/cascade.py public/future/earth2/graph.json --updates updates.json`
   updates.json: `[{"id": "O1", "new_odds": 100, "date": "2026-12-01", "reason": "Brent settled $101.20", "source": "ICE"}]`
2. Commit `public/future/earth2/graph.json` and push to main. Netlify builds main, so the page shows the new odds after the deploy.

The page also accepts `?data=<url>` to load another graph file, and Save data downloads the current state.
Not financial advice.
