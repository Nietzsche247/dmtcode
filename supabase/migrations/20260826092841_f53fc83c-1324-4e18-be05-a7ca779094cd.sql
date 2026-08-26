GRANT SELECT ON public.door_taps TO authenticated;

CREATE POLICY "Admins can view door taps"
ON public.door_taps
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));