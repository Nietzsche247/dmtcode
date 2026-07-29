export type TimelineDate = {
  year: number;
  month?: number;
  day?: number;
  precision: 'year' | 'month' | 'day';
  sort_key: string;
};

export type TimelinePerson = { name: string; sort: string };

export type TimelinePlace = { label: string; country: string };

export type TimelineSource = {
  kind: string;
  title?: string;
  authors?: string[];
  container?: string;
  volume?: string;
  pages?: string;
  publisher?: string;
  year?: number;
  doi?: string;
  isbn?: string;
  url?: string;
  citation?: string;
  note?: string;
};

export type TimelineEntryRecord = {
  id: string;
  date: TimelineDate;
  headline: string;
  summary: string;
  people?: TimelinePerson[];
  place?: TimelinePlace;
  tags: string[];
  evidence_class: string;
  source: TimelineSource;
};

export type TimelineFile = {
  schema_version: string;
  schema_url?: string;
  provenance: { verified_on: string; verified_against: string; rule: string };
  title: { headline: string; text: string };
  evidence_classes: Record<string, string>;
  entries: TimelineEntryRecord[];
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const EVIDENCE_LABEL: Record<string, string> = {
  peer_reviewed: 'Peer reviewed',
  book: 'Book',
  legal: 'Legal',
  letters: 'Letters',
  journalism: 'Journalism',
  commentary: 'Commentary',
  platform_record: 'Platform record',
  community_report: 'Community report',
};

export const EVIDENCE_ORDER = [
  'peer_reviewed',
  'letters',
  'book',
  'legal',
  'journalism',
  'commentary',
  'platform_record',
  'community_report',
];

export function formatEntryDate(d: TimelineDate): string {
  if (d.precision === 'day' && d.month && d.day) {
    return `${d.day} ${MONTHS[d.month - 1]} ${d.year}`;
  }
  if (d.precision === 'month' && d.month) {
    return `${MONTHS[d.month - 1]} ${d.year}`;
  }
  return String(d.year);
}

export function byDate(a: TimelineEntryRecord, b: TimelineEntryRecord): number {
  return a.date.sort_key.localeCompare(b.date.sort_key);
}

export function sourceLink(s: TimelineSource): string | null {
  if (s.doi) return `https://doi.org/${s.doi}`;
  if (s.url) return s.url;
  return null;
}

export async function loadTimeline(): Promise<TimelineFile> {
  const res = await fetch('/timeline.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`timeline.json responded ${res.status}`);
  return res.json();
}

export function searchText(e: TimelineEntryRecord): string {
  return [
    e.headline,
    e.summary,
    e.id,
    ...(e.people ?? []).map((p) => p.name),
    e.place?.label ?? '',
    ...e.tags,
    e.source.title ?? '',
    ...(e.source.authors ?? []),
    e.source.container ?? '',
    e.source.publisher ?? '',
    e.source.citation ?? '',
    e.source.note ?? '',
  ].join(' ').toLowerCase();
}
