// RSS 2.0 feed of published articles. Served at /articles/feed.xml.
// Must be mapped ABOVE the /articles/* content-prerender entry in netlify.toml,
// or the prerender will swallow it.
import type { Config } from "@netlify/edge-functions";

const SITE = "https://dmtcode.com";
const SUPABASE_URL =
  Netlify.env.get("SUPABASE_URL") ?? Netlify.env.get("VITE_SUPABASE_URL") ?? "";
const SUPABASE_KEY =
  Netlify.env.get("SUPABASE_ANON_KEY") ??
  Netlify.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  "";

function xesc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cdata(s: unknown): string {
  return `<![CDATA[${String(s ?? "").replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function rfc822(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toUTCString();
}

export default async (): Promise<Response> => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response("upstream unavailable", { status: 503 });
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?is_published=eq.true` +
      `&select=id,slug,title,dek,body_md,author,published_at,updated_at` +
      `&order=published_at.desc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      },
    },
  );
  const rows = res.ok
    ? ((await res.json()) as Array<Record<string, unknown>>)
    : [];

  const lastBuild = rows.length
    ? rfc822(String(rows[0].updated_at || rows[0].published_at || ""))
    : new Date().toUTCString();

  const items = rows
    .map((r) => {
      const slug = String(r.slug || "");
      const link = `${SITE}/articles/${slug}`;
      return [
        `    <item>`,
        `      <title>${xesc(r.title)}</title>`,
        `      <link>${xesc(link)}</link>`,
        `      <guid isPermaLink="true">${xesc(link)}</guid>`,
        `      <pubDate>${rfc822(String(r.published_at || ""))}</pubDate>`,
        r.author ? `      <dc:creator>${xesc(r.author)}</dc:creator>` : "",
        `      <description>${cdata(r.dek || "")}</description>`,
        `      <content:encoded>${cdata(r.body_md || "")}</content:encoded>`,
        `    </item>`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" ` +
    `xmlns:content="http://purl.org/rss/1.0/modules/content/" ` +
    `xmlns:atom="http://www.w3.org/2005/Atom" ` +
    `xmlns:dc="http://purl.org/dc/elements/1.1/">\n` +
    `  <channel>\n` +
    `    <title>DMT Code Articles</title>\n` +
    `    <link>${SITE}/articles</link>\n` +
    `    <atom:link href="${SITE}/articles/feed.xml" rel="self" type="application/rss+xml" />\n` +
    `    <description>Long form articles from DMT Code. Answer shaped explainers built on named evidence in the DMT Code corpus.</description>\n` +
    `    <language>en</language>\n` +
    `    <lastBuildDate>${lastBuild}</lastBuildDate>\n` +
    items +
    `\n  </channel>\n` +
    `</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "netlify-cdn-cache-control":
        "public, s-maxage=3600, stale-while-revalidate=86400, durable",
    },
  });
};

export const config: Config = { path: "/articles/feed.xml" };
