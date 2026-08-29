import type { Config, Context } from "@netlify/edge-functions";
import { hubLabel, uiCopy } from "../lib/ui-strings.ts";
import { KITS } from "../lib/kits.ts";
import { DOCUMENTS, docCountWord } from "../lib/documents.ts";

const SITE = "https://dmtcode.com";
const SUPABASE_URL =
  Netlify.env.get("SUPABASE_URL") ?? Netlify.env.get("VITE_SUPABASE_URL") ?? "";
const SUPABASE_KEY =
  Netlify.env.get("SUPABASE_ANON_KEY") ??
  Netlify.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  "";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Detail kinds this function dispatches. UUID keyed kinds must have a valid uuid
// as the second segment; the slug keyed kinds are validated by their lookup.
const UUID_DETAIL_KINDS = new Set<string>([
  "registry",
  "trials",
  "bibliography",
  "events",
  "retreats",
]);
const HANDLED_DETAIL_KINDS = new Set<string>([
  ...UUID_DETAIL_KINDS,
  "theories",
  "protocols",
  "articles",
  "guides",
]);


const LICENSE = "https://creativecommons.org/licenses/by/4.0/";

// Site-wide social share image. This is a verbatim copy of the og:image already
// declared in index.html, which is the source of truth. Netlify edge functions run
// in Deno and cannot import from src/ or read index.html at request time. If the
// image in index.html changes, change this too, or prerendered pages will unfurl
// with a stale image.
const DEFAULT_OG_IMAGE =
  "https://dmtcode.com/og-image.png";

const SITE_NAME = "DMT Code";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function jsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
function clip(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "\u2026" : t;
}

// `optional` names columns that may not exist yet. A select naming an unknown
// column is a 400 for the whole query, which here would 404 a page that exists.
// Code ships on push and migrations are applied by hand, so the two orders have
// to both work: the optional columns are tried once and abandoned on failure.
async function getRow(
  table: string,
  id: string,
  filter: string,
  fields: string,
  optional: string[] = []
): Promise<Record<string, unknown> | null> {
  const attempts = optional.length ? [`${fields},${optional.join(",")}`, fields] : [fields];
  let res: Response | null = null;
  for (const cols of attempts) {
    res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&${filter}&select=${cols}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      },
    });
    if (res.ok) break;
  }
  if (!res || !res.ok) return null;
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows[0] ?? null;
}

// CONTEXT_TAG_RE is duplicated verbatim in netlify/edge-functions/sitemap.ts and
// src/pages/SymbolDetail.tsx (three copies). symbolTitlePhrase below is duplicated
// in src/pages/SymbolDetail.tsx (two copies). Edge functions run in Deno and cannot
// import from src/. If you change either, change every copy, or crawlers and humans
// will see different titles for the same symbol and the sitemap will disagree with
// the pages about which tags are indexable.
// Tags that describe study conditions, not the symbol. Excluded from display
// phrases; retained in keywords.
const CONTEXT_TAG_RE = /^(priming_|wavelength_|laser_|650nm|indoor$|outdoor$|closed_eyes$|open_eyes$)/i;

function symbolTitlePhrase(submitterTags: string[], communityTags: Array<{name: string; count: number}>): string {
  const community = communityTags.filter(t => !CONTEXT_TAG_RE.test(t.name)).sort((a,b) => b.count - a.count).map(t => t.name);
  const submitter = (submitterTags || []).filter(t => t && !CONTEXT_TAG_RE.test(t));
  const pool = community.length >= 2 ? community : [...community, ...submitter.filter(t => !community.includes(t))];
  const words = pool.slice(0, 3).map(t => t.toLowerCase().replace(/_/g, ' '));
  if (words.length === 0) return '';
  const phrase = words.join(' ');
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

async function getCommunityTags(id: string): Promise<Array<{name: string; count: number}>> {
  try {
    const api = `${SUPABASE_URL}/rest/v1/symbol_tags?symbol_id=eq.${id}&select=tag_name,upvotes`;
    const res = await fetch(api, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    return rows.map((t) => ({ name: String(t.tag_name), count: Number(t.upvotes ?? 0) }));
  } catch {
    return [];
  }
}


function rowsToDl(pairs: Array<[string, unknown]>): string {
  const kept = pairs.filter(
    ([, v]) => v !== null && v !== undefined && String(v).trim() !== ""
  );
  if (!kept.length) return "";
  return (
    "<dl>" +
    kept
      .map(
        ([k, v]) =>
          `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`
      )
      .join("") +
    "</dl>"
  );
}

// Path-based locale mirrors. English is the default and lives at unprefixed
// paths; /es/* and /de/* mirror the same routes.
type Loc = "en" | "es" | "de";
const LOCALES = new Set(["es", "de"]);

// MD5 of a UTF-8 string, lower case hex. Deno's Web Crypto has no MD5 and a
// remote digest module would be fetched on every cold start, so it lives here.
// The algorithm cannot be swapped for something better: content_translations
// .source_hash is written by supabase/functions/translate-content/index.ts as
// md5 of the English source text, and this has to reproduce that byte for byte
// or the staleness gate below would never match and would suppress every
// translation it guards.
const MD5_K = new Uint32Array([
  0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
  0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
  0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
  0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
  0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
  0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
  0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
  0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
  0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
  0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
  0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
  0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
  0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
  0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
  0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
  0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
]);
const MD5_S = new Uint8Array([
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]);

function md5Hex(input: string): string {
  const msg = new TextEncoder().encode(input);
  const padded = (((msg.length + 8) >> 6) + 1) * 64;
  const buf = new Uint8Array(padded);
  buf.set(msg);
  buf[msg.length] = 0x80;
  const view = new DataView(buf.buffer);
  const bits = msg.length * 8;
  view.setUint32(padded - 8, bits >>> 0, true);
  view.setUint32(padded - 4, Math.floor(bits / 4294967296), true);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const m = new Uint32Array(16);
  for (let off = 0; off < padded; off += 64) {
    for (let j = 0; j < 16; j++) m[j] = view.getUint32(off + j * 4, true);
    let a = a0, b = b0, c = c0, d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      if (i < 16) { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) & 15; }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) & 15; }
      else { f = c ^ (b | ~d); g = (7 * i) & 15; }
      f = (f + a + MD5_K[i] + m[g]) >>> 0;
      a = d; d = c; c = b;
      const s = MD5_S[i];
      b = (b + (((f << s) | (f >>> (32 - s))) >>> 0)) >>> 0;
    }
    a0 = (a0 + a) >>> 0; b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0; d0 = (d0 + d) >>> 0;
  }
  let out = "";
  for (const w of [a0, b0, c0, d0]) {
    for (let i = 0; i < 4; i++) out += ((w >>> (i * 8)) & 0xff).toString(16).padStart(2, "0");
  }
  return out;
}

// Static pages whose translation is served ONLY while it still matches the
// English source it was made from.
//
// Every content_translations row carries source_hash, the md5 of the English
// text at translation time. Nothing checked it at read time, so an edit to the
// English copy left the old translation in place until a backfill ran. For
// most pages that lag is cosmetic and a slightly old translation still beats
// no translation at all.
//
// A page that states a fact about the reader's safety or their rights is
// different. These five tell a reader what happens to the record they submit,
// what they are agreeing to, who is paid for what, and which laser exposure
// class the hardware in front of them is. A stale translation of one of those
// states something that is no longer true, in the reader's own language, with
// the authority of the page it sits on, and the reader has no way to know it
// is out of date. English and correct beats translated and wrong here, so on a
// hash mismatch these pages fall back to the English source instead of serving
// the old translation.
//
// faq is on this list for the laser rating, not for the questions. On
// 2026-08-29 the Spanish and German bodies read "Clase 3R, IIIa, por debajo de
// 5 mW" and "Klasse 3R, IIIa, unter 5 mW", collapsing the per emitter ratings
// into one kit-wide claim and dropping the ray box exception under 1 mW that
// the English text states. That contradicts src/data/kits.ts, and a laser
// class is a standard designation that is not translatable at all. An invented
// safety rating in two languages is the same class of harm as a wrong
// effective date, so faq is gated with the policy pages.
//
// Widening this is one line: add the static page key. Every page not listed
// here keeps serving its existing translation exactly as before. One caution
// before adding a page: four rows (protocol-guide es/de and timeline es/de)
// store the sentinel "manual-2026-08-19" in source_hash instead of an md5.
// Those are hand written translations flagged reviewed, they can never match a
// computed hash, and gating either page would suppress them permanently and
// serve English in their place. Give such a row a real md5 first.
// trials and events joined on 2026-08-29, after Repair Build 5 rewrote both
// pages in English and left the 2026-08-27 translations in place. The Spanish
// body of /trials still opened "Observatorio de Ensayos Clinicos ... el
// observatorio realiza un seguimiento de los ensayos clinicos", describing all
// 266 records as clinical trials, which is the precise claim the record_type
// work exists to stop. The Spanish body of /events still said events "son
// revisados por moderadores antes de su publicacion" on a page that was at the
// same moment rendering 21 rows labelled auto-discovered candidate, so one page
// asserted and denied moderator review in two languages at once. Both are
// classification claims an AI agent reads as fact, so they fall back to English
// until a translation run refreshes them.
const HASH_GATED_STATIC_PAGES = new Set<string>([
  "privacy",
  "terms",
  "disclosure",
  "methods",
  "faq",
  "trials",
  "events",
  "downloads",
]);

// The second guard on the same pages. The hash gate proves a translation is
// CURRENT. It says nothing about whether it is CORRECT.
//
// Proved on 2026-08-29: a backfill regenerated static/faq for es and de. The
// kit-wide power claim went away, so that half improved, the hash then matched,
// and the gate passed the row through. The Spanish body still read "Clase 3R".
// Before the backfill the gate was serving English and the page was right;
// after it, Spanish served and was wrong, so running the backfill made that
// page worse. The translation pipeline reproduces the defect on every run, so
// currency and correctness need separate proofs and neither substitutes for the
// other. A translation is served only when the hash matches AND nothing here
// matches.
//
// A laser class is a standard designation, like a chemical formula or a DOI.
// Class 2, Class 3R and FDA Class IIIa are the same strings in Spanish and
// German. A translated one names a rating that does not exist, on a page a
// reader consults for safety, so it can never be served whatever its hash says.
const FORBIDDEN_IN_TRANSLATION: RegExp[] = [
  // Translated laser class designations, numeric and Roman forms.
  /\bclase\s*(?:1m|2m|1|2|3\s*[abr]|4|i{1,3}[ab]?|iv)\b/i,
  /\bklasse\s*(?:1m|2m|1|2|3\s*[abr]|4|i{1,3}[ab]?|iv)\b/i,
  // One power figure attached to a whole kit, dropping the per emitter ratings
  // and the ray box exception under 1 mW. Same claims section 9 of
  // scripts/machine-truth-parity.mjs detects from the outside.
  /\b(?:m[oó]dulos del kit|los kits?|el kit|cada kit|todos los kits)\b[^.]{0,160}?\b(?:por debajo de|menos de|inferior(?:es)? a|bajo|hasta)\s*5\s?mW\b/i,
  /\b(?:kit-?modul\w*|die kits?|das kit|jedes kit|alle kits)\b[^.]{0,160}?\bunter\s*5\s?mW\b/i,
];

// Field-level translations for a single record. Returns {} for English, for a
// missing table, or on any failure: a missing translation must NEVER blank the
// source value.
//
// Two independent guards, both optional, and a field has to clear both to be
// served. Either one dropping a field means the caller falls back to English.
//
// expectSourceHash, when given, is a field -> md5-of-current-English-source
// map. A row for one of those fields is dropped when its stored source_hash
// does not match: the translation is out of date. Fields not named in the map,
// and every caller that passes nothing, are unaffected.
//
// forbidden, when given, is a list of patterns that must not appear in the
// translated text of any field. A row matching one is dropped however fresh it
// is: the translation is current but wrong. See FORBIDDEN_IN_TRANSLATION for
// why a fresh hash is not evidence of a correct translation.
async function getTranslations(
  table: string,
  recordId: string,
  locale: string,
  expectSourceHash?: Record<string, string>,
  forbidden?: RegExp[],
): Promise<Record<string, string>> {
  if (locale === "en" || !locale || !recordId) return {};
  if (!SUPABASE_URL || !SUPABASE_KEY) return {};
  try {
    const api =
      `${SUPABASE_URL}/rest/v1/content_translations` +
      `?table_name=eq.${encodeURIComponent(table)}` +
      `&record_id=eq.${encodeURIComponent(recordId)}` +
      `&locale=eq.${encodeURIComponent(locale)}` +
      `&select=field,translated_text,source_hash`;
    const res = await fetch(api, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return {};
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    const out: Record<string, string> = {};
    for (const r of rows) {
      const f = String(r.field ?? "");
      const t = String(r.translated_text ?? "");
      if (!f || !t.trim()) continue;
      // Guard 1, currency. Only fields the caller named are checked, and a row
      // whose stored hash does not match the English source it was made from
      // is dropped so the caller serves English instead.
      const want = expectSourceHash?.[f];
      if (want && String(r.source_hash ?? "") !== want) continue;
      // Guard 2, correctness, independent of guard 1. A row carrying a claim
      // that must never be translated is dropped even when its hash is fresh.
      if (forbidden && forbidden.some((re) => re.test(t))) continue;
      out[f] = t;
    }
    return out;
  } catch {
    return {};
  }
}

// Field-level translations for many records of one table. Returns {} for English
// or on any failure. Used to overlay list surfaces without N+1 reads.
async function getTranslationsBulk(
  table: string,
  locale: string,
): Promise<Record<string, Record<string, string>>> {
  if (locale === "en" || !locale) return {};
  if (!SUPABASE_URL || !SUPABASE_KEY) return {};
  try {
    const api =
      `${SUPABASE_URL}/rest/v1/content_translations` +
      `?table_name=eq.${encodeURIComponent(table)}` +
      `&locale=eq.${encodeURIComponent(locale)}` +
      `&select=record_id,field,translated_text`;
    const res = await fetch(api, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return {};
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    const out: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      const id = String(r.record_id ?? "");
      const f = String(r.field ?? "");
      const t = String(r.translated_text ?? "");
      if (!id || !f || !t.trim()) continue;
      (out[id] ??= {})[f] = t;
    }
    return out;
  } catch {
    return {};
  }
}

// Overlay translated fields onto a source row in place. Only non-empty
// translations are applied, and only for the allowed fields when given.
function overlay(
  row: Record<string, unknown>,
  tr: Record<string, string>,
  only?: string[],
): void {
  for (const [k, v] of Object.entries(tr)) {
    if (only && !only.includes(k)) continue;
    if (!v || !v.trim()) continue;
    const current = row[k];
    if (current !== null && typeof current === "object") {
      // jsonb field: the translation is stored as a JSON string. Parse it, and
      // on any failure keep the original source value rather than corrupting it.
      try {
        row[k] = JSON.parse(v);
      } catch {
        // keep original
      }
      continue;
    }
    row[k] = v;
  }

}

// Locale-aware internal link path. English is unprefixed; other locales carry
// their path prefix ("/es/...", "/de/...").
function lpath(locale: Loc, path: string): string {
  return `${locale !== "en" ? `/${locale}` : ""}${path}`;
}

// Canonical full attribution statement. Required verbatim on every page that
// names Danny Goler. On the person page itself the name link is omitted.
// The sentence itself is maintained by the translation pipeline as
// static/global/goler_attribution; English below is the fallback.
const GOLER_ATTRIBUTION_EN =
  "First reported by {name} in August 2020; the written protocol grew out of that observation. He has no part in Meridian Optics Lab, this store, or this site, is not a founder and holds no editorial role, and has not reviewed or endorsed any kit, page, or claim published here.";

async function golerAttribution(locale: Loc, linkName = true): Promise<string> {
  const name = linkName
    ? `<a href="${lpath(locale, "/people/danny-goler")}">Danny Goler</a>`
    : "Danny Goler";
  let text = GOLER_ATTRIBUTION_EN;
  if (locale !== "en") {
    const tr = await getTranslations("static", "global", locale);
    if (tr.goler_attribution && tr.goler_attribution.trim()) text = tr.goler_attribution.trim();
  }
  // The translated string may or may not keep the {name} placeholder. When it
  // does not, prepend nothing: the link is spliced in only where the token is.
  const withName = text.includes("{name}")
    ? text.replace("{name}", name)
    : `${name}: ${text}`;
  return `<p><small>${withName}</small></p>`;
}



export default async (request: Request, context: Context) => {
  try {
    const url = new URL(request.url);
    const seg = url.pathname.split("/").filter(Boolean);
    // Strip a leading locale segment. Machine endpoints are checked against the
    // FULL original pathname below and are English-only.
    const locale: Loc = LOCALES.has(seg[0] ?? "") ? (seg.shift() as Loc) : "en";
    const kind = seg[0];
    const id = seg[1] ?? "";

    // Machine endpoints served by OTHER edge functions must pass straight through.
    // content-prerender is declared in netlify.toml and therefore runs BEFORE
    // functions that rely on an in-source `export const config`, so without this
    // it swallows them and 404s them. Keep this an explicit allowlist, never a
    // blanket extension regex, or missing paths become 200 soft-404s.
    const MACHINE_ENDPOINTS = new Set<string>(["/articles/feed.xml"]);
    if (MACHINE_ENDPOINTS.has(url.pathname)) {
      return context.next();
    }


    // /prepare has no id segment; render from bundles table.
    if (kind === "prepare" && seg.length === 1) {
      return await renderPrepare(context, request, locale);
    }
    // /downloads is the document index. The PDF files under it are static
    // assets served by Netlify before this function runs, so only the bare
    // path reaches here.
    if (kind === "downloads" && seg.length === 1) {
      return await renderDownloads(context, locale);
    }
    if (kind === "evidence-map" && seg.length === 1) {
      return await renderEvidenceMap(context, locale);
    }
    if (kind === "timeline" && seg.length === 1) {
      return await renderTimelineIndex(context, request, locale);
    }
    if (kind === "timeline" && seg.length === 2 && seg[1]) {
      return await renderTimelineEntry(context, request, seg[1], locale);
    }
    if (kind === "faq" && seg.length === 1) {
      return await renderFaq(context, locale);
    }
    if (kind === "people" && seg.length === 1) {
      return await renderPeopleIndex(context, locale);
    }
    if (kind === "people" && seg.length === 2 && seg[1] === "danny-goler") {
      return await renderPersonPage(context, locale);
    }
    if (kind === "people" && seg.length === 2 && (seg[1] === "andrew-gallimore" || seg[1] === "chase-hughes")) {
      return await renderSimplePersonPage(context, seg[1], locale);
    }
    if (kind === "people" && seg.length >= 2) {
      return await notFoundPrerender(context);
    }
    // /products/:handle, keyed by the `handle` field in netlify/lib/kits.ts.
    // An unknown handle 404s here rather than falling through to the SPA shell.
    if (kind === "products" && seg.length === 2 && seg[1]) {
      return await renderProductPage(context, seg[1], locale);
    }
    if (kind === "products" && seg.length >= 3) {
      return await notFoundPrerender(context);
    }
    if (seg.length === 0) {
      return await renderStatic(context, "home", locale);
    }
    if (seg.length === 1 && STATIC_PAGES[kind]) {
      return await renderStatic(context, kind, locale);
    }
    if (kind === "theories" && seg.length === 1) {
      return await renderTheories(context, locale);
    }
    if (kind === "retreats" && seg.length === 1) {
      return await renderRetreats(context, locale);
    }
    if (kind === "articles" && seg.length === 1) {
      return await renderArticlesIndex(context, locale);
    }
    if (kind === "articles" && seg.length === 2 && seg[1]) {
      return await renderArticleDetail(context, seg[1], locale);
    }
    if (kind === "guides" && seg.length === 1) { return await renderGuidesIndex(context, locale); }
    if (kind === "guides" && seg.length === 2 && seg[1]) { return await renderGuideDetail(context, seg[1], locale); }
    if (kind === "theories" && seg.length === 2 && seg[1]) { return await renderTheoryDetail(context, seg[1], locale); }

    if (kind === "events" && seg.length === 2 && UUID_RE.test(id)) {
      return await renderEventDetail(context, id, locale);
    }
    if (kind === "retreats" && seg.length === 2 && UUID_RE.test(id)) {
      return await renderRetreatDetail(context, id, locale);
    }
    if (kind === "protocols" && seg.length === 2 && seg[1]) {
      return await renderProtocolDetail(context, seg[1], locale);
    }

    // Fail open: without backend credentials nothing is prerendered and nothing 404s.
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return context.next();
    }

    // Tag hub: /registry/tag/:tag must be matched before the uuid detail branch.
    if (kind === "registry" && seg.length === 3 && seg[1] === "tag" && seg[2]) {
      return await renderTagHub(context, decodeURIComponent(seg[2]), locale);
    }


    // Handled kinds only: extra path segments are not real pages.
    if (HANDLED_DETAIL_KINDS.has(kind) && seg.length >= 3) {
      return await notFoundPrerender(context);
    }
    // UUID keyed detail kinds: a malformed id is not a real page.
    if (UUID_DETAIL_KINDS.has(kind) && seg.length === 2 && !UUID_RE.test(id)) {
      return await notFoundPrerender(context);
    }

    if (!UUID_RE.test(id)) {
      return context.next();
    }


    const shellRes = await context.next();
    let title = "";
    let metaDesc = "";
    let canonical = "";
    let ld: Record<string, unknown> | null = null;
    let body = "";
    let ogImage = "";
    let noindex = false;


    if (kind === "registry") {
      const f =
        "id,description,image_url,tags,dose_level,wavelength,surface_type," +
        "emotional_valence,recurrence,source_method,duration_seconds," +
        "upvotes,publication_consent,created_at,updated_at";
      const r = await getRow("symbol_submissions", id, "status=eq.approved", f);
      if (!r) return notFound404(await shellRes.text(), { title: "Symbol not found | DMT Code", heading: "Symbol not found", text: "This symbol is not currently indexed or the link is out of date.", canonical: `${SITE}/registry`, backHref: `${SITE}/registry`, backLabel: "Visual symbol registry", marker: "registry-not-found" });

      // symbol_submissions is deliberately not translated: a first-person
      // perceptual report stays in the observer's own words. No fetch here.

      const communityTags = await getCommunityTags(String(r.id));

      const short = String(r.id).slice(0, 8);
      const tags = Array.isArray(r.tags) ? (r.tags as string[]) : [];
      const tagStr = tags.filter(Boolean).join(", ");
      const desc =
        (r.description && String(r.description).trim()) ||
        `A visual symbol reported during N,N-DMT experiences${
          tagStr ? `, tagged ${tagStr}` : ""
        }. Part of the open DMT Code catalogue.`;

      const phrase = symbolTitlePhrase(tags, communityTags);
      title = phrase
        ? `${phrase} - DMT symbol #${short.toUpperCase()} | DMT Code`
        : `Symbol ${short} | DMT Code Visual Registry`;
      metaDesc = clip(desc, 160);
      canonical = `${SITE}/registry/${r.id}`;
      ogImage = `${SITE}/card/${r.id}.png`;

      const pairs: Array<[string, unknown]> = [
        ["Dose level", r.dose_level],
        ["Wavelength", r.wavelength],
        ["Surface type", r.surface_type],
        ["Emotional valence", r.emotional_valence],
        ["Recurrence", r.recurrence],
        ["Source method", r.source_method],
        ["Duration (seconds)", r.duration_seconds],
      ];

      ld = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "@id": canonical,
        name: `DMT Code Symbol ${short}`,
        description: desc,
        image: r.image_url,
        url: canonical,
        dateCreated: r.created_at,
        dateModified: r.updated_at,
        keywords: [...new Set([...tags, ...communityTags.map((t) => t.name)])],
        ...(r.publication_consent === true ? { license: LICENSE } : {}),
        publisher: { "@id": `${SITE}#org` },
        creator: { "@id": `${SITE}#org` },
        isPartOf: {
          "@type": "Dataset",
          "@id": `${SITE}/registry#dataset`,
          name: "DMT Code Visual Symbol Registry",
          description:
            "Open, community maintained record of visual forms reported during N,N-DMT experiences and 650 nm laser exposure.",
          url: `${SITE}/registry`,
          identifier: "https://doi.org/10.5281/zenodo.17816519",
          sameAs: [
            "https://doi.org/10.5281/zenodo.17816519",
          ],
          license: LICENSE,
          creator: { "@id": `${SITE}#org` },
        },
        additionalProperty: pairs
          .filter(([, v]) => v !== null && v !== undefined && String(v) !== "")
          .map(([k, v]) => ({
            "@type": "PropertyValue",
            name: k,
            value: String(v),
          })),
        interactionStatistic: {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/LikeAction",
          userInteractionCount: Number(r.upvotes ?? 0),
        },
      };

      body = `<article data-prerender="symbol">
  <h1>${esc(phrase ? `${phrase} - DMT Code symbol #${short.toUpperCase()}` : `DMT Code Symbol ${short}`)}</h1>
  ${r.image_url ? `<img src="${esc(String(r.image_url))}" alt="${esc(metaDesc)}" />` : ""}
  <p>${esc(desc)}</p>
  ${rowsToDl(pairs)}
  ${
    tags.length
      ? `<section><h2>Tags</h2><ul>${tags
          .filter(Boolean)
          .map((t) => `<li>${esc(t)}</li>`)
          .join("")}</ul></section>`
      : ""
  }
  ${
    communityTags.length
      ? `<section><h2>Community context</h2><ul>${[...communityTags]
          .sort((a, b) => b.count - a.count)
          .map((t) => `<li>${esc(t.name)} (${t.count})</li>`)
          .join("")}</ul><p>Context tags added by readers after publication, ranked by agreement.</p></section>`
      : ""
  }
  ${
    Number(r.upvotes ?? 0) > 0
      ? `<p>${Number(r.upvotes ?? 0)} community ${
          Number(r.upvotes ?? 0) === 1 ? "member has" : "members have"
        } marked this symbol as echoing their own memory after it was published here. That is recognition after exposure to the catalogue, not an independent record made before seeing it.</p>`
      : ""
  }
  <p>Part of the <a href="${SITE}/registry">DMT Code Visual Symbol Registry</a>, an open registry of visual phenomena reported during N,N-DMT experiences. Records whose contributors consented to open licensing are published under CC-BY-4.0 in the dataset export.</p>
</article>`;
    } else if (kind === "trials") {
      const f =
        "id,title,description,institution,principal_investigator,status,phase,confirmed_status," +
        "start_date,end_date,trial_registry_id,doi,url,record_type,created_at,updated_at";
      const r = await getRow("clinical_trials", id, "is_approved=is.true", f);
      if (!r) return notFound404(await shellRes.text(), { title: "Trial not found | DMT Code", heading: "Trial not found", text: "This trial is not currently indexed or the link is out of date.", canonical: `${SITE}/trials`, backHref: `${SITE}/trials`, backLabel: "Clinical trials", marker: "trial-not-found" });
      overlay(r, await getTranslations("clinical_trials", String(r.id), locale));
      const isRegisteredTrial =
        isRegisteredTrialType(r.record_type) ||
        (typeof r.trial_registry_id === "string" &&
          /^NCT/i.test(r.trial_registry_id));
      noindex = !isRegisteredTrial;

      const desc =
        (r.description && String(r.description).trim()) ||
        (isRegisteredTrial
          ? `A registered clinical trial tracked by DMT Code${r.institution ? `, conducted at ${r.institution}` : ""}.`
          : `A ${trialTypeLabel(r.record_type).toLowerCase()} recorded by DMT Code. It is not a registered clinical trial and does not count as clinical evidence here.`);

      title = `${String(r.title)} | DMT Code Trials and Experiments`;
      metaDesc = clip(desc, 160);
      canonical = `${SITE}/trials/${r.id}`;

      const pairs: Array<[string, unknown]> = [
        ["Record type", trialTypeLabel(r.record_type)],
        ["Status", r.status],
        ["Phase", r.phase],
        ["Institution", r.institution],
        ["Principal investigator", r.principal_investigator],
        ["Start date", r.start_date],
        ["End date", r.end_date],
        ["Registry ID", r.trial_registry_id],
        ["DOI", r.doi],
      ];

      const sameAs: string[] = [];
      if (r.url) sameAs.push(String(r.url));
      if (r.doi) sameAs.push(`https://doi.org/${String(r.doi)}`);

      ld = isRegisteredTrial
        ? {
            "@context": "https://schema.org",
            "@type": "MedicalTrial",
            "@id": canonical,
            name: r.title,
            phase: r.phase || undefined,
            description: desc,
            url: canonical,
            studySubject: { "@type": "Drug", name: "N,N-Dimethyltryptamine (DMT)" },
            status: r.status,
            startDate: r.start_date,
            endDate: r.end_date,
            identifier: r.trial_registry_id,
            sameAs,
            publisher: { "@id": `${SITE}#org` },
            sponsor: r.institution
              ? { "@type": "Organization", name: r.institution }
              : undefined,
            author: r.principal_investigator
              ? { "@type": "Person", name: r.principal_investigator }
              : undefined,
            isPartOf: {
              "@type": "Dataset",
              "@id": `${SITE}/trials#dataset`,
              name: "DMT Code Trials and Experiments Observatory",
              description:
                "Open observatory of registered clinical trials involving N,N-DMT and related compounds, indexed from public trial registries, with typed community records listed separately.",
              url: `${SITE}/trials`,
              license: LICENSE,
              creator: { "@id": `${SITE}#org` },
            },
          }
        : {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "@id": canonical,
            name: r.title,
            description: desc,
            url: canonical,
            dateCreated: r.created_at,
            dateModified: r.updated_at,
            license: LICENSE,
            publisher: { "@id": `${SITE}#org` },
            creator: { "@id": `${SITE}#org` },
          };

      body = `<article data-prerender="trial">
  <h1>${esc(r.title)}</h1>
  <p>${esc(desc)}</p>
  ${rowsToDl(pairs)}
  ${
    r.confirmed_status && r.confirmed_status !== "Confirmed"
      ? `<p data-verification="${esc(String(r.confirmed_status))}"><strong>Verification status: ${esc(String(r.confirmed_status))}.</strong> This record has not been fully verified against a public trial registry entry. Treat it as unconfirmed until it is.</p>`
      : ""
  }
  ${
    r.url
      ? `<p><a href="${esc(r.url)}" rel="noopener">View trial record</a></p>`
      : ""
  }
  ${
    r.doi
      ? `<p>DOI: <a href="https://doi.org/${esc(r.doi)}" rel="noopener">${esc(r.doi)}</a></p>`
      : ""
  }
  <p>Listed in the <a href="${SITE}/trials">DMT Code trials, studies and experiments observatory</a>. Record type: ${esc(trialTypeLabel(r.record_type))}. Only registered clinical trials carry clinical authority in this record set.</p>
</article>`;
    } else if (kind === "bibliography") {
      const f =
        "id,title,authors,journal,publication_date,doi,pmid,isbn,abstract,url," +
        "compounds,content_type,authority_type,stance_score,tags,summary," +
        "source_date,full_text,transcript,created_at,updated_at";
      const r = await getRow("bibliography", id, "is_approved=eq.true", f, ["online_publication_date", "issue_date", "publication_status"]);
      if (!r) return notFound404(await shellRes.text(), { title: "Record not found | DMT Code", heading: "Record not found", text: "This bibliography record is not currently indexed or the link is out of date.", canonical: `${SITE}/bibliography`, backHref: `${SITE}/bibliography`, backLabel: "Research bibliography", marker: "bibliography-not-found" });

      // Bibliography overlays translate ONLY `summary`. Title, authors,
      // journal, doi, abstract, tags and compounds stay as the source record:
      // they are the citation glossary and must not be rewritten.
      overlay(r, await getTranslations("bibliography", String(r.id), locale), ["summary"]);

      const desc =
        (r.summary && String(r.summary).trim()) ||
        (r.abstract && String(r.abstract).trim().slice(0, 280)) ||
        `A ${String(r.content_type || "reference")} indexed by the DMT Code research bibliography${
          r.authors ? `, by ${String(r.authors).slice(0, 80)}` : ""
        }.`;

      title = `${String(r.title)} | DMT Code Bibliography`;
      metaDesc = clip(desc, 160);
      canonical = `${SITE}/bibliography/${r.id}`;

      const sameAs: string[] = [];
      if (r.doi) sameAs.push(`https://doi.org/${String(r.doi)}`);
      if (r.pmid) sameAs.push(`https://pubmed.ncbi.nlm.nih.gov/${String(r.pmid)}/`);
      if (r.url) sameAs.push(String(r.url));
      if (r.isbn) sameAs.push(`https://search.worldcat.org/isbn/${String(r.isbn)}`);

      const tags = Array.isArray(r.tags) ? (r.tags as string[]).filter(Boolean) : [];
      const compounds = Array.isArray(r.compounds)
        ? (r.compounds as string[]).filter(Boolean)
        : [];
      const stance = r.stance_score == null ? null : Number(r.stance_score);
      const isScholarly =
        String(r.content_type || "").toLowerCase().includes("paper") ||
        r.doi || r.pmid || r.journal;
      const isBook = String(r.content_type || "").toLowerCase() === "book";
      const bodyText =
        (r.full_text && String(r.full_text).trim()) ||
        (r.transcript && String(r.transcript).trim()) ||
        "";

      const additional: Array<Record<string, unknown>> = [];
      if (r.authority_type) additional.push({ "@type": "PropertyValue", name: "authority", value: String(r.authority_type) });
      if (stance !== null) additional.push({ "@type": "PropertyValue", name: "stanceScore", value: stance });
      if (compounds.length) additional.push({ "@type": "PropertyValue", name: "compounds", value: compounds.join(", ") });

      ld = {
        "@context": "https://schema.org",
        "@type": isBook ? "Book" : (isScholarly ? "ScholarlyArticle" : "CreativeWork"),
        "@id": canonical,
        name: r.title,
        headline: r.title,
        description: desc,
        url: canonical,
        author: r.authors ? { "@type": "Person", name: String(r.authors) } : undefined,
        datePublished: r.publication_date || r.source_date || undefined,
        dateModified: r.updated_at || undefined,
        identifier: r.doi ? `doi:${String(r.doi)}` : (r.pmid ? `pmid:${String(r.pmid)}` : undefined),
        isbn: r.isbn ? String(r.isbn) : undefined,
        sameAs: sameAs.length ? sameAs : undefined,
        keywords: [...tags, ...compounds],
        publisher: { "@id": `${SITE}#org` },
        license: LICENSE,
        isPartOf: {
          "@type": "Dataset",
          "@id": `${SITE}/bibliography#dataset`,
          name: "DMT Code Research Bibliography",
          description:
            "Stance scored research library covering N,N-DMT, 5-MeO-DMT, and related compounds.",
          url: `${SITE}/bibliography`,
          license: LICENSE,
          creator: { "@id": `${SITE}#org` },
        },
        additionalProperty: additional.length ? additional : undefined,
        text: bodyText || undefined,
      };

      const pairs: Array<[string, unknown]> = [
        ["Authors", r.authors],
        ["Journal", r.journal],
        ["Published", r.publication_date || r.source_date],
        ["Published online", r.online_publication_date],
        ["Issue date", r.issue_date],
        ["Publication status", r.publication_status ? String(r.publication_status).replace(/_/g, " ") : undefined],
        ["DOI", r.doi],
        ["PMID", r.pmid],
        ["ISBN", r.isbn],
        ["Content type", r.content_type],
        ["Authority", r.authority_type],
        ["Stance score", stance],
      ];

      body = `<article data-prerender="bibliography">
  <h1>${esc(r.title)}</h1>
  <p>${esc(desc)}</p>
  ${rowsToDl(pairs)}
  ${
    (r.abstract || r.summary)
      ? `<section><h2>Abstract</h2><p>${esc(String(r.abstract || r.summary))}</p></section>`
      : ""
  }
  ${
    (tags.length || compounds.length)
      ? `<section><h2>Topics</h2><ul>${[...tags, ...compounds]
          .map((t) => `<li>${esc(String(t))}</li>`)
          .join("")}</ul></section>`
      : ""
  }
  <section><h2>Citation</h2><p>${esc(
    [
      r.authors ? String(r.authors) : null,
      (r.publication_date || r.source_date) ? `(${String(r.publication_date || r.source_date).slice(0,4)})` : null,
      r.title ? `${String(r.title)}.` : null,
      r.journal ? `${String(r.journal)}.` : null,
      (r.content_type && !r.journal) ? `${String(r.content_type)}.` : null,
    ].filter(Boolean).join(" ")
  )}${
    r.doi ? ` <a href="https://doi.org/${esc(String(r.doi))}" rel="noopener">doi:${esc(String(r.doi))}</a>` : ""
  }</p></section>
  ${
    r.url
      ? `<p><a href="${esc(r.url)}" rel="noopener">View source</a></p>`
      : ""
  }
  ${
    r.doi
      ? `<p>DOI: <a href="https://doi.org/${esc(r.doi)}" rel="noopener">${esc(r.doi)}</a></p>`
      : ""
  }
  ${
    bodyText
      ? `<section><h2>Full text</h2><details><summary>Full text</summary><p>${esc(bodyText)}</p></details></section>`
      : ""
  }
  <p>Indexed by the <a href="${SITE}/bibliography">DMT Code Research Bibliography</a>, an open, stance scored library (CC-BY-4.0).</p>
</article>`;
    } else {
      return shellRes;
    }






    const breadcrumbLd = kind === "registry"
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE },
            { "@type": "ListItem", position: 2, name: "Registry", item: `${SITE}/registry` },
            { "@type": "ListItem", position: 3, name: String(title).split(" | ")[0] || "Symbol", item: canonical },
          ],
        }
      : kind === "trials"
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE },
            { "@type": "ListItem", position: 2, name: "Trials", item: `${SITE}/trials` },
            { "@type": "ListItem", position: 3, name: String(title).split(" | ")[0] || "Trial", item: canonical },
          ],
        }
      : kind === "bibliography"
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE },
            { "@type": "ListItem", position: 2, name: "Bibliography", item: `${SITE}/bibliography` },
            { "@type": "ListItem", position: 3, name: String(title).split(" | ")[0] || "Entry", item: canonical },
          ],
        }
      : null;

    const head = buildHead({
    locale,
      title,
      description: metaDesc,
      canonical,
      ogType: "article",
      ogImage: kind === "registry" ? ogImage : undefined,
      ogImageWidth: kind === "registry" ? 1200 : undefined,
      ogImageHeight: kind === "registry" ? 630 : undefined,
      robots: noindex ? "noindex,follow" : undefined,
      jsonLd: [ld, breadcrumbLd],
    });

    const html = renderShell(await shellRes.text(), head, body, locale);
    return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
  } catch (_e) {
    return context.next();
  }
};

