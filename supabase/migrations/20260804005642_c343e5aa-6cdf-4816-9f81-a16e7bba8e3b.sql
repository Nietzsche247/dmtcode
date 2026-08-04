CREATE TABLE public.audit_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name text NOT NULL,
  actor_id uuid,
  actor_kind text NOT NULL DEFAULT 'admin',
  subject_type text NOT NULL,
  subject_id uuid,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_events IS
  'Durable audit trail for moderation decisions and automated classifier outcomes. Append-only: no UPDATE or DELETE policy exists by design.';
COMMENT ON COLUMN public.audit_events.properties IS
  'Event payload. For bibliography_triage_decision this carries triage_model, triage_confidence, phenomenological_element, triage_status and triage_reason.';

CREATE INDEX audit_events_name_created_idx ON public.audit_events (event_name, created_at DESC);
CREATE INDEX audit_events_subject_idx ON public.audit_events (subject_type, subject_id);

GRANT SELECT, INSERT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read the audit trail"
  ON public.audit_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can record their own audit events"
  ON public.audit_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND actor_id = auth.uid());

CREATE POLICY "Background jobs can record audit events"
  ON public.audit_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);