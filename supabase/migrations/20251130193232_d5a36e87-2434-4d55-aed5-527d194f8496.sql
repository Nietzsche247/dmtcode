-- Add gamification tables for user stats, badges, and achievements

-- User statistics table
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  total_submissions INTEGER DEFAULT 0,
  total_validations INTEGER DEFAULT 0,
  total_tags_added INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  badges_earned TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  category TEXT NOT NULL,
  threshold INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User badges junction table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_name)
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stats
CREATE POLICY "User stats are viewable by everyone"
  ON public.user_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for badges
CREATE POLICY "Badges are viewable by everyone"
  ON public.badges FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage badges"
  ON public.badges FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_badges
CREATE POLICY "User badges are viewable by everyone"
  ON public.user_badges FOR SELECT
  USING (true);

CREATE POLICY "Users can view their earned badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert initial badges
INSERT INTO public.badges (name, description, icon, category, threshold) VALUES
('first_symbol', 'First Symbol: Submitted your first symbol', '🌟', 'submission', 1),
('contributor', 'Contributor: 5 symbols submitted', '📝', 'submission', 5),
('researcher', 'Researcher: 10 symbols submitted', '🔬', 'submission', 10),
('data_scientist', 'Data Scientist: 25 symbols submitted', '📊', 'submission', 25),
('archive_builder', 'Archive Builder: 50 symbols submitted', '🏛️', 'submission', 50),
('pattern_master', 'Pattern Master: 100 symbols submitted', '🎯', 'submission', 100),
('validator', 'Validator: 10 validations', '✅', 'validation', 10),
('expert_tagger', 'Expert Tagger: 25 validations', '🏷️', 'validation', 25),
('tag_master', 'Tag Master: 50 tags added', '🎨', 'tagging', 50),
('pattern_hunter', 'Pattern Hunter: Found 10 similar symbols', '🔍', 'discovery', 10),
('trailblazer', 'Trailblazer: First to submit unique symbol', '🚀', 'discovery', 1),
('precision', 'Precision: 90%+ accuracy on validations', '🎯', 'discovery', 1),
('methodologist', 'Methodologist: Tried all observation methods', '🧪', 'special', 1),
('colorist', 'Colorist: Submitted symbols with 5+ colors', '🌈', 'special', 5),
('curator', 'Curator: 100+ total contributions', '👑', 'special', 100)
ON CONFLICT (name) DO NOTHING;

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user stats
  INSERT INTO public.user_stats (user_id, session_id, total_submissions)
  VALUES (
    COALESCE(NEW.user_id, NEW.user_id),
    COALESCE((SELECT session_id FROM registry_glyphs WHERE user_id = NEW.user_id LIMIT 1), 'anon'),
    1
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_submissions = user_stats.total_submissions + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update stats on new submission
CREATE TRIGGER update_stats_on_submission
  AFTER INSERT ON public.registry_glyphs
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION update_user_stats();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_rank ON public.user_stats(rank);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_registry_glyphs_user_id ON public.registry_glyphs(user_id);