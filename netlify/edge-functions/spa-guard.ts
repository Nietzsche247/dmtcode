import type { Config, Context } from "@netlify/edge-functions";

// SPA route guard. Any path that is not a real app route or a valid detail-page
// pattern returns HTTP 404 with a noindex meta tag, so unknown URLs stop
// masquerading as valid content and stop being indexed as soft 404s.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// First-segment whitelist. Covers every path registered in the React router
// (App.tsx), including client-only routes that are not server prerendered.
const VALID_FIRST_SEGMENT = new Set<string>([
  // Prerendered pages
  "registry", "trials", "bibliography", "prepare", "faq", "evidence-map",
  "about", "critiques", "null-reports", "glossary", "methods",
  "open-questions", "research", "protocols", "forecasts", "protocol-guide",
  "dataset", "theories", "retreats",
  // Client only app routes that must stay 200 for humans
  "auth", "admin", "submit", "submit-symbol", "join",
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

// Prefixes served by another edge function or static asset the SPA fallback
// must still allow.
function isDetailPatternValid(path: string): boolean {
  // /articles/:slug uses human-readable slugs, not UUIDs
  const a = path.match(/^\/(articles|guides)\/([^/]+)$/i);
  if (a) return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a[2]);
  // /registry/:uuid, /trials/:uuid, /bibliography/:uuid, /events/:uuid, /retreats/:uuid
  const m = path.match(/^\/(registry|trials|bibliography|events|retreats)\/([^/]+)$/i);
  if (m) return UUID_RE.test(m[2]);
  // /people/:slug is a static profile set, not a table
  const pe = path.match(/^\/people\/([^/]+)$/i);
  if (pe) return ["danny-goler", "andrew-gallimore", "chase-hughes"].includes(pe[1].toLowerCase());
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
