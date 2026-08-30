export interface BibliographyRow {
  id: string;
  title: string;
  authors: string | null;
  journal: string | null;
  publication_date: string | null;
  doi: string | null;
  pmid: string | null;
  abstract: string | null;
  url: string | null;
  compounds: string[] | null;
  source: string;
  is_approved: boolean;
  content_type: string | null;
  authority_type: string | null;
  stance_score: number | null;
  tags: string[] | null;
  featured: boolean;
  summary: string | null;
  source_date: string | null;
  // Crossref verified. A journal issue date can sit months after the day a
  // paper became readable, so source_date alone cannot say whether the work
  // is available. Absent means unknown, never false.
  online_publication_date?: string | null;
  issue_date?: string | null;
  publication_status?: string | null;
  // How this source relates to the convergence claim, not how strong it is.
  // Only 2 of 236 records are a direct test, which is the single most useful
  // fact the library can tell a reader, so it is shown rather than buried.
  relation_to_core_question?: string | null;
  stance_unverified: boolean;
}

export const RELATION_LABELS: Record<string, string> = {
  direct_test: 'Direct test',
  mechanistic: 'Mechanistic',
  phenomenological_baseline: 'Phenomenological baseline',
  comparison_condition: 'Comparison condition',
  methodological: 'Methodological',
  historical: 'Historical',
  adjacent: 'Adjacent',
};

export const relationLabel = (v: string | null | undefined): string | null =>
  v ? (RELATION_LABELS[v] ?? v.replace(/_/g, ' ')) : null;

export type StanceBucket = 'all' | 'supportive' | 'balanced' | 'skeptical' | 'unverified';

export interface FilterState {
  contentType: string;
  authorityType: string;
  stance: StanceBucket;
  tag: string;
  year: string;
  person: string;
  relation: string;
  search: string;
}

export const emptyFilters: FilterState = {
  contentType: 'all',
  authorityType: 'all',
  stance: 'all',
  tag: 'all',
  year: 'all',
  person: 'all',
  relation: 'all',
  search: '',
};

export const KNOWN_PEOPLE = [
  'Goler',
  'Gallimore',
  'Strassman',
  'Davis',
  'Timmermann',
  'Luke',
  'Gomez Emilsson',
  'Hughes',
];

export const derivePeople = (row: BibliographyRow): string[] => {
  const found = new Set<string>();
  const hay = `${row.authors ?? ''} ${row.title ?? ''} ${row.summary ?? ''}`;
  for (const name of KNOWN_PEOPLE) {
    const re = new RegExp(`\\b${name.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (re.test(hay)) found.add(name);
  }
  if (row.authors) {
    row.authors
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 80)
      .forEach((s) => found.add(s));
  }
  return Array.from(found);
};
