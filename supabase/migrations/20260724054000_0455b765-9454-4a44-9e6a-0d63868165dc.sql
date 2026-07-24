
ALTER TABLE public.theories ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.theories
  ADD COLUMN IF NOT EXISTS proponent text NULL,
  ADD COLUMN IF NOT EXISTS source_title text NULL,
  ADD COLUMN IF NOT EXISTS source_url text NULL,
  ADD COLUMN IF NOT EXISTS source_type text NULL,
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'community',
  ADD COLUMN IF NOT EXISTS tags text[] NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'theories_source_type_check') THEN
    ALTER TABLE public.theories
      ADD CONSTRAINT theories_source_type_check
      CHECK (source_type IS NULL OR source_type IN ('book','academic','essay','podcast','interview','video','forum','community'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'theories_origin_check') THEN
    ALTER TABLE public.theories
      ADD CONSTRAINT theories_origin_check
      CHECK (origin IN ('curated','community'));
  END IF;
END $$;

-- Recompute upvotes from theory_votes via trigger (server authoritative)
CREATE OR REPLACE FUNCTION public.update_theory_upvotes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid;
  c int;
BEGIN
  target := COALESCE(NEW.theory_id, OLD.theory_id);
  IF target IS NULL THEN RETURN NULL; END IF;
  SELECT count(*) INTO c FROM public.theory_votes WHERE theory_id = target;
  UPDATE public.theories SET upvotes = c WHERE id = target;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS theory_votes_recount ON public.theory_votes;
CREATE TRIGGER theory_votes_recount
AFTER INSERT OR DELETE ON public.theory_votes
FOR EACH ROW EXECUTE FUNCTION public.update_theory_upvotes();
