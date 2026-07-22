import type { Config } from "@netlify/edge-functions";

const SITE = "https://dmtcode.com";
const SUPABASE_URL =
  Netlify.env.get("SUPABASE_URL") ?? Netlify.env.get("VITE_SUPABASE_URL") ?? "";
const SUPABASE_KEY =
  Netlify.env.get("SUPABASE_ANON_KEY") ??
  Netlify.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  "";

const STATIC: Array<[string, string, string]> = [
  ["/", "1.0", "daily"],
  ["/registry", "0.9", "daily"],
  ["/trials", "0.9", "daily"],
  ["/tools", "0.8", "weekly"],
  ["/protocols", "0.8", "weekly"],
  ["/evidence-map", "0.7", "weekly"],
  ["/research", "0.7", "weekly"],
  ["/bibliography", "0.6", "monthly"],
  ["/events", "0.6", "weekly"],
  ["/methods", "0.6", "monthly"],
  ["/glossary", "0.6", "monthly"],
  ["/faq", "0.6", "monthly"],
  ["/dataset", "0.6", "monthly"],
  ["/about", "0.5", "monthly"],
  ["/correlations", "0.5", "weekly"],
  ["/open-questions", "0.5", "weekly"],
  ["/submit-symbol", "0.5", "monthly"],
  ["/null-reports", "0.4", "weekly"],
  ["/critiques", "0.4", "monthly"],
  ["/leaderboard", "0.4", "weekly"],
];

function xesc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function page(
  table: string,
  filter: string
): Promise<Array<{ id: string; updated_at: string }>> {
  const out: Array<{ id: string; updated_at: string }> = [];
  if (!SUPABASE_URL || !SUPABASE_KEY) return out;
  const size = 1000;
  for (let from = 0; from < 50000; from += size) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${filter}&select=id,updated_at&order=updated_at.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: "application/json",
          Range: `${from}-${from + size - 1}`,
          "Range-Unit": "items",
        },
      }
    );
    if (!res.ok) break;
    const rows = (await res.json()) as Array<{ id: string; updated_at: string }>;
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}

export default async () => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = STATIC.map(
    ([p, pr, cf]) =>
      `  <url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod>` +
      `<changefreq>${cf}</changefreq><priority>${pr}</priority></url>`
  );

  const add = (prefix: string, rows: Array<{ id: string; updated_at: string }>) => {
    for (const r of rows) {
      const lastmod = (r.updated_at || "").slice(0, 10) || today;
      urls.push(
        `  <url><loc>${SITE}${prefix}/${xesc(r.id)}</loc>` +
          `<lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq>` +
          `<priority>0.7</priority></url>`
      );
    }
  };

  try {
    add("/registry", await page("symbol_submissions", "status=eq.approved"));
  } catch (_e) { /* skip */ }
  try {
    add("/trials", await page("clinical_trials", "is_approved=is.true"));
  } catch (_e) { /* skip */ }
  try {
    add("/bibliography", await page("bibliography", "is_approved=is.true"));
  } catch (_e) { /* skip */ }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join("\n") +
    `\n</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "netlify-cdn-cache-control":
        "public, s-maxage=3600, stale-while-revalidate=86400, durable",
    },
  });
};

export const config: Config = { path: "/sitemap.xml" };
