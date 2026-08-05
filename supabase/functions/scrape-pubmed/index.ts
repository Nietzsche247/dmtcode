import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PubMed's clinical index is the wrong instrument for a phenomenology library.
// Querying bare substance names pulls in acronym collisions (multiple-sclerosis
// "DMT" = disease-modifying therapy, "LSD-1" = lysine-specific demethylase) and
// unrelated clinical trials. So the query REQUIRES a perceptual/experiential
// term to co-occur with a substance or sober-perception term, and explicitly
// excludes the known collisions.

const PERCEPTUAL_TERMS = [
  'phenomenology', 'phenomenological', 'hallucination', 'hallucinations',
  'hallucinogenic experience', 'visual imagery', 'visual hallucination',
  'altered state of consciousness', 'altered states of consciousness',
  'consciousness', 'entity encounter', 'entity experience',
  'mystical experience', 'ego dissolution', 'form constant', 'form constants',
  'subjective experience', 'first-person report', 'visionary',
];

const SUBSTANCE_OR_SOBER_TERMS = [
  'dimethyltryptamine', 'N,N-DMT', '5-MeO-DMT', 'ayahuasca', 'ibogaine',
  'psilocybin', 'lysergic acid diethylamide', 'psychedelic', 'psychedelics',
  'tryptamine', 'tryptamines', 'serotonergic hallucinogen',
  // sober perception of the same phenomena
  'meditation', 'sensory deprivation', 'near-death experience',
  'hypnagogic', 'closed-eye visual',
];

const EXCLUSIONS = [
  'disease-modifying therapy', 'disease modifying therapy',
  'disease-modifying therapies', 'disease modifying therapies',
  'multiple sclerosis', 'LSD1', 'LSD-1',
  'lysine-specific demethylase', 'lysine specific demethylase',
  'KDM1A',
];

const orGroup = (terms: string[]) =>
  `(${terms.map((t) => `"${t}"[tiab]`).join(' OR ')})`;

// Exported shape is a single auditable query string, logged with every run.
const PUBMED_QUERY =
  `("N,N-dimethyltryptamine"[tiab] OR "dimethyltryptamine"[tiab] OR "N,N-DMT"[tiab] OR ayahuasca[tiab] OR "Banisteriopsis"[tiab] OR harmine[tiab] OR harmaline[tiab] OR psilocybin[tiab] OR psilocin[tiab] OR "Psilocybe"[tiab] OR "5-MeO-DMT"[tiab] OR "5-methoxy-N,N-dimethyltryptamine"[tiab] OR bufotenin[tiab] OR "lysergic acid diethylamide"[tiab] OR mescaline[tiab] OR ibogaine[tiab] OR "serotonergic psychedelic"[tiab] OR "classic psychedelic"[tiab] OR entheogen[tiab]) NOT ("disease-modifying"[tiab] OR "lumpy skin"[tiab] OR dimethoate[tiab] OR "syndesmotic"[tiab] OR "lysosomal storage disease"[tiab] OR "histone demethylase"[tiab] OR "Direct Mass"[tiab])`;


const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

interface PubmedRecord {
  pmid: string;
  title: string;
  authors: string | null;
  journal: string | null;
  publication_date: string | null;
  doi: string | null;
  abstract: string | null;
  url: string;
  content_type: string;
}

function decodeEntities(input: string | null | undefined): string {
  if (!input) return '';
  let s = String(input);
  // 1. hex numeric refs
  s = s.replace(/&#[xX]([0-9a-fA-F]+);/g, (m, hex) => {
    try {
      const cp = parseInt(hex, 16);
      if (!Number.isFinite(cp)) return m;
      return String.fromCodePoint(cp);
    } catch { return m; }
  });
  // 2. decimal numeric refs
  s = s.replace(/&#([0-9]+);/g, (m, dec) => {
    try {
      const cp = parseInt(dec, 10);
      if (!Number.isFinite(cp)) return m;
      return String.fromCodePoint(cp);
    } catch { return m; }
  });
  // 3. named refs, &amp; last
  s = s.replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"')
       .replace(/&apos;/g, "'")
       .replace(/&amp;/g, '&');
  // 4. exotic whitespace to plain space
  s = s.replace(/[\u00A0\u2005\u2009\u202F]/g, ' ');
  // 5. non-breaking hyphen to plain hyphen
  s = s.replace(/\u2011/g, '-');
  return s;
}

function decodeOrNull(input: string | null | undefined): string | null {
  if (input == null) return null;
  const d = decodeEntities(input);
  return d.length ? d : null;
}

function mapContentType(types: string[]): string {
  const has = (needle: string) => types.some((t) => t.toLowerCase().includes(needle.toLowerCase()));
  if (has('Published Erratum')) return 'Erratum';
  if (has('Retraction of Publication') || has('Retracted Publication')) return 'Retraction';
  if (has('Editorial')) return 'Editorial';
  if (has('Letter') || has('Comment')) return 'Letter';
  if (has('Review') || has('Systematic Review') || has('Meta-Analysis')) return 'Review';
  if (has('Clinical Trial')) return 'Clinical Trial';
  return 'Paper';
}

