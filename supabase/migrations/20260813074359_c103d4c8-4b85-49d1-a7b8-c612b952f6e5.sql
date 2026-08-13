ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_outlet text,
  ADD COLUMN IF NOT EXISTS source_published_at timestamptz;

UPDATE public.articles a
SET source_url = l.url,
    source_outlet = COALESCE(l.outlet, split_part(regexp_replace(l.url, '^https?://(www\.)?', ''), '/', 1)),
    source_published_at = l.published_at
FROM public.article_leads l
WHERE a.source_url IS NULL
  AND a.target_query IS NOT NULL
  AND a.target_query = l.url;