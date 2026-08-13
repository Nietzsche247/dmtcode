ALTER TABLE public.article_leads
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ai_key_points text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ai_enriched_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_model text;