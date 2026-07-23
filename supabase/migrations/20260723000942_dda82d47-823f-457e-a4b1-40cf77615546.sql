
-- ============================================================
-- STEP 1: tag_vocabulary (canonical + candidate context terms)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tag_vocabulary (
  term text PRIMARY KEY,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'candidate' CHECK (status IN ('canonical','candidate','rejected')),
  usage_count integer NOT NULL DEFAULT 0,
  promoted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tag_vocabulary TO anon, authenticated;
GRANT INSERT ON public.tag_vocabulary TO authenticated;
GRANT ALL ON public.tag_vocabulary TO service_role;

ALTER TABLE public.tag_vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vocab public read"
  ON public.tag_vocabulary FOR SELECT
  USING (true);

-- Authenticated users can only propose candidates (not canonical)
CREATE POLICY "vocab authenticated propose candidate"
  ON public.tag_vocabulary FOR INSERT
  TO authenticated
  WITH CHECK (status = 'candidate');

-- Only admins can update (i.e., promote/reject)
CREATE POLICY "vocab admin update"
  ON public.tag_vocabulary FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "vocab admin delete"
  ON public.tag_vocabulary FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tag_vocabulary_updated
  BEFORE UPDATE ON public.tag_vocabulary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed canonical vocabulary
INSERT INTO public.tag_vocabulary (term, category, status, promoted_at) VALUES
  ('wall','surface','canonical', now()),
  ('ceiling','surface','canonical', now()),
  ('floor','surface','canonical', now()),
  ('window','surface','canonical', now()),
  ('mirror','surface','canonical', now()),
  ('door','surface','canonical', now()),
  ('cup','object','canonical', now()),
  ('mug','object','canonical', now()),
  ('plate','object','canonical', now()),
  ('book','object','canonical', now()),
  ('page','object','canonical', now()),
  ('screen','object','canonical', now()),
  ('phone','object','canonical', now()),
  ('keyboard','object','canonical', now()),
  ('car interior','vehicle','canonical', now()),
  ('school bus','vehicle','canonical', now()),
  ('airplane cabin','vehicle','canonical', now()),
  ('train','vehicle','canonical', now()),
  ('skin','body','canonical', now()),
  ('closed eyelids','body','canonical', now()),
  ('palm','body','canonical', now()),
  ('arm','body','canonical', now()),
  ('tree bark','nature','canonical', now()),
  ('leaf','nature','canonical', now()),
  ('water surface','nature','canonical', now()),
  ('cloud','nature','canonical', now()),
  ('sand','nature','canonical', now()),
  ('stone','nature','canonical', now()),
  ('tile','architecture','canonical', now()),
  ('brick','architecture','canonical', now()),
  ('carpet','architecture','canonical', now()),
  ('curtain','architecture','canonical', now()),
  ('fabric weave','architecture','canonical', now()),
  ('candlelight','lighting','canonical', now()),
  ('sunlight','lighting','canonical', now()),
  ('darkness','lighting','canonical', now()),
  ('streetlight','lighting','canonical', now())
ON CONFLICT (term) DO NOTHING;

-- ============================================================
-- STEP 2: Bucket A — submitter context_note on symbol_submissions
-- Additive column only. Does not touch upvotes/downvotes/votes.
-- ============================================================
ALTER TABLE public.symbol_submissions
  ADD COLUMN IF NOT EXISTS context_note text;

-- ============================================================
-- STEP 3: Bucket B — add kind to symbol_tags, tighten RLS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.tag_kind AS ENUM ('context','general');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.symbol_tags
  ADD COLUMN IF NOT EXISTS kind public.tag_kind NOT NULL DEFAULT 'general';

-- Uniqueness: one user cannot duplicate the same term on the same symbol
CREATE UNIQUE INDEX IF NOT EXISTS symbol_tags_symbol_user_term_uidx
  ON public.symbol_tags (symbol_id, user_id, tag_name)
  WHERE symbol_id IS NOT NULL;

-- Drop overly permissive existing insert policy if present, and replace with a stricter one.
-- Submitters should NOT tag their own symbol (they use Bucket A).
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='symbol_tags' AND cmd='INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.symbol_tags', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "symbol_tags authenticated insert (non-submitter)"
  ON public.symbol_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND symbol_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.symbol_submissions s
       WHERE s.id = symbol_id AND s.user_id = auth.uid()
    )
  );
