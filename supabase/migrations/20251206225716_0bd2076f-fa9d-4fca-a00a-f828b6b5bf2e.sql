-- Add symbol_count and reputation_score columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS symbol_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reputation_score integer NOT NULL DEFAULT 0;

-- Update RLS policies for profiles table
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new policies
-- Users can read their full profile
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Public can read display_name and reputation_score only (via a view or selective query)
-- For now, allow public read of profiles (display_name, reputation visible)
CREATE POLICY "Public can view basic profile info"
ON public.profiles
FOR SELECT
TO anon
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for trigger)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);