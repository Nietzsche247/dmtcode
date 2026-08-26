ALTER TABLE public.symbol_submissions
  ADD COLUMN prior_exposure text;

ALTER TABLE public.symbol_submissions
  ADD CONSTRAINT symbol_submissions_prior_exposure_check
  CHECK (prior_exposure IS NULL OR prior_exposure IN ('naive', 'exposed'));

COMMENT ON COLUMN public.symbol_submissions.prior_exposure IS 'Whether the contributor had already viewed registry symbols before this observation: naive, exposed, or null when the record predates the field.';