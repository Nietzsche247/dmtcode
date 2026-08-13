// SCRAPE_ARTICLES — dmtcode.com web-article hunter.
// Same shape as scrape-all / scrape-festivals: polls a list of RSS sources,
// scores each item against the project's phenomenology thesis, dedupes by URL,
// and inserts NEW rows into article_leads with is_approved=false for moderation.
// It never writes approved rows and never touches the editorial `articles` table.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

// ============= SOURCES =============
// Google News RSS gives broad press coverage; curated feeds give the
// phenomenology / harm-reduction / research press that Google News misses.
const NEWS_QUERIES = [
  "DMT experience",
  "N,N-DMT research",
  "5-MeO-DMT",
  "ayahuasca research",
  "psilocybin consciousness",
  "LSD visual geometry",
  "ibogaine treatment",
  "psychedelic entity encounter",
  "DMT machine elves",
  "laser diffraction hallucination",
];

const CURATED_FEEDS: { source: string; url: string }[] = [
  { source: "psychedelic_alpha", url: "https://psychedelicalpha.com/feed" },
  { source: "chacruna", url: "https://chacruna.net/feed/" },
  { source: "lucid_news", url: "https://www.lucid.news/feed/" },
  { source: "maps", url: "https://maps.org/feed/" },
  { source: "psychedelic_spotlight", url: "https://psychedelicspotlight.com/feed/" },
  { source: "blossom", url: "https://blossomanalysis.com/feed/" },
];

// ============= SCORING =============
const COMPOUND_TERMS: Record<string, string[]> = {
  "DMT": ["dmt", "dimethyltryptamine"],
  "5-MeO-DMT": ["5-meo-dmt", "5meo", "bufo"],
  "Ayahuasca": ["ayahuasca", "yage", "yagé"],
  "Psilocybin": ["psilocybin", "psilocin", "magic mushroom"],
  "LSD": ["lsd", "lysergic"],
  "Ibogaine": ["ibogaine", "iboga"],
  "Ketamine": ["ketamine"],
  "MDMA": ["mdma"],
  "Salvinorin A": ["salvinorin", "salvia divinorum"],
};

const TOPIC_TERMS: Record<string, string[]> = {
  phenomenology: ["phenomenolog", "first-person", "trip report", "subjective experience", "experience report"],
  entities: ["entity", "entities", "machine elf", "machine elves", "being", "encounter"],
  geometry: ["geometry", "geometric", "fractal", "pattern", "glyph", "symbol", "hyperbolic"],
  optics: ["laser", "650 nm", "650nm", "diffraction", "interference", "visual cortex"],
  consciousness: ["consciousness", "awareness", "altered state", "non-ordinary"],
  clinical: ["clinical trial", "phase 2", "phase 3", "fda", "randomized"],
  policy: ["legalization", "decriminal", "regulation", "policy"],
  sober: ["sober", "spontaneous", "without drugs", "non-drug", "meditation"],
};

// Acronym false-positive guards learned from the 2025 PubMed dump.
const NEGATIVE_TERMS = [
  "disease-modifying therapy",
  "disease modifying therapies",
  "multiple sclerosis",
  "lsd-1",
  "lsd1",
  "demethylase",
  "stock",
  "share price",
  "earnings call",
  "nasdaq",
];

interface Item {
  title: string;
  url: string;
  excerpt: string;
  outlet: string | null;
  author: string | null;
  published_at: string | null;
  source: string;
}

interface Scored extends Item {
  relevance_score: number;
  compounds: string[];
  topic_tags: string[];
  triage_status: string;
  triage_reason: string;
}

const decode = (s: string): string =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, " ")
    .trim();

const tag = (block: string, name: string): string | null => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : null;
};

function canonicalUrl(raw: string): string {
  try {
    const u = new URL(raw);
    [...u.searchParams.keys()].forEach((k) => {
      if (/^utm_|^fbclid$|^gclid$/i.test(k)) u.searchParams.delete(k);
    });
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw.trim();
  }
}

function parseFeed(xml: string, source: string): Item[] {
  const out: Item[] = [];
  const blocks = [
    ...xml.split(/<item[\s>]/i).slice(1),
    ...xml.split(/<entry[\s>]/i).slice(1),
  ];
  for (const raw of blocks) {
    const block = raw.split(/<\/(?:item|entry)>/i)[0];
    const title = tag(block, "title");
    let link = tag(block, "link");
    if (!link) {
      const href = block.match(/<link[^>]*href="([^"]+)"/i);
      link = href ? href[1] : null;
    }
    if (!title || !link) continue;
    const dateStr =
      tag(block, "pubDate") ?? tag(block, "published") ?? tag(block, "updated") ?? tag(block, "dc:date");
    let published_at: string | null = null;
    if (dateStr) {
      const t = Date.parse(dateStr);
      if (!isNaN(t)) published_at = new Date(t).toISOString();
    }
    const excerpt = (tag(block, "description") ?? tag(block, "summary") ?? tag(block, "content") ?? "").slice(0, 1200);
    let outlet = tag(block, "source");
    if (!outlet) {
      try { outlet = new URL(link).hostname.replace(/^www\./, ""); } catch { outlet = null; }
    }
    out.push({
      title,
      url: canonicalUrl(link),
      excerpt,
      outlet,
      author: tag(block, "dc:creator") ?? tag(block, "author"),
      published_at,
      source,
    });
  }
  return out;
}

