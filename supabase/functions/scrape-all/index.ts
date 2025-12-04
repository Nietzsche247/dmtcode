import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= CONFIGURATION =============

const CLINICAL_TRIALS_COMPOUNDS = [
  'DMT', 'N,N-DMT', 'psilocybin', 'ayahuasca', '5-MeO-DMT', 
  'ibogaine', 'LSD', 'MDMA', 'ketamine', 'salvinorin A'
];

const PUBMED_QUERY = '(psychedelic OR DMT OR psilocybin OR LSD OR MDMA OR ayahuasca OR ibogaine OR ketamine)';

// ============= HELPERS =============

function normalizeDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const match = dateStr.match(/(\d{4})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-01`;
  return null;
}

function mapTrialStatus(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('recruiting') && !s.includes('not')) return 'recruiting';
  if (s.includes('not yet recruiting')) return 'planned';
  if (s.includes('active')) return 'active';
  if (s.includes('completed') || s.includes('terminated') || s.includes('withdrawn')) return 'completed';
  return 'planned';
}

function detectCompound(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('psilocybin')) return 'Psilocybin';
  if (t.includes('ketamine')) return 'Ketamine';
  if (t.includes('mdma')) return 'MDMA';
  if (t.includes('lsd') || t.includes('lysergic')) return 'LSD';
  if (t.includes('dmt') || t.includes('dimethyltryptamine')) return 'DMT';
  if (t.includes('ayahuasca')) return 'Ayahuasca';
  if (t.includes('5-meo-dmt')) return '5-MeO-DMT';
  if (t.includes('ibogaine')) return 'Ibogaine';
  if (t.includes('salvinorin')) return 'Salvinorin A';
  return 'Psychedelic';
}

function hasLaserOrGlyphMention(text: string): boolean {
  const t = text.toLowerCase();
  return t.includes('laser') || t.includes('glyph') || t.includes('symbol') || t.includes('650nm') || t.includes('650 nm');
}

// ============= SOURCE 1: CLINICALTRIALS.GOV =============

async function scrapeClinicalTrials(supabase: any): Promise<{ added: number; updated: number; found: number }> {
  console.log('📊 Scraping ClinicalTrials.gov...');
  let added = 0, updated = 0, found = 0;

  for (const term of CLINICAL_TRIALS_COMPOUNDS) {
    try {
      const statusFilter = 'RECRUITING,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING';
      const apiUrl = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(term)}&filter.overallStatus=${statusFilter}&pageSize=100&format=json`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) continue;

      const data = await response.json();
      console.log(`  Found ${data.studies?.length || 0} studies for ${term}`);

      for (const study of data.studies || []) {
        const proto = study.protocolSection;
        if (!proto) continue;

        const startDateStr = proto.statusModule?.startDateStruct?.date;
        if (startDateStr && parseInt(startDateStr.substring(0, 4)) < 2024) continue;

        found++;
        const nctId = proto.identificationModule?.nctId;
        const title = proto.identificationModule?.officialTitle || proto.identificationModule?.briefTitle || 'Untitled';
        const status = mapTrialStatus(proto.statusModule?.overallStatus || '');
        const compound = detectCompound(title + ' ' + (proto.conditionsModule?.conditions || []).join(' '));

        const { data: existing } = await supabase
          .from('clinical_trials')
          .select('id, status')
          .eq('trial_registry_id', nctId)
          .maybeSingle();

        if (existing) {
          if (existing.status !== status) {
            await supabase.from('clinical_trials').update({ status, updated_at: new Date().toISOString() }).eq('id', existing.id);
            updated++;
          }
        } else {
          const { error } = await supabase.from('clinical_trials').insert({
            title,
            description: `Phase: ${proto.designModule?.phases?.join(', ') || 'N/A'} | Sponsor: ${proto.sponsorCollaboratorsModule?.leadSponsor?.name || 'Unknown'} | Compound: ${compound}`,
            institution: proto.sponsorCollaboratorsModule?.leadSponsor?.name || 'Unknown',
            start_date: normalizeDate(startDateStr) || new Date().toISOString().split('T')[0],
            end_date: normalizeDate(proto.statusModule?.completionDateStruct?.date),
            status,
            trial_registry_id: nctId,
            url: `https://clinicaltrials.gov/study/${nctId}`,
            is_approved: true,
          });
          if (!error) added++;
        }
      }
    } catch (e) {
      console.error(`Error fetching ${term}:`, e);
    }
  }

  console.log(`✅ ClinicalTrials.gov: ${added} added, ${updated} updated`);
  return { added, updated, found };
}

