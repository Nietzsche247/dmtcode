
CREATE OR REPLACE FUNCTION public.get_co_witnesses(_symbol_id uuid)
 RETURNS TABLE(user_id uuid, handle text, avatar_seed text, surface_type text, context_note text, visibility co_witness_visibility)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND (
      cp.visibility = 'wall'
      OR (
        cp.visibility = 'pairs_only'
        AND auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.symbol_votes vv
          WHERE vv.symbol_id = _symbol_id
            AND vv.vote_type = 'seen_it'
            AND vv.user_id = auth.uid()
        )
      )
    );
$function$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.co_witness_high_fives;
