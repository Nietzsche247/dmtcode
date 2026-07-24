CREATE TABLE public.trial_backfill_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  run_by uuid,
  total int NOT NULL DEFAULT 0,
  updated int NOT NULL DEFAULT 0,
  not_found int NOT NULL DEFAULT 0,
  failed int NOT NULL DEFAULT 0,
  title_mismatches jsonb NOT NULL DEFAULT '[]'::jsonb,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb
);

GRANT SELECT, INSERT, UPDATE ON public.trial_backfill_runs TO authenticated;
GRANT ALL ON public.trial_backfill_runs TO service_role;

ALTER TABLE public.trial_backfill_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view backfill runs"
  ON public.trial_backfill_runs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert backfill runs"
  ON public.trial_backfill_runs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update backfill runs"
  ON public.trial_backfill_runs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));