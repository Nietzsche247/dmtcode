<!-- graph-handoff:start -->
## Graph Handoff

Read `docs/agent/README.md`, `docs/agent/OTIS_PROMPT.md`, and `docs/agent/GRAPH_REPORT.md` before architecture recommendations or code edits. Use graph files as a navigation map, then verify source.
<!-- graph-handoff:end -->

## Essence & Experience Audit

For product-level audits (content gaps, connectivity, tool QA, member experience), read `docs/agent/ESSENCE_AUDIT.md`. It is seeded with measured findings and must be re-measured, not trusted blindly, on resume.

## Observation resource architecture

- Keep optional digital resource data separate from KITS and gate React and edge output on both publication values, so placeholders never appear publicly.
- Mount signup chrome once inside the router with route-derived locale context, so all locale mirrors share dismissal and submit behavior.
- Save observations through the shared glyph-only client function; the existing glyph mirror trigger creates the sole atomic linked submission, so form and offline saves cannot create duplicate pairing paths.

## Commerce data boundary

Keep supplier part numbers and self-assembly costs in internal kit data and supplier tooling only; never expose them on customer-facing pages or machine surfaces.

## Static translation and symbol surfaces

- Static translated bodies must match the English source hash and retain its href identifiers, so stale or truncated translations cannot replace complete pages.
- Pages that inspect translation availability must pass it into LocalizedBody and use English canonicals on fallback, so hydration agrees with crawler output.
- Keep the Symbols editorial body, record labels and CollectionPage metadata mirrored with the Deno prerender, because edge functions cannot import React source.
- Keep shared Field Guide presentation in FieldGuideCard, while publication data stays separate from KITS, so optional resources do not alter commerce identifiers.
- Store historical symbol plates under symbol-plates, not symbols, so the Symbols landing route does not collide with a static directory.


