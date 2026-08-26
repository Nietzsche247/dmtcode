// route-verify
//
// Standing job for the D-3 class of defect: a page that returns HTTP 200 while
// declaring a canonical URL (or hreflang alternate) that does not resolve.
// A status-code monitor cannot see this. This job fetches the page, reads the
// canonical and alternates out of the head, and fetches THOSE.
//
// Read-only against crawler_hits. Writes only to route_health.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { machineAuthError } from "../_shared/cronAuth.ts";

const SITE = "https://dmtcode.com";
const UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const MAX_PATHS = 120;
const CONCURRENCY = 6;
const TIMEOUT_MS = 10_000;

const SITEMAPS = ["/sitemap.xml", "/sitemap-es.xml", "/sitemap-de.xml"];

type Issue =
  | "canonical_404"
  | "canonical_mismatch"
  | "alternate_404"
  | "page_404"
  | "page_5xx"
  | null;

type WorkItem = {
  path: string;
  source: "crawler_hits" | "sitemap";
  bot_name: string | null;
  inSitemap: boolean;
};

type Row = {
  path: string;
  status_code: number | null;
  canonical_href: string | null;
  canonical_status: number | null;
  alternates_broken: string[] | null;
  issue: Issue;
  source: string;
  bot_name: string | null;
};

async function fetchWithTimeout(url: string): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      redirect: "manual",
      signal: ctrl.signal,
    });
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function statusOf(url: string): Promise<number | null> {
  const res = await fetchWithTimeout(url);
  return res ? res.status : null;
}

function normalizePath(raw: string): string | null {
  if (!raw) return null;
  let p = raw.trim();
  if (p.startsWith("http")) {
    try {
      p = new URL(p).pathname;
    } catch {
      return null;
    }
  }
  if (!p.startsWith("/")) return null;
  // strip query/hash: route health is about the route, not the params
  p = p.split("#")[0].split("?")[0];
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1) || "/";
  return p;
}

function extractCanonical(html: string): string | null {
  const re = /<link\b[^>]*>/gi;
  for (const m of html.matchAll(re)) {
    const tag = m[0];
    if (!/rel\s*=\s*["']?canonical["']?/i.test(tag)) continue;
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    if (href) return href[1];
  }
  return null;
}

function extractAlternates(html: string): string[] {
  const out: string[] = [];
  const re = /<link\b[^>]*>/gi;
  for (const m of html.matchAll(re)) {
    const tag = m[0];
    if (!/rel\s*=\s*["']?alternate["']?/i.test(tag)) continue;
    if (!/hreflang\s*=/i.test(tag)) continue;
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    if (href) out.push(href[1]);
  }
  return [...new Set(out)];
}

function absolute(href: string): string {
  try {
    return new URL(href, SITE).toString();
  } catch {
    return href;
  }
}

async function parseSitemap(path: string): Promise<string[]> {
  const res = await fetchWithTimeout(`${SITE}${path}`);
  if (!res || res.status !== 200) return [];
  const xml = await res.text();
  const locs: string[] = [];
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/gi)) {
    const p = normalizePath(m[1]);
    if (p) locs.push(p);
  }
  return locs;
}

async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        await worker(items[idx]);
      } catch (_e) {
        /* fail soft: one path must never abort the run */
      }
    }
  });
  await Promise.all(runners);
}

// PostgREST silently caps unpaginated reads at db-max-rows. A client-side
// .limit() can only lower that cap, never raise it, so page explicitly.
const PAGE_SIZE = 1000;

