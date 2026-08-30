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
  { group: "The project", q: "Is this a controlled experiment?", a: "No. Stage one, the public registry, is a screening collection, not a controlled experiment. It is open, self selected and unblinded, and priming is not ruled out, because people can browse other submissions before recording their own. All stage one can show is whether there is a hint of agreement worth digging into. Nothing here settles the question. Stage two is capture before exposure, where an account is recorded before the contributor sees the catalogue. Stage three is a randomized blinded arm with control conditions, blind scoring and pre registered hypotheses; it is designed and has not been run. Reports of seeing nothing are wanted and counted, and they are published at /null-reports." },
  { group: "The project", q: 'What is the "DMT code"?', a: "People who take N,N-DMT often report seeing structured visual forms, grids, glyphs, geometric symbols, and a smaller group describes something that reads almost like written characters. The DMT Code project collects those reports in one place so the overlaps can actually be measured instead of argued about. We are not claiming the forms are a message. We are asking a narrower question: do independent people, who have never spoken, keep drawing the same shapes?" },
  { group: "The project", q: "Is the code real? Are you saying reality is made of code?", a: "No. We hold that question open on purpose. Our job is to gather the observations, keep the method honest, and publish everything so anyone can judge for themselves. If the overlaps turn out to be coincidence or shared cultural imagery, the data should show that too. A result that cannot fail is not worth much, so we built this to be able to fail." },
  { group: "The project", q: "Is this a religion, or are you telling people what to believe?", a: "Neither. Nobody here is asking you to believe anything. Plenty of people who take this seriously think it will turn out to be pattern-matching or shared imagery, and that is a fine place to stand. We care about the observations and the method. What you conclude from them is yours." },
  { group: "The project", q: "What will I actually see? Does everyone see the same thing?", a: "We cannot promise you will see anything in particular, and honesty matters more than hype. Reports vary a lot. Some people describe grids or geometric forms, some describe symbols, and some see nothing they would call structured. The registry exists to find where those experiences genuinely overlap and where they do not, not to tell you what to expect." },
  { group: "The project", q: "Who is behind this and why should I trust it?", a: "Trust the method, not us. The reason to take this seriously is that it is open, it is falsifiable, and the counts are public, not that anyone here says so. We keep a neutral position, we never seed or fake a count, and we publish the parts that would let you prove us wrong." },
  { group: "Safety and law", q: "How do I do this safely?", a: "Start with the screening card. Before you consider anything, talk with a qualified prescriber about MAOIs, SSRIs and related medications, any cardiac history, and any personal or family history of psychosis. We deliberately do not publish medication timing windows. The sources disagree and getting it wrong can be dangerous, so that decision belongs with a clinician who knows your history. This is for adults 18 and older." },
  { group: "Safety and law", q: "Is this legal?", a: "The equipment we discuss is ordinary optical gear. We do not sell, source, or explain how to obtain any controlled substance, and nothing here is legal advice. Laws differ by country and state and they change. For your own situation, check your local law or a qualified professional." },
  { group: "Safety and law", q: "Is the laser safe for my eyes?", a: "A laser is not a toy. If you are unsure how to handle optical equipment safely, do not improvise with it." },
  { group: "The method and the data", q: "How do you stop people from just copying each other's answers?", a: "That is the whole design problem, and it is why the flagship is a blinded comparison. Wherever we can, people record what they saw before they see the existing catalogue, so a match means two strangers landed on the same form independently rather than one person nodding along to another. Convergence only counts when it is earned that way." },
  { group: "The method and the data", q: "What actually counts as a match?", a: "A symbol is not called a match because it looks vaguely similar. People compare specific forms, and a response is recorded when a reader says a form echoes something they saw. Because that reader has already viewed the form in this catalogue, the response measures recognition after exposure rather than an independent match. Every symbol shows its count, so you can weigh each one yourself." },
  { group: "The method and the data", q: "Can I see the raw data?", a: "Yes, all of it. The registry is public, the machine-readable corpus is at /dataset and /data.json, and it is all CC-BY-4.0, free to read, quote, and check. Every symbol shows how many people have recognized it. If something looks off, we would rather you find it." },
  { group: "The method and the data", q: "Can I add a symbol I saw myself?", a: "Yes. The registry is built from contributions. You can submit what you saw, add context to symbols others have logged, and take part in the comparison. That is how the dataset grows, and it is free to do." },
  { group: "The method and the data", q: "Can I download the whole dataset?", a: "Yes. The full corpus is at /data.json and /dataset under CC-BY-4.0, with an archived, citable version by DOI. Read it, quote it, run your own analysis, and tell us if we got something wrong." },
  { group: "Taking part and kits", q: "What do I need to get started?", a: "Everything is laid out on the prepare page, from the Solo kit for one observer up to the Circle kit for groups of up to six. The core is a verified 650 nm laser and the right diffraction optics, plus the free observation documents. You can also source every part yourself. We show the do-it-yourself total next to each kit so you know exactly what you are paying for." },
  { group: "Taking part and kits", q: "Why a 650nm laser?", a: "It is the specific red wavelength the observation protocol is built around, paired with the right optical density so it is used the same way each time. Consistent equipment is what lets one person's observation be compared against another's instead of guessing at the differences." },
  { group: "Taking part and kits", q: "Do I have to use DMT to take part?", a: "No. A lot of the work here is observation and comparison. You can browse the registry, add context to symbols other people have logged, and help judge where the forms actually converge without taking anything. The dataset gets stronger every time someone compares carefully." },
  { group: "Taking part and kits", q: "Do I have to buy a kit to take part?", a: "No. A kit gets you the equipment to run a careful observation of your own, but you can browse, contribute, and help judge convergence without spending anything. The kits make doing it well easier; they do not gate the project." },
  { group: "Taking part and kits", q: "Can my friends and I do this together?", a: "Yes, and it is often better that way. The Dual kit covers one to two observers, the Triad two to three, and the Circle up to six, so the instruments are shared and the per-person cost drops as the circle grows. The free group observation documents on the prepare page add the little structure that observing with other people asks for." },
  { group: "Taking part and kits", q: "What are your shipping and refund terms?", a: "US shipping is free, orders are processed within 2 business days and arrive within 7 to 10 business days, and you get tracking the moment a kit ships. Unopened kits can be returned within 30 days of delivery; opened laser modules cannot. If a component arrives damaged or not as described, email info@dmtcode.com within 7 days with photos and we replace it at no cost." },
];

