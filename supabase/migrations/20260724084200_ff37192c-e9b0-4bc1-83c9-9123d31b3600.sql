ALTER TABLE public.events ADD COLUMN IF NOT EXISTS details text NULL;
ALTER TABLE public.retreats ADD COLUMN IF NOT EXISTS details text NULL;