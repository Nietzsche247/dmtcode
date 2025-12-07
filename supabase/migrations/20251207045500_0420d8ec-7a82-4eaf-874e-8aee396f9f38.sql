-- Add moderation tracking columns to symbol_submissions
ALTER TABLE public.symbol_submissions 
ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS moderated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create index for faster moderation queries
CREATE INDEX IF NOT EXISTS idx_symbol_submissions_status ON public.symbol_submissions(status);
CREATE INDEX IF NOT EXISTS idx_symbol_submissions_created_at ON public.symbol_submissions(created_at DESC);