interface UnifiedItem {
  id: string;
  content_type: string;
  title: string;
  url?: string;
  page_url?: string;
  doi?: string;
  compounds: string[];
  topic: string[];
  authority_type?: string;
  record_type?: string;
  relevance?: string;
  registry_id?: string;
  stance_score?: number;
  people: string[];
  status?: string;
  visibility_status?: string;
  moderation_status?: string;
  evidence_status?: string;
  review_overdue?: boolean;
  is_curated_example?: boolean;
  verification?: string;
  phase?: string;
  source_date?: string;
  online_publication_date?: string;
  issue_date?: string;
  publication_status?: string;
  relation_to_core_question?: string;
  record_class?: string;
  counts_toward_evidence?: boolean;
}

// Reference symbols are flagged by the is_curated_example column on
// symbol_submissions and by nothing else. Where an image happens to be hosted
// says nothing about who made it, so no image_url heuristic may classify a
// contributor's upload as an operator example.
const isCurated = (r: Record<string, unknown>): boolean =>
  r.is_curated_example === true;

// Overdue is never stored. It is derived at request time from moderation_status
// and review_due_at, so it can never go stale.
const isReviewOverdue = (r: Record<string, unknown>): boolean =>
  String(r.moderation_status ?? "") === "unreviewed" &&
  typeof r.review_due_at === "string" &&
  new Date(r.review_due_at as string).getTime() < Date.now();

function compact<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v;
  }
  return out as T;
}

