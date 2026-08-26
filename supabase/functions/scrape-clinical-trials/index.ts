import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { normaliseStatus, classify, extractCompounds } from '../_shared/trials.ts';
import { adminOrMachineAuthError } from '../_shared/cronAuth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-scrape-key',
};

interface TrialData {
  nctId: string;
  title: string;
  status: string; // normalised, always one of the nine allowed values
  statusMapped: boolean;
  phase: string;
  sponsor: string;
  locations: string;
  startDate: string;
  completionDate: string | null;
  url: string;
  relevance: 'core' | 'adjacent' | 'off_domain';
  compounds: string[];
  briefSummary: string | null;
}

interface WriteError {
  nctId: string;
  code: string;
  message: string;
}

// Query terms sent to the registry search.
// Deliberately narrow: bare "ketamine" and "psychedelic" pull thousands of
// perioperative / anaesthesia / analgesia studies.
const SEARCH_TERMS = [
  'DMT',
  'N,N-DMT',
  'psilocybin',
  'ayahuasca',
  '5-MeO-DMT',
  'ibogaine',
  'LSD',
  'MDMA',
];

// Normalize date from YYYY-MM to YYYY-MM-01 format
function normalizeDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const match = dateStr.match(/(\d{4})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-01`;
  return null;
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

  console.log('Starting ClinicalTrials.gov scraper...');
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
      trials_updated: 0,
      write_failures: 0,
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
  let writeFailures = 0;
  let unmappedStatuses = 0;
  const writeErrors: WriteError[] = [];

  try {
    const allTrials: TrialData[] = [];

    // Fetch trials for each compound
    for (const term of SEARCH_TERMS) {
      console.log(`Fetching trials for: ${term}`);

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
            const descriptionModule = protocolSection.descriptionModule;
            const armsModule = protocolSection.armsInterventionsModule;

            // Filter by start date >= 2024
            const startDateStr = statusModule?.startDateStruct?.date;
            if (startDateStr) {
              const startYear = parseInt(startDateStr.substring(0, 4));
              if (startYear < 2024) continue;
            }

            const briefTitle: string = identification?.briefTitle
              || identification?.officialTitle
              || 'Untitled Study';
            const briefSummary: string | null = descriptionModule?.briefSummary || null;
            const interventionNames: string[] = (armsModule?.interventions || [])
              .map((iv: { name?: string }) => iv?.name).filter(Boolean);

            const rawStatus: string = statusModule?.overallStatus || '';
            const { value: status, mapped } = normaliseStatus(rawStatus);
            if (!mapped) {
              unmappedStatuses++;
              console.warn(`Unmapped status "${rawStatus}" for ${identification?.nctId}`);
            }

            // Nothing is auto-rejected: everything fetched is stored with a
            // relevance verdict instead of being discarded.
            const classText = `${briefTitle} ${interventionNames.join(' ')} ${briefSummary || ''}`;
            const relevance = classify(classText);
            const compounds = extractCompounds(classText);

            const locations = contactsModule?.locations
              ?.slice(0, 3)
              ?.map((loc: { facility?: string; city?: string; country?: string }) =>
                [loc.facility, loc.city, loc.country].filter(Boolean).join(', '))
              .filter((s: string) => !!s)
              .join('; ') || null;

            const nctId = identification?.nctId || '';
            const phase = designModule?.phases?.length
              ? designModule.phases.map((p: string) => p.replace('PHASE', 'Phase ').replace(/_/g, ' ')).join(', ')
              : null;

            const trial: TrialData = {
              nctId,
              title: briefTitle,
              status,
              statusMapped: mapped,
              phase: phase || '',
              sponsor: sponsorModule?.leadSponsor?.name || '',
              locations: locations || '',
              startDate: normalizeDate(startDateStr) || '',
              completionDate: normalizeDate(statusModule?.completionDateStruct?.date),
              url: `https://clinicaltrials.gov/study/${nctId}`,
              relevance,
              compounds,
              briefSummary,
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

    const uniqueTrials = Array.from(
      new Map(allTrials.map(trial => [trial.nctId, trial])).values()
    );

    console.log(`Unique trials after deduplication: ${uniqueTrials.length}`);

    for (const trial of uniqueTrials) {
      const { data: existing } = await supabase
        .from('clinical_trials')
        .select('id, status')
        .eq('trial_registry_id', trial.nctId)
        .maybeSingle();

      if (existing) {
        // Only attempt an UPDATE when the NORMALISED status differs from the
        // stored one. Relevance and compounds ride along so a reopened or
        // closed trial also refreshes its classification.
        if (existing.status !== trial.status) {
          const { error: updateError } = await supabase
            .from('clinical_trials')
            .update({
              status: trial.status,
              relevance: trial.relevance,
              compounds: trial.compounds,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) {
            writeFailures++;
            writeErrors.push({
              nctId: trial.nctId,
              code: updateError.code || 'unknown',
              message: updateError.message || 'update failed',
            });
            console.error(`Update failed for ${trial.nctId}:`, updateError);
          } else {
            trialsUpdated++;
          }
        }
        continue;
      }

      // New trials land as unapproved so a human vets them before public list.
      const { error: insertError } = await supabase
        .from('clinical_trials')
        .insert({
          title: trial.title,
          description: trial.briefSummary,
          institution: trial.sponsor || null,
          principal_investigator: null,
          location: trial.locations || null,
          trial_type: trial.phase || null,
          start_date: trial.startDate || null,
          end_date: trial.completionDate,
          status: trial.status,
          trial_registry_id: trial.nctId,
          url: trial.url,
          relevance: trial.relevance,
          compounds: trial.compounds,
          is_approved: false,
        });

      if (insertError) {
        writeFailures++;
        writeErrors.push({
          nctId: trial.nctId,
          code: insertError.code || 'unknown',
          message: insertError.message || 'insert failed',
        });
        console.error(`Error inserting trial ${trial.nctId}:`, insertError);
      } else {
        trialsAdded++;
      }
    }

    // Final status: success only when every write landed.
    const finalStatus = writeFailures === 0 ? 'success' : 'partial';
    const errorMessage = writeErrors.length > 0
      ? writeErrors.slice(0, 5).map(e => `${e.nctId}: ${e.code} ${e.message}`).join(' | ')
      : null;

    // Send weekly email summary if configured
    let emailSent = false;
    if (resend && (trialsAdded > 0 || trialsUpdated > 0)) {
      emailSent = await sendWeeklyEmail(resend, trialsAdded, trialsUpdated, adminEmail);
    }

    // Update scraper run status
    await supabase
      .from('scraper_runs')
      .update({
        status: finalStatus,
        trials_found: trialsFound,
        trials_added: trialsAdded,
        trials_updated: trialsUpdated,
        new_trials_count: trialsAdded,
        write_failures: writeFailures,
        error_message: errorMessage,
        email_sent: emailSent,
      })
      .eq('id', runId);

    console.log(`Scraper completed: ${trialsAdded} added, ${trialsUpdated} updated, ${writeFailures} write failures, ${unmappedStatuses} unmapped statuses, out of ${trialsFound} found`);

    return new Response(
      JSON.stringify({
        success: writeFailures === 0,
        status: finalStatus,
        trialsFound,
        trialsAdded,
        trialsUpdated,
        writeFailures,
        unmappedStatuses,
        emailSent,
        message: `Processed ${trialsAdded} new + ${trialsUpdated} updated trials, ${writeFailures} write failures`,
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
        trials_updated: trialsUpdated,
        write_failures: writeFailures,
        error_message: errorMessage,
      })
      .eq('id', runId);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        trialsFound,
        trialsAdded,
        trialsUpdated,
        writeFailures,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
