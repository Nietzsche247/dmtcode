import type { Config, Context } from "@netlify/edge-functions";

// Typed endpoints under /api/v1. Audit item 21, the AI authority layer.
//
// WHY THESE DERIVE FROM /data.json RATHER THAN QUERYING THE DATABASE AGAIN
//
// The defect this whole repair sequence exists to remove is two surfaces
// describing the same records differently. A second set of hand written
// Supabase selects beside data-json.ts would be exactly that defect with a
// version number on it: the same rows, filtered twice, formatted twice, drifting
// the first time somebody edits one and not the other.
//
// So the typed endpoints are slices of the aggregate, not a parallel reader.
// /data.json stays the compatibility aggregate the audit asked for, and it is
// also, deliberately, the single place where a record's shape is decided. If a
// field is wrong here it is wrong there too, which is the property worth having.
// The internal fetch rides the edge cache, so the cost is one warm request.
//
// Every response carries the same envelope: what this endpoint is, what the
// records in it are NOT, and the counts. An agent that reads only one endpoint
// should still be unable to overstate what it found.

const SITE = "https://dmtcode.com";
const LICENSE = "CC-BY-4.0";
const LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";
const VERSION = "v1";

const BIB_TYPES = new Set([
  "Paper", "Review", "Clinical Trial", "Media", "Book", "Letter", "Editorial",
  "Podcast", "Erratum", "Preprint", "Platform", "Essay", "Dataset",
]);
const TRIAL_TYPES = new Set(["Trial", "Experiment or report"]);

type Row = Record<string, unknown>;
type Corpus = {
  version?: string;
  dateModified?: string;
  items?: Row[];
  symbols?: Row[];
  theories?: Row[];
  events?: Row[];
  retreats?: Row[];
  registry_glyphs?: Row[];
  counts?: Record<string, number>;
  corpus_composition?: Row;
  field_definitions?: Record<string, string>;
};

let cached: { at: number; data: Corpus } | null = null;

