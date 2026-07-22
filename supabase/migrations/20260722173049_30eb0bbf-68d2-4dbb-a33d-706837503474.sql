CREATE OR REPLACE FUNCTION public._rotate_cron_secret(new_val text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sid uuid;
BEGIN
  SELECT id INTO sid FROM vault.secrets WHERE name = 'CRON_SECRET';
  IF sid IS NULL THEN
    PERFORM vault.create_secret(new_val, 'CRON_SECRET');
  ELSE
    PERFORM vault.update_secret(sid, new_val, 'CRON_SECRET');
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public._rotate_cron_secret(text) FROM PUBLIC, anon, authenticated;