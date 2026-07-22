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