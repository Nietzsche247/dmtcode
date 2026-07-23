
-- 1. bundles table
CREATE TABLE public.bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  kind text NOT NULL CHECK (kind IN ('kit','group')),
  tier text NOT NULL CHECK (tier IN ('good','better','best','complete')),
  people int NOT NULL DEFAULT 1,
  price_cents int NOT NULL,
  parts_sum_cents int NOT NULL,
  markup_pct numeric,
  wave int NOT NULL,
  ships_status text NOT NULL CHECK (ships_status IN ('now','preorder')),
  is_best boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bundles TO anon, authenticated;
GRANT ALL ON public.bundles TO service_role;

ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bundles are publicly readable"
  ON public.bundles FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert bundles"
  ON public.bundles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bundles"
  ON public.bundles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bundles"
  ON public.bundles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER bundles_updated_at
  BEFORE UPDATE ON public.bundles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. bundle_items table
CREATE TABLE public.bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  component_name text NOT NULL,
  retail_cents int NOT NULL DEFAULT 0,
  qty int NOT NULL DEFAULT 1,
  is_shared boolean NOT NULL DEFAULT false,
  is_digital boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bundle_items TO anon, authenticated;
GRANT ALL ON public.bundle_items TO service_role;

ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bundle items are publicly readable"
  ON public.bundle_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert bundle items"
  ON public.bundle_items FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bundle items"
  ON public.bundle_items FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bundle items"
  ON public.bundle_items FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_bundle_items_bundle_id ON public.bundle_items(bundle_id);

-- 3. Seed data
-- K1 Observer
WITH k1 AS (
  INSERT INTO public.bundles (slug, name, kind, tier, people, price_cents, parts_sum_cents, markup_pct, wave, ships_status, is_best, sort_order)
  VALUES ('k1-observer','Observer','kit','good',1,10900,8800,24,1,'now',false,1)
  RETURNING id
)
INSERT INTO public.bundle_items (bundle_id, component_name, retail_cents, qty, is_shared, is_digital, sort_order)
SELECT k1.id, v.name, v.cents, 1, false, v.digital, v.sort FROM k1, (VALUES
  ('Field Guide', 0, true, 1),
  ('Observation Journal 130pp', 2900, false, 2),
  ('Screening & Preparation Card', 900, false, 3),
  ('Reference Chart', 1600, false, 4),
  ('Reflection Workbook', 3400, false, 5)
) AS v(name, cents, digital, sort);

-- K2 Practitioner (K1 + 2)
WITH k2 AS (
  INSERT INTO public.bundles (slug, name, kind, tier, people, price_cents, parts_sum_cents, markup_pct, wave, ships_status, is_best, sort_order)
  VALUES ('k2-practitioner','Practitioner','kit','better',1,15900,12000,33,1,'now',false,2)
  RETURNING id
)
INSERT INTO public.bundle_items (bundle_id, component_name, retail_cents, qty, is_shared, is_digital, sort_order)
SELECT k2.id, v.name, v.cents, 1, false, v.digital, v.sort FROM k2, (VALUES
  ('Field Guide', 0, true, 1),
  ('Observation Journal 130pp', 2900, false, 2),
  ('Screening & Preparation Card', 900, false, 3),
  ('Reference Chart', 1600, false, 4),
  ('Reflection Workbook', 3400, false, 5),
  ('Integration Prompt Deck', 2800, false, 6),
  ('Music Referral Card', 400, false, 7)
) AS v(name, cents, digital, sort);

-- K3 Instrument (K2 + 4)
WITH k3 AS (
  INSERT INTO public.bundles (slug, name, tagline, kind, tier, people, price_cents, parts_sum_cents, markup_pct, wave, ships_status, is_best, sort_order)
  VALUES ('k3-instrument','Instrument','The instrument tier — the optical-geometry thesis','kit','best',1,24900,20400,22,2,'preorder',true,3)
  RETURNING id
)
INSERT INTO public.bundle_items (bundle_id, component_name, retail_cents, qty, is_shared, is_digital, sort_order)
SELECT k3.id, v.name, v.cents, 1, false, v.digital, v.sort FROM k3, (VALUES
  ('Field Guide', 0, true, 1),
  ('Observation Journal 130pp', 2900, false, 2),
  ('Screening & Preparation Card', 900, false, 3),
  ('Reference Chart', 1600, false, 4),
  ('Reflection Workbook', 3400, false, 5),
  ('Integration Prompt Deck', 2800, false, 6),
  ('Music Referral Card', 400, false, 7),
  ('650nm Optical Module', 2800, false, 8),
  ('Diffraction Grating Set', 2200, false, 9),
  ('Safety Eyewear OD2+', 1800, false, 10),
  ('Geometry Capture Supplies', 1600, false, 11)
) AS v(name, cents, digital, sort);

