import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
}

const SUBSTANCES = ['DMT', 'psilocybin', 'LSD', 'MDMA', 'ayahuasca', 'ibogaine', '5-MeO-DMT'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Starting ClinicalTrials.gov scraper...');

  // Log scraper start
  const { data: runData, error: runError } = await supabase
    .from('scraper_runs')
    .insert({
      scraper_name: 'clinicaltrials_gov',
      status: 'running',
      trials_found: 0,
      trials_added: 0,
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

  try {
    const allTrials: TrialData[] = [];

    // Fetch trials for each substance
    for (const substance of SUBSTANCES) {
      console.log(`Fetching trials for: ${substance}`);
      
      const apiUrl = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(substance)}&pageSize=100&format=json`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        console.error(`Failed to fetch trials for ${substance}: ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      console.log(`Found ${data.studies?.length || 0} studies for ${substance}`);

      if (data.studies && Array.isArray(data.studies)) {
        for (const study of data.studies) {
          const protocolSection = study.protocolSection;
          if (!protocolSection) continue;

          const identification = protocolSection.identificationModule;
          const statusModule = protocolSection.statusModule;
          const sponsorModule = protocolSection.sponsorCollaboratorsModule;
          const designModule = protocolSection.designModule;
          const contactsModule = protocolSection.contactsLocationsModule;

          // Map ClinicalTrials.gov status to our status
          const overallStatus = statusModule?.overallStatus || 'UNKNOWN';
          let mappedStatus = 'planned';
          if (overallStatus.includes('RECRUITING')) mappedStatus = 'recruiting';
          else if (overallStatus.includes('ACTIVE')) mappedStatus = 'active';
          else if (overallStatus.includes('COMPLETED')) mappedStatus = 'completed';

          // Extract locations
          const locations = contactsModule?.locations
            ?.map((loc: any) => `${loc.facility || ''}, ${loc.city || ''}, ${loc.country || ''}`)
            .filter((loc: string) => loc.trim() !== ', ,')
            .join('; ') || 'Not specified';

          const trial: TrialData = {
            nctId: identification?.nctId || '',
            title: identification?.officialTitle || identification?.briefTitle || 'Untitled Study',
            status: mappedStatus,
            phase: designModule?.phases?.join(', ') || 'Not specified',
            sponsor: sponsorModule?.leadSponsor?.name || 'Unknown',
            locations: locations,
            startDate: statusModule?.startDateStruct?.date || new Date().toISOString().split('T')[0],
            completionDate: statusModule?.completionDateStruct?.date || null,
          };

          if (trial.nctId) {
            allTrials.push(trial);
          }
        }
      }
    }

    trialsFound = allTrials.length;
    console.log(`Total trials found: ${trialsFound}`);

    // Remove duplicates by NCT ID
    const uniqueTrials = Array.from(
      new Map(allTrials.map(trial => [trial.nctId, trial])).values()
    );

    console.log(`Unique trials after deduplication: ${uniqueTrials.length}`);

    // Insert trials into database (skip if already exists)
    for (const trial of uniqueTrials) {
      // Check if trial already exists
      const { data: existing } = await supabase
        .from('clinical_trials')
        .select('id')
        .eq('trial_registry_id', trial.nctId)
        .single();

      if (existing) {
        console.log(`Trial ${trial.nctId} already exists, skipping`);
        continue;
      }

      // Insert new trial
      const { error: insertError } = await supabase
        .from('clinical_trials')
        .insert({
          title: trial.title,
          description: `Phase: ${trial.phase} | Sponsor: ${trial.sponsor}`,
          institution: trial.sponsor,
          principal_investigator: null,
          start_date: trial.startDate,
          end_date: trial.completionDate,
          status: trial.status,
          trial_registry_id: trial.nctId,
          url: `https://clinicaltrials.gov/study/${trial.nctId}`,
          is_approved: true, // Auto-approve scraped trials
        });

      if (insertError) {
        console.error(`Error inserting trial ${trial.nctId}:`, insertError);
      } else {
        trialsAdded++;
        console.log(`Successfully added trial: ${trial.nctId}`);
      }
    }

    // Update scraper run status
    await supabase
      .from('scraper_runs')
      .update({
        status: 'success',
        trials_found: trialsFound,
        trials_added: trialsAdded,
      })
      .eq('id', runId);

    console.log(`Scraper completed: ${trialsAdded} trials added out of ${trialsFound} found`);

    return new Response(
      JSON.stringify({
        success: true,
        trialsFound,
        trialsAdded,
        message: `Successfully scraped and added ${trialsAdded} new trials`,
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
