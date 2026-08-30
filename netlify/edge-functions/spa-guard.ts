import type { Config, Context } from "@netlify/edge-functions";

// SPA route guard. Any path that is not a real app route or a valid detail-page
// pattern returns HTTP 404 with a noindex meta tag, so unknown URLs stop
// masquerading as valid content and stop being indexed as soft 404s.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Human-readable slug: lowercase words joined by single hyphens.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Ids that are a null value stringified by a caller rather than a real record.
// Observed live in crawler_hits: /de/null, and the all-zero UUID on
// /bibliography, /trials and /registry (668 hits in 30 days). These match the
// slug and UUID shapes above, so they need an explicit reject or they read as
// valid ids.
const NULLISH_ID = new Set<string>([
  "null", "undefined", "nan", "none", "false", "true",
  "object-object", "[object object]",
  "00000000-0000-0000-0000-000000000000",
]);

function isNullishId(s: string): boolean {
  return NULLISH_ID.has(s.toLowerCase());
}

// Country frames under /legal. A fixed editorial set, not a table, so an
// unknown country 404s instead of rendering an empty legal page.
const LEGAL_COUNTRIES = new Set<string>([
  "mexico", "costa-rica", "peru", "united-states", "germany", "spain",
]);

// First-segment whitelist. Covers every path registered in the React router
// (App.tsx), including client-only routes that are not server prerendered.
const VALID_FIRST_SEGMENT = new Set<string>([
  // Prerendered pages
  "registry", "trials", "bibliography", "prepare", "faq", "evidence-map",
  "about", "critiques", "the-discovery", "null-reports", "glossary", "methods",
  "open-questions", "object-model", "research", "protocols", "forecasts", "protocol-guide",
  "dataset", "theories", "retreats", "preregister", "documents",
  // The bare downloads path must pass through, not 404 here. Edge functions run
  // before Netlify redirect rules, so blocking it would kill the 301 that sends
  // it to /documents. The PDF files under it take the asset branch above.
  "downloads",
  // NOTE: the legal and for-agents segments are deliberately absent. The events
  // module will add /legal/:country and /for-agents, but neither the React
  // router nor content-prerender serves them today, so allowing them here
  // returns the empty SPA shell with HTTP 200: a soft 404, which is worse for
  // indexing than the honest 404 they get now. Add them in the same change that
  // ships the pages, together with their content-prerender routes. The
  // /legal/:country matcher below is already written and waiting.
  // Keep segment names out of quotes in this comment: the route test parses
  // every quoted string inside this literal.
  // Client only app routes that must stay 200 for humans
  "auth", "admin", "submit", "submit-symbol", "join", "volunteer",
  "co-witnesses", "waitlist", "log", "assess", "leaderboard",
  "correlations", "events", "dashboard", "profile", "my-symbols", "analysis",
  "tools", "bundles", "api", "contribute", "Elizabeth_Baker",
  "card", "articles", "guides", "privacy", "terms", "disclosure", "capture",
  "shipping", "returns", "store-terms", "store-contact",
  "timeline", "people", "products",
  // Machine endpoints and public assets
  "data.json", "shop.json", "sitemap.xml", "llms.txt", "robots.txt",
  "manifest.json", "timeline.json", "favicon.svg", "agent",
]);

const ASSET_RE = /\.[a-z0-9]{2,5}$/i;

// /products/:handle is the kit drill-down page, rendered from the catalogue in
// src/data/kits.ts. Only these live storefront handles resolve to a product;
// anything else must 404 instead of serving the SPA shell with a 200.
// Mirrored from the `handle` field on each kit in src/data/kits.ts, which is
// the canonical catalogue. Edge functions run in Deno and cannot import from
// src/, so keep this list in sync when a kit handle changes. Every handle here
// must also be prerendered by content-prerender.ts, or the page returns the
// empty SPA shell at 200, which is a soft 404 and worse than an honest one.
const PRODUCT_HANDLES = new Set<string>([
  "650nm-laser-diffraction-research-kit-solo",
  "dual-wavelength-laser-diffraction-research-kit-dual-650-and-532-nm",
  "multi-wavelength-laser-diffraction-kit-triad",
  "multi-wavelength-laser-diffraction-kit-circle",
]);

