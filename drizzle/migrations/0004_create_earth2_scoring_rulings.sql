CREATE TABLE public.earth2_scoring_rulings (
  call_id text PRIMARY KEY,
  question text NOT NULL,
  pick text NOT NULL CHECK (pick IN ('yes','no')),
  answer text NOT NULL CHECK (answer IN ('yes','no')),
  answered_by uuid NOT NULL DEFAULT auth.uid(),
  answered_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.earth2_scoring_rulings TO authenticated;
GRANT ALL ON public.earth2_scoring_rulings TO service_role;
ALTER TABLE public.earth2_scoring_rulings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins select earth2 rulings" ON public.earth2_scoring_rulings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert earth2 rulings" ON public.earth2_scoring_rulings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update earth2 rulings" ON public.earth2_scoring_rulings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));