async function pageAll<T>(
  // deno-lint-ignore no-explicit-any
  makeQuery: (from: number, to: number) => any,
  ceiling = Infinity,
): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  while (out.length < ceiling) {
    const size = Math.min(PAGE_SIZE, ceiling - out.length);
    const { data, error } = await makeQuery(from, from + size - 1);
    if (error || !data) break;
    out.push(...(data as T[]));
    if (data.length < size) break;
    from += size;
  }
  return out;
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authError = machineAuthError(req, "ROUTE_VERIFY_SECRET", "x-route-key", corsHeaders);
  if (authError) return authError;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    // ---- 1. build the work list -------------------------------------------
    const sevenDaysAgo = new Date(Date.now() - 7 * 864e5).toISOString();

    const recent = await pageAll<{ path: string }>((from, to) =>
      supabase
        .from("route_health")
        .select("path")
        .gte("checked_at", sevenDaysAgo)
        .order("checked_at", { ascending: false })
        .range(from, to)
    );
    const recentlyChecked = new Set(recent.map((r) => r.path));
    console.log(
      `[route-verify] recentlyChecked: ${recent.length} rows paged, ${recentlyChecked.size} distinct paths`,
    );


    const work: WorkItem[] = [];
    const seen = new Set<string>();

    // fixed per-run quotas; unused quota spills over to the other source
    const CRAWLER_QUOTA = 80;
    const SITEMAP_QUOTA = 40;

    const collect = (candidates: WorkItem[], quota: number) => {
      let taken = 0;
      for (const item of candidates) {
        if (taken >= quota || work.length >= MAX_PATHS) break;
        if (item.path.startsWith("/agent")) continue; // English-only infra, no alternates
        if (seen.has(item.path)) continue;
        seen.add(item.path);
        work.push(item);
        taken++;
      }
    };

    // a. crawler_hits, newest first, not checked in the last 7 days
    const { data: hits } = await supabase
      .from("crawler_hits")
      .select("path, bot_name, ts")
      .order("ts", { ascending: false })
      .limit(2000);

    const crawlerCandidates: WorkItem[] = [];
    for (const h of hits ?? []) {
      const p = normalizePath(String((h as Record<string, unknown>).path ?? ""));
      if (!p || recentlyChecked.has(p)) continue;
      crawlerCandidates.push({
        path: p,
        source: "crawler_hits",
        bot_name: ((h as Record<string, unknown>).bot_name as string) ?? null,
        inSitemap: false,
      });
    }

    // b. sitemap surface, least recently checked first (never-checked first)
    const sitemapPaths = new Set<string>();
    for (const sm of SITEMAPS) {
      for (const p of await parseSitemap(sm)) sitemapPaths.add(p);
    }

    const lastChecks = await pageAll<{ path: string; checked_at: string }>(
      (from, to) =>
        supabase
          .from("route_health")
          .select("path, checked_at")
          .order("checked_at", { ascending: false })
          .range(from, to),
      20000,
    );
    const lastSeen = new Map<string, string>();
    for (const r of lastChecks) {
      const p = r.path;
      if (!lastSeen.has(p)) lastSeen.set(p, r.checked_at);
    }

    const sitemapCandidates: WorkItem[] = [...sitemapPaths]
      .sort((a, b) => {
        const ta = lastSeen.get(a) ?? ""; // never-checked sorts first
        const tb = lastSeen.get(b) ?? "";
        return ta < tb ? -1 : ta > tb ? 1 : 0;
      })
      .map((p) => ({
        path: p,
        source: "sitemap" as const,
        bot_name: null,
        inSitemap: true,
      }));

    // fill each quota, then let each source use whatever the other left behind
    collect(crawlerCandidates, CRAWLER_QUOTA);
    collect(sitemapCandidates, SITEMAP_QUOTA);
    collect(crawlerCandidates, MAX_PATHS);
    collect(sitemapCandidates, MAX_PATHS);

    for (const w of work) {
      if (sitemapPaths.has(w.path)) w.inSitemap = true;
    }


    // ---- 2-4. check each path ---------------------------------------------
    const rows: Row[] = [];
    let dropped = 0;

    await runPool(work, CONCURRENCY, async (item) => {
      const row: Row = {
        path: item.path,
        status_code: null,
        canonical_href: null,
        canonical_status: null,
        alternates_broken: null,
        issue: null,
        source: item.source,
        bot_name: item.bot_name,
      };

      try {
        const res = await fetchWithTimeout(`${SITE}${item.path}`);
        if (!res) {
          rows.push(row); // null status, fail soft
          return;
        }
        row.status_code = res.status;

        if (res.status === 404 || res.status === 410) {
          row.issue = "page_404";
          rows.push(row);
          return;
        }
        if (res.status >= 500) {
          row.issue = "page_5xx";
          rows.push(row);
          return;
        }
        if (res.status !== 200) {
          rows.push(row);
          return;
        }

        const html = await res.text();
        const canonicalRaw = extractCanonical(html);
        const alternates = extractAlternates(html);

        if (canonicalRaw) {
          const canonicalUrl = absolute(canonicalRaw);
          row.canonical_href = canonicalUrl;
          row.canonical_status = await statusOf(canonicalUrl);
        }

        const broken: string[] = [];
        for (const a of alternates) {
          const url = absolute(a);
          const s = await statusOf(url);
          if (s !== 200) broken.push(url);
        }
        if (broken.length) row.alternates_broken = broken;

        // classification, most severe first
        if (row.canonical_href && row.canonical_status !== 200) {
          row.issue = "canonical_404";
        } else if (broken.length) {
          row.issue = "alternate_404";
        } else if (
          row.canonical_href &&
          row.canonical_status === 200 &&
          item.inSitemap &&
          normalizePath(row.canonical_href) !== item.path
        ) {
          row.issue = "canonical_mismatch";
        }

        rows.push(row);
      } catch (e) {
        // fail soft, but never silently: account for the path and log it
        const msg = e instanceof Error ? e.message : String(e);
        const stack = e instanceof Error && e.stack ? `\n${e.stack}` : "";
        console.error(`[route-verify] worker threw: ${item.path} :: ${msg}${stack}`);
        dropped++;
        row.issue = null;
        row.alternates_broken = [`worker_error: ${msg}`];
        rows.push(row);
      }
    });


    // ---- 5. persist --------------------------------------------------------
    if (rows.length) {
      for (let i = 0; i < rows.length; i += 200) {
        await supabase.from("route_health").insert(rows.slice(i, i + 200));
      }
    }

    const issues = {
      canonical_404: 0,
      canonical_mismatch: 0,
      alternate_404: 0,
      page_404: 0,
      page_5xx: 0,
    };
    for (const r of rows) {
      if (r.issue && r.issue in issues) {
        issues[r.issue as keyof typeof issues]++;
      }
    }

    // any work item that produced no row at all (outer runPool catch) is also dropped
    const droppedTotal = dropped + Math.max(0, work.length - rows.length);

    const body = {
      checked: rows.length - dropped,
      dropped: droppedTotal,
      work: work.length,
      clean: rows.filter((r) => !r.issue).length,

      issues,
      worst: rows
        .filter((r) => r.issue)
        .slice(0, 10)
        .map((r) => ({ path: r.path, issue: r.issue })),
    };

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
