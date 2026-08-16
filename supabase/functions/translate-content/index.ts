// supabase/functions/translate-content/index.ts
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_KEY  = Deno.env.get("LOVABLE_API_KEY")!;
const SHARED       = Deno.env.get("TRANSLATE_SHARED_SECRET")!;
const LOCALES = ["es", "de"] as const;
const TIME_BUDGET_MS = 100_000;

const GLOSSARY = [
  "DMT Code","Code of Reality","650nm","650 nm","N,N-DMT","DMT","Apple Vision Pro","ORCID",
].join(", ");

type Cfg = { table: string; gate: string; key: "id" | "slug"; fields: string[]; json?: string[] };
const CONFIG: Cfg[] = [
  { table: "theories",          gate: "is_approved=eq.true",        key: "id",   fields: ["title","summary","content"] },
  { table: "guides",            gate: "is_published=eq.true",       key: "slug", fields: ["question","short_answer","evidence_grade_note","safety_note","body_md"], json: ["what_supports","what_weakens","what_is_unknown","what_would_change"] },
  { table: "articles",          gate: "is_published=eq.true",       key: "slug", fields: ["title","dek","body_md"] },
  { table: "protocols",         gate: "is_published=eq.true",       key: "slug", fields: ["title","tagline"], json: ["content_jsonb"] },
  { table: "events",            gate: "is_approved=eq.true",        key: "id",   fields: ["title","description","details"] },
  { table: "retreats",          gate: "is_approved=eq.true",        key: "id",   fields: ["description","details"] },
  // symbol_submissions is deliberately NOT translated here. A submission's
  // description and context_note are primary evidence: a first-person perceptual
  // report in the observer's own words. A machine translation of such a report is
  // a different object from a translated marketing page, and publishing one
  // unlabelled would make a paraphrase quotable as the record. Reports stay in the
  // language they were written in. Moderators translate on demand, in the admin
  // dialog, via the admin-translate-submission function, which stores nothing.
  // Operator decision, 2026-08-16.
  { table: "bibliography",      gate: "is_approved=eq.true",        key: "id",   fields: ["summary"] },
  { table: "clinical_trials",   gate: "is_approved=eq.true",        key: "id",   fields: ["description","eligibility","notes"] },
];

const sbHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };

class DeadlineError extends Error {
  constructor() { super("deadline reached mid-field"); }
}

async function md5(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("MD5", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function translate(text: string, locale: "es" | "de"): Promise<string> {
  const lang = locale === "es" ? "Spanish (es)" : "German (de)";
  const sys = `You are a professional translator for a scientific website. Translate the user's text into ${lang}. `
    + `Preserve meaning, tone, and any Markdown/HTML/JSON structure exactly. `
    + `NEVER translate these terms or any proper names, DOIs, registry/trial IDs, URLs, emails, unit strings, or specimen/symbol IDs - keep them verbatim: ${GLOSSARY}. `
    + `Return ONLY the translation, no preamble, no quotes.`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
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
    return String(j.choices?.[0]?.message?.content ?? "").trim();
  } finally {
    clearTimeout(timer);
  }
}

// Collects and translates every non-empty string leaf with bounded concurrency.
// If the run deadline passes before a worker starts a leaf we throw: a
// half-translated JSON must never be stored, because the prerender overlay
// replaces the whole field with whatever is in content_translations.
async function translateJson(v: unknown, locale: "es" | "de", deadline: number): Promise<unknown> {
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
      leaf.translated = await translate(leaf.source, locale);
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

async function getRows(c: Cfg): Promise<Record<string, unknown>[]> {
  const cols = ["id", c.key, ...c.fields, ...(c.json ?? [])].join(",");
  const out: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 1000) {
    const url = `${SUPABASE_URL}/rest/v1/${c.table}?select=${cols}&${c.gate}&limit=1000&offset=${offset}`;
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
        }),
      });
    } catch (e) {
      console.error("translation_runs log failed", String(e));
    }
  };

  try {
    for (const c of CONFIG.filter((c) => !onlyTable || c.table === onlyTable)) {
      const rows = await getRows(c);
      for (const locale of LOCALES.filter((l) => !onlyLocale || l === onlyLocale)) {
        const have = await existingHashes(c.table, locale);
        for (const row of rows) {
          const batch: Record<string, unknown>[] = [];
          const recId = String(row[c.key] ?? "");
          if (!recId) continue;
          for (const f of c.fields) {
            const src = row[f]; if (src == null || String(src).trim() === "") continue;
            const srcStr = String(src); const h = await md5(srcStr); stats.checked++;
            if (have.get(`${recId}|${f}`) === h) { stats.skipped++; continue; }
            try { const t = await translate(srcStr, locale); batch.push({ table_name: c.table, record_id: recId, locale, field: f, translated_text: t, source_hash: h, reviewed: false }); stats.translated++; } catch (e) { noteError(e); }
            if (Date.now() > deadline) { stats.pending = true; break; }
          }
          if (!stats.pending) {
            for (const jf of c.json ?? []) {
              const src = row[jf]; if (src == null) continue;
              const srcStr = JSON.stringify(src); const h = await md5(srcStr); stats.checked++;
              if (have.get(`${recId}|${jf}`) === h) { stats.skipped++; continue; }
              try {
                const t = JSON.stringify(await translateJson(src, locale, deadline));
                batch.push({ table_name: c.table, record_id: recId, locale, field: jf, translated_text: t, source_hash: h, reviewed: false });
                stats.translated++;
              } catch (e) {
                // Abandon a partially translated jsonb field entirely; never store half.
                if (e instanceof DeadlineError) { stats.pending = true; break; }
                noteError(e);
              }
              if (Date.now() > deadline) { stats.pending = true; break; }
            }
          }
          // Flush after every row so partial progress survives a kill.
          if (batch.length) { try { await upsert(batch); } catch (e) { noteError(e); } }
          if (stats.pending) break;
        }
        if (stats.pending) break;
      }
      if (stats.pending) break;
    }
    await logRun();
    return new Response(JSON.stringify(stats), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    await logRun(String(e).slice(0, 500));
    return new Response(JSON.stringify({ ...stats, fatal: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
