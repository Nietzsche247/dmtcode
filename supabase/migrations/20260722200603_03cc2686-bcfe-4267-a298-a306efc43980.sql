ALTER TABLE public.clinical_trials ADD COLUMN IF NOT EXISTS record_type TEXT NOT NULL DEFAULT 'internal_session';
UPDATE public.clinical_trials SET record_type = 'registered_trial' WHERE trial_registry_id ~ '^NCT';
UPDATE public.clinical_trials SET record_type = 'internal_session' WHERE trial_registry_id IS NULL OR trial_registry_id !~ '^NCT';
CREATE INDEX IF NOT EXISTS clinical_trials_record_type_idx ON public.clinical_trials(record_type);