const PREPARE_BUY_COPY = {
  en: {
    eyebrow: "Before you buy",
    shipping: {
      title: "Shipping",
      body: "Free within the United States. Orders are processed within 2 business days and arrive within 7 to 10 business days. You get a tracking email the moment it ships. Kits ship from Arbor Scientific in Arbor packaging with no prices on the packing slip.",
    },
    outside: {
      title: "Outside the US",
      body: "Checkout offers shipping to Canada, the UK, most EU countries, Switzerland, Norway, Australia, New Zealand, Japan, Singapore, Hong Kong, South Korea, Malaysia, Israel and the UAE. The carrier rate (USPS or DHL Express) is shown at checkout before you pay. Customs duties and import taxes are the buyer's responsibility.",
    },
    returns: {
      title: "Returns",
      body: "Unopened kits can be returned within 30 days of delivery. Opened laser modules are not returnable, since these are precision optical instruments that cannot be recalibrated or resold once the seal is broken. Return shipping is paid by the buyer. Approved refunds go back to the original payment method within 10 business days of receipt.",
    },
    damaged: {
      title: "Damaged or defective",
      body: "If a kit arrives damaged or a component is defective, email info@dmtcode.com within 7 days of delivery with photos of the item and packaging. We replace the affected component or the full kit at no cost.",
    },
    sellerPrefix: "Seller of record: Meridian Optics Lab, Tucson, Arizona. Checkout runs on Shopify.",
    sellerQuestions: "Questions: info@dmtcode.com, answered within 2 business days.",
    sellerPolicies: "Full policies",
    cardLine: "30-day returns on unopened kits. Free US shipping.",
    geoShips: "You appear to be in {country}. Shipping there is calculated at checkout (USPS or DHL Express) and shown before you pay.",
    geoNoShip: "You appear to be in {country}. We do not ship there yet. Email info@dmtcode.com and we will tell you when that changes.",
  },
  es: {
    eyebrow: "Antes de comprar",
    shipping: {
      title: "Envío",
      body: "Envío gratuito dentro de Estados Unidos. Los pedidos se procesan en 2 días hábiles y llegan en 7 a 10 días hábiles. Recibirá un correo con el número de seguimiento en cuanto salga el paquete. Los kits se envían desde Arbor Scientific en embalaje de Arbor, sin precios en el albarán.",
    },
    outside: {
      title: "Fuera de Estados Unidos",
      body: "El pago ofrece envío a Canadá, Reino Unido, la mayoría de los países de la UE, Suiza, Noruega, Australia, Nueva Zelanda, Japón, Singapur, Hong Kong, Corea del Sur, Malasia, Israel y Emiratos Árabes Unidos. La tarifa del transportista (USPS o DHL Express) se muestra antes de pagar. Los aranceles y los impuestos de importación corren a cargo del comprador.",
    },
    returns: {
      title: "Devoluciones",
      body: "Los kits sin abrir pueden devolverse en un plazo de 30 días desde la entrega. Los módulos láser abiertos no admiten devolución, ya que son instrumentos ópticos de precisión que no pueden recalibrarse ni revenderse una vez roto el precinto. El envío de la devolución lo paga el comprador. Los reembolsos aprobados se abonan al método de pago original en un plazo de 10 días hábiles desde la recepción.",
    },
    damaged: {
      title: "Dañado o defectuoso",
      body: "Si el kit llega dañado o algún componente es defectuoso, escriba a info@dmtcode.com en los 7 días siguientes a la entrega con fotos del artículo y del embalaje. Sustituimos el componente afectado o el kit completo sin coste.",
    },
    sellerPrefix: "Vendedor: Meridian Optics Lab, Tucson, Arizona. El pago se realiza en Shopify.",
    sellerQuestions: "Consultas: info@dmtcode.com, respuesta en 2 días hábiles.",
    sellerPolicies: "Políticas completas",
    cardLine: "Devoluciones en 30 días para kits sin abrir. Envío gratuito en EE. UU.",
    geoShips: "Parece que está en {country}. El envío hasta allí se calcula al pagar (USPS o DHL Express) y se muestra antes del pago.",
    geoNoShip: "Parece que está en {country}. Todavía no enviamos allí. Escriba a info@dmtcode.com y le avisaremos cuando cambie.",
  },
  de: {
    eyebrow: "Vor dem Kauf",
    shipping: {
      title: "Versand",
      body: "Kostenloser Versand innerhalb der USA. Bestellungen werden innerhalb von 2 Werktagen bearbeitet und kommen innerhalb von 7 bis 10 Werktagen an. Sobald das Paket unterwegs ist, erhalten Sie eine E-Mail mit der Sendungsverfolgung. Die Kits werden von Arbor Scientific in Arbor-Verpackung verschickt, ohne Preise auf dem Lieferschein.",
    },
    outside: {
      title: "Außerhalb der USA",
      body: "Beim Bezahlen wird Versand nach Kanada, Großbritannien, in die meisten EU-Länder, in die Schweiz, nach Norwegen, Australien, Neuseeland, Japan, Singapur, Hongkong, Südkorea, Malaysia, Israel und in die Vereinigten Arabischen Emirate angeboten. Der Tarif des Versanddienstleisters (USPS oder DHL Express) wird vor der Zahlung angezeigt. Zölle und Einfuhrsteuern trägt der Käufer.",
    },
    returns: {
      title: "Rückgabe",
      body: "Ungeöffnete Kits können innerhalb von 30 Tagen nach Lieferung zurückgegeben werden. Geöffnete Lasermodule sind von der Rückgabe ausgeschlossen, da es sich um optische Präzisionsinstrumente handelt, die nach dem Brechen des Siegels weder neu kalibriert noch weiterverkauft werden können. Die Rücksendekosten trägt der Käufer. Genehmigte Erstattungen gehen innerhalb von 10 Werktagen nach Eingang an die ursprüngliche Zahlungsmethode zurück.",
    },
    damaged: {
      title: "Beschädigt oder defekt",
      body: "Kommt ein Kit beschädigt an oder ist ein Bauteil defekt, schreiben Sie innerhalb von 7 Tagen nach Lieferung an info@dmtcode.com und fügen Sie Fotos des Artikels und der Verpackung bei. Wir ersetzen das betroffene Bauteil oder das komplette Kit kostenlos.",
    },
    sellerPrefix: "Verkäufer: Meridian Optics Lab, Tucson, Arizona. Die Zahlung läuft über Shopify.",
    sellerQuestions: "Fragen: info@dmtcode.com, Antwort innerhalb von 2 Werktagen.",
    sellerPolicies: "Alle Richtlinien",
    cardLine: "30 Tage Rückgaberecht für ungeöffnete Kits. Kostenloser Versand in den USA.",
    geoShips: "Sie scheinen sich in {country} zu befinden. Der Versand dorthin wird beim Bezahlen berechnet (USPS oder DHL Express) und vor der Zahlung angezeigt.",
    geoNoShip: "Sie scheinen sich in {country} zu befinden. Dorthin versenden wir noch nicht. Schreiben Sie an info@dmtcode.com, wir melden uns, sobald sich das ändert.",
  },
} as const;

const SHIP_TO = new Set([
  "US","AE","AT","AU","BE","CA","CH","CZ","DE","DK","ES","FI","FR","GB","HK",
  "IE","IL","IT","JP","KR","MY","NL","NO","NZ","PL","PT","SE","SG",
]);

function prepareBuyCopy(locale: Loc) {
  return (PREPARE_BUY_COPY as Record<string, typeof PREPARE_BUY_COPY.en>)[locale] || PREPARE_BUY_COPY.en;
}

function regionLabel(code: string, locale: Loc): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) || code;
  } catch (_e) {
    return code;
  }
}

// The documents offered on /prepare and on /downloads, and the count spelled in
// words. Both come from netlify/lib/documents.ts, which mirrors
// src/data/documents.ts and is checked against the files actually present in
// public/downloads by scripts/check-docs-drift.mjs. This used to be a hand typed
// list and a hand typed number, and they drifted: the page said "Twelve PDF
// documents" while /llms.txt, which counts the directory, said thirteen, and the
// file they disagreed about was the symbol set.
const PREPARE_DOC_FILES = DOCUMENTS.flatMap((d) => d.files.map((f) => f.file));
const PREPARE_DOC_COUNT = docCountWord(true);

// Language suffix as the /prepare list has always written it.
const DOC_LANG_TAG: Record<string, string> = { en: "EN", es: "ES", de: "DE" };

function docListHtml(): string {
  const rows: string[] = [];
  for (const d of DOCUMENTS) {
    for (const f of d.files) {
      rows.push(
        `      <li><a href="${SITE}/downloads/${f.file}">${d.title} (${DOC_LANG_TAG[f.lang] || f.lang.toUpperCase()})</a></li>`,
      );
    }
  }
  return rows.join("\n");
}

async function renderPrepare(context: Context, request: Request, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();

  const urlGeo = (new URL(request.url).searchParams.get("geo") || "").toUpperCase();
  const geoCtx = (context as unknown as { geo?: { country?: { code?: string } } }).geo;
  const detected = ((geoCtx && geoCtx.country && geoCtx.country.code) || "").toUpperCase();
  const country = /^[A-Z]{2}$/.test(urlGeo) ? urlGeo : detected;
  const ships = SHIP_TO.has(country);
  const buy = prepareBuyCopy(locale);
  const geoSentence =
    country && country !== "US"
      ? (ships ? buy.geoShips : buy.geoNoShip).replace("{country}", regionLabel(country, locale))
      : "";

  const canonical = `${SITE}/prepare`;
  const prepareCopy = uiCopy("prepare", locale);
  const title = prepareCopy.title;
  const metaDesc = clip(prepareCopy.description, 200);

  const shippingDetails = {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "USD" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 3,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 4,
        maxValue: 7,
        unitCode: "DAY",
      },
    },
  };

  const productLds = KITS.map((k) => {
    const ld: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${canonical}#${k.id}`,
      name: k.name,
      description: k.description,
      sku: k.sku,
      brand: { "@type": "Brand", name: "Meridian Optics Lab" },
      offers: {
        "@type": "Offer",
        url: k.cart,
        price: k.priceNumber,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: "Meridian Optics Lab" },

        shippingDetails,
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "US",
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: 30,
          returnMethod: "https://schema.org/ReturnByMail",
          returnFees: "https://schema.org/ReturnShippingFees",
          refundType: "https://schema.org/FullRefund",
          itemCondition: "https://schema.org/NewCondition",
        },
      },
    };
    if (k.image) ld.image = k.image;
    return ld;
  });

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": canonical,
    name: "DMT Code Laser Diffraction Research Kits",
    itemListElement: KITS.map((k, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: k.name,
      url: `${canonical}#${k.id}`,
    })),
  };

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}#website`,
    url: SITE,
    name: "DMT Code",
    publisher: { "@id": `${SITE}#org` },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Prepare", item: canonical },
    ],
  };

  const kitBlocks = KITS.map(
    (k) => `<section id="${esc(k.id)}">
    <h3>${esc(k.name)}</h3>
    ${k.image ? `<img src="${esc(k.image)}" alt="${esc(k.name)}" width="800" height="450" />` : ""}
    <p><strong>$${k.priceNumber.toLocaleString("en-US")}</strong></p>
    <p>${esc(k.description)}</p>
    <p>Arrives in 7 to 10 business days, processed within 2. Free US shipping. 18+, for research use.</p>
    <p>Ships from Arbor Scientific. Expect Arbor branding on the box, tape and packing slip. No prices on the packing slip. Meridian Optics Lab is the seller of record.</p>
    <p>Laser pointers in these kits are vendor rated 5 mW, FDA Class IIIa (Class 3R); the ray box in the Triad and Circle is under 1 mW. Ratings are listed per emitter on each kit. Do not stare into beam.</p>
    <p><a href="${esc(k.cart)}">Buy - secure Shopify checkout</a></p>
    <p>Your card statement will read MERIDIAN OPTICS LAB.</p>

  </section>`,
  ).join("");

  const body = `<article data-prerender="prepare">
  <!--tsrc:static:prepare-->
  <h1>Careful preparation over careless purchase</h1>
  <p>${esc(metaDesc)}</p>
  <section data-prerender="prepare-stage-framing">
    <h2>What a kit is for</h2>
    <p>Stage one is screening, not the experiment. The symbol registry is a screening collection, not a controlled experiment: it is open, self selected and unblinded, and priming is not ruled out. It can only show whether there is a hint of agreement worth digging into. Nothing here settles the question.</p>
    <p>Stage two is capture before exposure. Stage three is a randomized blinded arm with control conditions, blind scoring and pre registered hypotheses. Stage three is designed and has not been run. A kit lets you run the observation carefully and add a record. It does not turn a personal session into a controlled result.</p>
  </section>
  <section>
    <h2>Before you go further</h2>
    <p>Adults 18 and older only. Raise the following with a qualified prescriber before any consideration of practice:</p>
    <ul>
      <li>MAOIs, current or recent</li>
      <li>SSRIs and related serotonergic medications</li>
      <li>Cardiac history</li>
      <li>Personal or family history of psychosis</li>
    </ul>
    <p>We publish no discontinuation windows. Timing decisions belong to a clinician who knows your history.</p>
    <p>Pointers vendor rated 5 mW, FDA Class IIIa (Class 3R), ray box under 1 mW: do not stare into the beam, do not aim it at anyone, and treat every reflective surface in the room as part of the beam path.</p>
  </section>
  <!--/tsrc-->
  <section data-block="shipping-returns">
    <h2>${esc(buy.eyebrow)}</h2>
    <h3>${esc(buy.shipping.title)}</h3>
    <p>${esc(buy.shipping.body)}</p>
    <h3>${esc(buy.outside.title)}</h3>
    <p>${esc(buy.outside.body)}${geoSentence ? ` <span data-geo="${esc(country)}">${esc(geoSentence)}</span>` : ""}</p>
    <h3>${esc(buy.returns.title)}</h3>
    <p>${esc(buy.returns.body)}</p>
    <h3>${esc(buy.damaged.title)}</h3>
    <p>${esc(buy.damaged.body)}</p>
    <p>${esc(buy.sellerPrefix)} ${esc(buy.sellerQuestions.split("info@dmtcode.com")[0])}<a href="mailto:info@dmtcode.com">info@dmtcode.com</a>${esc(buy.sellerQuestions.split("info@dmtcode.com")[1] || "")} <a href="${SITE}/returns">${esc(buy.sellerPolicies)}</a></p>
  </section>
  <section>
    <h2>Laser diffraction research kits</h2>
    ${kitBlocks}
  </section>
  <section>
    <h2>Field materials and protocols, free download</h2>
    <p>${PREPARE_DOC_COUNT} PDF documents, no account needed. Each protocol is available in English, Spanish, and German. Nothing here requires buying a kit. Full descriptions of what each document is and when to use it are at <a href="${SITE}/downloads">/downloads</a>.</p>
    <p><strong><a href="${SITE}/downloads/dmt-laser-code-symbols.pdf">DMT Laser Code Symbols (PDF)</a></strong>. The forms people have reported so far, printed for reference. It is a record of what observers drew, not a key, a translation, or a claim that the forms mean anything. If you saw something that is not in it, <a href="${SITE}/capture">add yours to the registry</a>. Reading it first counts as having seen the catalogue, and a record submitted afterwards should say so.</p>
    <ul>
${docListHtml()}
    </ul>
  </section>
  <section>
    <h2>The open data behind this</h2>
    <p>The convergence registry (<a href="${SITE}/registry">/registry</a>) and the machine-readable corpus (<a href="${SITE}/dataset">/dataset</a>, <a href="${SITE}/data.json">/data.json</a>) are CC-BY-4.0.</p>
  </section>
</article>`;

  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "website",
    jsonLd: [organizationLd, websiteLd, breadcrumbLd, itemListLd, ...productLds],
  }) + (country
    ? `<script>window.__DMTCODE_GEO__=${JSON.stringify({ country, ships })}</script>`
    : "");

  const html = renderShell(await shellRes.text(), head, body, locale);
  // The CDN cache key ignores the query string, so a ?geo= override render must
  // never be stored: bypass the cache entirely on that path. Without an
  // override the response is cached at the edge (netlify-cdn-cache-control has
  // s-maxage and durable), so cached copies must vary per country.
  const usedOverride = /^[A-Z]{2}$/.test(urlGeo);
  return new Response(html, {
    status: 200,
    headers: usedOverride
      ? {
          ...PRERENDER_RESP_HEADERS,
          "cache-control": "private, no-store",
          "netlify-cdn-cache-control": "no-store",
        }
      : { ...PRERENDER_RESP_HEADERS, "netlify-vary": "country" },
  });
}


// ---------- /downloads, the document index ----------
//
// This page exists because the highest click through query the site has,
// "dmt laser code symbols pdf", was landing people on the PDF file itself: no
// navigation, no statement of what the catalogue is and is not, and no way to
// record an observation. Meanwhile /llms.txt was telling machines the documents
// lived "under /downloads/" and the bare path returned 404. Every row here is
// rendered from netlify/lib/documents.ts, the same manifest the React page at
// src/pages/Downloads.tsx renders from.
async function renderDownloads(context: Context, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/downloads`;
  const copy = uiCopy("downloads", locale);
  const title = copy.title;
  const metaDesc = clip(copy.description, 200);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Documents", item: canonical },
    ],
  };
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": canonical,
    name: "DMT Code protocol documents",
    url: canonical,
    license: LICENSE,
    isAccessibleForFree: true,
    publisher: { "@id": `${SITE}#org` },
    hasPart: DOCUMENTS.map((d) => ({
      "@type": "DigitalDocument",
      name: d.title,
      description: d.summary,
      url: `${SITE}/downloads/${d.files[0].file}`,
      encodingFormat: "application/pdf",
      license: LICENSE,
      isAccessibleForFree: true,
      inLanguage: d.files.map((f) => f.lang),
    })),
  };

  const docSections = DOCUMENTS.map((d) => `  <section id="${d.id}">
    <h2>${esc(d.title)}</h2>
    <p><small>${esc(d.kind)}</small></p>
    <p>${esc(d.summary)}</p>
    <p><strong>What it is not.</strong> ${esc(d.notThis)}</p>
    <p><strong>When to use it.</strong> ${esc(d.useWhen)}</p>
    <ul>
${d.files.map((f) => `      <li><a href="${SITE}/downloads/${f.file}">${esc(d.title)} (${esc(f.label)}) PDF</a></li>`).join("\n")}
    </ul>
  </section>`).join("\n");

  const body = `<article data-prerender="downloads">
  <!--tsrc:static:downloads-->
  <h1>Everything you need to run a session, free</h1>
  <p>${PREPARE_DOC_COUNT} PDF files, ${DOCUMENTS.length} documents, each one in English, Spanish and German where a translation exists. No account, no email, no kit. Licensed CC-BY-4.0, which means you can print them, hand them out, translate them and publish what you find.</p>
  <p>You do not need to buy anything to take part. The <a href="${SITE}/protocol-guide">protocol guide</a> describes how to build the rig from parts you can source yourself, and <a href="${SITE}/prepare">/prepare</a> sells an assembled version for people who would rather not.</p>
${docSections}
  <section>
    <h2>Read the catalogue after you record, not before</h2>
    <p>The symbol set is the one document with an order attached to it. If you have seen something and have not written it down yet, write it down first. A description made before you look at what other people drew is worth more than the same description made after, and the registry keeps the two apart.</p>
    <p><a href="${SITE}/capture">Record what you saw</a>, then come back and open the catalogue. If you have already read it, say so on the form. Nothing is thrown away for having been read first, it is only counted differently.</p>
    <p>The underlying records are open too: the browseable <a href="${SITE}/registry">registry</a>, the <a href="${SITE}/dataset">dataset page</a> and the machine readable corpus at <a href="${SITE}/data.json">/data.json</a>, all CC-BY-4.0.</p>
  </section>
  <!--/tsrc-->
  <p>License: CC-BY-4.0. Attribute to DMT Code, ${SITE}.</p>
</article>`;

  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "article",
    jsonLd: [breadcrumbLd, collectionLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}


async function renderEvidenceMap(context: Context, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/evidence-map`;
  const evidenceCopy = uiCopy("evidence-map", locale);
  const title = evidenceCopy.title;
  const metaDesc = clip(evidenceCopy.description, 200);

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}#website`,
    url: SITE,
    name: "DMT Code",
    publisher: { "@id": `${SITE}#org` },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Evidence", item: canonical },
    ],
  };
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": canonical,
    headline: "Is the DMT code real? Evidence Timeline and Analysis",
    description: metaDesc,
    url: canonical,
    license: LICENSE,
    publisher: { "@id": `${SITE}#org` },
    author: { "@id": `${SITE}#org` },
  };
  const datasetLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${SITE}/registry#dataset`,
    name: "DMT Code Visual Symbol Registry",
    description: "Open, community maintained record of visual forms reported during N,N-DMT experiences and 650 nm laser exposure.",
    license: LICENSE,
    url: `${SITE}/registry`,
    identifier: "https://doi.org/10.5281/zenodo.17816519",
    creator: { "@id": `${SITE}#org` },
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${SITE}/data.json` },
    ],
    sameAs: [
      "https://doi.org/10.5281/zenodo.17816519",
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is the DMT code verifiable?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The record is built so that it can fail, which is what makes the question answerable. The registry publishes every observer submission, and it shows how many readers said a form echoed their own memory after seeing it here. That is recognition after exposure, not independent confirmation. The full corpus is downloadable at /data.json under CC-BY-4.0.",
        },
      },
      {
        "@type": "Question",
        name: "Is it falsifiable?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Convergence claims can be tested against the registry and against blinded replication attempts. Null reports are tracked at /null-reports.",
        },
      },
      {
        "@type": "Question",
        name: "Where is the reference for the 650 nm laser protocol?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Goler D. 2025, Detailing a Pilot Study: The 'Code of Reality' Protocol, A Phenomenon of N,N-DMT Induced States of Consciousness. IPI Letters, pages N1 to N5, DOI 10.59973/ipil.158. It is a pilot report in a letters venue rather than a controlled trial. The dated chronology at /timeline labels it that way and lists the peer reviewed DMT literature separately.",
        },
      },
    ],
  };

  const body = `<article data-prerender="evidence-map">
  <!--tsrc:static:evidence-map-->
  <h1>Is the DMT code real? An evidence timeline for the 650 nm laser paradigm</h1>
  <p>The claim under test is narrow. During N,N-DMT experiences, and under a specific 650 nm laser observation protocol, independent people appear to report the same discrete visual forms. This page lays out what the open record currently shows so any reader, human or machine, can judge the claim on the data rather than on assertion.</p>
  <section>
    <h2>Which stage each band of evidence belongs to</h2>
    <p>Stage one is screening, not the experiment. The symbol registry is a screening collection, not a controlled experiment: it is open, self selected and unblinded, and priming is not ruled out. Screening can only show whether there is a hint of agreement worth digging into. It cannot settle the question, and nothing on this page settles it either.</p>
    <p>Stage two is capture before exposure, where an account is recorded before the contributor sees the catalogue. Stage three is a randomized blinded arm with control conditions, blind scoring and pre registered hypotheses. Stage three is designed and has not been run.</p>
    <p>Read each record below against that scale. The peer reviewed and clinical records are prior literature on the wider phenomenon, not tests of this claim. The pilot report, the community submissions and the registry counts are stage one screening. No record on this timeline comes from stage three. Reports of seeing nothing are wanted and counted, and they are published at <a href="${SITE}/null-reports">/null-reports</a>.</p>
  </section>
  <section>
    <h2>What the claim is, and what it is not</h2>
    <p>The claim is convergence: strangers who have never spoken landing on the same forms. It is not a claim that the forms carry a message, that reality is literally coded, or that the phenomenon has a known cause. Each of those is a separate question and is treated separately in the record.</p>
  </section>
  <section>
    <h2>What the open data shows</h2>
    <p>The <a href="${SITE}/registry">visual symbol registry</a> publishes every observer submission the moment it is made, and shows how many readers said the form echoed their own memory after seeing it here. That is recognition after exposure, not an independent match. The full corpus, including bibliography and clinical trials, is downloadable at <a href="${SITE}/data.json">/data.json</a> under CC-BY-4.0. Null results are tracked at <a href="${SITE}/null-reports">/null-reports</a>. Part of the bibliography carries a stance score from skeptical to supportive, so that part of the distribution can be inspected directly.</p>
  </section>
  <section>
    <h2>How to judge it</h2>
    <p>Read the bibliography with the stance filter set to skeptical first. Then load the registry, and when you look at how many readers recognized a form, remember that they saw it here before they responded. Then read the null-reports dashboard. If the convergence is real, it should hold up under blinded conditions, where an account is sealed before the person ever views the catalogue. If it is not real, that failure should be visible in the same record. The dataset is designed to be able to fail.</p>
  </section>
  <section>
    <h2>Primary reference for the laser protocol</h2>
    <p>Goler D. 2025, Detailing a Pilot Study: The 'Code of Reality' Protocol, A Phenomenon of N,N-DMT Induced States of Consciousness. IPI Letters, pages N1 to N5, DOI <a href="https://doi.org/10.59973/ipil.158">10.59973/ipil.158</a>. It is a pilot report in a letters venue rather than a controlled trial, and the chronology labels it that way. The peer reviewed literature on DMT phenomenology is separate and is listed in the same chronology.</p>
  </section>
  <section>
    <h2>The dated record</h2>
    <p>Every source on this timeline also exists as a dated record with its own address at <a href="${SITE}/timeline">/timeline</a>, where the same set can be sorted by date, person, place or kind of evidence and filtered by tag. The underlying data is <a href="${SITE}/timeline.json">/timeline.json</a> and the schema for adding a paper is <a href="${SITE}/timeline.schema.json">/timeline.schema.json</a>.</p>
  </section>
  <!--/tsrc-->
  <p>License: CC-BY-4.0. Attribute to DMT Code, ${SITE}.</p>
</article>`;

  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "article",
    jsonLd: [organizationLd, websiteLd, breadcrumbLd, articleLd, datasetLd, faqLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

// ---------- Chronology prerender ----------

type TlDate = { year: number; month?: number; day?: number; precision: string; sort_key: string };
type TlPerson = { name: string; sort: string };
type TlPlace = { label: string; country: string };
type TlSource = {
  kind: string;
  title?: string;
  authors?: string[];
  container?: string;
  volume?: string;
  pages?: string;
  publisher?: string;
  year?: number;
  doi?: string;
  isbn?: string;
  url?: string;
  citation?: string;
  note?: string;
};
type TlEntry = {
  id: string;
  date: TlDate;
  headline: string;
  summary: string;
  people?: TlPerson[];
  place?: TlPlace;
  tags: string[];
  evidence_class: string;
  source: TlSource;
};
type TlFile = {
  schema_version: string;
  schema_url?: string;
  provenance: { verified_on: string; verified_against: string; rule: string };
  title: { headline: string; text: string };
  evidence_classes: Record<string, string>;
  entries: TlEntry[];
};

const TL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TL_LABEL: Record<string, string> = {
  peer_reviewed: "Peer reviewed",
  book: "Book",
  legal: "Legal",
  letters: "Letters",
  journalism: "Journalism",
  commentary: "Commentary",
  platform_record: "Platform record",
  community_report: "Community report",
};

function tlDate(d: TlDate): string {
  if (d.precision === "day" && d.month && d.day) {
    return `${d.day} ${TL_MONTHS[d.month - 1]} ${d.year}`;
  }
  if (d.precision === "month" && d.month) {
    return `${TL_MONTHS[d.month - 1]} ${d.year}`;
  }
  return String(d.year);
}

function tlLink(s: TlSource): string {
  if (s.doi) return `https://doi.org/${s.doi}`;
  if (s.url) return s.url;
  return "";
}

// public/timeline.json is a static asset. It is deliberately NOT mapped to this
// edge function in netlify.toml, so fetching it here cannot re-enter this
// handler. Never hardcode a copy of this data: the file is the single source of
// truth and a second copy would drift out of sync with it.
async function tlLoad(request: Request): Promise<TlFile | null> {
  try {
    const res = await fetch(new URL("/timeline.json", request.url).toString(), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const file = (await res.json()) as TlFile;
    if (!file || !Array.isArray(file.entries) || file.entries.length === 0) return null;
    return file;
  } catch (_e) {
    return null;
  }
}

function tlSorted(file: TlFile): TlEntry[] {
  return [...file.entries].sort((a, b) => a.date.sort_key.localeCompare(b.date.sort_key));
}

async function renderTimelineIndex(context: Context, request: Request, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const shellHtml = await shellRes.text();
  const canonical = `${SITE}/timeline`;
  const file = await tlLoad(request);

  if (!file) {
    const head = buildHead({
    locale,
      title: uiCopy("timeline-empty", locale).title,
      description: uiCopy("timeline-empty", locale).description,
      canonical,
    });
    const body = `<article data-prerender="timeline">
  <h1>Chronology</h1>
  <p>The chronology data is served from <a href="${SITE}/timeline.json">/timeline.json</a>.</p>
  ${await golerAttribution(locale)}
</article>`;
    return new Response(renderShell(shellHtml, head, body, locale), { status: 200, headers: PRERENDER_RESP_HEADERS });
  }

  const entries = tlSorted(file);
  const firstYear = entries[0].date.year;
  const lastYear = entries[entries.length - 1].date.year;
  const timelineCopy = uiCopy("timeline", locale, {
    first: firstYear,
    last: lastYear,
    n: entries.length,
  });
  const title = timelineCopy.title;
  const metaDesc = clip(timelineCopy.description, 200);
  const trs = await getTranslations("static", "timeline", locale);


  const classCounts = new Map<string, number>();
  for (const e of entries) {
    classCounts.set(e.evidence_class, (classCounts.get(e.evidence_class) ?? 0) + 1);
  }
  const classList = Object.keys(file.evidence_classes)
    .filter((k) => classCounts.has(k))
    .map((k) => `<div><dt>${esc(TL_LABEL[k] ?? k)} (${classCounts.get(k)})</dt><dd>${esc(file.evidence_classes[k])}</dd></div>`)
    .join("");

  const tagCounts = new Map<string, number>();
  for (const e of entries) {
    for (const t of e.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const tagList = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t, n]) => `<li><a href="${SITE}/timeline?tag=${encodeURIComponent(t)}">${esc(t)}</a> (${n})</li>`)
    .join("");

  const items = entries
    .map((e) => {
      const href = tlLink(e.source);
      const kind = TL_LABEL[e.evidence_class] ?? e.evidence_class;
      const who = (e.people ?? []).map((p) => esc(p.name)).join(", ");
      const where = e.place ? esc(e.place.label) : "";
      const cite = [
        e.source.title ? esc(e.source.title) : "",
        e.source.container ? esc(e.source.container) : "",
        e.source.publisher ? esc(e.source.publisher) : "",
        e.source.year ? String(e.source.year) : "",
      ].filter(Boolean).join(". ");
      return `<li>
  <h3><a href="${SITE}/timeline/${esc(e.id)}">${esc(e.headline)}</a></h3>
  <p><time>${esc(tlDate(e.date))}</time>. ${esc(kind)}${who ? `. ${who}` : ""}${where ? `. ${where}` : ""}</p>
  <p>${esc(e.summary)}</p>
  ${cite ? `<p>${cite}</p>` : ""}
  ${e.source.citation ? `<p>${esc(e.source.citation)}</p>` : ""}
  ${e.source.note ? `<p>${esc(e.source.note)}</p>` : ""}
  ${href ? `<p><a href="${esc(href)}">${esc(href)}</a></p>` : ""}
</li>`;
    })
    .join("\n");

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Chronology", item: canonical },
    ],
  };
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": canonical,
    name: file.title.headline,
    description: metaDesc,
    url: canonical,
    license: LICENSE,
    publisher: { "@id": `${SITE}#org` },
    isBasedOn: `${SITE}/timeline.json`,
  };
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${canonical}#list`,
    name: file.title.headline,
    numberOfItems: entries.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: entries.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/timeline/${e.id}`,
      name: e.headline,
    })),
  };

  const body = trs.body_html?.trim()
    ? `<article data-prerender="timeline">${trs.body_html}${await golerAttribution(locale)}</article>`
    : `<article data-prerender="timeline">
   <!--tsrc:static:timeline-->
   <h1>${esc(file.title.headline)}</h1>
  <p>${esc(file.title.text)}</p>
  <p>${entries.length} dated records, ${firstYear} to ${lastYear}. The interactive version of the same set is at <a href="${SITE}/evidence-map">/evidence-map</a>.</p>
  <section>
    <h2>How the records are labelled</h2>
    <dl>${classList}</dl>
  </section>
  <section>
    <h2>The chronology</h2>
    <ol>
