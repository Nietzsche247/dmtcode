import type { Config } from "@netlify/edge-functions";

const SITE = "https://dmtcode.com";
const SUPABASE_URL =
  Netlify.env.get("SUPABASE_URL") ?? Netlify.env.get("VITE_SUPABASE_URL") ?? "";
const SUPABASE_KEY =
  Netlify.env.get("SUPABASE_ANON_KEY") ??
  Netlify.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  "";

// Canonical public content URLs. Every entry here corresponds to a route that
// either has server prerender in content-prerender.ts or is a real app view
// that returns 200. Removed: /correlations, /leaderboard, /bundles,
// /submit-symbol (client-only utility, not indexable content), /assess, /log.
const STATIC: Array<[string, string, string]> = [
  ["/", "1.0", "daily"],
  ["/registry", "0.9", "daily"],
  ["/evidence-map", "0.9", "weekly"],
  ["/trials", "0.9", "daily"],
  ["/bibliography", "0.9", "weekly"],
  ["/prepare", "0.8", "weekly"],
  ["/faq", "0.7", "monthly"],
  ["/events", "0.7", "weekly"],
  ["/protocols", "0.8", "weekly"],
  ["/protocol-guide", "0.7", "monthly"],
  ["/glossary", "0.6", "monthly"],
  ["/about", "0.6", "monthly"],
  ["/methods", "0.6", "monthly"],
  ["/critiques", "0.6", "monthly"],
  ["/open-questions", "0.6", "weekly"],
  ["/null-reports", "0.5", "weekly"],
  ["/research", "0.6", "weekly"],
  ["/dataset", "0.6", "monthly"],
  ["/forecasts", "0.6", "weekly"],
  ["/join", "0.6", "monthly"],
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
  filter: string,
  select = "id,updated_at"
): Promise<Array<Record<string, string>>> {
  const out: Array<Record<string, string>> = [];
  if (!SUPABASE_URL || !SUPABASE_KEY) return out;
  const size = 1000;
  for (let from = 0; from < 50000; from += size) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${filter}&select=${select}&order=updated_at.desc`,
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
    const rows = (await res.json()) as Array<Record<string, string>>;
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}

export default async () => {
  const urls = STATIC.map(
    ([p, pr, cf]) =>
      `  <url><loc>${SITE}${p}</loc>` +
      `<changefreq>${cf}</changefreq><priority>${pr}</priority></url>`
  );

  const addById = (
    prefix: string,
    rows: Array<{ id: string; updated_at: string }>,
    priority = "0.7"
  ) => {
    for (const r of rows) {
      const lastmod = (r.updated_at || "").slice(0, 10);
      const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : "";
      urls.push(
        `  <url><loc>${SITE}${prefix}/${xesc(r.id)}</loc>` +
          `${lastmodTag}<changefreq>monthly</changefreq>` +
          `<priority>${priority}</priority></url>`
      );
    }
  };

  const addBySlug = (
    prefix: string,
    rows: Array<{ slug: string; updated_at: string }>,
    priority = "0.7"
  ) => {
    for (const r of rows) {
      if (!r.slug) continue;
      const lastmod = (r.updated_at || "").slice(0, 10);
      const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : "";
      urls.push(
        `  <url><loc>${SITE}${prefix}/${xesc(r.slug)}</loc>` +
          `${lastmodTag}<changefreq>monthly</changefreq>` +
          `<priority>${priority}</priority></url>`
      );
    }
  };

  // Predicates below MUST match /data.json exactly so counts reconcile.
  try {
    addById("/registry", (await page("symbol_submissions", "status=eq.approved")) as any);
  } catch (_e) { /* skip */ }
  try {
    // Match /data.json: enumerate every approved trial, not only registered.
    addById("/trials", (await page("clinical_trials", "is_approved=is.true")) as any);
  } catch (_e) { /* skip */ }
  try {
    addById("/bibliography", (await page("bibliography", "is_approved=eq.true")) as any);
  } catch (_e) { /* skip */ }
  try {
    addBySlug(
      "/protocols",
      (await page("protocols", "is_published=eq.true", "slug,updated_at")) as any,
      "0.8"
    );
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
