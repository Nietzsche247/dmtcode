import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SEARCH_TERMS = [
  'N,N-DMT',
  'dimethyltryptamine',
  'ayahuasca',
  '5-MeO-DMT',
  'psilocybin',
  'psychedelic phenomenology',
];

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

  // crude abstract extraction per pmid
  const abstractMap = new Map<string, string>();
  const articleBlocks = xml.split(/<PubmedArticle>/).slice(1);
  for (const block of articleBlocks) {
    const pmidMatch = block.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    if (!pmidMatch) continue;
    const pmid = pmidMatch[1];
    const abs = Array.from(block.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g))
      .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
      .join('\n\n');
    if (abs) abstractMap.set(pmid, abs);
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
    out.push({
      pmid,
      title: r.title || 'Untitled',
      authors,
      journal: r.fulljournalname || r.source || null,
      publication_date: iso,
      doi,
      abstract: abstractMap.get(pmid) ?? null,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Starting PubMed scraper for terms:', SEARCH_TERMS.join(', '));

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
    for (const term of SEARCH_TERMS) {
      try {
        const ids = await esearch(term, 50);
        ids.forEach((i) => allIds.add(i));
      } catch (e) {
        console.error('esearch failed for', term, e);
      }
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
        is_approved: true,
        content_type: 'Paper',
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
    }).eq('id', runId);

    return new Response(JSON.stringify({ success: true, found, added }), {
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
    }).eq('id', runId);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
