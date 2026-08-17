# Structural audit items: plan

Everything below is scoped to the files named. No changes to /forecasts, /trials rows, /articles, symbol_submissions rows, kits.ts prices/cart, CartDrawer, ShopSection, translation functions or cron.

## 1. /join signed-out page, and removing the blinded-study role

Files: `src/pages/Join.tsx`, `netlify/edge-functions/content-prerender.ts` (its /join block also lists the roles).

Today `/join` redirects a signed-out visitor straight to `/auth?returnTo=/join`, so the page never renders and the role list is never seen. Change: when there is no session, render the full page (Navigation is already mounted in the component, it just never gets shown because of the redirect) with a two-sentence explanation of Recorder, Translator, Analyst and Developer, then a sign-in call to action below pointing at `/auth?returnTo=/join`. Signed-in behaviour is unchanged.

"Test Subject (blinded study)" is removed from the `ROLE_OPTIONS` array in `Join.tsx` and from the mirrored list in `content-prerender.ts`. Existing `volunteers.roles` rows that contain `test_subject` are left alone; the admin volunteer view keeps rendering whatever string it finds, so no schema change and no data migration.

Schema: none. Risk: low; the only real risk is the redirect guard being removed in a way that lets a signed-out visitor reach the submit handler, so the form stays gated behind the session check.
Verify: load `/registry`-style check on `/join` in a fresh browser context with no session, confirm header nav, four role descriptions and a sign-in button render, and confirm "Test Subject" appears nowhere in the repo or in the Googlebot HTML for `/join`.

## 2. Language switch in the header

Already built and shipped. `src/components/LanguageSwitcher.tsx` is mounted in `src/components/Navigation.tsx` twice: line 161 in the desktop control cluster and line 207 at the top of the mobile hamburger panel, plus the footer instance. It preserves the current path (strips any leading `/es` or `/de` segment, re-prefixes, keeps the query string) and marks the active locale with `aria-current` and primary colour.

Proposed work is therefore cosmetic only, and optional: in the mobile panel the switch currently reads as three bare codes above the nav list; it would be given a small "Language" label so it is not mistaken for a filter. Nothing else changes.
Verify: on `/theories`, click ES in both desktop and mobile menus and confirm the URL becomes `/es/theories` and the ES item is the highlighted one.

## 3. hreflang and sitemap

Where the sitemap is generated: `netlify/edge-functions/sitemap.ts`, an edge function, not a build script. `netlify.toml` routes four paths to it: `/sitemap.xml` (en), `/sitemap-es.xml`, `/sitemap-de.xml` and `/sitemap-index.xml`. Entries come from a `STATIC` list plus rows paged out of Supabase at request time.

Current state, verified in source: the per-locale urlsets already emit `xhtml:link` alternates for en, es, de and x-default on every localized entry, and `content-prerender.ts` already emits the matching `<link rel="alternate" hreflang=...>` set in the prerendered head for localizable routes, with `/agent` deliberately excluded. So items 3's two requirements are already met for prerendered routes.

What is actually missing, and what this item would fix:
- `public/robots.txt` advertises both `/sitemap.xml` and `/sitemap-index.xml`. Only the index should be advertised, so crawlers do not treat the English urlset as the whole site. One-line edit.
- The three urlsets are separate documents, so no single file approaches the 50,000 URL or 50 MB limit. Roughly 1,400 URLs split across three locale files does **not** need further splitting; the existing index is sufficient and already correct in shape.
- Spot check that every path in `STATIC` actually returns 200 under `/es` and `/de`; the existing `route-verify` function and `scripts/route_parity.py` already do this and would be run rather than rewritten.

Files: `public/robots.txt` only, unless the parity run turns up a route whose mirror 404s, in which case that route's `localized` flag in `sitemap.ts` is set false.
Schema: none. Risk: low.
Verify: fetch `/sitemap-index.xml`, `/sitemap-es.xml` and Googlebot HTML for `/es/theories`; confirm three alternates plus x-default in each, and that robots lists only the index.

## 4. Registry 400

Diagnosed by loading `/registry` in a headless browser and capturing failed responses. It is a Supabase REST query, not storage and not an edge function:

```
400 /rest/v1/profiles?select=id,handle,avatar_seed&id=in.(...,null,...)
```

`RegistryBrowser.tsx` line 122 builds `userIds` with `[...new Set(data.map(s => s.user_id))]`. Some approved submissions have a null `user_id` (anonymous or operator-seeded rows), so the literal string `null` lands inside the `in.(...)` uuid list and Postgres rejects the cast. The contributor names for that batch then never load.

Fix, one file, `src/components/registry/RegistryBrowser.tsx`: filter to truthy string ids before the `.in()` call, and skip the query when the filtered list is empty. Rows with no `user_id` keep rendering as anonymous, which is what they already do.
Schema: none. Risk: none beyond that file. Sibling paths that do the same thing get the same guard in the same pass: `src/pages/CoWitnesses.tsx` builds `userIds` and `symIds` the same way, and any other `.in('id', ...)` over a nullable column found in a repo sweep.
Verify: reload `/registry` headless, confirm zero 4xx responses and zero console errors, and confirm handles render on cards that have a contributor.

## 5. /agent

`/agent/` is static files in `public/agent/`, listed in `sitemap.ts` `STATIC` and in the `graph-handoff` comment block of `public/robots.txt`.

Delete from public:
- `public/agent/GRAPH_REPORT.md`
- `public/agent/OTIS_PROMPT.md`
- `public/agent/graph-manifest.json`
- `public/agent/graph.html`
- the three `# https://dmtcode.com/agent/...` lines in `public/robots.txt`
- the `["/agent/", ...]` entry in `sitemap.ts` `STATIC`

