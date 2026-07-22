ALTER TABLE public.bibliography
  ADD COLUMN IF NOT EXISTS full_text text,
  ADD COLUMN IF NOT EXISTS transcript text;