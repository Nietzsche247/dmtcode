-- Same silent-failure class as symbol_submissions: the admin moderation screen
-- writes is_unique on rows it does not own, and the only UPDATE policy is
-- ownership, so the write affected zero rows and raised no error.
-- The sealed-content trigger still applies; is_unique is excluded from the seal hash.
CREATE POLICY "Admins can update any registry glyph"
ON public.registry_glyphs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));