// Shared clinical-trials logic. Single source of truth for status
// normalisation, relevance classification, and compound extraction.
// Deterministic term lists in TypeScript, never prompt instructions.

// ---------------------------------------------------------------------------
// Status normalisation
// ---------------------------------------------------------------------------
// Maps the full ClinicalTrials.gov v2 overallStatus enum onto the nine values
// allowed by the clinical_trials_status_check constraint. Never returns a
// value outside the nine. mapped:false means the raw enum was not recognised
// and must be counted and reported by the caller, not swallowed.

const STATUS_MAP: Record<string, string> = {
  RECRUITING: 'recruiting',
  ENROLLING_BY_INVITATION: 'enrolling by invitation',
  NOT_YET_RECRUITING: 'planned',
  ACTIVE_NOT_RECRUITING: 'active',
  COMPLETED: 'completed',
  SUSPENDED: 'suspended',
  TERMINATED: 'terminated',
  WITHDRAWN: 'withdrawn',
};

export function normaliseStatus(raw: string): { value: string; mapped: boolean } {
  const key = (raw || '').trim().toUpperCase();
  const mapped = Object.prototype.hasOwnProperty.call(STATUS_MAP, key);
  return { value: mapped ? STATUS_MAP[key] : 'unknown', mapped };
}

// ---------------------------------------------------------------------------
// Term lists (AND-gate, shared with the site-wide classifier)
// ---------------------------------------------------------------------------

// DMT family: any hit returns core, ungated.
const DMT_FAMILY = [
  'dmt',
  'n,n-dmt',
  '5-meo-dmt',
  'dimethyltryptamine',
  'ayahuasca',
  'harmine',
  'harmaline',
  'harmala',
  'psilocybin',
  'psilocin',
  'lsd',
  'lysergic',
  'mescaline',
  'peyote',
  'ibogaine',
  'iboga',
];

// Other psychedelics: only qualify when paired with a perceptual context.
const OTHER_PSYCHEDELIC = [
  'ketamine',
  'esketamine',
  'mdma',
  'salvinorin',
  'salvia divinorum',
  'cannabis',
  'thc',
  'nitrous oxide',
  'dextromethorphan',
];

const PERCEPTUAL = [
  'visual',
  'hallucin',
  'phenomenolog',
  'perception',
  'perceptual',
  'imagery',
  'entity',
  'geometr',
  'altered state',
  'consciousness',
  'self-awareness',
  'ego dissolution',
  'mystical',
  'subjective experience',
  'dream',
  'psychedelic experience',
];

// Whole-token matching: a term must not be preceded or followed by a word
// character or a hyphen, so "lsd" does not fire inside "lsd-1" or another
// word, and "dmt" does not fire inside "5-meo-dmt".
function tokenRegex(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, 'i');
}

const DMT_FAMILY_RE = DMT_FAMILY.map(tokenRegex);
const OTHER_PSYCHEDELIC_RE = OTHER_PSYCHEDELIC.map(tokenRegex);
const PERCEPTUAL_RE = PERCEPTUAL.map(tokenRegex);

function anyMatch(res: RegExp[], text: string): boolean {
  for (const re of res) {
    if (re.test(text)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Relevance classification
// ---------------------------------------------------------------------------
// text is title plus intervention names plus brief summary. Matching is
// case-insensitive. Nothing is auto-rejected; the verdict is stored.

export type TrialRelevance = 'core' | 'adjacent' | 'off_domain';

export function classify(text: string): TrialRelevance {
  const t = (text || '').toLowerCase();
  if (anyMatch(DMT_FAMILY_RE, t)) return 'core';
  if (anyMatch(OTHER_PSYCHEDELIC_RE, t) && anyMatch(PERCEPTUAL_RE, t)) return 'adjacent';
  return 'off_domain';
}

// ---------------------------------------------------------------------------
// Compound extraction
// ---------------------------------------------------------------------------
// Returns the canonical compound names found in the text. Alias groups keep
// synonyms (psilocin -> Psilocybin, esketamine -> Ketamine, lysergic -> LSD)
// from duplicating a row's tags.

const COMPOUND_GROUPS: { name: string; aliases: RegExp[] }[] = [
  { name: 'N,N-DMT', aliases: ['dmt', 'n,n-dmt', 'dimethyltryptamine'].map(tokenRegex) },
  { name: '5-MeO-DMT', aliases: ['5-meo-dmt'].map(tokenRegex) },
  { name: 'Ayahuasca', aliases: ['ayahuasca', 'harmine', 'harmaline', 'harmala'].map(tokenRegex) },
  { name: 'Psilocybin', aliases: ['psilocybin', 'psilocin'].map(tokenRegex) },
  { name: 'LSD', aliases: ['lsd', 'lysergic'].map(tokenRegex) },
  { name: 'Mescaline', aliases: ['mescaline', 'peyote'].map(tokenRegex) },
  { name: 'Ibogaine', aliases: ['ibogaine', 'iboga'].map(tokenRegex) },
  { name: 'Ketamine', aliases: ['ketamine', 'esketamine'].map(tokenRegex) },
  { name: 'MDMA', aliases: ['mdma'].map(tokenRegex) },
  { name: 'Salvinorin A', aliases: ['salvinorin', 'salvia divinorum'].map(tokenRegex) },
  { name: 'Cannabis', aliases: ['cannabis', 'thc'].map(tokenRegex) },
  { name: 'Nitrous oxide', aliases: ['nitrous oxide'].map(tokenRegex) },
  { name: 'Dextromethorphan', aliases: ['dextromethorphan'].map(tokenRegex) },
];

export function extractCompounds(text: string): string[] {
  const t = (text || '').toLowerCase();
  const out: string[] = [];
  for (const group of COMPOUND_GROUPS) {
    if (anyMatch(group.aliases, t)) out.push(group.name);
  }
  return out;
}
