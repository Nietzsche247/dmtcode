import type { Config } from "@netlify/edge-functions";

const SITE = "https://dmtcode.com";
const LICENSE = "https://creativecommons.org/licenses/by/4.0/";
const SUPABASE_URL =
  Netlify.env.get("SUPABASE_URL") ?? Netlify.env.get("VITE_SUPABASE_URL") ?? "";
const SUPABASE_KEY =
  Netlify.env.get("SUPABASE_ANON_KEY") ??
  Netlify.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  "";
// This function is duplicated verbatim in src/lib/theorySlug.ts,
// netlify/edge-functions/content-prerender.ts and netlify/edge-functions/sitemap.ts.
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

// Mirrors the live /faq page grouping in content-prerender.ts. Keep in sync.
const FAQ_ITEMS: Array<{ q: string; a: string; group: string }> = [
  { group: "The project", q: 'What is the "DMT code"?', a: "People who take N,N-DMT often report seeing structured visual forms, grids, glyphs, geometric symbols, and a smaller group describes something that reads almost like written characters. The DMT Code project collects those reports in one place so the overlaps can actually be measured instead of argued about. We are not claiming the forms are a message. We are asking a narrower question: do independent people, who have never spoken, keep drawing the same shapes?" },
  { group: "The project", q: "Is the code real? Are you saying reality is made of code?", a: "No. We hold that question open on purpose. Our job is to gather the observations, keep the method honest, and publish everything so anyone can judge for themselves. If the overlaps turn out to be coincidence or shared cultural imagery, the data should show that too. A result that cannot fail is not worth much, so we built this to be able to fail." },
  { group: "The project", q: "Is this a religion, or are you telling people what to believe?", a: "Neither. Nobody here is asking you to believe anything. Plenty of people who take this seriously think it will turn out to be pattern-matching or shared imagery, and that is a fine place to stand. We care about the observations and the method. What you conclude from them is yours." },
  { group: "The project", q: "What will I actually see? Does everyone see the same thing?", a: "We cannot promise you will see anything in particular, and honesty matters more than hype. Reports vary a lot. Some people describe grids or geometric forms, some describe symbols, and some see nothing they would call structured. The registry exists to find where those experiences genuinely overlap and where they do not, not to tell you what to expect." },
  { group: "The project", q: "Who is behind this and why should I trust it?", a: "Trust the method, not us. The reason to take this seriously is that it is open, it is falsifiable, and the confirmations are public, not that anyone here says so. We keep a neutral position, we never seed or fake a count, and we publish the parts that would let you prove us wrong." },
  { group: "Safety and law", q: "How do I do this safely?", a: "Start with the screening card. Before you consider anything, talk with a qualified prescriber about MAOIs, SSRIs and related medications, any cardiac history, and any personal or family history of psychosis. We deliberately do not publish medication timing windows. The sources disagree and getting it wrong can be dangerous, so that decision belongs with a clinician who knows your history. This is for adults 18 and older." },
  { group: "Safety and law", q: "Is this legal?", a: "The equipment we discuss is ordinary optical gear. We do not sell, source, or explain how to obtain any controlled substance, and nothing here is legal advice. Laws differ by country and state and they change. For your own situation, check your local law or a qualified professional." },
  { group: "Safety and law", q: "Is the laser safe for my eyes?", a: "A laser is not a toy. The kits include the right optical density and eyewear for how the protocol uses the light, and everything should be used exactly as described and kept away from children. If you are unsure how to handle optical equipment safely, do not improvise with it." },
  { group: "The method and the data", q: "How do you stop people from just copying each other's answers?", a: "That is the whole design problem, and it is why the flagship is a blinded comparison. Wherever we can, people record what they saw before they see the existing catalogue, so a match means two strangers landed on the same form independently rather than one person nodding along to another. Convergence only counts when it is earned that way." },
  { group: "The method and the data", q: "What actually counts as a match?", a: "A symbol is not called a match because it looks vaguely similar. People compare specific forms, and a confirmation is recorded when someone recognizes a form they saw independently. Every symbol shows how many people have recognized it, so you can weigh each one yourself." },
  { group: "The method and the data", q: "Can I see the raw data?", a: "Yes, all of it. The registry is public, the machine-readable corpus is at /dataset and /data.json, and it is all CC-BY-4.0, free to read, quote, and check. Every symbol shows how many people have recognized it. If something looks off, we would rather you find it." },
  { group: "The method and the data", q: "Can I add a symbol I saw myself?", a: "Yes. The registry is built from contributions. You can submit what you saw, add context to symbols others have logged, and take part in the comparison. That is how the dataset grows, and it is free to do." },
  { group: "The method and the data", q: "Can I download the whole dataset?", a: "Yes. The full corpus is at /data.json and /dataset under CC-BY-4.0, with an archived, citable version by DOI. Read it, quote it, run your own analysis, and tell us if we got something wrong." },
  { group: "Taking part and kits", q: "What do I need to get started?", a: "Everything is laid out on the prepare page, from a single-instrument Observer kit up to a full Complete kit. The core is a verified 650nm laser and the right optical density, plus an observation journal and a screening card. You can also source every part yourself. We show the do-it-yourself total next to each kit so you know exactly what you are paying for." },
  { group: "Taking part and kits", q: "Why a 650nm laser?", a: "It is the specific red wavelength the observation protocol is built around, paired with the right optical density so it is used the same way each time. Consistent equipment is what lets one person's observation be compared against another's instead of guessing at the differences." },
  { group: "Taking part and kits", q: "Do I have to use DMT to take part?", a: "No. A lot of the work here is observation and comparison. You can browse the registry, add context to symbols other people have logged, and help judge where the forms actually converge without taking anything. The dataset gets stronger every time someone compares carefully." },
  { group: "Taking part and kits", q: "Do I have to buy a kit to take part?", a: "No. A kit gets you the equipment to run a careful observation of your own, but you can browse, contribute, and help judge convergence without spending anything. The kits make doing it well easier; they do not gate the project." },
  { group: "Taking part and kits", q: "Can my friends and I do this together?", a: "Yes, and it is often better that way. The group bundles on the prepare page share the costly instruments across two, three, or five people, so the per-person cost drops as the circle grows. Three and five also include a facilitator guide and a group agreements card, because doing this with other people asks for a little more structure." },
  { group: "Taking part and kits", q: "What are your shipping and refund terms?", a: "Every item shows its ship window before you pay, and if a date slips you hear it from us first. Preorder items are not charged until there is a confirmed source and date. If a component arrives not as described, we replace it and cover it." },
];

