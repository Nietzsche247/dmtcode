-- 1. Volunteers: PII is admin-only again
DROP POLICY IF EXISTS "Admins read all volunteers" ON public.volunteers;
DROP POLICY IF EXISTS "Admins manage volunteers" ON public.volunteers;
DROP POLICY IF EXISTS "Admins delete volunteers" ON public.volunteers;

CREATE POLICY "Admins read all volunteers" ON public.volunteers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage volunteers" ON public.volunteers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete volunteers" ON public.volunteers
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Volunteer can read their own application
CREATE POLICY "Volunteers read own application" ON public.volunteers
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  );

ALTER TABLE public.volunteers
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS welcomed_at timestamptz;

-- 2. Moderators: review powers, never delete
CREATE POLICY "Moderators can read all submissions" ON public.symbol_submissions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can update submissions" ON public.symbol_submissions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can read article leads" ON public.article_leads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can update article leads" ON public.article_leads
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators read event leads" ON public.event_leads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can update events" ON public.events
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'moderator'::app_role));

-- 3. Audit trail readable/writable by moderators (append only, for reversal)
CREATE POLICY "Moderators can record their own audit events" ON public.audit_events
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'moderator'::app_role) AND actor_id = auth.uid());

CREATE POLICY "Moderators can read the audit trail" ON public.audit_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'::app_role));