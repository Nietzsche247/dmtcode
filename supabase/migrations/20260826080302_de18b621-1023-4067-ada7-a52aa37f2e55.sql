CREATE OR REPLACE FUNCTION public.claim_anon_vote(p_symbol_id uuid, p_session_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_claimed integer := 0;
  v_deleted integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 0;
  END IF;

  -- Drop anonymous rows for stances the caller already holds as an
  -- authenticated row; claiming them would violate the unique index.
  WITH del AS (
    DELETE FROM public.symbol_votes sv
    WHERE sv.symbol_id = p_symbol_id
      AND sv.session_id = p_session_id
      AND sv.user_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.symbol_votes own
        WHERE own.symbol_id = sv.symbol_id
          AND own.user_id = v_uid
          AND own.vote_type = sv.vote_type
      )
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted FROM del;

  WITH upd AS (
    UPDATE public.symbol_votes sv
    SET user_id = v_uid
    WHERE sv.symbol_id = p_symbol_id
      AND sv.session_id = p_session_id
      AND sv.user_id IS NULL
    RETURNING 1
  )
  SELECT count(*) INTO v_claimed FROM upd;

  RETURN v_claimed + v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_anon_vote(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_anon_vote(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_anon_vote(uuid, text) TO authenticated;