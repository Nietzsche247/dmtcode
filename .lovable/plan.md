# 650 nm laser protocol page (honest negative)

## Understanding

The point of this feature is the negative result, not the retreat list. The database
must make a false "Yes" structurally impossible, and the page must state the dated
answer in its first sentence.

Current state confirmed:
- `retreats` has 14 rows, 13 approved. Adding the 9 named centers gives 23 rows, which
  matches the expected verification count.
- `spa-guard.ts` already lets `/retreats/<slug>` through, so the new path passes the
  guard; the prerender side currently only handles `/retreats/<uuid>`, so it needs a
  new branch placed before the UUID branch.
- Locale mirrors are handled generically: the prerender strips a leading `/es` or `/de`
  segment, so both mirrors work once the handler exists.

## 1. Migration (additive only)

On `public.retreats`:
- `laser_protocol text not null default 'No'`, CHECK in ('Yes','No','Unverified')
- `laser_protocol_source text null`
- `laser_protocol_last_verified date null`
- CHECK `laser_protocol <> 'Yes' OR laser_protocol_source IS NOT NULL` — the core of
  the feature; a Yes cannot exist without a source URL.
- Backfill all existing rows: `laser_protocol = 'No'`,
  `laser_protocol_last_verified = '2026-09-21'`.

Then a separate data step inserts the nine centers (Arkana, Avalon, Hummingbird,
Inner Mastery, Nihue Rao, Om Jungle, Spinoza, SpiritQuest, Takiwasi) with
`is_approved = true`, `laser_protocol = 'No'`, verified date 2026-09-21, and their
official URLs. Names already present are skipped rather than duplicated.

## 2. Page `/retreats/laser-protocol`

New `src/pages/RetreatLaserProtocol.tsx`, routed in `AppRoutes.tsx` before the
existing `/retreats/:id` route so the slug is not read as a record id.

Content, in order:
- H1 and document title: "Which retreats use a 650 nm laser protocol? (2026)"
- Verbatim opening sentence with the date, then the "checklist, not a ranking"
  sentence.
- Count line "N centers listed. 0 verified Yes." read live; omitted entirely if the
  fetch fails, never rendered as a zero.
- Table sorted by country then name: Center | Country | Laser protocol | Last verified
  | Official source, links `rel="nofollow noopener"`, `target="_blank"`. On small
  screens the table scrolls horizontally inside a bounded container; no layout change
  to the rest of the site.
- Sections "How a row becomes Yes" and "What this page is not", with the specified copy.
- FAQ block with the three question/answer pairs, plus FAQPage JSON-LD and a
  BreadcrumbList, via the existing `Helmet` pattern used on `/retreats`.
- Canonical is locale-aware through the existing `SEO` component pattern.
- No booking or affiliate links anywhere; official sites only.

## 3. Edge functions

- `content-prerender.ts`: add one new handler `renderRetreatLaserProtocol`, matched at
  `kind === "retreats" && seg[1] === "laser-protocol"`, before the UUID detail branch.
  It renders the same heading, opening sentence, count line, table, two sections and
  FAQ JSON-LD server side so crawlers and AI readers see the answer without JS.
  No existing handler is modified, and the trials/bibliography counts sections are
  left byte-identical.
- `spa-guard.ts`: no rule change needed for the slug itself; add `laser-protocol` as an
  explicitly allowed `/retreats/` slug so it cannot be broken by a future tightening of
  the slug matcher.
- `sitemap.ts`: add `["/retreats/laser-protocol", "0.8", "monthly"]` to the static
  route list, which also emits the `/es/` and `/de/` mirrors through the existing
  locale loop.

Untouched: events, articles, bibliography, clinical_trials, symbol_submissions,
bundles tables; /prepare, /tools, /events, /articles, /trials, /bibliography,
/registry; data-json, articles-json, articles-feed, shop-json, bot-logger; the three
named scripts.

## 4. Verification I will run

- `select laser_protocol, count(*) from retreats group by 1` → only 'No', 23 rows.
- Attempt an insert with `laser_protocol='Yes'` and null source inside a rolled-back
  transaction; expect the CHECK to reject it.
- Local preview checks of `/retreats/laser-protocol`, `/es/...`, `/de/...`, plus
  `/events`, `/retreats`, `/trials`, `/bibliography`, `/articles`, `/`.
- The production `curl` and sitemap checks can only pass after a Netlify deploy from
  `main`; that deploy is a human step and I will say so explicitly at the end.
