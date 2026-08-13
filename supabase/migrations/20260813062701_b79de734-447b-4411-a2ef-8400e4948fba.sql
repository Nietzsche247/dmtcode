CREATE TABLE public.symbols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol_id text UNIQUE NOT NULL,
  title text NOT NULL,
  family text NOT NULL,
  status text NOT NULL,
  date_note text,
  provenance text,
  sources text,
  semantic_value text,
  phonetic_value text,
  file_path text NOT NULL,
  figure_order int,
  article_slug text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.symbols TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.symbols TO authenticated;
GRANT ALL ON public.symbols TO service_role;

ALTER TABLE public.symbols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Symbols are publicly readable"
  ON public.symbols FOR SELECT
  USING (true);

CREATE POLICY "Admins manage symbols"
  ON public.symbols FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));