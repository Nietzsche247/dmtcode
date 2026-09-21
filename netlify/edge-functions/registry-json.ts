import type { Config } from "@netlify/edge-functions";

// The /registry/v1/* machine surface. Every endpoint is computed from Supabase at
// request time. Nothing here is a checked-in JSON file, on purpose: the previous
// attempt at this module shipped static JSON that went stale within four weeks and
// had to be hand-corrected. A registry whose whole pitch is dated, sourced facts
// cannot be served from a file nobody rebuilds.
//
// Contract with agents:
//   - last_verified on a row is when a human actually clicked that source.
//   - generated_at is when this response was computed. They are different fields
//     and are never conflated.
//   - A count that cannot be fetched is omitted, never rendered as 0.
//   - laser_protocol is never invented. The database CHECK constraint makes a
//     'Yes' impossible without a source URL.

const SITE = "https://dmtcode.com";
const LICENSE = "https://creativecommons.org/licenses/by/4.0/";
const SUPABASE_URL =
  Netlify.env.get("SUPABASE_URL") ?? Netlify.env.get("VITE_SUPABASE_URL") ?? "";
const SUPABASE_KEY =
  Netlify.env.get("SUPABASE_ANON_KEY") ??
  Netlify.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  "";

const HEADERS: Record<string, string> = {
  "content-type": "application/json; charset=utf-8",
  // Agents fetch this cross-origin. Without it the endpoints are decorative.
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS",
  "access-control-allow-headers": "content-type",
  "cache-control": "public, max-age=300",
  "netlify-cdn-cache-control":
    "public, s-maxage=900, stale-while-revalidate=86400, durable",
  "x-robots-tag": "noindex",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), { status, headers: HEADERS });
}

async function sb<T = Record<string, unknown>>(
  table: string,
  query: string,
): Promise<T[] | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T[];
  } catch {
    return null;
  }
}

