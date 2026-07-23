GRANT INSERT ON public.product_signups TO anon, authenticated;
GRANT SELECT ON public.product_signups TO authenticated;
GRANT ALL ON public.product_signups TO service_role;