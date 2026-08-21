// bibliography-fulltext: fills public.bibliography.full_text from legally
// reusable sources.
//
// mode=pmc    resolves each approved row's DOI to a PMCID, verifies the open
//             access licence is CC BY or CC0, pulls the BioC JSON full text,
//             trims it to body sections, truncates, appends the attribution
//             block CC BY requires, and writes it.
// mode=upload takes one row id plus a text part supplied by the caller for
//             open licence sources that are not in PubMed Central.
//
// Auth mirrors trends-ingest: a shared secret header, service role writes.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-fulltext-key',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const MAX_CHARS = 15000;
const MIN_CHARS = 500;
const UPLOAD_MAX = 60000;
const NCBI_DELAY_MS = 400;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const KEEP_SECTIONS = new Set([
  'TITLE',
  'ABSTRACT',
  'INTRO',
  'METHODS',
  'RESULTS',
  'DISCUSS',
  'CONCL',
]);

const OK_LICENSES = new Set(['CCBY', 'CCBY4', 'CC0', 'CCBY40']);

const normLicense = (v: string) => v.toUpperCase().replace(/[\s-]/g, '');

const clean = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || s === 'null' || s === 'undefined') return null;
  return s;
};

interface BibRow {
  id: string;
  title: string | null;
  doi: string | null;
  authors: unknown;
  journal?: string | null;
  publication_date?: string | null;
  source_date?: string | null;
}

// ------------------------------------------------------------------ helpers

async function ncbi(url: string): Promise<Response> {
  const res = await fetch(url, { redirect: 'follow' });
  await sleep(NCBI_DELAY_MS);
  return res;
}

async function resolvePmcid(doi: string): Promise<string | null> {
  const url =
    'https://pmc.ncbi.nlm.nih.gov/tools/idconv/api/v1/articles/?ids=' +
    encodeURIComponent(doi) +
    '&format=json&tool=dmtcode&email=info@dmtcode.com';
  const res = await ncbi(url);
  if (!res.ok) return null;
  const doc = (await res.json()) as { records?: Array<{ pmcid?: string }> };
  const pmcid = doc?.records?.[0]?.pmcid;
  return pmcid && String(pmcid).trim() !== '' ? String(pmcid).trim() : null;
}

interface OaInfo {
  license: string | null;
  retracted: boolean;
}

async function checkOa(pmcid: string): Promise<OaInfo> {
  const url =
    'https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi?id=' +
    encodeURIComponent(pmcid);
  const res = await ncbi(url);
  if (!res.ok) return { license: null, retracted: false };
  const xml = await res.text();
  const rec = xml.match(/<record\b[^>]*>/i)?.[0] ?? '';
  const license = rec.match(/license="([^"]*)"/i)?.[1] ?? null;
  const retracted = /retracted="yes"/i.test(rec);
  return { license: license && license.trim() !== '' ? license.trim() : null, retracted };
}

interface BiocMeta {
  authors: string | null;
  journal: string | null;
  year: string | null;
}

async function fetchBioc(
  pmcid: string,
): Promise<{ text: string; meta: BiocMeta } | null> {
  const url =
    'https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_json/' +
    encodeURIComponent(pmcid) +
    '/unicode';
  const res = await ncbi(url);
  if (!res.ok) return null;
  let doc: unknown;
  try {
    doc = await res.json();
  } catch {
    return null;
  }
  const collection = Array.isArray(doc) ? doc[0] : doc;
  const document = (collection as { documents?: unknown[] })?.documents?.[0] as
    | { passages?: Array<{ text?: string; infons?: Record<string, unknown> }> }
    | undefined;
  if (!document?.passages) return null;

  const parts: string[] = [];
  const meta: BiocMeta = { authors: null, journal: null, year: null };
  const authorNames: string[] = [];

  for (const p of document.passages) {
    const infons = (p.infons ?? {}) as Record<string, unknown>;
    if (!meta.journal) meta.journal = clean(infons['journal']);
    if (!meta.year) {
      const y = clean(infons['year']) ?? clean(infons['date']);
      if (y) meta.year = y.slice(0, 4);
    }
    for (const [k, v] of Object.entries(infons)) {
      if (/^name_\d+$/.test(k)) {
        const s = clean(v);
        if (!s) continue;
        const surname = s.match(/surname:([^;]*)/)?.[1]?.trim();
        const given = s.match(/given-names:([^;]*)/)?.[1]?.trim();
        const full = [surname, given].filter(Boolean).join(' ');
        if (full && !authorNames.includes(full)) authorNames.push(full);
      }
    }
    const section = clean(infons['section_type'])?.toUpperCase();
    if (!section || !KEEP_SECTIONS.has(section)) continue;
    const text = clean(p.text);
    if (text) parts.push(text);
  }

  if (authorNames.length) meta.authors = authorNames.join(', ');
  return { text: parts.join('\n\n'), meta };
}

