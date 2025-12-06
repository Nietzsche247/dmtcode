-- Create storage bucket for symbol drawings
INSERT INTO storage.buckets (id, name, public)
VALUES ('symbol-drawings', 'symbol-drawings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies: authenticated users can upload to own folder, public can read all
CREATE POLICY "Authenticated users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'symbol-drawings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'symbol-drawings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'symbol-drawings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view symbol drawings"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'symbol-drawings');

-- Create enum for submission status
CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected');

-- Create symbol_submissions table
CREATE TABLE public.symbol_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  status submission_status NOT NULL DEFAULT 'pending',
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.symbol_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert own submissions"
ON public.symbol_submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all submissions"
ON public.symbol_submissions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public can read approved submissions"
ON public.symbol_submissions
FOR SELECT
TO anon
USING (status = 'approved');

CREATE POLICY "Users can update own submissions"
ON public.symbol_submissions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own submissions"
ON public.symbol_submissions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_symbol_submissions_updated_at
BEFORE UPDATE ON public.symbol_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles symbol_count when a submission is approved
CREATE OR REPLACE FUNCTION public.update_symbol_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.profiles
    SET symbol_count = symbol_count + 1
    WHERE id = NEW.user_id;
  ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE public.profiles
    SET symbol_count = GREATEST(0, symbol_count - 1)
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_profile_symbol_count
AFTER INSERT OR UPDATE ON public.symbol_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_symbol_count();