${items}
    </ol>
  </section>
  <section>
    <h2>Tags</h2>
    <ul>${tagList}</ul>
  </section>
  <section>
    <h2>Provenance</h2>
    <p>Citations checked on ${esc(file.provenance.verified_on)} against ${esc(file.provenance.verified_against)}. ${esc(file.provenance.rule)}</p>
    <p>The data is <a href="${SITE}/timeline.json">/timeline.json</a>. The schema for adding a paper or article is <a href="${SITE}/timeline.schema.json">/timeline.schema.json</a>. Append one object to entries that validates against the entry definition and it appears here.</p>
  </section>
  <p>License: CC-BY-4.0. Attribute to DMT Code, ${SITE}.</p>
  <!--/tsrc-->
  ${await golerAttribution(locale)}
</article>`;


  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "website",
    jsonLd: [organizationLd, breadcrumbLd, collectionLd, itemListLd],
  });

  return new Response(renderShell(shellHtml, head, body, locale), { status: 200, headers: PRERENDER_RESP_HEADERS });
}

async function renderTimelineEntry(context: Context, request: Request, rawId: string, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const shellHtml = await shellRes.text();
  const id = decodeURIComponent(rawId).toLowerCase();
  const file = await tlLoad(request);

  // If the data cannot be read we must not 404 a record that may well exist.
  // Serve the shell and let the client render it, marked noindex.
  if (!file) {
    const head = buildHead({
    locale,
      title: "Chronology record | DMT Code",
      canonical: `${SITE}/timeline/${id}`,
      robots: "noindex, follow",
    });
    const body = `<article data-prerender="timeline-entry">
  <h1>Chronology record</h1>
  <p>The chronology is at <a href="${SITE}/timeline">/timeline</a>.</p>
</article>`;
    return new Response(renderShell(shellHtml, head, body, locale), { status: 200, headers: PRERENDER_RESP_HEADERS });
  }

  const entries = tlSorted(file);
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) {
    return notFound404(shellHtml, {
      title: "Record not found | DMT Code",
      heading: "Record not found",
      text: `Nothing in the chronology has the identifier ${id}. Record addresses never change once published, so this is either a typo or a link to something that was never here.`,
      canonical: `${SITE}/timeline`,
      backHref: "/timeline",
      backLabel: "Back to the chronology",
      marker: "timeline-entry",
    });
  }

  const e = entries[idx];
  const prev = entries[idx - 1];
  const next = entries[idx + 1];
  const href = tlLink(e.source);
  const kind = TL_LABEL[e.evidence_class] ?? e.evidence_class;
  const classNote = file.evidence_classes[e.evidence_class] ?? "";
  const canonical = `${SITE}/timeline/${e.id}`;
  const title = `${e.headline} | DMT Code`;
  const metaDesc = clip(e.summary, 160);

  const dl = rowsToDl([
    ["Title", e.source.title],
    ["Authors", (e.source.authors ?? []).join(", ")],
    ["Published in", e.source.container],
    ["Volume", e.source.volume],
    ["Pages", e.source.pages],
    ["Publisher", e.source.publisher],
    ["Year", e.source.year],
    ["DOI", e.source.doi],
    ["ISBN", e.source.isbn],
    ["Citation", e.source.citation],
  ]);

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Chronology", item: `${SITE}/timeline` },
      { "@type": "ListItem", position: 3, name: e.headline, item: canonical },
    ],
  };
  // Structured data is emitted for the underlying work ONLY when a resolved
  // identifier exists. Never emit a citation without one.
  const workLd = (e.source.doi || e.source.isbn)
    ? {
        "@context": "https://schema.org",
        "@type": e.evidence_class === "book" ? "Book" : "ScholarlyArticle",
        "@id": `${canonical}#work`,
        name: e.source.title ?? e.headline,
        url: canonical,
        ...(e.source.authors ? { author: e.source.authors.map((a) => ({ "@type": "Person", name: a })) } : {}),
        ...(e.source.container ? { isPartOf: e.source.container } : {}),
        ...(e.source.publisher ? { publisher: e.source.publisher } : {}),
        ...(e.source.year ? { datePublished: String(e.source.year) } : {}),
        ...(e.source.doi
          ? {
              identifier: { "@type": "PropertyValue", propertyID: "DOI", value: e.source.doi },
              sameAs: `https://doi.org/${e.source.doi}`,
            }
          : {}),
        ...(e.source.isbn ? { isbn: e.source.isbn } : {}),
      }
    : null;

  const body = `<article data-prerender="timeline-entry">
  <p><a href="${SITE}/timeline">Chronology</a></p>
  <h1>${esc(e.headline)}</h1>
  <p><time>${esc(tlDate(e.date))}</time>. ${esc(kind)}.</p>
  ${classNote ? `<p>${esc(classNote)}</p>` : ""}
  <p>${esc(e.summary)}</p>
  ${(e.people ?? []).length ? `<p>People: ${(e.people ?? []).map((p) => esc(p.name)).join(", ")}</p>` : ""}
  ${e.place ? `<p>Place: ${esc(e.place.label)}</p>` : ""}
  <p>Tags: ${e.tags.map((t) => `<a href="${SITE}/timeline?tag=${encodeURIComponent(t)}">${esc(t)}</a>`).join(", ")}</p>
  <section>
    <h2>The source</h2>
    ${dl}
    ${e.source.note ? `<p>${esc(e.source.note)}</p>` : ""}
    ${href ? `<p><a href="${esc(href)}">Read the source at ${esc(href)}</a></p>` : ""}
  </section>
  <nav>
    ${prev ? `<p>Earlier: <a href="${SITE}/timeline/${esc(prev.id)}">${esc(prev.headline)}</a></p>` : ""}
    ${next ? `<p>Later: <a href="${SITE}/timeline/${esc(next.id)}">${esc(next.headline)}</a></p>` : ""}
  </nav>
  <p>This record is one of ${entries.length} in the chronology at <a href="${SITE}/timeline">/timeline</a>. The underlying data is <a href="${SITE}/timeline.json">/timeline.json</a>.</p>
  <p>License: CC-BY-4.0. Attribute to DMT Code, ${SITE}.</p>
</article>`;

  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "article",
    jsonLd: [organizationLd, breadcrumbLd, workLd],
  });

  return new Response(renderShell(shellHtml, head, body, locale), { status: 200, headers: PRERENDER_RESP_HEADERS });
}


const FAQ_GROUPS: Array<{ heading: string; items: Array<{ q: string; a: string }> }> = [
  {
    heading: "The project",
    items: [
      {
        q: "Is this a controlled experiment?",
        a: "No. Stage one, the public registry, is a screening collection, not a controlled experiment. It is open, self selected and unblinded, and priming is not ruled out, because people can browse other submissions before recording their own. All stage one can show is whether there is a hint of agreement worth digging into. Nothing here settles the question. Stage two is capture before exposure, where an account is recorded before the contributor sees the catalogue. Stage three is a randomized blinded arm with control conditions, blind scoring and pre registered hypotheses; it is designed and has not been run. Reports of seeing nothing are wanted and counted, and they are published at /null-reports.",
      },
      {
        q: 'What is the "DMT code"?',
        a: "People who take N,N-DMT often report seeing structured visual forms, grids, glyphs, geometric symbols, and a smaller group describes something that reads almost like written characters. The DMT Code project collects those reports in one place so the overlaps can actually be measured instead of argued about. We are not claiming the forms are a message. We are asking a narrower question: do independent people, who have never spoken, keep drawing the same shapes?",
      },
      {
        q: "Is the code real? Are you saying reality is made of code?",
        a: "No. We hold that question open on purpose. Our job is to gather the observations, keep the method honest, and publish everything so anyone can judge for themselves. If the overlaps turn out to be coincidence or shared cultural imagery, the data should show that too. A result that cannot fail is not worth much, so we built this to be able to fail.",
      },
      {
        q: "Is this a religion, or are you telling people what to believe?",
        a: "Neither. Nobody here is asking you to believe anything. Plenty of people who take this seriously think it will turn out to be pattern-matching or shared imagery, and that is a fine place to stand. We care about the observations and the method. What you conclude from them is yours.",
      },
      {
        q: "What will I actually see? Does everyone see the same thing?",
        a: "We cannot promise you will see anything in particular, and honesty matters more than hype. Reports vary a lot. Some people describe grids or geometric forms, some describe symbols, and some see nothing they would call structured. The registry exists to find where those experiences genuinely overlap and where they do not, not to tell you what to expect.",
      },
      {
        q: "Who is behind this and why should I trust it?",
        a: "Trust the method, not us. The reason to take this seriously is that it is open, it is falsifiable, and the counts are public, not that anyone here says so. We keep a neutral position, we never seed or fake a count, and we publish the parts that would let you prove us wrong.",
      },
    ],
  },
  {
    heading: "Safety and law",
    items: [
      {
        q: "How do I do this safely?",
        a: "Start with the <a href=\"/downloads/DMTCode_Screening_Card_v1.pdf\">screening card</a>. Before you consider anything, talk with a qualified prescriber about MAOIs, SSRIs and related medications, any cardiac history, and any personal or family history of psychosis. We deliberately do not publish medication timing windows. The sources disagree and getting it wrong can be dangerous, so that decision belongs with a clinician who knows your history. This is for adults 18 and older.",
      },
      {
        q: "Is this legal?",
        a: "The equipment we discuss is ordinary optical gear. We do not sell, source, or explain how to obtain any controlled substance, and nothing here is legal advice. Laws differ by country and state and they change. For your own situation, check your local law or a qualified professional.",
      },
      {
        q: "Is the laser safe for my eyes?",
        a: "A laser is not a toy. The kit modules are low-power visible red lasers (vendor rated 5 mW, FDA Class IIIa, also written Class 3R; the ray box in the Triad and Circle is under 1 mW). Never look into the beam or aim it at anyone, keep reflective surfaces out of the beam path, follow the safety card that ships with the kit, and keep it away from children. This is for adults 18 and older. If you are unsure how to handle optical equipment safely, do not improvise with it.",
      },
    ],
  },
  {
    heading: "The method and the data",
    items: [
      {
        q: "How do you stop people from just copying each other's answers?",
        a: "That is the whole design problem, and it is why the flagship is a blinded comparison. Wherever we can, people record what they saw before they see the existing catalogue, so a match means two strangers landed on the same form independently rather than one person nodding along to another. Convergence only counts when it is earned that way.",
      },
      {
        q: "What actually counts as a match?",
        a: "A symbol is not called a match because it looks vaguely similar. People compare specific forms, and a response is recorded when a reader says a form echoes something they saw. Because that reader has already viewed the form in this catalogue, the response measures recognition after exposure rather than an independent match. Every symbol shows its count, so you can weigh each one yourself.",
      },
      {
        q: "Can I see the raw data?",
        a: "Yes, all of it. The registry is public, the machine-readable corpus is at /dataset and /data.json, and it is all CC-BY-4.0, free to read, quote, and check. Every symbol shows how many people have recognized it. If something looks off, we would rather you find it.",
      },
      {
        q: "Can I add a symbol I saw myself?",
        a: "Yes. The registry is built from contributions. You can submit what you saw, add context to symbols others have logged, and take part in the comparison. That is how the dataset grows, and it is free to do.",
      },
      {
        q: "Can I download the whole dataset?",
        a: "Yes. The full corpus is at /data.json and /dataset under CC-BY-4.0, with an archived, citable version by DOI. Read it, quote it, run your own analysis, and tell us if we got something wrong.",
      },
    ],
  },
  {
    heading: "Taking part and kits",
    items: [
      {
        q: "What do I need to get started?",
        a: "Everything is on the Prepare page: four kits. Solo for one observer, Dual for one to two, Triad for two to three, Circle for up to six. The core of every kit is a 650 nm laser module and diffraction optics; the exact contents of each kit are listed on its card. The same page has free downloads you can use before you buy anything: the Observation Field Sheet, the Sober Baseline Protocol, and the AVP Passthrough Protocol, each in English, Spanish, and German. You can also source every part yourself. We show the do-it-yourself figure next to each kit so you know exactly what you are paying for.",
      },
      {
        q: "Why a 650nm laser?",
        a: "It is the specific red wavelength the observation protocol is built around, so every observation is made with the same instrument used the same way. Consistent equipment is what lets one person's observation be compared against another's instead of guessing at the differences.",
      },
      {
        q: "Do I have to use DMT to take part?",
        a: "No. A lot of the work here is observation and comparison. You can browse the registry, add context to symbols other people have logged, and help judge where the forms actually converge without taking anything. The dataset gets stronger every time someone compares carefully.",
      },
      {
        q: "Do I have to buy a kit to take part?",
        a: "No. A kit gets you the equipment to run a careful observation of your own, but you can browse, contribute, and help judge convergence without spending anything. The kits make doing it well easier; they do not gate the project.",
      },
      {
        q: "Can my friends and I do this together?",
        a: "Yes, and it is often better that way. Dual covers one to two observers, Triad two to three, and Circle up to six, so the shared optics amortize and the per-person cost drops as the circle grows. Every observer in the group is an adult and goes through the same screening card. A group session protocol is in progress; until it is published, use the free Observation Field Sheet and Sober Baseline Protocol from the Prepare page for each observer.",
      },
      {
        q: "What are your shipping and refund terms?",
        a: "Kits are sold and shipped by Meridian Optics Lab, our store of record. That is the name on your card statement and on the parcel, and kits ship in plain packaging. US shipping is free and orders arrive in 7 to 10 business days. Unopened kits can be returned within 30 days; the full refund and shipping policies are linked on the Prepare page and at checkout. If anything arrives damaged or not as described, email info@dmtcode.com with your order number and photos and we will sort it out.",
      },
    ],
  },
];

const FAQ_ITEMS: Array<{ q: string; a: string }> = FAQ_GROUPS.flatMap((g) => g.items);