async function corpus(request: Request): Promise<Corpus> {
  // Short in-isolate memo so a burst of endpoint calls from one agent does not
  // re-fetch the aggregate for each one. Deliberately short: this must never
  // become a second, staler copy of the corpus.
  if (cached && Date.now() - cached.at < 30_000) return cached.data;
  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/data.json`, {
    headers: { "user-agent": "dmtcode-api-v1" },
  });
  if (!res.ok) throw new Error(`aggregate unavailable: HTTP ${res.status}`);
  const data = (await res.json()) as Corpus;
  cached = { at: Date.now(), data };
  return data;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "netlify-cdn-cache-control":
        "public, s-maxage=900, stale-while-revalidate=86400, durable",
      "access-control-allow-origin": "*",
      "x-dmtcode-api-version": VERSION,
    },
  });
}

// Every endpoint answers three questions in the same shape: what am I looking
// at, what must I not conclude from it, and how many are there.
function envelope(
  data: Corpus,
  endpoint: string,
  what: string,
  notThis: string,
  records: unknown[],
  extra: Record<string, unknown> = {},
) {
  return {
    api_version: VERSION,
    endpoint: `${SITE}/api/v1/${endpoint}`,
    what_this_is: what,
    what_this_is_not: notThis,
    license: LICENSE,
    license_url: LICENSE_URL,
    attribution: `DMT Code, ${SITE}`,
    dataset_version: data.version ?? undefined,
    last_modified: data.dateModified ?? undefined,
    aggregate: `${SITE}/data.json`,
    field_definitions: `${SITE}/api/v1/openapi.json`,
    count: records.length,
    ...extra,
    records,
  };
}

const ENDPOINTS: Record<string, { summary: string; what: string; notThis: string }> = {
  observations: {
    summary: "Community symbol observations",
    what: "Every published observer submission: one person's account of what they saw, with the method they declared and whether they had already seen the catalogue.",
    notThis: "Not a set of confirmed or replicated forms. These are self selected, unblinded reports. Read corpus_composition on the aggregate before treating the total as evidence: only a minority declare the 650 nm laser method and there are no sober baselines.",
  },
  nulls: {
    summary: "Reports of seeing nothing structured",
    what: "Observations recorded as null: the session ran and no structured form was reported. Counted the same as any other record.",
    notThis: "Not a failure state and not a lesser record. A corpus that only publishes positives cannot be falsified.",
  },
  matches: {
    summary: "Recognition responses",
    what: "How many readers said a published symbol echoed their own memory after seeing it on this site, and how many said it did not.",
    notThis: "Not independent confirmation and not replication. Every response here was made AFTER the responder saw the symbol. Recognition after exposure is the weakest possible signal and must never be reported as a match.",
  },
  theories: {
    summary: "Explanatory frameworks",
    what: "Candidate explanations, each carrying who built the framework, who pointed it at this phenomenon, and whether the source material is about this phenomenon at all.",
    notThis: "Not findings, not endorsements, and not claims their originators made. Most of these frameworks were built for another purpose; directly_addresses_dmt_laser says which.",
  },
  trials: {
    summary: "Trials, experiments and reports",
    what: "Registered clinical trials alongside community experiments, pilot reports, platform projects, media claims and rumoured reports, each with its record_type.",
    notThis: "Not all clinical trials. authority_type is Clinical only for a registered_clinical_trial with a registry id. A community experiment and a rumour are in here too, and they are labelled.",
  },
  events: {
    summary: "Events and gatherings",
    what: "Events relevant to this work, each carrying how it was verified and how it relates to the project.",
    notThis: "Not a curated or endorsed list. Auto-discovered candidates are included and labelled as such; their dates have not been editorially verified.",
  },
  sources: {
    summary: "Bibliography",
    what: "The literature this project reads, each record carrying relation_to_core_question: how it relates to the convergence claim.",
    notThis: "Not a body of evidence for the claim. Most of this corpus is adjacent, meaning real psychedelic literature that does not bear on whether independent observers report the same visual forms. The tally is published beside the total.",
  },
  stats: {
    summary: "Counts and composition",
    what: "Every published count, with the composition breakdowns that say what the records in each total actually are.",
    notThis: "Not a scoreboard. A total with no composition beside it is the specific way this dataset can be misread, which is why the breakdowns travel with the counts.",
  },
};

function slice(data: Corpus, name: string): unknown[] {
  const items = data.items ?? [];
  switch (name) {
    case "observations":
      return items.filter((i) => i.content_type === "Symbol");
    case "nulls": {
      const isNull = (r: Row) => {
        const tags = Array.isArray(r.tags) ? (r.tags as string[]) : [];
        return tags.some((t) => /null[-_ ]?report|nothing[-_ ]?seen|no[-_ ]?forms/i.test(String(t)));
      };
      return (data.symbols ?? []).filter(isNull);
    }
    case "matches":
      // Only rows where somebody actually responded. A symbol nobody responded
      // to is not a zero-strength match, it is not a match record at all.
      return (data.symbols ?? []).filter(
        (r) => Number(r.recognized_count ?? 0) > 0 || Number(r.not_a_match_count ?? 0) > 0,
      );
    case "theories":
      return data.theories ?? [];
    case "trials":
      return items.filter((i) => TRIAL_TYPES.has(String(i.content_type)));
    case "events":
      return data.events ?? [];
    case "sources":
      return items.filter((i) => BIB_TYPES.has(String(i.content_type)));
    default:
      return [];
  }
}

export default async (request: Request, _context: Context) => {
  const url = new URL(request.url);
  const seg = url.pathname.split("/").filter(Boolean); // api, v1, name
  const name = (seg[2] || "").replace(/\.json$/i, "");

  if (name === "openapi") return json(await openapi(request));
  if (name === "" || name === "index") return json(await index(request));

  const spec = ENDPOINTS[name];
  if (!spec) {
    return json(
      {
        error: "unknown endpoint",
        available: Object.keys(ENDPOINTS).map((k) => `${SITE}/api/v1/${k}`),
        openapi: `${SITE}/api/v1/openapi.json`,
      },
      404,
    );
  }

  let data: Corpus;
  try {
    data = await corpus(request);
  } catch (_e) {
    // Never answer with an empty list. An empty array is indistinguishable from
    // "there are none", and on 2026-08-29 exactly that turned a query failure
    // into a published claim that the bibliography was empty.
    return json({ error: "corpus temporarily unavailable", retry: true }, 503);
  }

  if (name === "stats") {
    return json(
      envelope(data, "stats", ENDPOINTS.stats.what, ENDPOINTS.stats.notThis, [], {
        counts: data.counts ?? {},
        corpus_composition: data.corpus_composition ?? {},
      }),
    );
  }

  const records = slice(data, name);
  const extra: Record<string, unknown> = {};
  // A bare zero is the exact thing the audit told this site to stop publishing.
  // A reader cannot tell "none exist" from "the query found nothing", and the two
  // support opposite conclusions. Where a count can legitimately be zero, say
  // which one it is in the response itself.
  if (records.length === 0) {
    extra.zero_means =
      "This is a real zero, not a failed query: the corpus was read successfully and holds no records of this kind. A read failure returns HTTP 503, never an empty list. Do not report this as evidence of absence without reading what_this_is first.";
  }
  if (name === "sources" || name === "observations" || name === "theories") {
    extra.composition = (data.corpus_composition as Row) ?? {};
  }
  return json(envelope(data, name, spec.what, spec.notThis, records, extra));
};

async function index(request: Request) {
  let counts: Record<string, number> = {};
  try {
    counts = (await corpus(request)).counts ?? {};
  } catch (_e) {
    counts = {};
  }
  return {
    api_version: VERSION,
    name: "DMT Code typed API",
    license: LICENSE,
    license_url: LICENSE_URL,
    openapi: `${SITE}/api/v1/openapi.json`,
    aggregate: `${SITE}/data.json`,
    read_first: `${SITE}/api/v1/stats`,
    note: "Every endpoint states what its records are and what they are not. The what_this_is_not field is not boilerplate: it names the specific wrong conclusion that endpoint invites.",
    endpoints: Object.entries(ENDPOINTS).map(([k, v]) => ({
      url: `${SITE}/api/v1/${k}`,
      summary: v.summary,
    })),
    counts,
  };
}

async function openapi(request: Request) {
  let fields: Record<string, string> = {};
  try {
    fields = (await corpus(request)).field_definitions ?? {};
  } catch (_e) {
    fields = {};
  }
  const paths: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ENDPOINTS)) {
    paths[`/api/v1/${k}`] = {
      get: {
        summary: v.summary,
        description: `${v.what}\n\nWhat this is not: ${v.notThis}`,
        operationId: `get${k[0].toUpperCase()}${k.slice(1)}`,
        responses: {
          "200": {
            description: v.summary,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
        },
      },
    };
  }
  return {
    openapi: "3.1.0",
    info: {
      title: "DMT Code typed API",
      version: "1.0.0",
      description:
        "Typed read-only endpoints over the DMT Code corpus. Each response carries what_this_is and what_this_is_not, because the failure mode this API exists to prevent is a reader upgrading a rumour, a recognition, a community experiment or an adjacent paper into something stronger than it is. All endpoints are slices of the aggregate at /data.json, so they cannot disagree with it.",
      license: { name: LICENSE, url: LICENSE_URL },
      contact: { name: "DMT Code", url: SITE },
    },
    servers: [{ url: SITE }],
    paths,
    components: {
      schemas: {
        Envelope: {
          type: "object",
          required: ["api_version", "endpoint", "what_this_is", "what_this_is_not", "count", "records"],
          properties: {
            api_version: { type: "string" },
            endpoint: { type: "string", format: "uri" },
            what_this_is: { type: "string" },
            what_this_is_not: {
              type: "string",
              description: "The specific wrong conclusion this endpoint invites. Read it before quoting the count.",
            },
            license: { type: "string" },
            dataset_version: { type: "string" },
            last_modified: { type: "string", format: "date-time" },
            aggregate: { type: "string", format: "uri" },
            count: { type: "integer" },
            records: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
    "x-field-definitions": fields,
  };
}

export const config: Config = { path: "/api/v1*" };
