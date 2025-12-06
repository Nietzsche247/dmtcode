-- Create vote_type enum
CREATE TYPE public.symbol_vote_type AS ENUM ('upvote', 'downvote', 'seen_it');

-- Create symbol_votes table
CREATE TABLE public.symbol_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol_id UUID NOT NULL REFERENCES public.symbol_submissions(id) ON DELETE CASCADE,
  vote_type symbol_vote_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Unique constraint: one vote per type per user per symbol
  UNIQUE (user_id, symbol_id, vote_type)
);

-- Create index for faster lookups
CREATE INDEX idx_symbol_votes_symbol_id ON public.symbol_votes(symbol_id);
CREATE INDEX idx_symbol_votes_user_id ON public.symbol_votes(user_id);

-- Enable RLS
ALTER TABLE public.symbol_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all votes"
ON public.symbol_votes
FOR SELECT
USING (true);

CREATE POLICY "Users can insert own votes"
ON public.symbol_votes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM public.symbol_submissions 
    WHERE id = symbol_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own votes"
ON public.symbol_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Function to update vote counts on symbol_submissions
CREATE OR REPLACE FUNCTION public.update_symbol_vote_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE public.symbol_submissions 
      SET upvotes = upvotes + 1 
      WHERE id = NEW.symbol_id;
      
      -- Update submitter reputation +1
      UPDATE public.profiles 
      SET reputation_score = reputation_score + 1 
      WHERE id = (SELECT user_id FROM public.symbol_submissions WHERE id = NEW.symbol_id);
    ELSIF NEW.vote_type = 'downvote' THEN
      UPDATE public.symbol_submissions 
      SET downvotes = downvotes + 1 
      WHERE id = NEW.symbol_id;
      
      -- Update submitter reputation -1
      UPDATE public.profiles 
      SET reputation_score = GREATEST(0, reputation_score - 1) 
      WHERE id = (SELECT user_id FROM public.symbol_submissions WHERE id = NEW.symbol_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE public.symbol_submissions 
      SET upvotes = GREATEST(0, upvotes - 1) 
      WHERE id = OLD.symbol_id;
      
      -- Revert submitter reputation
      UPDATE public.profiles 
      SET reputation_score = GREATEST(0, reputation_score - 1) 
      WHERE id = (SELECT user_id FROM public.symbol_submissions WHERE id = OLD.symbol_id);
    ELSIF OLD.vote_type = 'downvote' THEN
      UPDATE public.symbol_submissions 
      SET downvotes = GREATEST(0, downvotes - 1) 
      WHERE id = OLD.symbol_id;
      
      -- Revert submitter reputation
      UPDATE public.profiles 
      SET reputation_score = reputation_score + 1 
      WHERE id = (SELECT user_id FROM public.symbol_submissions WHERE id = OLD.symbol_id);
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger
CREATE TRIGGER on_symbol_vote_change
AFTER INSERT OR DELETE ON public.symbol_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_symbol_vote_counts();