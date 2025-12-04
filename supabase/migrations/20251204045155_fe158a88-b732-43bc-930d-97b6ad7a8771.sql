-- Create store_products table for inventory tracking
CREATE TABLE IF NOT EXISTS public.store_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  handle TEXT,
  price DECIMAL(10,2),
  compare_at_price DECIMAL(10,2),
  inventory_quantity INTEGER DEFAULT 0,
  sold_out BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on store_products
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

-- Public read policy for store_products (inventory is public info)
CREATE POLICY "Store products are viewable by everyone"
  ON public.store_products
  FOR SELECT
  USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_store_products_updated_at
  BEFORE UPDATE ON public.store_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_store_products_shopify_id ON public.store_products(shopify_id);
CREATE INDEX idx_store_products_sold_out ON public.store_products(sold_out);