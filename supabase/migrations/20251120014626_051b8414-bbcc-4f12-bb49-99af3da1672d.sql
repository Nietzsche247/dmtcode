-- Fix 1: Restrict theory_votes SELECT to users' own votes (privacy fix)
DROP POLICY IF EXISTS "Theory votes are viewable by everyone" ON public.theory_votes;

CREATE POLICY "Users can view their own theory votes"
ON public.theory_votes
FOR SELECT
USING (auth.uid() = user_id);

-- Fix 2: Fix overly permissive storage policies for glyphs bucket
DROP POLICY IF EXISTS "Users can update their own glyph images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own glyph images" ON storage.objects;

CREATE POLICY "Users can update their own glyph images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'glyphs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own glyph images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'glyphs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix 3: Implement role-based access control system for theory moderation
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles table
CREATE POLICY "User roles are viewable by everyone"
ON public.user_roles
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix 4: Update theories UPDATE policy to prevent users from self-approving
DROP POLICY IF EXISTS "Users can update their own theories" ON public.theories;

-- Users can only update content fields of their own unapproved theories
CREATE POLICY "Users can update their own unapproved theories"
ON public.theories
FOR UPDATE
USING (auth.uid() = user_id AND is_approved = false)
WITH CHECK (
  auth.uid() = user_id 
  AND is_approved = false
  -- Prevent updating is_approved field via this policy
);

-- Admins and moderators can approve theories
CREATE POLICY "Admins can update any theory"
ON public.theories
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Fix 5: Add DELETE policies for content management
CREATE POLICY "Users can delete their own unapproved theories"
ON public.theories
FOR DELETE
USING (auth.uid() = user_id AND is_approved = false);

CREATE POLICY "Admins can delete any theory"
ON public.theories
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete tags on their own glyphs"
ON public.surface_tags
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.glyphs 
    WHERE glyphs.id = surface_tags.glyph_id 
    AND glyphs.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete any tag"
ON public.surface_tags
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));