// `optional` names columns that may not exist yet. Code deploys the moment it is
// pushed and a migration is applied by hand, so for a few minutes the export can
// ask for a column the database does not have. PostgREST answers a select naming
// an unknown column with 400 for the whole query, and this function used to turn
// any failure into an empty array, so on 2026-08-29 three not-yet-created columns
// removed all 236 bibliography records from /data.json. Dropping a whole table
// from the corpus is far worse than omitting three keys, and the export already
// says an absent key means unknown. So the optional columns are tried once and
// abandoned on failure, which makes the deploy order stop mattering.
async function fetchAll(
  table: string,
  select: string,
  filter = "",
  optional: string[] = []
): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  const pageSize = 1000;
  let from = 0;
  let cols = optional.length ? `${select},${optional.join(",")}` : select;
  let optionalDropped = false;
  // Cap pagination for safety.
  for (let i = 0; i < 10; i++) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=${cols}${filter ? `&${filter}` : ""}`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Range: `${from}-${from + pageSize - 1}`,
        "Range-Unit": "items",
        Accept: "application/json",
      },
    });
    if (!res.ok && !optionalDropped && optional.length) {
      optionalDropped = true;
      // Previously this dropped every optional column at once. That is how a
      // single never-created column (relation_to_core_question) silently removed
      // publication_status, online_publication_date and issue_date from all 236
      // bibliography rows for weeks: the export looked healthy and simply told
      // machines nothing. Probe each optional column once and keep the ones the
      // database actually has, so a missing column costs only itself.
      const usable: string[] = [];
      for (const col of optional) {
        try {
          const probe = await fetch(
            `${SUPABASE_URL}/rest/v1/${table}?select=${col}&limit=1`,
            {
              headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                Accept: "application/json",
              },
            },
          );
          if (probe.ok) usable.push(col);
        } catch (_e) {
          // treat an unreachable probe as unusable and carry on
        }
      }
      cols = usable.length ? `${select},${usable.join(",")}` : select;
      const missing = optional.filter((c) => !usable.includes(c));
      if (missing.length) {
        console.warn(`data-json: ${table} is missing optional columns ${missing.join(",")}, serving the rest`);
      }
      i--;
      continue;
    }
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
  const evidenceStatus = params.get("evidence_status");
  const moderationStatus = params.get("moderation_status");
  const verification = params.get("verification");
  const phase = params.get("phase");
  const stanceMin = params.get("stance_min");
  const stanceMax = params.get("stance_max");
  const hasFullText = params.get("has_full_text");
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
  if (evidenceStatus)
    out = out.filter((i) => (i.evidence_status || "").toLowerCase() === evidenceStatus.toLowerCase());
  if (moderationStatus)
    out = out.filter((i) => (i.moderation_status || "").toLowerCase() === moderationStatus.toLowerCase());
  if (verification)
    out = out.filter((i) => (i.verification || "").toLowerCase() === verification.toLowerCase());
  if (phase)
    out = out.filter((i) => (i.phase || "").toLowerCase().includes(phase.toLowerCase()));
  if (stanceMin != null)
    out = out.filter((i) => i.stance_score != null && i.stance_score >= parseInt(stanceMin, 10));
  if (stanceMax != null)
    out = out.filter((i) => i.stance_score != null && i.stance_score <= parseInt(stanceMax, 10));
  if (hasFullText != null)
    out = out.filter((i) => (i.has_full_text === true) === (hasFullText === "true"));
  if (q)
    out = out.filter((i) =>
      `${i.title} ${i.people.join(" ")} ${i.topic.join(" ")}`.toLowerCase().includes(q)
    );
  return out.slice(offset, offset + limit);
}

// Reaction counts come from symbol_votes, which is publicly readable. Returns
// null when the table cannot be read, so the caller omits the key rather than
// publishing a zero it cannot stand behind.
async function fetchVoteCounts(): Promise<Record<string, Record<string, number>> | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/symbol_votes?select=symbol_id,vote_type&limit=10000`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Record<string, unknown>[];
    const out: Record<string, Record<string, number>> = {};
    for (const r of rows) {
      const k = String(r.symbol_id);
      const t = String(r.vote_type);
      out[k] = out[k] ?? {};
      out[k][t] = (out[k][t] ?? 0) + 1;
    }
    return out;
  } catch (_e) {
    return null;
  }
}

