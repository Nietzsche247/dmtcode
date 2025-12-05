-- Create protocols table for future-proof protocol hub
CREATE TABLE public.protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  compound TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'coming_soon' CHECK (status IN ('research', 'clinical', 'coming_soon')),
  tagline TEXT,
  hero_image TEXT,
  content_jsonb JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;

-- Protocols are publicly readable
CREATE POLICY "Protocols are viewable by everyone" 
ON public.protocols 
FOR SELECT 
USING (is_published = true);

-- Only admins can manage protocols
CREATE POLICY "Admins can manage protocols" 
ON public.protocols 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create voice_logs table for voice logger MVP
CREATE TABLE public.voice_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  protocol_id UUID REFERENCES public.protocols(id) ON DELETE SET NULL,
  audio_url TEXT,
  transcript TEXT,
  duration_seconds INTEGER,
  analysis_jsonb JSONB DEFAULT '{}'::jsonb,
  archetype_matches JSONB DEFAULT '[]'::jsonb,
  protocol_match_score INTEGER,
  integration_prompts JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  is_analyzed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can create voice logs
CREATE POLICY "Anyone can create voice logs" 
ON public.voice_logs 
FOR INSERT 
WITH CHECK (true);

-- Users can view their own logs or public logs
CREATE POLICY "Users can view own voice logs" 
ON public.voice_logs 
FOR SELECT 
USING ((auth.uid() = user_id) OR (user_id IS NULL));

-- Users can update their own logs
CREATE POLICY "Users can update own voice logs" 
ON public.voice_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add protocol_id to registry_glyphs for protocol tagging
ALTER TABLE public.registry_glyphs 
ADD COLUMN protocol_id UUID REFERENCES public.protocols(id) ON DELETE SET NULL;

