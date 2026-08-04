-- Server-side crawler aggregation. Counting rows in the client truncates at the
-- PostgREST row cap, so every crawler metric must aggregate in Postgres.

CREATE OR REPLACE FUNCTION public.intel_crawler_window(_from timestamptz, _to timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', count(*),
    'unique_bots', count(DISTINCT bot_name),
    'answer_hits', count(*) FILTER (
      WHERE bot_class = 'answer'
         OR bot_name IN ('ChatGPT-User','OAI-SearchBot','Claude-User','Claude-SearchBot','Perplexity-User','PerplexityBot')
    ),
    'sections', count(DISTINCT '/' || split_part(ltrim(coalesce(path, '/'), '/'), '/', 1))
  )
  FROM public.crawler_hits
  WHERE ts >= _from AND ts < _to;
$$;

CREATE OR REPLACE FUNCTION public.intel_crawler_health(_days int DEFAULT 30, _window_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cov_start date;
  cov_end date;
  gaps text[];
  silent int;
  has_status boolean;
  coverage int := 0;
BEGIN
  SELECT min(ts)::date, max(ts)::date INTO cov_start, cov_end FROM public.crawler_hits;

  IF cov_start IS NULL THEN
    RETURN jsonb_build_object(
      'coverage_start', NULL, 'coverage_end', NULL,
      'gap_days', '[]'::jsonb, 'silent_bots', 0, 'status_code_coverage', 0
    );
  END IF;

  -- A gap is a day with zero rows that falls INSIDE the covered window.
  -- Days before coverage_start are "no history", not a logging failure.
  SELECT coalesce(array_agg(d::text ORDER BY d), '{}')
    INTO gaps
  FROM generate_series(
         greatest(cov_start, (now() AT TIME ZONE 'UTC')::date - _days),
         (now() AT TIME ZONE 'UTC')::date - 1,
         interval '1 day'
       ) AS g(d)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.crawler_hits h
    WHERE h.ts >= g.d AND h.ts < g.d + interval '1 day'
  );

  SELECT count(*) INTO silent
  FROM (
    SELECT DISTINCT bot_name FROM public.crawler_hits WHERE bot_name IS NOT NULL
    EXCEPT
    SELECT DISTINCT bot_name FROM public.crawler_hits
     WHERE bot_name IS NOT NULL AND ts >= now() - (_window_days || ' days')::interval
  ) q;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crawler_hits' AND column_name = 'status_code'
  ) INTO has_status;

  IF has_status THEN
    EXECUTE format(
      'SELECT coalesce(round(100.0 * count(*) FILTER (WHERE status_code IS NOT NULL) / nullif(count(*), 0)), 0)::int
         FROM public.crawler_hits WHERE ts >= now() - %L::interval',
      _window_days || ' days'
    ) INTO coverage;
  END IF;

  RETURN jsonb_build_object(
    'coverage_start', cov_start,
    'coverage_end', cov_end,
    'gap_days', to_jsonb(gaps),
    'silent_bots', silent,
    'status_code_coverage', coverage
  );
END;
$$;

REVOKE ALL ON FUNCTION public.intel_crawler_window(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.intel_crawler_health(int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.intel_crawler_window(timestamptz, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.intel_crawler_health(int, int) TO service_role;