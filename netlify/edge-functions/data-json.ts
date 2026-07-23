import type { Config } from "@netlify/edge-functions";

const SITE = "https://dmtcode.com";
const LICENSE = "https://creativecommons.org/licenses/by/4.0/";
const SUPABASE_URL =
  Netlify.env.get("SUPABASE_URL") ?? Netlify.env.get("VITE_SUPABASE_URL") ?? "";
const SUPABASE_KEY =
  Netlify.env.get("SUPABASE_ANON_KEY") ??
  Netlify.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  "";

const KNOWN_PEOPLE = [
  "Goler",
  "Gallimore",
  "Strassman",
  "Davis",
  "Timmermann",
  "Luke",
  "Gomez Emilsson",
  "Hughes",
];

interface UnifiedItem {
  id: string;
  content_type: string;
  title: string;
  url: string | null;
  doi: string | null;
  compounds: string[];
  topic: string[];
  authority_type: string | null;
  stance_score: number | null;
  people: string[];
  status: string | null;
  source_date: string | null;
}

async function fetchAll(
  table: string,
  select: string,
  filter = ""
): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  const pageSize = 1000;
  let from = 0;
  // Cap pagination for safety.
  for (let i = 0; i < 10; i++) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}${filter ? `&${filter}` : ""}`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Range: `${from}-${from + pageSize - 1}`,
        "Range-Unit": "items",
        Accept: "application/json",
      },
    });
    if (!res.ok) break;
    const rows = (await res.json()) as Record<string, unknown>[];
    all.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

function derivePeople(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();
  for (const name of KNOWN_PEOPLE) {
    const re = new RegExp(`\\b${name.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (re.test(text)) found.add(name);
  }
  return Array.from(found);
}

function authorsToPeople(authors: string | null): string[] {
  if (!authors) return [];
  const parts = authors
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 80);
  const set = new Set<string>();
  for (const p of parts) set.add(p);
  for (const known of KNOWN_PEOPLE) {
    if (new RegExp(`\\b${known}\\b`, "i").test(authors)) set.add(known);
  }
  return Array.from(set);
}

function normalizeCompounds(c: unknown): string[] {
  if (Array.isArray(c)) return c.filter((x): x is string => typeof x === "string");
  if (typeof c === "string") return [c];
  return [];
}

function applyFilters(items: UnifiedItem[], params: URLSearchParams): UnifiedItem[] {
  const ct = params.get("content_type");
  const compound = params.get("compound");
  const topic = params.get("topic");
  const authority = params.get("authority_type");
  const person = params.get("person");
  const status = params.get("status");
  const stanceMin = params.get("stance_min");
  const stanceMax = params.get("stance_max");
  const q = params.get("q")?.toLowerCase();
  const limit = Math.min(parseInt(params.get("limit") || "5000", 10), 10000);
  const offset = parseInt(params.get("offset") || "0", 10);

  let out = items;
  if (ct) out = out.filter((i) => i.content_type.toLowerCase() === ct.toLowerCase());
  if (compound)
    out = out.filter((i) => i.compounds.some((x) => x.toLowerCase().includes(compound.toLowerCase())));
  if (topic)
    out = out.filter((i) => i.topic.some((x) => x.toLowerCase().includes(topic.toLowerCase())));
  if (authority)
    out = out.filter((i) => (i.authority_type || "").toLowerCase() === authority.toLowerCase());
  if (person)
    out = out.filter((i) => i.people.some((p) => p.toLowerCase().includes(person.toLowerCase())));
  if (status) out = out.filter((i) => (i.status || "").toLowerCase() === status.toLowerCase());
  if (stanceMin != null)
    out = out.filter((i) => i.stance_score != null && i.stance_score >= parseInt(stanceMin, 10));
  if (stanceMax != null)
    out = out.filter((i) => i.stance_score != null && i.stance_score <= parseInt(stanceMax, 10));
  if (q)
    out = out.filter((i) =>
      `${i.title} ${i.people.join(" ")} ${i.topic.join(" ")}`.toLowerCase().includes(q)
    );
  return out.slice(offset, offset + limit);
}

