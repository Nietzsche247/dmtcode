// Verification and relevance vocab for events. Mirrors the CHECK constraints
// in the database and the label map in content-prerender.ts.
export const EVENT_VERIFICATION = [
  'verified',
  'organizer_confirmed',
  'public_source_confirmed',
  'auto_discovered_candidate',
  'unverified',
  'cancelled',
  'past_outcome_unknown',
] as const;

export const EVENT_RELEVANCE = [
  'direct_dmtcode',
  'research',
  'educational',
  'experiential',
  'community',
  'cultural_adjacent',
] as const;

const VER_LABELS: Record<string, string> = {
  verified: 'Verified',
  organizer_confirmed: 'Organizer confirmed',
  public_source_confirmed: 'Public source confirmed',
  auto_discovered_candidate: 'Auto-discovered, not yet verified',
  unverified: 'Unverified',
  cancelled: 'Cancelled',
  past_outcome_unknown: 'Past, outcome unknown',
};

const REL_LABELS: Record<string, string> = {
  direct_dmtcode: 'Direct DMT Code',
  research: 'Research',
  educational: 'Educational',
  experiential: 'Experiential',
  community: 'Community',
  cultural_adjacent: 'Cultural, adjacent',
};

export const verificationLabel = (v: string | null | undefined): string | null =>
  v ? (VER_LABELS[v] ?? v.replace(/_/g, ' ')) : null;

export const relevanceLabel = (v: string | null | undefined): string | null =>
  v ? (REL_LABELS[v] ?? v.replace(/_/g, ' ')) : null;

// Scrapers used to write their status into the description text. The status
// field carries it now, so the prefix is stripped at render time.
export const stripAutoPrefix = (s: string | null | undefined): string | null =>
  s ? s.replace(/^\s*\[Auto-discovered\]\s*/i, '') : (s ?? null);
