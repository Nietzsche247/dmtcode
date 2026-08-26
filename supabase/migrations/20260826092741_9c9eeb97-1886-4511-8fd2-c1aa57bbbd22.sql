CREATE TABLE public.research_preregistrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  hypothesis text NOT NULL,
  method_summary text NOT NULL,
  instruments text,
  contact_email text NOT NULL,
  orcid text,
  affiliation text,
  status text NOT NULL DEFAULT 'submitted',
  reviewer_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT research_prereg_status_check CHECK (status IN ('submitted','under_review','published','declined')),
  CONSTRAINT research_prereg_email_check CHECK (contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(contact_email) <= 254),
  CONSTRAINT research_prereg_title_len CHECK (length(title) BETWEEN 3 AND 300),
  CONSTRAINT research_prereg_hypothesis_len CHECK (length(hypothesis) BETWEEN 10 AND 4000),
  CONSTRAINT research_prereg_method_len CHECK (length(method_summary) BETWEEN 10 AND 6000),
  CONSTRAINT research_prereg_instruments_len CHECK (instruments IS NULL OR length(instruments) <= 2000),
  CONSTRAINT research_prereg_orcid_len CHECK (orcid IS NULL OR length(orcid) <= 100),
  CONSTRAINT research_prereg_affiliation_len CHECK (affiliation IS NULL OR length(affiliation) <= 300),
  CONSTRAINT research_prereg_reviewer_note_len CHECK (reviewer_note IS NULL OR length(reviewer_note) <= 4000)
);

GRANT INSERT ON public.research_preregistrations TO anon;
GRANT INSERT ON public.research_preregistrations TO authenticated;
GRANT SELECT, UPDATE ON public.research_preregistrations TO authenticated;
GRANT ALL ON public.research_preregistrations TO service_role;

ALTER TABLE public.research_preregistrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a preregistration"
ON public.research_preregistrations
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'submitted' AND reviewer_note IS NULL AND reviewed_at IS NULL);

CREATE POLICY "Admins can read preregistrations"
ON public.research_preregistrations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update preregistrations"
ON public.research_preregistrations
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_research_prereg_created_at ON public.research_preregistrations (created_at DESC);