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

// A registered study of either kind. These are the only records that may show a
// principal investigator, mirroring the trials_pi_only_on_sourced_types
// constraint on the database.
export const isRegisteredStudy = (v: string | null | undefined): boolean =>
  isRegisteredClinicalTrial(v) || v === 'registered_observational_study';

export const piMayRender = isRegisteredStudy;

// Schema.org type by record type. MedicalStudy asserts a medical study exists.
// Emitting it for a media claim tells every crawler something untrue.
export const trialSchemaType = (v: string | null | undefined): string => {
  if (isRegisteredStudy(v)) return 'MedicalStudy';
  if (v === 'published_pilot_report' || v === 'academic_experiment') return 'ScholarlyArticle';
  return 'CreativeWork';
};

// "View trial record" pointing at someone's personal site frames it as a trial.
export const trialLinkLabel = (v: string | null | undefined): string =>
  isRegisteredStudy(v) ? 'View trial record' : 'View source';

// The index is not a clinical trials list, so neither is the breadcrumb parent.
export const TRIALS_PARENT_LABEL = 'Trials, Studies & Experiments';

// Record types whose verification state is the first thing a reader needs.
export const needsVerificationBadge = (v: string | null | undefined): boolean =>
  v === 'media_claim' ||
  v === 'rumored_report' ||
  v === 'reported_replication' ||
  v === 'community_experiment' ||
  v === 'citizen_science_project';
