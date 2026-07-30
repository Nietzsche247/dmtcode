
ALTER TABLE public.symbol_submissions ALTER COLUMN user_id DROP NOT NULL;

GRANT SELECT, INSERT ON public.symbol_submissions TO anon;

CREATE POLICY "Anonymous visitors can submit symbols"
ON public.symbol_submissions
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

CREATE POLICY "Anonymous visitors can upload symbol drawings"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'symbol-drawings' AND (storage.foldername(name))[1] = 'anonymous');
