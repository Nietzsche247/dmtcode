
-- 1) symbol_tags: allow tagging real symbol_submissions
ALTER TABLE public.symbol_tags
  ADD COLUMN IF NOT EXISTS symbol_id uuid REFERENCES public.symbol_submissions(id) ON DELETE CASCADE,
  ALTER COLUMN glyph_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS symbol_tags_symbol_id_idx ON public.symbol_tags(symbol_id);

-- Ensure a tag row is anchored to exactly one target
ALTER TABLE public.symbol_tags DROP CONSTRAINT IF EXISTS symbol_tags_one_target_ck;
ALTER TABLE public.symbol_tags ADD CONSTRAINT symbol_tags_one_target_ck
  CHECK ((glyph_id IS NOT NULL)::int + (symbol_id IS NOT NULL)::int = 1);

-- 2) voice_logs: optional link to a real symbol submission
ALTER TABLE public.voice_logs
  ADD COLUMN IF NOT EXISTS symbol_id uuid REFERENCES public.symbol_submissions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS voice_logs_symbol_id_idx ON public.voice_logs(symbol_id);

-- 3) Rewrite the vote-count trigger so upvotes on symbol_submissions
-- always equals the real count of seen_it rows in symbol_votes.
CREATE OR REPLACE FUNCTION public.update_symbol_vote_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid;
  seen_count int;
  down_count int;
  submitter uuid;
  old_up int;
BEGIN
  target := COALESCE(NEW.symbol_id, OLD.symbol_id);
  IF target IS NULL THEN RETURN NULL; END IF;

  SELECT upvotes, user_id INTO old_up, submitter
    FROM public.symbol_submissions WHERE id = target;

  SELECT count(*) FILTER (WHERE vote_type = 'seen_it'),
         count(*) FILTER (WHERE vote_type = 'downvote')
    INTO seen_count, down_count
    FROM public.symbol_votes WHERE symbol_id = target;

  UPDATE public.symbol_submissions
    SET upvotes = seen_count, downvotes = down_count
    WHERE id = target;

  -- Reputation: submitter gets net change in seen_it count
  IF submitter IS NOT NULL AND seen_count <> COALESCE(old_up, 0) THEN
    UPDATE public.profiles
      SET reputation_score = GREATEST(0, reputation_score + (seen_count - COALESCE(old_up, 0)))
      WHERE id = submitter;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS symbol_votes_counts ON public.symbol_votes;
CREATE TRIGGER symbol_votes_counts
  AFTER INSERT OR DELETE ON public.symbol_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_symbol_vote_counts();

-- 4) Correct fabricated counts: recompute from real votes (currently 0)
UPDATE public.symbol_submissions s SET
  upvotes = COALESCE((SELECT count(*) FROM public.symbol_votes v WHERE v.symbol_id = s.id AND v.vote_type = 'seen_it'), 0),
  downvotes = COALESCE((SELECT count(*) FROM public.symbol_votes v WHERE v.symbol_id = s.id AND v.vote_type = 'downvote'), 0);

-- Recompute reputation and symbol_count from real data
UPDATE public.profiles p SET
  reputation_score = COALESCE((
    SELECT sum(s.upvotes) FROM public.symbol_submissions s WHERE s.user_id = p.id
  ), 0),
  symbol_count = COALESCE((
    SELECT count(*) FROM public.symbol_submissions s WHERE s.user_id = p.id AND s.status = 'approved'
  ), 0);

-- 5) Badge awarding trigger on real actions only
CREATE OR REPLACE FUNCTION public.award_submission_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;

  SELECT count(*) INTO n FROM public.symbol_submissions WHERE user_id = NEW.user_id;

  IF n >= 1 THEN
    INSERT INTO public.user_badges(user_id, badge_name)
      VALUES (NEW.user_id, 'first_symbol') ON CONFLICT DO NOTHING;
  END IF;
  IF n >= 5 THEN
    INSERT INTO public.user_badges(user_id, badge_name)
      VALUES (NEW.user_id, 'contributor') ON CONFLICT DO NOTHING;
  END IF;
  IF n >= 25 THEN
    INSERT INTO public.user_badges(user_id, badge_name)
      VALUES (NEW.user_id, 'data_scientist') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_submission_badges_trg ON public.symbol_submissions;
CREATE TRIGGER award_submission_badges_trg
  AFTER INSERT ON public.symbol_submissions
  FOR EACH ROW EXECUTE FUNCTION public.award_submission_badges();

CREATE OR REPLACE FUNCTION public.award_vote_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  submitter uuid;
BEGIN
  IF NEW.vote_type <> 'seen_it' THEN RETURN NEW; END IF;

  -- Voter gets validator badge on first seen_it
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_badges(user_id, badge_name)
      VALUES (NEW.user_id, 'validator') ON CONFLICT DO NOTHING;
  END IF;

  -- Submitter gets primacy_validated on first confirmation on their symbol
  SELECT user_id INTO submitter FROM public.symbol_submissions WHERE id = NEW.symbol_id;
  IF submitter IS NOT NULL THEN
    INSERT INTO public.user_badges(user_id, badge_name)
      VALUES (submitter, 'primacy_validated') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_vote_badges_trg ON public.symbol_votes;
CREATE TRIGGER award_vote_badges_trg
  AFTER INSERT ON public.symbol_votes
  FOR EACH ROW EXECUTE FUNCTION public.award_vote_badges();

-- Ensure user_badges has unique constraint for ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS user_badges_user_badge_uidx
  ON public.user_badges(user_id, badge_name);
