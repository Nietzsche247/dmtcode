// supabase/functions/translate-content/index.ts
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_KEY  = Deno.env.get("LOVABLE_API_KEY")!;
const SHARED       = Deno.env.get("TRANSLATE_SHARED_SECRET")!;
const LOCALES = ["es", "de"] as const;
const TIME_BUDGET_MS = 100_000;
// A flat 8s aborted every long field (body_html, body_md, content_jsonb,
// clinical trial descriptions) before the model could answer. Scale with length.
function callTimeoutMs(text: string): number {
  return Math.min(75_000, Math.max(20_000, 12_000 + text.length * 6));
}
const MAX_CONSECUTIVE_ABORTS = 10;
// Public origin whose prerendered English pages are the source of truth for
// the "people" and "static" translation tables (see CONFIG below).
const SITE_URL = "https://dmtcode.com";

const GLOSSARY = [
  "DMT Code","Code of Reality","650nm","650 nm","N,N-DMT","DMT","Apple Vision Pro","ORCID",
].join(", ");

type PageSrc = { id: string; path: string };
type Cfg = {
  table: string;
  gate?: string;
  key: "id" | "slug";
  fields: string[];
  json?: string[];
  // When set, rows are not read from a database table. Instead the English
  // prerender of each page is fetched and the source text is extracted from
  // it (body_html from <!--tsrc:TABLE:ID--> markers, title/description from
  // the head). The English text is upserted as the locale='en' row, which is
  // what the es/de hashes are compared against. This is how tables whose
  // source lives in the prerender templates become hash-checkable.
  pages?: PageSrc[];
};

const STATIC_PAGE_PATHS: PageSrc[] = [
  { id: "home", path: "/" },
  { id: "registry", path: "/registry" },
  { id: "trials", path: "/trials" },
  { id: "bibliography", path: "/bibliography" },
  { id: "dataset", path: "/dataset" },
  { id: "about", path: "/about" },
  { id: "critiques", path: "/critiques" },
  { id: "events", path: "/events" },
  { id: "glossary", path: "/glossary" },
  { id: "methods", path: "/methods" },
  { id: "research", path: "/research" },
  { id: "protocols", path: "/protocols" },
  { id: "forecasts", path: "/forecasts" },
  { id: "privacy", path: "/privacy" },
  { id: "terms", path: "/terms" },
  { id: "shipping", path: "/shipping" },
  { id: "returns", path: "/returns" },
  { id: "disclosure", path: "/disclosure" },
  { id: "capture", path: "/capture" },
  { id: "join", path: "/join" },
  { id: "timeline", path: "/timeline" },
  { id: "faq", path: "/faq" },
  { id: "prepare", path: "/prepare" },
  { id: "evidence-map", path: "/evidence-map" },
  { id: "articles", path: "/articles" },
];

const PEOPLE_PAGE_PATHS: PageSrc[] = [
  { id: "index", path: "/people" },
  { id: "danny-goler", path: "/people/danny-goler" },
  { id: "andrew-gallimore", path: "/people/andrew-gallimore" },
  { id: "chase-hughes", path: "/people/chase-hughes" },
];

// Ordered by crawl demand, not table size. static and clinical_trials are the
// surfaces AI crawlers and search hit hardest on the /es/ and /de/ mirrors.
// symbol_submissions is deliberately NOT translated here. A submission's
// description and context_note are primary evidence: a first-person perceptual
// report in the observer's own words. A machine translation of such a report is
// a different object from a translated marketing page, and publishing one
// unlabelled would make a paraphrase quotable as the record. Reports stay in the
// language they were written in. Moderators translate on demand, in the admin
// dialog, via the admin-translate-submission function, which stores nothing.
// Operator decision, 2026-08-16.
// people and static are sourced from the live English prerender, not from
// database tables.
const CONFIG: Cfg[] = [
  { table: "static",            key: "id",   fields: ["body_html"], pages: STATIC_PAGE_PATHS },
  { table: "clinical_trials",   gate: "is_approved=eq.true",        key: "id",   fields: ["description","eligibility","notes"] },
  { table: "bibliography",      gate: "is_approved=eq.true",        key: "id",   fields: ["summary"] },
  { table: "articles",          gate: "is_published=eq.true",       key: "slug", fields: ["title","dek","body_md"] },
  { table: "people",            key: "id",   fields: ["title","description","body_html"], pages: PEOPLE_PAGE_PATHS },
  { table: "guides",            gate: "is_published=eq.true",       key: "slug", fields: ["question","short_answer","evidence_grade_note","safety_note","body_md"], json: ["what_supports","what_weakens","what_is_unknown","what_would_change"] },
  { table: "protocols",         gate: "is_published=eq.true",       key: "slug", fields: ["title","tagline"], json: ["content_jsonb"] },
  { table: "theories",          gate: "is_approved=eq.true",        key: "id",   fields: ["title","summary","content"] },
  { table: "events",            gate: "is_approved=eq.true",        key: "id",   fields: ["title","description","details"] },
  { table: "retreats",          gate: "is_approved=eq.true",        key: "id",   fields: ["description","details"] },
];

const sbHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };

class DeadlineError extends Error {
  constructor() { super("deadline reached mid-field"); }
}

class GatewayPausedError extends Error {
  constructor() { super(`gateway paused after ${MAX_CONSECUTIVE_ABORTS} consecutive aborts`); }
}

// Consecutive gateway aborts, held PER REQUEST. Deno reuses the isolate
// between invocations, so a module-scope streak survived the run that set it
// and poisoned the next request on its very first translate call.
type RunState = { abortStreak: number };

function isAbort(e: unknown): boolean {
  return (e as Error)?.name === "AbortError" || String(e).includes("aborted");
}

async function md5(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("MD5", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function translate(text: string, locale: "es" | "de", st: RunState): Promise<string> {
  if (st.abortStreak >= MAX_CONSECUTIVE_ABORTS) throw new GatewayPausedError();
  const lang = locale === "es" ? "Spanish (es)" : "German (de)";
  const sys = `You are a professional translator for a scientific website. Translate the user's text into ${lang}. `
    + `Preserve meaning, tone, and any Markdown/HTML/JSON structure exactly. `
    + `NEVER translate these terms or any proper names, DOIs, registry/trial IDs, URLs, emails, unit strings, or specimen/symbol IDs - keep them verbatim: ${GLOSSARY}. `
    + `Return ONLY the translation, no preamble, no quotes.`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), callTimeoutMs(text));
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": LOVABLE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        temperature: 0.2,
        messages: [{ role: "system", content: sys }, { role: "user", content: text }],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`gateway ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const j = await res.json();
    st.abortStreak = 0;
    return String(j.choices?.[0]?.message?.content ?? "").trim();
  } catch (e) {
    if (isAbort(e)) st.abortStreak++;
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// Collects and translates every non-empty string leaf with bounded concurrency.
// If the run deadline passes before a worker starts a leaf we throw: a
// half-translated JSON must never be stored, because the prerender overlay
// replaces the whole field with whatever is in content_translations.
async function translateJson(v: unknown, locale: "es" | "de", deadline: number, st: RunState): Promise<unknown> {
  const TRANSLATE_JSON_CONCURRENCY = 5;
  type PathPart = string | number;
  type Leaf = { path: PathPart[]; source: string; translated?: string };
  const leaves: Leaf[] = [];

  const collect = (value: unknown, path: PathPart[]) => {
    if (typeof value === "string") {
      if (value.trim()) leaves.push({ path, source: value });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => collect(item, [...path, index]));
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, item]) => collect(item, [...path, key]));
    }
  };

  collect(v, []);
  let nextLeaf = 0;
  const worker = async () => {
    while (true) {
      const index = nextLeaf++;
      if (index >= leaves.length) return;
      if (Date.now() > deadline) throw new DeadlineError();
      const leaf = leaves[index];
      if (!leaf) return;
      leaf.translated = await translate(leaf.source, locale, st);
    }
  };

  const workerCount = Math.min(TRANSLATE_JSON_CONCURRENCY, leaves.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  let rebuilt = structuredClone(v);
  for (const leaf of leaves) {
    if (leaf.translated === undefined) throw new DeadlineError();
    if (leaf.path.length === 0) {
      rebuilt = leaf.translated;
      continue;
    }
    let parent = rebuilt as Record<string | number, unknown>;
    for (let i = 0; i < leaf.path.length - 1; i++) {
      parent = parent[leaf.path[i]] as Record<string | number, unknown>;
    }
    parent[leaf.path[leaf.path.length - 1]] = leaf.translated;
  }
  return rebuilt;
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// Extract the marked English source region from a prerendered page. Returns
// null when the marker is absent so a render regression can never store an
// empty source row.
function extractMarked(html: string, table: string, id: string): string | null {
  const re = new RegExp(`<!--tsrc:${table}:${id}-->([\\s\\S]*?)<!--/tsrc-->`);
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

// Rows for page-sourced configs: fetch each live English prerender and pull
// the source fields out of it. Pages that fail to fetch or lack the marker
// are skipped by returning a row with empty fields (the field loop skips
// empties, and the en-row upsert never fires for them).
async function getPageRows(c: Cfg): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  for (const p of c.pages ?? []) {
    const row: Record<string, unknown> = { id: p.id };
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15_000);
      const res = await fetch(`${SITE_URL}${p.path}`, {
        headers: { "User-Agent": "dmtcode-translate-content/2.0", Accept: "text/html" },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`page ${p.path} ${res.status}`);
      const html = await res.text();
      if (c.fields.includes("body_html")) {
        row.body_html = extractMarked(html, c.table, p.id) ?? "";
      }
      if (c.fields.includes("title")) {
        row.title = unescapeHtml(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
      }
      if (c.fields.includes("description")) {
        row.description = unescapeHtml(
          html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "",
        );
      }
    } catch {
      // leave fields empty; this page is skipped this run
    }
    out.push(row);
  }
  return out;
}

async function getRows(c: Cfg): Promise<Record<string, unknown>[]> {
  if (c.pages) return await getPageRows(c);
  const cols = ["id", c.key, ...c.fields, ...(c.json ?? [])].join(",");
  const out: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 1000) {
    const url = `${SUPABASE_URL}/rest/v1/${c.table}?select=${cols}&${c.gate}&order=${c.key}.asc&limit=1000&offset=${offset}`;
    const r = await fetch(url, { headers: sbHeaders });
    if (!r.ok) throw new Error(`read ${c.table} ${r.status}`);
    const page = await r.json() as Record<string, unknown>[];
    out.push(...page);
    if (page.length < 1000) break;
  }
  return out;
}

async function existingHashes(table: string, locale: string): Promise<Map<string, string>> {
  const url = `${SUPABASE_URL}/rest/v1/content_translations?table_name=eq.${table}&locale=eq.${locale}&select=record_id,field,source_hash&limit=100000`;
  const r = await fetch(url, { headers: sbHeaders });
  const rows = r.ok ? await r.json() as Record<string, string>[] : [];
  const m = new Map<string, string>();
  for (const x of rows) m.set(`${x.record_id}|${x.field}`, x.source_hash);
  return m;
}

async function upsert(rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const url = `${SUPABASE_URL}/rest/v1/content_translations?on_conflict=table_name,record_id,locale,field`;
  const r = await fetch(url, {
    method: "POST",
    headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`upsert ${r.status}: ${await r.text()}`);
}

type Cursor = { table: string; locale: string; key: string };

async function loadCursor(): Promise<Cursor | null> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/translation_runs?select=resume_cursor&resume_cursor=not.is.null&order=started_at.desc&limit=1`;
    const r = await fetch(url, { headers: sbHeaders });
    if (!r.ok) return null;
    const rows = await r.json() as Array<{ resume_cursor: Cursor }>;
    const c = rows[0]?.resume_cursor;
    if (c && typeof c.table === "string" && typeof c.locale === "string") return c;
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.headers.get("X-Translate-Secret") !== SHARED) return new Response("forbidden", { status: 403 });
  const u = new URL(req.url);
  const onlyTable = u.searchParams.get("table");
  const onlyLocale = u.searchParams.get("locale");
  const started = Date.now();
  const startedAtIso = new Date(started).toISOString();
  const deadline = started + TIME_BUDGET_MS;
  const stats = { checked: 0, translated: 0, skipped: 0, errors: 0, pending: false, error_samples: [] as string[] };

  const noteError = (e: unknown) => {
    stats.errors++;
    if (stats.error_samples.length < 3) stats.error_samples.push(String(e).slice(0, 160));
  };

  // Resume cursor: only full (unfiltered) runs read and advance it. A run
  // that hits the deadline or the abort cap stores where it stopped; the next
  // run starts there and wraps around to the beginning when it reaches the
  // end. A run that completes a full pass clears the cursor.
  const useCursor = !onlyTable && !onlyLocale;
  let newCursor: Cursor | null = null;

  const logRun = async (fatal?: string) => {
    try {
      const note = fatal ?? (stats.error_samples.length ? stats.error_samples.join(" | ") : null);
      await fetch(`${SUPABASE_URL}/rest/v1/translation_runs`, {
        method: "POST",
        headers: { ...sbHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({
          started_at: startedAtIso,
          finished_at: new Date().toISOString(),
          table_name: onlyTable,
          locale: onlyLocale,
          checked: stats.checked,
          translated: stats.translated,
          skipped: stats.skipped,
          errors: stats.errors,
          pending: stats.pending,
          note,
          resume_cursor: useCursor ? newCursor : null,
        }),
      });
    } catch (e) {
      console.error("translation_runs log failed", String(e));
    }
  };

  try {
    // Ordered work list: one unit per table. Locales are interleaved at row
    // level inside the unit, so es and de advance together instead of one
    // locale draining a large table before the other starts.
    const configs = CONFIG.filter((c) => !onlyTable || c.table === onlyTable);
    const locales = LOCALES.filter((l) => !onlyLocale || l === onlyLocale);
    const units: Array<{ c: Cfg }> = configs.map((c) => ({ c }));

    let startUnit = 0;
    let resumeKey: string | null = null;
    if (useCursor) {
      const cur = await loadCursor();
      if (cur) {
        const idx = units.findIndex((x) => x.c.table === cur.table);
        if (idx >= 0) {
          startUnit = idx;
          resumeKey = cur.key ?? null;
        }
      }
    }
    // Wrap-around order: from the cursor unit to the end, then from the start
    // up to the cursor unit, so every unit is visited exactly once per run.
    const order = [...units.slice(startUnit), ...units.slice(0, startUnit)];

    for (const { c } of order) {
      const rows = await getRows(c);
      const haveByLocale = new Map<string, Map<string, string>>();
      for (const locale of locales) haveByLocale.set(locale, await existingHashes(c.table, locale));
      // The locale='en' rows are the source-of-truth record for page-sourced
      // configs (people/static), whose English lives in prerender templates.
      // Table-sourced configs read their source from the database directly,
      // so they get no en rows.
      const haveEn = c.pages ? await existingHashes(c.table, "en") : new Map<string, string>();

      // Within the resumed unit, skip rows before the cursor key. The cursor
      // row itself is reprocessed; hash equality skips its finished fields.
      let startRow = 0;
      if (resumeKey) {
        const idx = rows.findIndex((r) => String(r[c.key] ?? "") === resumeKey);
        startRow = idx >= 0 ? idx : 0;
        resumeKey = null;
      }

      for (let ri = startRow; ri < rows.length; ri++) {
        const row = rows[ri];
        const batch: Record<string, unknown>[] = [];
        const recId = String(row[c.key] ?? "");
        if (!recId) continue;
        const nowIso = new Date().toISOString();
        // Both locales are done for this row before moving to the next row.
        for (let li = 0; li < locales.length; li++) {
          const locale = locales[li];
          const have = haveByLocale.get(locale)!;
          // The en source row is written once per field, on the first locale
          // pass, so a single upsert payload never carries the same key twice.
          const writeEn = li === 0;
          newCursor = { table: c.table, locale, key: recId };
          for (const f of c.fields) {
            const src = row[f]; if (src == null || String(src).trim() === "") continue;
            const srcStr = String(src); const h = await md5(srcStr); stats.checked++;
            if (writeEn && c.pages && haveEn.get(`${recId}|${f}`) !== h) {
              batch.push({ table_name: c.table, record_id: recId, locale: "en", field: f, translated_text: srcStr, source_hash: h, translated_at: nowIso, reviewed: false });
            }
            if (have.get(`${recId}|${f}`) === h) { stats.skipped++; continue; }
            try {
              const t = await translate(srcStr, locale);
              batch.push({ table_name: c.table, record_id: recId, locale, field: f, translated_text: t, source_hash: h, translated_at: nowIso, reviewed: false });
              stats.translated++;
            } catch (e) {
              if (e instanceof GatewayPausedError) { stats.pending = true; noteError(e); break; }
              noteError(e);
            }
            if (Date.now() > deadline) { stats.pending = true; break; }
          }
          if (!stats.pending) {
            for (const jf of c.json ?? []) {
              const src = row[jf]; if (src == null) continue;
              const srcStr = JSON.stringify(src); const h = await md5(srcStr); stats.checked++;
              if (writeEn && c.pages && haveEn.get(`${recId}|${jf}`) !== h) {
                batch.push({ table_name: c.table, record_id: recId, locale: "en", field: jf, translated_text: srcStr, source_hash: h, translated_at: nowIso, reviewed: false });
              }
              if (have.get(`${recId}|${jf}`) === h) { stats.skipped++; continue; }
              try {
                const t = JSON.stringify(await translateJson(src, locale, deadline));
                batch.push({ table_name: c.table, record_id: recId, locale, field: jf, translated_text: t, source_hash: h, translated_at: nowIso, reviewed: false });
                stats.translated++;
              } catch (e) {
                // Abandon a partially translated jsonb field entirely; never store half.
                if (e instanceof DeadlineError || e instanceof GatewayPausedError) {
                  if (e instanceof GatewayPausedError) noteError(e);
                  stats.pending = true; break;
                }
                noteError(e);
              }
              if (Date.now() > deadline) { stats.pending = true; break; }
            }
          }
          if (stats.pending) break;
        }
        // Flush after every row so partial progress survives a kill.
        if (batch.length) { try { await upsert(batch); } catch (e) { noteError(e); } }
        if (stats.pending) break;
      }
      if (stats.pending) break;
    }


    if (!stats.pending) newCursor = null; // full pass complete: start at the top next run
    await logRun();
    return new Response(JSON.stringify({ ...stats, resume: newCursor }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    await logRun(String(e).slice(0, 500));
    return new Response(JSON.stringify({ ...stats, fatal: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
