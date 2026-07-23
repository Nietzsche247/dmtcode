
CREATE TABLE public.product_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_slug text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_signups_bundle_slug_idx ON public.product_signups(bundle_slug);
GRANT INSERT ON public.product_signups TO anon, authenticated;
GRANT SELECT ON public.product_signups TO authenticated;
GRANT ALL ON public.product_signups TO service_role;
ALTER TABLE public.product_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can sign up for notifications"
  ON public.product_signups FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Admins can view signups"
  ON public.product_signups FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.bundles ADD COLUMN IF NOT EXISTS related_links jsonb DEFAULT NULL;
