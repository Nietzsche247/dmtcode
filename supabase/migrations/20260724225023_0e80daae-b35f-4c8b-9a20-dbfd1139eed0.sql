CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  dek text NOT NULL,
  body_md text NOT NULL,
  topic_tags text[] NOT NULL DEFAULT '{}',
  compounds text[] NOT NULL DEFAULT '{}',
  target_query text,
  related_trials uuid[] NOT NULL DEFAULT '{}',
  related_bibliography uuid[] NOT NULL DEFAULT '{}',
  related_symbols uuid[] NOT NULL DEFAULT '{}',
  related_protocols text[] NOT NULL DEFAULT '{}',
  author text NOT NULL DEFAULT 'DMT Code Project',
  reviewed_by text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX articles_published_idx ON public.articles (is_published, published_at DESC);
CREATE INDEX articles_topic_tags_idx ON public.articles USING gin (topic_tags);
CREATE INDEX articles_compounds_idx ON public.articles USING gin (compounds);

GRANT SELECT ON public.articles TO anon, authenticated;
GRANT ALL ON public.articles TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.articles TO authenticated;

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published articles are public"
  ON public.articles
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Admins can read all articles"
  ON public.articles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert articles"
  ON public.articles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update articles"
  ON public.articles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete articles"
  ON public.articles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER articles_set_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();