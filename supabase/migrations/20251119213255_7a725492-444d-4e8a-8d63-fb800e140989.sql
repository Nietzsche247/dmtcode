-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create glyphs table for user uploads
CREATE TABLE public.glyphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.glyphs ENABLE ROW LEVEL SECURITY;

-- Everyone can view glyphs
CREATE POLICY "Glyphs are viewable by everyone"
ON public.glyphs
FOR SELECT
USING (true);

-- Authenticated users can create glyphs
CREATE POLICY "Authenticated users can create glyphs"
ON public.glyphs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own glyphs
CREATE POLICY "Users can update their own glyphs"
ON public.glyphs
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own glyphs
CREATE POLICY "Users can delete their own glyphs"
ON public.glyphs
FOR DELETE
USING (auth.uid() = user_id);

-- Create glyph_votes table
CREATE TABLE public.glyph_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  glyph_id UUID NOT NULL REFERENCES public.glyphs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(glyph_id, user_id)
);

ALTER TABLE public.glyph_votes ENABLE ROW LEVEL SECURITY;

-- Everyone can view votes
CREATE POLICY "Votes are viewable by everyone"
ON public.glyph_votes
FOR SELECT
USING (true);

-- Authenticated users can vote
CREATE POLICY "Authenticated users can vote"
ON public.glyph_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their votes
CREATE POLICY "Users can remove their votes"
ON public.glyph_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Create surface_tags table
CREATE TABLE public.surface_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  glyph_id UUID NOT NULL REFERENCES public.glyphs(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.surface_tags ENABLE ROW LEVEL SECURITY;

-- Everyone can view tags
CREATE POLICY "Tags are viewable by everyone"
ON public.surface_tags
FOR SELECT
USING (true);

-- Authenticated users can create tags
CREATE POLICY "Authenticated users can create tags"
ON public.surface_tags
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create tag_votes table
CREATE TABLE public.tag_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES public.surface_tags(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tag_id, user_id)
);

ALTER TABLE public.tag_votes ENABLE ROW LEVEL SECURITY;

-- Everyone can view tag votes
CREATE POLICY "Tag votes are viewable by everyone"
ON public.tag_votes
FOR SELECT
USING (true);

-- Authenticated users can vote on tags
CREATE POLICY "Authenticated users can vote on tags"
ON public.tag_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their tag votes
CREATE POLICY "Users can remove their tag votes"
ON public.tag_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Create theories table for user submissions
CREATE TABLE public.theories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  probability_percentage INTEGER,
  upvotes INTEGER NOT NULL DEFAULT 0,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.theories ENABLE ROW LEVEL SECURITY;

-- Everyone can view approved theories
CREATE POLICY "Approved theories are viewable by everyone"
ON public.theories
FOR SELECT
USING (is_approved = true OR auth.uid() = user_id);

-- Authenticated users can submit theories
CREATE POLICY "Authenticated users can submit theories"
ON public.theories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own theories
CREATE POLICY "Users can update their own theories"
ON public.theories
FOR UPDATE
USING (auth.uid() = user_id);

-- Create theory_votes table
CREATE TABLE public.theory_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theory_id UUID NOT NULL REFERENCES public.theories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(theory_id, user_id)
);

ALTER TABLE public.theory_votes ENABLE ROW LEVEL SECURITY;

-- Everyone can view theory votes
CREATE POLICY "Theory votes are viewable by everyone"
ON public.theory_votes
FOR SELECT
USING (true);

-- Authenticated users can vote on theories
CREATE POLICY "Authenticated users can vote on theories"
ON public.theory_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their theory votes
CREATE POLICY "Users can remove their theory votes"
ON public.theory_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_glyphs_updated_at
BEFORE UPDATE ON public.glyphs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_theories_updated_at
BEFORE UPDATE ON public.theories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage bucket for glyphs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('glyphs', 'glyphs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for glyphs
CREATE POLICY "Glyph images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'glyphs');

CREATE POLICY "Authenticated users can upload glyphs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'glyphs' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own glyph images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'glyphs' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own glyph images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'glyphs' 
  AND auth.uid() IS NOT NULL
);