// Prefixes served by another edge function or static asset the SPA fallback
// must still allow.
function isDetailPatternValid(path: string): boolean {
  // A stringified null in the id position is never a record, whatever the
  // collection. Checked before the per-collection shapes below.
  const last = path.split("/").pop() ?? "";
  if (isNullishId(last)) return false;
  // /articles/:slug uses human-readable slugs, not UUIDs
  const a = path.match(/^\/(articles|guides)\/([^/]+)$/i);
  if (a) return SLUG_RE.test(a[2]);
  // /registry/:uuid, /trials/:uuid, /bibliography/:uuid
  const m = path.match(/^\/(registry|trials|bibliography)\/([^/]+)$/i);
  if (m) return UUID_RE.test(m[2]);
  // /events/:x and /retreats/:x accept a UUID (legacy records) OR a slug. The
  // events module addresses records by human slug; the UUID form stays valid so
  // existing links and any un-migrated record keep resolving.
  const ev = path.match(/^\/(events|retreats)\/([^/]+)$/i);
  if (ev) return UUID_RE.test(ev[2]) || SLUG_RE.test(ev[2]);
  // /events/festivals/:region and /events/conferences/:region geo hubs.
  const hub = path.match(/^\/events\/(festivals|conferences|workshops)\/([^/]+)$/i);
  if (hub) return SLUG_RE.test(hub[2]);
  // /legal/:country is a fixed set of country frames, not a table.
  const lg = path.match(/^\/legal\/([^/]+)$/i);
  if (lg) return LEGAL_COUNTRIES.has(lg[1].toLowerCase());
  // /people/:slug is a static profile set, not a table
  const pe = path.match(/^\/people\/([^/]+)$/i);
  if (pe) return ["danny-goler", "andrew-gallimore", "chase-hughes"].includes(pe[1].toLowerCase());
  // /products/:handle must match a live Shopify handle
  const pr = path.match(/^\/products\/([^/]+)$/i);
  if (pr) return PRODUCT_HANDLES.has(pr[1].toLowerCase());
  // /card/:uuid.png
  const c = path.match(/^\/card\/([^/]+)\.png$/i);
  if (c) return UUID_RE.test(c[1]);
  return true;
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  let path = url.pathname;

  // Path-based locale mirrors: /es/* and /de/* serve the same route tree as
  // English. Strip the locale segment and validate the residual path only.
  let locale = "";
  const locMatch = path.match(/^\/(es|de)(\/.*)?$/i);
  if (locMatch) {
    locale = locMatch[1].toLowerCase();
    path = locMatch[2] || "/";
  }

  if (path === "/") {
    return context.next();
  }

  // Legacy vanity path: redirect here because edge functions run before Netlify redirect rules
  if (/^\/danny-goler\/?$/i.test(path)) {
    return Response.redirect(`${url.origin}/people/danny-goler`, 301);
  }

  // The document index cannot live at /downloads: that path collides with the
  // public/downloads directory in the publish output, so Netlify serves the
  // static directory and content-prerender never runs. /downloads is still the
  // path people and machines guess, so it redirects to the page. Redirected
  // here for the same reason as the line above, and matched on the bare path
  // only, so every published PDF URL under /downloads/ keeps resolving.
  if (/^\/downloads\/?$/i.test(path)) {
    return Response.redirect(`${url.origin}${locale ? "/" + locale : ""}/documents`, 301);
  }

  // Referral redirect prefix: proxied to the Supabase go function by a
  // redirect rule, which runs after edge functions. Pass through untouched.
  if (/^\/go(\/|$)/i.test(path)) {
    return context.next();
  }



  // Asset-shaped request. Let it through, then check what actually came back.
  // If the SPA fallback answered an asset request with the HTML shell, the file
  // does not exist and the honest answer is 404, not a 200 that looks like a
  // page. .html paths are excluded because HTML is their correct content type.
  if (ASSET_RE.test(path)) {
    const res = await context.next();
    if (
      res.status === 200 &&
      !/\.html?$/i.test(path) &&
      (res.headers.get("content-type") || "").toLowerCase().includes("text/html")
    ) {
      return notFound(locale);
    }
    return res;
  }

  const segs = path.replace(/^\/+/, "").split("/");
  const first = segs[0] ?? "";

  const validFirst = VALID_FIRST_SEGMENT.has(first);
  if (!validFirst) {
    return notFound(locale);
  }
  if (!isDetailPatternValid(path)) {
    return notFound(locale);
  }
  return context.next();
};

async function notFound(locale = ""): Promise<Response> {
  const html = `<!doctype html><html lang="${locale || "en"}"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex,follow" />
<title>Page not found | DMT Code</title>
<link rel="canonical" href="https://dmtcode.com/" />
</head><body>
<main>
  <h1>Page not found</h1>
  <p>The page you requested does not exist. Return to the <a href="/">DMT Code homepage</a>, browse the <a href="/registry">visual symbol registry</a>, or read the <a href="/faq">questions and answers</a>.</p>
</main>
</body></html>`;
  return new Response(html, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "x-robots-tag": "noindex, follow",
    },
  });
}


export const config: Config = { path: "/*" };
