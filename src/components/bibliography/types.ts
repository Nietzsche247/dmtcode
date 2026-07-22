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
  search: string;
}

export const emptyFilters: FilterState = {
  contentType: 'all',
  authorityType: 'all',
  stance: 'all',
  tag: 'all',
  year: 'all',
  search: '',
};
