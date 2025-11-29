-- Add tags table for community tagging
CREATE TABLE IF NOT EXISTS public.symbol_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  glyph_id UUID NOT NULL REFERENCES public.registry_glyphs(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.symbol_tags ENABLE ROW LEVEL SECURITY;

-- Tags viewable by everyone
CREATE POLICY "Tags are viewable by everyone"
  ON public.symbol_tags FOR SELECT
  USING (true);

-- Authenticated users can add tags
CREATE POLICY "Authenticated users can add tags"
  ON public.symbol_tags FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can delete their own tags
CREATE POLICY "Users can delete their own tags"
  ON public.symbol_tags FOR DELETE
  USING (auth.uid() = user_id);

-- Create tag votes table
CREATE TABLE IF NOT EXISTS public.symbol_tag_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES public.symbol_tags(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tag_id, user_id)
);

-- Enable RLS
ALTER TABLE public.symbol_tag_votes ENABLE ROW LEVEL SECURITY;

-- Users can view their own votes
CREATE POLICY "Users can view their own tag votes"
  ON public.symbol_tag_votes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can vote on tags
CREATE POLICY "Users can vote on tags"
  ON public.symbol_tag_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their votes
CREATE POLICY "Users can remove their tag votes"
  ON public.symbol_tag_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update tag upvote count
CREATE OR REPLACE FUNCTION update_tag_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.symbol_tags
    SET upvotes = upvotes + 1
    WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.symbol_tags
    SET upvotes = upvotes - 1
    WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for tag upvotes
CREATE TRIGGER update_tag_upvotes_trigger
AFTER INSERT OR DELETE ON public.symbol_tag_votes
FOR EACH ROW
EXECUTE FUNCTION update_tag_upvotes();