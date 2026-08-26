CREATE OR REPLACE FUNCTION public.translation_candidates(
  p_table text,
  p_key text,
  p_fields text[],
  p_locale text,
  p_gate_sql text,
  p_after text,
  p_limit int
)
RETURNS SETOF jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed jsonb := jsonb_build_object(
    'theories','id',
    'guides','slug',
    'articles','slug',
    'protocols','slug',
    'events','id',
    'retreats','id',
    'bibliography','id',
    'clinical_trials','id'
  );
  v_gate text;
  v_sql text;
BEGIN
  IF NOT (v_allowed ? p_table) THEN
    RAISE EXCEPTION 'table not allowed: %', p_table;
  END IF;
  IF (v_allowed ->> p_table) IS DISTINCT FROM p_key THEN
    RAISE EXCEPTION 'key not allowed for table %: %', p_table, p_key;
  END IF;

  v_gate := CASE coalesce(btrim(p_gate_sql), '')
    WHEN '' THEN 'true'
    WHEN 'true' THEN 'true'
    WHEN 'is_approved is true' THEN 'is_approved is true'
    WHEN 'is_published is true' THEN 'is_published is true'
    ELSE NULL
  END;
  IF v_gate IS NULL THEN
    RAISE EXCEPTION 'gate not allowed: %', p_gate_sql;
  END IF;

  v_sql := format(
    'select to_jsonb(t) from public.%I t
       where %s
         and ($1 is null or t.%I::text > $1)
         and exists (
           select 1 from unnest($2::text[]) f
           where nullif(btrim(coalesce(to_jsonb(t)->>f, '''')), '''') is not null
             and not exists (
               select 1 from public.content_translations c
               where c.table_name = $3
                 and c.record_id = t.%I::text
                 and c.locale = $4
                 and c.field = f
             )
         )
       order by t.%I::text asc
       limit $5',
    p_table, v_gate, p_key, p_key, p_key
  );

  RETURN QUERY EXECUTE v_sql USING p_after, p_fields, p_table, p_locale, greatest(coalesce(p_limit, 200), 1);
END;
$$;

REVOKE ALL ON FUNCTION public.translation_candidates(text, text, text[], text, text, text, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.translation_candidates(text, text, text[], text, text, text, int) FROM anon;
REVOKE ALL ON FUNCTION public.translation_candidates(text, text, text[], text, text, text, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.translation_candidates(text, text, text[], text, text, text, int) TO service_role;