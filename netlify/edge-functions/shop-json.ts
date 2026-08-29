import type { Config } from "@netlify/edge-functions";
import { KITS } from "../lib/kits.ts";

const SITE = "https://dmtcode.com";
const LICENSE = "CC-BY-4.0";

export default async () => {
  const out = {
    license: LICENSE,
    license_url: "https://creativecommons.org/licenses/by/4.0/",
    source: `${SITE}/prepare`,
    generated_at: new Date().toISOString(),
    seller: "Meridian Optics Lab",
    support_email: "info@dmtcode.com",
    bundles: KITS.map((kit) => ({
      slug: kit.id,
      name: kit.shortName,
      full_name: kit.name,
      observers: kit.observers,
      price_usd: kit.priceNumber,
      diy_parts_usd: kit.diyCostNumber,
      emitters: kit.emitters,
      laser_class_note: "Per emitter vendor ratings. A multi emitter kit has no single class; read emitters[].",
      // The full bill of materials. qty is the number of vendor units, so a
      // pack counts as 1 and the pack size is stated in note.
      contents: kit.contents,
      availability: kit.availability,
      cart_url: kit.cart,
      image: kit.image,
      url: `${SITE}/prepare#${kit.id}`,
      product_url: `${SITE}/products/${kit.handle}`,
    })),
  };

  return new Response(JSON.stringify(out, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "netlify-cdn-cache-control":
        "public, s-maxage=3600, stale-while-revalidate=86400, durable",
      "access-control-allow-origin": "*",
    },
  });
};

export const config: Config = { path: "/shop.json" };
