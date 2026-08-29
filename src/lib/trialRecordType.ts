// Hard record types for clinical_trials.record_type. Mirrors the CHECK
// constraint in the database and the label map in
// netlify/edge-functions/content-prerender.ts. Edit all three together.
export const TRIAL_RECORD_TYPES = [
  'registered_clinical_trial',
  'registered_observational_study',
  'academic_experiment',
  'published_pilot_report',
  'community_experiment',
  'citizen_science_project',
  'reported_replication',
  'platform_project',
  'media_claim',
  'rumored_report',
  'retreat_or_facilitated_session',
] as const;

const LABELS: Record<string, string> = {
  registered_clinical_trial: 'Registered clinical trial',
  registered_trial: 'Registered clinical trial',
  registered_observational_study: 'Registered observational study',
  academic_experiment: 'Academic experiment',
  published_pilot_report: 'Published pilot report',
  community_experiment: 'Community experiment',
  citizen_science_project: 'Citizen science project',
  reported_replication: 'Reported replication',
  platform_project: 'Platform project',
  media_claim: 'Media claim',
  rumored_report: 'Rumoured report',
  retreat_or_facilitated_session: 'Retreat or facilitated session',
  internal_session: 'Community record',
};

export const recordTypeLabel = (v: string | null | undefined): string => {
  const k = (v ?? '').trim();
  return LABELS[k] ?? (k ? k.replace(/_/g, ' ') : 'Untyped record');
};

// Only registered clinical trials carry clinical authority anywhere on the site.
export const isRegisteredClinicalTrial = (v: string | null | undefined): boolean =>
  v === 'registered_clinical_trial' || v === 'registered_trial';
