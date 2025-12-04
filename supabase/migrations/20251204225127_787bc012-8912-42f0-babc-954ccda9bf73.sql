-- Add ORCID column to registry_glyphs for contributor identification
ALTER TABLE public.registry_glyphs 
ADD COLUMN IF NOT EXISTS orcid text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.registry_glyphs.orcid IS 'Optional ORCID identifier (e.g., 0000-0002-1825-0097) for academic attribution';