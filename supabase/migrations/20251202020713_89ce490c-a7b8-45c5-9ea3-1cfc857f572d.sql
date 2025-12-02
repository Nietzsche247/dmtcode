-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT NOT NULL,
  manufacturer_url TEXT,
  specs JSONB DEFAULT '{}'::jsonb,
  category TEXT NOT NULL CHECK (category IN ('tool', 'woo', 'laser', 'retreat')),
  wavelength TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_affiliate BOOLEAN NOT NULL DEFAULT false,
  affiliate_url TEXT,
  submitted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Approved products are viewable by everyone"
ON public.products FOR SELECT
USING (is_approved = true OR auth.uid() = submitted_by);

CREATE POLICY "Authenticated users can submit products"
ON public.products FOR INSERT
WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Admins can update any product"
ON public.products FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own unapproved products"
ON public.products FOR UPDATE
USING (auth.uid() = submitted_by AND is_approved = false)
WITH CHECK (auth.uid() = submitted_by AND is_approved = false);

CREATE POLICY "Admins can delete any product"
ON public.products FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create product_ratings table (4 categories like retreats)
CREATE TABLE public.product_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  quality_rating INTEGER NOT NULL CHECK (quality_rating >= 1 AND quality_rating <= 5),
  accuracy_rating INTEGER NOT NULL CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  value_rating INTEGER NOT NULL CHECK (value_rating >= 1 AND value_rating <= 5),
  research_rating INTEGER NOT NULL CHECK (research_rating >= 1 AND research_rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- Enable RLS for ratings
ALTER TABLE public.product_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product ratings are viewable by everyone"
ON public.product_ratings FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can rate products"
ON public.product_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
ON public.product_ratings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
ON public.product_ratings FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_ratings_updated_at
BEFORE UPDATE ON public.product_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed validated products
INSERT INTO public.products (title, description, price, image_url, manufacturer_url, category, wavelength, specs, is_approved, is_affiliate, affiliate_url) VALUES
(
  'MitoMAT Red Light Therapy Yoga Mat',
  'Full-body 660nm red light therapy mat for recovery and research. Clinical-grade LEDs covering 1200cm² surface area. Documented benefits in Davis 2021 photobiomodulation studies. Combines with 650nm laser protocol for dual-wavelength research.',
  1299.00,
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
  'https://mitored.com/products/mat',
  'tool',
  '660nm',
  '{"power": "180W", "leds": "240 diodes", "wavelength": "660nm ± 10nm", "coverage": "72x24 inches", "timer": "20 min auto-shutoff"}'::jsonb,
  true,
  true,
  'https://mitored.com/products/mat?ref=dmtcode'
),
(
  'Bon Charge Max Red Light Device',
  'Portable 660nm + 850nm dual-wavelength panel. Validated photobiomodulation device for cellular recovery (Hamblin 2016). 120 LEDs in compact form factor. Pairs with 650nm coherent light exposure for research protocols.',
  799.00,
  'https://images.unsplash.com/photo-1512879473965-c3d6e46f2065?w=800',
  'https://boncharge.com/products/red-light',
  'tool',
  '660nm + 850nm',
  '{"power": "60W", "leds": "120 diodes", "wavelengths": "660nm + 850nm", "irradiance": "100 mW/cm²", "coverage": "12x8 inches"}'::jsonb,
  true,
  true,
  'https://boncharge.com/products/red-light?ref=dmtcode'
),
(
  'Peyote Way Church of God Spirit Walk',
  'Legal 3-day peyote ceremony in Aravaipa wilderness (Willcox, AZ). Non-Native welcome. Blends Huichol roots with modern integration. Documented experiences tie to Strassman clinical frameworks and Goler laser protocol consciousness research.',
  2000.00,
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
  'https://peyoteway.org/',
  'retreat',
  NULL,
  '{"duration": "3 days", "location": "Willcox, AZ", "capacity": "12 participants", "includes": "lodging, meals, ceremony, integration"}'::jsonb,
  true,
  true,
  'https://peyoteway.org/spirit-walks?utm_source=tools_journey&utm_medium=affiliate&utm_campaign=dmtcode'
);