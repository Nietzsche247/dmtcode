import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fetchWithRetry(url: string): Promise<Response | null> {
  return fetch(url)
    .then(async (r) => {
      if (r.status === 404) return r;
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r;
    })
    .catch(async () => {
      await sleep(500);
      try {
        const r2 = await fetch(url);
        return r2;
      } catch {
        return null;
      }
    });
}

function pickPhase(phases: string[] | undefined): string | null {
  if (!phases || !phases.length) return null;
  const cleaned = phases
    .map((p) => p.replace('PHASE', 'Phase ').replace(/_/g, ' ').trim())
    .filter(Boolean)
    .join(', ');
  return cleaned || null;
}

// ClinicalTrials.gov returns markdown-escaped punctuation (e.g. "1\." or "\>").
function unescapeRegistryText(s: string | undefined | null): string | null {
  if (!s) return null;
  return s.replace(/\\([^A-Za-z0-9\s])/g, '$1');
}

const STATUS_MAP: Record<string, string> = {
  RECRUITING: 'recruiting',
  NOT_YET_RECRUITING: 'planned',
  ACTIVE_NOT_RECRUITING: 'active',
  ENROLLING_BY_INVITATION: 'enrolling by invitation',
  COMPLETED: 'completed',
  TERMINATED: 'terminated',
  SUSPENDED: 'suspended',
  WITHDRAWN: 'withdrawn',
  UNKNOWN: 'unknown',
};


function buildLocation(locs: any[] | undefined): string | null {
  if (!locs || !locs.length) return null;
  const parts = locs.slice(0, 3).map((l) => {
    const bits = [l.facility, l.city, l.country].filter(Boolean);
    return bits.join(', ');
  }).filter(Boolean);
  if (!parts.length) return null;
  const extra = locs.length - 3;
  return extra > 0 ? `${parts.join('; ')}; and ${extra} more` : parts.join('; ');
}

