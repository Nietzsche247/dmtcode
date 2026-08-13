CREATE OR REPLACE FUNCTION public.notify_scraper_run()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM 'success' THEN
    INSERT INTO public.admin_notifications (type, message, metadata)
    VALUES (
      'scraper_failure',
      format('Scraper "%s" finished with status %s.%s',
             NEW.scraper_name,
             NEW.status,
             CASE WHEN NEW.error_message IS NULL THEN '' ELSE ' ' || NEW.error_message END),
      jsonb_build_object(
        'run_id', NEW.id,
        'scraper_name', NEW.scraper_name,
        'source', NEW.source,
        'status', NEW.status,
        'error_message', NEW.error_message,
        'items_seen', NEW.trials_found,
        'items_stored', NEW.trials_added,
        'last_run_at', NEW.last_run_at
      )
    );
  ELSIF COALESCE(NEW.trials_added, 0) = 0 AND COALESCE(NEW.trials_found, 0) > 0 THEN
    INSERT INTO public.admin_notifications (type, message, metadata)
    VALUES (
      'scraper_empty',
      format('Scraper "%s" saw %s items but stored 0 new leads.', NEW.scraper_name, COALESCE(NEW.trials_found, 0)),
      jsonb_build_object(
        'run_id', NEW.id,
        'scraper_name', NEW.scraper_name,
        'source', NEW.source,
        'status', NEW.status,
        'items_seen', NEW.trials_found,
        'items_stored', NEW.trials_added,
        'last_run_at', NEW.last_run_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_scraper_run ON public.scraper_runs;
CREATE TRIGGER trg_notify_scraper_run
AFTER INSERT ON public.scraper_runs
FOR EACH ROW EXECUTE FUNCTION public.notify_scraper_run();