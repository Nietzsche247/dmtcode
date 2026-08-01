DROP POLICY IF EXISTS "System can manage scraper runs" ON public.scraper_runs;

CREATE POLICY "Service role manages scraper runs"
ON public.scraper_runs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);