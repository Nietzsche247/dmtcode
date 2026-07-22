
ALTER TABLE public.clinical_trials
  ADD COLUMN IF NOT EXISTS organizer_lead TEXT,
  ADD COLUMN IF NOT EXISTS trial_type TEXT NOT NULL DEFAULT 'Formal Clinical Trial',
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS eligibility TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_status TEXT NOT NULL DEFAULT 'Confirmed',
  ADD COLUMN IF NOT EXISTS application_url TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Backfill for the 269 existing scraped clinical trials
UPDATE public.clinical_trials
  SET trial_type = 'Formal Clinical Trial'
  WHERE trial_type IS NULL OR trial_type = '';

UPDATE public.clinical_trials
  SET location = institution
  WHERE location IS NULL AND institution IS NOT NULL;

UPDATE public.clinical_trials
  SET source = COALESCE(source, CASE WHEN trial_registry_id IS NOT NULL THEN 'ClinicalTrials.gov' ELSE 'Manual submission' END);
