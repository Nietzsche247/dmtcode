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
// that returns 200. Removed: /correlations, /leaderboard, /bundles, /assess,
// /log. /submit-symbol is server rendered but is deliberately noindex, so it
// stays out of the sitemap.
const STATIC: Array<[string, string, string]> = [
  ["/", "1.0", "daily"],
  ["/capture", "0.9", "weekly"],
  ["/registry", "0.9", "daily"],
  ["/evidence-map", "0.9", "weekly"],
  ["/timeline", "0.8", "weekly"],
  ["/trials", "0.9", "daily"],
  ["/bibliography", "0.9", "weekly"],
  ["/prepare", "0.8", "weekly"],
  ["/faq", "0.7", "monthly"],
  ["/events", "0.7", "weekly"],
  ["/retreats", "0.7", "weekly"],
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
  ["/co-witnesses", "0.5", "weekly"],
  ["/theories", "0.7", "weekly"],
  ["/articles", "0.8", "weekly"],
  ["/guides", "0.8", "weekly"],
  ["/privacy", "0.3", "yearly"],
  ["/terms", "0.3", "yearly"],
  ["/disclosure", "0.4", "yearly"],
  ["/agent/", "0.4", "monthly"],
];

// This function is duplicated verbatim in src/lib/theorySlug.ts,
// netlify/edge-functions/content-prerender.ts and netlify/edge-functions/data-json.ts.
// Netlify edge functions run in Deno and cannot import from src/. If you change this,
// change all copies or theory URLs will silently diverge between the app, the
// prerender layer, the sitemap and the machine corpus.
function theorySlug(title: string): string {
  return String(title || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2018\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

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

type Loc = "en" | "es" | "de";
const LOCALES: Loc[] = ["en", "es", "de"];

type Entry = {
  path: string;
  lastmod?: string;
  changefreq: string;
  priority: string;
  // /agent is English-only infrastructure: no locale mirrors, no alternates.
  localized: boolean;
};

function renderUrlset(entries: Entry[], locale: Loc): string {
  const rows: string[] = [];
  for (const e of entries) {
    if (!e.localized && locale !== "en") continue;
    const prefix = e.localized && locale !== "en" ? `/${locale}` : "";
    const alts = e.localized
      ? [
          `<xhtml:link rel="alternate" hreflang="en" href="${SITE}${e.path}"/>`,
          `<xhtml:link rel="alternate" hreflang="es" href="${SITE}/es${e.path}"/>`,
          `<xhtml:link rel="alternate" hreflang="de" href="${SITE}/de${e.path}"/>`,
          `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${e.path}"/>`,
        ].join("")
      : "";
    rows.push(
      `  <url><loc>${SITE}${prefix}${e.path}</loc>` +
        (e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : "") +
        `<changefreq>${e.changefreq}</changefreq>` +
        `<priority>${e.priority}</priority>${alts}</url>`
    );
  }
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
    `xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    rows.join("\n") +
    `\n</urlset>`
  );
}

function renderIndex(): string {
  const rows = ["/sitemap.xml", "/sitemap-es.xml", "/sitemap-de.xml"].map(
    (p) => `  <sitemap><loc>${SITE}${p}</loc></sitemap>`
  );
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    rows.join("\n") +
    `\n</sitemapindex>`
  );
}

export default async (request: Request) => {
  const reqPath = new URL(request.url).pathname;
  if (reqPath === "/sitemap-index.xml") {
    return new Response(renderIndex(), {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
        "netlify-cdn-cache-control":
          "public, s-maxage=3600, stale-while-revalidate=86400, durable",
      },
    });
  }
  const locale: Loc =
    reqPath === "/sitemap-es.xml" ? "es" : reqPath === "/sitemap-de.xml" ? "de" : "en";

  const entries: Entry[] = STATIC.map(([p, pr, cf]) => ({
    path: p,
    changefreq: cf,
    priority: pr,
    localized: !p.startsWith("/agent"),
  }));

  const addById = (
    prefix: string,
    rows: Array<{ id: string; updated_at: string }>,
    priority = "0.7"
  ) => {
    for (const r of rows) {
      const lastmod = (r.updated_at || "").slice(0, 10);
      entries.push({
        path: `${prefix}/${xesc(r.id)}`,
        lastmod: lastmod || undefined,
        changefreq: "monthly",
        priority,
        localized: true,
      });
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
      entries.push({
        path: `${prefix}/${xesc(r.slug)}`,
        lastmod: lastmod || undefined,
        changefreq: "monthly",
        priority,
        localized: true,
      });
    }
  };

  // Symbols: this sitemap deliberately enumerates ALL approved symbols
  // (status=eq.approved), NOT the /data.json corpus. /data.json additionally
  // filters publication_consent=eq.true, which gates the CC-BY dataset export
  // only — it does not gate page visibility. Counts are expected to differ
  // (sitemap >= data.json). Do NOT add the consent filter here: that would
  // silently drop live, indexable pages from the sitemap.
  // The per-entity predicates below (theories, articles, guides, trials,
  // bibliography) DO still mirror /data.json exactly.
  try {
    addById("/registry", (await page("symbol_submissions", "status=eq.approved")) as any);
  } catch (_e) { /* skip */ }
  // Tag hubs: only tags carried by 2+ symbols. Context tags are excluded.
  try {
    // This regex is duplicated verbatim in netlify/edge-functions/content-prerender.ts
    // and src/pages/SymbolDetail.tsx. Edge functions run in Deno and cannot import
    // from src/. If you change it, change all three copies, or the sitemap and the
    // pages will disagree about which tags are indexable.
    const CONTEXT_TAG_RE = /^(priming_|wavelength_|laser_|650nm|indoor$|outdoor$|closed_eyes$|open_eyes$)/i;
    const tagRows = (await page("symbol_submissions", "status=eq.approved", "id,tags")) as any[];
    const counts = new Map<string, number>();
    const seenPair = new Set<string>();
    for (const r of tagRows) {
      const tags = Array.isArray(r.tags) ? r.tags : [];
      for (const t of [...new Set(tags.filter(Boolean))] as string[]) {
        seenPair.add(`${r.id}::${t}`);
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    // symbol_tags has no updated_at column, so page() cannot be reused here.
    const communityRes = SUPABASE_URL && SUPABASE_KEY
      ? await fetch(`${SUPABASE_URL}/rest/v1/symbol_tags?select=symbol_id,tag_name`, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Accept: "application/json",
          },
        })
      : null;
    const communityRows = (communityRes && communityRes.ok ? await communityRes.json() : []) as any[];

    for (const r of communityRows) {
      const t = r.tag_name as string;
      if (!t || !r.symbol_id) continue;
      const key = `${r.symbol_id}::${t}`;
      if (seenPair.has(key)) continue;
      seenPair.add(key);
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    for (const [tag, n] of counts) {
      if (n < 2 || CONTEXT_TAG_RE.test(tag)) continue;
      entries.push({
        path: `/registry/tag/${xesc(encodeURIComponent(tag))}`,
        changefreq: "weekly",
        priority: "0.6",
        localized: true,
      });
    }
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
  try {
    addById("/events", (await page("events", "is_approved=eq.true")) as any, "0.5");
  } catch (_e) { /* skip */ }
  try {
    addById("/retreats", (await page("retreats", "is_approved=eq.true")) as any, "0.5");
  } catch (_e) { /* skip */ }
  // Per-theory canonical URLs. Predicate MUST match /data.json exactly (is_approved=true).
  try {
    const theoryRows = (await page(
      "theories",
      "is_approved=eq.true",
      "id,title,updated_at"
    )) as Array<{ id: string; title: string; updated_at: string }>;
    for (const r of theoryRows) {
      const slug = theorySlug(r.title || "");
      if (!slug) continue;
      const lastmod = (r.updated_at || "").slice(0, 10);
      entries.push({
        path: `/theories/${xesc(slug)}`,
        lastmod: lastmod || undefined,
        changefreq: "monthly",
        priority: "0.6",
        localized: true,
      });
    }
  } catch (_e) { /* skip */ }

  // Per-article canonical URLs. Predicate MUST match /data.json and /articles.json
  // (is_published=eq.true). lastmod uses the row's real updated_at.
  try {
    addBySlug(
      "/articles",
      (await page("articles", "is_published=eq.true", "slug,updated_at")) as any,
      "0.7"
    );
  } catch (_e) { /* skip */ }

  // Per-guide canonical URLs. Predicate MUST match /data.json (is_published=eq.true).
  try {
    addBySlug(
      "/guides",
      (await page("guides", "is_published=eq.true", "slug,updated_at")) as any,
      "0.7"
    );
  } catch (_e) { /* skip */ }

  // Chronology records. The list comes from the static file public/timeline.json,
  // which is the single source of truth for /timeline and every /timeline/{id}.
  // That file is deliberately not mapped to any edge function in netlify.toml, so
  // fetching it here cannot re-enter this handler. Never hardcode a copy of these
  // ids: a second copy would drift out of sync with the file.
  try {
    const tlRes = await fetch(new URL("/timeline.json", request.url).toString(), {
      headers: { Accept: "application/json" },
    });
    if (tlRes.ok) {
      const tlFile = (await tlRes.json()) as {
        provenance?: { verified_on?: string };
        entries?: Array<{ id?: string }>;
      };
      const verifiedOn = tlFile?.provenance?.verified_on ?? "";
      const tlLastmod = /^\d{4}-\d{2}-\d{2}$/.test(verifiedOn) ? verifiedOn : undefined;
      for (const e of tlFile?.entries ?? []) {
        if (!e || !e.id) continue;
        entries.push({
          path: `/timeline/${xesc(e.id)}`,
          lastmod: tlLastmod,
          changefreq: "monthly",
          priority: "0.6",
          localized: true,
        });
      }
    }
  } catch (_e) { /* skip */ }




  return new Response(renderUrlset(entries, locale), {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "netlify-cdn-cache-control":
        "public, s-maxage=3600, stale-while-revalidate=86400, durable",
    },
  });
};

export const config: Config = {
  path: ["/sitemap.xml", "/sitemap-es.xml", "/sitemap-de.xml", "/sitemap-index.xml"],
};