interface UnifiedItem {
  id: string;
  content_type: string;
  title: string;
  url?: string;
  doi?: string;
  compounds: string[];
  topic: string[];
  authority_type?: string;
  stance_score?: number;
  people: string[];
  status?: string;
  verification?: string;
  phase?: string;
  source_date?: string;
}

function compact<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v;
  }
  return out as T;
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
  const verification = params.get("verification");
  const phase = params.get("phase");
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
  if (verification)
    out = out.filter((i) => (i.verification || "").toLowerCase() === verification.toLowerCase());
  if (phase)
    out = out.filter((i) => (i.phase || "").toLowerCase().includes(phase.toLowerCase()));
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

  const [bib, trials, symbols, theories, events, articles] = await Promise.all([
    fetchAll(
      "bibliography",
      "id,title,authors,journal,publication_date,doi,pmid,url,compounds,source,content_type,authority_type,stance_score,tags,featured,summary,source_date,is_approved",
      "is_approved=eq.true"
    ),
    fetchAll(
      "clinical_trials",
      "id,title,institution,organizer_lead,location,trial_type,phase,status,confirmed_status,application_url,url,notes,eligibility,created_at",
      "is_approved=is.true"
    ),
    fetchAll(
      "symbol_submissions",
      "id,description,tags,status,upvotes,image_url,created_at,updated_at",
      "status=eq.approved"
    ),
    fetchAll(
      "theories",
      "id,title,summary,content,proponent,source_title,source_url,source_type,origin,tags,upvotes,created_at",
      "is_approved=eq.true"
    ),
    fetchAll(
      "events",
      "id,title,description,details,event_date,event_type,location,organizer,url,is_approved",
      "is_approved=is.true"
    ),
    fetchAll(
      "articles",
      "id,slug,title,dek,body_md,topic_tags,compounds,related_trials,related_bibliography,related_symbols,related_protocols,author,published_at,updated_at,is_published",
      "is_published=eq.true"
    ),
  ]);

  const bibItems: UnifiedItem[] = bib.map((r) => {
    const authors = (r.authors as string | null) || "";
    const summary = (r.summary as string | null) || "";
    const title = (r.title as string | null) || "";
    const derived = derivePeople(`${authors} ${title} ${summary}`);
    const people = Array.from(new Set([...authorsToPeople(authors), ...derived]));
    return compact<UnifiedItem>({
      id: `bib_${r.id}`,
      content_type: (r.content_type as string) || "Paper",
      title,
      url: (r.url as string) || (r.doi ? `https://doi.org/${r.doi}` : `${SITE}/bibliography/${r.id}`),
      doi: (r.doi as string) || undefined,
      compounds: normalizeCompounds(r.compounds),
      topic: (r.tags as string[]) || [],
      authority_type: (r.authority_type as string) || undefined,
      stance_score: (r.stance_score as number) ?? undefined,
      people,
      source_date: (r.source_date as string) || (r.publication_date as string) || undefined,
    });
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
    const confirmed = (r.confirmed_status as string) || "";
    const verification = confirmed && confirmed !== "Confirmed" ? confirmed : undefined;
    return compact<UnifiedItem>({
      id: `trial_${r.id}`,
      content_type: "Trial",
      title,
      url: (r.application_url as string) || (r.url as string) || `${SITE}/trials/${r.id}`,
      compounds: [],
      topic: ((r.trial_type as string) ? [r.trial_type as string] : []),
      authority_type: "Clinical",
      people,
      status: (r.status as string) || undefined,
      verification,
      phase: (r.phase as string) || undefined,
      source_date: (r.created_at as string) || undefined,
    });
  });

  const symbolItems: UnifiedItem[] = symbols.map((r) => compact<UnifiedItem>({
    id: `symbol_${r.id}`,
    content_type: "Symbol",
    title: (r.description as string) || "Untitled symbol",
    url: `${SITE}/registry/${r.id}`,
    compounds: [],
    topic: (r.tags as string[]) || [],
    authority_type: "Community",
    people: [],
    status: (r.status as string) || undefined,
    source_date: (r.created_at as string) || undefined,
  }));

  // Resolve every referenced trial/paper/symbol/protocol id from the fetched
  // sets so citations only ever list rows that actually exist and are public.
  const trialIdSet = new Set(trials.map((t) => String(t.id)));
  const bibIdSet = new Set(bib.map((b) => String(b.id)));
  const symIdSet = new Set(symbols.map((s) => String(s.id)));

  const articleItems: UnifiedItem[] = articles.map((r) => compact<UnifiedItem>({
    id: `article_${r.id}`,
    content_type: "Article",
    title: (r.title as string) || "",
    url: `${SITE}/articles/${r.slug}`,
    compounds: (r.compounds as string[]) || [],
    topic: (r.topic_tags as string[]) || [],
    authority_type: "Editorial",
    people: (r.author as string) ? [String(r.author)] : [],
    source_date: (r.published_at as string) || (r.updated_at as string) || undefined,
  }));

  const items = [...bibItems, ...trialItems, ...symbolItems, ...articleItems];

  const filtered = applyFilters(items, url.searchParams);

  // Top-level "symbols" projection: every approved symbol with the fields
  // agents most need without re-querying. "faq" mirrors the live /faq page.
  const symbolsFeed = symbols.map((r) => ({
    id: String(r.id),
    url: `${SITE}/registry/${r.id}`,
    description: (r.description as string) || null,
    tags: (r.tags as string[]) || [],
    image_url: (r.image_url as string) || null,
    upvotes: Number(r.upvotes ?? 0),
    created_at: (r.created_at as string) || null,
    updated_at: (r.updated_at as string) || null,
  }));

  const theoriesFeed = theories.map((r) => ({
    id: String(r.id),
    url: `${SITE}/theories/${theorySlug(String((r.title as string) || ""))}`,
    title: (r.title as string) || null,
    summary: (r.summary as string) || null,
    content: (r.content as string) || null,
    proponent: (r.proponent as string) || null,
    source_title: (r.source_title as string) || null,
    source_url: (r.source_url as string) || null,
    source_type: (r.source_type as string) || null,
    origin: (r.origin as string) || null,
    tags: (r.tags as string[]) || [],
    upvotes: Number(r.upvotes ?? 0),
    created_at: (r.created_at as string) || null,
  }));

  const eventsFeed = events.map((r) => ({
    id: String(r.id),
    url: `${SITE}/events/${r.id}`,
    title: (r.title as string) || null,
    description: (r.description as string) || null,
    details: (r.details as string) || null,
    event_date: (r.event_date as string) || null,
    event_type: (r.event_type as string) || null,
    location: (r.location as string) || null,
    organizer: (r.organizer as string) || null,
    external_url: (r.url as string) || null,
  }));

  const articlesFeed = articles.map((r) => {
    const trialIds = ((r.related_trials as string[]) || []).filter((x) => trialIdSet.has(String(x)));
    const bibRefs = ((r.related_bibliography as string[]) || []).filter((x) => bibIdSet.has(String(x)));
    const symRefs = ((r.related_symbols as string[]) || []).filter((x) => symIdSet.has(String(x)));
    const protoRefs = ((r.related_protocols as string[]) || []).filter(Boolean);
    const citations = [
      ...trialIds.map((id) => `${SITE}/trials/${id}`),
      ...bibRefs.map((id) => `${SITE}/bibliography/${id}`),
      ...symRefs.map((id) => `${SITE}/registry/${id}`),
      ...protoRefs.map((s) => `${SITE}/protocols/${s}`),
    ];
    return {
      id: String(r.id),
      slug: String(r.slug || ""),
      url: `${SITE}/articles/${r.slug}`,
      title: (r.title as string) || null,
      dek: (r.dek as string) || null,
      body: (r.body_md as string) || "",
      author: (r.author as string) || null,
      published_at: (r.published_at as string) || null,
      updated_at: (r.updated_at as string) || null,
      topic_tags: (r.topic_tags as string[]) || [],
      compounds: (r.compounds as string[]) || [],
      license: "CC-BY-4.0",
      citations,
    };
  });

  const uniqSorted = (vals: (string | null | undefined)[]) =>
    Array.from(new Set(vals.filter((v): v is string => !!v && v.trim().length > 0))).sort();
  const contentTypeVocab = uniqSorted(items.map((i) => i.content_type));
  const authorityVocab = uniqSorted(items.map((i) => i.authority_type));
  const statusVocab = uniqSorted(trialItems.map((i) => i.status));
  const verificationVocab = uniqSorted(trialItems.map((i) => i.verification));
  const phaseVocab = uniqSorted(trialItems.map((i) => i.phase));

  const body = {
    version: "3.6",
    dateModified: new Date().toISOString().slice(0, 10),
    license: LICENSE,
    attribution: "DMT Code, https://dmtcode.com",
    key_policy: "Keys are omitted when the value is unknown. An absent key means unknown, not false or zero.",
    filters: {
      content_type: contentTypeVocab,
      compound: "substring match against item.compounds",
      topic: "substring match against item.topic",
      authority_type: authorityVocab,
      person: "substring match against item.people (see known names)",
      status: statusVocab,
      verification: verificationVocab,
      phase: phaseVocab,
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
      theories: theoriesFeed.length,
      events: eventsFeed.length,
      articles: articlesFeed.length,
    },
    items: filtered,
    symbols: symbolsFeed,
    theories: theoriesFeed,
    events: eventsFeed,
    articles: articlesFeed,
    faq: FAQ_ITEMS,
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
