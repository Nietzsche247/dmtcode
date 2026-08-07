CREATE TABLE public.route_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  status_code int,
  canonical_href text,
  canonical_status int,
  alternates_broken text[],
  issue text,
  source text NOT NULL,
  bot_name text,
  checked_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.route_health TO authenticated;
GRANT ALL ON public.route_health TO service_role;

ALTER TABLE public.route_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view route health"
  ON public.route_health FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages route health"
  ON public.route_health FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX route_health_checked_at_idx ON public.route_health (checked_at DESC);
CREATE INDEX route_health_issue_idx ON public.route_health (issue) WHERE issue IS NOT NULL;