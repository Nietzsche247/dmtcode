CREATE TABLE public.guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  question text NOT NULL,
  short_answer text NOT NULL,
  evidence_grade text,
  evidence_grade_note text,
  what_supports jsonb NOT NULL DEFAULT '[]'::jsonb,
  what_weakens jsonb NOT NULL DEFAULT '[]'::jsonb,
  what_is_unknown jsonb NOT NULL DEFAULT '[]'::jsonb,
  what_would_change jsonb NOT NULL DEFAULT '[]'::jsonb,
  safety_note text,
  body_md text,
  related_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  last_reviewed date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.guides TO anon;
GRANT SELECT ON public.guides TO authenticated;
GRANT ALL ON public.guides TO service_role;

ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published guides are viewable by everyone"
ON public.guides
FOR SELECT
TO anon, authenticated
USING (is_published = true);