
CREATE TABLE public.crawler_hits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL DEFAULT now(),
  path text,
  bot_name text,
  bot_class text,
  user_agent text,
  referer text
);

GRANT INSERT ON public.crawler_hits TO anon;
GRANT INSERT ON public.crawler_hits TO authenticated;
GRANT ALL ON public.crawler_hits TO service_role;

ALTER TABLE public.crawler_hits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can insert crawler hits"
  ON public.crawler_hits FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "authenticated can insert crawler hits"
  ON public.crawler_hits FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "admins can read crawler hits"
  ON public.crawler_hits FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX crawler_hits_ts_idx ON public.crawler_hits (ts DESC);
CREATE INDEX crawler_hits_bot_class_idx ON public.crawler_hits (bot_class);
