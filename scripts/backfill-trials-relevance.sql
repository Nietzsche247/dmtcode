-- One-off backfill (run 2026-08-26): label existing clinical_trials rows with
-- relevance + compounds, mirroring supabase/functions/_shared/trials.ts.
-- Only touches rows where relevance is null or compounds is null/empty.
-- No other column is modified.
WITH src AS (
  SELECT id, lower(title || ' ' || coalesce(description, '')) AS t
  FROM public.clinical_trials
  WHERE relevance IS NULL OR compounds IS NULL OR compounds = '{}'::text[]
),
cls AS (
  SELECT
    id,
    t,
    CASE
      WHEN t ~ '(^|[^a-z0-9-])(dmt|n,n-dmt|dimethyltryptamine|ayahuasca|harmine|harmaline|harmala|psilocybin|psilocin|lsd|lysergic|mescaline|peyote|ibogaine|iboga)([^a-z0-9-]|$)' THEN 'core'
      WHEN t ~ '(^|[^a-z0-9-])(ketamine|esketamine|mdma|salvinorin|salvia divinorum|cannabis|thc|nitrous oxide|dextromethorphan)([^a-z0-9-]|$)'
           AND t ~ '(^|[^a-z0-9-])(visual|hallucin|phenomenolog|perception|perceptual|imagery|entity|geometr|altered state|consciousness|self-awareness|ego dissolution|mystical|subjective experience|dream|psychedelic experience)([^a-z0-9-]|$)' THEN 'adjacent'
      ELSE 'off_domain'
    END AS rel
  FROM src
)
UPDATE public.clinical_trials ct
SET
  relevance = cls.rel,
  compounds = (
    SELECT coalesce(array_agg(g.name ORDER BY g.ord), '{}'::text[])
    FROM (VALUES
      (1, 'N,N-DMT', '(^|[^a-z0-9-])(dmt|n,n-dmt|dimethyltryptamine)([^a-z0-9-]|$)'),
      (2, '5-MeO-DMT', '(^|[^a-z0-9-])(5-meo-dmt)([^a-z0-9-]|$)'),
      (3, 'Ayahuasca', '(^|[^a-z0-9-])(ayahuasca|harmine|harmaline|harmala)([^a-z0-9-]|$)'),
      (4, 'Psilocybin', '(^|[^a-z0-9-])(psilocybin|psilocin)([^a-z0-9-]|$)'),
      (5, 'LSD', '(^|[^a-z0-9-])(lsd|lysergic)([^a-z0-9-]|$)'),
      (6, 'Mescaline', '(^|[^a-z0-9-])(mescaline|peyote)([^a-z0-9-]|$)'),
      (7, 'Ibogaine', '(^|[^a-z0-9-])(ibogaine|iboga)([^a-z0-9-]|$)'),
      (8, 'Ketamine', '(^|[^a-z0-9-])(ketamine|esketamine)([^a-z0-9-]|$)'),
      (9, 'MDMA', '(^|[^a-z0-9-])(mdma)([^a-z0-9-]|$)'),
      (10, 'Salvinorin A', '(^|[^a-z0-9-])(salvinorin|salvia divinorum)([^a-z0-9-]|$)'),
      (11, 'Cannabis', '(^|[^a-z0-9-])(cannabis|thc)([^a-z0-9-]|$)'),
      (12, 'Nitrous oxide', '(^|[^a-z0-9-])(nitrous oxide)([^a-z0-9-]|$)'),
      (13, 'Dextromethorphan', '(^|[^a-z0-9-])(dextromethorphan)([^a-z0-9-]|$)')
    ) AS g(ord, name, pat)
    WHERE cls.t ~ g.pat
  )
FROM cls
WHERE ct.id = cls.id;
