-- Create registry_glyphs table for scientific glyph cataloguing
CREATE TABLE public.registry_glyphs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  image_data TEXT NOT NULL,
  source TEXT NOT NULL,
  route_of_administration TEXT,
  approximate_dose TEXT,
  perceived_surface TEXT,
  depth TEXT,
  motion TEXT,
  emotional_valence TEXT,
  communicative_intent TEXT,
  prior_exposure BOOLEAN,
  symmetry TEXT,
  motif_tags TEXT[],
  voice_note_url TEXT,
  free_text_notes TEXT,
  confirmation_count INTEGER NOT NULL DEFAULT 1,
  is_unique BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create registry_confirmations table for similarity voting
CREATE TABLE public.registry_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  glyph_id UUID NOT NULL REFERENCES public.registry_glyphs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  confirmation_type TEXT NOT NULL CHECK (confirmation_type IN ('exact', 'similar', 'not_match')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.registry_glyphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS policies for registry_glyphs
CREATE POLICY "Registry glyphs are viewable by everyone"
  ON public.registry_glyphs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit registry glyphs"
  ON public.registry_glyphs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own registry glyphs"
  ON public.registry_glyphs FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for registry_confirmations
CREATE POLICY "Confirmations are viewable by everyone"
  ON public.registry_confirmations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit confirmations"
  ON public.registry_confirmations FOR INSERT
  WITH CHECK (true);

-- Create updated_at trigger for registry_glyphs
CREATE TRIGGER update_registry_glyphs_updated_at
  BEFORE UPDATE ON public.registry_glyphs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_registry_glyphs_created_at ON public.registry_glyphs(created_at DESC);
CREATE INDEX idx_registry_glyphs_confirmation_count ON public.registry_glyphs(confirmation_count DESC);
CREATE INDEX idx_registry_confirmations_glyph_id ON public.registry_confirmations(glyph_id);
CREATE INDEX idx_registry_confirmations_session_id ON public.registry_confirmations(session_id);