export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  const [bib, trials, symbols] = await Promise.all([
    fetchAll(
      "bibliography",
      "id,title,authors,journal,publication_date,doi,pmid,url,compounds,source,content_type,authority_type,stance_score,tags,featured,summary,source_date,is_approved",
      "is_approved=eq.true"
    ),
    fetchAll(
      "clinical_trials",
      "id,title,institution,organizer_lead,location,trial_type,status,confirmed_status,application_url,url,notes,eligibility,created_at"
    ),
    fetchAll(
      "symbol_submissions",
      "id,description,tags,status,created_at,image_url",
      "status=eq.approved"
    ),
  ]);

  const bibItems: UnifiedItem[] = bib.map((r) => {
    const authors = (r.authors as string | null) || "";
    const summary = (r.summary as string | null) || "";
    const title = (r.title as string | null) || "";
    const derived = derivePeople(`${authors} ${title} ${summary}`);
    const people = Array.from(new Set([...authorsToPeople(authors), ...derived]));
    return {
      id: `bib_${r.id}`,
      content_type: (r.content_type as string) || "Paper",
      title,
      url: (r.url as string) || (r.doi ? `https://doi.org/${r.doi}` : `${SITE}/bibliography/${r.id}`),
      doi: (r.doi as string) || null,
      compounds: normalizeCompounds(r.compounds),
      topic: (r.tags as string[]) || [],
      authority_type: (r.authority_type as string) || null,
      stance_score: (r.stance_score as number) ?? null,
      people,
      status: null,
      source_date: (r.source_date as string) || (r.publication_date as string) || null,
    };
  });

  const trialItems: UnifiedItem[] = trials.map((r) => {
    const title = (r.title as string) || "";
    const lead = (r.organizer_lead as string) || "";
    const inst = (r.institution as string) || "";
    const notes = (r.notes as string) || "";
    const people = Array.from(
      new Set([
        ...(lead ? [lead] : []),
        ...derivePeople(`${title} ${lead} ${inst} ${notes}`),
      ])
    );
    return {
      id: `trial_${r.id}`,
      content_type: "Trial",
      title,
      url: (r.application_url as string) || (r.url as string) || `${SITE}/trials/${r.id}`,
      doi: null,
      compounds: [],
      topic: ((r.trial_type as string) ? [r.trial_type as string] : []),
      authority_type: "Clinical",
      stance_score: null,
      people,
      status: (r.confirmed_status as string) || (r.status as string) || null,
      source_date: (r.created_at as string) || null,
    };
  });

  const symbolItems: UnifiedItem[] = symbols.map((r) => ({
    id: `symbol_${r.id}`,
    content_type: "Symbol",
    title: (r.description as string) || "Untitled symbol",
    url: `${SITE}/registry/${r.id}`,
    doi: null,
    compounds: [],
    topic: (r.tags as string[]) || [],
    authority_type: "Community",
    stance_score: null,
    people: [],
    status: (r.status as string) || null,
    source_date: (r.created_at as string) || null,
  }));

  const items = [...bibItems, ...trialItems, ...symbolItems];

  // Backward-compat: keep existing static shape by fetching the shipped file.
  let legacy: Record<string, unknown> = {};
  try {
    const legacyRes = await fetch(new URL("/data.json", req.url).toString(), {
      headers: { "x-legacy-passthrough": "1" },
    });
    if (legacyRes.ok) {
      const t = await legacyRes.text();
      // Guard against recursion loops in dev.
      if (!t.trim().startsWith("<")) legacy = JSON.parse(t);
    }
  } catch {
    legacy = {};
  }

  const filtered = applyFilters(items, url.searchParams);

  const body = {
    version: "3.0",
    dateModified: new Date().toISOString().slice(0, 10),
    license: LICENSE,
    attribution: "DMT Code, https://dmtcode.com",
    filters: {
      content_type: ["Trial", "Paper", "Podcast", "Media", "Dataset", "Book", "Essay", "Symbol"],
      compound: "substring match against item.compounds",
      topic: "substring match against item.topic",
      authority_type: ["Academic", "Clinical", "Journalism", "Community", "Independent"],
      person: "substring match against item.people (see known names)",
      status: "trial status such as recruiting, active, completed",
      stance_min: "integer, inclusive lower bound",
      stance_max: "integer, inclusive upper bound",
      q: "free text over title, people, topic",
      limit: "max 10000, default 5000",
      offset: "pagination offset",
    },
    known_people: KNOWN_PEOPLE,
    counts: {
      total: items.length,
      returned: filtered.length,
      bibliography: bibItems.length,
      trials: trialItems.length,
      symbols: symbolItems.length,
    },
    items: filtered,
    symbols: legacy.symbols ?? [],
    tools: legacy.tools ?? [],
    faq: legacy.faq ?? [],
  };

  // Health assertion: if the corpus is empty, return 503 so agents retry
  // instead of caching an empty dataset as truth.
  if (items.length === 0) {
    return new Response(
      JSON.stringify({
        error: "corpus_unavailable",
        message: "Upstream data source returned zero rows. Retry shortly.",
        counts: body.counts,
      }, null, 2),
      {
        status: 503,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          "retry-after": "60",
          "access-control-allow-origin": "*",
        },
      },
    );
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=900",
      "access-control-allow-origin": "*",
    },
  });
};


export const config: Config = { path: "/data.json" };
