
-- Vocabulary additions
INSERT INTO public.tag_vocabulary (term, category, status, promoted_at)
VALUES ('desk','surface','canonical', now()),
       ('table','surface','canonical', now())
ON CONFLICT (term) DO NOTHING;

-- Enum for visibility
DO $$ BEGIN
  CREATE TYPE public.co_witness_visibility AS ENUM ('private','pairs_only','wall');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- co_witness_prefs
CREATE TABLE public.co_witness_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  visibility public.co_witness_visibility NOT NULL DEFAULT 'private',
  allow_high_five boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.co_witness_prefs TO authenticated;
GRANT SELECT ON public.co_witness_prefs TO anon;
GRANT ALL ON public.co_witness_prefs TO service_role;
ALTER TABLE public.co_witness_prefs ENABLE ROW LEVEL SECURITY;

-- Public can only see rows where the user opted in
CREATE POLICY "Opted-in prefs visible to all"
  ON public.co_witness_prefs FOR SELECT
  USING (visibility IN ('pairs_only','wall') OR auth.uid() = user_id);

CREATE POLICY "Users manage own prefs insert"
  ON public.co_witness_prefs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own prefs update"
  ON public.co_witness_prefs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own prefs delete"
  ON public.co_witness_prefs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_co_witness_prefs_updated_at
  BEFORE UPDATE ON public.co_witness_prefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- co_witness_high_fives
CREATE TABLE public.co_witness_high_fives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol_id uuid NOT NULL REFERENCES public.symbol_submissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_user, to_user, symbol_id),
  CHECK (from_user <> to_user)
);
GRANT SELECT, INSERT, DELETE ON public.co_witness_high_fives TO authenticated;
GRANT ALL ON public.co_witness_high_fives TO service_role;
ALTER TABLE public.co_witness_high_fives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "High-fives are public read"
  ON public.co_witness_high_fives FOR SELECT USING (true);

CREATE POLICY "Users insert own high-fives"
  ON public.co_witness_high_fives FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = from_user
    AND EXISTS (
      SELECT 1 FROM public.co_witness_prefs p
      WHERE p.user_id = to_user AND p.allow_high_five = true
        AND p.visibility IN ('pairs_only','wall')
    )
  );

CREATE POLICY "Users delete own high-fives"
  ON public.co_witness_high_fives FOR DELETE
  TO authenticated
  USING (auth.uid() = from_user);

-- co_witness_recollections
CREATE TABLE public.co_witness_recollections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol_id uuid NOT NULL REFERENCES public.symbol_submissions(id) ON DELETE CASCADE,
  context_term text REFERENCES public.tag_vocabulary(term) ON DELETE SET NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.co_witness_recollections TO authenticated;
GRANT SELECT ON public.co_witness_recollections TO anon;
GRANT ALL ON public.co_witness_recollections TO service_role;
ALTER TABLE public.co_witness_recollections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recollections public read"
  ON public.co_witness_recollections FOR SELECT USING (true);

-- INSERT allowed only if author already holds a seen_it on that symbol.
-- This policy READS symbol_votes but never writes it.
CREATE POLICY "Authors post recollections after seen_it"
  ON public.co_witness_recollections FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.symbol_votes v
      WHERE v.symbol_id = co_witness_recollections.symbol_id
        AND v.user_id = auth.uid()
        AND v.vote_type = 'seen_it'
    )
  );

CREATE POLICY "Authors delete own recollections"
  ON public.co_witness_recollections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX co_witness_recollections_symbol_idx
  ON public.co_witness_recollections(symbol_id, created_at DESC);
CREATE INDEX co_witness_recollections_term_idx
  ON public.co_witness_recollections(context_term);
CREATE INDEX co_witness_high_fives_pair_idx
  ON public.co_witness_high_fives(to_user, from_user, symbol_id);

-- Derivation functions. SELECT-ONLY on symbol_votes.
CREATE OR REPLACE FUNCTION public.get_co_witnesses(_symbol_id uuid)
RETURNS TABLE (
  user_id uuid,
  handle text,
  avatar_seed text,
  surface_type text,
  context_note text,
  visibility public.co_witness_visibility
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.user_id,
    p.handle,
    p.avatar_seed,
    s.surface_type,
    s.context_note,
    cp.visibility
  FROM public.symbol_votes v
  JOIN public.co_witness_prefs cp ON cp.user_id = v.user_id
  JOIN public.profiles p ON p.id = v.user_id
  LEFT JOIN LATERAL (
    SELECT ss.surface_type, ss.context_note
    FROM public.symbol_submissions ss
    WHERE ss.user_id = v.user_id AND ss.id = _symbol_id
    LIMIT 1
  ) s ON true
  WHERE v.symbol_id = _symbol_id
    AND v.vote_type = 'seen_it'
    AND v.user_id IS NOT NULL
    AND cp.visibility IN ('pairs_only','wall');
$$;

CREATE OR REPLACE FUNCTION public.get_my_co_witnesses(_user_id uuid)
RETURNS TABLE (
  symbol_id uuid,
  other_user_id uuid,
  handle text,
  avatar_seed text,
  visibility public.co_witness_visibility
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH mine AS (
    SELECT v.symbol_id
    FROM public.symbol_votes v
    WHERE v.user_id = _user_id AND v.vote_type = 'seen_it'
  )
  SELECT
    v.symbol_id,
    v.user_id AS other_user_id,
    p.handle,
    p.avatar_seed,
    cp.visibility
  FROM public.symbol_votes v
  JOIN mine ON mine.symbol_id = v.symbol_id
  JOIN public.co_witness_prefs cp ON cp.user_id = v.user_id
  JOIN public.profiles p ON p.id = v.user_id
  WHERE v.vote_type = 'seen_it'
    AND v.user_id <> _user_id
    AND cp.visibility IN ('pairs_only','wall');
$$;

REVOKE ALL ON FUNCTION public.get_co_witnesses(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_co_witnesses(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_co_witnesses(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_my_co_witnesses(uuid) TO authenticated;
