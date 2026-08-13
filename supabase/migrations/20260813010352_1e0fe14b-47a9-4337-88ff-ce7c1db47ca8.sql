CREATE TABLE IF NOT EXISTS public.article_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  outlet text,
  author text,
  published_at timestamptz,
  source text NOT NULL DEFAULT 'google_news',
  topic_tags text[] NOT NULL DEFAULT '{}',
  compounds text[] NOT NULL DEFAULT '{}',
  relevance_score integer NOT NULL DEFAULT 0,
  triage_status text,
  triage_reason text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS article_leads_created_idx ON public.article_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS article_leads_status_idx ON public.article_leads (is_approved, triage_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_leads TO authenticated;
GRANT ALL ON public.article_leads TO service_role;

ALTER TABLE public.article_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read article leads"
  ON public.article_leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update article leads"
  ON public.article_leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete article leads"
  ON public.article_leads FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_article_leads_updated_at
  BEFORE UPDATE ON public.article_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();