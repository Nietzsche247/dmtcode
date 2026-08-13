import type { Config, Context } from "@netlify/edge-functions";
import { uiCopy } from "../lib/ui-strings.ts";

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
  "https://storage.googleapis.com/gpt-engineer-file-uploads/xpje0qbzg7e7wLYOGt4x2WGDXtR2/social-images/social-1763590629562-Webp.net-resizeimage-3.png";

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

async function getRow(
  table: string,
  id: string,
  filter: string,
  fields: string
): Promise<Record<string, unknown> | null> {
  const api =
    `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&${filter}&select=${fields}`;
  const res = await fetch(api, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
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

// Field-level translations for a single record. Returns {} for English, for a
// missing table, or on any failure: a missing translation must NEVER blank the
// source value.
async function getTranslations(
  table: string,
  recordId: string,
  locale: string,
): Promise<Record<string, string>> {
  if (locale === "en" || !locale || !recordId) return {};
  if (!SUPABASE_URL || !SUPABASE_KEY) return {};
  try {
    const api =
      `${SUPABASE_URL}/rest/v1/content_translations` +
      `?table_name=eq.${encodeURIComponent(table)}` +
      `&record_id=eq.${encodeURIComponent(recordId)}` +
      `&locale=eq.${encodeURIComponent(locale)}` +
      `&select=field,translated_text`;
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
      if (f && t.trim()) out[f] = t;
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
      return await renderPrepare(context, locale);
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
    if (kind === "people" && seg.length >= 2) {
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

      overlay(r, await getTranslations("symbol_submissions", String(r.id), locale));

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
          identifier: "10.5281/zenodo.17816520",
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
        r.record_type === "registered_trial" ||
        (typeof r.trial_registry_id === "string" &&
          /^NCT/i.test(r.trial_registry_id));
      noindex = !isRegisteredTrial;

      const desc =
        (r.description && String(r.description).trim()) ||
        `A clinical trial tracked by the DMT Code Clinical Trials Observatory${
          r.institution ? `, conducted at ${r.institution}` : ""
        }.`;

      title = `${String(r.title)} | DMT Code Clinical Trials`;
      metaDesc = clip(desc, 160);
      canonical = `${SITE}/trials/${r.id}`;

      const pairs: Array<[string, unknown]> = [
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
              name: "DMT Clinical Trials Observatory",
              description:
                "Open observatory of clinical trials involving N,N-DMT and related compounds, indexed from public trial registries.",
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
  <p>Tracked by the <a href="${SITE}/trials">DMT Code Clinical Trials Observatory</a>, an open record of DMT-related clinical research.</p>
</article>`;
    } else if (kind === "bibliography") {
      const f =
        "id,title,authors,journal,publication_date,doi,pmid,isbn,abstract,url," +
        "compounds,content_type,authority_type,stance_score,tags,summary," +
        "source_date,full_text,transcript,created_at,updated_at";
      const r = await getRow("bibliography", id, "is_approved=eq.true", f);
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
      ? `<section><h2>Full text</h2><p>${esc(bodyText).slice(0, 4000)}</p></section>`
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

async function renderPrepare(context: Context, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();

  const canonical = `${SITE}/prepare`;
  const prepareCopy = uiCopy("prepare", locale);
  const title = prepareCopy.title;
  const metaDesc = clip(prepareCopy.description, 200);

  const KITS = [
    {
      id: "solo",
      sku: "KIT-SOLO-650",
      name: "650 nm Laser Diffraction Research Kit - Solo (1 Observer)",
      price: 289,
      parts: 219,
      image:
        "https://cdn.shopify.com/s/files/1/0957/0484/2550/files/kit-solo.jpg",
      cart: "https://dmtcode-p4szt.myshopify.com/cart/54376696709430:1",
      description:
        "Optical research kit for one observer: a 650 nm laser module, diffraction optics, and printed observation materials for educational study of laser diffraction patterns.",
    },
    {
      id: "triad",
      sku: "KIT-TRIAD-MW",
      name: "Multi-Wavelength Laser Diffraction Research Kit - Triad (2-3 Observers)",
      price: 649,
      parts: 516,
      image: null as string | null,
      cart: "https://dmtcode-p4szt.myshopify.com/cart/54376697692470:1",
      description:
        "Optical research kit for two to three observers: multi-wavelength laser modules including 650 nm, diffraction optics, and printed observation materials for educational study of laser diffraction patterns.",
    },
    {
      id: "circle",
      sku: "KIT-CIRCLE-MW",
      name: "Multi-Wavelength Laser Diffraction Research Kit - Circle (6 Observers)",
      price: 1090,
      parts: 883,
      image:
        "https://cdn.shopify.com/s/files/1/0957/0484/2550/files/kit-circle.jpg",
      cart: "https://dmtcode-p4szt.myshopify.com/cart/54376698446134:1",
      description:
        "Optical research kit for six observers: multi-wavelength laser modules including 650 nm, diffraction optics, and printed observation materials for educational study of laser diffraction patterns.",
    },
  ];

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
      brand: { "@type": "Brand", name: "DMT Code" },
      offers: {
        "@type": "Offer",
        url: canonical,
        price: k.price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        shippingDetails,
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
    <p><strong>$${k.price.toLocaleString("en-US")}</strong></p>
    <p>Sourcing the parts yourself: &asymp; $${k.parts.toLocaleString("en-US")}</p>
    <p>${esc(k.description)}</p>
    <p>Ships in 7-10 business days. Free US shipping included. 18+, for research use.</p>
    <p>Class II laser - do not stare into beam.</p>
    <p><a href="${esc(k.cart)}">Buy - secure Shopify checkout</a></p>
  </section>`,
  ).join("");

  const body = `<article data-prerender="prepare">
  <h1>Careful preparation over careless purchase</h1>
  <p>${esc(metaDesc)}</p>
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
    <p>Every kit that contains a laser module also contains safety eyewear. Class II laser: do not stare into the beam, do not aim it at anyone, and treat every reflective surface in the room as part of the beam path.</p>
  </section>
  <section>
    <h2>Laser diffraction research kits</h2>
    ${kitBlocks}
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
    identifier: "10.5281/zenodo.17816520",
    creator: { "@id": `${SITE}#org` },
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${SITE}/data.json` },
    ],
    sameAs: ["https://doi.org/10.5281/zenodo.17816520"],
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
  <h1>Is the DMT code real? An evidence timeline for the 650 nm laser paradigm</h1>
  <p>The claim under test is narrow. During N,N-DMT experiences, and under a specific 650 nm laser observation protocol, independent people appear to report the same discrete visual forms. This page lays out what the open record currently shows so any reader, human or machine, can judge the claim on the data rather than on assertion.</p>
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

  const body = `<article data-prerender="timeline">
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
        a: "Start with the screening card. Before you consider anything, talk with a qualified prescriber about MAOIs, SSRIs and related medications, any cardiac history, and any personal or family history of psychosis. We deliberately do not publish medication timing windows. The sources disagree and getting it wrong can be dangerous, so that decision belongs with a clinician who knows your history. This is for adults 18 and older.",
      },
      {
        q: "Is this legal?",
        a: "The equipment we discuss is ordinary optical gear. We do not sell, source, or explain how to obtain any controlled substance, and nothing here is legal advice. Laws differ by country and state and they change. For your own situation, check your local law or a qualified professional.",
      },
      {
        q: "Is the laser safe for my eyes?",
        a: "A laser is not a toy. The kits include the right optical density and eyewear for how the protocol uses the light, and everything should be used exactly as described and kept away from children. If you are unsure how to handle optical equipment safely, do not improvise with it.",
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
        a: "Everything is laid out on the prepare page, from a single-instrument Observer kit up to a full Complete kit. The core is a verified 650nm laser and the right optical density, plus an observation journal and a screening card. You can also source every part yourself. We show the do-it-yourself total next to each kit so you know exactly what you are paying for.",
      },
      {
        q: "Why a 650nm laser?",
        a: "It is the specific red wavelength the observation protocol is built around, paired with the right optical density so it is used the same way each time. Consistent equipment is what lets one person's observation be compared against another's instead of guessing at the differences.",
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
        a: "Yes, and it is often better that way. The group bundles on the prepare page share the costly instruments across two, three, or five people, so the per-person cost drops as the circle grows. Three and five also include a facilitator guide and a group agreements card, because doing this with other people asks for a little more structure.",
      },
      {
        q: "What are your shipping and refund terms?",
        a: "Every item shows its ship window before you pay, and if a date slips you hear it from us first. Preorder items are not charged until there is a confirmed source and date. If a component arrives not as described, we replace it and cover it.",
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

  const body = `<article data-prerender="faq">
  <h1>Questions about the DMT Code project and preparing to observe</h1>
  ${FAQ_GROUPS.map(
    (g) => `<section><h2>${esc(g.heading)}</h2>
    ${g.items.map((it) => `<section><h3>${esc(it.q)}</h3><p>${esc(it.a)}</p></section>`).join("\n    ")}
  </section>`,
  ).join("\n  ")}
  <p>See the open data at <a href="${SITE}/registry">/registry</a>, <a href="${SITE}/dataset">/dataset</a>, and <a href="${SITE}/data.json">/data.json</a>. CC-BY-4.0.</p>
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
  bodyExtraHtml?: string;
  extraJsonLd?: unknown[];
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

// Verbatim copy of the terms array in src/data/glossaryTerms.ts, which is the source of truth.
// Netlify edge functions run in Deno and cannot import from src/.
const GLOSSARY_TERMS: Array<{ term: string; definition: string }> = [
  { term: "650 nm Laser Protocol", definition: "Experimental method using coherent light at 650 nanometer wavelength through a diffraction grating to elicit discrete visual symbols during N,N-DMT administration. Developed by Danny Goler." },
  { term: "Alphabetic-like Symbol", definition: "Discrete visual element resembling written characters from alphabetic writing systems (e.g., katakana, Cyrillic, runic), described as bounded and character like rather than as a continuous geometric field." },
  { term: "Coherent Light", definition: "Electromagnetic radiation with constant phase relationship between waves. Laser light is coherent, which is what allows a diffraction grating to project a precise pattern." },
  { term: "Confirmation Count", definition: "A count of readers who said a registry form echoed their own memory. Because those readers saw the form in this catalogue before they responded, the number measures recognition after exposure, not independent convergence. An independent match requires an account sealed before the person viewed the catalogue." },
  { term: "Diffraction Grating", definition: "Optical component with periodic structure that splits coherent light into distinct beams. Used in the 650 nm protocol to project a grid pattern. Whether that pattern has any effect on N,N-DMT visual phenomena is the question under test." },
  { term: "Discrete Visual Symbol", definition: "Distinct, bounded geometric or alphabetic-like element perceived as separate from surrounding visual field. Contrasts with continuous geometric patterns or ambient visual noise." },
  { term: "Geometric Archetype", definition: "A symbol morphology that recurs across submissions, described by shared features such as symmetry, line structure, and orientation. Recurrence in the registry is not by itself evidence of independent convergence, because contributors may have seen earlier submissions before making their own." },
  { term: "Inter-subject Consistency", definition: "The degree to which independent observers report identical or highly similar phenomena under controlled conditions. Whether the 650 nm protocol produces it has not been established, because the reports gathered so far come from observers who were free to view the catalogue first." },
  { term: "Motif Tag", definition: "Descriptive categorical label applied to registry symbols (e.g., 'spiral', 'bilateral', 'angular'). Facilitates pattern analysis and cross-reference between submissions." },
  { term: "N,N-Dimethyltryptamine (N,N-DMT)", definition: "Endogenous tryptamine compound and Schedule I controlled substance. Administered via smoking, vaporisation, or intramuscular injection. Produces intense visual phenomena lasting 5-20 minutes." },
  { term: "Perceived Surface", definition: "Physical or conceptual location where visual symbols appear during N,N-DMT experience (e.g., wall, ceiling, closed eyelids, hands). Recorded as metadata so any relationship to symbol form can be tested later rather than assumed." },
  { term: "Photobiomodulation", definition: "Therapeutic use of red or near-infrared light (660-850 nm) to enhance cellular energy production via mitochondrial cytochrome c oxidase stimulation. Any link to symbol clarity in the 650 nm protocol is an untested hypothesis and has not been demonstrated." },
  { term: "Registry Glyph", definition: "100×100 pixel black-and-white or red-and-gold symbol submitted to DMT Code Glyph Registry with structured metadata (source, dose, surface, depth, emotional valence, etc.)." },
  { term: "Route of Administration", definition: "Method of N,N-DMT delivery: smoked/vaporised (most common, rapid onset), intramuscular injection (slower onset, longer duration), or other experimental routes." },
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
    a: "Double-blind experimental design requires three critical components to eliminate expectation effects and observer bias: Sham laser device: Construct device with identical appearance, weight, and operation (button press, indicator LED) but no 650 nm coherent light output. Use a blocked aperture or another control that is not distinguishable by appearance, see the control device requirements below. Independent randomization: Third-party experimenter (not present during experience) randomizes real/sham assignment using sealed envelopes or electronic randomization. Maintains allocation concealment until data analysis. Blinded symbol recording: Both participant and symbol recorder remain unaware of real/sham condition. Post-experience drawing occurs before unblinding. Control for optical variables: wavelength (650 nm ± 5 nm), intensity (fixed in advance and recorded, see equipment specifications below), diffraction grating line density (500-1000 lines/mm). Control for pharmacological variables: N,N-DMT dose (route-matched baseline dose), set/setting standardization. Timmermann et al. (2019) Neural correlates of the DMT experience assessed with multivariate EEG. DOI: 10.1038/s41598-019-51974-4",
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
    a: "Standardized equipment ensures replicability: Laser: 650 nm plus or minus 5 nm, continuous wave, beam diameter 1 to 2 mm at aperture. Power and safety class are deliberately left open. The published report we have been able to verify describes a collimated 650 nm laser but does not state output power or safety class in the publicly accessible record, so any specific figure here would be invented rather than sourced. A replication should use the lowest output that produces a usable diffraction pattern at the intended viewing distance, that figure should be set by a qualified laser safety officer, recorded in the protocol, and verified with a calibrated power meter. For context, consumer pointers sold as Class 2 are limited to 1 mW, while Class 3R, labelled Class IIIa under older United States classification, spans 1 to 5 mW. Those are materially different exposure classes and they are not interchangeable. Diffraction grating: 500-1000 lines/mm transmission grating, mounted 2-5 cm from laser aperture. Holographic gratings preferred for uniform diffraction pattern. Control device: a credible optical control has to match everything the participant can perceive. Same housing, weight, button, indicator, apparent colour, apparent brightness, projected geometry, surface coverage and viewing distance. What it manipulates has to be something the participant cannot perceive directly, such as coherence, speckle structure or diffraction order. A 520 nm green LED fails this test, because green is visibly not red and the participant is unblinded the moment the device is switched on. Measurement tools: spectrometer to verify output wavelength, calibrated power meter to verify output power against the figure set in the protocol, beam profiler for spatial characterisation, and a photometer to confirm the control device matches the active device on apparent brightness.",
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
      "The open record of a reported observation: first described by Danny Goler in 2020, published as a pilot study in 2025, and unresolved. We keep the evidence, including the evidence against.",
      "DMT Code is a research surface for a narrow claim: that independent people report the same discrete visual forms during N,N-DMT experiences and under a specific 650 nm laser observation protocol. The site is built so anyone, human or machine, can inspect the raw evidence and judge for themselves.",
      "The registry is public. Every submission shows how many readers said it echoed their own memory after seeing it here, which is recognition after exposure and not an independent match. The bibliography is stance scored. Null results are tracked in the open. The full corpus is downloadable under CC-BY-4.0.",
    ],
    links: [
      { href: "/registry", label: "Visual symbol registry" },
      { href: "/prepare", label: "Prepare to observe" },
      { href: "/evidence-map", label: "Evidence and analysis" },
      { href: "/faq", label: "Questions and answers" },
    ],
    breadcrumbName: "Home",
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
    index: { table: "symbol_submissions", filter: "status=eq.approved", select: "id,description,created_at", titleField: "description", linkPrefix: "/registry", label: "Recent symbols" },
  },
  trials: {
    title: "Clinical Trials Observatory | DMT Code",
    description: "Observatory of DMT related clinical trials with status, sponsor, phase, and application links. Updated from public trial registries.",
    heading: "Clinical Trials Observatory",
    paragraphs: [
      "The observatory tracks clinical trials that involve N,N-DMT and related compounds. Each record links to the underlying trial registry entry so the primary source is one click away.",
      "Filter by status, indication, and sponsor. Machine readable trial records are included in the unified corpus at /data.json.",
    ],
    links: [
      { href: "/data.json", label: "Machine readable corpus" },
      { href: "/bibliography", label: "Related research library" },
    ],
    breadcrumbName: "Trials",
    index: { table: "clinical_trials", filter: "is_approved=is.true", select: "id,title,updated_at", titleField: "title", linkPrefix: "/trials", label: "Tracked trials" },
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
    ],
    links: [
      { href: "/data.json", label: "/data.json (unified corpus)" },
      { href: "/shop.json", label: "/shop.json (kits and bundles)" },
      { href: "/sitemap.xml", label: "/sitemap.xml" },
    ],
    breadcrumbName: "Dataset",
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
  },
  events: {
    title: "Research Timeline and Events | DMT Code",
    description: "Community reported research events, workshops, and DMT related clinical trial milestones. A scholarly reference timeline aggregated from public sources.",
    heading: "Research Timeline and Events",
    paragraphs: [
      "This page aggregates community reported events and publicly available clinical trial data into one scholarly reference timeline. Inclusion does not constitute endorsement.",
      "Events and trials are sourced from the community and from public registries, and are reviewed by moderators before publication. A listing is not an endorsement. Verify legal status, medical screening and staff credentials directly with any organizer or retreat center before you book.",
    ],
    links: [
      { href: "/trials", label: "Clinical trials observatory" },
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
    bodyExtraHtml: `<section><h2>Common questions</h2>${METHODS_FAQ.map((f) => `<div><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join("")}</section>`,
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
  research: {
    title: "Active research projects | DMT Code",
    description: "Ongoing research projects, collaborations, and findings related to the DMT Code paradigm.",
    heading: "Active research",
    paragraphs: [
      "The research page tracks projects that use the DMT Code registry or the 650 nm laser observation protocol as an input, along with published findings.",
      "External researchers who want to use the corpus or contribute a study can do so under CC-BY-4.0 with attribution.",
    ],
    links: [
      { href: "/bibliography", label: "Research bibliography" },
      { href: "/dataset", label: "Dataset" },
    ],
    breadcrumbName: "Research",
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
      "Effective 24 July 2026.",
      "This page describes what this site collects, where it goes, and what becomes public. It was written by reading our own code and database rather than from a template, so it describes what actually happens here.",
    ],
    breadcrumbName: "Privacy",
    bodyExtraHtml: `<section><h2>The short version</h2><p>You can read almost everything on this site without an account and without telling us anything. If you make an account and contribute, the content you contribute is meant to become public, because a convergence dataset that nobody can check is worth nothing. Your identity is not part of what becomes public.</p></section>
<section><h2>What we collect</h2><p><strong>If you create an account.</strong> Your email address and a password, or a Google or Apple sign in if you choose that instead. Passwords are handled by our authentication provider and never reach us in readable form. On sign up we generate a pseudonym for you automatically, in the form of a two word handle. You can change the display name attached to it. We do not ask for your real name at any point.</p><p><strong>If you submit a symbol.</strong> The image you draw or upload, your written description, the tags you choose, and, if you fill them in, the route of administration and approximate dose. If you record a voice note, we store the audio.</p><p><strong>If you complete an assessment.</strong> Your responses to the PHQ-9, GAD-7, MEQ-4 and CEQ-7 questionnaires, and your before and after mood ratings. These are mental health questions and we treat the answers accordingly. They are stored in a private area that is not readable by other visitors. If you upload imaging, that is stored in the same private area.</p><p><strong>If you join a list.</strong> For the general waiting list and for the clinical trial watch list, your email address, and nothing else.</p><p><strong>If you volunteer.</strong> The email address, handle, roles, experience level, languages, skills and motivation you enter on the volunteer form, and whether you consented to being contacted.</p><p><strong>If you buy something.</strong> Nothing about the payment. Checkout happens on Shopify's own systems. Card numbers never touch this site or our database.</p></section>
<section><h2>What we deliberately do not collect</h2><p>We do not log the IP addresses of visitors. Our server side logging records only automated crawlers, and for those it records only the page requested, the crawler's name, and its user agent string. There is no visitor identifier, no fingerprint and no IP address in that log.</p><p>We do not ask for your real name, your date of birth, your address or your phone number anywhere on this site.</p></section>
<section><h2>Who processes data for us</h2><ul><li>Supabase, for the database, sign in and file storage.</li><li>Netlify, for hosting and for the code that runs at the edge.</li><li>Resend, for the emails we send you.</li><li>Shopify, for the shop and for checkout.</li><li>Google Analytics, for measuring which pages get read.</li><li>Google Fonts and Zenodo, which see a request from your browser when a page loads a font or the citation badge in our footer.</li></ul></section>
<section><h2>What becomes public</h2><p>Handles and display names are readable by anyone. That is deliberate, because contributions are attributed to a handle.</p><p>A symbol submission becomes public once it is approved: the image, the description, the tags and the vote count. Theories and events you submit become public once approved, in full.</p><p>Your email address never becomes public. Your assessment answers never become public. Your account identifier is not displayed anywhere on the site.</p></section>
<section><h2>The open data export</h2><p>We publish an export of the site at /data.json under a Creative Commons Attribution 4.0 licence, and we explicitly invite AI crawlers to read it. This is the point of the project. Data that cannot be independently checked is not evidence.</p><p>The export includes approved symbol submissions, approved theories and approved events. For a symbol that means the description, the tags, the vote count, the date and the web address of the image. It does not include your email address.</p><p>If you would rather your contribution were not in that export, tell us and we will take it out of the next one. We cannot recall copies that other people have already downloaded, which is what a Creative Commons licence means in practice, so please decide before you submit rather than after.</p></section>
<section><h2>Cookies and analytics</h2><p>Google Analytics loads on every page of this site and sets cookies in your browser. We see aggregate reports: which pages were read, roughly where in the world readers were, which pages were read next. We do not use it to build a profile of you and we do not sell anything to advertisers.</p><p>It currently loads without asking you first. If you would rather not be measured, you can install Google's own opt out browser add on, or block analytics cookies in your browser settings, or use a browser that blocks them by default. Both work on this site and neither breaks anything.</p></section>
<section><h2>Where things are stored</h2><p>Assessment responses and any imaging you upload are held in a private store that requires authentication to read. Symbol images, drawings and voice notes are held in a public store, because they are published on the site.</p></section>
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
      "Effective 29 July 2026.",
    ],
    breadcrumbName: "Terms",
    bodyExtraHtml: `<section><h2>What this site is</h2><p>DMT Code is a research project that collects and publishes reports of a visual phenomenon, alongside clinical trial records, a bibliography, and competing explanations for what the phenomenon might be. It takes no position on whether the phenomenon is real. Nothing here asserts that it is, and nothing here asserts that it is not.</p></section>
<section><h2>This is not medical advice</h2><p>Nothing on this site is medical advice, therapeutic advice or legal advice. It is not intended to diagnose, treat, cure or prevent anything. DMT is a controlled substance in many countries. This site does not encourage or condone the use of any illegal substance, does not provide sourcing information, and does not provide dosing guidance. Requests for any of those will not receive a reply. Speak to a qualified clinician about anything to do with your health, and check your own local law.</p><p>You must be 18 or older to use this site.</p></section>
<section><h2>Your account</h2><p>An account is optional. You get an automatically generated pseudonym, and you are welcome to keep it. Keep your password to yourself. Tell us at info@dmtcode.com if you think someone else is using your account.</p></section>
<section><h2>What you contribute, and how it is licensed</h2><p>This is the most important section on this page, so it is written plainly.</p><p>When you submit a symbol, a theory or an event, and it is published on this site, you are giving us permission to publish it on this site and to include it in our open data export at /data.json. That export is licensed under Creative Commons Attribution 4.0. In practice this means that anyone, including companies that train AI systems, may copy and reuse the content you contributed as long as they credit DMT Code.</p><p>This is deliberate rather than incidental. The only thing that makes a convergence dataset worth anything is that other people can check it, and that requires them to be able to hold a copy.</p><p>What this does not include: your email address, and your assessment responses, neither of which are ever published or exported.</p><p>You keep ownership of what you contribute. You are giving us a licence, not signing it away.</p><p>You can ask us to withdraw a contribution at any time by writing to info@dmtcode.com. We will remove it from the site and from the next export. We cannot retrieve copies that other people have already taken, which is the nature of an open licence.</p><p>Only submit material that is yours to submit.</p></section>
<section><h2>Moderation</h2><p>Symbols you draw and submit appear in the public registry immediately. There is no queue in front of them. Administrators then have 72 hours from publication to review a submission and deny it. A denied submission is hidden rather than deleted, so a record of what was submitted survives. After that window it stands, unless it is later reported and found to break the rules below.</p><p>Events, retreats, clinical trial records and theories work the other way around. Those are reviewed before they appear.</p><p>Anyone signed in can mark a symbol as echoing their memory, or as not resembling what they saw. Both responses are recorded and both are published in our open data export. Neither one reorders the registry for anybody else. The browse list follows whichever sort the reader picked. One of those sorts does weigh community responses, but the reader has to choose it and it ranks only symbols carrying at least five responses. A response never removes a symbol and never hides one.</p><p>We remove: requests for sourcing, dosing instructions, anything that identifies another person without their consent, spam, and reports we have reason to believe were invented. That last one matters more here than it would elsewhere. A dataset of reported experiences is only worth reading if the reports are real. Submitting one that is not is the one thing that damages this project irreparably.</p></section>
<section><h2>Buying equipment</h2><p>Equipment is sold through our Shopify store, and Shopify's own terms and refund handling apply to the purchase itself. Some links to third party products are affiliate links. Our /disclosure page names them.</p><p>Equipment listed here is ordinary optical and wellness gear. We do not sell, source or explain how to obtain any controlled substance.</p></section>
<section><h2>Accuracy</h2><p>We correct errors publicly rather than quietly. Where a record turns out to be wrong or unverifiable, we hide it and say so. Where a citation is wrong, we fix it. If you find something wrong, tell us at info@dmtcode.com and we would rather hear it than not.</p></section>
<section><h2>No warranty</h2><p>This site is provided as it is. We do not promise it will be available, complete or free of errors. We do not promise that the phenomenon described here is real, and we say so throughout the site. Decisions you make about your own health and your own conduct are yours.</p></section>
<section><h2>Changes</h2><p>If we change these terms we will change the date at the top.</p></section>
<p>Questions: info@dmtcode.com</p>`,
  },
  disclosure: {
    title: "Disclosure | DMT Code",
    description: "How this project makes money, who we have relationships with, and where the conflicts are.",
    heading: "Disclosure",
    paragraphs: [
      "Effective 24 July 2026.",
      "A site whose whole claim is that it can be trusted with a contested subject owes you a straight account of where its money comes from. This is that account.",
    ],
    breadcrumbName: "Disclosure",
    bodyExtraHtml: `<section><h2>How this project pays for itself</h2><p>Two ways, and only two.</p><p><strong>Affiliate commissions.</strong> Some links to third party products earn us a commission if you buy through them. Every one of them is named below.</p><p><strong>Direct sales.</strong> We sell equipment kits through our own Shopify store. When you buy a kit, we are the seller and the margin is ours.</p><p>There is no venture funding, no pharmaceutical sponsorship, no paid placement, and nothing behind a paywall. The full dataset is free and openly licensed.</p></section>
<section><h2>The affiliate links, named</h2><p>Three products currently carry an affiliate link:</p><ul><li>Bon Charge Max Red Light Device</li><li>MitoMAT Red Light Therapy Yoga Mat</li><li>Peyote Way Church of God Spirit Walk</li></ul><p>The first two are lighting equipment. The third is not equipment, it is a retreat experience offered by a religious organisation, and we list it as an affiliate link. We are naming it here rather than leaving it in a catalogue, because an affiliate relationship with a provider of experiences is a different thing from an affiliate relationship with a lamp, and you should be able to weigh that yourself.</p></section>
<section><h2>Equipment we sell ourselves</h2><p>We sell 650 nm laser kits and related equipment directly. This is a real commercial interest in the protocol this site documents, and it is the most obvious conflict in the project. We would rather state it in one sentence at the top of a page than have you find it.</p><p>What we do about it: the protocol pages describe the equipment in generic terms, the specifications are published so you can buy the same parts elsewhere, and the critiques and null reports sections stay up regardless of what they do to sales.</p></section>
<section><h2>Our own event</h2><p>The events list includes DMT Code Protocol Training, which is run by this project. It sits alongside events run by other people. It is ours and we are saying so.</p></section>
<section><h2>Editorial independence</h2><p>Danny Goler first described the observation this project studies, and he is credited as its originator throughout the site. He is aware of the project but holds no editorial role in it. What gets published here, including the critiques and the null results, is decided independently, and the open dataset lets anyone check that policy against practice.</p></section>
<section><h2>Listings are not endorsements</h2><p>Retreats, events and clinical trials are listed because they exist and are relevant, not because we vouch for them. We are not affiliated with the retreat centres we list, apart from the one named above, and we have not inspected any of them. Verify independently and get medical screening before booking anything.</p></section>
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
    description: "Volunteer to help test whether independent reports of visual symbols actually converge. Recorders, translators, analysts, developers, and test subjects welcome.",
    heading: "A real experiment with an unknown answer.",
    paragraphs: [
      "Thousands of people report vivid, structured experiences. We are testing whether those reports truly converge, or whether optics, shared neurobiology, expectation, and memory explain the apparent overlap.",
      "You do not need credentials to help. You need care, honesty, and time. Tell us how you can contribute and we will match you to a role.",
      "Volunteering asks for an email, the roles you can help with, and optionally your experience level, languages, skills, and why you want to help. You need an account so the entry is tied to a person. Your real name stays private and you are given an avatar instead.",
      "We may confirm something extraordinary, or we may find it was the mind all along. Both results matter. Thank you for helping us find out honestly.",
    ],
    bodyExtraHtml: `<section><h2>Roles</h2><ul>${[
      "Test Subject (blinded study)",
      "Recorder",
      "Translator",
      "Moderator",
      "Analyst",
      "Developer",
      "Outreach",
      "Peer Support",
    ].map((r) => `<li>${esc(r)}</li>`).join("")}</ul></section>`,
    links: [
      { href: "/capture", label: "Submit what you saw" },
      { href: "/trials", label: "Clinical trials" },
      { href: "/events", label: "Events" },
      { href: "/about", label: "About the project" },
    ],
    breadcrumbName: "Help build it",
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
        fetch(`${SUPABASE_URL}/rest/v1/events?is_approved=eq.true&event_date=gte.${todayIso}&select=id,title,description,event_date,end_date,location,event_type,organizer&order=event_date.asc&limit=50`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/events?is_approved=eq.true&event_date=lt.${todayIso}&select=id,title,description,event_date,end_date,location,event_type,organizer&order=event_date.desc&limit=50`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/retreats?is_approved=eq.true&select=id,name,description,location,country,website_url&order=created_at.desc&limit=12`, { headers }),
      ]);
      const ups = upRes.ok ? await upRes.json() as Array<Record<string, string>> : [];
      const pasts = pastRes.ok ? await pastRes.json() as Array<Record<string, string>> : [];
      const rets = reRes.ok ? await reRes.json() as Array<Record<string, string>> : [];
      const renderEv = (r: Record<string, string>) => `<li><time datetime="${esc(r.event_date)}">${esc(String(r.event_date || "").slice(0,10))}</time>: <a href="/events/${esc(r.id)}">${esc(clip(String(r.title || ""), 140))}</a>${r.location ? ` (${esc(String(r.location))})` : ""}${r.organizer ? ` - ${esc(String(r.organizer))}` : ""}${r.description ? `<p>${esc(clip(String(r.description), 240))}</p>` : ""}</li>`;
      const renderRe = (r: Record<string, string>) => `<li><a href="/retreats/${esc(r.id)}">${esc(clip(String(r.name || ""), 140))}</a>${r.location || r.country ? ` (${esc([r.location, r.country].filter(Boolean).join(", "))})` : ""}${r.description ? `<p>${esc(clip(String(r.description), 240))}</p>` : ""}</li>`;
      const sections: string[] = [];
      if (ups.length) sections.push(`<section><h2>Upcoming events</h2><ul>${ups.map(renderEv).join("")}</ul></section>`);
      if (pasts.length) sections.push(`<section><h2>Past events</h2><ul>${pasts.map(renderEv).join("")}</ul></section>`);
      if (rets.length) sections.push(`<section><h2>Retreats</h2><ul>${rets.map(renderRe).join("")}</ul></section>`);
      if (!sections.length) sections.push(`<section><h2>No approved events or retreats yet</h2><p>Nothing has been approved for this timeline yet. Submissions are reviewed before publication.</p></section>`);
      recentList = sections.join("\n") + `\n<p><em>Scholarly reference only. Inclusion does not constitute endorsement.</em></p>`;
      const listItems = [
        ...ups.map((r, i) => ({ "@type": String(r.event_type || "").toLowerCase() === "festival" ? "Festival" : "Event", position: i + 1, name: String(r.title || ""), description: String(r.description || "").trim() || undefined, startDate: r.event_date || undefined, endDate: r.end_date || undefined, location: r.location || undefined, organizer: r.organizer ? { "@type": "Organization", name: String(r.organizer) } : undefined, eventStatus: "https://schema.org/EventScheduled", url: `${SITE}/events/${r.id}` })),
        ...pasts.map((r, i) => ({ "@type": String(r.event_type || "").toLowerCase() === "festival" ? "Festival" : "Event", position: ups.length + i + 1, name: String(r.title || ""), description: String(r.description || "").trim() || undefined, startDate: r.event_date || undefined, endDate: r.end_date || undefined, location: r.location || undefined, organizer: r.organizer ? { "@type": "Organization", name: String(r.organizer) } : undefined, url: `${SITE}/events/${r.id}` })),
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
          recentList = `<section><h2>Latest article</h2><p><a href="/articles/${esc(slug)}">${esc(title)}</a>. ${esc(clip(dek, 240))}</p><p><a href="/articles">Read all articles</a></p></section>`;
        }
      }
    } catch { /* ignore */ }
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

  const linksBlock = page.links && page.links.length
    ? `<section><h2>Related</h2><ul>${page.links
        .map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`)
        .join("")}</ul></section>`
    : "";

  const body = `<article data-prerender="${esc(key)}">
  <h1>${esc(page.heading)}</h1>
  ${page.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n  ")}
  ${page.bodyExtraHtml ?? ""}
  ${recentList}
  ${linksBlock}
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
    "/null-reports",
    "/glossary",
    "/methods",
    "/open-questions",
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
    "/capture",
    "/co-witnesses",
    "/join",
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
        `<link rel="alternate" hreflang="es" href="${esc(SITE + "/es" + (path === "/" ? "" : path))}" />`,
        `<link rel="alternate" hreflang="de" href="${esc(SITE + "/de" + (path === "/" ? "" : path))}" />`,
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
};

// Shared not-found prerender. Returns HTTP 404 with a noindex head so unknown
// detail records stop being indexed as soft 404s.
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
    status: 404,
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

function originLabel(origin: unknown): string {
  const s = String(origin || "").toLowerCase();
  if (s === "curated" || s === "public_record" || s === "record") {
    return "From the public record";
  }
  if (s === "community") return "Community";
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Community";
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
        url: `${SITE}/theories/${theorySlug(String(r.title || ""))}`,
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
    .map((r) => {
      const tags = Array.isArray(r.tags) ? (r.tags as string[]).filter(Boolean) : [];
      const summaryHtml = r.summary
        ? paragraphsFromText(String(r.summary))
        : "";
      const contentHtml = r.content
        ? `<section><h3>Full argument</h3>${paragraphsFromText(String(r.content))}</section>`
        : "";
      const proponentLine = r.proponent
        ? `<p><strong>Proponent:</strong> ${esc(String(r.proponent))}</p>`
        : "";
      const sourceLine = r.source_url
        ? `<p><strong>Source:</strong> <a href="${esc(String(r.source_url))}" rel="noopener">${esc(String(r.source_title || r.source_url))}</a>${r.source_type ? ` (${esc(String(r.source_type))})` : ""}</p>`
        : (r.source_title ? `<p><strong>Source:</strong> ${esc(String(r.source_title))}${r.source_type ? ` (${esc(String(r.source_type))})` : ""}</p>` : "");
      const tagBlock = tags.length
        ? `<p><strong>Tags:</strong> ${tags.map((t) => esc(t)).join(", ")}</p>`
        : "";
      return `<article>
  <h2>${esc(String(r.title || "Untitled theory"))}</h2>
  <p><em>${esc(originLabel(r.origin))}</em></p>
  ${proponentLine}
  ${summaryHtml}
  ${contentHtml}
  ${sourceLine}
  ${tagBlock}
</article>`;
    })
    .join("\n");

  const body = `<article data-prerender="theories">
  <h1>Open theories</h1>
  <section>
    <p>Theories are not evidence. They are explanations that people have offered for what could account for the reported DMT code phenomenon. Read them as candidate hypotheses to be tested, not as findings.</p>
    <p>Entries here are either curated from the public record (published, attributed positions) or submitted by the community and reviewed before appearing. Votes on this page are never seeded or fabricated; every count reflects real reader activity.</p>
  </section>
  <section>
    <h2>Theories</h2>
    ${theoryBlocks || "<p>No approved theories are currently indexed.</p>"}
  </section>
  <section>
    <h2>Related</h2>
    <ul>
      <li><a href="${SITE}/registry">Visual symbol registry</a></li>
      <li><a href="${SITE}/bibliography">Research bibliography</a></li>
      <li><a href="${SITE}/evidence-map">Evidence map</a></li>
      <li><a href="${SITE}/data.json">Machine readable corpus</a></li>
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

  const para1 =
    "Centers that operate openly and publish who they are, where they operate, and under what legal framework. This list is short on purpose. Centers we could not confirm are currently operating are not shown.";
  const para2 =
    "A listing here is not an endorsement. Psychedelic retreats carry real medical and psychological risk, and the legal position varies by country and changes. Verify current legal status, medical screening practice, staff credentials and emergency procedures directly with the center before you book.";

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
  <h1>Retreat centers</h1>
  <section>
    <p>${esc(para1)}</p>
    <p>${esc(para2)}</p>
  </section>
  ${rows.length ? `<section><h2>Centers</h2>${blocks}</section>` : ""}
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
  <h1>Articles</h1>
  <section>
    <p>Answer shaped articles built on named evidence in the DMT Code corpus. Each piece links every trial, paper, symbol, and protocol it rests on, so readers and language models can verify the source directly. Every article is published under CC-BY-4.0.</p>
  </section>
  <section>
    <h2>All articles</h2>
    ${items ? `<ul>${items}</ul>` : "<p>No articles have been published yet.</p>"}
  </section>
  <section>
    <h2>Machine access</h2>
    <ul>
      <li><a href="/articles.json">Full corpus JSON (CC-BY-4.0)</a></li>
      <li><a href="/articles/feed.xml">RSS feed</a></li>
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
  if (!r) return notFound404(await shellRes.text(), { title: "Article not found | DMT Code", heading: "Article not found", text: "This article is not currently indexed or the link is out of date.", canonical: `${SITE}/articles`, backHref: `${SITE}/articles`, backLabel: "Articles", marker: "article-not-found" });

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
  ${sourcedFrom}
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

async function renderPersonPage(context: Context, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/people/danny-goler`;

  const body = `<article data-prerender="person-danny-goler">
  <h1>Danny Goler</h1>
  <p>Danny Goler is the person who first described the observation this project exists to record. In August 2020 he reported that a specific optical setup, a 650 nm laser passed through a diffraction grating and viewed under N,N-DMT, produced a repeating geometric pattern that he and others came to call the code of reality. In January 2025 he published the first written account of the method as a pilot study in the journal IPI Letters. Everything on this site is downstream of that description.</p>
  <p>This page credits that origination and links to his own work. It does not speak for him, and it does not decide whether the phenomenon is real. That question is held open here on purpose.</p>
  <h2>What he described</h2>
  <p>The observation is a method. A red 650 nm laser is directed through a fine diffraction grating so that it casts a lattice of points, and an observer under N,N-DMT reports what they see in that field. Goler's account is that the lattice resolves into consistent, recurring forms across different people. The method itself is written up on the <a href="/protocol-guide">protocol guide</a>. The forms people report, including the ones that do not match anyone else's, accumulate in the <a href="/registry">visual symbol registry</a>.</p>
  <h2>The pilot study</h2>
  <p>The first peer-visible account is the paper "Detailing a Pilot Study: The Code of Reality Protocol," by Danny Goler, published in IPI Letters on 8 January 2025, DOI <a href="https://doi.org/10.59973/ipil.158" rel="noopener">10.59973/ipil.158</a>. It is catalogued in this site's <a href="/bibliography/56c88785-8efd-49b3-9471-0df15676be9a">bibliography entry for the paper</a>, where it carries a stance score alongside every source that argues the other way. The paper describes the protocol and reports the author's observations. It is a pilot study, and it says so.</p>
  <h2>His work beyond the paper</h2>
  <p>Goler runs the non-profit research effort at <a href="https://codeofreality.org" rel="noopener">codeofreality.org</a> and is the subject of the documentary The Discovery. He has described the protocol at length in long-form interviews, including the Danny Jones Podcast and the Shawn Ryan Show, the second of which is catalogued here as <a href="/bibliography/a99cc4aa-8fc0-45fb-a1a1-6b90f16a5c8e">Shawn Ryan Show #320</a>. Those appearances are where most people first hear about the observation. His account of it is his own, and the links above go to it directly.</p>
  <h2>His relationship to this project</h2>
  <p>Goler is listed among the founders of DMT Code on the <a href="/about">about page</a>. We state that plainly rather than leave it to be inferred. The relationship does not change how this site treats his claim. His paper is scored on the same scale as the papers that dispute it. His protocol sits next to the null results people file against it. Nothing here is written to shield the origination story from a test.</p>
  <h2>Where his claim stands today</h2>
  <p>Four explanations for the reported forms are actively defended. Goler's reading, that the pattern is a structured feature of reality rather than of the visual system, is stated here first because it is the originator's position. The competing readings, from retinal and cortical optics to expectation and suggestion, are set out on the <a href="/critiques">critiques page</a> and in the <a href="/open-questions">open questions</a>. Independent controlled replication that isolates the 650 nm wavelength as a variable has not been published. That is a fact about the state of the field, not a charge against anyone. Results that cut against the claim are filed in the <a href="/null-reports">null reports</a> in the same place, under the same license, as the ones that support it.</p>
  <h2>Follow the record</h2>
  <ul>
    <li>The full <a href="/timeline">chronology, 1926 to 2025</a></li>
    <li>The <a href="/registry">visual symbol registry</a> where reported forms accumulate</li>
    <li>The <a href="/protocol-guide">650 nm laser protocol guide</a></li>
    <li>The <a href="/bibliography/56c88785-8efd-49b3-9471-0df15676be9a">bibliography entry for the pilot study</a></li>
  </ul>
  <script type="application/ld+json">${jsonLd(PERSON_LD_DANNY_GOLER)}</script>
  <script type="application/ld+json">${jsonLd(BREADCRUMB_LD_DANNY_GOLER)}</script>
</article>`;

  const head = buildHead({
    locale,
    title: "Danny Goler, who described the DMT laser observation | DMT Code",
    description:
      "Danny Goler first described the DMT laser observation in August 2020 and published the pilot study in IPI Letters in 2025. The record, in one place.",
    canonical,
    canonicalPath: "/people/danny-goler",
    ogType: "profile",
    jsonLd: [PERSON_LD_DANNY_GOLER, BREADCRUMB_LD_DANNY_GOLER],
  });

  const html = renderShell(await shellRes.text(), head, body, locale);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

async function renderPeopleIndex(context: Context, locale: Loc = "en"): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/people`;

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

  const body = `<article data-prerender="people">
  <h1>People</h1>
  <p>Entity profiles for the people whose work this record is built on.</p>
  <ul>
    <li><a href="/people/danny-goler">Danny Goler</a>: described the 650 nm laser observation in August 2020 and published the pilot study in IPI Letters in 2025.</li>
  </ul>
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