async function renderFaq(context: Context, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/faq`;
  const faqCopy = uiCopy("faq", locale);
  const title = faqCopy.title;
  const metaDesc = clip(faqCopy.description, 200);

  // The English source region, byte for byte what the translation pipeline
  // extracts from between the tsrc markers below and hashes into
  // content_translations.source_hash. Built once, used both for the hash and
  // for the rendered fallback, so the value the gate tests and the value the
  // page serves cannot drift apart. /faq renders here rather than through the
  // shared static renderer, so it has to opt into the gate itself.
  const faqEnSource = [
    `<h1>Questions about the DMT Code project and preparing to observe</h1>`,
    FAQ_GROUPS.map(
      (g) => `<section><h2>${esc(g.heading)}</h2>
    ${g.items.map((it) => `<section><h3>${esc(it.q)}</h3><p>${esc(it.a)}</p></section>`).join("\n    ")}
  </section>`,
    ).join("\n  "),
    `<p>See the open data at <a href="${SITE}/registry">/registry</a>, <a href="${SITE}/dataset">/dataset</a>, and <a href="${SITE}/data.json">/data.json</a>. CC-BY-4.0.</p>`,
  ].join("\n  ");

  const trs = await getTranslations(
    "static",
    "faq",
    locale,
    HASH_GATED_STATIC_PAGES.has("faq") ? { body_html: md5Hex(faqEnSource) } : undefined,
    HASH_GATED_STATIC_PAGES.has("faq") ? FORBIDDEN_IN_TRANSLATION : undefined,
  );

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}#website`,
    url: SITE,
    name: "DMT Code",
    publisher: { "@id": `${SITE}#org` },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "FAQ", item: canonical },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": canonical,
    mainEntity: FAQ_ITEMS.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  const body = trs.body_html && trs.body_html.trim()
    ? `<article data-prerender="faq">${trs.body_html}</article>`
    : `<article data-prerender="faq">
  <!--tsrc:static:faq-->
  ${faqEnSource}
  <!--/tsrc-->
</article>`;


  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "website",
    jsonLd: [organizationLd, websiteLd, breadcrumbLd, faqLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

type StaticPage = {
  title: string;
  description: string;
  heading: string;
  paragraphs: string[];
  links?: Array<{ href: string; label: string }>;
  breadcrumbName: string;
  robots?: string;
  index?: { table: string; filter: string; select: string; titleField: string; linkPrefix: string; label: string };
  index2?: { table: string; filter: string; select: string; titleField: string; linkPrefix: string; label: string; extraField?: string };
  bodyExtraHtml?: string;
  extraJsonLd?: unknown[];
};

// Canonical Dataset JSON-LD for /dataset. Mirrors the block rendered client
// side in src/pages/Dataset.tsx, field for field, so the two surfaces cannot
// drift. The identifier is the CONCEPT DOI, which always resolves to the
// newest version; never pin a version DOI here.
const DATASET_PAGE_LD = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "DMT Code Open Dataset",
  description:
    "Machine-readable export of the DMT Code registry: reported visual phenomena and the 650 nm laser protocol.",
  identifier: "https://doi.org/10.5281/zenodo.17816519",
  url: `${SITE}/dataset`,
  license: LICENSE,
  creator: { "@type": "Organization", name: "DMT Code", url: SITE },
  isAccessibleForFree: true,
  distribution: [
    {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${SITE}/data.json`,
    },
  ],
};

// Canonical Report JSON-LD for /registry. Mirrors the block rendered client
// side in src/pages/Registry.tsx, field for field. The identifier is the
// VERSION DOI of the published Volume 1 deposit; a version DOI is correct
// here because it identifies this specific deposit.
const REGISTRY_REPORT_LD = {
  "@context": "https://schema.org",
  "@type": "Report",
  name: "The DMT Code Symbol Registry: Reported Visual Forms in Altered and Baseline States",
  alternateName: "Volume 1. N,N-DMT and the 650 nm laser protocol",
  identifier: "https://doi.org/10.5281/zenodo.22101522",
  author: { "@type": "Person", name: "Aaron Baker" },
  publisher: { "@type": "Organization", name: "DMT Code", url: SITE },
  datePublished: "2026-08-25",
  version: "1.0",
  license: LICENSE,
  url: `${SITE}/downloads/dmt-laser-code-symbols.pdf`,
  encodingFormat: "application/pdf",
  isBasedOn: "https://doi.org/10.5281/zenodo.17816519",
};


const PROTOCOL_GUIDE_LEDE =
  "The DMT code refers to a reported observation, first described by Danny Goler in August 2020, that people under the influence of N,N-DMT who look at a 650nm red laser beam diffracted through a grating report seeing similar code-like visual forms. The reported forms include rapidly moving character-like glyphs, stable geometric structures that persist when looked away from and back, and shapes that appear to extend indefinitely into depth. A pilot study was published in IPI Letters in January 2025 (DOI 10.59973/ipil.158). No controlled study has been conducted. Whether the similarity across observers is genuine, and if genuine what causes it, is unresolved. Four explanations are actively defended, and they make different predictions that can be tested.";

const PROTOCOL_GUIDE_FAQ: Array<{ q: string; a: string }> = [
  {
    q: "What is the DMT code?",
    a: PROTOCOL_GUIDE_LEDE,
  },
  {
    q: "What equipment does the reported protocol use?",
    a: "Three ordinary optical components: a 650nm red laser module, a transmission diffraction grating that spreads the beam into a speckle and interference field, and a diffusing or refracting element such as an acrylic tank or lens. None are specific to this claim. DMT Code publishes no substances, sourcing, doses, or medication discontinuation windows. The beam should never be viewed directly.",
  },
  {
    q: "Why 650nm specifically?",
    a: "This is genuinely open. The claim-side answer is that 650nm is special. The skeptic-side answer is that 650nm is simply what inexpensive red laser modules emit, so the wavelength may be an artifact of availability rather than a property of the phenomenon. No published work isolates wavelength as a variable. Running the same protocol at 532nm green and 405nm violet would be the cheapest decisive test, and nobody has published it.",
  },
  {
    q: "Is the DMT code real?",
    a: "Unresolved, and this site holds the question open on purpose. Four explanations are actively defended: 1) Reality-code or simulation (Danny Goler): the forms are structure in reality itself, made visible. 2) Laser speckle (Andrew Gallimore): speckle is a physically real, structured optical artifact, and DMT amplifies pattern recognition applied to it. 3) Cymatics (Andres Gomez Emilsson): non-linear wave dynamics in visual cortex under DMT generate standing patterns. 4) Cultural priming (skeptics): Matrix-style code imagery plus expectancy shapes ambiguous input. They make different testable predictions. None has been tested against the others under controlled conditions.",
  },
  {
    q: "Has anyone replicated it?",
    a: "Anecdotal replication reports are numerous. Independent, controlled, blinded replication has not been published. Consistency percentages circulating in this space generally trace back to the original source rather than independent verification, and should be treated as unverified unless a published method accompanies them.",
  },
  {
    q: "Where does the actual data live?",
    a: "The symbol registry at /registry, the research library at /bibliography, DMT-related clinical trials at /trials, the evidence map at /evidence-map, and negative results at /null-reports. The machine-readable corpus is at /data.json. All CC-BY-4.0.",
  },
];

const PROTOCOL_GUIDE_FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://dmtcode.com/protocol-guide#faq",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "dateModified": "2026-07-23",
  "citation": {
    "@type": "ScholarlyArticle",
    "name": "Pilot Study: The Code of Reality Protocol",
    "author": { "@type": "Person", "name": "Danny Goler" },
    "datePublished": "2025-01",
    "identifier": "10.59973/ipil.158",
    "sameAs": "https://doi.org/10.59973/ipil.158",
  },
  "mainEntity": PROTOCOL_GUIDE_FAQ.map((f) => ({
    "@type": "Question",
    "name": f.q,
    "acceptedAnswer": { "@type": "Answer", "text": f.a },
  })),
};

// Ordered steps of the reported 650 nm observation procedure. Every step below
// restates equipment or conditions already described in the protocol guide body
// copy on this page; nothing is invented here.
const PROTOCOL_GUIDE_HOWTO_STEPS: Array<{ name: string; text: string }> = [
  {
    name: "Have the setup reviewed for laser safety",
    text: "Before any use, have the apparatus and the intended viewing geometry reviewed by someone qualified in laser safety. The beam must never be viewed directly. Adults 18 and older only.",
  },
  {
    name: "Assemble the optical components",
    text: "Mount a 650 nm red laser module so that its beam passes through a transmission diffraction grating, which spreads the beam into a speckle and interference field.",
  },
  {
    name: "Place the diffusing element",
    text: "Place a diffusing or refracting element, such as an acrylic tank or a lens, in the path so the field is projected onto a surface rather than viewed at the source.",
  },
  {
    name: "Set the room conditions and posture",
    text: "Darken the room and take a stable seated observation posture facing the projected field, not the laser aperture. Record the room conditions and posture used.",
  },
  {
    name: "Observe and record",
    text: "Observe the projected field and record what is seen, including seeing nothing structured. Null reports carry the same weight as positive ones and are published alongside them.",
  },
  {
    name: "Submit the record to the registry",
    text: "Submit the drawn or uploaded form with its description and tags, noting whether you had prior exposure to the catalogue, so convergence can be tested on unprimed records.",
  },
];

const PROTOCOL_GUIDE_HOWTO_LD = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "@id": "https://dmtcode.com/protocol-guide#howto",
  "url": "https://dmtcode.com/protocol-guide",
  "name": "650 nm laser observation procedure",
  "description":
    "The reported 650 nm laser observation procedure as documented by contributors: equipment, room conditions, observation posture, and recording. Qualified laser safety review is required before use, and the beam must never be viewed directly.",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "supply": [
    { "@type": "HowToSupply", "name": "650 nm red laser module" },
    { "@type": "HowToSupply", "name": "Transmission diffraction grating" },
    { "@type": "HowToSupply", "name": "Diffusing or refracting element (acrylic tank or lens)" },
  ],
  "tool": [
    { "@type": "HowToTool", "name": "Darkened room" },
    { "@type": "HowToTool", "name": "Stable observation seat" },
  ],
  "step": PROTOCOL_GUIDE_HOWTO_STEPS.map((s, i) => ({
    "@type": "HowToStep",
    "position": i + 1,
    "name": s.name,
    "text": s.text,
  })),
};

// Locale-aware rebuild of the two structured-data blocks on /protocol-guide.
// Translated copy comes from content_translations (static/protocol-guide,
// fields faq_ld and howto_ld, each a JSON string). English is the fallback
// whenever the row is missing or unparseable, and identifiers always point at
// the locale URL so the Spanish and German mirrors never claim the English one.
function localizedProtocolGuideLd(
  locale: Loc,
  trs: Record<string, string>,
): unknown[] {
  const base = `${SITE}${locale !== "en" ? "/" + locale : ""}/protocol-guide`;

  let faqEntities = PROTOCOL_GUIDE_FAQ_LD.mainEntity;
  const faqRaw = trs.faq_ld;
  if (faqRaw && faqRaw.trim()) {
    try {
      const parsed = JSON.parse(faqRaw) as Array<Record<string, unknown>>;
      if (Array.isArray(parsed) && parsed.length) {
        faqEntities = parsed.map((q) => ({
          "@type": "Question",
          name: String((q as { name?: unknown }).name ?? ""),
          acceptedAnswer: {
            "@type": "Answer",
            text: String(
              ((q as { acceptedAnswer?: { text?: unknown } }).acceptedAnswer?.text) ??
                (q as { text?: unknown }).text ??
                "",
            ),
          },
        })) as typeof PROTOCOL_GUIDE_FAQ_LD.mainEntity;
      }
    } catch { /* keep English */ }
  }

  const faqLd = {
    ...PROTOCOL_GUIDE_FAQ_LD,
    "@id": `${base}#faq`,
    "url": base,
    "mainEntityOfPage": base,
    "inLanguage": locale,
    "mainEntity": faqEntities,
  };

  let steps = PROTOCOL_GUIDE_HOWTO_STEPS;
  const howRaw = trs.howto_ld;
  if (howRaw && howRaw.trim()) {
    try {
      const parsed = JSON.parse(howRaw) as Array<{ name?: unknown; text?: unknown }>;
      if (Array.isArray(parsed) && parsed.length) {
        steps = parsed.map((s) => ({ name: String(s.name ?? ""), text: String(s.text ?? "") }));
      }
    } catch { /* keep English */ }
  }

  const howToLd = {
    ...PROTOCOL_GUIDE_HOWTO_LD,
    "@id": `${base}#howto`,
    "url": base,
    "mainEntityOfPage": base,
    "inLanguage": locale,
    "step": steps.map((s, i) => ({
      "@type": "HowToStep",
      "position": i + 1,
      "name": s.name,
      "text": s.text,
    })),
  };

  return [faqLd, howToLd];
}


// Verbatim copy of the terms array in src/data/glossaryTerms.ts, which is the source of truth.
// Netlify edge functions run in Deno and cannot import from src/.
const GLOSSARY_TERMS: Array<{ term: string; definition: string }> = [
  { term: "650 nm Laser Protocol", definition: "Experimental method using coherent light at 650 nanometer wavelength through a diffraction grating to elicit discrete visual symbols during N,N-DMT administration. Developed by Danny Goler." },
  { term: "Alphabetic-like Symbol", definition: "Discrete visual element resembling written characters from alphabetic writing systems (e.g., katakana, Cyrillic, runic), described as bounded and character like rather than as a continuous geometric field." },
  { term: "AVP Passthrough Protocol", definition: "A variant of the observation protocol run through an Apple Vision Pro in passthrough mode, so the projected pattern is seen through the headset cameras. Free PDF on /prepare. It exists to test whether the effect survives a camera pipeline." },
  { term: "Coherent Light", definition: "Electromagnetic radiation with constant phase relationship between waves. Laser light is coherent, which is what allows a diffraction grating to project a precise pattern." },
  { term: "Confirmation Count", definition: "A count of readers who said a registry form echoed their own memory. Because those readers saw the form in this catalogue before they responded, the number measures recognition after exposure, not independent convergence. An independent match requires an account sealed before the person viewed the catalogue." },
  { term: "Co-witness", definition: "A second observer present in the same room during the same session, recording independently on their own field sheet without conferring. Co-witness records let the registry compare two accounts of one projection." },
  { term: "Convergence", definition: "The claim that different observers, who have never met, report the same visual forms. Convergence is what this registry exists to test. It is not established; recognition after seeing the catalogue does not count toward it." },
  { term: "Diffraction Grating", definition: "Optical component with periodic structure that splits coherent light into distinct beams. Used in the 650 nm protocol to project a grid pattern. Whether that pattern has any effect on N,N-DMT visual phenomena is the question under test." },
  { term: "Discrete Visual Symbol", definition: "Distinct, bounded geometric or alphabetic-like element perceived as separate from surrounding visual field. Contrasts with continuous geometric patterns or ambient visual noise." },
  { term: "Geometric Archetype", definition: "A symbol morphology that recurs across submissions, described by shared features such as symmetry, line structure, and orientation. Recurrence in the registry is not by itself evidence of independent convergence, because contributors may have seen earlier submissions before making their own." },
  { term: "Inter-subject Consistency", definition: "The degree to which independent observers report identical or highly similar phenomena under controlled conditions. Whether the 650 nm protocol produces it has not been established, because the reports gathered so far come from observers who were free to view the catalogue first." },
  { term: "Motif Tag", definition: "Descriptive categorical label applied to registry symbols (e.g., 'spiral', 'bilateral', 'angular'). Facilitates pattern analysis and cross-reference between submissions." },
  { term: "N,N-Dimethyltryptamine (N,N-DMT)", definition: "Endogenous tryptamine compound and Schedule I controlled substance. Administered via smoking, vaporisation, or intramuscular injection. Produces intense visual phenomena lasting 5-20 minutes." },
  { term: "Null report", definition: "A session record in which the observer ran the protocol and saw no structured or repeating form. Null reports carry the same weight as positive ones and are listed on /null-reports." },
  { term: "Perceived Surface", definition: "Physical or conceptual location where visual symbols appear during N,N-DMT experience (e.g., wall, ceiling, closed eyelids, hands). Recorded as metadata so any relationship to symbol form can be tested later rather than assumed." },
  { term: "Photobiomodulation", definition: "Therapeutic use of red or near-infrared light (660-850 nm) to enhance cellular energy production via mitochondrial cytochrome c oxidase stimulation. Any link to symbol clarity in the 650 nm protocol is an untested hypothesis and has not been demonstrated." },
  { term: "Priming", definition: "Prior exposure to images or descriptions of what other people report seeing. A record is tagged as primed if the observer had seen laser-experiment imagery or the catalogue before recording. Unprimed records are the ones convergence must be tested on." },
  { term: "Registry Glyph", definition: "A symbol drawn or uploaded to the registry canvas, stored as vector or image data, with structured metadata (source method, surface, priming tag where set)." },
  { term: "Route of Administration", definition: "Method of N,N-DMT delivery: smoked/vaporised (most common, rapid onset), intramuscular injection (slower onset, longer duration), or other experimental routes." },
  { term: "Sober baseline", definition: "A session run with the full rig by observers who have taken nothing, recorded on the standard field sheet. Baseline records define what the optics alone put on the wall. Free PDF on /prepare." },
  { term: "Symmetry Classification", definition: "Geometric property of registry symbols: bilateral (mirror symmetry), radial (rotational symmetry), perfect geometric (mathematical precision), or asymmetric." },
  { term: "Visual Cortex Coherence", definition: "Synchronized neural activity in primary and secondary visual processing regions. No link between cortical coherence and the symbols catalogued here has been established." },
  { term: "Anecdotal Evidence", definition: "First-person subjective reports not obtained through controlled experimental design. While valuable for hypothesis generation, anecdotal data lacks the rigor of double-blind randomized trials." },
  { term: "Blinded Experiment", definition: "Research methodology where participants (single-blind) or both participants and experimenters (double-blind) do not know which condition is being tested. Essential for controlling expectancy bias and placebo effects." },
  { term: "CC-BY-4.0 License", definition: "Creative Commons Attribution 4.0 International license. Permits redistribution and modification of registry data with proper attribution. All DMT Code registry submissions are released under this open-access license." },
  { term: "Control Condition", definition: "Experimental baseline for comparison (e.g., sober + laser, DMT + no laser). Required to isolate the causal effect of the 650 nm laser on visual symbol perception during N,N-DMT experiences." },
  { term: "Cross-Replication", definition: "Independent verification of reported phenomena by multiple observers under similar conditions. No cross replication of the symbol observations catalogued here has been demonstrated under blinded conditions." },
  { term: "Dose-Response Relationship", definition: "Correlation between substance quantity administered and intensity of observed effects. Registry metadata tracks approximate DMT dose to assess potential dose-symbol clarity relationships." },
  { term: "Expectancy Bias", definition: "Psychological phenomenon where prior knowledge or beliefs influence subjective perception and reporting. A key critique of non-blinded visual symbol reports during N,N-DMT experiences." },
  { term: "JSON-LD Schema", definition: "Structured data markup format for embedding machine-readable metadata in web pages. DMT Code uses JSON-LD for Dataset, FAQPage, and Product schemas to enhance search engine discoverability." },
  { term: "Longitudinal Analysis", definition: "Research tracking the same participants across multiple sessions over time. Authenticated registry submissions enable longitudinal comparison of symbol reports from the same observer." },
  { term: "Null Hypothesis", definition: "Statistical assumption that no relationship exists between variables being tested. For the 650 nm protocol: 'Laser exposure during DMT has no effect on visual symbol perception beyond placebo.'" },
  { term: "Open-Access Data", definition: "Research data freely available for download, analysis, and redistribution without paywalls or institutional barriers. All registry submissions are open-access under CC-BY-4.0." },
  { term: "Pareidolia", definition: "Cognitive tendency to perceive meaningful patterns (faces, symbols) in random or ambiguous stimuli. Potential alternative explanation for alphabetic-like symbol observations during altered states." },
  { term: "Phosphene", definition: "Sensation of seeing light without light actually entering the eye, caused by mechanical or electrical stimulation of retinal photoreceptors. Potential optical artifact explanation for laser-elicited symbols." },
  { term: "Replication Crisis", definition: "Scientific recognition that many published findings cannot be independently reproduced. The 650 nm protocol relies on anecdotal replication reports rather than controlled laboratory replication." },
  { term: "Retinal Afterimage", definition: "Visual impression that persists after exposure to bright light ceases. Diffraction grating patterns could produce afterimages misinterpreted as discrete symbols during altered states." },
  { term: "Speckle Pattern", definition: "Random granular interference pattern produced when coherent light scatters from rough surfaces. Laser speckle may contribute to fine-scale visual texture during 650 nm protocol, potentially enhancing perceived symbol detail." },
  { term: "Entoptic Phenomenon", definition: "Visual effect originating within the eye itself rather than external light sources. Includes floaters, blood vessel shadows, and Haidinger's brushes. Coherent light exposure enhances visibility of normally subliminal entoptic structures." },
  { term: "Form Constant", definition: "Recurring geometric pattern (tunnels, spirals, honeycombs, lattices) observed across diverse altered states, generally attributed to primary visual cortex (V1) architecture. Distinguished from the discrete alphabetic-like symbols reported under the 650 nm laser protocol, which are described as bounded character-like elements rather than continuous geometric fields." },
];

// Verbatim copy of termSlug from src/data/glossaryTerms.ts (source of truth).
function termSlug(term: string): string {
  return String(term || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2018\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

const GLOSSARY_TERMSET_LD = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  "@id": "https://dmtcode.com/glossary#termset",
  "url": "https://dmtcode.com/glossary",
  "name": "DMT Code Glossary of Terms",
  "description": "Technical definitions for 650 nm laser protocol and visual symbol classification",
  "hasDefinedTerm": GLOSSARY_TERMS.map((t) => ({
    "@type": "DefinedTerm",
    "@id": `https://dmtcode.com/glossary#${termSlug(t.term)}`,
    "url": `https://dmtcode.com/glossary#${termSlug(t.term)}`,
    "name": t.term,
    "description": t.definition,
    "inDefinedTermSet": "https://dmtcode.com/glossary#termset",
  })),
};

const METHODS_FAQ: Array<{ q: string; a: string }> = [
  {
    q: "How do you design a blinded experiment for the 650 nm laser protocol?",
    a: "Double-blind experimental design requires three critical components to eliminate expectation effects and observer bias: Sham laser device: Construct device with identical appearance, weight, and operation (button press, indicator LED) but no 650 nm coherent light output. The sham must not be distinguishable by appearance, which rules out a blocked aperture or a dark device: see the control device requirements below. Independent randomization: Third-party experimenter (not present during experience) randomizes real/sham assignment using sealed envelopes or electronic randomization. Maintains allocation concealment until data analysis. Blinded symbol recording: Both participant and symbol recorder remain unaware of real/sham condition. Post-experience drawing occurs before unblinding. Control for optical variables: wavelength (650 nm ± 5 nm), intensity (fixed in advance and recorded, see equipment specifications below), diffraction grating line density (500-1000 lines/mm). Control for pharmacological variables: N,N-DMT dose (route-matched baseline dose), set/setting standardization. Timmermann et al. (2019) Neural correlates of the DMT experience assessed with multivariate EEG. DOI: 10.1038/s41598-019-51974-4",
  },
  {
    q: "What control conditions are necessary?",
    a: "Rigorous replication requires four experimental conditions to isolate laser effect from DMT effects, expectation, and optical artifacts: Condition 1: Sham laser + N,N-DMT. Controls for expectation effects. If symbols appear with sham device, suggests placebo/expectation mechanism. Condition 2: Real laser + placebo substance. Controls for optical artifacts. If symbols appear without DMT, suggests retinal phosphenes or afterimages. Condition 3: No laser + N,N-DMT. Baseline DMT visual phenomena without laser stimulus. Establishes whether symbols occur spontaneously. Condition 4: Diffraction grating alone (no laser) + N,N-DMT. Controls for grating visual effects. Tests whether coherent light (vs. ambient light through grating) is necessary. Sample size cannot be given as a single number until the primary outcome is fixed. The primary outcome declared below is binary, whether a participant reports a discrete bounded symbol, and a binary outcome is sized from the two rates being compared, not from Cohen's d. As a worked illustration at 5 percent significance and 80 percent power, two sided: comparing 20 percent against 50 percent needs about 38 participants per condition, comparing 30 percent against 50 percent needs about 93, and comparing 20 percent against 35 percent needs about 137. If a continuous outcome is used instead, a medium effect of Cohen's d equal to 0.5 needs about 64 per condition. An earlier version of this page said 20 per condition. That was wrong. Twenty per condition against d equal to 0.5 delivers roughly 34 percent power, meaning the study would more likely than not miss a real effect even if one existed. The expected rates must be declared in advance and the calculation published before recruitment begins. Use a validated symbol classification schema and blinded raters for drawing analysis.",
  },
  {
    q: "How do you quantify visual symbol consistency?",
    a: "Objective symbol classification requires: Pre-registered symbol taxonomy: Define categories before data collection (geometric shapes, alphabetic-like characters, abstract patterns) rather than assigning them post hoc. Blinded rater analysis: Two independent raters (unaware of experimental condition) classify drawings using a standardized rubric. Calculate inter-rater reliability (Cohen's κ ≥ 0.70 required). Computational similarity metrics: Image similarity algorithms such as SSIM and perceptual hashing can support classification but are not sufficient on their own. Symbol frequency analysis: Track how often identical symbols appear across participants. High-consistency symbols (≥3 independent observers) warrant focused analysis. SSIM and perceptual hashing are sensitive to rotation, scale, position, stroke thickness, mirroring and drawing skill. Two drawings of the same remembered form will often score as different, and two unrelated scribbles can score as similar. A credible matching pipeline needs standardised preprocessing, a predeclared list of permitted transformations, feature based similarity rather than pixel similarity alone, blinded human raters, negative control drawings from people who were never exposed, a matching threshold fixed in advance, inter rater reliability, and a chance match baseline computed from those negative controls.",
  },
  {
    q: "What statistical tests are appropriate?",
    a: "Primary outcome: Symbol appearance rate (binary: yes/no discrete bounded symbols). Chi-square test: Compare symbol appearance frequency across real laser vs. sham laser conditions. Logistic regression: Model symbol appearance probability with predictors (laser condition, DMT dose, prior experience, expectation). Bayesian analysis: Calculate Bayes factor (BF₁₀) comparing laser-effect hypothesis vs. null hypothesis. BF₁₀ > 3 considered moderate evidence, >10 strong evidence. Secondary outcomes: Symbol complexity (quantified via fractal dimension, perimeter-to-area ratio), inter-subject similarity (average pairwise SSIM scores), consistency with pre-registered symbol taxonomy.",
  },
  {
    q: "What equipment specifications are required?",
    a: "Standardized equipment ensures replicability: Laser: 650 nm plus or minus 5 nm, continuous wave, beam diameter 1 to 2 mm at aperture. Goler's 2025 paper (IPI Letters, DOI 10.59973/ipil.158) states its equipment: a 650 nm refracted laser, Class 2, operating power 1 mW, on a tripod, with a diffraction grating lens, projected onto a non-reflective surface at 4 to 6 feet. It also states that only Class 2 lasers at 1 mW or less were used. A replication of the reported setup should match that: Class 2, 1 mW or less, verified with a calibrated power meter, recorded in the protocol, and reviewed by a qualified laser safety officer. The kits DMT Code sells use pointers the vendor rates at 5 mW, FDA Class IIIa (Class 3R). That is a later community adaptation, not the configuration in Goler's paper, and a study that uses it is testing a different exposure class and should say so. For context, Class 2 is limited to 1 mW, while Class 3R, labelled Class IIIa under older United States classification, spans 1 to 5 mW. Those are materially different exposure classes and they are not interchangeable. Diffraction grating: 500-1000 lines/mm transmission grating, mounted 2-5 cm from laser aperture. Holographic gratings preferred for uniform diffraction pattern. Control device: a credible optical control has to match everything the participant can perceive. Same housing, weight, button, indicator, apparent colour, apparent brightness, projected geometry, surface coverage and viewing distance. What it manipulates has to be something the participant cannot perceive directly, such as coherence, speckle structure or diffraction order. A 520 nm green LED fails this test, because green is visibly not red and the participant is unblinded the moment the device is switched on. Measurement tools: spectrometer to verify output wavelength, calibrated power meter to verify output power against the figure set in the protocol, beam profiler for spatial characterisation, and a photometer to confirm the control device matches the active device on apparent brightness.",
  },
  {
    q: "How do you handle ethical considerations?",
    a: "Psychedelic research requires stringent ethical protocols: Institutional approval: IRB/ethics committee approval required before any human subjects research. Submit detailed protocol including risk mitigation, informed consent procedures, participant screening. Medical screening: Exclude participants with personal/family history of psychosis, cardiovascular conditions, medications contraindicated with DMT (MAOIs, SSRIs). Harm reduction: Trained medical personnel on-site, blood pressure/heart rate monitoring, integration support sessions post-experience. Data protection: Anonymous data collection, secure storage (HIPAA/GDPR compliant), no identifiable information linked to drawings or reports. Follow guidelines from Psychedelic Science Group, MAPS, and Beckley Foundation for conducting responsible psychedelic research. Prioritize participant safety over data collection.",
  },
];

const METHODS_FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://dmtcode.com/methods#faq",
  "mainEntity": METHODS_FAQ.map((f) => ({
    "@type": "Question",
    "name": f.q,
    "acceptedAnswer": { "@type": "Answer", "text": f.a },
  })),
};

const STATIC_PAGES: Record<string, StaticPage> = {
  home: {
    title: "DMT Code | 650nm Laser Visual Symbol Research",
    description: "Open, community maintained record of visual forms reported during N,N-DMT experiences and 650 nm laser exposure. Peer reviewed research, live clinical trials, and machine readable data under CC-BY-4.0.",
    heading: "DMT Code",
    paragraphs: [
      "Is there a recurring visual structure people can learn to see?",
      "An open record of the visual forms people report during N,N-DMT experiences. Some of them recur across people who have never met. Whether that recurrence is real, or whether optics, shared neurobiology, expectation and memory explain it, is the open question this record exists to answer.",
      "The open record of a reported observation: first described by Danny Goler in 2020, published as a pilot study in 2025, and unresolved. We keep the evidence, including the evidence against.",
      "DMT Code is a research surface for a narrow claim: that independent people report the same discrete visual forms during N,N-DMT experiences and under a specific 650 nm laser observation protocol. The site is built so anyone, human or machine, can inspect the raw evidence and judge for themselves.",
      "The registry is public. Every submission shows how many readers said it echoed their own memory after seeing it here, which is recognition after exposure and not an independent match. The bibliography is stance scored. Null results are tracked in the open. The full corpus is downloadable under CC-BY-4.0.",
    ],
    links: [
      { href: "/registry", label: "Visual symbol registry" },
      { href: "/people/danny-goler", label: "Danny Goler, who described the observation" },
      { href: "/prepare", label: "Prepare to observe" },
      { href: "/evidence-map", label: "Evidence and analysis" },
      { href: "/faq", label: "Questions and answers" },
    ],
    breadcrumbName: "Home",
    // Mirrors the React homepage: the three step sequence rendered by
    // src/components/home/ConvergenceHero.tsx and the nine step journey strip
    // rendered by src/components/home/ExpeditionStrip.tsx. Edge functions run in
    // Deno and cannot import from src/, so both are mirrored by hand. Change one
    // surface and change the other in the same commit.
    bodyExtraHtml: `<section data-prerender="home-how-it-works">
  <h2>How a record is made</h2>
  <ol>
    <li><strong>Observe.</strong> Notice a discrete visual form during an N,N-DMT experience.</li>
    <li><strong>Draw or Respond.</strong> Reconstruct it on the canvas, or tell us whether one already recorded resembles what you saw.</li>
    <li><strong>It joins the open record.</strong> Openly licensed CC-BY-4.0 and downloadable as data.</li>
  </ol>
  <p>Recording first keeps your memory unshaped by the catalogue. A free account is needed to submit, an avatar stands in for your name, and your name is never shown.</p>
  <p>You do not need to take anything to contribute. The Sober Baseline Protocol is the same rig and the same field sheet run sober, and sober records are the ones the registry needs most.</p>
</section>
<section data-prerender="home-expedition">
  <h2>Nine steps through the record</h2>
  <ol>
    <li><a href="${SITE}/about">Understand</a>. What this is, and what it is not.</li>
    <li><a href="${SITE}/timeline">Story</a>. How the observation began, dated and sourced.</li>
    <li><a href="${SITE}/evidence-map">Evidence</a>. What has been reported, and how much it carries.</li>
    <li><a href="${SITE}/theories">Theories</a>. Proposed explanations, held as hypotheses.</li>
    <li><a href="${SITE}/research">Science</a>. What has actually been measured, and by whom.</li>
    <li><a href="${SITE}/events">Participate</a>. Events, experiments and trials you can join.</li>
    <li><a href="${SITE}/prepare">Prepare</a>. Build the rig yourself, or buy a kit.</li>
    <li><a href="${SITE}/capture">Record</a>. Describe what you saw before you browse.</li>
    <li><a href="${SITE}/co-witnesses">Decode</a>. Compare your memory against other recollections.</li>
  </ol>
</section>`,
  },
  registry: {
    title: "Visual Symbol Registry | DMT Code",
    description: "Open catalogue of visual forms reported in connection with N,N-DMT experiences, with machine readable data under CC-BY-4.0.",
    heading: "Visual Symbol Registry",
    paragraphs: [
      "The registry catalogues discrete visual forms that observers have reported. Each entry records the form, its contextual metadata, and how many readers said it echoed their own memory after seeing it here. That is recognition after exposure, not independent convergence.",
      "Anyone can contribute. Anyone can download the full dataset. The corpus is CC-BY-4.0.",
    ],
    links: [
      { href: "/submit-symbol", label: "Submit a symbol" },
      { href: "/data.json", label: "Machine readable corpus" },
      { href: "/dataset", label: "Dataset index" },
    ],
    breadcrumbName: "Registry",
    bodyExtraHtml: `<section data-prerender="registry-limitations">
  <h2>What this registry can and cannot show</h2>
  <p>This is a screening collection, not a controlled experiment. Anyone can browse it before contributing, entries are self selected, and there is no randomization, no blinding, and no control over dose, setting, wavelength, or who chooses to take part. Seeing other people's symbols before recording your own can shape what you report. That effect is not ruled out here and it cannot be ruled out by a collection built this way.</p>
  <p>What a collection like this can do is tell us whether there is any hint of agreement worth digging into further, and whether it is convincing enough to bring institutions in to investigate properly. That is the whole claim. Nothing here settles the question.</p>
  <p>A separate blinded study is the channel that could settle it. It is designed and has not been run.</p>
  <p>Reports of seeing nothing are wanted and counted. They are published on the <a href="${SITE}/null-reports">null reports dashboard</a> alongside the positive ones.</p>
</section>`,
    index: { table: "symbol_submissions", filter: "status=eq.approved", select: "id,description,created_at", titleField: "description", linkPrefix: "/registry", label: "Recent symbols" },
    extraJsonLd: [REGISTRY_REPORT_LD],
  },
  trials: {
    title: "Trials, Studies and Experiments | DMT Code",
    description: "Registered clinical trials involving DMT and related compounds, updated from public registries, listed alongside typed community experiments, pilot reports and claims. Only registered trials count as clinical evidence.",
    heading: "Trials, Studies and Experiments",
    paragraphs: [
      "Registered clinical trials that involve N,N-DMT and related compounds, indexed from public registries. Each registered record links to its registry entry so the primary source is one click away, and each one is typed registered_clinical_trial.",
      "The same table also lists the community experiments, the 2025 pilot report, platform projects, media claims and rumours that make up the history of this observation. They are kept because they are part of the story, and they are typed and labelled so nobody mistakes them for clinical evidence. A record only carries clinical authority in /data.json when it is a registered clinical trial with a registry id.",
      "Filter by status, type, indication, and sponsor. Machine readable records are included in the unified corpus at /data.json with record_type, relevance and registry_id on every row.",
    ],
    links: [
      { href: "/data.json", label: "Machine readable corpus" },
      { href: "/bibliography", label: "Related research library" },
    ],
    breadcrumbName: "Trials",
    index: { table: "clinical_trials", filter: "is_approved=is.true&record_type=eq.registered_clinical_trial&relevance=eq.core", select: "id,title,updated_at", titleField: "title", linkPrefix: "/trials", label: "Registered clinical trials, recently added" },
    index2: { table: "clinical_trials", filter: "is_approved=is.true&record_type=neq.registered_clinical_trial", select: "id,title,record_type,confirmed_status,updated_at", titleField: "title", linkPrefix: "/trials", label: "Community experiments, reports and claims, typed", extraField: "record_type" },
    bodyExtraHtml: `<section data-prerender="trial-record-types"><h2>Record types used here</h2><ul><li>registered_clinical_trial: a trial with a public registry id, the only type that carries clinical authority.</li><li>registered_observational_study and academic_experiment: formal studies that are not interventional trials.</li><li>published_pilot_report: Goler's 2025 pilot study in IPI Letters.</li><li>community_experiment, citizen_science_project and reported_replication: work done outside institutions, recorded as such.</li><li>platform_project: things DMT Code itself runs, such as the registry launch and the null report programme.</li><li>media_claim and rumored_report: claims made in podcasts or forums that nobody has documented.</li><li>retreat_or_facilitated_session: sessions run by a facilitator, usually undisclosed.</li></ul></section>`,
  },
  bibliography: {
    title: "Research Bibliography | DMT Code",
    description: "Stance scored research library covering N,N-DMT, 5-MeO-DMT, and related compounds. Filter by content type, authority, stance, tag, and year.",
    heading: "Research Bibliography",
    paragraphs: [
      "The bibliography is a stance scored index of peer reviewed papers, books, essays, and media. Each entry carries an authority type and a signed stance score so the distribution can be inspected directly.",
      "The library is designed to be balanced. Skeptical, neutral, and supportive sources are all indexed. Use the stance filter to read the case against before the case for.",
    ],
    links: [
      { href: "/data.json", label: "Machine readable corpus" },
      { href: "/evidence-map", label: "Evidence analysis" },
    ],
    breadcrumbName: "Bibliography",
    index: { table: "bibliography", filter: "is_approved=eq.true", select: "id,title,updated_at", titleField: "title", linkPrefix: "/bibliography", label: "Recent entries" },
  },
  dataset: {
    title: "Machine Readable Dataset | DMT Code",
    description: "The unified DMT Code corpus. Bibliography, clinical trials, and approved symbols in one JSON document under CC-BY-4.0. Filterable by facet.",
    heading: "Machine Readable Dataset",
    paragraphs: [
      "The unified corpus is available at /data.json. It merges every bibliography row, every tracked clinical trial, and every approved symbol into one document with a shared facet set: content_type, compounds, topic, authority_type, stance_score, people, status, and source_date.",
      "License is CC-BY-4.0. Attribute to DMT Code, https://dmtcode.com. An archived, citable version is available by DOI.",
      "Current release: DMT Code Open Dataset v4.1, published 17 August 2026. DOI 10.5281/zenodo.17816519 (https://doi.org/10.5281/zenodo.17816519) is the concept DOI and always resolves to the latest version.",
      "Cite as: DMT Code Project (2026). DMT Code Open Dataset [Data set]. Zenodo. https://doi.org/10.5281/zenodo.17816519",
    ],
    links: [
      { href: "/data.json", label: "/data.json (unified corpus)" },
      { href: "/shop.json", label: "/shop.json (kits and bundles)" },
      { href: "/sitemap.xml", label: "/sitemap.xml" },
    ],
    breadcrumbName: "Dataset",
    bodyExtraHtml: `<section data-prerender="dataset-versions">
  <h2>Version history</h2>
  <ul>
    <li>v4.1, 17 August 2026, DOI <a href="https://doi.org/10.5281/zenodo.17816519">10.5281/zenodo.17816519</a> (concept DOI, resolves to latest version) (current)</li>
    <li>v1.0, DOI <a href="https://doi.org/10.5281/zenodo.17816520">10.5281/zenodo.17816520</a> (superseded)</li>
  </ul>
  <p>Concept DOI: <a href="https://doi.org/10.5281/zenodo.17816519">10.5281/zenodo.17816519</a>. License: CC BY 4.0.</p>
</section>`,
    extraJsonLd: [DATASET_PAGE_LD],
  },
  about: {
    title: "About the DMT Code project | DMT Code",
    description: "Why the DMT Code project exists, how it operates, and how to inspect or critique the record.",
    heading: "About the DMT Code project",
    paragraphs: [
      "DMT Code was built to test a narrow question with an open record: do independent people report the same discrete visual forms during N,N-DMT experiences and under a specific 650 nm laser observation protocol.",
      "The project is neutral by design. Recognition counts are gathered by showing readers the catalogue, so they record recognition after exposure rather than independent confirmation. The full dataset is public, licensed CC-BY-4.0, and archived with a DOI so external researchers can audit or replicate it.",
      "Where this project stands: DMT Code is the open record of a claim, not an advocate for it. The observation was described by Danny Goler in 2020 and published in 2025. What did not exist was a place to accumulate the evidence in a form anyone could inspect, including evidence that cuts against it. Every symbol is a dated, permanent, licensed record. Stance scores exist for part of the bibliography and are still being filled in, so a source without one has not been assessed yet rather than judged neutral. Negative results are published in the same place as positive ones, under the same license. We do not know whether the phenomenon is real. We built the instrument that could find out.",
      "On Danny Goler: Danny Goler first described the observation this project studies, and he is credited as its originator throughout this site. He is aware of this project but holds no editorial role in it. What gets published here, including the critiques and null results, is decided independently, and the public dataset lets anyone check that policy against practice.",
      "Kits are sold and shipped by Meridian Optics Lab, the store of record operated by the same owner as DMT Code Project; its refund, shipping and terms policies govern purchases.",
    ],
    links: [
      { href: "/methods", label: "Methods" },
      { href: "/critiques", label: "Critiques" },
      { href: "/dataset", label: "Dataset" },
    ],
    breadcrumbName: "About",
  },
  critiques: {
    title: "Critiques and limitations | DMT Code",
    description: "Known limitations of the DMT Code method and dataset. Selection effects, cultural priors, and reasons the convergence signal may not survive scrutiny.",
    heading: "Critiques and limitations",
    paragraphs: [
      "Publishing the strongest versions of the critiques against this project is deliberate policy. If a claim cannot survive its best opponents, it does not deserve to survive. Three serious critical positions are stated below in their strongest form, credited to the people who defend them.",
      "1) Laser speckle (Andrew Gallimore): the diffracted 650 nm beam produces speckle, a physically real, structured optical pattern. DMT amplifies pattern recognition, so shared structure across observers may reflect shared optics rather than any external code. Prediction: changing the diffraction grating should change the reported forms.",
      "2) Cymatics (Andres Gomez Emilsson): non-linear standing-wave dynamics in visual cortex under DMT could generate structured, apparently discrete forms without any external code at all. Prediction: similar forms should appear given sufficient visual noise, with or without a laser.",
      "3) Cultural priming (skeptics): code and glyph imagery is culturally saturated (The Matrix, hieroglyphs, digital rain), and expectancy shapes ambiguous perception. Prediction: naive observers who are not told what to expect should report different content from observers who have read the literature.",
      "These predictions are testable, and the registry exists to accumulate the data that could distinguish them. Credit to Danny Goler as the originator of the reported observation. The critiques above are why we track null results in the same place as the positive ones.",
    ],
    links: [
      { href: "/null-reports", label: "Null reports dashboard" },
      { href: "/methods", label: "Methods" },
    ],
    breadcrumbName: "Critiques",
  },
  "the-discovery": {
    title: "The Discovery (2026): release date, where to watch, and what the film claims",
    description: "The Discovery is an independent documentary about the DMT laser observation first reported by Danny Goler. Premiere window, ticket status, and what is and is not confirmed.",
    heading: "The Discovery",
    paragraphs: [
      "The Discovery is an independent documentary about the visual forms some people report seeing when a 650 nm laser is used during an N,N-DMT experience. This page tracks what is confirmed about the film and what is not. It is not affiliated with the production.",
      "When can you watch it. Premiere: Los Angeles area, late October to early November 2026. Exact date and venue: not announced. Format: a single ticketed screening event, with a live discussion. Tickets: presale open on the film's own site. Wider release: none announced. Streaming: no distributor and no streaming platform has been announced.",
      "If you are trying to work out whether you can watch it at home this year, the honest answer today is that no one has said so. One screening has been announced and nothing beyond it. We will update this page when that changes, and the date on it is the date we last checked.",
      "Is it the film on Netflix? No, and this is a common mix-up worth clearing up. There is a 2017 Netflix feature also called The Discovery, directed by Charlie McDowell and starring Rooney Mara, Jason Segel and Robert Redford. It is a fiction film about a scientist who proves an afterlife exists. It has nothing to do with DMT, lasers, or this documentary.",
      "Who made it. The film is directed by Aaron Vanden and was funded independently, including a public crowdfunding campaign. Danny Goler is its subject rather than its director.",
      "The observation at the centre of the film was first reported by Danny Goler in August 2020: that under a 650 nm laser, some people report seeing discrete, repeating visual forms during an N,N-DMT experience. A pilot study was published in IPI Letters in 2025 (DOI 10.59973/ipil.158). What did not exist was a place to accumulate the evidence in a form anyone could inspect, including evidence that cuts against it. That is what this site is. We do not know whether the phenomenon is real. We built the instrument that could find out.",
      "The reported symbol set is also available as a citable PDF: DMT Laser Code Symbols (PDF).",
      "Attribution. Danny Goler made the observation, and the written protocol grew out of it. He is not a founder of this site, holds no editorial role, and has no part in the store. He has not reviewed or approved any page, kit or claim here. This site is not affiliated with the film, its production, or its distribution.",
      "Last checked 23 August 2026.",
    ],
    links: [
      { href: "/registry", label: "Registry" },
      { href: "/evidence-map", label: "Evidence map" },
      { href: "/protocol-guide", label: "Protocol guide" },
      { href: "/prepare", label: "Prepare" },
      { href: "/bibliography", label: "Bibliography" },
      { href: "/critiques", label: "Critiques" },
      { href: "/people/danny-goler", label: "Danny Goler" },
      { href: "/downloads/dmt-laser-code-symbols.pdf", label: "DMT Laser Code Symbols (PDF)" },
    ],
    breadcrumbName: "The Discovery",
    extraJsonLd: [{
      "@context": "https://schema.org",
      "@type": "Movie",
      "name": "The Discovery",
      "url": "https://dmtcode.com/the-discovery",
      "sameAs": "https://thediscoveryfilm.com",
      "director": { "@type": "Person", "name": "Aaron Vanden" },
      "disambiguatingDescription":
        "An independent documentary about the 650 nm laser observation reported during N,N-DMT experiences. Not to be confused with the unrelated 2017 Netflix feature The Discovery, directed by Charlie McDowell.",
      "subjectOf": {
        "@type": "Event",
        "name": "The Discovery premiere screening",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": {
          "@type": "Place",
          "name": "Los Angeles area",
          "address": { "@type": "PostalAddress", "addressLocality": "Los Angeles", "addressRegion": "CA", "addressCountry": "US" },
        },
      },
    }],
  },
  "null-reports": {
    title: "Null reports dashboard | DMT Code",
    description: "Public dashboard of negative and null replication results submitted to the DMT Code project.",
    heading: "Null reports",
    paragraphs: [
      "A null report is a record from someone who ran the observation carefully and saw nothing structured, or nothing that matched anything already in the catalogue. It is the negative counterpart to a recognition.",
      "We publish null reports for a simple reason: a dataset that cannot record failure cannot be trusted about success. Null results are the credibility asset of this project, not an embarrassment to it. They are the reason any claim of convergence here can be checked rather than taken on trust.",
      "If the count on this page is zero or near zero, that is an honest empty state and we are saying so plainly. No null reports have been fabricated. If you observed nothing, or nothing that matched, please submit that outcome so the record reflects both sides of the ledger.",
    ],
    links: [
      { href: "/registry", label: "Registry" },
      { href: "/methods", label: "Methods" },
    ],
    breadcrumbName: "Null reports",
    bodyExtraHtml: `<section data-prerender="null-report-intake">
  <p>This is stage one screening, not a controlled experiment.</p>
  <p><a href="${SITE}/submit-symbol?null=true">Submit a null report</a>.</p>
</section>`,
  },
  events: {
    title: "Research Timeline and Events | DMT Code",
    description: "Community reported research events, workshops, and DMT related clinical trial milestones. A scholarly reference timeline aggregated from public sources.",
    heading: "Research Timeline and Events",
    paragraphs: [
      "This page aggregates community reported events and publicly available clinical trial data into one scholarly reference timeline. Inclusion does not constitute endorsement.",
      "We know of no legal retreat or public event that runs this laser observation protocol with inhaled N,N-DMT. The listings below are for context only and do not run it. If that changes, it will be stated here first.",
      "Events submitted by people are reviewed by moderators before publication. Events our scrapers find can appear first as auto-discovered candidates and are labelled as such until an editor verifies them; every listing carries a verification status. Registered trials come from public registries. A listing is not an endorsement. Verify legal status, medical screening and staff credentials directly with any organizer or retreat center before you book.",
    ],
    links: [
      { href: "/trials", label: "Trials, studies and experiments" },
      { href: "/evidence-map", label: "Evidence timeline (1926 to present)" },
      { href: "/bibliography", label: "Research bibliography" },
    ],
    breadcrumbName: "Events",
  },
  glossary: {
    title: "Glossary of key terms | DMT Code",
    description: "Definitions of the academic and technical terms used across the DMT Code project.",
    heading: "Glossary",
    paragraphs: [
      "This glossary defines terms used across the DMT Code project, including the 650 nm laser protocol, discrete visual symbol, inter-subject consistency, form constant, entoptic phenomenon, expectancy bias, pareidolia and phosphene.",
      "Definitions are kept short and factual so cross references between pages resolve to the same meaning.",
    ],
    breadcrumbName: "Glossary",
    bodyExtraHtml: `<section><h2>Definitions</h2>${GLOSSARY_TERMS.map((t) => `<div id="${termSlug(t.term)}"><h3>${esc(t.term)}</h3><p>${esc(t.definition)}</p></div>`).join("")}</section>`,
    extraJsonLd: [GLOSSARY_TERMSET_LD],
  },
  methods: {
    title: "Methods and protocol design | DMT Code",
    description: "The observation protocol, blinding approach, and data validation methods used by the DMT Code project.",
    heading: "Methods",
    paragraphs: [
      "Nobody has answered this yet. It gets answered faster with more first hand accounts, recorded carefully, by people who were not told in advance what they were supposed to see. Describe what you saw before you look at anyone else's, read what has already been collected, come to an event, and join a trial when one opens.",
      "The observation protocol is built around a 650 nm laser passed through a diffraction grating. Where possible, contributors record what they saw before viewing the existing catalogue, so a match is earned by independent recognition rather than by suggestion.",
      "Recognition counts are public per symbol, and they count readers who responded after seeing the form here rather than independent observers. The dataset is downloadable so external analysts can inspect the methodology and re-run their own aggregations.",
      "A note on what follows: it is a draft study design, not the original protocol and not a validated result. Anyone running it with human participants needs qualified laser safety review and ethics approval first.",
    ],
    links: [
      { href: "/capture", label: "Submit what you saw" },
      { href: "/events", label: "Events" },
      { href: "/trials", label: "Trials" },
      { href: "/protocol-guide", label: "Protocol guide" },
      { href: "/dataset", label: "Dataset" },
    ],
    breadcrumbName: "Methods",
    bodyExtraHtml: `<section><h2>What would falsify this</h2><ul><li>Independent reports do not converge above what chance and shared culture would predict.</li><li>Convergence disappears when priming is controlled, so that people who have not seen the catalogue do not draw its forms.</li><li>Sober observers using the same apparatus report the same forms, so the forms belong to the optics, not the state.</li></ul><p>The registry, the null reports and the sober baseline exist so that each of these can be checked by anyone.</p></section><section><h2>Common questions</h2>${METHODS_FAQ.map((f) => `<div><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join("")}</section>`,
    extraJsonLd: [METHODS_FAQ_LD],
  },
  "open-questions": {
    title: "Open research questions | DMT Code",
    description: "Unresolved research questions tracked by the DMT Code project.",
    heading: "Open questions",
    paragraphs: [
      "This page tracks unresolved research questions that the current dataset cannot yet answer, including dose response, wavelength specificity, and cross cultural convergence.",
      "Each question links to the relevant subset of the corpus so researchers can pick one up and work on it.",
    ],
    breadcrumbName: "Open questions",
  },
  "object-model": {
    title: "Object model: how one experience becomes a record | DMT Code",
    description: "The seven levels between one person's experience and a canonical symbol candidate, and why the community symbol count and the registry glyph count are different numbers rather than two names for the same thing.",
    heading: "Object model",
    paragraphs: [
      "This page defines the vocabulary the rest of the site uses. It exists because two counts published at /data.json are read as synonyms by people and by machines, and they are not synonyms. Nothing is summed across them.",
      "The model runs from one person's experience up to a reviewed abstraction. Each level is a different kind of object with a different evidential weight, and moving up a level is a claim that has to be earned.",
    ],
    links: [
      { href: "/registry", label: "Visual symbol registry" },
      { href: "/data.json", label: "Machine readable corpus" },
      { href: "/dataset", label: "Dataset index and field definitions" },
      { href: "/capture", label: "Record before you browse" },
    ],
    breadcrumbName: "Object model",
    // Mirrors src/pages/ObjectModel.tsx and the object_model_note key in
    // netlify/edge-functions/data-json.ts. Change all three in the same commit.
    bodyExtraHtml: `<section data-prerender="object-model-levels">
  <h2>The seven levels</h2>
  <ol>
    <li><strong>Observation.</strong> One person's experience on one occasion. It is the event, not the file. An observation with nothing recorded from it leaves no trace in the corpus.</li>
    <li><strong>Artifact.</strong> Something produced from an observation: a drawing, a voice note, a written description, a field map. One observation can produce several artifacts, and an artifact can hold several forms at once.</li>
    <li><strong>Glyph instance.</strong> One discrete form extracted from an observation. A single drawing showing three separate forms holds three glyph instances. This is the unit that gets compared.</li>
    <li><strong>Public symbol record.</strong> A glyph instance exposed in the browseable registry, with its metadata, its tags and its recognition counts. Every public symbol record is a glyph instance; not every glyph instance is published.</li>
    <li><strong>Motif cluster.</strong> Several glyph instances that may be related. A cluster is a hypothesis about similarity, not a finding, and grouping is only meaningful when the members were recorded independently.</li>
    <li><strong>Canonical symbol candidate.</strong> A reviewed abstraction of a motif that keeps recurring. Candidate is the operative word. A candidate becomes a canonical symbol only if it survives a blinded test, and that test has not been run.</li>
    <li><strong>Sequence.</strong> A reported relation or order between symbols: one form giving way to another, or forms reported together. Sequences are recorded as reports, not as structure.</li>
  </ol>
  <p>Levels one to four are published today. Levels five to seven are the vocabulary the analysis will use; they are not published as their own collections at /data.json, and nothing on this site presents a canonical symbol as settled.</p>
</section>
<section data-prerender="object-model-counts">
  <h2>Why the two counts differ</h2>
  <p>The corpus publishes two separate symbol counts, and they count different objects that arrived through different doors.</p>
  <ul>
    <li><strong>counts.symbols</strong> covers symbols[]: account backed submissions to the registry, one public symbol record per submission, each carrying a description, tags, contextual metadata and recognition counts.</li>
    <li><strong>counts.registry_glyphs</strong> covers registry_glyphs[]: anonymous freehand drawings made with the quick capture tool. No account, no metadata beyond the source and the date, a separate table.</li>
  </ul>
  <p>They never overlap, because a row can only exist in one of the two tables, and they are never summed, because adding an identified submission to an anonymous drawing produces a number that means nothing. Anyone reporting a single total for this project is reading the corpus wrong. Read <a href="${SITE}/data.json">/data.json</a> and take counts.symbols and counts.registry_glyphs separately, or read the field definitions on <a href="${SITE}/dataset">the dataset page</a>.</p>
  <p>A third number appears on the registry page itself: the count of published records shown there is higher than the count exported at /data.json, because the export includes only records whose contributor granted publication consent.</p>
</section>
<section data-prerender="object-model-why">
  <h2>Why the levels matter</h2>
  <p>The whole question this project exists to answer is whether independent people report the same form. That question only has meaning at the glyph instance level, compared across observations that were recorded before the observer saw the catalogue. Counting submissions does not answer it. Counting drawings does not answer it. Collapsing the levels is the most common way to make this record look like it says more than it does.</p>
  <p>Stage one is screening: open, self selected, unblinded, with priming not ruled out. Stage two captures the memory before exposure to the catalogue. Stage three is a randomized blinded arm, designed and not run.</p>
</section>`,
  },
  research: {
    title: "The Science Room: what has actually been measured | DMT Code",
    description: "The scientific counterpart to the theory board. Direct tests of the laser observation, mechanistic science, DMT science, methodology, and the projects open to work on.",
    heading: "What has actually been measured",
    paragraphs: [
      "The theory board at /theories is a library of proposals. This page is the other half of it: the measurements, the published work, and the methods that would settle the question. A theory sitting on this site is not evidence, and nothing here is a finding until it has survived a blinded test.",
      "Every record named below comes from the research library or the typed trials table, both of which anyone can download under CC-BY-4.0. Where a section holds no records yet, it says so rather than filling the space.",
    ],
    links: [
      { href: "/theories", label: "Theory board" },
      { href: "/bibliography", label: "Research bibliography" },
      { href: "/trials", label: "Trials, studies and experiments" },
      { href: "/methods", label: "Methods and draft study design" },
      { href: "/dataset", label: "Dataset" },
    ],
    breadcrumbName: "Research",
    // Mirrors the five sections rendered by src/components/research/ScienceRoom.tsx.
    // Edge functions run in Deno and cannot import from src/, so change both in
    // the same commit.
    bodyExtraHtml: `<section data-prerender="research-direct-tests">
  <h2>Direct tests: the laser observation itself</h2>
  <p>Work that tested the observation rather than the compound. Every record is typed on ${SITE}/trials, so a pilot report is never mistaken for a registered clinical trial. The published pilot report is Goler's 2025 account in IPI Letters, DOI 10.59973/ipil.158.</p>
  <p>Stage one of this project is screening, not the experiment: open, self selected, unblinded, with priming not ruled out. Stage two captures the memory before the observer sees the catalogue. Stage three is a randomized blinded arm, designed and not run. Nothing on this site settles the question.</p>
  <p><a href="${SITE}/trials">Every typed record, including the community experiments and the reported replication</a>. <a href="${SITE}/critiques">The case against</a>.</p>
</section>
<section data-prerender="research-mechanistic">
  <h2>Mechanistic science</h2>
  <p>What optics and vision science already know that could produce a repeatable form without anything exotic: laser speckle, the geometry of the visual cortex, predictive processing, and the classic hallucinatory form constants. If one of these accounts for the reports, that is the answer, and it would be a real one.</p>
  <p>Additions to this strand are the ones most worth having, since a conventional optical or cortical account would settle the question. <a href="${SITE}/bibliography">Browse the library</a> and send additions to info@dmtcode.com.</p>
</section>
<section data-prerender="research-dmt-science">
  <h2>DMT science</h2>
  <p>What has been measured about the compound itself: EEG and fMRI during the experience, pharmacology and receptor work, and the phenomenological literature that tries to describe what people report. The library is stance scored, so skeptical, neutral and supportive sources are indexed side by side.</p>
  <p><a href="${SITE}/bibliography">Filter the library by stance, authority type and year</a>.</p>
</section>
<section data-prerender="research-methodology">
  <h2>Methodology</h2>
  <p>How a claim like this would be tested properly: blinded matching, similarity scoring that survives rotation and stroke width, preregistration of the outcome before recruitment begins, and honest handling of null results. The draft study design is published in full, including the sample size correction that followed an error in an earlier version.</p>
  <ul>
    <li><a href="${SITE}/methods">Methods</a>: blinding design, control conditions, sample size calculation, and the limits of similarity scoring.</li>
    <li><a href="${SITE}/null-reports">Null reports</a>: reports of seeing nothing, published alongside the positive ones.</li>
    <li><a href="${SITE}/critiques">Critiques</a>: the case against, kept where it can be read first.</li>
    <li><a href="${SITE}/protocol-guide">Protocol guide</a>: the reported equipment, including the laser class the pilot actually used.</li>
  </ul>
</section>
<section data-prerender="research-open-projects">
  <h2>Open projects</h2>
  <p>Collaborations are listed on this page as they are agreed, with the collaborator named, and not before.</p>
  <ul>
    <li>Proposed studies: the blinded arm is designed and unfunded. The design is public on <a href="${SITE}/methods">Methods</a> and the questions it would settle are tracked on <a href="${SITE}/open-questions">open questions</a>.</li>
    <li>Research recruitment: analysts, recorders and translators can volunteer through <a href="${SITE}/join">join</a>. Observers who want to record before browsing start at <a href="${SITE}/capture">capture</a>.</li>
    <li>Datasets needing analysis: the corpus is downloadable at <a href="${SITE}/data.json">/data.json</a> under CC-BY-4.0, with field definitions on <a href="${SITE}/dataset">dataset</a>. The two symbol counts are not synonyms; the <a href="${SITE}/object-model">object model</a> explains what each one counts.</li>
    <li>Active collaborations: listed here as they are agreed. Researchers who want to use the corpus or run a study with it can write to info@dmtcode.com. The licence is CC-BY-4.0, so nothing here needs our permission.</li>
  </ul>
</section>`,
  },
  protocols: {
    title: "Protocol catalogue | DMT Code",
    description: "Catalogue of psychedelic and 650 nm laser protocols indexed by the DMT Code project.",
    heading: "Protocols",
    paragraphs: [
      "The protocol catalogue indexes documented psychedelic and 650 nm laser observation protocols, including dosing ranges, equipment specifications, and safety notes where available.",
      "Protocols are indexed for reference. Nothing on this page is a personal recommendation.",
    ],
    links: [
      { href: "/prepare", label: "Prepare to observe" },
      { href: "/protocol-guide", label: "Protocol guide" },
    ],
    breadcrumbName: "Protocols",
  },
  forecasts: {
    title: "Research and technology forecasts | DMT Code",
    description: "Uncertainty-bounded forecasts for DMT research milestones and adjacent technology.",
    heading: "Forecasts",
    paragraphs: [
      "This page publishes uncertainty-bounded forecasts for research milestones adjacent to the DMT Code project. Probabilities are expressed with an interval, not a point estimate.",
      "Forecast rationales are versioned so a reader can inspect why an estimate has moved.",
    ],
    breadcrumbName: "Forecasts",
  },
  "protocol-guide": {
    title: "650 nm Laser Protocol Guide | DMT Code",
    description: "Neutral overview of the reported 650 nm laser observation protocol, first described by Danny Goler in 2020: equipment, safety, and how observations are recorded.",
    heading: "650 nm Laser Protocol Guide",
    paragraphs: [
      PROTOCOL_GUIDE_LEDE,
      "This is a neutral summary of the 650 nm laser observation protocol as reported by contributors. It documents equipment, room conditions, and observation posture. It is not medical or legal advice.",
      "Adults 18 and older only. Raise MAOIs, SSRIs, cardiac history, and personal or family history of psychosis with a qualified prescriber before any consideration of practice.",
    ],
    links: [
      { href: "/prepare", label: "Prepare" },
      { href: "/methods", label: "Methods" },
    ],
    breadcrumbName: "Protocol guide",
    bodyExtraHtml: `<section><h2>Common questions</h2>${PROTOCOL_GUIDE_FAQ.map((f) => `<div><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join("")}</section>`,
    extraJsonLd: [PROTOCOL_GUIDE_FAQ_LD],
  },
  privacy: {
    title: "Privacy | DMT Code",
    description: "What DMT Code collects, who processes it, and what becomes public.",
    heading: "Privacy",
    paragraphs: [
      "Effective 28 August 2026.",
      "This page describes what this site collects, where it goes, and what becomes public. It was written by reading our own code and database rather than from a template, so it describes what actually happens here.",
    ],
    breadcrumbName: "Privacy",
    bodyExtraHtml: `<section><h2>The short version</h2><p>You can read almost everything on this site without an account and without telling us anything. An account is not needed to browse. It is needed to seal a memory or submit a record. If you make an account and contribute, the content you contribute is meant to become public, because a convergence dataset that nobody can check is worth nothing. Your identity is not part of what becomes public.</p></section>
<section><h2>What we collect</h2><p><strong>If you create an account.</strong> Your email address and a password, or a Google or Apple sign in if you choose that instead. Passwords are handled by our authentication provider and never reach us in readable form. On sign up we generate a pseudonym for you automatically, in the form of a two word handle. You can change the display name attached to it. We do not ask for your real name at any point, except at checkout, where Meridian Optics Lab receives the shipping details you enter.</p><p><strong>If you submit a symbol.</strong> The image you draw or upload, your written description, the tags you choose, and, if you fill them in, the route of administration and approximate dose. If you record a voice note, the audio goes to a private store, inside a folder that only your own account can write to. It is never shown on the site, never attached to the public symbol, and never included in the open export. You can play your own back from your account through a link that stops working after an hour. A voice can identify a person in a way a drawing cannot, which is why it is kept apart from the images.</p><p><strong>If you complete an assessment.</strong> Your responses to the PHQ-9, GAD-7, MEQ-4 and CEQ-7 questionnaires, and your before and after mood ratings. These are mental health questions and we treat the answers accordingly. They are stored in a private area that is not readable by other visitors. If you upload imaging, that is stored in the same private area.</p><p><strong>If you join a list.</strong> For the general waiting list and for the clinical trial watch list, your email address, and nothing else.</p><p><strong>If you volunteer.</strong> The email address, handle, roles, experience level, languages, skills and motivation you enter on the volunteer form, and whether you consented to being contacted.</p><p><strong>If you buy something.</strong> Nothing about the payment. Checkout happens on Shopify's own systems. Card numbers never touch this site or our database. Kits are sold and shipped by Meridian Optics Lab, the store of record operated by the same owner as DMT Code Project; its refund, shipping and terms policies govern purchases.</p></section>
<section><h2>What we deliberately do not collect</h2><p>We do not log the IP addresses of visitors. Our server side logging records only automated crawlers, and for those it records only the page requested, the crawler's name, and its user agent string. There is no visitor identifier, no fingerprint and no IP address in that log.</p><p>We do not ask for your real name, your date of birth, your address or your phone number anywhere on this site, except at checkout, where Meridian Optics Lab receives the shipping details you enter.</p></section>
<section><h2>Who processes data for us</h2><ul><li>Supabase, for the database, sign in and file storage.</li><li>Netlify, for hosting and for the code that runs at the edge.</li><li>Resend, for the emails we send you.</li><li>Shopify, for the shop and for checkout.</li><li>Google Analytics, for measuring which pages get read.</li><li>Google Fonts and Zenodo, which see a request from your browser when a page loads a font or the citation badge in our footer.</li></ul></section>
<section><h2>What becomes public</h2><p>Handles and display names are readable by anyone. That is deliberate, because contributions are attributed to a handle.</p><p>A symbol you submit is published immediately, before any review: the image, the description, the tags, the conditions you chose to record, and the recognition and non-match counts. Administrators have 72 hours to review it and can hide it. Theories, events, retreats and trial records you submit are reviewed first and become public once approved, in full.</p><p>Your email address never becomes public. Your assessment answers never become public. Your account identifier is not displayed anywhere on the site.</p></section>
<section><h2>The open data export</h2><p>We publish an export of the site at /data.json under a Creative Commons Attribution 4.0 licence, and we explicitly invite AI crawlers to read it. This is the point of the project. Data that cannot be independently checked is not evidence.</p><p>The export includes every published symbol submission whose contributor granted publication consent, carrying its visibility, moderation and evidence status fields, plus approved theories and approved events. For a symbol that means the description, the tags, the recognition and non-match counts, the date and the web address of the image. It does not include your email address, and it does not include raw voice audio.</p><p>If you would rather your contribution were not in that export, tell us and we will take it out of the next one. We cannot recall copies that other people have already downloaded, which is what a Creative Commons licence means in practice, so please decide before you submit rather than after.</p></section>
<section><h2>Cookies and analytics</h2><p>Google Analytics loads on every page of this site and sets cookies in your browser. We see aggregate reports: which pages were read, roughly where in the world readers were, which pages were read next. We do not use it to build a profile of you and we do not sell anything to advertisers.</p><p>It currently loads without asking you first. If you would rather not be measured, you can install Google's own opt out browser add on, or block analytics cookies in your browser settings, or use a browser that blocks them by default. Both work on this site and neither breaks anything.</p></section>
<section><h2>Where things are stored</h2><p>Assessment responses and any imaging you upload are held in a private store that requires authentication to read. Symbol images and drawings are held in a public store, because they are published on the site. Voice notes are not. They are held in the private store, in a folder per account, and are served only through short lived links to the person who recorded them.</p></section>
<section><h2>Getting your data, or getting rid of it</h2><p>Write to info@dmtcode.com and ask. You can ask us for a copy of what we hold about you, for a correction, or for deletion. If you ask us to delete your account we will remove the account and the personal details attached to it.</p><p>For a published contribution, tell us whether you want it removed entirely or kept and detached from your account. We will do either. Where we remove a research record rather than delete it, we hide it from the site rather than destroying it, and we will tell you which we did.</p></section>
<section><h2>Children</h2><p>This site is for adults. It is not intended for anyone under 18 and we do not knowingly collect anything from anyone under 18.</p></section>
<section><h2>Changes</h2><p>If we change this page we will change the date at the top. Material changes will be noted on the page rather than made quietly.</p></section>
<p>Questions: info@dmtcode.com</p>`,
  },
  terms: {
    title: "Terms | DMT Code",
    description: "The terms you agree to when you use DMT Code or contribute to it.",
    heading: "Terms",
    paragraphs: [
      "Effective 28 August 2026.",
    ],
    breadcrumbName: "Terms",
    bodyExtraHtml: `<section><h2>What this site is</h2><p>DMT Code is a research project that collects and publishes reports of a visual phenomenon, alongside clinical trial records, a bibliography, and competing explanations for what the phenomenon might be. It takes no position on whether the phenomenon is real. Nothing here asserts that it is, and nothing here asserts that it is not.</p></section>
<section><h2>This is not medical advice</h2><p>Nothing on this site is medical advice, therapeutic advice or legal advice. It is not intended to diagnose, treat, cure or prevent anything. DMT is a controlled substance in many countries. This site does not encourage or condone the use of any illegal substance, does not provide sourcing information, and does not provide dosing guidance. Requests for any of those will not receive a reply. Speak to a qualified clinician about anything to do with your health, and check your own local law.</p><p>You must be 18 or older to use this site.</p></section>
<section><h2>Your account</h2><p>An account is optional for browsing. An account is required to seal or submit a record, to respond to a symbol, to follow, or to volunteer. You get an automatically generated pseudonym, and you are welcome to keep it. Keep your password to yourself. Tell us at info@dmtcode.com if you think someone else is using your account.</p></section>
<section><h2>What you contribute, and how it is licensed</h2><p>This is the most important section on this page, so it is written plainly.</p><p>When you submit a symbol, a theory or an event, and it is published on this site, you are giving us permission to publish it on this site and to include it in our open data export at /data.json. That export is licensed under Creative Commons Attribution 4.0. In practice this means that anyone, including companies that train AI systems, may copy and reuse the content you contributed as long as they credit DMT Code.</p><p>This is deliberate rather than incidental. The only thing that makes a convergence dataset worth anything is that other people can check it, and that requires them to be able to hold a copy.</p><p>What this does not include: your email address, and your assessment responses, neither of which are ever published or exported.</p><p>You keep ownership of what you contribute. You are giving us a licence, not signing it away.</p><p>You can ask us to withdraw a contribution at any time by writing to info@dmtcode.com. We will remove it from the site and from the next export. We cannot retrieve copies that other people have already taken, which is the nature of an open licence.</p><p>Only submit material that is yours to submit.</p></section>
<section><h2>Moderation</h2><p>Symbols you draw and submit appear in the public registry immediately. There is no queue in front of them. Administrators then have 72 hours from publication to review a submission and deny it. A denied submission is hidden rather than deleted, so a record of what was submitted survives. After that window it stands, unless it is later reported and found to break the rules below.</p><p>Events, retreats, trial records and theories that people submit work the other way around: those are reviewed before they appear. Events and retreats found by our own scrapers can appear before an editor has verified them, and are labelled as auto-discovered candidates until one has. The label is the review status; read it.</p><p>Anyone signed in can mark a symbol as echoing their memory, or as not resembling what they saw. Both responses are recorded and both are published in our open data export. Neither one reorders the registry for anybody else. The browse list follows whichever sort the reader picked. One of those sorts does weigh community responses, but the reader has to choose it and it ranks only symbols carrying at least five responses. A response never removes a symbol and never hides one.</p><p>We remove: requests for sourcing, dosing instructions, anything that identifies another person without their consent, spam, and reports we have reason to believe were invented. That last one matters more here than it would elsewhere. A dataset of reported experiences is only worth reading if the reports are real. Submitting one that is not is the one thing that damages this project irreparably.</p></section>
<section><h2>Buying equipment</h2><p>Kits are sold and shipped by Meridian Optics Lab, the store of record operated by the same owner as DMT Code Project; its refund, shipping and terms policies govern purchases. Those policies are mirrored at /shipping, /returns, /store-terms and /store-contact. This site does not currently carry affiliate links. If that changes, /disclosure will name them before they go live.</p><p>Equipment listed here is ordinary optical equipment. We do not sell, source or explain how to obtain any controlled substance.</p></section>
<section><h2>Accuracy</h2><p>We correct errors publicly rather than quietly. Where a record turns out to be wrong or unverifiable, we hide it and say so. Where a citation is wrong, we fix it. If you find something wrong, tell us at info@dmtcode.com and we would rather hear it than not.</p></section>
<section><h2>No warranty</h2><p>This site is provided as it is. We do not promise it will be available, complete or free of errors. We do not promise that the phenomenon described here is real, and we say so throughout the site. Decisions you make about your own health and your own conduct are yours.</p></section>
<section><h2>Changes</h2><p>If we change these terms we will change the date at the top.</p></section>
<p>Questions: info@dmtcode.com</p>`,
  },
  shipping: {
    title: "Shipping Policy | Meridian Optics Lab via DMT Code",
    description: "Shipping timelines, tracking, packaging and international terms for Meridian Optics Lab, the store of record for DMT Code kits.",
    heading: "Shipping Policy",
    paragraphs: [
      "These policies belong to Meridian Optics Lab, the store of record for DMT Code kits.",
    ],
    breadcrumbName: "Shipping",
    bodyExtraHtml: `<section><p>All kits ship free within the United States. Orders are processed within 2 business days and arrive within 7 to 10 business days of ordering.</p><p>You will receive a shipping confirmation email with tracking when your order is on its way. Kits ship in plain packaging.</p><p>If your order has not arrived within 10 business days, email info@dmtcode.com with your order number and we will investigate with the carrier.</p><p>We also ship internationally to Canada, the United Kingdom, Ireland, most of the European Union, Norway, Switzerland, Israel, the United Arab Emirates, Japan, South Korea, Hong Kong, Singapore, Malaysia, Australia and New Zealand. International rates are carrier calculated (USPS or DHL Express) and shown at checkout before you pay. Delivery timelines vary by destination, and any customs duties or import taxes are the responsibility of the buyer. If your country is not offered at checkout, email info@dmtcode.com before ordering.</p><p>Authoritative copy: <a href="https://dmtcode-p4szt.myshopify.com/policies/shipping-policy">Meridian Optics Lab Shipping Policy</a></p></section>`,
  },
  returns: {
    title: "Returns and Refunds | Meridian Optics Lab via DMT Code",
    description: "Return eligibility, refund timelines and damaged item handling for Meridian Optics Lab, the store of record for DMT Code kits.",
    heading: "Returns and Refunds",
    paragraphs: [
      "These policies belong to Meridian Optics Lab, the store of record for DMT Code kits.",
    ],
    breadcrumbName: "Returns",
    bodyExtraHtml: `<section><p>Meridian Optics Lab accepts returns of unopened, unused optical research kits within 30 days of delivery.</p></section>
<section><h2>Eligibility</h2><p>Items must be unopened, unused, and in original packaging with all components included. Opened laser modules are not eligible for return. These are precision optical instruments and personal safety items; once opened, we cannot verify their calibration or hygiene and cannot resell them. Kits with broken factory seals on the laser module compartment are treated as opened.</p></section>
<section><h2>How to start a return</h2><p>Email info@dmtcode.com with your order number. We will confirm eligibility and provide the return address. Return shipping is paid by the buyer. We recommend a tracked service; lost return shipments are the sender's responsibility.</p></section>
<section><h2>Refunds</h2><p>Once the returned kit is received and inspected, approved refunds are issued to the original payment method within 10 business days. Original shipping charges, where applicable, are not refunded.</p></section>
<section><h2>Damaged or defective items</h2><p>If your kit arrives damaged or a component is defective, email info@dmtcode.com within 7 days of delivery with photos of the damage and packaging. We will replace the affected component or the full kit at no cost to you. Defective claims do not require returning the original item unless we request it.</p></section>
<section><h2>Exchanges</h2><p>We do not offer direct exchanges. Return the eligible item for a refund and place a new order.</p></section>
<section><p>This policy is governed by the laws of the State of Arizona, United States.</p><p>Authoritative copy: <a href="https://dmtcode-p4szt.myshopify.com/policies/refund-policy">Meridian Optics Lab Refund Policy</a></p></section>`,
  },
  "store-terms": {
    title: "Terms of Service | Meridian Optics Lab via DMT Code",
    description: "Purchase terms, laser safety requirements, liability and governing law for Meridian Optics Lab, the store of record for DMT Code kits.",
    heading: "Terms of Service",
    paragraphs: [
      "These policies belong to Meridian Optics Lab, the store of record for DMT Code kits.",
    ],
    breadcrumbName: "Store terms",
    bodyExtraHtml: `<section><p>These terms govern purchases from Meridian Optics Lab, an online retailer of educational optical research equipment based in Tucson, Arizona, United States. By placing an order you agree to these terms.</p></section>
<section><h2>Products</h2><p>We sell 650 nm laser diffraction and refraction observation kits and related optical components intended for educational and observational research use by adults. Products are laboratory and classroom style equipment. They are not toys, not medical devices, and are not intended to diagnose, treat, cure, or prevent any condition.</p></section>
<section><h2>Age requirement</h2><p>You must be at least 18 years old to purchase. Laser devices should be used by, or under the direct supervision of, an adult.</p></section>
<section><h2>Laser safety</h2><p>Kits contain low power visible laser modules that comply with applicable United States FDA CDRH requirements for consumer laser products. Never point a laser at eyes, faces, people, animals, vehicles, or aircraft. Never view the beam directly or through magnifying optics. Read all included safety documentation before use. You are responsible for using the equipment safely and in compliance with the laws of your jurisdiction.</p></section>
<section><h2>Orders and pricing</h2><p>All prices are in US dollars. We reserve the right to refuse or cancel any order, including where a product listing contains a pricing or descriptive error. If we cancel a paid order you receive a full refund.</p></section>
<section><h2>Shipping</h2><p>Shipping terms, timelines, and destinations are described in our Shipping Policy at checkout.</p></section>
<section><h2>Intellectual property</h2><p>Product photography and kit materials are the property of Meridian Optics Lab or its licensors and may not be reproduced for commercial purposes without written permission. The protocol documents are published free under CC-BY-4.0 at dmtcode.com/prepare.</p></section>
<section><h2>Limitation of liability</h2><p>To the maximum extent permitted by law, Meridian Optics Lab is not liable for indirect, incidental, or consequential damages arising from the use or misuse of purchased equipment. Our total liability for any claim is limited to the amount you paid for the product giving rise to the claim. Nothing in these terms limits liability that cannot be limited under applicable law.</p></section>
<section><h2>Governing law</h2><p>These terms are governed by the laws of the State of Arizona, United States, without regard to conflict of law principles. Any dispute will be resolved in the state or federal courts located in Pima County, Arizona.</p></section>
<section><h2>Contact</h2><p>Questions about these terms: info@dmtcode.com</p><p>Authoritative copy: <a href="https://dmtcode-p4szt.myshopify.com/policies/terms-of-service">Meridian Optics Lab Terms of Service</a></p></section>`,
  },
  "store-contact": {
    title: "Contact Information | Meridian Optics Lab via DMT Code",
    description: "Contact details and response times for Meridian Optics Lab, the store of record for DMT Code kits.",
    heading: "Contact Information",
    paragraphs: [
      "These policies belong to Meridian Optics Lab, the store of record for DMT Code kits.",
    ],
    breadcrumbName: "Store contact",
    bodyExtraHtml: `<section><p>Meridian Optics Lab</p><p>Tucson, Arizona, United States</p><p>Email: <a href="mailto:info@dmtcode.com">info@dmtcode.com</a></p><p>We respond to order and product inquiries within 2 business days. For return requests, include your order number in the subject line.</p><p>Authoritative copy: <a href="https://dmtcode-p4szt.myshopify.com/policies/contact-information">Meridian Optics Lab Contact Information</a></p></section>`,
  },
  disclosure: {
    title: "Disclosure | DMT Code",
    description: "How this project makes money, who we have relationships with, and where the conflicts are.",
    heading: "Disclosure",
    paragraphs: [
      "Effective 16 August 2026.",
      "Kits are sold as Meridian Optics Lab, Tucson, Arizona, a trade name of the same owner as DMT Code Project. That name appears on your card statement.",
      "A site whose whole claim is that it can be trusted with a contested subject owes you a straight account of where its money comes from. This is that account.",
    ],
    breadcrumbName: "Disclosure",
    bodyExtraHtml: `<section><h2>How this project pays for itself</h2><p>One way.</p><p><strong>Affiliate commissions.</strong> None at present. Earlier versions of this page named three affiliate products (a Bon Charge red light device, a MitoMAT red light mat, and a Peyote Way Church of God spirit walk). Those links have since been removed from the site and no affiliate relationship is currently active. If we add one, it will be named on this page before it goes live.</p><p><strong>Direct sales.</strong> We sell equipment kits through our own Shopify store. When you buy a kit, we are the seller and the margin is ours.</p><p>There is no venture funding, no pharmaceutical sponsorship, no paid placement, and nothing behind a paywall. The full dataset is free and openly licensed.</p></section>
<section><h2>Equipment we sell ourselves</h2><p>We sell 650 nm laser kits and related equipment directly. This is a real commercial interest in the protocol this site documents, and it is the most obvious conflict in the project. We would rather state it in one sentence at the top of a page than have you find it.</p><p>What we do about it: the protocol pages describe the equipment in generic terms, the specifications are published so you can buy the same parts elsewhere, and the critiques and null reports sections stay up regardless of what they do to sales.</p></section>
<section><h2>Our own event</h2><p>The events list includes DMT Code Protocol Training, which is run by this project. It sits alongside events run by other people. It is ours and we are saying so.</p></section>
<section><h2>Editorial independence</h2><p>Danny Goler first described the observation this project studies, and he is credited as its originator throughout the site. He is aware of the project but holds no editorial role in it. What gets published here, including the critiques and the null results, is decided independently, and the open dataset lets anyone check that policy against practice.</p></section>
<section><h2>Listings are not endorsements</h2><p>Retreats, events and clinical trials are listed because they exist and are relevant, not because we vouch for them. We are not affiliated with any of the retreat centres we list, and we have not inspected any of them. Verify independently and get medical screening before booking anything.</p></section>
<section><h2>What we do not do</h2><p>We do not accept payment for a listing, a favourable description, or a place in the registry. We do not sell, source or broker any controlled substance. We do not sell visitor data.</p></section>
<section><h2>Corrections</h2><p>If you believe something on this page is incomplete, write to info@dmtcode.com and we will correct it.</p></section>`,
  },
  capture: {
    title: "Capture a memory | DMT Code",
    description: "Record and seal a first person account of a visual form seen during a DMT session, before viewing the catalogue.",
    heading: "Have you seen something you cannot explain?",
    paragraphs: [
      "Describe it before you look at anyone else's. Your account is sealed and timestamped the moment you submit, so if it later turns out to match another report, the record shows your memory came first.",
      "This is why the order matters. A description written after browsing a catalogue cannot be told apart from a description shaped by it. A description written before browsing can. That single difference is what turns a personal memory into something an outside analyst can weigh.",
      "You draw what you saw, describe it in your own words, note the conditions, and place it in your visual field. The last question asks whether you had seen this kind of imagery before your experience, so records from people who came in unprimed can be counted separately.",
      "You need an account to record one. The account is what stamps the record to you and fixes its place in the order. Your real name stays private and you are given an avatar instead.",
      "Nothing from the catalogue is shown to you until after your own record is sealed. Only then are candidate matches offered.",
    ],
    links: [
      { href: "/registry", label: "Visual symbol registry" },
      { href: "/evidence-map", label: "Evidence map" },
      { href: "/methods", label: "Methods" },
      { href: "/events", label: "Events" },
      { href: "/trials", label: "Clinical trials" },
    ],
    breadcrumbName: "Capture",
  },
  "co-witnesses": {
    title: "Co-witness wall | DMT Code",
    description: "Field notes from people who independently reported the same visual form. Opt-in only, shown by handle and avatar, with no personal details.",
    heading: "Co-witness wall",
    paragraphs: [
      "Short recollections from people who marked that they had seen a symbol in the registry. Only people who opted in to the wall appear here.",
      "Each note is attached to the symbol it refers to and, where given, to the context in which the form was seen. Contributors are shown by handle and pseudonymous avatar. No personal details are published.",
      "A recollection written after seeing a symbol here is recognition after exposure, not independent confirmation. The wall records what people say they remember, and leaves the weighing of that to the reader.",
    ],
    links: [
      { href: "/registry", label: "Visual symbol registry" },
      { href: "/capture", label: "Capture a memory" },
      { href: "/methods", label: "Methods" },
      { href: "/evidence-map", label: "Evidence map" },
    ],
    breadcrumbName: "Co-witnesses",
  },
  join: {

    title: "Help build it | DMT Code",
    description: "Volunteer to help test whether independent reports of visual symbols actually converge. Recorders, translators, analysts, and developers welcome.",
    heading: "A real experiment with an unknown answer.",
    paragraphs: [
      "Thousands of people report vivid, structured experiences. We are testing whether those reports truly converge, or whether optics, shared neurobiology, expectation, and memory explain the apparent overlap.",
      "You do not need credentials to help. You need care, honesty, and time. Tell us how you can contribute and we will match you to a role.",
      "Volunteering asks for an email, the roles you can help with, and optionally your experience level, languages, skills, and why you want to help. You need an account so the entry is tied to a person. Your real name stays private and you are given an avatar instead.",
      "We may confirm something extraordinary, or we may find it was the mind all along. Both results matter. Thank you for helping us find out honestly.",
    ],
    bodyExtraHtml: `<section><h2>Roles</h2><dl>${[
      ["Recorder", "Recorders run the observation protocol and write down what they saw on the field sheet, in their own words. Nothing is required beyond care, honesty, and a completed record."],
      ["Translator", "Translators carry records, protocol documents, and site pages into Spanish, German, and other languages. Accuracy matters more than fluency, because a mistranslated report is worse than no translation."],
      ["Analyst", "Analysts look at the registry as data and test whether the reported forms actually converge or only appear to. Every submission carries a prior exposure flag, naive or exposed, recording whether the contributor had already seen symbols here before writing their own. The first real analyst job is splitting the submissions on that flag and reporting whether the split changes anything. That includes arguing against the claim when the numbers do not support it."],
      ["Developer", "Developers work on the site, the registry, and the export pipeline that keeps the data open. Most of the work is small, careful, and public."],
    ].map(([r, d]) => `<dt>${esc(r)}</dt><dd>${esc(d)}</dd>`).join("")}</dl>
    <p>Moderation, outreach, and peer support roles are filled from within these four.</p>
    <p><a href="/auth?returnTo=%2Fjoin">Sign in to volunteer</a></p></section>`,

    links: [
      { href: "/capture", label: "Submit what you saw" },
      { href: "/trials", label: "Clinical trials" },
      { href: "/events", label: "Events" },
      { href: "/about", label: "About the project" },
    ],
    breadcrumbName: "Help build it",
  },
  preregister: {
    title: "Research pre-registration | DMT Code",
    description: "Pre-register a proposed physiological instrumentation study for the DMT Code open research call.",
    heading: "Research pre-registration",
    paragraphs: [
      "A pre-registration records a study's hypothesis and methods before data collection. This open call is for researchers with ethics approval or access to physiological instrumentation who are planning relevant EEG, ECG, eye-tracking, or imaging work.",
      "Writing the hypothesis and the method down first is what makes the result readable afterwards. A method described before the data exists cannot be rewritten to fit the data, so a null result stays a null result rather than becoming a different question that happened to work.",
      "The form asks for a title, the hypothesis, a summary of the method, and a contact email. It also takes the instruments you plan to use, an ORCID, and an affiliation, and those three are optional. No account is needed to submit one.",
      "A submitted pre-registration goes into the research intake queue. An administrator can inspect it and may contact you at the email address you gave. No review timeline is promised.",
      "Submitting a pre-registration does not enrol you in a study, does not oblige you to run the work, and is not an approval, an endorsement, or an offer of funding or equipment. Ethics approval and instrument access remain yours to arrange.",
    ],
    links: [
      { href: "/protocols", label: "Protocols" },
      { href: "/methods", label: "Methods" },
      { href: "/research", label: "Research" },
      { href: "/trials", label: "Clinical trials" },
    ],
    breadcrumbName: "Pre-registration",
  },
  "submit-symbol": {
    title: "Submit a symbol to the registry | DMT Code",
    description: "The drawing tool for adding a symbol to the DMT Code visual registry with its observation metadata. Open to anyone, with no account required.",
    heading: "Submit a symbol to the registry",
    robots: "noindex, follow",
    paragraphs: [
      "This is the tool for adding a drawn symbol to the visual registry. It needs an account, so it is not public content and search engines are asked not to index it.",
      "It runs in four steps: draw the symbol, add the details, review what you are about to submit, and confirm.",
      "The details step records a description, tags, the observation method, the surface type, a context note, the wavelength used, the dose level, how long it lasted, whether it recurred, and its emotional tone. The drawing is stored as an image and as vector data so it can be compared shape to shape rather than pixel to pixel.",
      "If you want your record weighed as an independent account, use the capture route instead. That one seals and timestamps what you describe before showing you anything from the catalogue.",
      "Symbols publish to the registry the moment you submit them. An administrator has 72 hours to review a submission and deny it. Readers can mark a symbol as echoing their memory or as not resembling what they saw. Both are recorded and both are published in the open data export, and neither one changes where the symbol sits in the default browse order.",
    ],
    links: [
      { href: "/capture", label: "Capture a memory" },
      { href: "/registry", label: "Visual symbol registry" },
      { href: "/methods", label: "Methods" },
    ],
    breadcrumbName: "Submit a symbol",
  },
};


async function renderStatic(context: Context, key: string, locale: Loc = "en"): Promise<Response> {
  const page = STATIC_PAGES[key];
  const shellRes = await context.next();
  if (!page) return shellRes;

  const path = key === "home" ? "" : `/${key}`;
  const canonical = `${SITE}${path || "/"}`;

  let recentList = "";
  const extraLd: unknown[] = [...(page.extraJsonLd ?? [])];

  if (key === "events" && SUPABASE_URL && SUPABASE_KEY) {
    try {
      const headers = {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      };
      const todayIso = new Date().toISOString().slice(0, 10);
      const [upRes, pastRes, reRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/events?is_approved=eq.true&event_date=gte.${todayIso}&select=id,title,description,event_date,end_date,location,event_type,organizer,verification_status,relevance_type&order=event_date.asc&limit=50`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/events?is_approved=eq.true&event_date=lt.${todayIso}&select=id,title,description,event_date,end_date,location,event_type,organizer,verification_status,relevance_type&order=event_date.desc&limit=50`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/retreats?is_approved=eq.true&select=id,name,description,location,country,website_url&order=created_at.desc&limit=12`, { headers }),
      ]);
      const ups = upRes.ok ? await upRes.json() as Array<Record<string, string>> : [];
      const pasts = pastRes.ok ? await pastRes.json() as Array<Record<string, string>> : [];
      const rets = reRes.ok ? await reRes.json() as Array<Record<string, string>> : [];

      const evTr = await getTranslationsBulk("events", locale);
      const reTr = await getTranslationsBulk("retreats", locale);
      for (const r of [...ups, ...pasts]) {
        const t = evTr[String(r.id)];
        if (t) overlay(r as unknown as Record<string, unknown>, t, ["title", "description"]);
      }
      for (const r of rets) {
        const t = reTr[String(r.id)];
        if (t) overlay(r as unknown as Record<string, unknown>, t, ["description"]);
      }

      const renderEv = (r: Record<string, string>) => `<li><time datetime="${esc(r.event_date)}">${esc(String(r.event_date || "").slice(0,10))}</time>: <a href="/events/${esc(r.id)}">${esc(clip(String(r.title || ""), 140))}</a>${r.location ? ` (${esc(String(r.location))})` : ""}${r.organizer ? ` - ${esc(String(r.organizer))}` : ""}${r.verification_status ? ` [${esc(evVerLabel(String(r.verification_status)))}]` : ""}${r.description ? `<p>${esc(clip(stripAuto(String(r.description)), 240))}</p>` : ""}</li>`;
      const renderRe = (r: Record<string, string>) => `<li><a href="/retreats/${esc(r.id)}">${esc(clip(String(r.name || ""), 140))}</a>${r.location || r.country ? ` (${esc([r.location, r.country].filter(Boolean).join(", "))})` : ""}${r.description ? `<p>${esc(clip(String(r.description), 240))}</p>` : ""}</li>`;

      const sections: string[] = [];
      if (ups.length) sections.push(`<section><h2>${hubLabel("events-upcoming", locale)}</h2><ul>${ups.map(renderEv).join("")}</ul></section>`);
      if (pasts.length) sections.push(`<section><h2>${hubLabel("events-past", locale)}</h2><ul>${pasts.map(renderEv).join("")}</ul></section>`);
      if (rets.length) sections.push(`<section><h2>${hubLabel("events-retreats", locale)}</h2><ul>${rets.map(renderRe).join("")}</ul></section>`);
      if (!sections.length) sections.push(`<section><h2>${hubLabel("events-empty-h2", locale)}</h2><p>${hubLabel("events-empty-p", locale)}</p></section>`);
      recentList = sections.join("\n") + `\n<p><em>${hubLabel("events-note", locale)}</em></p>`;
      const listItems = [
        ...ups.map((r, i) => ({ "@type": String(r.event_type || "").toLowerCase() === "festival" ? "Festival" : "Event", position: i + 1, name: String(r.title || ""), description: stripAuto(String(r.description || "")).trim() || undefined, startDate: r.event_date || undefined, endDate: r.end_date || undefined, location: r.location || undefined, organizer: r.organizer ? { "@type": "Organization", name: String(r.organizer) } : undefined, eventStatus: "https://schema.org/EventScheduled", url: `${SITE}/events/${r.id}` })),
        ...pasts.map((r, i) => ({ "@type": String(r.event_type || "").toLowerCase() === "festival" ? "Festival" : "Event", position: ups.length + i + 1, name: String(r.title || ""), description: stripAuto(String(r.description || "")).trim() || undefined, startDate: r.event_date || undefined, endDate: r.end_date || undefined, location: r.location || undefined, organizer: r.organizer ? { "@type": "Organization", name: String(r.organizer) } : undefined, url: `${SITE}/events/${r.id}` })),
        ...rets.map((r, i) => ({ "@type": "LodgingBusiness", position: ups.length + pasts.length + i + 1, name: String(r.name || ""), location: [r.location, r.country].filter(Boolean).join(", ") || undefined, url: `${SITE}/retreats/${r.id}` })),
      ];
      if (listItems.length) {
        extraLd.push({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "DMT Code Research Timeline",
          itemListElement: listItems,
        });
      }
    } catch { /* ignore */ }
  } else if (key === "protocols" && SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/protocols?is_published=is.true&select=slug,title,tagline&order=title.asc&limit=50`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Accept: "application/json",
          },
        },
      );
      const rows = res.ok ? await res.json() as Array<Record<string, unknown>> : [];
      const trMap = await getTranslationsBulk("protocols", locale);
      for (const r of rows) {
        const t = trMap[String(r.slug ?? "")];
        if (t) overlay(r, t, ["title", "tagline"]);
      }
      if (rows.length) {
        const items = rows
          .map((r) => {
            const slug = String(r.slug || "");
            const title = String(r.title || slug);
            const tagline = String(r.tagline || "").trim();
            return `<li><a href="${lpath(locale, `/protocols/${esc(slug)}`)}">${esc(clip(title, 140))}</a>${tagline ? `<p>${esc(clip(tagline, 240))}</p>` : ""}</li>`;
          })
          .join("");
        recentList = `<section><h2>${esc(page.heading)}</h2><ul>${items}</ul></section>`;
      }
    } catch { /* ignore */ }
  } else if (key === "home" && SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/articles?is_published=eq.true&select=slug,title,dek&order=published_at.desc&limit=1`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Accept: "application/json",
          },
        },
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<Record<string, unknown>>;
        const a = rows[0];
        if (a && a.slug && a.title) {
          const slug = String(a.slug);
          const title = String(a.title);
          const dek = String(a.dek || "");
          recentList = `<section><h2>${hubLabel("home-latest", locale)}</h2><p><a href="/articles/${esc(slug)}">${esc(title)}</a>. ${esc(clip(dek, 240))}</p><p><a href="/articles">${hubLabel("home-read-all", locale)}</a></p></section>`;
        }
      }
    } catch { /* ignore */ }
    recentList = (await liveCountsHtml()) + recentList;
  } else if (key === "null-reports" && SUPABASE_URL && SUPABASE_KEY) {
    recentList = await liveCountsHtml();
  } else if (page.index && SUPABASE_URL && SUPABASE_KEY) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${page.index.table}?${page.index.filter}&select=${page.index.select}&order=created_at.desc&limit=8`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const rows = (await res.json()) as Array<Record<string, unknown>>;
        if (rows.length) {
          const items = rows
            .map((r) => {
              const t = String(r[page.index!.titleField] ?? "").trim() || String(r.id).slice(0, 8);
              return `<li><a href="${page.index!.linkPrefix}/${esc(r.id)}">${esc(clip(t, 120))}</a></li>`;
            })
            .join("");
          recentList = `<section><h2>${esc(page.index.label)}</h2><ul>${items}</ul></section>`;
        }
      }
    } catch { /* ignore */ }
  }
  if (page.index2 && SUPABASE_URL && SUPABASE_KEY) {
    try {
      const rows = await sbGetRows(page.index2.table, `${page.index2.filter}&select=${page.index2.select}&order=created_at.desc&limit=12`);
      if (rows.length) {
        const items = rows.map((r) => {
          const t = String(r[page.index2!.titleField] ?? "").trim() || String(r.id).slice(0, 8);
          const extra = page.index2!.extraField && r[page.index2!.extraField] ? ` (${esc(trialTypeLabel(r[page.index2!.extraField]))})` : "";
          return `<li><a href="${page.index2!.linkPrefix}/${esc(r.id)}">${esc(clip(t, 120))}</a>${extra}</li>`;
        }).join("");
        recentList += `<section><h2>${esc(page.index2.label)}</h2><ul>${items}</ul></section>`;
      }
    } catch { /* ignore */ }
  }

  const linksBlock = page.links && page.links.length
    ? `<section><h2>${hubLabel("related", locale)}</h2><ul>${page.links
        .map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`)
        .join("")}</ul></section>`
    : "";

  // The English source region for this page, byte for byte what the
  // translation pipeline extracts from between the tsrc markers below and
  // hashes into content_translations.source_hash. Built once, used both for
  // the hash and for the rendered fallback, so the value the gate tests and
  // the value the page serves can never drift apart.
  const enSource = [
    `<h1>${esc(page.heading)}</h1>`,
    ...page.paragraphs.map((p) => `<p>${esc(p)}</p>`),
  ].join("\n  ");

  const trs = await getTranslations(
    "static",
    key,
    locale,
    HASH_GATED_STATIC_PAGES.has(key) ? { body_html: md5Hex(enSource) } : undefined,
    HASH_GATED_STATIC_PAGES.has(key) ? FORBIDDEN_IN_TRANSLATION : undefined,
  );

  // Structured data on /protocol-guide is locale aware: the FAQ entities and
  // the HowTo steps come from content_translations, English is the fallback,
  // and every identifier points at the locale URL.
  if (key === "protocol-guide") {
    extraLd.length = 0;
    extraLd.push(...localizedProtocolGuideLd(locale, trs));
  }

  // The extra body block is translated the same way body_html is; the English
  // constant is used whenever the row is missing.
  const bodyExtra = (trs.body_extra_html && trs.body_extra_html.trim())
    ? trs.body_extra_html
    : (page.bodyExtraHtml ?? "");

  const attribution = key === "home" || key === "protocol-guide" || key === "about"
    ? await golerAttribution(locale)
    : "";

  const body = trs.body_html && trs.body_html.trim()
    ? `<article data-prerender="${esc(key)}">${trs.body_html}${bodyExtra}${recentList}${attribution}</article>`
    : `<article data-prerender="${esc(key)}">
  <!--tsrc:static:${key}-->
  ${enSource}
  <!--/tsrc-->
  ${bodyExtra}
  ${recentList}
  ${linksBlock}
  ${attribution}
