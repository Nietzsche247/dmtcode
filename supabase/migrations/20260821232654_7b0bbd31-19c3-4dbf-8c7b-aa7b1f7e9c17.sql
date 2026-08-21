ALTER TABLE public.bibliography
  ADD COLUMN IF NOT EXISTS full_text_source text,
  ADD COLUMN IF NOT EXISTS full_text_license text,
  ADD COLUMN IF NOT EXISTS full_text_retrieved_at timestamptz;