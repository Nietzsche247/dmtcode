-- Extend symbol_submissions table with metadata columns
ALTER TABLE public.symbol_submissions 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS source_method text CHECK (source_method IN ('laser_650nm', 'closed_eye', 'open_eye', 'other')),
ADD COLUMN IF NOT EXISTS surface_type text,
ADD COLUMN IF NOT EXISTS wavelength text,
ADD COLUMN IF NOT EXISTS dose_level text CHECK (dose_level IN ('threshold', 'low', 'medium', 'high', 'heroic')),
ADD COLUMN IF NOT EXISTS duration_seconds integer,
ADD COLUMN IF NOT EXISTS recurrence text CHECK (recurrence IN ('once', 'multiple', 'persistent')),
ADD COLUMN IF NOT EXISTS emotional_valence text CHECK (emotional_valence IN ('positive', 'neutral', 'negative', 'mixed'));

-- Add index for tag filtering
CREATE INDEX IF NOT EXISTS idx_symbol_submissions_tags ON public.symbol_submissions USING GIN (tags);

-- Add index for source method filtering  
CREATE INDEX IF NOT EXISTS idx_symbol_submissions_source ON public.symbol_submissions (source_method);