function score(item: Item): Scored {
  const text = `${item.title} ${item.excerpt}`.toLowerCase();

  const compounds = Object.entries(COMPOUND_TERMS)
    .filter(([, terms]) => terms.some((t) => text.includes(t)))
    .map(([name]) => name);

  const topic_tags = Object.entries(TOPIC_TERMS)
    .filter(([, terms]) => terms.some((t) => text.includes(t)))
    .map(([name]) => name);

  let relevance = compounds.length * 15 + topic_tags.length * 10;
  if (topic_tags.includes("phenomenology")) relevance += 20;
  if (topic_tags.includes("entities")) relevance += 15;
  if (topic_tags.includes("geometry") || topic_tags.includes("optics")) relevance += 15;
  if (topic_tags.includes("policy") && compounds.length === 0) relevance -= 15;

  const negative = NEGATIVE_TERMS.filter((t) => text.includes(t));
  relevance -= negative.length * 30;
  relevance = Math.max(0, Math.min(100, relevance));

  let triage_status = "needs_review";
  let triage_reason = "On-topic keywords found. A human decides whether it belongs in the library.";
  if (negative.length) {
    triage_status = "auto_rejected";
    triage_reason = `Matched off-topic terms: ${negative.join(", ")}.`;
  } else if (compounds.length === 0 && topic_tags.length < 2) {
    triage_status = "auto_rejected";
    triage_reason = "No compound match and fewer than two topic signals.";
  } else if (relevance >= 60) {
    triage_status = "strong_match";
    triage_reason = "Multiple compound and phenomenology signals. Still requires a human read before publishing.";
  }

  return { ...item, relevance_score: relevance, compounds, topic_tags, triage_status, triage_reason };
}

async function fetchFeed(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" } });
    if (!res.ok) {
      console.error(`feed ${url} -> ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (e) {
    console.error(`feed ${url} failed`, e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const started = new Date().toISOString();
  const results: { source: string; found: number; added: number; status: string; error?: string }[] = [];
  let found = 0;
  let added = 0;

  const sources: { source: string; url: string; fallback?: string }[] = [
    ...NEWS_QUERIES.map((q) => ({
      source: "news_search",
      // Google News RSS returns 503 to datacenter IPs, so Bing News RSS is the
      // primary query surface and Google is retried through the Jina proxy.
      url: `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=RSS`,
      fallback: `https://r.jina.ai/https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`,
    })),
    ...CURATED_FEEDS,
  ];

  const seen = new Set<string>();

  for (const s of sources) {
    let xml = await fetchFeed(s.url);
    if (!xml && s.fallback) xml = await fetchFeed(s.fallback);
    if (!xml) {
      results.push({ source: s.source, found: 0, added: 0, status: "error", error: "fetch failed" });
      continue;
    }
    const items = parseFeed(xml, s.source).filter((i) => {
      if (seen.has(i.url)) return false;
      seen.add(i.url);
      return true;
    });
    found += items.length;

    let sourceAdded = 0;
    for (const item of items) {
      const scored = score(item);
      // Store everything except hard rejects so the queue stays honest but not noisy.
      if (scored.triage_status === "auto_rejected" && scored.relevance_score === 0) continue;

      const { data: existing } = await supabase
        .from("article_leads")
        .select("id")
        .eq("url", scored.url)
        .maybeSingle();
      if (existing) continue;

      const { error } = await supabase.from("article_leads").insert({
        url: scored.url,
        title: scored.title.slice(0, 500),
        excerpt: scored.excerpt || null,
        outlet: scored.outlet,
        author: scored.author,
        published_at: scored.published_at,
        source: scored.source,
        topic_tags: scored.topic_tags,
        compounds: scored.compounds,
        relevance_score: scored.relevance_score,
        triage_status: scored.triage_status,
        triage_reason: scored.triage_reason,
        is_approved: false,
      });
      if (!error) { sourceAdded++; added++; }
      else console.error("insert failed", error.message);
    }

    results.push({ source: s.source, found: items.length, added: sourceAdded, status: "success" });
  }

  await supabase.from("scraper_runs").insert({
    scraper_name: "article_hunter",
    last_run_at: started,
    trials_found: found,
    trials_added: added,
    status: "success",
    source: "articles",
  });

  return new Response(
    JSON.stringify({ timestamp: started, found, added, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