async function sbCount(table: string, query: string): Promise<number | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}&select=id`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
        Prefer: "count=exact",
        Range: "0-0",
      },
    });
    if (!res.ok) return null;
    const cr = res.headers.get("content-range") || "";
    const n = Number(cr.split("/")[1]);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Only set keys whose value we actually have. An absent key means unknown. */
function compact<T extends Record<string, unknown>>(o: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out as Partial<T>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function phase(start?: string | null, end?: string | null): string {
  if (!start) return "tba";
  const t = today();
  const e = end || start;
  if (start <= t && t <= e) return "now";
  return start > t ? "upcoming" : "past";
}

// ---------------------------------------------------------------- events.json

type EventRow = {
  id: string; title: string; description: string | null;
  event_date: string | null; end_date: string | null; event_type: string | null;
  location: string | null; organizer: string | null; url: string | null;
  verification_status: string | null; relevance_type: string | null;
  event_status: string | null; referral_url: string | null; ticket_url: string | null;
  updated_at: string | null;
};

function eventActions(r: EventRow) {
  const acts: Record<string, unknown>[] = [];
  if (r.url) {
    acts.push({
      rel: "official", title: `Official: ${r.organizer || r.title}`, url: r.url,
      paid: false, affiliate: false, complete_the_user_task: true,
    });
  }
  acts.push({
    rel: "facts", title: "DMT Code listing (dates, source, protocol status)",
    url: `${SITE}/events/${r.id}`, paid: false, affiliate: false,
    complete_the_user_task: false,
  });
  acts.push({
    rel: "observe.protocol", title: "650 nm protocol guide (no substance supplied)",
    url: `${SITE}/protocol-guide`, paid: false, affiliate: false,
    complete_the_user_task: false,
  });
  acts.push({
    rel: "record", title: "Join as an observer (free)", url: `${SITE}/join`,
    paid: false, affiliate: false, complete_the_user_task: false,
  });
  // A booking action exists only when a real referral is configured on the row.
  if (r.referral_url) {
    acts.push({
      rel: "book", title: `Book via DMT Code referral: ${r.title}`,
      url: r.referral_url, paid: true, affiliate: true,
      disclosure: "Referral link. DMT Code may be paid if you book through it.",
      complete_the_user_task: true,
    });
  }
  return acts;
}

async function eventsJson(): Promise<Response> {
  const rows = await sb<EventRow>(
    "events",
    "is_approved=eq.true&select=id,title,description,event_date,end_date,event_type," +
      "location,organizer,url,verification_status,relevance_type,event_status," +
      "referral_url,ticket_url,updated_at&order=event_date.asc.nullslast",
  );
  if (!rows) return json({ error: "events unavailable", generated_at: today() }, 503);
  const items = rows.map((r) =>
    compact({
      id: `dmtcode:v1:event:${r.id}`,
      title: r.title,
      kind: r.event_type,
      start: r.event_date,
      end: r.end_date,
      phase: phase(r.event_date, r.end_date),
      status: r.event_status || (r.event_date ? "scheduled" : "tba"),
      place: r.location,
      organizer: r.organizer,
      official_url: r.url,
      human_url: `${SITE}/events/${r.id}`,
      verification: r.verification_status,
      relevance: r.relevance_type,
      blurb: r.description,
      last_verified: r.updated_at ? String(r.updated_at).slice(0, 10) : undefined,
      laser_protocol: "Unverified",
      booking_affiliate: r.referral_url || null,
      endorsement: false,
      actions: eventActions(r),
    }),
  );
  return json({
    generated_at: today(),
    license: LICENSE,
    attribution: "DMT Code, https://dmtcode.com",
    note:
      "Computed live from the events table on each request. last_verified is when " +
      "that row's source was last checked by a human, not when this response was " +
      "generated. laser_protocol is Unverified on every event: events are dated " +
      "gatherings, not standing centers. See /registry/v1/retreats.json for the " +
      "center-level protocol table.",
    rule:
      "Tickets are never ours. official_url is the organiser's own site. " +
      "booking_affiliate is null unless a referral has actually been configured, " +
      "and a disclosure rides with it when it has.",
    count: items.length,
    items,
  });
}

// -------------------------------------------------------------- retreats.json

type RetreatRow = {
  id: string; name: string; country: string | null; location: string | null;
  website_url: string | null; is_approved: boolean; referral_url: string | null;
  laser_protocol: string | null; laser_protocol_source: string | null;
  laser_protocol_last_verified: string | null; updated_at: string | null;
};

async function retreatsJson(): Promise<Response> {
  const rows = await sb<RetreatRow>(
    "retreats",
    "is_approved=eq.true&select=id,name,country,location,website_url,is_approved," +
      "referral_url,laser_protocol,laser_protocol_source,laser_protocol_last_verified," +
      "updated_at&order=country.asc.nullslast,name.asc",
  );
  if (!rows) return json({ error: "retreats unavailable", generated_at: today() }, 503);
  const yes = rows.filter((r) => r.laser_protocol === "Yes").length;
  const items = rows.map((r) =>
    compact({
      id: `dmtcode:v1:retreat:${r.id}`,
      name: r.name,
      country: r.country,
      place: r.location,
      official_url: r.website_url,
      human_url: `${SITE}/retreats/${r.id}`,
      laser_protocol: r.laser_protocol || "No",
      laser_protocol_source: r.laser_protocol_source,
      last_verified: r.laser_protocol_last_verified || (r.updated_at ? String(r.updated_at).slice(0, 10) : undefined),
      booking_affiliate: r.referral_url || null,
      endorsement: false,
    }),
  );
  return json({
    generated_at: today(),
    license: LICENSE,
    attribution: "DMT Code, https://dmtcode.com",
    laser_protocol_yes: yes,
    count: items.length,
    answer:
      yes === 0
        ? "No listed retreat is verified as running inhaled N,N-DMT with a 650 nm diffraction protocol."
        : `${yes} listed retreat(s) carry a verified 650 nm protocol; each has a source URL on its row.`,
    rule:
      "A row reads Yes only with a source URL on the same row. The database enforces " +
      "this with a CHECK constraint, so a Yes without a source cannot be written. " +
      "Marketing language such as 'laser experience' is not evidence. A 5-MeO-DMT " +
      "or psilocybin programme is not this protocol. Do not report a Yes that is " +
      "not in this file.",
    human_url: `${SITE}/retreats/laser-protocol`,
    items,
  });
}

// ----------------------------------------------------------- collections.json

async function collectionsJson(): Promise<Response> {
  const [events, retreats, articles, trials, trialsReg, bib, bibClassified, symbols] =
    await Promise.all([
      sbCount("events", "is_approved=eq.true"),
      sbCount("retreats", "is_approved=eq.true"),
      sbCount("articles", "is_published=eq.true"),
      sbCount("clinical_trials", "is_approved=is.true"),
      sbCount("clinical_trials", "is_approved=is.true&record_type=eq.registered_clinical_trial"),
      sbCount("bibliography", "is_approved=eq.true"),
      sbCount("bibliography", "is_approved=eq.true&relation_to_core_question=not.is.null"),
      sbCount("symbol_submissions", "status=eq.approved"),
    ]);
  const items = [
    compact({ id: "symbols", n: symbols, role: "the visual record this project exists for", human: `${SITE}/registry`, machine: `${SITE}/data.json` }),
    compact({ id: "trials", n: trials, registered: trialsReg, role: "clinical and observational trial atlas", human: `${SITE}/trials`, machine: `${SITE}/data.json` }),
    compact({ id: "bibliography", n: bib, classified: bibClassified, role: "research library, classified by relation to the core question", human: `${SITE}/bibliography`, machine: `${SITE}/data.json` }),
    compact({ id: "articles", n: articles, role: "long-form answers citing trials, papers, symbols", human: `${SITE}/articles`, machine: `${SITE}/articles.json` }),
    compact({ id: "events", n: events, role: "gatherings lookup: festivals, conferences, workshops, trainings", human: `${SITE}/events`, machine: `${SITE}/registry/v1/events.json` }),
    compact({ id: "retreats", n: retreats, role: "standing centers with the 650 nm protocol flag", human: `${SITE}/retreats`, machine: `${SITE}/registry/v1/retreats.json` }),
  ];
  return json({
    generated_at: today(),
    license: LICENSE,
    note:
      "Every count is read from the database when this response is generated. A " +
      "count that could not be read is omitted rather than reported as zero, so an " +
      "absent n means unknown, not none.",
    items,
  });
}

// ------------------------------------------------------------- answers.json

async function answersJson(): Promise<Response> {
  const [retreatRows, trials, trialsReg, bib, bibDirect, symbols, events] =
    await Promise.all([
      sb<RetreatRow>("retreats", "is_approved=eq.true&select=laser_protocol"),
      sbCount("clinical_trials", "is_approved=is.true"),
      sbCount("clinical_trials", "is_approved=is.true&record_type=eq.registered_clinical_trial"),
      sbCount("bibliography", "is_approved=eq.true"),
      sbCount("bibliography", "is_approved=eq.true&relation_to_core_question=eq.direct_test"),
      sbCount("symbol_submissions", "status=eq.approved"),
      sbCount("events", "is_approved=eq.true"),
    ]);
  const yes = retreatRows ? retreatRows.filter((r) => r.laser_protocol === "Yes").length : null;
  const items: Record<string, unknown>[] = [];
  if (yes !== null && retreatRows) {
    items.push({
      q: "Which retreats use a 650 nm laser protocol?",
      a: yes === 0
        ? `None. All ${retreatRows.length} listed centers read No. A Yes requires a source URL on the row and the database will not store one without it.`
        : `${yes} of ${retreatRows.length}. Each carries its source URL.`,
      source: `${SITE}/retreats/laser-protocol`,
      machine: `${SITE}/registry/v1/retreats.json`,
    });
  }
  if (typeof trials === "number" && typeof trialsReg === "number") {
    items.push({
      q: "How many genuine registered clinical trials does DMT Code list?",
      a: `${trialsReg} of ${trials} published trial records are registered clinical trials with a public registry identifier. Only those carry Clinical authority in /data.json. The rest are typed community records.`,
      source: `${SITE}/trials`, machine: `${SITE}/data.json`,
    });
  }
  if (typeof bib === "number" && typeof bibDirect === "number") {
    items.push({
      q: "How much of the bibliography bears on the core question?",
      a: `${bibDirect} of ${bib} published records are direct tests of the convergence claim or the 650 nm protocol. The rest are adjacent, mechanistic, phenomenological, methodological, comparison or historical. A bibliography total is not a body of evidence for the laser claim.`,
      source: `${SITE}/bibliography`, machine: `${SITE}/data.json`,
    });
  }
  if (typeof symbols === "number") {
    items.push({
      q: "How many community observations does DMT Code hold?",
      a: `${symbols} approved symbol submissions, all community-sourced.`,
      source: `${SITE}/registry`, machine: `${SITE}/data.json`,
    });
  }
  items.push({
    q: "What does a recognition mean?",
    a: "Post-exposure recognition, never an independent match. A reader affirming that a published symbol echoes their own memory has already seen it here. That is recognition after exposure, not convergence.",
    source: `${SITE}/registry`,
  });
  items.push({
    q: "Is the equipment sold here the same as Danny Goler's published setup?",
    a: "No. Goler's published setup is 650 nm, Class 2, 1 mW. The kits sold here are higher-powered units. They are not the same equipment, and Goler has no part in the store.",
    source: `${SITE}/prepare`,
  });
  return json({
    generated_at: today(),
    license: LICENSE,
    note: "Canonical answers with figures read live from the database at request time. An answer whose figure could not be read is omitted rather than guessed.",
    count: items.length,
    items,
  });
}

// -------------------------------------------------------------- queries.json

function queriesJson(): Response {
  return json({
    generated_at: today(),
    rule: "hunt = a SERP this registry can own with a unique sourced fact. roundup = an aggregator page we can place on. never = a query owned by an official site or directory we will not outrank and will not pretend to.",
    items: [
      { play: "hunt", query: "which retreats use a 650 nm laser protocol", human_url: `${SITE}/retreats/laser-protocol`, why: "An empty SERP answered with a dated, sourced negative and a database constraint behind it." },
      { play: "hunt", query: "DMT laser protocol training", human_url: `${SITE}/protocol-guide`, why: "First-party method. No competitor owns the phrase." },
      { play: "roundup", query: "psychedelic conferences 2026 2027", human_url: `${SITE}/events`, why: "Winnable when every date is sourced to the organiser rather than an aggregator." },
      { play: "never", query: "best DMT retreats", human_url: `${SITE}/retreats`, why: "Owned by booking marketplaces. Ranking here would require thin stub pages and would destroy the registry's reason to exist." },
      { play: "never", query: "Burning Man 2026", human_url: `${SITE}/events`, why: "burningman.org owns this. We carry the row for completeness, not to compete." },
    ],
  });
}

// ---------------------------------------------------------------- index.json

function indexJson(): Response {
  return json({
    generated_at: today(),
    name: "DMT Code Registry",
    version: "1.0.0",
    license: LICENSE,
    attribution: "DMT Code, https://dmtcode.com",
    purpose:
      "Machine-readable status of the 650 nm observation protocol, plus the events " +
      "and retreats lookups that sit beside it. This is not an events company. The " +
      "durable claim here is the dated negative, not the size of the list.",
    citation:
      "Cite the row's last_verified, not generated_at. Do not report a " +
      "laser_protocol of Yes that is not present in retreats.json. Inclusion is not " +
      "an endorsement.",
    freshness:
      "Every endpoint is computed from the database on each request. There are no " +
      "checked-in JSON files behind these URLs.",
    endpoints: {
      index: `${SITE}/registry/v1/index.json`,
      collections: `${SITE}/registry/v1/collections.json`,
      events: `${SITE}/registry/v1/events.json`,
      retreats: `${SITE}/registry/v1/retreats.json`,
      answers: `${SITE}/registry/v1/answers.json`,
      queries: `${SITE}/registry/v1/queries.json`,
      corpus: `${SITE}/data.json`,
      articles: `${SITE}/articles.json`,
      llms: `${SITE}/llms.txt`,
    },
    human: {
      home: SITE,
      events: `${SITE}/events`,
      retreats: `${SITE}/retreats`,
      laser_protocol: `${SITE}/retreats/laser-protocol`,
      protocol: `${SITE}/protocol-guide`,
      join: `${SITE}/join`,
    },
  });
}

// ------------------------------------------------------------------- routing

export default async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: HEADERS });
  }
  const path = new URL(request.url).pathname.replace(/\/+$/, "");
  const leaf = path.split("/").pop() || "";
  switch (leaf) {
    case "index.json":
      return indexJson();
    case "queries.json":
      return queriesJson();
    case "collections.json":
      return await collectionsJson();
    case "events.json":
      return await eventsJson();
    case "retreats.json":
      return await retreatsJson();
    case "answers.json":
      return await answersJson();
    default:
      return json(
        {
          error: "unknown registry endpoint",
          generated_at: today(),
          endpoints: `${SITE}/registry/v1/index.json`,
        },
        404,
      );
  }
};

export const config: Config = { path: "/registry/v1/*" };
