-- Create api_access_log table for tracking API usage
CREATE TABLE IF NOT EXISTS public.api_access_log (
  id SERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL,
  format TEXT,
  filters JSONB,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_access_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (from edge functions)
CREATE POLICY "Service role can insert logs"
ON public.api_access_log
FOR INSERT
WITH CHECK (true);

-- Admins can view logs
CREATE POLICY "Admins can view logs"
ON public.api_access_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));