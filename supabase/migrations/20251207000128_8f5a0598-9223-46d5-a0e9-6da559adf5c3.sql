-- Create saved_symbols table for bookmarking
CREATE TABLE public.saved_symbols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol_id UUID NOT NULL REFERENCES public.symbol_submissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, symbol_id)
);

-- Enable RLS
ALTER TABLE public.saved_symbols ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved symbols
CREATE POLICY "Users can view own saved symbols"
ON public.saved_symbols
FOR SELECT
USING (auth.uid() = user_id);

-- Users can save symbols
CREATE POLICY "Users can save symbols"
ON public.saved_symbols
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unsave symbols
CREATE POLICY "Users can unsave symbols"
ON public.saved_symbols
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_saved_symbols_user_id ON public.saved_symbols(user_id);
CREATE INDEX idx_saved_symbols_symbol_id ON public.saved_symbols(symbol_id);