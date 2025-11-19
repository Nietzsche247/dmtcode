-- Fix voting privacy: Users should only see their own votes
-- Drop the overly permissive SELECT policies
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.glyph_votes;
DROP POLICY IF EXISTS "Tag votes are viewable by everyone" ON public.tag_votes;

-- Create restricted SELECT policies that only show user's own votes
CREATE POLICY "Users can view their own votes"
ON public.glyph_votes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own tag votes"
ON public.tag_votes
FOR SELECT
USING (auth.uid() = user_id);