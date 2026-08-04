-- Admins can read every submission regardless of owner, status or visibility.
CREATE POLICY "Admins can read all submissions"
ON public.symbol_submissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can moderate any submission. Without this, admin UPDATEs are filtered
-- by the owner-only policy and silently affect zero rows.
CREATE POLICY "Admins can update all submissions"
ON public.symbol_submissions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));