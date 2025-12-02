-- Update products table to support affiliate-only items
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS affiliate_only BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.products.affiliate_only IS 'True for pure-affiliate items that skip Shopify checkout and go to external URL';

-- Update existing Peyote Way retreat to be affiliate_only
UPDATE public.products 
SET affiliate_only = true 
WHERE title ILIKE '%Peyote Way%' OR title ILIKE '%Spirit Walk%';