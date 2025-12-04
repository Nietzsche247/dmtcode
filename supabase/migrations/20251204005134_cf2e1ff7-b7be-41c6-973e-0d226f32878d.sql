-- Create bibliography table for research papers from PubMed
CREATE TABLE public.bibliography (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT,
  journal TEXT,
  publication_date DATE,
  doi TEXT UNIQUE,
  pmid TEXT UNIQUE,
  abstract TEXT,
  url TEXT,
  compounds TEXT[],
  source TEXT NOT NULL DEFAULT 'pubmed',
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bibliography ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Bibliography viewable by everyone" 
ON public.bibliography 
FOR SELECT 
USING (is_approved = true);

-- Admin management
CREATE POLICY "Admins can manage bibliography" 
ON public.bibliography 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add source column to scraper_runs for multi-source tracking
ALTER TABLE public.scraper_runs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'clinicaltrials_gov';

-- Add erowid_flag to events for laser/glyph mentions
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS erowid_flag BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bibliography_pmid ON public.bibliography(pmid);
CREATE INDEX IF NOT EXISTS idx_bibliography_doi ON public.bibliography(doi);
CREATE INDEX IF NOT EXISTS idx_clinical_trials_registry_id ON public.clinical_trials(trial_registry_id);