function truncateWords(text: string, max: number): { text: string; cut: boolean } {
  if (text.length <= max) return { text, cut: false };
  const slice = text.slice(0, max);
  const at = slice.lastIndexOf(' ');
  return { text: (at > max * 0.5 ? slice.slice(0, at) : slice).trimEnd(), cut: true };
}

function authorsToString(v: unknown): string | null {
  if (Array.isArray(v)) {
    const list = v.map((a) => clean(a)).filter(Boolean) as string[];
    return list.length ? list.join(', ') : null;
  }
  return clean(v);
}

function attribution(opts: {
  authors: string | null;
  year: string | null;
  title: string | null;
  journal: string | null;
  doi: string;
  pmcid: string;
  license: string;
}): string {
  const head = [
    opts.authors,
    opts.year ? `(${opts.year})` : null,
  ]
    .filter(Boolean)
    .join(' ');
  const line = [head || null, opts.title, opts.journal]
    .filter(Boolean)
    .join('. ');
  const citation = (line ? line + '. ' : '') + `https://doi.org/${opts.doi}`;
  return (
    '\n\nSource and licence\n' +
    citation +
    `\nPubMed Central ${opts.pmcid}. Distributed under ${opts.license}, ` +
    'https://creativecommons.org/licenses/by/4.0/ . Reproduced on dmtcode.com under that licence. ' +
    'Changes made: full text extracted from the PubMed Central BioC service, reference list, figures, ' +
    'tables and funding statements removed. No wording was altered. ' +
    `Retrieved ${new Date().toISOString().slice(0, 10)}.`
  );
}

