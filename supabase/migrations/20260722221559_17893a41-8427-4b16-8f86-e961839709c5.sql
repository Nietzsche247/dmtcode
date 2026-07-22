
INSERT INTO public.badges (name, description, icon, category, threshold)
VALUES ('first_recognition', 'Confirmed your first symbol in the registry.', '✶', 'contribution', 1)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  threshold = EXCLUDED.threshold;

CREATE OR REPLACE FUNCTION public.award_vote_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  submitter uuid;
  voter_seen_count int;
BEGIN
  IF NEW.vote_type <> 'seen_it' THEN RETURN NEW; END IF;

  IF NEW.user_id IS NOT NULL THEN
    -- Validator badge (existing)
    INSERT INTO public.user_badges(user_id, badge_name)
      VALUES (NEW.user_id, 'validator') ON CONFLICT DO NOTHING;

    -- First Recognition on the voter's very first seen_it
    SELECT count(*) INTO voter_seen_count
      FROM public.symbol_votes
      WHERE user_id = NEW.user_id AND vote_type = 'seen_it';

    IF voter_seen_count = 1 THEN
      INSERT INTO public.user_badges(user_id, badge_name)
        VALUES (NEW.user_id, 'first_recognition') ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Submitter gets primacy_validated on first confirmation on their symbol
  SELECT user_id INTO submitter FROM public.symbol_submissions WHERE id = NEW.symbol_id;
  IF submitter IS NOT NULL THEN
    INSERT INTO public.user_badges(user_id, badge_name)
      VALUES (submitter, 'primacy_validated') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Backfill: any user who already has a seen_it vote gets First Recognition
INSERT INTO public.user_badges (user_id, badge_name)
SELECT DISTINCT user_id, 'first_recognition'
FROM public.symbol_votes
WHERE vote_type = 'seen_it' AND user_id IS NOT NULL
ON CONFLICT DO NOTHING;