-- Create trigger for updated_at on protocols
CREATE TRIGGER update_protocols_updated_at
BEFORE UPDATE ON public.protocols
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on voice_logs
CREATE TRIGGER update_voice_logs_updated_at
BEFORE UPDATE ON public.voice_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial protocols (placeholders)
INSERT INTO public.protocols (slug, title, compound, status, tagline, is_published, content_jsonb) VALUES
('ketamine', 'Ketamine-Assisted Therapy', 'Ketamine', 'clinical', 'FDA-approved dissociative for treatment-resistant depression', true, '{
  "overview": {
    "indications": ["Treatment-resistant depression", "Suicidal ideation", "Chronic pain", "PTSD"],
    "evidence_level": "High - FDA approved (esketamine/Spravato)",
    "mechanism": "NMDA receptor antagonist, promotes neuroplasticity"
  },
  "preparation": {
    "set_setting": "Clinical setting recommended, comfortable reclining position, eyeshades optional",
    "screening": ["Cardiovascular assessment", "Psychiatric history", "Substance use history", "Blood pressure monitoring"]
  },
  "dosing": [
    {"route": "IV Infusion", "dose": "0.5 mg/kg", "duration": "40 min", "sessions": "6 over 2-3 weeks"},
    {"route": "Intramuscular", "dose": "0.5-1 mg/kg", "duration": "45-60 min", "sessions": "Variable"},
    {"route": "Intranasal (Spravato)", "dose": "56-84 mg", "duration": "2 hours observation", "sessions": "Twice weekly initially"}
  ],
  "integration": {
    "framework": "Voice logging during and after sessions captures emergence of insights",
    "prompts": ["What did you notice?", "Any recurring themes?", "Body sensations?", "Visual phenomena?"]
  },
  "safety": {
    "contraindications": ["Uncontrolled hypertension", "Active psychosis", "Pregnancy"],
    "side_effects": ["Dissociation", "Nausea", "Elevated BP", "Perceptual changes"],
    "monitoring": "Blood pressure every 15 min during infusion"
  },
  "citations": [
    {"title": "Ketamine for Treatment-Resistant Depression", "doi": "10.1176/appi.ajp.2017.17040472", "year": 2018},
    {"title": "Rapid antidepressant effects of ketamine", "doi": "10.1016/j.biopsych.2015.12.005", "year": 2016}
  ]
}'::jsonb),
('psilocybin', 'Psilocybin-Assisted Therapy', 'Psilocybin', 'research', 'Classic psychedelic showing promise for depression and end-of-life anxiety', true, '{
  "overview": {
    "indications": ["Major depressive disorder", "Treatment-resistant depression", "End-of-life anxiety", "Addiction"],
    "evidence_level": "Moderate - Phase 2/3 trials ongoing, FDA Breakthrough Therapy designation",
    "mechanism": "5-HT2A receptor agonist, promotes neuroplasticity and emotional processing"
  },
  "preparation": {
    "set_setting": "Comfortable, aesthetically pleasing room with trained facilitators, music playlist, eyeshades",
    "screening": ["Personal/family history of psychosis", "Cardiovascular health", "Current medications (SSRIs)", "Psychological readiness assessment"]
  },
  "dosing": [
    {"route": "Oral (synthetic)", "dose": "25 mg", "duration": "4-6 hours", "sessions": "1-2 with preparation/integration"},
    {"route": "Oral (synthetic)", "dose": "10 mg", "duration": "4-6 hours", "sessions": "Low dose comparator in trials"}
  ],
  "integration": {
    "framework": "Multiple integration sessions post-experience, voice logging captures insights for later processing",
    "prompts": ["What emerged during the experience?", "Any symbolic or visual content?", "Emotional breakthroughs?", "New perspectives on life challenges?"]
  },
  "safety": {
    "contraindications": ["Personal/family history of psychosis or schizophrenia", "Severe cardiovascular disease", "Pregnancy"],
    "side_effects": ["Anxiety", "Confusion", "Nausea", "Headache", "Elevated heart rate"],
    "monitoring": "Continuous facilitator presence, vital signs pre/post"
  },
  "citations": [
    {"title": "Psilocybin with psychological support for treatment-resistant depression", "doi": "10.1016/S2215-0366(16)30065-7", "year": 2016},
    {"title": "Effects of Psilocybin-Assisted Therapy on Major Depressive Disorder", "doi": "10.1001/jamapsychiatry.2020.3285", "year": 2021}
  ]
}'::jsonb),
('mdma', 'MDMA-Assisted Therapy', 'MDMA', 'research', 'Entactogen for PTSD treatment, nearing FDA approval', false, '{}'::jsonb),
('5-meo-dmt', '5-MeO-DMT Therapy', '5-MeO-DMT', 'research', 'Powerful short-acting psychedelic for existential exploration', false, '{}'::jsonb),
('ibogaine', 'Ibogaine-Assisted Treatment', 'Ibogaine', 'research', 'Indole alkaloid used for addiction interruption', false, '{}'::jsonb),
('ayahuasca', 'Ayahuasca Ceremony', 'Ayahuasca', 'research', 'Traditional Amazonian brew containing DMT and MAOIs', false, '{}'::jsonb),
('lsd', 'LSD-Assisted Therapy', 'LSD', 'research', 'Classic psychedelic being revisited for anxiety and addiction', false, '{}'::jsonb),
('dmt-laser', 'DMT + 650nm Laser Protocol', 'N,N-DMT', 'research', 'The original Goler protocol for visual symbol documentation', true, '{
  "overview": {
    "indications": ["Research documentation", "Visual phenomenon cataloguing", "Consciousness exploration"],
    "evidence_level": "Pilot study - Goler 2025",
    "mechanism": "650nm coherent light exposure during DMT experiences elicits reproducible visual symbols"
  },
  "preparation": {
    "set_setting": "Dark or dim room, 650nm laser pointed at neutral surface (wall/ceiling), recording equipment ready",
    "screening": ["Standard DMT safety screening", "Visual documentation capability", "Voice recording setup"]
  },
  "dosing": [
    {"route": "Vaporized", "dose": "15-40 mg", "duration": "15-30 min", "sessions": "As needed for documentation"},
    {"route": "Intramuscular", "dose": "0.4-0.6 mg/kg", "duration": "30-45 min", "sessions": "Research setting only"}
  ],
  "integration": {
    "framework": "Immediate voice logging post-experience, glyph drawing within 5 minutes",
    "prompts": ["Describe any symbols seen on the laser surface", "Were they static or animated?", "Any sense of meaning or communication?"]
  },
  "safety": {
    "contraindications": ["Standard DMT contraindications", "Photosensitive conditions"],
    "side_effects": ["Standard DMT effects", "Potential visual persistence"],
    "monitoring": "Have sitter present, never look directly into laser"
  },
  "citations": [
    {"title": "Pilot study on 650nm laser protocol", "doi": "10.59973/ipil.158", "year": 2025},
    {"title": "Survey of DMT visual phenomena", "doi": "10.1002/hup.2806", "year": 2021}
  ]
}'::jsonb);