</article>`;


  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}#website`,
    url: SITE,
    name: "DMT Code",
    publisher: { "@id": `${SITE}#org` },
  };
  const breadcrumbLd = key === "home"
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: page.breadcrumbName, item: canonical },
        ],
      };

  const staticCopy = uiCopy(key, locale);
  const head = buildHead({
    locale,
    title: staticCopy.title || page.title,
    description: staticCopy.description || page.description,
    canonical,
    ogType: "website",
    robots: page.robots,
    jsonLd: [organizationLd, websiteLd, breadcrumbLd, ...extraLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

// This in-source path list is authoritative for this function. netlify.toml
// declares the same paths, and BOTH must be kept in sync: adding a route to
// netlify.toml alone does NOT reach this function, the request falls through
// to the SPA shell and silently soft-404s. Any new prerendered route must be
// added here AND in netlify.toml.
export const config: Config = {
  path: [
    "/",
    "/registry",
    "/registry/*",
    "/trials",
    "/trials/*",
    "/bibliography",
    "/bibliography/*",
    "/dataset",
    "/about",
    "/critiques",
    "/the-discovery",
    "/null-reports",
    "/glossary",
    "/methods",
    "/open-questions",
    "/object-model",
    "/research",
    "/protocols",
    "/forecasts",
    "/protocol-guide",
    "/prepare",
    "/evidence-map",
    "/timeline",
    "/timeline/*",
    "/faq",
    "/people",
    "/people/*",
    "/products/*",
    "/events",
    "/events/*",
    "/retreats",
    "/retreats/*",
    "/theories",
    "/theories/*",
    "/protocols/*",
    "/articles",
    "/articles/*",
    "/guides",
    "/guides/*",
    "/privacy",
    "/terms",
    "/disclosure",
    "/shipping",
    "/returns",
    "/store-terms",
    "/store-contact",
    "/capture",
    "/co-witnesses",
    "/join",
    "/preregister",
    "/submit-symbol",
    // Locale mirrors. Netlify honours this in-file config over netlify.toml,
    // so the /es and /de trees must be listed here or the function never runs
    // for them. Additive only: English entries above are unchanged.
    "/es",
    "/es/*",
    "/de",
    "/de/*",
  ],
};







// ---------- Theories, Events, Retreats prerender ----------

type HeadOpts = {
  title: string;
  description?: string;
  canonical: string;
  // Locale-agnostic path (e.g. "/faq"). When present (or derivable from
  // `canonical`), the canonical URL is rewritten for the active locale and the
  // full hreflang alternate set is emitted. Never set for machine endpoints or
  // /agent, which are English-only infrastructure.
  canonicalPath?: string;
  locale?: Loc;
  ogType?: "website" | "article";
  ogImage?: string;
  // Width and height are emitted only when BOTH are known. Never guess them.
  ogImageWidth?: number;
  ogImageHeight?: number;
  robots?: string;
  jsonLd?: unknown[];
};

function buildHead(o: HeadOpts): string {
  const desc = (o.description || "").trim();
  const img = (o.ogImage || "").trim() || DEFAULT_OG_IMAGE;
  const locale: Loc = o.locale || "en";
  // Derive the locale-agnostic path when the caller passed a full canonical URL
  // on this site and no explicit canonicalPath.
  let path = o.canonicalPath || "";
  if (!path && o.canonical && o.canonical.startsWith(SITE)) {
    const p = o.canonical.slice(SITE.length) || "/";
    const m = p.match(/^\/(es|de)(\/.*)?$/);
    path = m ? (m[2] || "/") : p;
  }
  // /agent is English-only infrastructure: no locale mirrors, no alternates.
  const localizable = !!path && !path.startsWith("/agent");
  const canonical = localizable
    ? `${SITE}${locale !== "en" ? "/" + locale : ""}${path === "/" ? "/" : path}`
    : o.canonical;
  const alternates = localizable
    ? [
        `<link rel="alternate" hreflang="en" href="${esc(SITE + path)}" />`,
        // Locale roots keep the trailing slash so the alternate matches the
        // canonical and the sitemap exactly: https://dmtcode.com/es/
        `<link rel="alternate" hreflang="es" href="${esc(SITE + "/es" + (path === "/" ? "/" : path))}" />`,
        `<link rel="alternate" hreflang="de" href="${esc(SITE + "/de" + (path === "/" ? "/" : path))}" />`,
        `<link rel="alternate" hreflang="x-default" href="${esc(SITE + path)}" />`,
      ]
    : [];
  const dims =
    o.ogImageWidth && o.ogImageHeight
      ? [
          `<meta property="og:image:width" content="${o.ogImageWidth}" />`,
          `<meta property="og:image:height" content="${o.ogImageHeight}" />`,
        ]
      : [];
  return [
    `<title>${esc(o.title)}</title>`,
    desc ? `<meta name="description" content="${esc(desc)}" />` : "",
    `<link rel="canonical" href="${esc(canonical)}" />`,
    ...alternates,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:type" content="${o.ogType || "website"}" />`,
    `<meta property="og:title" content="${esc(o.title)}" />`,
    desc ? `<meta property="og:description" content="${esc(desc)}" />` : "",
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    ...dims,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(o.title)}" />`,
    desc ? `<meta name="twitter:description" content="${esc(desc)}" />` : "",
    `<meta name="twitter:image" content="${esc(img)}" />`,
    `<meta name="robots" content="${esc(o.robots || "index, follow")}" />`,
    ...(o.jsonLd || [])
      .filter(Boolean)
      .map((ld) => `<script type="application/ld+json">${jsonLd(ld)}</script>`),
  ]
    .filter(Boolean)
    .join("\n");
}

function renderShell(
  html: string,
  head: string,
  body: string,
  locale: Loc = "en",
): string {
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+property=["']og:[a-z:]+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']twitter:[a-z:]+["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']robots["'][^>]*>\s*/gi, "");
  out = out.replace(/<html([^>]*)>/i, (_m, attrs: string) => {
    const cleaned = String(attrs).replace(/\s+lang=["'][^"']*["']/gi, "");
    return `<html lang="${locale || "en"}"${cleaned}>`;
  });
  out = out.replace(/<\/head>/i, `${head}\n</head>`);
  if (/<div id="root">\s*<\/div>/i.test(out)) {
    out = out.replace(/<div id="root">\s*<\/div>/i, `<div id="root">${body}</div>`);
  } else {
    out = out.replace(/<\/body>/i, `<noscript>${body}</noscript>\n</body>`);
  }
  return out;
}


const PRERENDER_RESP_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "public, max-age=0, must-revalidate",
  "netlify-cdn-cache-control":
    "public, s-maxage=3600, stale-while-revalidate=86400, durable",
};

