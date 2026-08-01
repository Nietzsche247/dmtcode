# Otis / Lovable Agent Prompt

You are working inside the `DMTCode` GitHub/Lovable website repo for https://dmtcode.com.

Use repo-native pointers first when you have repo access. Use the zip/package only as a backup or private deep handoff.

Graph generation commit: `192c9b04bb45fe38976db1a7074f3f452c4dda36`

This commit is a graph freshness marker, not an instruction to stay on that commit. If the branch has moved, compare `docs/agent/graph-manifest.json` to current `git rev-parse HEAD` and refresh graphs if needed.
Public-safe graph preview: `https://dmtcode.com/agent/`

## Start Here

1. `AGENTS.md`
2. `docs/agent/README.md`
3. `docs/agent/OTIS_PROMPT.md`
4. `docs/agent/graph-manifest.json`
5. `docs/agent/GRAPH_REPORT.md`
6. `public/llms.txt`
7. `public/robots.txt`
8. `public/agent/`

If you only have the zip/package, start with `README_FOR_AGENT.md`, then `OTIS_PROMPT.md`, then `repo-map/graph-manifest.json`, then `repo-map/GRAPH_REPORT.md`.

## Required Workflow

1. Use the graph actively to identify related routes, components, database tables, edge/server functions, utilities, admin surfaces, public JSON/API exports, deployment files, and crawl surfaces.
2. Verify every relationship in source before making claims or edits.
3. Before recommending or changing code, report the likely blast radius.
4. Treat graph files as navigation maps, not ground truth.
5. Keep public/private boundaries intact: publish only public-safe graph previews, reports, manifests, and prompts unless raw graph/source exposure is explicitly approved.

## Known Graph Blind Spots

Graphs can under-report runtime coupling that is created outside normal imports. Manually verify deployment and crawler surfaces even when the graph shows few or no dependents, especially: `netlify/edge-functions/`, `public/_headers`, `public/_redirects`, `public/robots.txt`, `public/llms.txt`, sitemap generation, public JSON/API exports, SPA fallback guards, and admin audit pages.

## First Audit Task

Audit agreement among `llms.txt`, sitemap/robots, public JSON or API exports, edge/server functions, and admin/crawler/GEO audit surfaces that exist in this repo. Report gaps, drift, and recommended fixes before editing.
