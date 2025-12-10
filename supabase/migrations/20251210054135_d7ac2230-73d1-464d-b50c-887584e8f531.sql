-- Create falsification_criteria table
CREATE TABLE public.falsification_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  criterion TEXT NOT NULL,
  consequence TEXT NOT NULL,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'triggered', 'passed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market_disagreements table
CREATE TABLE public.market_disagreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  market_source TEXT NOT NULL,
  their_position TEXT NOT NULL,
  our_position TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forecast_changelog table
CREATE TABLE public.forecast_changelog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  previous_quarter TEXT,
  previous_year INTEGER,
  previous_probability INTEGER,
  new_quarter TEXT NOT NULL,
  new_year INTEGER NOT NULL,
  new_probability INTEGER,
  trigger_reason TEXT NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.falsification_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_disagreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_changelog ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Falsification criteria are viewable by everyone" 
ON public.falsification_criteria FOR SELECT USING (true);

CREATE POLICY "Market disagreements are viewable by everyone" 
ON public.market_disagreements FOR SELECT USING (true);

CREATE POLICY "Forecast changelog is viewable by everyone" 
ON public.forecast_changelog FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admins can manage falsification criteria" 
ON public.falsification_criteria FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage market disagreements" 
ON public.market_disagreements FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage forecast changelog" 
ON public.forecast_changelog FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));