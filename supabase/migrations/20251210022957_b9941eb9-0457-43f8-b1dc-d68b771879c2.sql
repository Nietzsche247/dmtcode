-- Create unified market_predictions table
CREATE TABLE IF NOT EXISTS public.market_predictions (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('polymarket', 'metaculus')),
  source_url TEXT,
  question_title TEXT,
  mapped_event_name TEXT NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('binary', 'date')),
  probability NUMERIC,
  median_date DATE,
  percentile_25 DATE,
  percentile_75 DATE,
  forecaster_count INTEGER,
  volume_usd NUMERIC,
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_predictions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read market_predictions" ON public.market_predictions
  FOR SELECT USING (true);

-- Seed with existing data from both tables
INSERT INTO public.market_predictions (source, source_url, question_title, mapped_event_name, prediction_type, probability, median_date, percentile_25, percentile_75, forecaster_count, volume_usd, last_scraped)
SELECT 
  'metaculus',
  metaculus_url,
  metaculus_title,
  forecast_event_name,
  'date',
  NULL,
  metaculus_median_date,
  metaculus_25th_date,
  metaculus_75th_date,
  metaculus_forecasters,
  NULL,
  last_updated
FROM public.metaculus_comparisons;

INSERT INTO public.market_predictions (source, source_url, question_title, mapped_event_name, prediction_type, probability, median_date, percentile_25, percentile_75, forecaster_count, volume_usd, last_scraped)
SELECT 
  'polymarket',
  question_url,
  question_title,
  forecast_event_name,
  'binary',
  probability,
  end_date,
  NULL,
  NULL,
  NULL,
  volume_usd,
  last_updated
FROM public.polymarket_predictions;