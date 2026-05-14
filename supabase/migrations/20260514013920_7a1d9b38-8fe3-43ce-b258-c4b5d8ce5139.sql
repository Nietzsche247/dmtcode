
-- Restrict symbol_submissions visibility: only approved are public; users can see their own
DROP POLICY IF EXISTS "Users can read all submissions" ON public.symbol_submissions;

CREATE POLICY "Users can read own submissions"
ON public.symbol_submissions
FOR SELECT
USING (auth.uid() = user_id);

-- Tighten registry_glyphs UPDATE: explicitly block NULL user_id rows from being updated
DROP POLICY IF EXISTS "Users can update their own registry glyphs" ON public.registry_glyphs;

CREATE POLICY "Users can update their own registry glyphs"
ON public.registry_glyphs
FOR UPDATE
USING (user_id IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);
