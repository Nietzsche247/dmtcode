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
  stance_unverified: boolean;
}

export type StanceBucket = 'all' | 'supportive' | 'balanced' | 'skeptical' | 'unverified';

export interface FilterState {
  contentType: string;
  authorityType: string;
  stance: StanceBucket;
  tag: string;
  year: string;
  person: string;
  search: string;
}

export const emptyFilters: FilterState = {
  contentType: 'all',
  authorityType: 'all',
  stance: 'all',
  tag: 'all',
  year: 'all',
  person: 'all',
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