export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  const [bib, trials, symbols, theories, events, articles, registryGlyphs, guides, retreats] = await Promise.all([
    fetchAll(
      "bibliography",
      "id,title,authors,journal,publication_date,doi,pmid,url,compounds,source,content_type,authority_type,stance_score,tags,featured,summary,source_date,is_approved,full_text,full_text_license",
      "is_approved=eq.true",
      ["online_publication_date", "issue_date", "publication_status", "relation_to_core_question"]
    ),
    fetchAll(
      "clinical_trials",
      "id,title,institution,organizer_lead,location,trial_type,phase,status,confirmed_status,application_url,url,notes,eligibility,created_at,compounds,record_type,relevance,trial_registry_id",
      "is_approved=is.true"
    ),
    // The status=eq.approved filter is retained because the row level security
    // policy on this table is expressed in terms of the legacy status column.
    // A database trigger keeps status and visibility_status in sync, so this is
    // the same set of rows as visibility_status=eq.public.
    // publication_consent=eq.true is required: this endpoint is the CC-BY-4.0
    // dataset export, and both llms.txt and the registry page state it contains
    // only records whose contributor granted publication consent. Display and
    // export are separate grants; the consent filter keeps that claim true.
    fetchAll(
      "symbol_submissions",
      "id,description,tags,status,visibility_status,moderation_status,evidence_status,is_curated_example,is_sober_baseline,published_at,review_due_at,upvotes,downvotes,image_url,created_at,updated_at,publication_consent,source_method,prior_exposure,wavelength",
      "status=eq.approved&publication_consent=eq.true"
    ),
    fetchAll(
      "theories",
      "id,title,summary,content,proponent,source_title,source_url,source_type,origin,tags,upvotes,created_at",
      "is_approved=eq.true",
      [
        "theory_class",
        "framework_originator",
        "applied_to_dmtcode_by",
        "directly_addresses_dmt_laser",
        "original_publication_year",
        "dmtcode_application_year",
        "primary_source",
      ]
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
    fetchAll(
      "registry_glyphs",
      "id,source,created_at,image_data,prior_exposure",
      "order=created_at.desc"
    ),
    fetchAll(
      "guides",
      "slug,question,short_answer,evidence_grade,what_supports,what_weakens,what_is_unknown,what_would_change,related_paths,last_reviewed,updated_at,sort_order",
      "is_published=eq.true"
    ),
    fetchAll(
      "retreats",
      "id,name,description,details,location,country,website_url,tags,next_start_date,next_end_date",
      "is_approved=eq.true"
    ),
  ]);

  const voteCounts = await fetchVoteCounts();

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
      page_url: `${SITE}/bibliography/${r.id}`,
      url: (r.url as string) || (r.doi ? `https://doi.org/${r.doi}` : `${SITE}/bibliography/${r.id}`),
      doi: (r.doi as string) || undefined,
      compounds: normalizeCompounds(r.compounds),
      topic: (r.tags as string[]) || [],
      authority_type: (r.authority_type as string) || undefined,
      stance_score: (r.stance_score as number) ?? undefined,
      people,
      source_date: (r.source_date as string) || (r.publication_date as string) || undefined,
      online_publication_date: (r.online_publication_date as string) || undefined,
      issue_date: (r.issue_date as string) || undefined,
      publication_status: (r.publication_status as string) || undefined,
      relation_to_core_question: (r.relation_to_core_question as string) || undefined,
      has_full_text: typeof r.full_text === "string" && (r.full_text as string).trim().length > 0,
      full_text_license: (r.full_text_license as string) || undefined,
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
    const rt = (r.record_type as string) || "";
    const isReg = rt === "registered_clinical_trial" || rt === "registered_trial";
    return compact<UnifiedItem>({
      id: `trial_${r.id}`,
      content_type: isReg ? "Trial" : "Experiment or report",
      title,
      page_url: `${SITE}/trials/${r.id}`,
      url: (r.application_url as string) || (r.url as string) || `${SITE}/trials/${r.id}`,
      compounds: (r.compounds as string[]) || [],
      topic: ((r.trial_type as string) ? [r.trial_type as string] : []),
      authority_type: isReg ? "Clinical" : (rt === "media_claim" || rt === "rumored_report" ? "Media" : "Community"),
      record_type: rt || undefined,
      relevance: (r.relevance as string) || undefined,
      registry_id: (r.trial_registry_id as string) || undefined,
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
    page_url: `${SITE}/registry/${r.id}`,
    url: `${SITE}/registry/${r.id}`,
    compounds: [],
    topic: (r.tags as string[]) || [],
    authority_type: isCurated(r) ? "Curated" : "Community",
    people: [],
    status: (r.status as string) || undefined,
    visibility_status: (r.visibility_status as string) || undefined,
    moderation_status: (r.moderation_status as string) || undefined,
    evidence_status: (r.evidence_status as string) || undefined,
    review_overdue: isReviewOverdue(r),
    is_curated_example: isCurated(r),
    source_date: (r.created_at as string) || undefined,
    record_class: isCurated(r) ? "curated_starter" : "community_observation",
    counts_toward_evidence: isCurated(r) ? false : true,
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
    page_url: `${SITE}/articles/${r.slug}`,
    url: `${SITE}/articles/${r.slug}`,
    compounds: (r.compounds as string[]) || [],
    topic: (r.topic_tags as string[]) || [],
    authority_type: "Editorial",
    people: (r.author as string) ? [String(r.author)] : [],
    source_date: (r.published_at as string) || (r.updated_at as string) || undefined,
  }));

  const items = [...bibItems, ...trialItems, ...symbolItems, ...articleItems];

  const filtered = applyFilters(items, url.searchParams);

  // Top-level "symbols" projection: every published symbol with the fields
  // agents most need without re-querying. "faq" mirrors the live /faq page.
  const symbolsFeed = symbols.map((r) => {
    const sid = String(r.id);
    return compact({
      id: sid,
      url: `${SITE}/registry/${sid}`,
      description: (r.description as string) || undefined,
      tags: (r.tags as string[]) || [],
      image_url: (r.image_url as string) || undefined,
      visibility_status: (r.visibility_status as string) || undefined,
      moderation_status: (r.moderation_status as string) || undefined,
      evidence_status: (r.evidence_status as string) || undefined,
      is_curated_example: isCurated(r),
      is_sober_baseline: (r as Record<string, unknown>).is_sober_baseline === true,
      published_at: (r.published_at as string) || undefined,
      review_due_at: (r.review_due_at as string) || undefined,
      review_overdue: isReviewOverdue(r),
      recognized_count: Number(r.upvotes ?? 0),
      not_a_match_count: Number(r.downvotes ?? 0),
      upvote_count: voteCounts ? (voteCounts[sid]?.upvote ?? 0) : undefined,
      created_at: (r.created_at as string) || undefined,
      updated_at: (r.updated_at as string) || undefined,
      record_class: isCurated(r) ? "curated_starter" : "community_observation",
      counts_toward_evidence: isCurated(r) ? false : true,
      // These three were tallied in corpus_composition but never published on the
      // records themselves, which made the site's single most load-bearing number
      // impossible to check: records_declaring_650nm_laser over records_total is
      // built on source_method, and source_method appeared nowhere in the export.
      // A denominator a reader cannot audit is an assertion, not a denominator.
      // Emitted as an explicit "not_stated" rather than omitted, because a missing
      // key reads as "no value exists" and the honest reading is "nobody asked".
      source_method: (r.source_method as string) || "not_stated",
      prior_exposure: (r.prior_exposure as string) || "not_stated",
      wavelength: (r.wavelength as string) || "not_stated",
    });
  });

  const theoriesFeed = theories.map((r) => compact({
    id: String(r.id),
    url: `${SITE}/theories/${theorySlug(String((r.title as string) || ""))}`,
    title: (r.title as string) || undefined,
    summary: (r.summary as string) || undefined,
    content: (r.content as string) || undefined,
    // proponent is retained for compatibility and is deliberately ambiguous: it
    // mixed the person who built the framework with the person who pointed it at
    // this phenomenon. The two fields below separate them. Read those.
    proponent: (r.proponent as string) || undefined,
    theory_class: (r.theory_class as string) || undefined,
    framework_originator: (r.framework_originator as string) || undefined,
    applied_to_dmtcode_by: (r.applied_to_dmtcode_by as string) || undefined,
    directly_addresses_dmt_laser: typeof r.directly_addresses_dmt_laser === "boolean"
      ? (r.directly_addresses_dmt_laser as boolean)
      : undefined,
    original_publication_year: (r.original_publication_year as number) ?? undefined,
    dmtcode_application_year: (r.dmtcode_application_year as number) ?? undefined,
    primary_source: (r.primary_source as string) || undefined,
    source_title: (r.source_title as string) || undefined,
    source_url: (r.source_url as string) || undefined,
    source_type: (r.source_type as string) || undefined,
    origin: (r.origin as string) || undefined,
    tags: (r.tags as string[]) || [],
    upvotes: Number(r.upvotes ?? 0),
    created_at: (r.created_at as string) || undefined,
  }));

  const eventsFeed = events.map((r) => compact({
    id: String(r.id),
    url: `${SITE}/events/${r.id}`,
    title: (r.title as string) || undefined,
    description: (r.description as string) || undefined,
    details: (r.details as string) || undefined,
    event_date: (r.event_date as string) || undefined,
    event_type: (r.event_type as string) || undefined,
    location: (r.location as string) || undefined,
    organizer: (r.organizer as string) || undefined,
    external_url: (r.url as string) || undefined,
  }));

  const retreatsFeed = retreats.map((r) => compact({
    id: String(r.id),
    url: `${SITE}/retreats/${r.id}`,
    name: (r.name as string) || undefined,
    description: (r.description as string) || undefined,
    details: (r.details as string) || undefined,
    location: (r.location as string) || undefined,
    country: (r.country as string) || undefined,
    website_url: (r.website_url as string) || undefined,
    tags: (r.tags as string[]) || [],
    next_start_date: (r.next_start_date as string) || undefined,
    next_end_date: (r.next_end_date as string) || undefined,
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
    return compact({
      id: String(r.id),
      slug: String(r.slug || ""),
      url: `${SITE}/articles/${r.slug}`,
      title: (r.title as string) || undefined,
      dek: (r.dek as string) || undefined,
      body: (r.body_md as string) || "",
      author: (r.author as string) || undefined,
      published_at: (r.published_at as string) || undefined,
      updated_at: (r.updated_at as string) || undefined,
      topic_tags: (r.topic_tags as string[]) || [],
      compounds: (r.compounds as string[]) || [],
      license: "CC-BY-4.0",
      citations,
    });
  });

  const registryGlyphsFeed = registryGlyphs
    .filter((r) => typeof r.image_data === "string" && (r.image_data as string).length > 0)
    .map((r) => compact({
      id: String(r.id),
      source: (r.source as string) || undefined,
      prior_exposure: typeof r.prior_exposure === "boolean" ? (r.prior_exposure ? "exposed" : "naive") : undefined,
      created_at: (r.created_at as string) || undefined,
    }));

  const nonEmptyArray = (v: unknown) =>
    Array.isArray(v) && v.length > 0 ? v : undefined;

  const guidesFeed = guides.map((r) => compact({
    slug: String(r.slug || ""),
    url: `${SITE}/guides/${r.slug}`,
    question: (r.question as string) || undefined,
    short_answer: (r.short_answer as string) || undefined,
    evidence_grade: (r.evidence_grade as string) || undefined,
    what_supports: nonEmptyArray(r.what_supports),
    what_weakens: nonEmptyArray(r.what_weakens),
    what_is_unknown: nonEmptyArray(r.what_is_unknown),
    what_would_change: nonEmptyArray(r.what_would_change),
    related_paths: nonEmptyArray(r.related_paths),
    last_reviewed: (r.last_reviewed as string) || undefined,
    updated_at: (r.updated_at as string) || undefined,
  }));

  const uniqSorted = (vals: (string | null | undefined)[]) =>
    Array.from(new Set(vals.filter((v): v is string => !!v && v.trim().length > 0))).sort();
  const contentTypeVocab = uniqSorted([...items.map((i) => i.content_type), "Article"]);
  const authorityVocab = uniqSorted(items.map((i) => i.authority_type));
  const statusVocab = uniqSorted(trialItems.map((i) => i.status));
  const verificationVocab = uniqSorted(trialItems.map((i) => i.verification));
  const phaseVocab = uniqSorted(trialItems.map((i) => i.phase));

  // Corpus composition. counts.symbols says how many records exist; on its own it
  // invites the reading that all of them are observations of the 650 nm laser
  // protocol, and they are not. Of the published symbols only a minority declare
  // that method, prior_exposure was not asked before 2026-08-26 so the naive
  // versus already-exposed split is unknown for every earlier record, and there
  // are no sober baselines yet. Priming is the strongest ordinary explanation for
  // convergence, so a record that cannot say whether its author had already seen
  // the catalogue cannot be weighed on that question. Derived on every request,
  // so it cannot drift from the rows above it.
  const tally = (rows: Record<string, unknown>[], field: string) => {
    const out: Record<string, number> = {};
    for (const r of rows) {
      const v = r[field];
      const k = v === null || v === undefined || v === "" ? "not_stated" : String(v);
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  };
  const glyphRows = registryGlyphs.filter((r) => typeof r.image_data === "string" && (r.image_data as string).length > 0);
  const symbolsLaser = symbols.filter((r) => String(r.source_method ?? "") === "laser_650nm").length;
  const glyphsLaser = glyphRows.filter((r) => String(r.source ?? "") === "650nm_laser").length;
  const corpusComposition = {
    note: "What these records are, not just how many. Read this before treating any total here as evidence about the 650 nm laser protocol.",
    symbols: {
      total: symbols.length,
      by_source_method: tally(symbols, "source_method"),
      prior_exposure_recorded: symbols.filter((r) => r.prior_exposure !== null && r.prior_exposure !== undefined && r.prior_exposure !== "").length,
      sober_baseline: symbols.filter((r) => r.is_sober_baseline === true).length,
      wavelength_recorded: symbols.filter((r) => r.wavelength !== null && r.wavelength !== undefined && r.wavelength !== "").length,
    },
    registry_glyphs: {
      total: glyphRows.length,
      by_source: tally(glyphRows, "source"),
      prior_exposure_recorded: glyphRows.filter((r) => typeof r.prior_exposure === "boolean").length,
      naive: glyphRows.filter((r) => r.prior_exposure === false).length,
      already_exposed: glyphRows.filter((r) => r.prior_exposure === true).length,
    },
    // The same problem one level up. counts.bibliography says 236, and a corpus of
    // 236 sources reads as a body of evidence for the laser claim until you can see
    // how little of it is about the laser claim. Most of it is real psychedelic
    // literature that bears on other questions entirely, which is why every record
    // now carries relation_to_core_question and why the tally is published beside
    // the total rather than left for a reader to compute.
    bibliography: {
      total: bib.length,
      by_relation_to_core_question: tally(bib, "relation_to_core_question"),
      relation_recorded: bib.filter((r) => typeof r.relation_to_core_question === "string" && (r.relation_to_core_question as string).length > 0).length,
    },
    theories: {
      total: theories.length,
      by_theory_class: tally(theories, "theory_class"),
      // A framework borrowed from another field is not a claim anyone made about
      // this phenomenon. Jung, Wheeler and Hoffman never wrote about a laser.
      directly_addresses_dmt_laser: theories.filter((r) => r.directly_addresses_dmt_laser === true).length,
      applied_by_dmtcode_editors: theories.filter((r) => String(r.applied_to_dmtcode_by ?? "") === "DMT Code editors").length,
    },
    records_declaring_650nm_laser: symbolsLaser + glyphsLaser,
    records_total: symbols.length + glyphRows.length,
    prior_exposure_note: "The submission wizard has required prior_exposure since 2026-08-26. Records created before that date were never asked, which is why the field is absent rather than false on them.",
    reading_guide: "records_declaring_650nm_laser over records_total is the denominator for any claim about the laser protocol specifically. A record whose source_method is not_stated is an account of a DMT experience, not a declared laser observation.",
  };

  const symbolsCurated = symbols.filter((r) => isCurated(r)).length;
  const symbolsCommunity = symbols.length - symbolsCurated;
  const symbolsReviewOverdue = symbols.filter((r) => isReviewOverdue(r)).length;
  const symbolsUnreviewed = symbols.filter(
    (r) => String(r.moderation_status ?? "") === "unreviewed",
  ).length;
  const bibliographyWithFullText = bib.filter(
    (r) => typeof r.full_text === "string" && (r.full_text as string).trim().length > 0,
  ).length;

  // Published verbatim from the column comments on symbol_submissions so the
  // export and the database can never drift apart in what they claim a field means.
  const FIELD_DEFINITIONS: Record<string, string> = {
    page_url: "The absolute URL of this record's own detail page on dmtcode.com. The id field carries a prefix, for example bib_<uuid>, that is not part of any URL, and the url field may point at an external source or a DOI. page_url is the on-site page and is always safe to follow.",
    status: "LEGACY. Kept because row level security policies and existing queries depend on it. It is now kept in sync with visibility_status by the sync_symbol_submission_status trigger. New code should read visibility_status, moderation_status and evidence_status instead.",
    visibility_status: "Who can see this row. private = only the author. public = published and readable by anyone. hidden = withdrawn from public view but never deleted.",
    moderation_status: "What a human moderator has actually done. unreviewed = nobody has looked at it yet. reviewed = a moderator looked and let it stand. denied = a moderator rejected it. reported = a reader flagged it and it awaits a decision. There is deliberately no stored overdue value. Overdue is derived as moderation_status = unreviewed and review_due_at < now(), so it can never go stale.",
    evidence_status: "How this row may be used as evidence. raw = an observer report with nothing established about it. eligible = meets the criteria to enter convergence analysis. ineligible = excluded from convergence analysis, for example a curated example that is not an observer submission. candidate_match = resembles another record and awaits assessment. reviewed_convergence = a reviewer has assessed the match. controlled_replication = arose from a controlled, blinded protocol. Being published does not change this field.",
    published_at: "When the row first became publicly visible. Null means it has never been public. Never backfilled with a guess.",
    review_due_at: "published_at plus 72 hours. The deadline by which a moderator was meant to look at it. Null where no review clock applies.",
    review_overdue: "Computed at request time, never stored. True when moderation_status is unreviewed and review_due_at is in the past. A symbol nobody reviewed inside the window is overdue, not approved.",
    relation_to_core_question: "On a bibliography record: how the source relates to the convergence claim, not how strong the source is. direct_test = it tests or attempts to falsify the claim or the 650 nm protocol itself. mechanistic = it proposes or evidences a mechanism that could produce recurring visual FORM. phenomenological_baseline = it describes what the experience contains as people report it. comparison_condition = a non-DMT state producing comparable visuals, which bears on whether the forms are specific to this protocol. methodological = how to run, blind, score or report such research. historical = the documented record and lineage of this specific claim. adjacent = real psychedelic literature that does not bear on the question. adjacent is the default and is the correct answer for most of this corpus. Read the by_relation_to_core_question tally in corpus_composition before treating the bibliography total as a body of evidence for the claim.",
    theory_class: "What kind of claim a theory makes, ordered by what it would take to support it. deflationary = the forms come from the observer or the apparatus and nothing external is required. neurocognitive = a brain mechanism produces the recurring structure. psychological = a shared feature of mind, not of the world. phenomenological = a description of the structure of the experience with no cause claimed. ontological = the forms indicate something real outside the observer. metaphysical = a claim about the nature of reality itself. cultural_historical = the forms situated in a human record.",
    framework_originator: "Who built the framework, in its own context and usually for another purpose entirely. The legacy proponent field mixed this person with the next one, which let a borrowed framework read as though its author had endorsed this phenomenon.",
    applied_to_dmtcode_by: "Who pointed the framework at the 650 nm laser phenomenon. DMT Code editors means this site made the connection and the originator did not.",
    directly_addresses_dmt_laser: "True only where the source material is itself about this phenomenon. False for a framework borrowed from another field. Jung, Wheeler and Hoffman never wrote about a laser.",
    original_publication_year: "The year the framework was FIRST published, which for several is decades before the edition cited in source_title. Null where it could not be established from a source that was actually checked.",
    dmtcode_application_year: "The year this site started carrying the framework. Derived from the row's own created_at, never typed.",
    primary_source: "A DOI, publisher page or institutional record for the framework, where one has been established. Wikipedia is not a primary source for a framework its author published elsewhere, and several theories still carry a Wikipedia source_url. source_url is left unchanged and may be secondary; primary_source is what a citation should use where it is present. Count how many records actually carry it before relying on it: a defined field is not a populated one.",
    is_curated_example: "True for illustrative examples added by the site operator. These are not observer submissions and are excluded from evidence and convergence totals.",
    is_sober_baseline: "True when the contributor marked the session as a sober baseline run: the full rig, no substance.",
    recognized_count: "How many signed in readers pressed the seen it control on this symbol after the symbol was already visible on this site. This is post exposure recognition. It is not an independent match, it is not a replication, and it must never be read as one. The only field that can ever indicate independence is evidence_status.",
    not_a_match_count: "How many signed in readers recorded that this symbol does not resemble what they saw. It is published for completeness. It does not hide the symbol and it does not change where the symbol sits in any default browse order.",
    upvote_count: "How many signed in readers pressed the older generic upvote control. It is a popularity signal only and carries no evidential weight. The key is omitted when the vote table could not be read.",
    record_class: "curated_starter = added by the site operator as an illustrative example. community_observation = submitted by an account holder reporting their own experience.",
    counts_toward_evidence: "False for curated examples, true for observer submissions. This field says whether the row may enter a convergence count at all. It says nothing about whether the row has been reviewed.",
    has_full_text: "True when this record carries the article's full text on its detail page at /bibliography/{id}, where it is also emitted in the JSON-LD text property so it can be quoted directly. Full text is only ever stored for sources published under CC BY or CC0, and the required attribution travels inside the text itself.",
    full_text_license: "The licence the full text was published under, as reported by the source at the time of retrieval. Null when no full text is stored. Records under non-commercial or ShareAlike licences are deliberately not ingested, because this dataset is redistributed under CC-BY-4.0.",
  };

  const body = {
    version: "4.1",
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
      evidence_status: "raw, eligible, ineligible, candidate_match, reviewed_convergence, controlled_replication. Symbols only.",
      moderation_status: "unreviewed, reviewed, denied, reported. Symbols only.",
      verification: verificationVocab,
      phase: phaseVocab,
      stance_min: "integer, inclusive lower bound",
      stance_max: "integer, inclusive upper bound",
      has_full_text: "true or false. Filters bibliography rows on whether the row carries full text on its detail page at /bibliography/{id}.",
      q: "free text over title, people, topic",
      limit: "max 10000, default 5000",
      offset: "pagination offset",
    },
    known_people: KNOWN_PEOPLE,
    field_definitions: FIELD_DEFINITIONS,
    dataset_version_note: "Version 4.1 adds visibility_status, moderation_status, evidence_status, is_curated_example, published_at, review_due_at and review_overdue to every symbol, and replaces the symbols[].upvotes key with recognized_count, not_a_match_count and upvote_count. The old upvotes key stored the seen it tally rather than the upvote tally, which made it easy to misread. Read field_definitions before treating any count here as evidence.",
    counts: {
      total: items.length,
      returned: filtered.length,
      bibliography: bibItems.length,
      bibliography_with_full_text: bibliographyWithFullText,
      trials: trialItems.length,
      symbols: symbolItems.length,
      symbols_community: symbolsCommunity,
      symbols_curated: symbolsCurated,
      symbols_unreviewed: symbolsUnreviewed,
      symbols_review_overdue: symbolsReviewOverdue,
      theories: theoriesFeed.length,
      events: eventsFeed.length,
      articles: articlesFeed.length,
      registry_glyphs: registryGlyphsFeed.length,
      guides: guidesFeed.length,
      retreats: retreatsFeed.length,
    },
    items: filtered,
    symbols: symbolsFeed,
    theories: theoriesFeed,
    events: eventsFeed,
    articles: articlesFeed,
    registry_glyphs: registryGlyphsFeed,
    guides: guidesFeed,
    retreats: retreatsFeed,
    guides_note: "Canonical answer pages. Each guide states a short answer plus the structured evidence for and against it, what is still unknown, and what would change the answer. Keys are omitted when empty.",
    registry_glyphs_note: "Anonymous drawn glyph reports. Image data is viewable on the site at /registry but is not included in this export.",
    corpus_composition: corpusComposition,
    object_model_note: "How to read the two symbol counts. symbols[] are account backed symbol_submissions, one public symbol record per submission (counts.symbols). registry_glyphs[] are anonymous drawn glyph reports from the quick capture tool, no account, a separate table (counts.registry_glyphs). They never overlap and are never summed. Object model: observation (one person's experience) -> artifact (drawing, voice, text, field map) -> glyph instance (one discrete form) -> public symbol record (a glyph exposed in the registry) -> motif cluster (possibly related instances) -> canonical symbol candidate (reviewed abstraction of a recurring motif) -> sequence (reported relation between symbols). The seven levels are defined in full, with worked examples and the reason the two counts differ, at https://dmtcode.com/object-model.",
    object_model_url: "https://dmtcode.com/object-model",
    publication_dates_note: "source_date is the date the record carries, which for a journal article is usually the issue date. An issue date can sit months after the day the paper became readable, so a source_date in the future does not mean the work is unavailable. The fields that resolve this are publication_status (published, online_ahead_of_print, forthcoming, preprint), online_publication_date and issue_date, and where they are present they were verified against Crossref rather than inferred. They are not yet populated on every row that needs them: future_dated_without_status below counts the rows where the gap exists and the status has not been recorded. An absent key means nobody has established the value, not that there is no gap.",
    future_dated_without_status: bib.filter(
      (r) =>
        String(r.source_date ?? r.publication_date ?? "") > new Date().toISOString().slice(0, 10) &&
        !r.publication_status,
    ).length,
    trials_note: "items[] with content_type Trial and authority_type Clinical are registered clinical trials with a registry_id. Community experiments, pilot reports, platform projects, media claims and rumours from the same table carry content_type Experiment or report, a record_type, and authority_type Community or Media. Do not describe those as clinical trials.",
    equipment_note: "Goler's 2025 paper (DOI 10.59973/ipil.158) reports a 650 nm Class 2 laser at 1 mW. The kits in /shop.json use pointers the vendor rates at 5 mW, FDA Class IIIa (Class 3R), a later community adaptation that is not the paper's configuration; read shop.json bundles[].emitters for per emitter ratings.",
    symbols_note: "Symbols with is_curated_example true were added by the site operator as illustrative examples. They are not observer submissions and they are excluded from every evidence and convergence total. Publication on this site is immediate and does not mean a moderator has reviewed the symbol. Read moderation_status and review_overdue before describing anything here as reviewed, and read field_definitions before treating any count as evidence.",
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
