ALTER TABLE public.crawler_hits
  ADD COLUMN IF NOT EXISTS status_code integer,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS crawler_hits_status_ts_idx ON public.crawler_hits (status_code, ts DESC);

CREATE POLICY "Admins insert own review activity"
ON public.review_activity FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated read review activity"
ON public.review_activity FOR SELECT TO authenticated
USING (true);

GRANT SELECT, INSERT ON public.review_activity TO authenticated;
GRANT ALL ON public.review_activity TO service_role;