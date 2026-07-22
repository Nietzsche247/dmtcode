
CREATE TABLE public.review_activity (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  source text NOT NULL DEFAULT 'reviewed',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_date)
);

CREATE INDEX review_activity_user_date_idx ON public.review_activity (user_id, activity_date DESC);

GRANT SELECT, INSERT ON public.review_activity TO authenticated;
GRANT ALL ON public.review_activity TO service_role;

ALTER TABLE public.review_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read own review activity"
  ON public.review_activity FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Members insert own review activity"
  ON public.review_activity FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Streak computation with a single-day auto freeze from day one.
-- Returns current streak length (in days), whether a freeze is currently absorbing
-- a missed day, and the most recent activity date.
CREATE OR REPLACE FUNCTION public.get_review_streak(_user_id uuid)
RETURNS TABLE (streak int, freeze_active boolean, last_activity date)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today date := (now() AT TIME ZONE 'UTC')::date;
  cursor_date date := today;
  d date;
  gap_used boolean := false;
  streak_count int := 0;
  last_d date;
BEGIN
  SELECT max(activity_date) INTO last_d
    FROM public.review_activity WHERE user_id = _user_id;

  IF last_d IS NULL THEN
    RETURN QUERY SELECT 0, false, NULL::date;
    RETURN;
  END IF;

  -- Allow one-day freeze from today: if today is missing but yesterday exists,
  -- streak still stands (freeze active). If both today and yesterday missing, broken.
  IF last_d < today - 1 THEN
    RETURN QUERY SELECT 0, false, last_d;
    RETURN;
  END IF;

  -- Walk consecutive days backwards from today, allowing at most one skipped day total.
  FOR d IN
    SELECT activity_date FROM public.review_activity
     WHERE user_id = _user_id AND activity_date <= today
     ORDER BY activity_date DESC
  LOOP
    IF d = cursor_date THEN
      streak_count := streak_count + 1;
      cursor_date := cursor_date - 1;
    ELSIF d = cursor_date - 1 AND NOT gap_used THEN
      -- one-day gap absorbed by freeze
      gap_used := true;
      streak_count := streak_count + 1;
      cursor_date := d - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN QUERY SELECT
    streak_count,
    (last_d = today - 1) AS freeze_active,
    last_d;
END;
$$;

REVOKE ALL ON FUNCTION public.get_review_streak(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_review_streak(uuid) TO authenticated;
