
-- Tighten INSERT policies: allow anonymous guest inserts (user_id null) or
-- authenticated user inserting for themselves, but no cross-user impersonation.

DROP POLICY IF EXISTS "Anyone can create assessments" ON public.assessments;
CREATE POLICY "Users create own or anonymous assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can create voice logs" ON public.voice_logs;
CREATE POLICY "Users create own or anonymous voice logs"
  ON public.voice_logs FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can submit registry glyphs" ON public.registry_glyphs;
CREATE POLICY "Users submit own or anonymous registry glyphs"
  ON public.registry_glyphs FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can submit confirmations" ON public.registry_confirmations;
CREATE POLICY "Users submit own or anonymous confirmations"
  ON public.registry_confirmations FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can subscribe to trial notifications" ON public.trial_watchlist;
CREATE POLICY "Users subscribe own or anonymous trial notifications"
  ON public.trial_watchlist FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Restrict execute on has_role SECURITY DEFINER function so anonymous callers
-- can no longer invoke it via the API. Authenticated users still need EXECUTE
-- for RLS policies that call has_role() to evaluate.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
