ALTER TABLE public.bibliography
  ADD COLUMN IF NOT EXISTS triage_status text,
  ADD COLUMN IF NOT EXISTS triage_confidence numeric,
  ADD COLUMN IF NOT EXISTS triage_reason text,
  ADD COLUMN IF NOT EXISTS triage_at timestamptz,
  ADD COLUMN IF NOT EXISTS triage_model text;

ALTER TABLE public.bibliography
  DROP CONSTRAINT IF EXISTS bibliography_triage_status_check;

ALTER TABLE public.bibliography
  ADD CONSTRAINT bibliography_triage_status_check
  CHECK (triage_status IS NULL OR triage_status IN ('auto_approved','auto_rejected','needs_review'));

ALTER TABLE public.bibliography
  DROP CONSTRAINT IF EXISTS bibliography_triage_confidence_check;

ALTER TABLE public.bibliography
  ADD CONSTRAINT bibliography_triage_confidence_check
  CHECK (triage_confidence IS NULL OR (triage_confidence >= 0 AND triage_confidence <= 1));

CREATE INDEX IF NOT EXISTS bibliography_triage_status_is_approved_idx
  ON public.bibliography (triage_status, is_approved);