-- K4 Complete (K3 + 5)
WITH k4 AS (
  INSERT INTO public.bundles (slug, name, kind, tier, people, price_cents, parts_sum_cents, markup_pct, wave, ships_status, is_best, sort_order)
  VALUES ('k4-complete','Complete','kit','complete',1,34900,29000,20,3,'preorder',false,4)
  RETURNING id
)
INSERT INTO public.bundle_items (bundle_id, component_name, retail_cents, qty, is_shared, is_digital, sort_order)
SELECT k4.id, v.name, v.cents, 1, false, v.digital, v.sort FROM k4, (VALUES
  ('Field Guide', 0, true, 1),
  ('Observation Journal 130pp', 2900, false, 2),
  ('Screening & Preparation Card', 900, false, 3),
  ('Reference Chart', 1600, false, 4),
  ('Reflection Workbook', 3400, false, 5),
  ('Integration Prompt Deck', 2800, false, 6),
  ('Music Referral Card', 400, false, 7),
  ('650nm Optical Module', 2800, false, 8),
  ('Diffraction Grating Set', 2200, false, 9),
  ('Safety Eyewear OD2+', 1800, false, 10),
  ('Geometry Capture Supplies', 1600, false, 11),
  ('Contoured Weighted Mask', 2400, false, 12),
  ('Non-Metal Bottle', 2200, false, 13),
  ('Grounding Object', 1200, false, 14),
  ('Containment Bowl + Liners', 1800, false, 15),
  ('Coil-bound journal upgrade', 1000, false, 16)
) AS v(name, cents, digital, sort);

-- B2 Pair (people=2)
WITH b2 AS (
  INSERT INTO public.bundles (slug, name, kind, tier, people, price_cents, parts_sum_cents, markup_pct, wave, ships_status, is_best, sort_order)
  VALUES ('b2-pair','Pair','group','good',2,41900,31000,35,2,'preorder',false,5)
  RETURNING id
)
INSERT INTO public.bundle_items (bundle_id, component_name, retail_cents, qty, is_shared, is_digital, sort_order)
SELECT b2.id, v.name, v.cents, v.qty, v.shared, false, v.sort FROM b2, (VALUES
  ('Observation Journal 130pp', 2900, 2, false, 1),
  ('Screening & Preparation Card', 900, 2, false, 2),
  ('Reflection Workbook', 3400, 2, false, 3),
  ('Safety Eyewear OD2+', 1800, 2, false, 4),
  ('Geometry Capture Supplies', 1600, 2, false, 5),
  ('Reference Chart', 1600, 1, true, 6),
  ('650nm Optical Module', 2800, 1, true, 7),
  ('Diffraction Grating Set', 2200, 1, true, 8),
  ('Integration Prompt Deck', 2800, 1, true, 9),
  ('Music Referral Card', 400, 1, true, 10)
) AS v(name, cents, qty, shared, sort);

-- B3 Triad (people=3, + facilitator guide + group agreements)
WITH b3 AS (
  INSERT INTO public.bundles (slug, name, kind, tier, people, price_cents, parts_sum_cents, markup_pct, wave, ships_status, is_best, sort_order)
  VALUES ('b3-triad','Triad','group','best',3,57900,44700,30,2,'preorder',true,6)
  RETURNING id
)
INSERT INTO public.bundle_items (bundle_id, component_name, retail_cents, qty, is_shared, is_digital, sort_order)
SELECT b3.id, v.name, v.cents, v.qty, v.shared, false, v.sort FROM b3, (VALUES
  ('Observation Journal 130pp', 2900, 3, false, 1),
  ('Screening & Preparation Card', 900, 3, false, 2),
  ('Reflection Workbook', 3400, 3, false, 3),
  ('Safety Eyewear OD2+', 1800, 3, false, 4),
  ('Geometry Capture Supplies', 1600, 3, false, 5),
  ('Reference Chart', 1600, 1, true, 6),
  ('650nm Optical Module', 2800, 1, true, 7),
  ('Diffraction Grating Set', 2200, 1, true, 8),
  ('Integration Prompt Deck', 2800, 1, true, 9),
  ('Music Referral Card', 400, 1, true, 10),
  ('Facilitator Guide', 2200, 1, true, 11),
  ('Group Agreements Card', 900, 1, true, 12)
) AS v(name, cents, qty, shared, sort);

-- B5 Circle (people=5, + facilitator + agreements + 2nd optical + 2nd grating)
WITH b5 AS (
  INSERT INTO public.bundles (slug, name, kind, tier, people, price_cents, parts_sum_cents, markup_pct, wave, ships_status, is_best, sort_order)
  VALUES ('b5-circle','Circle','group','complete',5,87900,70900,24,2,'preorder',false,7)
  RETURNING id
)
INSERT INTO public.bundle_items (bundle_id, component_name, retail_cents, qty, is_shared, is_digital, sort_order)
SELECT b5.id, v.name, v.cents, v.qty, v.shared, false, v.sort FROM b5, (VALUES
  ('Observation Journal 130pp', 2900, 5, false, 1),
  ('Screening & Preparation Card', 900, 5, false, 2),
  ('Reflection Workbook', 3400, 5, false, 3),
  ('Safety Eyewear OD2+', 1800, 5, false, 4),
  ('Geometry Capture Supplies', 1600, 5, false, 5),
  ('Reference Chart', 1600, 1, true, 6),
  ('650nm Optical Module', 2800, 1, true, 7),
  ('Diffraction Grating Set', 2200, 1, true, 8),
  ('Integration Prompt Deck', 2800, 1, true, 9),
  ('Music Referral Card', 400, 1, true, 10),
  ('Facilitator Guide', 2200, 1, true, 11),
  ('Group Agreements Card', 900, 1, true, 12),
  ('650nm Optical Module (2nd)', 2800, 1, true, 13),
  ('Diffraction Grating Set (2nd)', 2200, 1, true, 14)
) AS v(name, cents, qty, shared, sort);
