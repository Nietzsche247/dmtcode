-- Create assessments table for clinical replicator flows
CREATE TABLE public.assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  log_id uuid REFERENCES public.voice_logs(id) ON DELETE CASCADE,
  phq9_score integer CHECK (phq9_score >= 0 AND phq9_score <= 27),
  gad7_score integer CHECK (gad7_score >= 0 AND gad7_score <= 21),
  meq4_score integer,
  ceq7_score integer,
  context_jsonb jsonb DEFAULT '{}'::jsonb,
  mood_pre integer CHECK (mood_pre >= 0 AND mood_pre <= 10),
  mood_post integer CHECK (mood_post >= 0 AND mood_post <= 10),
  brain_scan_url text,
  share_token uuid DEFAULT gen_random_uuid(),
  is_shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add assessment_id to voice_logs
ALTER TABLE public.voice_logs ADD COLUMN IF NOT EXISTS assessment_id uuid REFERENCES public.assessments(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_assessments_user_id ON public.assessments(user_id);
CREATE INDEX idx_assessments_log_id ON public.assessments(log_id);
CREATE INDEX idx_assessments_share_token ON public.assessments(share_token);
CREATE INDEX idx_voice_logs_assessment_id ON public.voice_logs(assessment_id);

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can create assessments (anonymous contributions allowed)
CREATE POLICY "Anyone can create assessments"
ON public.assessments FOR INSERT
WITH CHECK (true);

-- Users can view their own assessments
CREATE POLICY "Users can view own assessments"
ON public.assessments FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own assessments
CREATE POLICY "Users can update own assessments"
ON public.assessments FOR UPDATE
USING (auth.uid() = user_id);

-- Shared assessments viewable by token (de-identified)
CREATE POLICY "Shared assessments viewable by token"
ON public.assessments FOR SELECT
USING (is_shared = true);

-- Admins have full access
CREATE POLICY "Admins can manage all assessments"
ON public.assessments FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for brain scans
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assessments', 'assessments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for brain scans
CREATE POLICY "Users can upload own scans"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assessments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own scans"
ON storage.objects FOR SELECT
USING (bucket_id = 'assessments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger to update updated_at
CREATE TRIGGER update_assessments_updated_at
BEFORE UPDATE ON public.assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();