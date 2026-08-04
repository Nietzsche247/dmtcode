ALTER TABLE public.scraper_runs
  ADD COLUMN IF NOT EXISTS query_used text;