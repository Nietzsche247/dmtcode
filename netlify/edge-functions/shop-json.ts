import type { Config } from "@netlify/edge-functions";

const SITE = "https://dmtcode.com";
const LICENSE = "CC-BY-4.0";
const SUPABASE_URL =
  Netlify.env.get("SUPABASE_URL") ?? Netlify.env.get("VITE_SUPABASE_URL") ?? "";
const SUPABASE_KEY =
  Netlify.env.get("SUPABASE_ANON_KEY") ??
  Netlify.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  "";

export default async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(JSON.stringify({ error: "not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const h = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: "application/json",
  };

  const [bRes, iRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/bundles?is_published=eq.true&select=id,slug,name,tagline,kind,tier,people,price_cents,parts_sum_cents,wave,ships_status,is_best,sort_order&order=sort_order.asc`,
      { headers: h },
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/bundle_items?select=id,bundle_id,component_name,qty,is_shared,is_digital,sort_order&order=sort_order.asc`,
      { headers: h },
    ),
  ]);

  const bundles = bRes.ok
    ? ((await bRes.json()) as Array<Record<string, unknown>>)
    : [];
  const items = iRes.ok
    ? ((await iRes.json()) as Array<Record<string, unknown>>)
    : [];

  const out = {
    license: LICENSE,
    license_url: "https://creativecommons.org/licenses/by/4.0/",
    source: `${SITE}/prepare`,
    generated_at: new Date().toISOString(),
    bundles: bundles.map((b) => ({
      slug: String(b.slug),
      name: String(b.name),
      tagline: b.tagline ?? null,
      kind: String(b.kind),
      tier: String(b.tier),
      people: Number(b.people),
      price_usd: Number(b.price_cents) / 100,
      parts_sum_usd: Number(b.parts_sum_cents) / 100,
      ships_status: String(b.ships_status),
      wave: Number(b.wave),
      is_best: Boolean(b.is_best),
      url: `${SITE}/prepare#${String(b.slug)}`,
      items: items
        .filter((i) => String(i.bundle_id) === String(b.id))
        .map((i) => ({
          component_name: String(i.component_name),
          qty: Number(i.qty),
          is_shared: Boolean(i.is_shared),
          is_digital: Boolean(i.is_digital),
        })),
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
