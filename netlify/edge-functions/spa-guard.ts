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
  "dataset",
  // Client only app routes that must stay 200 for humans
  "auth", "admin", "submit", "submit-symbol", "submit-product", "join",
  "co-witnesses", "waitlist", "community", "log", "assess", "leaderboard",
  "correlations", "events", "dashboard", "profile", "my-symbols", "analysis",
  "tools", "bundles", "products", "api", "contribute", "Elizabeth_Baker",
  "card",
  // Machine endpoints and public assets
  "data.json", "shop.json", "sitemap.xml", "llms.txt", "robots.txt",
  "manifest.json", "timeline.json", "favicon.svg",
]);

// Prefixes served by another edge function or static asset the SPA fallback
// must still allow.
function isDetailPatternValid(path: string): boolean {
  // /registry/:uuid, /trials/:uuid, /bibliography/:uuid
  const m = path.match(/^\/(registry|trials|bibliography)\/([^/]+)$/i);
  if (m) return UUID_RE.test(m[2]);
  // /card/:uuid.png
  const c = path.match(/^\/card\/([^/]+)\.png$/i);
  if (c) return UUID_RE.test(c[1]);
  return true;
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Root and every path with a file extension pass through (assets, images).
  if (path === "/" || /\.[a-z0-9]{2,5}$/i.test(path)) {
    return context.next();
  }

  const segs = path.replace(/^\/+/, "").split("/");
  const first = segs[0] ?? "";

  const validFirst = VALID_FIRST_SEGMENT.has(first);
  if (!validFirst) {
    return notFound();
  }
  if (!isDetailPatternValid(path)) {
    return notFound();
  }
  return context.next();
};

async function notFound(): Promise<Response> {
  const html = `<!doctype html><html lang="en"><head>
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
