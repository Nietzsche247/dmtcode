CREATE TABLE public.intel_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at timestamptz NOT NULL DEFAULT now(),
  period_days int NOT NULL DEFAULT 7,
  payload jsonb NOT NULL,
  data_health jsonb NOT NULL,
  duration_ms int,
  status text NOT NULL DEFAULT 'ok',
  error text
);

GRANT SELECT ON public.intel_snapshots TO authenticated;
GRANT ALL ON public.intel_snapshots TO service_role;

ALTER TABLE public.intel_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view intel snapshots"
  ON public.intel_snapshots FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages intel snapshots"
  ON public.intel_snapshots FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TABLE public.intel_metrics (
  id bigserial PRIMARY KEY,
  snapshot_id uuid REFERENCES public.intel_snapshots(id) ON DELETE CASCADE,
  captured_at timestamptz NOT NULL,
  domain text NOT NULL,
  metric_key text NOT NULL,
  label text NOT NULL,
  value numeric,
  prior_value numeric,
  delta_pct numeric,
  unit text,
  quality text NOT NULL DEFAULT 'ok',
  note text
);

GRANT SELECT ON public.intel_metrics TO authenticated;
GRANT ALL ON public.intel_metrics TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.intel_metrics_id_seq TO service_role;

ALTER TABLE public.intel_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view intel metrics"
  ON public.intel_metrics FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages intel metrics"
  ON public.intel_metrics FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_intel_metrics_key_time ON public.intel_metrics (metric_key, captured_at DESC);
CREATE INDEX idx_intel_metrics_domain ON public.intel_metrics (domain);
CREATE INDEX idx_intel_metrics_snapshot ON public.intel_metrics (snapshot_id);
CREATE INDEX idx_intel_snapshots_captured ON public.intel_snapshots (captured_at DESC);