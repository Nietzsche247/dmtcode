
## Guardrails confirmed

I will not touch: `clinical_trials`, trial scrapers, `src/pages/Trials.tsx`, `src/pages/TrialDetail.tsx`, any `src/components/events/*Trial*`, `symbol_submissions`, `registry_glyphs`, `glyphs`, `symbol_votes`, or the Registry pages/components. All 96 existing bibliography rows stay. Additive migration only. Copy will use plain sentences with no em dashes.

## Approach

The `bibliography` table already exists with 96 PubMed rows. Rather than build a second surface, extend that table with a few nullable columns, backfill the 96 rows as academic papers, seed 14 curated Code of Reality sources on top, and rewrite `/bibliography` to render from the table with filters. The hardcoded citations (including the factual errors listed) are dropped in the rewrite.

## Migration (single additive migration)

```sql
ALTER TABLE public.bibliography
  ADD COLUMN IF NOT EXISTS content_type text,
  ADD COLUMN IF NOT EXISTS authority_type text,
  ADD COLUMN IF NOT EXISTS stance_score int,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS source_date text,
  ADD COLUMN IF NOT EXISTS stance_unverified boolean NOT NULL DEFAULT false;

UPDATE public.bibliography
SET content_type = 'Paper',
    authority_type = 'Academic'
WHERE source = 'pubmed'
  AND content_type IS NULL;

CREATE INDEX IF NOT EXISTS bibliography_featured_idx ON public.bibliography (featured);
CREATE INDEX IF NOT EXISTS bibliography_content_type_idx ON public.bibliography (content_type);
CREATE INDEX IF NOT EXISTS bibliography_authority_type_idx ON public.bibliography (authority_type);
```

No RLS or GRANT changes required (table already exposed and policied). No destructive statements. No CHECK constraints on stance/content so future values are safe.

Seed inserts for the 14 curated sources happen in a second step via the insert tool after you provide the final summaries. Each seed sets `featured=true`, `source='curated'`, `is_approved=true`, plus the title, authors, url/doi, content_type, authority_type, stance_score (null + `stance_unverified=true` for Chase Hughes), and source_date. The three factual corrections you flagged are simply not seeded, so they disappear from the page.

## Files edited

- `src/pages/Bibliography.tsx` (rewrite body only, keep route and Helmet shell). Fetches from `bibliography` via the supabase client, splits into Featured Timeline (featured=true, newest first by `source_date` then `publication_date`) and Full Library (everything else, filterable). Removes all hardcoded citations, including the three incorrect entries.
- `src/components/bibliography/BibliographyFilters.tsx` (new). Content type, authority type, stance bucket (Supportive +4 and up, Balanced -3 to +3, Skeptical -4 and lower, Unverified), tag chips, year range, text search. Controlled state lifted to page.
- `src/components/bibliography/BibliographyCard.tsx` (new). One card component used in both Timeline and Library. Shows title, authors, source_date, authority badge, stance chip (or "Unverified"), summary, tag chips, external link.
- `src/components/bibliography/FilterGuide.tsx` (new). Short intro block above the timeline plus an expandable methodology accordion. Copy placeholder until you send final text; no em dashes.

No other files touched. Navigation entry for `/bibliography` already exists and stays.

## Page structure

```text
/bibliography
  Hero + intro
  FilterGuide (with expandable methodology)
  Research Timeline   (featured=true, newest first)
  Filters bar
  Full Library grid   (all rows, filtered, default newest first)
```

## Stance bucket mapping

- Supportive: stance_score >= 4
- Balanced: -3 <= stance_score <= 3
- Skeptical: stance_score <= -4
- Unverified: stance_unverified = true (Chase Hughes row)

## What I will NOT do

- No changes to `clinical_trials`, trial edge functions, `Trials.tsx`, `TrialDetail.tsx`, or any `events/*Trial*` component.
- No changes to `symbol_submissions`, `registry_glyphs`, `glyphs`, `symbol_votes`, Registry pages, or symbol components.
- No deletes on existing 96 bibliography rows.
- No new tables, no RLS rewrites, no scraper edits.

## Open items before execute

1. Final exact summary text for each of the 14 curated sources.
2. Final copy for the FilterGuide intro and methodology accordion.
3. Confirm the Chase Hughes row should render with an "Unverified" badge and no stance chip.
