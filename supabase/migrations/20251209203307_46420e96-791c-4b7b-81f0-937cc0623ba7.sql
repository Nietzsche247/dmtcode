-- Create table for Polymarket predictions
CREATE TABLE public.polymarket_predictions (
  id SERIAL PRIMARY KEY,
  forecast_event_name TEXT NOT NULL,
  question_title TEXT,
  question_url TEXT,
  probability NUMERIC(5,4),
  volume_usd NUMERIC(12,2),
  liquidity_usd NUMERIC(12,2),
  end_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.polymarket_predictions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read polymarket"
  ON public.polymarket_predictions
  FOR SELECT
  USING (true);

-- Insert sample Polymarket data for matching events
INSERT INTO public.polymarket_predictions (forecast_event_name, question_title, question_url, probability, volume_usd, end_date) VALUES
('AGI / Human-Level General Intelligence', 'Will AGI be achieved before 2030?', 'https://polymarket.com/event/agi-before-2030', 0.15, 6105.00, '2029-12-31'),
('China-Taiwan Military Conflict', 'Will China invade Taiwan before 2027?', 'https://polymarket.com/event/china-taiwan-2027', 0.08, 12450.00, '2026-12-31'),
('Quantum Computing Breaks RSA/ECC', 'Will a quantum computer break RSA-2048 before 2030?', 'https://polymarket.com/event/quantum-rsa-2030', 0.05, 3200.00, '2029-12-31'),
('First 1M Humanoid Robots Delivered', 'Will 1M humanoid robots be sold by 2030?', 'https://polymarket.com/event/humanoid-robots-2030', 0.22, 8900.00, '2029-12-31'),
('AI Achieves Human-Level Novel Reasoning', 'Will AI pass all human reasoning benchmarks by 2027?', 'https://polymarket.com/event/ai-reasoning-2027', 0.35, 15600.00, '2026-12-31');