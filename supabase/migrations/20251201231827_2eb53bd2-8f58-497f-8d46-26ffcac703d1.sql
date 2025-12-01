CREATE TABLE public.scraper_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scraper_name TEXT NOT NULL,
  last_run_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trials_found INTEGER DEFAULT 0,
  trials_added INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'running')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scraper_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scraper runs viewable by admins" ON public.scraper_runs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert scraper runs" ON public.scraper_runs FOR INSERT WITH CHECK (true);