// ============= SOURCE 2: PUBMED =============

async function scrapePubMed(supabase: any): Promise<{ added: number; found: number }> {
  console.log('📚 Scraping PubMed...');
  let added = 0, found = 0;

  try {
    // Get last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const minDate = weekAgo.toISOString().split('T')[0].replace(/-/g, '/');
    const maxDate = new Date().toISOString().split('T')[0].replace(/-/g, '/');

    // Search PubMed
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(PUBMED_QUERY)}&mindate=${minDate}&maxdate=${maxDate}&datetype=pdat&retmax=100&retmode=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const pmids = searchData.esearchresult?.idlist || [];
    
    console.log(`  Found ${pmids.length} PubMed articles`);
    found = pmids.length;

    if (pmids.length === 0) return { added, found };

    // Fetch details
    const detailsUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`;
    const detailsRes = await fetch(detailsUrl);
    const xmlText = await detailsRes.text();

    // Parse XML - simple regex extraction
    const articles = xmlText.split('<PubmedArticle>').slice(1);
    
    for (const article of articles) {
      try {
        const pmidMatch = article.match(/<PMID[^>]*>(\d+)<\/PMID>/);
        const titleMatch = article.match(/<ArticleTitle>([^<]+)<\/ArticleTitle>/);
        const abstractMatch = article.match(/<AbstractText[^>]*>([^<]+)<\/AbstractText>/);
        const journalMatch = article.match(/<Title>([^<]+)<\/Title>/);
        const doiMatch = article.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
        const yearMatch = article.match(/<Year>(\d{4})<\/Year>/);
        const monthMatch = article.match(/<Month>(\d{1,2})<\/Month>/);
        
        // Extract authors
        const authorMatches = article.match(/<LastName>([^<]+)<\/LastName>\s*<ForeName>([^<]+)<\/ForeName>/g) || [];
        const authors = authorMatches.slice(0, 5).map(a => {
          const lastName = a.match(/<LastName>([^<]+)<\/LastName>/)?.[1] || '';
          const foreName = a.match(/<ForeName>([^<]+)<\/ForeName>/)?.[1] || '';
          return `${lastName} ${foreName.charAt(0)}`;
        }).join(', ');

        const pmid = pmidMatch?.[1];
        const title = titleMatch?.[1]?.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        
        if (!pmid || !title) continue;

        // Check if exists
        const { data: existing } = await supabase
          .from('bibliography')
          .select('id')
          .eq('pmid', pmid)
          .maybeSingle();

        if (existing) continue;

        const pubDate = yearMatch?.[1] && monthMatch?.[1] 
          ? `${yearMatch[1]}-${monthMatch[1].padStart(2, '0')}-01` 
          : null;

        const compounds = CLINICAL_TRIALS_COMPOUNDS.filter(c => 
          (title + ' ' + (abstractMatch?.[1] || '')).toLowerCase().includes(c.toLowerCase())
        );

        const { error } = await supabase.from('bibliography').insert({
          title,
          authors: authors || null,
          journal: journalMatch?.[1] || null,
          publication_date: pubDate,
          doi: doiMatch?.[1] || null,
          pmid,
          abstract: abstractMatch?.[1]?.substring(0, 2000) || null,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          compounds: compounds.length > 0 ? compounds : null,
          source: 'pubmed',
        });

        if (!error) added++;
      } catch (e) {
        console.error('Error parsing article:', e);
      }
    }
  } catch (e) {
    console.error('PubMed error:', e);
  }

  console.log(`✅ PubMed: ${added} added`);
  return { added, found };
}

// ============= SOURCE 3: PSYCHEDELIC ALPHA RSS =============

async function scrapePsychedelicAlpha(supabase: any): Promise<{ added: number; found: number }> {
  console.log('🔮 Scraping Psychedelic Alpha...');
  let added = 0, found = 0;

  try {
    // Psychedelic Alpha Horizon Tracker RSS
    const rssUrl = 'https://psychedelicalpha.com/feed';
    const res = await fetch(rssUrl);
    const xml = await res.text();

    const items = xml.split('<item>').slice(1);
    found = items.length;
    console.log(`  Found ${found} Psychedelic Alpha items`);

    for (const item of items) {
      const titleMatch = item.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>|<title>([^<]+)<\/title>/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);
      const descMatch = item.match(/<description><!\[CDATA\[([^\]]+)\]\]><\/description>|<description>([^<]+)<\/description>/);

      const title = (titleMatch?.[1] || titleMatch?.[2])?.trim();
      const link = linkMatch?.[1]?.trim();
      
      if (!title || !link) continue;

      // Check if exists by URL
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('url', link)
        .maybeSingle();

      if (existing) continue;

      const pubDate = pubDateMatch?.[1] ? new Date(pubDateMatch[1]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const description = (descMatch?.[1] || descMatch?.[2])?.substring(0, 500) || '';

      const { error } = await supabase.from('events').insert({
        title,
        description: description.replace(/<[^>]+>/g, '').substring(0, 500),
        event_date: pubDate,
        event_type: 'news',
        url: link,
        organizer: 'Psychedelic Alpha',
        is_approved: true,
      });

      if (!error) added++;
    }
  } catch (e) {
    console.error('Psychedelic Alpha error:', e);
  }

  console.log(`✅ Psychedelic Alpha: ${added} added`);
  return { added, found };
}

// ============= SOURCE 4: EROWID EXPERIENCE VAULTS =============

async function scrapeErowid(supabase: any): Promise<{ added: number; found: number; flagged: number }> {
  console.log('🌿 Scraping Erowid Experience Vaults...');
  let added = 0, found = 0, flagged = 0;

  try {
    // Erowid Experience Vaults RSS
    const rssUrl = 'https://erowid.org/experiences/rss/experiences.rss';
    const res = await fetch(rssUrl);
    const xml = await res.text();

    const items = xml.split('<item>').slice(1);
    found = items.length;
    console.log(`  Found ${found} Erowid items`);

    for (const item of items) {
      const titleMatch = item.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>|<title>([^<]+)<\/title>/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);
      const descMatch = item.match(/<description><!\[CDATA\[([^\]]+)\]\]><\/description>|<description>([^<]+)<\/description>/);

      const title = (titleMatch?.[1] || titleMatch?.[2])?.trim();
      const link = linkMatch?.[1]?.trim();
      const description = (descMatch?.[1] || descMatch?.[2]) || '';
      
      if (!title || !link) continue;

      // Check for laser/glyph mentions
      const hasFlag = hasLaserOrGlyphMention(title + ' ' + description);
      if (hasFlag) flagged++;

      // Check if exists
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('url', link)
        .maybeSingle();

      if (existing) continue;

      const pubDate = pubDateMatch?.[1] ? new Date(pubDateMatch[1]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('events').insert({
        title: hasFlag ? `⚠️ ${title}` : title,
        description: description.replace(/<[^>]+>/g, '').substring(0, 500),
        event_date: pubDate,
        event_type: 'experience_report',
        url: link,
        organizer: 'Erowid',
        erowid_flag: hasFlag,
        is_approved: true,
      });

      if (!error) added++;
    }
  } catch (e) {
    console.error('Erowid error:', e);
  }

  console.log(`✅ Erowid: ${added} added, ${flagged} flagged with laser/glyph mentions`);
  return { added, found, flagged };
}

// ============= SOURCE 5: RETREAT GURU =============

async function scrapeRetreatGuru(supabase: any): Promise<{ added: number; found: number }> {
  console.log('🏔️ Scraping Retreat Guru...');
  let added = 0, found = 0;

  try {
    // Retreat Guru RSS - psychedelic retreats
    const rssUrl = 'https://retreat.guru/feed/retreats';
    const res = await fetch(rssUrl);
    const xml = await res.text();

    const items = xml.split('<item>').slice(1);
    found = items.length;
    console.log(`  Found ${found} Retreat Guru items`);

    for (const item of items) {
      const titleMatch = item.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>|<title>([^<]+)<\/title>/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      const descMatch = item.match(/<description><!\[CDATA\[([^\]]+)\]\]><\/description>|<description>([^<]+)<\/description>/);

      const title = (titleMatch?.[1] || titleMatch?.[2])?.trim();
      const link = linkMatch?.[1]?.trim();
      const description = (descMatch?.[1] || descMatch?.[2]) || '';
      
      if (!title || !link) continue;

      // Only include psychedelic-related retreats
      const isPsychedelic = /ayahuasca|psilocybin|dmt|ibogaine|san pedro|peyote|mushroom|psychedelic/i.test(title + description);
      if (!isPsychedelic) continue;

      // Check if exists
      const { data: existing } = await supabase
        .from('retreats')
        .select('id')
        .eq('website_url', link)
        .maybeSingle();

      if (existing) continue;

      // Extract location from description if possible
      const locationMatch = description.match(/(?:in|at|located)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);

      const { error } = await supabase.from('retreats').insert({
        name: title,
        description: description.replace(/<[^>]+>/g, '').substring(0, 1000),
        location: locationMatch?.[1] || 'Various Locations',
        website_url: link,
        tags: ['psychedelic', 'retreat'],
        is_approved: true,
      });

      if (!error) added++;
    }
  } catch (e) {
    console.error('Retreat Guru error:', e);
  }

  console.log(`✅ Retreat Guru: ${added} added`);
  return { added, found };
}

// ============= EMAIL SUMMARY =============

async function sendWeeklySummary(
  resend: Resend | null, 
  adminEmail: string,
  results: {
    clinicalTrials: { added: number; updated: number; found: number };
    pubmed: { added: number; found: number };
    psychedelicAlpha: { added: number; found: number };
    erowid: { added: number; found: number; flagged: number };
    retreatGuru: { added: number; found: number };
  }
): Promise<boolean> {
  if (!resend || !adminEmail) {
    console.log('No email config, skipping summary');
    return false;
  }

  const totalAdded = results.clinicalTrials.added + results.pubmed.added + 
    results.psychedelicAlpha.added + results.erowid.added + results.retreatGuru.added;
  const totalFound = results.clinicalTrials.found + results.pubmed.found + 
    results.psychedelicAlpha.found + results.erowid.found + results.retreatGuru.found;

  try {
    await resend.emails.send({
      from: 'DMT Code <notifications@resend.dev>',
      to: [adminEmail],
      subject: `🔬 Weekly Scraper: ${totalAdded} new items from 5 sources`,
      html: `
        <h1>Weekly Psychedelic Data Firehose Summary</h1>
        <p>Scraped ${totalFound} items, added ${totalAdded} new entries.</p>
        
        <h2>📊 ClinicalTrials.gov</h2>
        <ul>
          <li>Found: ${results.clinicalTrials.found}</li>
          <li>Added: ${results.clinicalTrials.added}</li>
          <li>Updated: ${results.clinicalTrials.updated}</li>
        </ul>
        <p><a href="https://dmtcode.com/events">View Trials →</a></p>
        
        <h2>📚 PubMed (last 7 days)</h2>
        <ul>
          <li>Found: ${results.pubmed.found}</li>
          <li>Added: ${results.pubmed.added}</li>
        </ul>
        <p><a href="https://dmtcode.com/bibliography">View Bibliography →</a></p>
        
        <h2>🔮 Psychedelic Alpha</h2>
        <ul>
          <li>Found: ${results.psychedelicAlpha.found}</li>
          <li>Added: ${results.psychedelicAlpha.added}</li>
        </ul>
        
        <h2>🌿 Erowid Experience Vaults</h2>
        <ul>
          <li>Found: ${results.erowid.found}</li>
          <li>Added: ${results.erowid.added}</li>
          <li><strong>⚠️ Flagged (laser/glyph): ${results.erowid.flagged}</strong></li>
        </ul>
        
        <h2>🏔️ Retreat Guru</h2>
        <ul>
          <li>Found: ${results.retreatGuru.found}</li>
          <li>Added: ${results.retreatGuru.added}</li>
        </ul>
        <p><a href="https://dmtcode.com/events">View Retreats →</a></p>
        
        <hr>
        <p><a href="https://dmtcode.com/admin">View Admin Dashboard →</a></p>
        <p style="color: #666; font-size: 12px;">DMT Code Project - Automated weekly scraper</p>
      `,
    });
    return true;
  } catch (e) {
    console.error('Email error:', e);
    return false;
  }
}

// ============= MAIN HANDLER =============

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const resend = resendApiKey ? new Resend(resendApiKey) : null;

  let adminEmail = '';
  try {
    const body = await req.json();
    adminEmail = body?.adminEmail || '';
  } catch {}

  console.log('🚀 Starting psychedelic data firehose scraper...');
  console.log(`   Compounds: ${CLINICAL_TRIALS_COMPOUNDS.join(', ')}`);

  // Log scraper start
  const { data: runData } = await supabase
    .from('scraper_runs')
    .insert({
      scraper_name: 'psychedelic_firehose',
      status: 'running',
      source: 'all',
      trials_found: 0,
      trials_added: 0,
    })
    .select()
    .single();

  const runId = runData?.id;

  try {
    // Run all scrapers
    const clinicalTrials = await scrapeClinicalTrials(supabase);
    const pubmed = await scrapePubMed(supabase);
    const psychedelicAlpha = await scrapePsychedelicAlpha(supabase);
    const erowid = await scrapeErowid(supabase);
    const retreatGuru = await scrapeRetreatGuru(supabase);

    const results = { clinicalTrials, pubmed, psychedelicAlpha, erowid, retreatGuru };

    // Send email
    const emailSent = await sendWeeklySummary(resend, adminEmail, results);

    // Calculate totals
    const totalAdded = clinicalTrials.added + pubmed.added + psychedelicAlpha.added + erowid.added + retreatGuru.added;
    const totalFound = clinicalTrials.found + pubmed.found + psychedelicAlpha.found + erowid.found + retreatGuru.found;

    // Update run status
    if (runId) {
      await supabase.from('scraper_runs').update({
        status: 'success',
        trials_found: totalFound,
        trials_added: totalAdded,
        new_trials_count: totalAdded,
        email_sent: emailSent,
      }).eq('id', runId);
    }

    console.log(`\n🎉 Scraper complete! Total: ${totalAdded} added from ${totalFound} found`);

    return new Response(JSON.stringify({
      success: true,
      totalFound,
      totalAdded,
      emailSent,
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Scraper error:', error);

    if (runId) {
      await supabase.from('scraper_runs').update({
        status: 'error',
        error_message: errorMessage,
      }).eq('id', runId);
    }

    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
