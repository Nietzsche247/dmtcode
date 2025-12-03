-- Create trial watchlist table for "Notify Me" functionality
CREATE TABLE public.trial_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_id UUID NOT NULL REFERENCES public.clinical_trials(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email, trial_id)
);

-- Enable RLS
ALTER TABLE public.trial_watchlist ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe to trial notifications
CREATE POLICY "Anyone can subscribe to trial notifications"
ON public.trial_watchlist
FOR INSERT
WITH CHECK (true);

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.trial_watchlist
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
ON public.trial_watchlist
FOR DELETE
USING (auth.uid() = user_id);

-- Add admin email column to scraper_runs for email notifications
ALTER TABLE public.scraper_runs 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS new_trials_count INTEGER DEFAULT 0;

-- Allow system to update scraper_runs
DROP POLICY IF EXISTS "System can insert scraper runs" ON public.scraper_runs;
CREATE POLICY "System can manage scraper runs"
ON public.scraper_runs
FOR ALL
WITH CHECK (true);