type NotFoundOpts = {
  title?: string;
  heading?: string;
  text?: string;
  canonical?: string;
  backHref?: string;
  backLabel?: string;
  marker?: string;
  /** HTTP status. Defaults to 404. Pass 410 for content that was published and
   *  has since been withdrawn, so search engines drop it instead of retrying. */
  status?: number;
};

// Articles that were published at these slugs and have since been withdrawn.
// They answer 410 Gone instead of 404 so search engines drop them rather than
// retrying for months. Generated from:
//   select slug from articles where archived_at is not null or is_published = false;
// Verified against the database by scripts/check-withdrawn-articles-drift.mjs.
// Last synced 2026-08-27.
const WITHDRAWN_ARTICLE_SLUGS = new Set<string>([
  "does-dmt-model-the-near-death-experience",
  "extra-long-dmt-trips-could-help-researchers-study-entity-encounters",
  "from-sonora-to-big-pharma-kimon-de-greef-traces-the-strange-rise-of-5-meo-dmt",
  "he-tried-lsd-on-a-bike-ride-then-his-neighbor-became-a-witch",
  "intranasal-5-meo-dmt-effects-peak-within-15-minutes-and-lack-strong-visuals-study-finds",
  "maps-responds-to-report-of-progress-for-mdma-assisted-therapy-for-ptsd-with-fda",
  "michael-pollan-on-psilocybin-i-felt-as-if-the-flowers-were-returning-my-gaze",
  "phoenixs-barrow-neuro-gets-5m-to-test-psychedelic-ibogaine-on-brain-injuries",
  "psychedelics-amplify-brain-connectivity-through-serotonin-receptors-study-suggests",
  "smooth-sailing-definiums-lsd-voyage-hits-primary-and-key-secondary-endpoints-in-gad",
]);

// Shared not-found prerender. Returns HTTP 404 (or the status in opts) with a
// noindex head so unknown detail records stop being indexed as soft 404s.
function notFound404(shellHtml: string, o: NotFoundOpts = {}): Response {
  const head = buildHead({
    title: o.title || "Not found | DMT Code",
    canonical: o.canonical || `${SITE}/`,
    robots: "noindex, follow",
  });
  const backHref = o.backHref || `${SITE}/`;
  const backLabel = o.backLabel || "DMT Code homepage";
  const body = `<article data-prerender="${esc(o.marker || "not-found")}">
  <h1>${esc(o.heading || "Not found")}</h1>
  <p>${esc(o.text || "This record is not currently indexed or the link is out of date.")}</p>
  <p><a href="${esc(backHref)}">${esc(backLabel)}</a></p>
</article>`;
  return new Response(renderShell(shellHtml, head, body), {
    status: o.status ?? 404,
    headers: PRERENDER_RESP_HEADERS,
  });
}

async function notFoundPrerender(
  context: Context,
  o: NotFoundOpts = {},
): Promise<Response> {
  const shellRes = await context.next();
  return notFound404(await shellRes.text(), o);
}



// ---- Repair Build 5 helpers: typed trial records, event verification, live counts ----
const TRIAL_TYPE_LABELS: Record<string, string> = {
  registered_clinical_trial: "Registered clinical trial",
  registered_trial: "Registered clinical trial",
  registered_observational_study: "Registered observational study",
  academic_experiment: "Academic experiment",
  published_pilot_report: "Published pilot report",
  community_experiment: "Community experiment",
  citizen_science_project: "Citizen science project",
  reported_replication: "Reported replication",
  platform_project: "Platform project",
  media_claim: "Media claim",
  rumored_report: "Rumoured report",
  retreat_or_facilitated_session: "Retreat or facilitated session",
  internal_session: "Community record",
};
function trialTypeLabel(v: unknown): string {
  const k = String(v ?? "").trim();
  return TRIAL_TYPE_LABELS[k] ?? (k ? k.replace(/_/g, " ") : "Untyped record");
}
function isRegisteredTrialType(v: unknown): boolean {
  return v === "registered_clinical_trial" || v === "registered_trial";
}
const EV_VER_LABELS: Record<string, string> = {
  verified: "Verified",
  organizer_confirmed: "Organizer confirmed",
  public_source_confirmed: "Public source confirmed",
  auto_discovered_candidate: "Auto-discovered candidate, not yet verified",
  unverified: "Unverified",
  cancelled: "Cancelled",
  past_outcome_unknown: "Past, outcome unknown",
};
function evVerLabel(v: string): string { return EV_VER_LABELS[v] ?? v.replace(/_/g, " "); }
function stripAuto(s: string): string { return s.replace(/^\s*\[Auto-discovered\]\s*/i, ""); }

async function sbCount(table: string, query: string): Promise<number | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id${query ? "&" + query : ""}`, {
      method: "HEAD",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "count=exact", Range: "0-0" },
    });
    if (!res.ok) return null;
    const m = (res.headers.get("content-range") || "").match(/\/(\d+)$/);
    return m ? Number(m[1]) : null;
  } catch { return null; }
}

// Live counts for crawler bodies. A count that cannot be fetched is omitted,
// never rendered as zero. Definitions match CommunityStats.tsx and /data.json.
async function liveCountsHtml(): Promise<string> {
  const [community, glyphs, nulls, sober, recog] = await Promise.all([
    sbCount("symbol_submissions", "status=eq.approved&is_curated_example=eq.false"),
    // Same predicate as the registry_glyphs feed in data-json.ts: a row with no image is not a report.
    sbCount("registry_glyphs", "image_data=not.is.null&image_data=neq."),
    sbCount("symbol_submissions", "status=eq.approved&tags=ov.{null-report,null_report,nothing-seen,no-forms}"),
    sbCount("symbol_submissions", "status=eq.approved&is_sober_baseline=eq.true"),
    sbCount("symbol_votes", "vote_type=eq.seen_it"),
  ]);
  const rows: Array<[string, number | null, string]> = [
    ["Published community symbol submissions", community, "account backed, published immediately, curated examples excluded"],
    ["Anonymous drawn glyph reports", glyphs, "quick capture with no account, a separate table, never summed with the line above"],
    ["Null reports", nulls, "ran the observation and saw nothing structured, or nothing that matched"],
    ["Sober baseline records", sober, "same apparatus, no substance"],
    ["Recognition responses", recog, "readers saying a published form echoed their memory after seeing it here, not independent matches"],
  ];
  const lis = rows.filter(([, n]) => typeof n === "number").map(([l, n, note]) => `<li>${esc(l)}: <strong>${n}</strong> (${esc(note)})</li>`).join("");
  if (!lis) return "";
  // A total on its own reads as "this many laser observations", which is not what
  // the registry holds. Most records do not declare the method, and the field that
  // records whether the observer had already seen the catalogue was only added on
  // 2026-08-26, so for older records it is unknown rather than negative. Saying so
  // beside the counts is the difference between a corpus and a claim.
  const laser = await sbCount("symbol_submissions", "status=eq.approved&source_method=eq.laser_650nm");
  const naive = await sbCount("registry_glyphs", "prior_exposure=is.false");
  const composition = typeof laser === "number"
    ? `<p data-prerender="composition">Of the published symbol submissions, <strong>${laser}</strong> declare the 650 nm laser protocol as their method. The rest are accounts of a DMT experience that do not state a method, and they are not evidence about the laser specifically.${typeof naive === "number" ? ` Prior exposure to the catalogue is recorded on the anonymous glyph reports, <strong>${naive}</strong> of which state the observer had not seen it before; the submission form only began asking on 26 August 2026, so for earlier records it is unknown rather than no.` : ""} The full breakdown is published as corpus_composition in <a href="/data.json">/data.json</a>.</p>`
    : "";
  return `<section data-prerender="live-counts"><h2>Live counts</h2><p>Counted from the database when this page was generated, ${new Date().toISOString().slice(0, 10)}. A count that could not be fetched is omitted, never shown as zero. The same numbers are published under counts in <a href="/data.json">/data.json</a>.</p><ul>${lis}</ul>${composition}</section>`;
}

async function sbGetRows(
  table: string,
  query: string,
): Promise<Array<Record<string, unknown>>> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `sbGetRows failed: table=${table} status=${res.status} body=${body}`,
    );
    return [];
  }
  return (await res.json()) as Array<Record<string, unknown>>;
}

function originLabel(origin: unknown, locale: Loc = "en"): string {
  const s = String(origin || "").toLowerCase();
  if (s === "curated" || s === "public_record" || s === "record") {
    return hubLabel("origin-record", locale);
  }
  if (s === "community") return hubLabel("origin-community", locale);
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : hubLabel("origin-community", locale);
}

function paragraphsFromText(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("");
}

async function renderTheories(context: Context, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/theories`;
  const theoriesCopy = uiCopy("theories", locale);
  const title = theoriesCopy.title;
  const metaDesc = clip(theoriesCopy.description, 200);

  const rows = await sbGetRows(
    "theories",
    "is_approved=eq.true&select=id,title,summary,content,proponent,source_title,source_url,source_type,origin,tags,upvotes,created_at&order=upvotes.desc",
  );

  const slugs = rows.map((r) => theorySlug(String(r.title || "")));
  const trMap = await getTranslationsBulk("theories", locale);
  for (const r of rows) {
    const t = trMap[String(r.id)];
    if (t) overlay(r as Record<string, unknown>, t, ["title", "summary", "content"]);
  }


  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}#website`,
    url: SITE,
    name: "DMT Code",
    publisher: { "@id": `${SITE}#org` },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Theories", item: canonical },
    ],
  };
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${canonical}#list`,
    name: "Open theories on the DMT code",
    itemListElement: rows.map((r, i) => {
      const item: Record<string, unknown> = {
        "@type": "CreativeWork",
        name: r.title,
        url: `${SITE}/theories/${slugs[i]}`,
        text: r.summary || "",
      };

      if (r.proponent) {
        item.author = { "@type": "Person", name: String(r.proponent) };
      }
      return { "@type": "ListItem", position: i + 1, item };
    }),
    license: LICENSE,
  };

  const theoryBlocks = rows
    .map((r, ri) => {
      const tags = Array.isArray(r.tags) ? (r.tags as string[]).filter(Boolean) : [];
      const summaryHtml = r.summary
        ? paragraphsFromText(String(r.summary))
        : "";
      const contentHtml = r.content
        ? `<section><h3>${hubLabel("full-argument", locale)}</h3>${paragraphsFromText(String(r.content))}</section>`
        : "";
      const proponentLine = r.proponent
        ? `<p><strong>${hubLabel("proponent", locale)}</strong> ${esc(String(r.proponent))}</p>`
        : "";
      const sourceLine = r.source_url
        ? `<p><strong>${hubLabel("source", locale)}</strong> <a href="${esc(String(r.source_url))}" rel="noopener">${esc(String(r.source_title || r.source_url))}</a>${r.source_type ? ` (${esc(String(r.source_type))})` : ""}</p>`
        : (r.source_title ? `<p><strong>${hubLabel("source", locale)}</strong> ${esc(String(r.source_title))}${r.source_type ? ` (${esc(String(r.source_type))})` : ""}</p>` : "");
      const tagBlock = tags.length
        ? `<p><strong>${hubLabel("tags", locale)}</strong> ${tags.map((t) => esc(t)).join(", ")}</p>`
        : "";
      return `<article>
  <h2><a href="${lpath(locale, `/theories/${esc(slugs[ri])}`)}">${esc(String(r.title || "Untitled theory"))}</a></h2>
  <p><em>${esc(originLabel(r.origin, locale))}</em></p>
  ${proponentLine}
  ${summaryHtml}
  ${contentHtml}
  ${sourceLine}
  ${tagBlock}
</article>`;
    })
    .join("\n");

  const body = `<article data-prerender="theories">
  <h1>${hubLabel("theories-h1", locale)}</h1>
  <section>
    <p>${hubLabel("theories-p1", locale)}</p>
    <p>${hubLabel("theories-p2", locale)}</p>
  </section>
  <section>
    <h2>${hubLabel("theories-h2", locale)}</h2>
    ${theoryBlocks || `<p>${hubLabel("theories-empty", locale)}</p>`}
  </section>
  <section>
    <h2>${hubLabel("related", locale)}</h2>
    <ul>
      <li><a href="${SITE}/registry">${hubLabel("link-registry", locale)}</a></li>
      <li><a href="${SITE}/bibliography">${hubLabel("link-bibliography", locale)}</a></li>
      <li><a href="${SITE}/evidence-map">${hubLabel("link-evidence-map", locale)}</a></li>
      <li><a href="${SITE}/data.json">${hubLabel("link-corpus", locale)}</a></li>
    </ul>
  </section>
</article>`;

  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "website",
    jsonLd: [organizationLd, websiteLd, breadcrumbLd, itemListLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

async function renderTagHub(context: Context, tag: string, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/registry/tag/${encodeURIComponent(tag)}`;

  const byTagColumn = await sbGetRows(
    "symbol_submissions",
    `status=eq.approved&tags=cs.${encodeURIComponent(`{"${tag}"}`)}&select=id,description,tags,created_at`,
  );
  const communityRows = await sbGetRows(
    "symbol_tags",
    `tag_name=eq.${encodeURIComponent(tag)}&select=symbol_id`,
  );
  const extraIds = communityRows
    .map((r) => String(r.symbol_id ?? ""))
    .filter((sid) => sid && !byTagColumn.some((r) => String(r.id) === sid));
  const extraRows = extraIds.length
    ? await sbGetRows(
        "symbol_submissions",
        `status=eq.approved&id=in.(${extraIds.join(",")})&select=id,description,tags,created_at`,
      )
    : [];

  const seen = new Set<string>();
  const rows = [...byTagColumn, ...extraRows].filter((r) => {
    const rid = String(r.id);
    if (seen.has(rid)) return false;
    seen.add(rid);
    return true;
  });

  const count = rows.length;

  if (count === 0) {
    return notFound404(await shellRes.text(), {
      title: "Tag not found | DMT Code",
      heading: "Tag not found",
      text: "No symbol in the registry carries this tag. Browse the registry index or the tag hubs linked from symbol pages.",
      canonical: `${SITE}/registry`,
      backHref: `${SITE}/registry`,
      backLabel: "Visual symbol registry",
      marker: "tag-hub-not-found",
    });
  }

  const title = `Symbols tagged ${tag} - DMT Code Registry`;
  const metaDesc = clip(
    `Visual symbols in the DMT Code open registry tagged "${tag}". ${count} records with community recognition counts.`,
    160,
  );

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Symbols tagged ${tag}`,
    url: canonical,
    isPartOf: { "@id": `${SITE}/registry#dataset` },
    about: tag,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Registry", item: `${SITE}/registry` },
      { "@type": "ListItem", position: 3, name: tag, item: canonical },
    ],
  };

  const items = rows
    .map((r) => {
      const rid = String(r.id);
      const label = String(r.description || "").trim()
        ? clip(String(r.description), 80)
        : `Symbol ${rid.slice(0, 8)}`;
      return `<li><a href="${SITE}/registry/${esc(rid)}">${esc(label)}</a></li>`;
    })
    .join("");

  const body = `<article data-prerender="tag-hub"><h1>Symbols tagged ${esc(tag)}</h1><p>${count} records in the open registry carry this tag.</p><p>Tags are added by submitters and by readers after publication. A shared tag is a starting point for comparison, not evidence of a shared source.</p><ul>${items}</ul></article>`;

  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "website",
    robots: count < 2 ? "noindex, follow" : "index, follow",
    jsonLd: [collectionLd, breadcrumbLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}



