CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_stats (user_id, total_submissions)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
    SET total_submissions = user_stats.total_submissions + 1,
        updated_at = now();

  RETURN NEW;
END;
$function$;

ALTER TABLE public.user_stats ALTER COLUMN session_id DROP NOT NULL;