// --------------------------------------------------------------------- main

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const started = Date.now();

  const expected =
    Deno.env.get('BIBLIOGRAPHY_FULLTEXT_SECRET') ??
    Deno.env.get('TRENDS_INGEST_SECRET') ??
    Deno.env.get('INTEL_CRON_SECRET') ??
    null;
  const provided = req.headers.get('x-fulltext-key');
  if (!expected || provided !== expected) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const url = new URL(req.url);
  const qp = url.searchParams;
  const contentType = req.headers.get('content-type') ?? '';

  const skipped: Array<{ id: string; title: string | null; reason: string }> = [];
  const updated_rows: Array<{
    id: string;
    title: string | null;
    chars: number;
    license: string | null;
    source: string;
  }> = [];

  try {
    // ------------------------------------------------------------- upload
    if (qp.get('mode') === 'upload') {
      if (!contentType.includes('multipart/form-data')) {
        return json({ error: 'multipart/form-data required' }, 400);
      }
      const fd = await req.formData();
      const id = clean(fd.get('id'));
      const source = clean(fd.get('source'));
      const license = clean(fd.get('license'));
      const textField = fd.get('text');
      const text =
        typeof textField === 'string'
          ? textField
          : textField
            ? await (textField as File).text()
            : '';

      if (!id || !source || !license || !text) {
        return json({ error: 'id, text, source and license are required' }, 400);
      }
      if (text.length < MIN_CHARS || text.length > UPLOAD_MAX) {
        return json(
          { error: `text must be between ${MIN_CHARS} and ${UPLOAD_MAX} characters` },
          400,
        );
      }

      const { data: row, error: rowErr } = await db
        .from('bibliography')
        .select('id, title')
        .eq('id', id)
        .maybeSingle();
      if (rowErr) throw rowErr;
      if (!row) return json({ error: 'bibliography row not found' }, 404);

      const { error: upErr } = await db
        .from('bibliography')
        .update({
          full_text: text,
          full_text_source: source,
          full_text_license: license,
          full_text_retrieved_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (upErr) throw upErr;

      updated_rows.push({
        id,
        title: (row as { title: string | null }).title,
        chars: text.length,
        license,
        source,
      });

      return json({
        ok: true,
        mode: 'upload',
        processed: 1,
        updated: 1,
        skipped,
        updated_rows,
        duration_ms: Date.now() - started,
      });
    }

    // ---------------------------------------------------------------- pmc
    let body: Record<string, unknown> = {};
    if (contentType.includes('application/json')) {
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        body = {};
      }
    }
    const pick = (k: string) => clean(body[k]) ?? qp.get(k);

    const limit = Math.min(40, Math.max(1, Number(pick('limit') ?? 10) || 10));
    const dryRun = ['1', 'true', 'yes'].includes(
      String(pick('dry_run') ?? '').toLowerCase(),
    );
    const singleId = pick('id');

    let query = db
      .from('bibliography')
      .select('id, title, doi, authors, journal, publication_date, source_date');

    if (singleId) {
      query = query.eq('id', singleId);
    } else {
      query = query
        .eq('is_approved', true)
        .not('doi', 'is', null)
        .neq('doi', '')
        .or('full_text.is.null,full_text.eq.')
        .order('featured', { ascending: false, nullsFirst: false })
        .order('source_date', { ascending: false, nullsFirst: false })
        .limit(limit);
    }

    const { data: rows, error: selErr } = await query;
    if (selErr) throw selErr;

    const candidates = (rows ?? []) as BibRow[];
    let updated = 0;

    for (const row of candidates) {
      const title = clean(row.title);
      try {
        const doi = clean(row.doi);
        if (!doi) {
          skipped.push({ id: row.id, title, reason: 'no_doi' });
          continue;
        }

        const pmcid = await resolvePmcid(doi);
        if (!pmcid) {
          skipped.push({ id: row.id, title, reason: 'no_pmcid' });
          continue;
        }

        const oa = await checkOa(pmcid);
        if (oa.retracted) {
          skipped.push({ id: row.id, title, reason: 'retracted' });
          continue;
        }
        const licenseRaw = oa.license;
        if (!licenseRaw || !OK_LICENSES.has(normLicense(licenseRaw))) {
          skipped.push({
            id: row.id,
            title,
            reason: 'license_' + (licenseRaw ?? 'unknown'),
          });
          continue;
        }

        const bioc = await fetchBioc(pmcid);
        if (!bioc || bioc.text.length < MIN_CHARS) {
          skipped.push({
            id: row.id,
            title,
            reason: bioc ? 'too_short' : 'bioc_unavailable',
          });
          continue;
        }

        const { text: trimmed, cut } = truncateWords(bioc.text, MAX_CHARS);
        const bodyText =
          trimmed +
          (cut
            ? '\n\n[Full text truncated at 15000 characters. The complete article is available from the publisher at the DOI above.]'
            : '');

        const pubDate = clean(row.publication_date) ?? clean(row.source_date);
        const full =
          bodyText +
          attribution({
            authors: authorsToString(row.authors) ?? bioc.meta.authors,
            year: (pubDate ? pubDate.slice(0, 4) : null) ?? bioc.meta.year,
            title,
            journal: clean(row.journal) ?? bioc.meta.journal,
            doi,
            pmcid,
            license: licenseRaw,
          });

        if (dryRun) {
          updated_rows.push({
            id: row.id,
            title,
            chars: full.length,
            license: licenseRaw,
            source: 'pmc:' + pmcid,
          });
          continue;
        }

        const { error: upErr } = await db
          .from('bibliography')
          .update({
            full_text: full,
            full_text_source: 'pmc:' + pmcid,
            full_text_license: licenseRaw,
            full_text_retrieved_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        if (upErr) throw upErr;

        updated++;
        updated_rows.push({
          id: row.id,
          title,
          chars: full.length,
          license: licenseRaw,
          source: 'pmc:' + pmcid,
        });
      } catch (e) {
        skipped.push({
          id: row.id,
          title,
          reason: 'error_' + (e instanceof Error ? e.message : String(e)),
        });
      }
    }

    return json({
      ok: true,
      mode: dryRun ? 'pmc_dry_run' : 'pmc',
      processed: candidates.length,
      updated,
      skipped,
      updated_rows,
      duration_ms: Date.now() - started,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('bibliography-fulltext failed:', message);
    return json({ error: message }, 500);
  }
});
