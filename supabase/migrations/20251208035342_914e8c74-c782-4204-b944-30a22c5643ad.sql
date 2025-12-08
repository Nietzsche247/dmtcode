-- Create table for Metaculus comparisons
CREATE TABLE IF NOT EXISTS public.metaculus_comparisons (
    id SERIAL PRIMARY KEY,
    forecast_event_name TEXT NOT NULL UNIQUE,
    metaculus_question_id INTEGER NOT NULL,
    metaculus_title TEXT,
    metaculus_url TEXT,
    metaculus_median_date DATE,
    metaculus_25th_date DATE,
    metaculus_75th_date DATE,
    metaculus_forecasters INTEGER,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Enable public read
ALTER TABLE public.metaculus_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read metaculus" ON public.metaculus_comparisons FOR SELECT USING (true);