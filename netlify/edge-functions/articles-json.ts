// Full published article corpus as one JSON document. Served at /articles.json.
// Must be mapped ABOVE the /articles/* content-prerender entry in netlify.toml.
import type { Config } from "@netlify/edge-functions";

const SITE = "https://dmtcode.com";
const LICENSE = "CC-BY-4.0";
const LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";
const SUPABASE_URL =
  Netlify.env.get("SUPABASE_URL") ?? Netlify.env.get("VITE_SUPABASE_URL") ?? "";
const SUPABASE_KEY =
  Netlify.env.get("SUPABASE_ANON_KEY") ??
  Netlify.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  "";

const H = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  Accept: "application/json",
};

async function fetchArr(path: string): Promise<Array<Record<string, unknown>>> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: H });
  return res.ok ? ((await res.json()) as Array<Record<string, unknown>>) : [];
}

async function resolveCitations(
  trials: string[],
  bib: string[],
  symbols: string[],
  protocols: string[],
): Promise<string[]> {
  const out: string[] = [];
  const inList = (xs: string[]) =>
    xs.filter(Boolean).map((x) => `"${x}"`).join(",");

  if (trials.length) {
    const r = await fetchArr(
      `clinical_trials?id=in.(${inList(trials)})&is_approved=is.true&select=id`,
    );
    for (const x of r) out.push(`${SITE}/trials/${x.id}`);
  }
  if (bib.length) {
    const r = await fetchArr(
      `bibliography?id=in.(${inList(bib)})&is_approved=eq.true&select=id`,
    );
    for (const x of r) out.push(`${SITE}/bibliography/${x.id}`);
  }
  if (symbols.length) {
    const r = await fetchArr(
      `symbol_submissions?id=in.(${inList(symbols)})&status=eq.approved&select=id`,
    );
    for (const x of r) out.push(`${SITE}/registry/${x.id}`);
  }
  if (protocols.length) {
    const r = await fetchArr(
      `protocols?slug=in.(${inList(protocols)})&is_published=eq.true&select=slug`,
    );
    for (const x of r) out.push(`${SITE}/protocols/${x.slug}`);
  }
  return out;
}

export default async (): Promise<Response> => {
  const rows = await fetchArr(
    "articles?is_published=eq.true" +
      "&select=id,slug,title,dek,body_md,topic_tags,compounds," +
      "related_trials,related_bibliography,related_symbols,related_protocols," +
      "author,published_at,updated_at" +
      "&order=published_at.desc",
  );

  const articles = await Promise.all(
    rows.map(async (r) => {
      const citations = await resolveCitations(
        ((r.related_trials as string[]) || []),
        ((r.related_bibliography as string[]) || []),
        ((r.related_symbols as string[]) || []),
        ((r.related_protocols as string[]) || []),
      );
      return {
        id: String(r.id),
        slug: String(r.slug || ""),
        title: (r.title as string) || "",
        dek: (r.dek as string) || "",
        url: `${SITE}/articles/${r.slug}`,
        published_at: (r.published_at as string) || null,
        updated_at: (r.updated_at as string) || null,
        topic_tags: (r.topic_tags as string[]) || [],
        compounds: (r.compounds as string[]) || [],
        author: (r.author as string) || null,
        body_md: (r.body_md as string) || "",
        license: LICENSE,
        citations,
      };
    }),
  );

  const body = {
    license: LICENSE,
    license_url: LICENSE_URL,
    attribution: "DMT Code, https://dmtcode.com",
    source: `${SITE}/articles`,
    generated_at: new Date().toISOString(),
    count: articles.length,
    articles,
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "netlify-cdn-cache-control":
        "public, s-maxage=1800, stale-while-revalidate=86400, durable",
      "access-control-allow-origin": "*",
    },
  });
};

export const config: Config = { path: "/articles.json" };
