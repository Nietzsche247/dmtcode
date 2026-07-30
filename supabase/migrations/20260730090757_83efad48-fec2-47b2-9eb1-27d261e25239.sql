DROP POLICY IF EXISTS "Anonymous visitors can submit symbols" ON public.symbol_submissions;
DROP POLICY IF EXISTS "Anonymous visitors can upload symbol drawings" ON storage.objects;
REVOKE INSERT ON public.symbol_submissions FROM anon;