Keep:
- `public/agent/index.html`, rewritten as a short machine-readable guide: what the site is, the epistemic caveats an agent must respect (publication is not approval, recognition is not replication), and links to `/llms.txt`, `/data.json` and `/sitemap-index.xml`. Nothing else.
- `docs/agent/*` stays in the repo. It is internal and is not served.

Risk: moderate but contained. Anything that fetched `/agent/GRAPH_REPORT.md` breaks, so `scripts/check-*-drift.mjs` and `.github/workflows/geo-drift.yml` are checked for references to the public copies before deleting, and repointed at `docs/agent/` if any exist. Removing the sitemap entry will drop the URL from the index on the next crawl, which is the intent.
Verify: after deploy, `/agent/GRAPH_REPORT.md` returns 404, `/agent/` returns 200 with the short guide, `sitemap.xml` contains no `/agent`, and the geo-drift workflow still passes.

## 6. Sober baseline session type

How session type is captured today: there is no session-type column. `symbol_submissions.source_method` is a nullable text column carrying the observation channel, and the live values are `other` (17), null (16), `laser_650nm` (11), `closed_eye` (6), `open_eye` (2). Null reports are recorded as ordinary submissions whose drawing step is skipped; `LayeredSubmissionForm.tsx` writes descriptive tags to `motif_tags` and treats context tags separately. Nothing distinguishes a sober baseline run.

Smallest change: add one nullable boolean column rather than overloading `source_method`, because a baseline run still has a source method.

- Migration, additive only: `alter table public.symbol_submissions add column is_sober_baseline boolean not null default false;` No policy change, existing RLS covers it, existing rows default to false.
- `src/components/registry/LayeredSubmissionForm.tsx`: one checkbox in the context step, "This was a sober baseline session (no substance taken)", with one line of helper text pointing at the Sober Baseline Protocol PDF on `/prepare`. Included in the insert payload.
- `src/components/registry/RegistryBrowser.tsx` and `src/components/registry/RegistryFilters.tsx`: one filter chip, "Sober baseline", plus a count.
- `src/pages/NullReports.tsx`: a baseline count line, since baselines are the comparison class null reports exist for.
- `netlify/edge-functions/data-json.ts`: export the field as `is_sober_baseline` (boolean) on each registry record and declare it in `field_definitions` with the sentence "True when the contributor marked the session as a sober baseline run: the full rig, no substance."

Risk: low. The one real risk is presenting the flag as verified; the copy states it is contributor-declared and unverified, in line with the epistemic contract.
Verify: submit a test record with the box ticked, confirm the chip filters it on `/registry`, the count appears on `/null-reports`, and the field is present and correctly typed in `/data.json` including its `field_definitions` entry.

## 7. Registry entries with missing images

Measured: zero approved rows have a null or empty `image_url`. Of 52 rows, 24 hold data URIs, 3 hold http URLs, and 21 hold a value under 50 characters, which cannot be a real image and is the likely source of the blank white tiles. So the fix is presentational and detection has to be at render time, not by a null check.

- `src/components/registry/SymbolCard.tsx`: render a neutral placeholder block reading "No drawing recorded" when `image_url` is missing, shorter than a plausible data URI, or fails to load (an `onError` handler flipping to the placeholder). Same treatment on the registry entry card.
- `src/components/registry/RecentContributions.tsx`: its filter at line 37 already drops empty strings; tighten it to the same predicate so short or unloadable values are excluded from the homepage strip too.

Schema: none. No data changes. Risk: low; the predicate must not hide legitimate short http URLs, so the length test applies only to `data:` values and everything else falls back to the `onError` path.
Verify: `/registry` shows placeholders instead of white tiles, and the homepage strip renders no blank cards.

## 8. /co-witnesses empty state

File: `src/pages/CoWitnesses.tsx`. The loader already returns early with an empty list when no author has `visibility='wall'`, which is the current state, so the page renders as a bare wall. Add an empty-state block with the supplied copy, linking "sign in" to `/auth?returnTo=/co-witnesses` and "Volunteer page" to `/join`. Shown only when not loading and the filtered list is empty.
Schema: none. Risk: none.
Verify: `/co-witnesses` renders the block and both links resolve to 200 pages.

## 9. Two more /people entries: effort

Small, roughly the same size as item 8 plus two new routes. Per person: one route in `src/AppRoutes.tsx`, one page component modelled on `src/pages/PersonDannyGoler.tsx`, one list item and one `ItemList` position in `src/pages/People.tsx`, one `STATIC` entry in `sitemap.ts`, and a prerender case in `content-prerender.ts` so crawlers see the body. Copy is lifted verbatim from `/theories/laser-speckle-and-amplified-pattern-recognition`, `/critiques` and the matching `/bibliography` rows, so nothing new is claimed and every sentence carries an existing source link. Andrew Gallimore is labelled a critic, Chase Hughes a popularizer whose validation claim is unverified, using the words already on those pages.

Risk: the only real one is Person JSON-LD implying endorsement or affiliation; the markup would carry name, description and `sameAs` to the source URLs and nothing else. No `worksFor`, no credentials.
Verify: both pages render, appear on `/people` and in the sitemap, and every claim on them matches a string already published elsewhere on the site.

## Deploy note

Items 1, 3, 5, 6 and 9 touch `content-prerender.ts`, `sitemap.ts`, `data-json.ts`, `robots.txt` or `public/agent/`. None of those go live from the Lovable preview. They ship on a Netlify deploy from `main`. Item 6 also needs its migration applied on the backend before the form change is deployed.
