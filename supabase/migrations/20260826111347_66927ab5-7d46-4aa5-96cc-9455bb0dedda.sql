ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL;

UPDATE public.articles
SET archived_at = updated_at
WHERE is_published = false AND published_at IS NOT NULL;