async function renderEventDetail(context: Context, id: string, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const rows = await sbGetRows(
    "events",
    `id=eq.${id}&is_approved=is.true&select=id,title,description,details,event_date,end_date,event_type,location,organizer,url`,
  );
  const r = rows[0];
  if (!r) return notFound404(await shellRes.text(), { title: "Event not found | DMT Code", heading: "Event not found", text: "This event is not currently indexed or the link is out of date.", canonical: `${SITE}/events`, backHref: `${SITE}/events`, backLabel: "Events timeline", marker: "event-not-found" });

  overlay(r, await getTranslations("events", id, locale));

  const canonical = `${SITE}/events/${id}`;
  const shortDesc = String(r.description || "").trim();
  const detailsText = String(r.details || r.description || "").trim();
  const title = `${String(r.title)} | DMT Code Events`;
  const metaDesc = clip(shortDesc || `${String(r.title)} listed on the DMT Code events timeline.`, 160);

  const readableDate = r.event_date
    ? new Date(String(r.event_date)).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "";

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Events", item: `${SITE}/events` },
      { "@type": "ListItem", position: 3, name: String(r.title), item: canonical },
    ],
  };
  const eventLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": String(r.event_type || "").toLowerCase() === "festival" ? "Festival" : "Event",
    "@id": canonical,
    name: r.title,
    startDate: r.event_date,
    description: shortDesc || undefined,
    url: r.url || canonical,
  };
  if (r.end_date) {
    eventLd.endDate = String(r.end_date);
  }
  if (r.location) {
    eventLd.location = { "@type": "Place", name: String(r.location) };
  }
  if (r.organizer) {
    eventLd.organizer = {
      "@type": "Organization",
      name: String(r.organizer),
      ...(r.url ? { url: String(r.url) } : {}),
    };
  }
  if (String(r.event_date) >= new Date().toISOString().slice(0, 10)) {
    eventLd.eventStatus = "https://schema.org/EventScheduled";
  }



  const body = `<article data-prerender="event">
  <h1>${esc(String(r.title))}</h1>
  <p><strong>${esc(readableDate)}</strong>${r.event_type ? ` &middot; ${esc(String(r.event_type))}` : ""}</p>
  ${r.location ? `<p>Location: ${esc(String(r.location))}</p>` : ""}
  ${r.organizer ? `<p>Organizer: ${esc(String(r.organizer))}</p>` : ""}
  ${detailsText ? paragraphsFromText(detailsText) : "<p>No further details provided.</p>"}
  ${r.url ? `<p><a href="${esc(String(r.url))}" rel="noopener">Official site</a></p>` : ""}
  <p><a href="${SITE}/events">Back to the events timeline</a></p>
</article>`;

  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "article",
    jsonLd: [organizationLd, breadcrumbLd, eventLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

async function renderRetreatDetail(context: Context, id: string, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const rows = await sbGetRows(
    "retreats",
    `id=eq.${id}&is_approved=is.true&select=id,name,description,details,location,country,image_url,website_url,contact_email,tags`,
  );
  const r = rows[0];
  if (!r) return notFound404(await shellRes.text(), { title: "Retreat not found | DMT Code", heading: "Retreat not found", text: "This retreat is not currently indexed or the link is out of date.", canonical: `${SITE}/retreats`, backHref: `${SITE}/retreats`, backLabel: "Retreats", marker: "retreat-not-found" });

  overlay(r, await getTranslations("retreats", id, locale));

  const canonical = `${SITE}/retreats/${id}`;
  const shortDesc = String(r.description || "").trim();
  const detailsText = String(r.details || r.description || "").trim();
  const title = `${String(r.name)} | DMT Code Retreats`;
  const metaDesc = clip(shortDesc || `${String(r.name)} listed on the DMT Code retreats index.`, 160);
  const tags = Array.isArray(r.tags) ? (r.tags as string[]).filter(Boolean) : [];
  const locationLine = [r.location, r.country].filter(Boolean).map(String).join(", ");

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Retreat centers", item: `${SITE}/retreats` },
      { "@type": "ListItem", position: 3, name: String(r.name), item: canonical },
    ],
  };
  const lodgingLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": canonical,
    name: r.name,
    description: shortDesc || undefined,
    url: r.website_url || canonical,
    address: {
      "@type": "PostalAddress",
      addressLocality: r.location ? String(r.location) : undefined,
      addressCountry: r.country ? String(r.country) : undefined,
    },
  };
  if (r.image_url) lodgingLd.image = String(r.image_url);
  if (r.contact_email) lodgingLd.email = String(r.contact_email);
  if (tags.length) lodgingLd.keywords = tags;

  const body = `<article data-prerender="retreat">
  <h1>${esc(String(r.name))}</h1>
  ${locationLine ? `<p>Location: ${esc(locationLine)}</p>` : ""}
  ${tags.length ? `<p>Tags: ${tags.map((t) => esc(t)).join(", ")}</p>` : ""}
  ${r.image_url ? `<img src="${esc(String(r.image_url))}" alt="${esc(String(r.name))} retreat center" />` : ""}
  ${detailsText ? paragraphsFromText(detailsText) : "<p>No further details provided.</p>"}
  ${r.website_url ? `<p><a href="${esc(String(r.website_url))}" rel="noopener">Visit website</a></p>` : ""}
  ${r.contact_email ? `<p>Contact: <a href="mailto:${esc(String(r.contact_email))}">${esc(String(r.contact_email))}</a></p>` : ""}
  <p><a href="${SITE}/retreats">Back to retreat centers</a></p>
</article>`;

  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "article",
    ogImage: r.image_url ? String(r.image_url) : undefined,
    jsonLd: [organizationLd, breadcrumbLd, lodgingLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

async function renderRetreats(context: Context, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/retreats`;
  const retreatsCopy = uiCopy("retreats", locale);
  const title = retreatsCopy.title;
  const metaDesc = retreatsCopy.description;

  const rows = await sbGetRows(
    "retreats",
    "is_approved=is.true&select=id,name,description,details,location,country,image_url,website_url,contact_email,tags&order=name.asc",
  );

  const trMap = await getTranslationsBulk("retreats", locale);
  for (const r of rows) {
    const t = trMap[String(r.id)];
    if (t) overlay(r as Record<string, unknown>, t, ["description", "details"]);
  }


  const paraProtocol = hubLabel("retreats-protocol", locale);
  const para1 = hubLabel("retreats-p1", locale);
  const para2 = hubLabel("retreats-p2", locale);

  const blocks = rows
    .map((r) => {
      const name = String(r.name || "").trim();
      const id = String(r.id || "");
      const loc = [r.location, r.country].filter(Boolean).map(String).join(", ");
      const description = String(r.description || "").trim();
      const details = String(r.details || "").trim();
      const website = r.website_url ? String(r.website_url) : "";
      return `<article>
  <h2><a href="${SITE}/retreats/${esc(id)}">${esc(name)}</a></h2>
  ${loc ? `<p>${esc(loc)}</p>` : ""}
  ${description ? `<p>${esc(description)}</p>` : ""}
  ${details ? paragraphsFromText(details) : ""}
  ${website ? `<p><a href="${esc(website)}" rel="noopener">${esc(website)}</a></p>` : ""}
</article>`;
    })
    .join("\n");

  const body = `<article data-prerender="retreats">
  <h1>${hubLabel("retreats-h1", locale)}</h1>
  <section>
    <p>${esc(paraProtocol)}</p>
    <p>${esc(para1)}</p>
    <p>${esc(para2)}</p>
  </section>
  ${rows.length ? `<section><h2>${hubLabel("retreats-centers", locale)}</h2>${blocks}</section>` : ""}
</article>`;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Retreat centers", item: canonical },
    ],
  };

  const jsonLdArr: unknown[] = [breadcrumbLd];
  if (rows.length) {
    const itemListLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${canonical}#list`,
      name: "Retreat centers",
      numberOfItems: rows.length,
      itemListElement: rows.map((r, i) => {
        const detailUrl = `${SITE}/retreats/${String(r.id)}`;
        const tags = Array.isArray(r.tags) ? (r.tags as string[]).filter(Boolean) : [];
        const item: Record<string, unknown> = {
          "@type": "LodgingBusiness",
          "@id": detailUrl,
          name: r.name,
          url: r.website_url || detailUrl,
          address: {
            "@type": "PostalAddress",
            ...(r.location ? { addressLocality: String(r.location) } : {}),
            ...(r.country ? { addressCountry: String(r.country) } : {}),
          },
        };
        if (r.description) item.description = String(r.description);
        if (r.image_url) item.image = String(r.image_url);
        if (r.contact_email) item.email = String(r.contact_email);
        if (tags.length) item.keywords = tags;
        return { "@type": "ListItem", position: i + 1, item };
      }),
    };
    jsonLdArr.push(itemListLd);
  }

  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "website",
    jsonLd: jsonLdArr,
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

// ---------- Protocol detail prerender ----------

function humanizeKey(key: string): string {
  const s = key.replace(/[_-]+/g, " ").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function renderJsonNode(node: unknown, depth: number): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string") {
    const t = node.trim();
    return t ? `<p>${esc(t)}</p>` : "";
  }
  if (typeof node === "number" || typeof node === "boolean") {
    return `<p>${esc(String(node))}</p>`;
  }
  if (Array.isArray(node)) {
    if (!node.length) return "";
    const allPrim = node.every(
      (v) => v === null || ["string", "number", "boolean"].includes(typeof v),
    );
    if (allPrim) {
      return `<ul>${node
        .map((v) => `<li>${esc(String(v ?? "")).trim()}</li>`)
        .filter((li) => li !== "<li></li>")
        .join("")}</ul>`;
    }
    return node.map((v) => renderJsonNode(v, depth)).join("");
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const entries = Object.entries(obj).filter(
      ([, v]) => v !== null && v !== undefined && !(typeof v === "string" && v.trim() === ""),
    );
    if (!entries.length) return "";
    const hTag = `h${Math.min(6, Math.max(3, depth + 2))}`;
    return entries
      .map(([k, v]) => {
        const label = humanizeKey(k);
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          return `<p><strong>${esc(label)}:</strong> ${esc(String(v))}</p>`;
        }
        return `<section><${hTag}>${esc(label)}</${hTag}>${renderJsonNode(v, depth + 1)}</section>`;
      })
      .join("");
  }
  return "";
}

