CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'waitlist',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX waitlist_email_lower_idx ON public.waitlist (lower(email));

GRANT INSERT ON public.waitlist TO anon, authenticated;
GRANT SELECT ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
  ON public.waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins and moderators can view waitlist"
  ON public.waitlist FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );