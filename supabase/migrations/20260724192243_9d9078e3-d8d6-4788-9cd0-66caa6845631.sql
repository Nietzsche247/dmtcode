DO $$
DECLARE
  dup_count int;
BEGIN
  SELECT count(*) INTO dup_count FROM (
    SELECT trial_registry_id
    FROM public.clinical_trials
    WHERE trial_registry_id IS NOT NULL
    GROUP BY trial_registry_id
    HAVING count(*) > 1
  ) d;

  IF dup_count = 0 THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS clinical_trials_registry_id_key
             ON public.clinical_trials (trial_registry_id)
             WHERE trial_registry_id IS NOT NULL';
    RAISE NOTICE 'clinical_trials_registry_id_key created';
  ELSE
    RAISE NOTICE 'clinical_trials_registry_id_key NOT created: % duplicated trial_registry_id value(s) present', dup_count;
  END IF;
END$$;