async function renderProtocolDetail(context: Context, slug: string, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!cleanSlug) return notFound404(await shellRes.text(), { title: "Protocol not found | DMT Code", heading: "Protocol not found", text: "This protocol is not currently indexed or the link is out of date.", canonical: `${SITE}/protocols`, backHref: `${SITE}/protocols`, backLabel: "Protocols", marker: "protocol-not-found" });

  const rows = await sbGetRows(
    "protocols",
    `slug=eq.${cleanSlug}&is_published=is.true&select=slug,title,compound,status,tagline,content_jsonb,updated_at`,
  );
  const r = rows[0];
  if (!r) return notFound404(await shellRes.text(), { title: "Protocol not found | DMT Code", heading: "Protocol not found", text: "This protocol is not currently indexed or the link is out of date.", canonical: `${SITE}/protocols`, backHref: `${SITE}/protocols`, backLabel: "Protocols", marker: "protocol-not-found" });

  overlay(r, await getTranslations("protocols", String(r.slug ?? cleanSlug), locale));

  const canonical = `${SITE}/protocols/${cleanSlug}`;
  const title = `${String(r.title)} protocol | DMT Code`;
  const tagline = String(r.tagline || "").trim();
  const metaDesc = clip(
    tagline || `${String(r.title)} protocol documentation indexed by DMT Code. Reference material, not medical advice.`,
    160,
  );

  const contentHtml = r.content_jsonb ? renderJsonNode(r.content_jsonb, 0) : "";

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Protocols", item: `${SITE}/protocols` },
      { "@type": "ListItem", position: 3, name: String(r.title), item: canonical },
    ],
  };
  const medicalLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "@id": canonical,
    name: String(r.title),
    url: canonical,
    description: metaDesc,
    about: r.compound ? { "@type": "Drug", name: String(r.compound) } : undefined,
    dateModified: r.updated_at ? String(r.updated_at) : undefined,
    inLanguage: "en",
    isPartOf: { "@id": `${SITE}#website` },
    publisher: { "@id": `${SITE}#org` },
    license: LICENSE,
  };

  const body = `<article data-prerender="protocol">
  <h1>${esc(String(r.title))} protocol</h1>
  ${r.compound ? `<p><strong>Compound:</strong> ${esc(String(r.compound))}</p>` : ""}
  ${r.status ? `<p><strong>Status:</strong> ${esc(String(r.status))}</p>` : ""}
  ${tagline ? `<p>${esc(tagline)}</p>` : ""}
  ${contentHtml || "<p>Protocol documentation is being prepared.</p>"}
  <p><em>Reference material only. Nothing on this page is medical advice or a personal recommendation.</em></p>
  <p>Adults 18 and older only.</p>

  ${await golerAttribution(locale)}
  <p><a href="${SITE}/protocols">Back to the protocol catalogue</a></p>
</article>`;

  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "article",
    jsonLd: [organizationLd, breadcrumbLd, medicalLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

// This function is duplicated verbatim in src/lib/theorySlug.ts
// and netlify/edge-functions/sitemap.ts. Netlify edge functions run in Deno and cannot
// import from src/. If you change this, change all three copies or theory URLs will
// silently diverge between the app, the prerender layer and the sitemap.
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

async function renderTheoryDetail(context: Context, rawSlug: string, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const slug = String(rawSlug || "").toLowerCase();

  const rows = await sbGetRows(
    "theories",
    "is_approved=eq.true&select=id,title,summary,content,proponent,source_title,source_url,source_type,origin,tags,upvotes,created_at,updated_at",
  );

  let match: Record<string, unknown> | null = null;
  const bySlug = rows.filter((r) => theorySlug(String(r.title || "")) === slug);
  if (bySlug.length === 1) {
    match = bySlug[0];
  } else if (bySlug.length > 1) {
    const sorted = [...bySlug].sort((a, b) => {
      const at = a.created_at ? Date.parse(String(a.created_at)) : 0;
      const bt = b.created_at ? Date.parse(String(b.created_at)) : 0;
      return at - bt;
    });
    match = sorted[0];
  } else {
    match = rows.find((r) => String(r.id) === slug) ?? null;
  }

  if (!match) {
    return notFound404(await shellRes.text(), {
      title: "Theory not found | DMT Code",
      heading: "Theory not found",
      text: "This theory is not currently indexed or the link is out of date.",
      canonical: `${SITE}/theories`,
      backHref: `${SITE}/theories`,
      backLabel: "Back to Open theories",
      marker: "theory-not-found",
    });
  }


  // Slugs are resolved above from the SOURCE-language title, so the canonical URL
  // must be built from that same source title, captured before overlay() replaces it.
  const sourceTitle = String(match.title || "");

  overlay(match as Record<string, unknown>, await getTranslations("theories", String(match.id), locale));

  const canonicalSlug = theorySlug(sourceTitle);
  const canonical = `${SITE}/theories/${canonicalSlug}`;
  const title = `${String(match.title)} | DMT Code`;
  const metaDesc = match.summary ? clip(String(match.summary), 160) : "";
  const tags = Array.isArray(match.tags) ? (match.tags as string[]).filter(Boolean) : [];

  const summaryHtml = match.summary ? paragraphsFromText(String(match.summary)) : "";
  const contentHtml = match.content ? paragraphsFromText(String(match.content)) : "";
  const proponentLine = match.proponent
    ? `<p><strong>Proposed by:</strong> ${esc(String(match.proponent))}</p>`
    : "";
  const originLine = match.origin
    ? `<p><em>${esc(originLabel(match.origin))}</em></p>`
    : "";
  const sourceLine = match.source_url
    ? `<p><strong>Source:</strong> <a href="${esc(String(match.source_url))}" rel="noopener">${esc(String(match.source_title || match.source_url))}</a>${match.source_type ? ` (${esc(String(match.source_type))})` : ""}</p>`
    : (match.source_title ? `<p><strong>Source:</strong> ${esc(String(match.source_title))}${match.source_type ? ` (${esc(String(match.source_type))})` : ""}</p>` : "");
  const tagBlock = tags.length
    ? `<p><strong>Tags:</strong> ${tags.map((t) => esc(t)).join(", ")}</p>`
    : "";
  const agreeLine = (typeof match.upvotes === "number" && match.upvotes > 0)
    ? `<p><strong>Agree:</strong> ${match.upvotes}</p>`
    : "";

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Open theories", item: `${SITE}/theories` },
      { "@type": "ListItem", position: 3, name: String(match.title), item: canonical },
    ],
  };
  const creativeWorkLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": canonical,
    url: canonical,
    name: String(match.title),
    license: LICENSE,
  };
  if (match.summary) creativeWorkLd.abstract = String(match.summary);
  if (match.content) creativeWorkLd.text = String(match.content);
  if (match.proponent) creativeWorkLd.author = { "@type": "Person", name: String(match.proponent) };
  if (match.source_url) creativeWorkLd.isBasedOn = String(match.source_url);
  if (tags.length > 0) creativeWorkLd.keywords = tags.join(", ");

  const body = `<article data-prerender="theory">
  <nav><a href="${SITE}/theories">Open theories</a></nav>
  <h1>${esc(String(match.title))}</h1>
  ${originLine}
  ${proponentLine}
  ${agreeLine}
  ${summaryHtml}
  ${contentHtml}
  ${sourceLine}
  ${tagBlock}
  <p><a href="${SITE}/theories">Back to all theories</a></p>
</article>`;

  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "article",
    jsonLd: [organizationLd, breadcrumbLd, creativeWorkLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

// ---------- Articles prerender ----------

// Inline figure sanitizer. Used only by the articles renderer, whose bodies are
// written through the admin gated editor. Everything outside this allowlist is
// dropped: no script, iframe, foreignObject, event handlers, or javascript URLs
// can survive, and unknown tags are removed while their text is kept.
const FIGURE_TAGS = new Set([
  "figure", "figcaption", "strong", "em", "br",
  "svg", "title", "desc", "path", "circle", "rect", "text", "tspan",
  "g", "line", "polyline", "polygon", "ellipse",
]);

const FIGURE_ATTRS = new Set([
  "class", "id", "role", "style", "xmlns", "viewbox", "preserveaspectratio",
  "width", "height", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry",
  "d", "points", "transform", "opacity",
  "fill", "fill-opacity", "fill-rule", "stroke", "stroke-opacity", "stroke-width",
  "stroke-linecap", "stroke-linejoin", "stroke-dasharray",
  "font-family", "font-size", "font-weight", "font-style", "text-anchor",
  "letter-spacing", "dominant-baseline", "aria-label", "aria-hidden",
]);

function sanitizeFigure(block: string): string {
  return block
    .replace(/<!--[\s\S]*?-->/g, "")
    // Drop dangerous elements together with their contents before allowlisting.
    .replace(/<(script|style|iframe|object|embed|foreignObject)[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)\/?>/g, (m, rawName: string, rawAttrs: string) => {
      const name = rawName.toLowerCase();
      if (!FIGURE_TAGS.has(name)) return "";
      const closing = m.startsWith("</");
      if (closing) return `</${name}>`;
      const selfClosing = /\/\s*>$/.test(m);
      const attrs: string[] = [];
      const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
      let a: RegExpExecArray | null;
      while ((a = attrRe.exec(rawAttrs)) !== null) {
        const key = a[1];
        const lower = key.toLowerCase();
        if (!FIGURE_ATTRS.has(lower)) continue;
        const value = a[2] ?? a[3] ?? "";
        if (/^\s*(javascript|data|vbscript)\s*:/i.test(value)) continue;
        if (/expression\s*\(|url\s*\(\s*['"]?\s*javascript:/i.test(value)) continue;
        attrs.push(`${key}="${value.replace(/"/g, "&quot;")}"`);
      }
      // Preserve the source spelling of camelCase SVG attributes.
      return `<${rawName}${attrs.length ? " " + attrs.join(" ") : ""}${selfClosing ? "/" : ""}>`;
    });
}

// Minimal, safe markdown to HTML converter for prerendered article bodies.
// Every user-authored character is HTML-escaped first, so no raw HTML from the
// source can survive. Then a small set of block and inline patterns is turned
// back into tags. Supported: h2, h3, paragraphs, bold, italic, links,
// unordered lists, ordered lists, blockquotes, inline code, fenced code.
// With allowFigures, sanitized inline <figure> blocks (used for the article
// SVG plates) pass through untouched by the escaper.
// Never emits a second <h1> because articles always render their title as h1.
function mdToHtml(src: string, opts?: { allowFigures?: boolean }): string {
  const esc0 = (s: string) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  // Extract fenced code blocks first so their contents are not processed.
  const codeBlocks: string[] = [];
  let text = src.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, (_m, code: string) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre><code>${esc0(code.replace(/\n$/, ""))}</code></pre>`);
    return `\u0000CODE${idx}\u0000`;
  });

  const figures: string[] = [];
  if (opts?.allowFigures) {
    text = text.replace(/<figure[\s\S]*?<\/figure>/gi, (block: string) => {
      const idx = figures.length;
      figures.push(sanitizeFigure(block));
      return `\n\n\u0000FIG${idx}\u0000\n\n`;
    });
  }

  text = esc0(text);

  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let inUL = false;
  let inOL = false;
  let inBQ = false;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };
  const closeUL = () => { if (inUL) { out.push("</ul>"); inUL = false; } };
  const closeOL = () => { if (inOL) { out.push("</ol>"); inOL = false; } };
  const closeBQ = () => { if (inBQ) { out.push("</blockquote>"); inBQ = false; } };

  function inline(s: string): string {
    let t = s;
    // Inline code first so its content is not further transformed.
    const codes: string[] = [];
    t = t.replace(/`([^`\n]+)`/g, (_m, c: string) => {
      const i = codes.length;
      codes.push(`<code>${c}</code>`);
      return `\u0001C${i}\u0001`;
    });
    // Links: [text](url). Only allow safe schemes: http, https, mailto, site-relative (/), anchors (#).
    // Anything else renders as plain label text with no anchor.
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
      const trimmed = href.trim();
      const safeHref = /^(https?:\/\/|mailto:|\/[^/]|\/$|#)/i.test(trimmed) || trimmed === "/";
      if (!safeHref) return label;
      const safe = trimmed.replace(/"/g, "&quot;");
      return `<a href="${safe}" rel="noopener">${label}</a>`;
    });
    t = t.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    t = t.replace(/\u0001C(\d+)\u0001/g, (_m, i: string) => codes[Number(i)]);
    return t;
  }

  for (const raw of lines) {
    const line = raw;

    // Restore fenced blocks placeholder as its own block.
    const figMatch = line.match(/^\u0000FIG(\d+)\u0000$/);
    if (figMatch) {
      flushPara(); closeUL(); closeOL(); closeBQ();
      out.push(figures[Number(figMatch[1])]);
      continue;
    }

    const fencedMatch = line.match(/^\u0000CODE(\d+)\u0000$/);
    if (fencedMatch) {
      flushPara(); closeUL(); closeOL(); closeBQ();
      out.push(codeBlocks[Number(fencedMatch[1])]);
      continue;
    }

    if (/^\s*$/.test(line)) {
      flushPara(); closeUL(); closeOL(); closeBQ();
      continue;
    }

    const h3 = line.match(/^###\s+(.*)$/);
    const h2 = line.match(/^##\s+(.*)$/);
    // A single # is downgraded to h2 to guarantee only one h1 per page.
    const h1down = line.match(/^#\s+(.*)$/);
    if (h3) { flushPara(); closeUL(); closeOL(); closeBQ(); out.push(`<h3>${inline(h3[1])}</h3>`); continue; }
    if (h2) { flushPara(); closeUL(); closeOL(); closeBQ(); out.push(`<h2>${inline(h2[1])}</h2>`); continue; }
    if (h1down) { flushPara(); closeUL(); closeOL(); closeBQ(); out.push(`<h2>${inline(h1down[1])}</h2>`); continue; }

    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    const bq = line.match(/^&gt;\s?(.*)$/);

    if (ul) {
      flushPara(); closeOL(); closeBQ();
      if (!inUL) { out.push("<ul>"); inUL = true; }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    if (ol) {
      flushPara(); closeUL(); closeBQ();
      if (!inOL) { out.push("<ol>"); inOL = true; }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    if (bq) {
      flushPara(); closeUL(); closeOL();
      if (!inBQ) { out.push("<blockquote>"); inBQ = true; }
      out.push(`<p>${inline(bq[1])}</p>`);
      continue;
    }

    closeUL(); closeOL(); closeBQ();
    para.push(line.trim());
  }
  flushPara(); closeUL(); closeOL(); closeBQ();

  return out.join("\n");
}

// Strip markdown to plain text for the JSON-LD articleBody field.
function mdToPlain(src: string): string {
  return String(src || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchInList(
  table: string,
  ids: string[],
  filter: string,
  select: string,
  key: "id" | "slug" = "id",
): Promise<Array<Record<string, unknown>>> {
  if (!ids || !ids.length) return [];
  const inList = ids.filter(Boolean).map((x) => `"${x}"`).join(",");
  if (!inList) return [];
  const path = `${key}=in.(${inList})&${filter}&select=${select}`;
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    console.error(
      `[fetchInList] upstream not ok table=${table} status=${res.status} path=${path}`,
    );
    return [];
  }
  return (await res.json()) as Array<Record<string, unknown>>;
}

async function renderArticlesIndex(context: Context, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/articles`;
  const articlesCopy = uiCopy("articles", locale);
  const title = articlesCopy.title;
  const metaDesc = clip(articlesCopy.description, 200);

  const rows = await sbGetRows(
    "articles",
    "is_published=eq.true&select=id,slug,title,dek,published_at,updated_at,source_url,source_outlet,source_published_at&order=published_at.desc",
  );

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Articles", item: canonical },
    ],
  };
  // Original publication attribution. Rows carrying a stored publisher URL are
  // reporting we did not originate, so both the visible text and the schema
  // point agents at the outlet that did.
  const outletOf = (r: Record<string, unknown>): string => {
    const url = String(r.source_url || "");
    if (!url) return "";
    const stored = String(r.source_outlet || "").trim();
    if (stored) return stored;
    return url.replace(/^https?:\/\/(www\.)?/i, "").split("/")[0];
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${canonical}#list`,
    name: "DMT Code Articles",
    numberOfItems: rows.length,
    itemListElement: rows.map((r, i) => {
      const srcUrl = String(r.source_url || "");
      const outlet = outletOf(r);
      const item: Record<string, unknown> = {
        "@type": "BlogPosting",
        url: `${SITE}/articles/${String(r.slug || "")}`,
        headline: String(r.title || ""),
        description: String(r.dek || ""),
        datePublished: r.published_at,
      };
      if (srcUrl) {
        const based: Record<string, unknown> = {
          "@type": "NewsArticle",
          headline: String(r.title || ""),
          url: srcUrl,
          publisher: { "@type": "Organization", name: outlet, url: `https://${outlet}` },
        };
        if (r.source_published_at) based.datePublished = r.source_published_at;
        item.isBasedOn = based;
        item.sourceOrganization = { "@type": "Organization", name: outlet, url: `https://${outlet}` };
        item.sdPublisher = { "@type": "Organization", name: outlet };
      }
      return { "@type": "ListItem", position: i + 1, item };
    }),
    license: LICENSE,
  };

  const items = rows
    .map((r) => {
      const slug = String(r.slug || "");
      const srcUrl = String(r.source_url || "");
      const sourced = srcUrl
        ? ` <span>Sourced from <a href="${esc(srcUrl)}" rel="noopener nofollow">${esc(outletOf(r))}</a>.</span>`
        : "";
      return `<li><a href="/articles/${esc(slug)}"><strong>${esc(String(r.title || ""))}</strong></a>${r.dek ? ` <span>${esc(String(r.dek))}</span>` : ""}${sourced}</li>`;
    })
    .join("");


  const body = `<article data-prerender="articles-index">
  <!--tsrc:static:articles-->
  <h1>${hubLabel("articles-h1", locale)}</h1>
  <section>
    <p>${hubLabel("articles-p1", locale)}</p>
  </section>
  <!--/tsrc-->
  <section>
    <h2>${hubLabel("articles-all", locale)}</h2>
    ${items ? `<ul>${items}</ul>` : `<p>${hubLabel("articles-empty", locale)}</p>`}
  </section>
  <section>
    <h2>${hubLabel("articles-machine", locale)}</h2>
    <ul>
      <li><a href="/articles.json">${hubLabel("articles-json", locale)}</a></li>
      <li><a href="/articles/feed.xml">${hubLabel("articles-rss", locale)}</a></li>
    </ul>
  </section>
</article>`;

  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "website",
    ogImage: DEFAULT_OG_IMAGE,
    jsonLd: [organizationLd, breadcrumbLd, itemListLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

async function renderArticleDetail(context: Context, rawSlug: string, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const slug = String(rawSlug || "").toLowerCase();
  const rows = await sbGetRows(
    "articles",
    `slug=eq.${encodeURIComponent(slug)}&is_published=eq.true` +
      `&select=id,slug,title,dek,body_md,topic_tags,compounds,` +
      `related_trials,related_bibliography,related_symbols,related_protocols,` +
      `author,published_at,updated_at,source_url,source_outlet,source_published_at`,
  );
  const r = rows[0];
  if (!r) {
    // A slug that was published here and has since been withdrawn deserves 410
    // Gone, not 404: Googlebot drops a 410 quickly and keeps retrying a 404 for
    // months. A slug that never existed stays 404.
    //
    // The list is hardcoded because this function authenticates with
    // SUPABASE_ANON_KEY, and the only anon-readable policy on `articles` is
    // `is_published = true`. A withdrawn row is invisible to this key, so it
    // cannot be looked up at request time. Widening RLS would expose body_md
    // along with the slug, which is worse than maintaining ten strings.
    // Kept honest by scripts/check-withdrawn-articles-drift.mjs.
    if (WITHDRAWN_ARTICLE_SLUGS.has(slug)) {
      return notFound404(await shellRes.text(), {
        status: 410,
        title: "Article withdrawn | DMT Code",
        heading: "Article withdrawn",
        text: "This article was published here and has since been withdrawn. It is not coming back at this address.",
        canonical: `${SITE}/articles`,
        backHref: `${SITE}/articles`,
        backLabel: "Articles",
        marker: "article-withdrawn",
      });
    }
    return notFound404(await shellRes.text(), { title: "Article not found | DMT Code", heading: "Article not found", text: "This article is not currently indexed or the link is out of date.", canonical: `${SITE}/articles`, backHref: `${SITE}/articles`, backLabel: "Articles", marker: "article-not-found" });
  }

  overlay(r, await getTranslations("articles", String(r.slug), locale));

  const canonical = `${SITE}/articles/${String(r.slug)}`;
  const title = `${String(r.title)} | DMT Code`;
  const dek = String(r.dek || "");
  const metaDesc = clip(dek, 160);

  const published = r.published_at ? new Date(String(r.published_at)) : null;
  const updated = r.updated_at ? new Date(String(r.updated_at)) : null;
  const showUpdated =
    published && updated && (updated.getTime() - published.getTime()) > 86400000;
  const pubReadable = published
    ? published.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";
  const updReadable = updated
    ? updated.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  // Resolve related records for the "based on" block and citation JSON-LD.
  const trialIds = ((r.related_trials as string[]) || []).filter(Boolean);
  const bibIds = ((r.related_bibliography as string[]) || []).filter(Boolean);
  const symIds = ((r.related_symbols as string[]) || []).filter(Boolean);
  const protoSlugs = ((r.related_protocols as string[]) || []).filter(Boolean);

  // Protocols are looked up by fetching the full published set and filtering
  // in JS. The table has under a dozen rows, and this avoids PostgREST quoting
  // pitfalls on text-key in-lists that silently returned empty here before.
  const [trialRows, bibRows, symRows, allProtoRows] = await Promise.all([
    fetchInList("clinical_trials", trialIds, "is_approved=is.true", "id,title"),
    fetchInList("bibliography", bibIds, "is_approved=eq.true", "id,title,doi"),
    fetchInList("symbol_submissions", symIds, "status=eq.approved", "id"),
    protoSlugs.length
      ? sbGetRows("protocols", "is_published=eq.true&select=slug,title")
      : Promise.resolve([] as Array<Record<string, unknown>>),
  ]);
  const protoBySlug = new Map(
    (allProtoRows || []).map((p) => [String(p.slug), p]),
  );
  const protoRows = protoSlugs
    .map((s) => protoBySlug.get(s))
    .filter((p): p is Record<string, unknown> => !!p);

  const basedParts: string[] = [];
  if (trialRows.length) {
    basedParts.push(
      `<li><strong>Clinical trials:</strong><ul>${trialRows
        .map((t) => `<li><a href="/trials/${esc(String(t.id))}">${esc(String(t.title || ""))}</a></li>`)
        .join("")}</ul></li>`,
    );
  }
  if (bibRows.length) {
    basedParts.push(
      `<li><strong>Bibliography:</strong><ul>${bibRows
        .map((b) => `<li><a href="/bibliography/${esc(String(b.id))}">${esc(String(b.title || ""))}</a></li>`)
        .join("")}</ul></li>`,
    );
  }
  if (symRows.length) {
    basedParts.push(
      `<li><strong>Symbols:</strong><ul>${symRows
        .map((s) => {
          const id = String(s.id);
          return `<li><a href="/registry/${esc(id)}">Symbol ${esc(id.slice(0, 8))}</a></li>`;
        })
        .join("")}</ul></li>`,
    );
  }
  if (protoRows.length) {
    basedParts.push(
      `<li><strong>Protocols:</strong><ul>${protoRows
        .map((p) => `<li><a href="/protocols/${esc(String(p.slug))}">${esc(String(p.title || p.slug))}</a></li>`)
        .join("")}</ul></li>`,
    );
  }
  const basedOn = basedParts.length
    ? `<section><h2>What this is based on</h2><ul>${basedParts.join("")}</ul></section>`
    : "";

  const bodyHtml = mdToHtml(String(r.body_md || ""), { allowFigures: true });
  const plainBody = mdToPlain(String(r.body_md || ""));

  const bylineBits: string[] = [];
  if (r.author) bylineBits.push(`By ${esc(String(r.author))}`);
  if (pubReadable) bylineBits.push(`Published ${esc(pubReadable)}`);
  if (showUpdated && updReadable) bylineBits.push(`Updated ${esc(updReadable)}`);
  const byline = bylineBits.length ? `<p><em>${bylineBits.join(" &middot; ")}</em></p>` : "";

  // Original publication attribution.
  const srcUrl = String(r.source_url || "");
  const srcOutlet = srcUrl
    ? String(r.source_outlet || "").trim() ||
      srcUrl.replace(/^https?:\/\/(www\.)?/i, "").split("/")[0]
    : "";
  const srcPubReadable = r.source_published_at
    ? new Date(String(r.source_published_at)).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const sourcedFrom = srcUrl
    ? `<p data-attribution="source">Sourced from <a href="${esc(srcUrl)}" rel="noopener nofollow">${esc(srcOutlet)}</a>${srcPubReadable ? `, published ${esc(srcPubReadable)}` : ""}. Cite the original publication, not this page, for the reporting itself.</p>`
    : "";

  const body = `<article data-prerender="article">
  <h1>${esc(String(r.title))}</h1>
  ${dek ? `<p><strong>${esc(dek)}</strong></p>` : ""}
  ${byline}
  ${sourcedFrom}
  <div>${bodyHtml}</div>
  ${basedOn}
  <p><a href="/articles">Back to articles</a></p>
</article>`;


  const tags = [
    ...((r.topic_tags as string[]) || []),
    ...((r.compounds as string[]) || []),
  ].filter(Boolean);

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Articles", item: `${SITE}/articles` },
      { "@type": "ListItem", position: 3, name: String(r.title), item: canonical },
    ],
  };

  const citation: Array<Record<string, unknown>> = [];
  for (const t of trialRows) {
    citation.push({
      "@type": "MedicalStudy",
      name: String(t.title || ""),
      url: `${SITE}/trials/${String(t.id)}`,
    });
  }
  for (const b of bibRows) {
    const node: Record<string, unknown> = {
      "@type": "ScholarlyArticle",
      name: String(b.title || ""),
      url: `${SITE}/bibliography/${String(b.id)}`,
    };
    if (b.doi) {
      node.identifier = String(b.doi).startsWith("http")
        ? String(b.doi)
        : `https://doi.org/${String(b.doi)}`;
    }
    citation.push(node);
  }
  for (const s of symRows) {
    const id = String(s.id);
    citation.push({
      "@type": "CreativeWork",
      name: `Symbol ${id.slice(0, 8)}`,
      url: `${SITE}/registry/${id}`,
    });
  }
  for (const p of protoRows) {
    citation.push({
      "@type": "CreativeWork",
      name: String(p.title || p.slug),
      url: `${SITE}/protocols/${String(p.slug)}`,
    });
  }

  const blogPostingLd: Record<string, unknown> = {
    "@type": "BlogPosting",
    "@id": canonical,
    headline: String(r.title),
    description: dek,
    articleBody: plainBody,
    datePublished: r.published_at,
    dateModified: r.updated_at,
    author:
      r.author && String(r.author).trim() && String(r.author).trim() !== "DMT Code Project"
        ? { "@type": "Person", name: String(r.author) }
        : { "@id": `${SITE}#org` },
    publisher: { "@id": `${SITE}#org` },
    license: LICENSE,
    isAccessibleForFree: true,
    keywords: tags,
    mainEntityOfPage: canonical,
    image: DEFAULT_OG_IMAGE,
    isPartOf: { "@id": `${SITE}/articles#blog` },
    url: canonical,
  };
  if (citation.length) blogPostingLd.citation = citation;
  if (srcUrl) {
    const sourceWork: Record<string, unknown> = {
      "@type": "NewsArticle",
      headline: String(r.title),
      url: srcUrl,
      publisher: { "@type": "Organization", name: srcOutlet, url: `https://${srcOutlet}` },
    };
    if (r.source_published_at) sourceWork.datePublished = r.source_published_at;
    blogPostingLd.isBasedOn = sourceWork;
    blogPostingLd.sourceOrganization = {
      "@type": "Organization",
      name: srcOutlet,
      url: `https://${srcOutlet}`,
    };
    blogPostingLd.sdPublisher = { "@type": "Organization", name: srcOutlet };
  }

  const blogLd = {
    "@type": "Blog",
    "@id": `${SITE}/articles#blog`,
    name: "DMT Code Articles",
    url: `${SITE}/articles`,
    publisher: { "@id": `${SITE}#org` },
  };

  const graphLd = {
    "@context": "https://schema.org",
    "@graph": [organizationLd, blogLd, blogPostingLd, breadcrumbLd],
  };

  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "article",
    ogImage: DEFAULT_OG_IMAGE,
    jsonLd: [graphLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

// ---------------------------------------------------------------------------
// Guides. Slug keyed canonical answer pages. Every visible block is rendered
// only when the underlying column holds real content; an empty column renders
// nothing at all, no heading and no placeholder text.
// ---------------------------------------------------------------------------

type GuideSource = {
  claim?: unknown;
  source_title?: unknown;
  source_author?: unknown;
  source_publication?: unknown;
  source_url?: unknown;
  doi?: unknown;
};

function gText(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function gEntries(v: unknown): GuideSource[] {
  return Array.isArray(v)
    ? (v.filter((x) => x && typeof x === "object") as GuideSource[])
    : [];
}

function gStrings(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => gText(x)).filter(Boolean) : [];
}

function guideSourceList(entries: GuideSource[]): string {
  const items = entries
    .filter((e) => gText(e.claim))
    .map((e) => {
      const parts = [
        gText(e.source_author),
        gText(e.source_title),
        gText(e.source_publication),
      ].filter(Boolean);
      const line = parts.join(", ");
      const url = gText(e.source_url);
      const doi = gText(e.doi);
      let out = `<li>${esc(gText(e.claim))}`;
      if (line) {
        out += url
          ? `<br /><a href="${esc(url)}" rel="noopener">${esc(line)}</a>`
          : `<br />${esc(line)}`;
      }
      if (doi) {
        out += `<br />DOI <a href="https://doi.org/${esc(doi)}" rel="noopener">${esc(doi)}</a>`;
      }
      return out + "</li>";
    });
  return items.length ? `<ul>${items.join("")}</ul>` : "";
}

function guidePlainList(values: string[]): string {
  return values.length
    ? `<ul>${values.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`
    : "";
}

function guideDate(v: unknown): string {
  const s = gText(v);
  if (!s) return "";
  const d = new Date(s.length === 10 ? `${s}T00:00:00Z` : s);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

const GUIDES_SUBLINE =
  "Direct answers to the questions people actually ask, each one graded by how strong the evidence behind it really is.";

async function renderGuidesIndex(context: Context, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/guides`;
  const guidesCopy = uiCopy("guides", locale);
  const title = guidesCopy.title;
  const metaDesc = guidesCopy.description;

  const rows = await sbGetRows(
    "guides",
    "is_published=eq.true&select=slug,question,short_answer,evidence_grade,last_reviewed,updated_at&order=sort_order.asc",
  );

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Guides", item: canonical },
    ],
  };
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${canonical}#list`,
    name: "DMT Code Guides",
    numberOfItems: rows.length,
    itemListElement: rows.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Question",
        url: `${SITE}/guides/${gText(r.slug)}`,
        name: gText(r.question),
        acceptedAnswer: {
          "@type": "Answer",
          text: gText(r.short_answer),
        },
      },
    })),
    license: LICENSE,
  };

  const items = rows
    .map((r) => {
      const slug = gText(r.slug);
      const answer = gText(r.short_answer);
      const grade = gText(r.evidence_grade);
      return (
        `<li><a href="/guides/${esc(slug)}"><strong>${esc(gText(r.question))}</strong></a>` +
        (answer ? ` <span>${esc(answer)}</span>` : "") +
        (grade ? ` <span>Evidence grade: ${esc(grade)}</span>` : "") +
        `</li>`
      );
    })
    .join("");

  const body = `<article data-prerender="guides-index">
  <h1>Guides</h1>
  <p>${esc(GUIDES_SUBLINE)}</p>
  <section>
    <h2>All guides</h2>
    ${items ? `<ul>${items}</ul>` : "<p>No guides have been published yet.</p>"}
  </section>
</article>`;

  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "website",
    ogImage: DEFAULT_OG_IMAGE,
    jsonLd: [organizationLd, breadcrumbLd, itemListLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

async function renderGuideDetail(context: Context, rawSlug: string, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const slug = String(rawSlug || "").toLowerCase();
  const rows = await sbGetRows(
    "guides",
    `slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=*`,
  );
  const r = rows[0];
  if (!r) {
    return notFound404(await shellRes.text(), {
      title: "Guide not found | DMT Code",
      heading: "Guide not found",
      text: "This guide is not currently published or the link is out of date.",
      canonical: `${SITE}/guides`,
      backHref: `${SITE}/guides`,
      backLabel: "Guides",
      marker: "guide-not-found",
    });
  }

  overlay(r, await getTranslations("guides", String(r.slug ?? ""), locale));

  const question = gText(r.question);
  const shortAnswer = gText(r.short_answer);
  const canonical = `${SITE}/guides/${gText(r.slug)}`;
  const title = `${question} | DMT Code`;
  const metaDesc = clip(shortAnswer, 160);

  const grade = gText(r.evidence_grade);
  const gradeNote = gText(r.evidence_grade_note);
  const safety = gText(r.safety_note);
  const supports = gEntries(r.what_supports);
  const weakens = gEntries(r.what_weakens);
  const unknowns = gStrings(r.what_is_unknown);
  const changes = gStrings(r.what_would_change);
  const related = (Array.isArray(r.related_paths) ? r.related_paths : [])
    .filter((x) => x && typeof x === "object")
    .map((x) => x as { label?: unknown; path?: unknown })
    .filter((x) => gText(x.label) && gText(x.path));
  const bodyHtml = gText(r.body_md) ? mdToHtml(gText(r.body_md)) : "";
  const reviewed = guideDate(r.last_reviewed);

  const supportsList = guideSourceList(supports);
  const weakensList = guideSourceList(weakens);
  const unknownsList = guidePlainList(unknowns);
  const changesList = guidePlainList(changes);

  const blocks: string[] = [];
  if (question) blocks.push(`<h1>${esc(question)}</h1>`);
  if (shortAnswer) blocks.push(`<p><strong>${esc(shortAnswer)}</strong></p>`);
  if (grade) {
    blocks.push(`<p><strong>Evidence grade</strong> ${esc(grade)}</p>`);
    if (gradeNote) blocks.push(`<p>${esc(gradeNote)}</p>`);
  }
  if (safety) blocks.push(`<aside>${esc(safety)}</aside>`);
  if (supportsList) blocks.push(`<h2>What supports this</h2>${supportsList}`);
  if (weakensList) blocks.push(`<h2>What weakens this</h2>${weakensList}`);
  if (unknownsList) blocks.push(`<h2>What is still unknown</h2>${unknownsList}`);
  if (changesList) blocks.push(`<h2>What would change this answer</h2>${changesList}`);
  if (bodyHtml) blocks.push(`<div>${bodyHtml}</div>`);
  if (related.length) {
    blocks.push(
      `<h2>Related pages on this site</h2><ul>${related
        .map(
          (x) =>
            `<li><a href="${esc(gText(x.path))}">${esc(gText(x.label))}</a></li>`,
        )
        .join("")}</ul>`,
    );
  }
  if (reviewed) blocks.push(`<p>Last reviewed ${esc(reviewed)}</p>`);

  const body = `<article data-prerender="guide-detail">\n${blocks.join("\n")}\n</article>`;

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE}/guides` },
      { "@type": "ListItem", position: 3, name: question, item: canonical },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: {
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: shortAnswer },
    },
  };

  const citation: Array<Record<string, unknown>> = [];
  for (const e of [...supports, ...weakens]) {
    const name = gText(e.source_title);
    if (!name) continue;
    const node: Record<string, unknown> = { "@type": "CreativeWork", name };
    const author = gText(e.source_author);
    const publisher = gText(e.source_publication);
    const url = gText(e.source_url);
    const doi = gText(e.doi);
    if (author) node.author = author;
    if (publisher) node.publisher = publisher;
    if (url) node.url = url;
    if (doi) node.sameAs = `https://doi.org/${doi}`;
    citation.push(node);
  }

  const articleLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": canonical,
    headline: question,
    description: shortAnswer,
    url: canonical,
    dateModified: r.updated_at,
    publisher: { "@id": `${SITE}#org` },
    license: LICENSE,
  };
  if (citation.length) articleLd.citation = citation;

  const head = buildHead({
    locale,
    title,
    description: metaDesc,
    canonical,
    ogType: "article",
    ogImage: DEFAULT_OG_IMAGE,
    jsonLd: [organizationLd, breadcrumbLd, faqLd, articleLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

// ---------- People: static entity profiles ----------
// There is no people table. These pages are static content plus prerender.

const PERSON_LD_DANNY_GOLER = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE}/people/danny-goler#person`,
  name: "Danny Goler",
  url: `${SITE}/people/danny-goler`,
  description:
    "Danny Goler first described the 650 nm laser DMT observation in August 2020 and published the pilot study in IPI Letters in 2025.",
  sameAs: ["https://codeofreality.org", "https://x.com/GolerDanny"],
  knowsAbout: [
    "N,N-DMT",
    "650 nm laser diffraction",
    "visual geometry",
    "Code of Reality protocol",
  ],
  subjectOf: {
    "@type": "ScholarlyArticle",
    name: "Detailing a Pilot Study: The Code of Reality Protocol",
    author: "Danny Goler",
    datePublished: "2025-01-08",
    identifier: "10.59973/ipil.158",
    sameAs: "https://doi.org/10.59973/ipil.158",
    isPartOf: { "@type": "Periodical", name: "IPI Letters" },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/people/danny-goler` },
};

const BREADCRUMB_LD_DANNY_GOLER = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
    { "@type": "ListItem", position: 2, name: "People", item: `${SITE}/people` },
    { "@type": "ListItem", position: 3, name: "Danny Goler", item: `${SITE}/people/danny-goler` },
  ],
};

const VIDEO_LD_DISCOVERY = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "The Discovery Film Official Teaser Trailer",
  description:
    "Official teaser trailer for The Discovery, a documentary about the 650 nm laser observation first described by Danny Goler.",
  embedUrl: "https://www.youtube.com/embed/vB2-vIumXss",
  url: "https://www.youtube.com/watch?v=vB2-vIumXss",
  thumbnailUrl: "https://i.ytimg.com/vi/vB2-vIumXss/hqdefault.jpg",
  uploadDate: "2026-08-11",
};

const FAQ_LD_DANNY_GOLER = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Who is Danny Goler and what is the DMT code of reality?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Danny Goler first described the 650 nm laser observation in August 2020 and published the pilot study in IPI Letters in 2025, DOI 10.59973/ipil.158. Whether the phenomenon is real remains an open question, with four explanations actively defended.",
      },
    },
    {
      "@type": "Question",
      name: "Is dmtcode.com affiliated with Danny Goler or Code of Reality?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Danny Goler is not a founder of DMT Code and holds no editorial role in it. He is aware of the project and is credited throughout the site as the person who first described the observation. dmtcode.com operates as an independent open registry and publishes evidence on both sides of the claim, including null results.",
      },
    },
    {
      "@type": "Question",
      name: "When does The Discovery documentary premiere?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Per the film's official site, the world premiere is in the Los Angeles area between late October and early November 2026. Date and venue are to be announced.",
      },
    },
  ],
};

async function renderPersonPage(context: Context, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/people/danny-goler`;
  const tr = await getTranslations("people", "danny-goler", locale);

  const innerEn = `<h1>Danny Goler</h1>
  <p>Danny Goler is the person who first described the observation this project exists to record. In August 2020 he reported that a specific optical setup, a 650 nm laser passed through a diffraction grating and viewed under N,N-DMT, produced a repeating geometric pattern that he and others came to call the code of reality. In January 2025 he published the first written account of the method as a pilot study in the journal IPI Letters. Everything on this site is downstream of that description.</p>
  <p>This page credits that origination and links to his own work. It does not speak for him, and it does not decide whether the phenomenon is real. That question is held open here on purpose.</p>

  <h2>What he described</h2>
  <p>The observation is a method. A red 650 nm laser is directed through a fine diffraction grating so that it casts a lattice of points, and an observer under N,N-DMT reports what they see in that field. Goler's account is that the lattice resolves into consistent, recurring forms across different people. The method itself is written up on the <a href="/protocol-guide">protocol guide</a>. The forms people report, including the ones that do not match anyone else's, accumulate in the <a href="/registry">visual symbol registry</a>.</p>
  <h2>The pilot study</h2>
  <p>The first peer-visible account is the paper "Detailing a Pilot Study: The Code of Reality Protocol," by Danny Goler, published in IPI Letters on 8 January 2025, DOI <a href="https://doi.org/10.59973/ipil.158" rel="noopener">10.59973/ipil.158</a>. It is catalogued in this site's <a href="/bibliography/56c88785-8efd-49b3-9471-0df15676be9a">bibliography entry for the paper</a>, where it carries a stance score alongside every source that argues the other way. The paper describes the protocol and reports the author's observations. It is a pilot study, and it says so.</p>
  <h2>His work beyond the paper</h2>
  <p>Goler runs the non-profit research effort at <a href="https://codeofreality.org" rel="noopener">codeofreality.org</a> and is the subject of the documentary The Discovery. He has described the protocol at length in long-form interviews, including the Danny Jones Podcast and the Shawn Ryan Show, the second of which is catalogued here as <a href="/bibliography/a99cc4aa-8fc0-45fb-a1a1-6b90f16a5c8e">Shawn Ryan Show #320</a>. Those appearances are where most people first hear about the observation. His account of it is his own, and the links above go to it directly.</p>
  <h2>His relationship to this project</h2>
  <p>Goler is not a founder of DMT Code and holds no editorial role in it. He is aware of the project. We state that plainly rather than leave it to be inferred. The relationship does not change how this site treats his claim. His paper is scored on the same scale as the papers that dispute it. His protocol sits next to the null results people file against it. Nothing here is written to shield the origination story from a test.</p>
  <h2>Where his claim stands today</h2>
  <p>Four explanations for the reported forms are actively defended. Goler's reading, that the pattern is a structured feature of reality rather than of the visual system, is stated here first because it is the originator's position. The competing readings, from retinal and cortical optics to expectation and suggestion, are set out on the <a href="/critiques">critiques page</a> and in the <a href="/open-questions">open questions</a>. Independent controlled replication that isolates the 650 nm wavelength as a variable has not been published. That is a fact about the state of the field, not a charge against anyone. Results that cut against the claim are filed in the <a href="/null-reports">null reports</a> in the same place, under the same license, as the ones that support it.</p>
  <h2>The Discovery, a documentary film</h2>
  <p>The Discovery is a feature documentary about the 650 nm laser observation and the people attempting to test it, directed by Aaron Vanden. The film's official site lists a world premiere in the Los Angeles area between late October and early November 2026, with date and venue to be announced. The official teaser trailer is below. DMT Code is not affiliated with the film. We index it here because it is the most significant upcoming driver of public attention to the claim this site keeps the record of.</p>
  <p><a href="https://www.youtube.com/watch?v=vB2-vIumXss" rel="noopener">The Discovery Film Official Teaser Trailer</a></p>
  <p><a href="https://thediscoveryfilm.com" rel="noopener">The Discovery, official site</a></p>
  <h2>Questions and answers</h2>
  <h3>Who is Danny Goler and what is the DMT code of reality?</h3>
  <p>Danny Goler first described the 650 nm laser observation in August 2020 and published the pilot study in IPI Letters in 2025, DOI 10.59973/ipil.158. Whether the phenomenon is real remains an open question, with four explanations actively defended.</p>
  <h3>Is dmtcode.com affiliated with Danny Goler or Code of Reality?</h3>
  <p>No. Danny Goler is not a founder of DMT Code and holds no editorial role in it. He is aware of the project and is credited throughout the site as the person who first described the observation. dmtcode.com operates as an independent open registry and publishes evidence on both sides of the claim, including null results.</p>
  <h3>When does The Discovery documentary premiere?</h3>
  <p>Per the film's official site, the world premiere is in the Los Angeles area between late October and early November 2026. Date and venue are to be announced.</p>
  <h2>Follow the record</h2>
  <ul>
    <li>The full <a href="/timeline">chronology, 1926 to 2025</a></li>
    <li>The <a href="/registry">visual symbol registry</a> where reported forms accumulate</li>
    <li>The <a href="/protocol-guide">650 nm laser protocol guide</a></li>
    <li>The <a href="/bibliography/56c88785-8efd-49b3-9471-0df15676be9a">bibliography entry for the pilot study</a></li>
    <li><a href="/people/chase-hughes">Chase Hughes and the validation claim</a></li>
  </ul>`;

  const body = `<article data-prerender="person-danny-goler"><!--tsrc:people:danny-goler-->${tr.body_html ?? innerEn}<!--/tsrc-->
  ${await golerAttribution(locale, false)}
  <script type="application/ld+json">${jsonLd(PERSON_LD_DANNY_GOLER)}</script>
  <script type="application/ld+json">${jsonLd(BREADCRUMB_LD_DANNY_GOLER)}</script>
</article>`;

  const head = buildHead({
    locale,
    title: tr.title ?? "The person who first described the 650 nm laser observation | DMT Code",
    description: tr.description ??
      "Danny Goler first described the DMT laser observation in August 2020 and published the pilot study in IPI Letters in 2025. The record, in one place.",
    canonical,
    canonicalPath: "/people/danny-goler",
    ogType: "profile",
    jsonLd: [PERSON_LD_DANNY_GOLER, BREADCRUMB_LD_DANNY_GOLER, VIDEO_LD_DISCOVERY, FAQ_LD_DANNY_GOLER],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}


async function renderPeopleIndex(context: Context, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/people`;
  const tr = await getTranslations("people", "index", locale);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "People",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Danny Goler",
        url: `${SITE}/people/danny-goler`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Andrew Gallimore",
        url: `${SITE}/people/andrew-gallimore`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Chase Hughes",
        url: `${SITE}/people/chase-hughes`,
      },
    ],
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "People", item: canonical },
    ],
  };

  const innerEn = `<h1>People</h1>
  <p>Entity profiles for the people whose work this record is built on.</p>
  <ul>
    <li><a href="/people/danny-goler">Danny Goler</a>: described the 650 nm laser observation in August 2020 and published the pilot study in IPI Letters in 2025.</li>
    <li><a href="/people/andrew-gallimore">Andrew Gallimore</a>: proposes the laser speckle explanation, one of the leading alternatives to the reality-code reading.</li>
    <li><a href="/people/chase-hughes">Chase Hughes</a>: popularizer of an unverified validation claim about the 650 nm laser protocol; not an author of the pilot study.</li>
  </ul>`;

  const body = `<article data-prerender="people"><!--tsrc:people:index-->${tr.body_html ?? innerEn}<!--/tsrc-->
  <script type="application/ld+json">${jsonLd(itemListLd)}</script>
  <script type="application/ld+json">${jsonLd(breadcrumbLd)}</script>
</article>`;

  const head = buildHead({
    locale,
    title: uiCopy("people", locale).title,
    description: uiCopy("people", locale).description,
    canonical,
    canonicalPath: "/people",
    ogType: "website",
    jsonLd: [itemListLd, breadcrumbLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);

  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

// ---------- People: secondary static profiles ----------

// Copy is mirrored from src/pages/PersonAndrewGallimore.tsx and
// src/pages/PersonChaseHughes.tsx. Every sentence is wording already published
// elsewhere on the site. JSON-LD carries name, description and sameAs only.

const SIMPLE_PEOPLE: Record<string, {
  name: string;
  title: string;
  description: string;
  sameAs: string[];
  bodyHtml: string;
}> = {
  "andrew-gallimore": {
    name: "Andrew Gallimore",
    title: "Andrew Gallimore, the laser speckle critique | DMT Code",
    description:
      "Andrew Gallimore proposes the laser speckle explanation for the reported DMT code observation, one of the strongest cases against the reality-code reading.",
    sameAs: ["https://alieninsect.substack.com/p/on-the-dmt-laser-code-of-reality"],
    bodyHtml: `
  <p>Andrew Gallimore is one of the critics catalogued on this site's <a href="/critiques">critiques page</a>, where the strongest cases against the reality-code reading are stated in their strongest form. His account is the laser speckle explanation, published as an essay and linked from that page.</p>
  <h2>The laser speckle explanation</h2>
  <p>The diffracted 650 nm beam produces speckle, a physically real, structured optical pattern generated by interference of coherent light scattered from a rough surface. DMT amplifies pattern recognition. Under this account, the shared structure that observers report reflects shared optics rather than any external code being revealed.</p>
  <p>Testable prediction: swapping the diffraction grating for one with a different line density should change the reported forms in a way that tracks the new speckle field.</p>
  <h2>Where this sits in the record</h2>
  <p>This site states the laser speckle account first among the alternatives to the reality-code reading, alongside cymatics and cultural priming, on both the <a href="/critiques">critiques page</a> and the <a href="/protocol-guide">protocol guide</a>. Independent controlled replication that isolates the 650 nm wavelength as a variable has not been published. That is a fact about the state of the field, not a charge against anyone.</p>
  <h2>Follow the record</h2>
  <ul>
    <li>Read the essay: <a href="https://alieninsect.substack.com/p/on-the-dmt-laser-code-of-reality" rel="noopener">On the DMT laser code of reality</a></li>
    <li>The <a href="/critiques">critiques page</a>, where the laser speckle account is set alongside the other leading explanations</li>
    <li>The <a href="/protocol-guide">650 nm laser protocol guide</a></li>
  </ul>`,
  },
  "chase-hughes": {
    name: "Chase Hughes",
    title: "Chase Hughes, popularizer of an unverified validation claim | DMT Code",
    description:
      "Chase Hughes has publicly described the 650 nm laser protocol as validated. This site has not been able to confirm a published, readable source for that claim.",
    sameAs: ["https://dmtcode.com/bibliography/f0f66690-8508-493f-ba93-bdc2bf810261"],
    bodyHtml: `
  <p>Chase Hughes is a podcaster and author who has publicly described the 650 nm laser protocol as validated, most visibly in interviews in 2025. This site has not been able to confirm a published, readable source for any validation he refers to, so the claim is listed as unverified in the bibliography (see the entry Chase Hughes Validation References). He is not an author of the pilot study, which is a single-author paper by Danny Goler (IPI Letters, 2025).</p>
  <p>In podcast coverage and search the protocol is usually called the DMT laser experiment, and Hughes's name attaches to it mainly through the August 2025 video <a href="https://youtu.be/8OW5nwxvvyk" rel="noopener">Chase Hughes After The Laser Observation</a> on Danny Goler's YouTube channel, the most watched primary source for what he actually said.</p>
  <p>That is a statement about the state of the record, not a charge against anyone. Where his account is discussed on this site, it carries the same caveat: recognition after seeing imagery is not replication, and no controlled, blinded replication has been published.</p>
  <h2>Where his claim stands today</h2>
  <p>Independent controlled replication that isolates the 650 nm wavelength as a variable has not been published. Results that cut against the claim are filed in the <a href="/null-reports">null reports</a> in the same place, under the same license, as the ones that support it. The competing readings of the underlying observation are set out on the <a href="/critiques">critiques page</a>.</p>
  <h2>Follow the record</h2>
  <ul>
    <li>The <a href="/registry">visual symbol registry</a> where reported forms accumulate</li>
    <li>The <a href="/protocol-guide">650 nm laser protocol guide</a></li>
    <li>The <a href="/null-reports">null reports</a></li>
  </ul>`,
  },
};

async function renderSimplePersonPage(
  context: Context,
  slug: string,
  locale: Loc = "en"
): Promise<Response> {
  const person = SIMPLE_PEOPLE[slug];
  if (!person) return await notFoundPrerender(context);
  const tr = await getTranslations("people", slug, locale);

  const shellRes = await context.next();
  const canonicalPath = `/people/${slug}`;
  const canonical = `${SITE}${canonicalPath}`;

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    description: person.description,
    sameAs: person.sameAs,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "People", item: `${SITE}/people` },
      { "@type": "ListItem", position: 3, name: person.name, item: canonical },
    ],
  };

  const body = `<article data-prerender="person-${slug}">
  <!--tsrc:people:${slug}-->
  <h1>${esc(person.name)}</h1>${tr.body_html ?? person.bodyHtml}<!--/tsrc-->
  <script type="application/ld+json">${jsonLd(personLd)}</script>
  <script type="application/ld+json">${jsonLd(breadcrumbLd)}</script>
</article>`;

  const head = buildHead({
    locale,
    title: tr.title ?? person.title,
    description: tr.description ?? person.description,
    canonical,
    canonicalPath,
    ogType: "profile",
    jsonLd: [personLd, breadcrumbLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}


// ---------- Products: kit drill-down pages ----------
// /products/:handle is a parameterised route, so it follows the same shape as
// /people/:slug rather than the STATIC_PAGES table: one wildcard entry in
// config.path and in netlify.toml, and a lookup here that 404s an unknown key.
// The difference is that the key set is not a literal in this file. It is the
// `handle` field on each kit in netlify/lib/kits.ts, the mirror of
// src/data/kits.ts, so the prerendered pages and the catalogue cannot disagree
// about which kits exist. The contents list and the per emitter table below are
// rendered from that same array as real text, not injected by script, so a
// crawler reads the bill of materials without executing anything.

function observerPhrase(kit: (typeof KITS)[number]): string {
  return kit.observers === "1" ? "1 observer" : `${kit.observers} observers`;
}

async function renderProductPage(
  context: Context,
  handle: string,
  locale: Loc = "en",
): Promise<Response> {
  const kit = KITS.find((k) => k.handle === handle);
  if (!kit) return await notFoundPrerender(context);

  const shellRes = await context.next();
  const canonicalPath = `/products/${kit.handle}`;
  const canonical = `${SITE}${canonicalPath}`;
  const copy = uiCopy(`product-${kit.id}`, locale);

  const contentsRows = kit.contents
    .map(
      (c) => `      <tr>
        <td>${esc(c.sku)}</td>
        <td>${esc(c.name)}${c.note ? ` (${esc(c.note)})` : ""}</td>
        <td>${c.qty}</td>
      </tr>`,
    )
    .join("\n");

  // One row per light source. A multi emitter kit has no single laser class, so
  // this is never collapsed into a blanket line. Class designations are standard
  // identifiers and are emitted exactly as the vendor states them.
  const emitterRows = kit.emitters
    .map(
      (e) => `      <tr>
        <td>${esc(e.name)} (${esc(e.sku)})</td>
        <td>${esc(e.wavelength_nm)} nm</td>
        <td>${esc(e.vendor_output)}</td>
        <td translate="no">${esc(e.vendor_class)}</td>
      </tr>`,
    )
    .join("\n");

  const classSentence =
    kit.emitters.length > 1
      ? "This kit has more than one light source, so it has no single laser class. Each source is rated separately below."
      : "Vendor rating for the single light source in this kit.";

  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonical}#product`,
    name: kit.name,
    description: kit.description,
    sku: kit.sku,
    url: canonical,
    image: kit.photos.map((p) => p.url),
    brand: { "@type": "Brand", name: "Meridian Optics Lab" },
    offers: {
      "@type": "Offer",
      url: kit.cart,
      price: kit.priceNumber,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Meridian Optics Lab" },
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Prepare", item: `${SITE}/prepare` },
      { "@type": "ListItem", position: 3, name: kit.name, item: canonical },
    ],
  };

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };

  const body = `<article data-prerender="product-${esc(kit.id)}">
  <h1>${esc(kit.name)}</h1>
  <p>${esc(kit.shortName)}, ${esc(observerPhrase(kit))}, ${kit.emitters.length === 1 ? "1 light source" : `${kit.emitters.length} light sources`}.</p>
  <p><strong>${esc(kit.price)}</strong></p>
  <p>Parts at Arbor list: ${esc(kit.diyCost)}. The difference covers sourcing, one shipment and support.</p>
  <p>${esc(kit.description)}</p>
  <p>${esc(kit.availability)} Processed within 2 business days.</p>
  <p>Ships from Arbor Scientific. Expect Arbor branding on the box, tape and packing slip. No prices on the packing slip. Meridian Optics Lab is the seller of record.</p>
  <section data-block="kit-contents">
    <h2>What is in the box</h2>
    <p>Every part shipped with this kit, with the Arbor Scientific part number and the quantity. This is the list the supplier order is placed from.</p>
    <table>
      <caption>${esc(kit.shortName)} kit bill of materials</caption>
      <tr><th>Part</th><th>Item</th><th>Qty</th></tr>
${contentsRows}
    </table>
  </section>
  <section data-block="kit-emitters">
    <h2>Laser safety, per emitter</h2>
    <p>${classSentence}</p>
    <table>
      <caption>${esc(kit.shortName)} kit vendor laser ratings per emitter</caption>
      <tr><th>Emitter</th><th>Wavelength</th><th>Vendor rated output</th><th>Vendor class</th></tr>
${emitterRows}
    </table>
    <p>Do not stare into the beam, do not aim it at anyone, and treat every reflective surface in the room as part of the beam path. Not for children 12 and under.</p>
  </section>
  <section data-block="kit-photos">
    <h2>Photographs</h2>
    <p>${kit.photos.length} photographs. Components are photographed individually as they ship.</p>
${kit.photos
  .map(
    (p, i) =>
      `    <img src="${esc(p.url)}" alt="${esc(p.alt)}" width="2048" height="2048"${i === 0 ? "" : ' loading="lazy"'} />`,
  )
  .join("\n")}
  </section>
  <p><a href="${esc(kit.cart)}">Buy now - secure Shopify checkout</a></p>
  <p>Your card statement will read MERIDIAN OPTICS LAB.</p>
  <p><a href="${SITE}/prepare">Back to all four kits</a>, <a href="${SITE}/returns">shipping and returns</a>, machine readable catalogue at <a href="${SITE}/shop.json">/shop.json</a>.</p>
  <script type="application/ld+json">${jsonLd(productLd)}</script>
  <script type="application/ld+json">${jsonLd(breadcrumbLd)}</script>
</article>`;

  const head = buildHead({
    locale,
    title: copy.title,
    description: copy.description,
    canonical,
    canonicalPath,
    ogType: "website",
    ogImage: kit.photos[0]?.url,
    jsonLd: [organizationLd, breadcrumbLd, productLd],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}
