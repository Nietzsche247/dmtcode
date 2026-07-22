
-- Assessments
DROP POLICY IF EXISTS "Shared assessments viewable by token" ON public.assessments;
DROP POLICY IF EXISTS "Users can view own assessments" ON public.assessments;
CREATE POLICY "Users can view own assessments" ON public.assessments
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Voice logs
DROP POLICY IF EXISTS "Users can view own voice logs" ON public.voice_logs;
CREATE POLICY "Users can view own voice logs" ON public.voice_logs
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Trial watchlist
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.trial_watchlist;
CREATE POLICY "Users can view own subscriptions" ON public.trial_watchlist
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- User roles
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;
CREATE POLICY "Users view own roles or admins view all" ON public.user_roles
  FOR SELECT USING (
    auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- api_access_log: restrict INSERT to service_role only
DROP POLICY IF EXISTS "Service role can insert logs" ON public.api_access_log;
CREATE POLICY "Service role can insert logs" ON public.api_access_log
  FOR INSERT TO service_role WITH CHECK (true);

-- Storage: remove broad public bucket listing
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Glyph images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view symbol drawings" ON storage.objects;

-- Revoke direct EXECUTE on SECURITY DEFINER trigger/handler functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_symbol_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_symbol_vote_counts() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_tag_upvotes() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_user_stats() FROM anon, authenticated, public;