function buildEligibilityHeader(elig: any): string {
  const bits: string[] = [];
  const minA = elig?.minimumAge;
  const maxA = elig?.maximumAge;
  if (minA || maxA) {
    if (minA && maxA) bits.push(`Ages: ${minA} to ${maxA}`);
    else if (minA) bits.push(`Ages: ${minA} and up`);
    else if (maxA) bits.push(`Ages: up to ${maxA}`);
  }
  if (elig?.sex) bits.push(`Sex: ${elig.sex}`);
  return bits.join(' | ');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Auth: verify JWT and require admin role
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace('Bearer ', '');
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userId = claims.claims.sub as string;

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: isAdmin, error: roleErr } = await admin.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });
  if (roleErr || !isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Select approved rows with strict NCT ids
  const { data: rows, error: selErr } = await admin
    .from('clinical_trials')
    .select('id, trial_registry_id, title')
    .eq('is_approved', true)
    .filter('trial_registry_id', 'match', '^NCT[0-9]{8}$');

  if (selErr) {
    return new Response(JSON.stringify({ error: selErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const targets = rows ?? [];
  const total = targets.length;

  const { data: runRow, error: runErr } = await admin
    .from('trial_backfill_runs')
    .insert({ run_by: userId, total, updated: 0, not_found: 0, failed: 0 })
    .select('id')
    .single();
  if (runErr) {
    return new Response(JSON.stringify({ error: runErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const runId = runRow.id;

  let updated = 0;
  let notFound = 0;
  let failed = 0;
  const titleMismatches: Array<{ nct: string; stored_title: string; registry_title: string }> = [];
  const errors: Array<{ nct: string; error: string }> = [];

  const CHUNK = 5;
  for (let i = 0; i < targets.length; i += CHUNK) {
    const batch = targets.slice(i, i + CHUNK);
    await Promise.all(batch.map(async (row) => {
      const nct = row.trial_registry_id as string;
      try {
        const resp = await fetchWithRetry(`https://clinicaltrials.gov/api/v2/studies/${nct}`);
        if (!resp) { failed++; errors.push({ nct, error: 'fetch failed' }); return; }
        if (resp.status === 404) {
          notFound++;
          await admin.from('clinical_trials')
            .update({ confirmed_status: 'Unverified' })
            .eq('id', row.id);
          return;
        }
        if (!resp.ok) { failed++; errors.push({ nct, error: `HTTP ${resp.status}` }); return; }
        const data = await resp.json();
        const ps = data?.protocolSection;
        if (!ps) { failed++; errors.push({ nct, error: 'no protocolSection' }); return; }

        const ident = ps.identificationModule ?? {};
        const desc = ps.descriptionModule ?? {};
        const status = ps.statusModule ?? {};
        const sponsor = ps.sponsorCollaboratorsModule ?? {};
        const elig = ps.eligibilityModule ?? {};
        const contacts = ps.contactsLocationsModule ?? {};
        const design = ps.designModule ?? {};

        const briefTitle: string | undefined = ident.briefTitle;
        const officialTitle: string | undefined = ident.officialTitle;
        const briefSummary = unescapeRegistryText(desc.briefSummary);
        const overallStatus: string | undefined = status.overallStatus;
        const startDate: string | undefined = status.startDateStruct?.date;
        const endDate: string | undefined = status.completionDateStruct?.date;
        const leadSponsor: string | undefined = sponsor.leadSponsor?.name;
        const eligCriteria = unescapeRegistryText(elig.eligibilityCriteria);
        const overallOfficial = contacts.overallOfficials?.[0];
        const piName: string | undefined = overallOfficial?.name;
        const locStr = buildLocation(contacts.locations);
        const phase = pickPhase(design.phases);

        // Compose eligibility with header line
        let eligibilityText: string | null = null;
        if (eligCriteria) {
          const header = buildEligibilityHeader(elig);
          eligibilityText = header ? `${header}\n\n${eligCriteria}` : eligCriteria;
        }

        const update: Record<string, unknown> = {
          confirmed_status: 'Confirmed',
          url: `https://clinicaltrials.gov/study/${nct}`,
          updated_at: new Date().toISOString(),
        };
        if (briefSummary) update.description = briefSummary;
        if (eligibilityText) update.eligibility = eligibilityText;
        if (piName) update.principal_investigator = piName;
        if (leadSponsor) update.institution = leadSponsor;
        update.location = locStr;

        if (overallStatus) {
          const mapped = STATUS_MAP[overallStatus];
          if (mapped) {
            update.status = mapped;
          } else {
            errors.push({ nct, error: `unmapped overallStatus: ${overallStatus}` });
          }
        }

        if (startDate) {
          const d = /^\d{4}-\d{2}$/.test(startDate) ? `${startDate}-01` : startDate;
          if (/^\d{4}-\d{2}-\d{2}$/.test(d)) update.start_date = d;
        }
        if (endDate) {
          const d = /^\d{4}-\d{2}$/.test(endDate) ? `${endDate}-01` : endDate;
          if (/^\d{4}-\d{2}-\d{2}$/.test(d)) update.end_date = d;
        }
        // Phase goes to its own column, never to trial_type (which is the record taxonomy).
        update.phase = phase;

        // Title handling: if the stored title matches NEITHER officialTitle NOR briefTitle,
        // it's a stale snapshot: overwrite with officialTitle (fallback briefTitle) and record.
        const storedNorm = (row.title || '').trim().toLowerCase();
        const brief = (briefTitle || '').trim();
        const official = (officialTitle || '').trim();
        const matchesRegistry =
          (brief && storedNorm === brief.toLowerCase()) ||
          (official && storedNorm === official.toLowerCase());
        if (!matchesRegistry && (official || brief)) {
          const newTitle = official || brief;
          update.title = newTitle;
          titleMismatches.push({ nct, stored_title: row.title, registry_title: newTitle });
        } else if (brief && row.title && brief !== row.title.trim() && !official) {
          // Informational: stored differs from briefTitle only; do not overwrite.
          titleMismatches.push({ nct, stored_title: row.title, registry_title: brief });
        }

        const { error: upErr } = await admin
          .from('clinical_trials')
          .update(update)
          .eq('id', row.id);
        if (upErr) {
          failed++;
          errors.push({ nct, error: upErr.message });
          return;
        }
        updated++;

      } catch (e) {
        failed++;
        errors.push({ nct, error: e instanceof Error ? e.message : 'unknown' });
      }
    }));
    await sleep(300);
  }

  await admin
    .from('trial_backfill_runs')
    .update({
      finished_at: new Date().toISOString(),
      updated,
      not_found: notFound,
      failed,
      title_mismatches: titleMismatches,
      errors: errors.slice(0, 200),
    })
    .eq('id', runId);

  return new Response(
    JSON.stringify({
      success: true,
      runId,
      total,
      updated,
      not_found: notFound,
      failed,
      title_mismatch_count: titleMismatches.length,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
