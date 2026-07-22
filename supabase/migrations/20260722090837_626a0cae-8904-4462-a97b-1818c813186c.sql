
-- 1. Add handle + avatar_seed to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS handle text,
  ADD COLUMN IF NOT EXISTS avatar_seed text;

-- 2. Handle generator function (two random words + short suffix for uniqueness)
CREATE OR REPLACE FUNCTION public.generate_handle()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  adjectives text[] := ARRAY[
    'Silver','Amber','Violet','Quiet','Hidden','Woven','Crimson','Golden','Distant','Radiant',
    'Fractal','Ember','Lucid','Prism','Halcyon','Verdant','Cobalt','Coral','Ivory','Nebula',
    'Solar','Lunar','Aurora','Copper','Slate','Onyx','Opal','Cinder','Frost','Mica'
  ];
  nouns text[] := ARRAY[
    'Fern','Kite','Sparrow','Loom','Beacon','Cipher','Meadow','Reef','Cairn','Lantern',
    'Sable','Willow','Comet','Ember','Grove','Petal','Prism','Delta','Vellum','Origami',
    'Falcon','Marble','Terrace','Compass','Harbor','Feather','Orchid','Basin','Anchor','Signal'
  ];
  base text;
  candidate text;
  i int := 0;
BEGIN
  LOOP
    base := adjectives[1 + floor(random()*array_length(adjectives,1))::int]
         || '-' ||
         nouns[1 + floor(random()*array_length(nouns,1))::int];
    candidate := base;
    IF i > 0 THEN
      candidate := base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 4);
    END IF;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE handle = candidate);
    i := i + 1;
    IF i > 8 THEN
      candidate := base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
      EXIT;
    END IF;
  END LOOP;
  RETURN candidate;
END;
$$;

-- 3. Backfill missing handles / seeds on existing rows
UPDATE public.profiles
SET handle = public.generate_handle()
WHERE handle IS NULL;

UPDATE public.profiles
SET avatar_seed = substr(md5(id::text || random()::text), 1, 16)
WHERE avatar_seed IS NULL;

-- 4. Now enforce uniqueness / not-null
ALTER TABLE public.profiles
  ALTER COLUMN handle SET NOT NULL,
  ALTER COLUMN avatar_seed SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_handle_key ON public.profiles(handle);

-- 5. Update handle_new_user to auto-assign avatar identity (never expose real name)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_handle text;
BEGIN
  new_handle := public.generate_handle();
  INSERT INTO public.profiles (id, display_name, handle, avatar_seed)
  VALUES (
    new.id,
    new_handle,
    new_handle,
    substr(md5(new.id::text || clock_timestamp()::text || random()::text), 1, 16)
  );
  RETURN new;
END;
$$;

-- 6. Volunteers table
CREATE TABLE IF NOT EXISTS public.volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text,
  email text NOT NULL,
  roles text[] NOT NULL,
  experience_level text,
  languages text[],
  skills text,
  why text,
  consent_contact boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteers TO authenticated;
GRANT ALL ON public.volunteers TO service_role;

ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

-- Signed-in users can insert their own row
CREATE POLICY "Users insert own volunteer row"
  ON public.volunteers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own submission
CREATE POLICY "Users read own volunteer row"
  ON public.volunteers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins / moderators can read all
CREATE POLICY "Admins read all volunteers"
  ON public.volunteers
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Admins / moderators can update / delete
CREATE POLICY "Admins manage volunteers"
  ON public.volunteers
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins delete volunteers"
  ON public.volunteers
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER volunteers_updated_at
  BEFORE UPDATE ON public.volunteers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