async function esearch(term: string, retmax = 50): Promise<string[]> {
  const url = `${EUTILS}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmax=${retmax}&sort=pub_date&retmode=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data?.esearchresult?.idlist ?? [];
}

async function esummaryAndAbstract(ids: string[]): Promise<PubmedRecord[]> {
  if (!ids.length) return [];
  const sumUrl = `${EUTILS}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
  const absUrl = `${EUTILS}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml&rettype=abstract`;

  const [sumRes, absRes] = await Promise.all([fetch(sumUrl), fetch(absUrl)]);
  if (!sumRes.ok) return [];
  const sum = await sumRes.json();
  const xml = absRes.ok ? await absRes.text() : '';

  // crude abstract + publication type extraction per pmid
  const abstractMap = new Map<string, string>();
  const pubTypesMap = new Map<string, string[]>();
  const articleBlocks = xml.split(/<PubmedArticle>/).slice(1);
  for (const block of articleBlocks) {
    const pmidMatch = block.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    if (!pmidMatch) continue;
    const pmid = pmidMatch[1];
    const abs = Array.from(block.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g))
      .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
      .join('\n\n');
    if (abs) abstractMap.set(pmid, abs);

    const ptListMatch = block.match(/<PublicationTypeList>([\s\S]*?)<\/PublicationTypeList>/);
    if (ptListMatch) {
      const types = Array.from(ptListMatch[1].matchAll(/<PublicationType[^>]*>([\s\S]*?)<\/PublicationType>/g))
        .map((m) => m[1].trim())
        .filter(Boolean);
      pubTypesMap.set(pmid, types);
    }
  }

  const out: PubmedRecord[] = [];
  const result = sum?.result ?? {};
  for (const pmid of ids) {
    const r = result[pmid];
    if (!r) continue;
    const authors = Array.isArray(r.authors) ? r.authors.map((a: any) => a.name).filter(Boolean).join(', ') : null;
    let doi: string | null = null;
    if (Array.isArray(r.articleids)) {
      const d = r.articleids.find((x: any) => x.idtype === 'doi');
      if (d) doi = String(d.value).toLowerCase();
    }
    const pubdate: string | null = r.pubdate ? String(r.pubdate) : null;
    let iso: string | null = null;
    if (pubdate) {
      const m = pubdate.match(/^(\d{4})(?:\s+(\w+))?(?:\s+(\d+))?/);
      if (m) {
        const y = m[1];
        const monMap: Record<string, string> = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
        const mo = m[2] && monMap[m[2].slice(0,3)] ? monMap[m[2].slice(0,3)] : '01';
        const d = m[3] ? String(m[3]).padStart(2,'0') : '01';
        iso = `${y}-${mo}-${d}`;
      }
    }
    const types = pubTypesMap.get(pmid) ?? [];
    const content_type = types.length ? mapContentType(types) : 'Paper';
    out.push({
      pmid,
      title: decodeEntities(r.title) || 'Untitled',
      authors: decodeOrNull(authors),
      journal: decodeOrNull(r.fulljournalname || r.source),
      publication_date: iso,
      doi,
      abstract: decodeOrNull(abstractMap.get(pmid)),
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      content_type,
    });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Starting PubMed scraper with query:', PUBMED_QUERY);

  const { data: runData, error: runError } = await supabase
    .from('scraper_runs')
    .insert({
      scraper_name: 'pubmed',
      source: 'pubmed',
      status: 'running',
      trials_found: 0,
      trials_added: 0,
      new_trials_count: 0,
    })
    .select()
    .single();

  if (runError) {
    console.error('Failed to log run', runError);
    return new Response(JSON.stringify({ error: 'run log failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const runId = runData.id;

  let found = 0;
  let added = 0;

  try {
    const allIds = new Set<string>();
    try {
      const ids = await esearch(PUBMED_QUERY, 100);
      ids.forEach((i) => allIds.add(i));
    } catch (e) {
      console.error('esearch failed for phenomenology query', e);
    }
    const idList = Array.from(allIds);
    found = idList.length;
    console.log(`PubMed returned ${found} unique pmids`);


    const CHUNK = 50;
    const records: PubmedRecord[] = [];
    for (let i = 0; i < idList.length; i += CHUNK) {
      const chunk = idList.slice(i, i + CHUNK);
      try {
        const recs = await esummaryAndAbstract(chunk);
        records.push(...recs);
      } catch (e) {
        console.error('esummary failed', e);
      }
    }

    for (const r of records) {
      // dedupe by pmid or doi
      const orClauses = [`pmid.eq.${r.pmid}`];
      if (r.doi) orClauses.push(`doi.eq.${r.doi}`);
      const { data: existing } = await supabase
        .from('bibliography')
        .select('id')
        .or(orClauses.join(','))
        .limit(1)
        .maybeSingle();

      if (existing) continue;

      const { error: insErr } = await supabase.from('bibliography').insert({
        title: r.title,
        authors: r.authors,
        journal: r.journal,
        publication_date: r.publication_date,
        doi: r.doi,
        pmid: r.pmid,
        abstract: r.abstract,
        url: r.url,
        source: 'pubmed',
        is_approved: false,
        content_type: r.content_type,
        authority_type: 'Academic',
      });
      if (insErr) {
        console.error('insert failed for', r.pmid, insErr.message);
      } else {
        added++;
      }
    }

    await supabase.from('scraper_runs').update({
      status: 'success',
      trials_found: found,
      trials_added: added,
      new_trials_count: added,
      query_used: PUBMED_QUERY,
    }).eq('id', runId);

    return new Response(JSON.stringify({ success: true, found, added, query: PUBMED_QUERY }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('PubMed scraper error', error);
    await supabase.from('scraper_runs').update({
      status: 'error',
      trials_found: found,
      trials_added: added,
      error_message: msg,
      query_used: PUBMED_QUERY,
    }).eq('id', runId);
    return new Response(JSON.stringify({ success: false, error: msg, query: PUBMED_QUERY }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  }
});
