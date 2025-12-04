import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrialData {
  nctId: string;
  title: string;
  status: string;
  phase: string;
  sponsor: string;
  locations: string;
  startDate: string;
  completionDate: string | null;
  compound: string;
  url: string;
}

// Psychedelic compounds to search
const SEARCH_TERMS = [
  'DMT',
  'N,N-DMT',
  'psilocybin',
  'ayahuasca',
  '5-MeO-DMT',
  'ibogaine',
  'LSD',
  'MDMA'
];

// Map ClinicalTrials.gov status to our status
function mapStatus(overallStatus: string): string {
  const statusLower = overallStatus.toLowerCase();
  if (statusLower.includes('recruiting') && !statusLower.includes('not')) return 'recruiting';
  if (statusLower.includes('not yet recruiting')) return 'planned';
  if (statusLower.includes('active')) return 'active';
  if (statusLower.includes('completed')) return 'completed';
  if (statusLower.includes('terminated') || statusLower.includes('withdrawn')) return 'completed';
  return 'planned';
}

// Normalize date from YYYY-MM to YYYY-MM-01 format
function normalizeDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  // If date is YYYY-MM format, append -01
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    return `${dateStr}-01`;
  }
  // If date is already YYYY-MM-DD, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  // Try to extract YYYY-MM from formats like "2025-06" or "June 2025"
  const match = dateStr.match(/(\d{4})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-01`;
  }
  return null;
}

// Detect compound from study data
function detectCompound(title: string, conditions: string[]): string {
  const text = `${title} ${conditions.join(' ')}`.toLowerCase();
  if (text.includes('psilocybin')) return 'Psilocybin';
  if (text.includes('dmt') || text.includes('n,n-dmt') || text.includes('dimethyltryptamine')) return 'DMT';
  if (text.includes('ayahuasca')) return 'Ayahuasca';
  if (text.includes('5-meo-dmt')) return '5-MeO-DMT';
  if (text.includes('ibogaine')) return 'Ibogaine';
  if (text.includes('lsd') || text.includes('lysergic')) return 'LSD';
  if (text.includes('mdma')) return 'MDMA';
  return 'Psychedelic';
}

async function sendWeeklyEmail(resend: Resend, trialsAdded: number, trialsUpdated: number, adminEmail: string) {
  if (!adminEmail) {
    console.log('No admin email configured, skipping email notification');
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: 'DMT Code <notifications@resend.dev>',
      to: [adminEmail],
      subject: `Clinical Trials Update: ${trialsAdded} new trials this week`,
      html: `
        <h1>Weekly Clinical Trials Summary</h1>
        <p>The automated scraper has completed its weekly run.</p>
        <ul>
          <li><strong>${trialsAdded}</strong> new trials added</li>
          <li><strong>${trialsUpdated}</strong> trials updated</li>
        </ul>
        <p>View the full timeline at <a href="https://dmtcode.com/events">dmtcode.com/events</a></p>
        <p>Manage trials in the <a href="https://dmtcode.com/admin">Admin Dashboard</a></p>
        <hr>
        <p style="color: #666; font-size: 12px;">DMT Code Project - Automated notification</p>
      `,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return false;
    }
    
    console.log('Weekly summary email sent successfully');
    return true;
  } catch (err) {
    console.error('Email sending error:', err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const resend = resendApiKey ? new Resend(resendApiKey) : null;

  // Parse request body for optional admin email
  let adminEmail = '';
  try {
    const body = await req.json();
    adminEmail = body?.adminEmail || '';
  } catch {
    // No body or invalid JSON, continue without admin email
  }

  console.log('Starting ClinicalTrials.gov scraper with enhanced filters...');
  console.log(`Searching for: ${SEARCH_TERMS.join(', ')}`);

  // Log scraper start
  const { data: runData, error: runError } = await supabase
    .from('scraper_runs')
    .insert({
      scraper_name: 'clinicaltrials_gov',
      status: 'running',
      trials_found: 0,
      trials_added: 0,
      new_trials_count: 0,
    })
    .select()
    .single();

  if (runError) {
    console.error('Error logging scraper run:', runError);
    return new Response(JSON.stringify({ error: 'Failed to log scraper run' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const runId = runData.id;
  let trialsFound = 0;
  let trialsAdded = 0;
  let trialsUpdated = 0;

  try {
    const allTrials: TrialData[] = [];

    // Fetch trials for each compound
    for (const term of SEARCH_TERMS) {
      console.log(`Fetching trials for: ${term}`);
      
      // Use ClinicalTrials.gov v2 API with filters
      // Filter: recruiting, active, or not yet recruiting
      // Start date >= 2024
      const statusFilter = 'RECRUITING,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING';
      const apiUrl = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(term)}&filter.overallStatus=${statusFilter}&pageSize=100&format=json`;
      
      try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.error(`Failed to fetch trials for ${term}: ${response.statusText}`);
          continue;
        }

        const data = await response.json();
        console.log(`Found ${data.studies?.length || 0} studies for ${term}`);

        if (data.studies && Array.isArray(data.studies)) {
          for (const study of data.studies) {
            const protocolSection = study.protocolSection;
            if (!protocolSection) continue;

            const identification = protocolSection.identificationModule;
            const statusModule = protocolSection.statusModule;
            const sponsorModule = protocolSection.sponsorCollaboratorsModule;
            const designModule = protocolSection.designModule;
            const contactsModule = protocolSection.contactsLocationsModule;
            const conditionsModule = protocolSection.conditionsModule;

            // Filter by start date >= 2024
            const startDateStr = statusModule?.startDateStruct?.date;
            if (startDateStr) {
              const startYear = parseInt(startDateStr.substring(0, 4));
              if (startYear < 2024) {
                continue; // Skip older trials
              }
            }

            const overallStatus = statusModule?.overallStatus || 'UNKNOWN';
            const mappedStatus = mapStatus(overallStatus);

            // Extract locations
            const locations = contactsModule?.locations
              ?.slice(0, 3) // Limit to first 3 locations
              ?.map((loc: any) => `${loc.city || ''}, ${loc.country || ''}`)
              .filter((loc: string) => loc.trim() !== ',')
              .join('; ') || 'Not specified';

            // Detect compound from title and conditions
            const conditions = conditionsModule?.conditions || [];
            const compound = detectCompound(
              identification?.officialTitle || identification?.briefTitle || '',
              conditions
            );

            const nctId = identification?.nctId || '';
            
            const trial: TrialData = {
              nctId,
              title: identification?.officialTitle || identification?.briefTitle || 'Untitled Study',
              status: mappedStatus,
              phase: designModule?.phases?.join(', ') || 'Not specified',
              sponsor: sponsorModule?.leadSponsor?.name || 'Unknown',
              locations,
              startDate: normalizeDate(startDateStr) || new Date().toISOString().split('T')[0],
              completionDate: normalizeDate(statusModule?.completionDateStruct?.date),
              compound,
              url: `https://clinicaltrials.gov/study/${nctId}`,
            };

            if (trial.nctId) {
              allTrials.push(trial);
            }
          }
        }
      } catch (fetchError) {
        console.error(`Error fetching ${term}:`, fetchError);
        continue;
      }
    }

    trialsFound = allTrials.length;
    console.log(`Total trials found: ${trialsFound}`);

    // Remove duplicates by NCT ID
    const uniqueTrials = Array.from(
      new Map(allTrials.map(trial => [trial.nctId, trial])).values()
    );

    console.log(`Unique trials after deduplication: ${uniqueTrials.length}`);

    // Upsert trials into database
    for (const trial of uniqueTrials) {
      // Check if trial already exists
      const { data: existing } = await supabase
        .from('clinical_trials')
        .select('id, status')
        .eq('trial_registry_id', trial.nctId)
        .maybeSingle();

      if (existing) {
        // Update existing trial if status changed
        if (existing.status !== trial.status) {
          const { error: updateError } = await supabase
            .from('clinical_trials')
            .update({
              status: trial.status,
              title: trial.title,
              description: `Phase: ${trial.phase} | Sponsor: ${trial.sponsor} | Compound: ${trial.compound}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (!updateError) {
            trialsUpdated++;
            console.log(`Updated trial ${trial.nctId} - status changed to ${trial.status}`);
          }
        }
        continue;
      }

      // Insert new trial
      const { error: insertError } = await supabase
        .from('clinical_trials')
        .insert({
          title: trial.title,
          description: `Phase: ${trial.phase} | Sponsor: ${trial.sponsor} | Compound: ${trial.compound}`,
          institution: trial.sponsor,
          principal_investigator: null,
          start_date: trial.startDate,
          end_date: trial.completionDate,
          status: trial.status,
          trial_registry_id: trial.nctId,
          url: trial.url,
          is_approved: true, // Auto-approve scraped trials
        });

      if (insertError) {
        console.error(`Error inserting trial ${trial.nctId}:`, insertError);
      } else {
        trialsAdded++;
        console.log(`Successfully added trial: ${trial.nctId} (${trial.compound})`);
      }
    }

    // Send weekly email summary if configured
    let emailSent = false;
    if (resend && (trialsAdded > 0 || trialsUpdated > 0)) {
      emailSent = await sendWeeklyEmail(resend, trialsAdded, trialsUpdated, adminEmail);
    }

    // Update scraper run status
    await supabase
      .from('scraper_runs')
      .update({
        status: 'success',
        trials_found: trialsFound,
        trials_added: trialsAdded,
        new_trials_count: trialsAdded,
        email_sent: emailSent,
      })
      .eq('id', runId);

    console.log(`Scraper completed: ${trialsAdded} added, ${trialsUpdated} updated out of ${trialsFound} found`);

    return new Response(
      JSON.stringify({
        success: true,
        trialsFound,
        trialsAdded,
        trialsUpdated,
        emailSent,
        message: `Successfully processed ${trialsAdded} new + ${trialsUpdated} updated trials`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Scraper error:', error);

    // Update scraper run with error
    await supabase
      .from('scraper_runs')
      .update({
        status: 'error',
        trials_found: trialsFound,
        trials_added: trialsAdded,
        error_message: errorMessage,
      })
      .eq('id', runId);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        trialsFound,
        trialsAdded,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
