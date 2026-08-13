import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FunnelDrilldown, type DrilldownSource } from './FunnelDrilldown';

type Row = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' ? v : '');

const mailto = (r: Row) => (str(r.email) ? `mailto:${str(r.email)}` : null);

// Only entity kinds that have a real detail route on this site are linked.
const FOLLOW_PATHS: Record<string, (id: string) => string> = {
  symbol: (id) => `/registry/${id}`,
  trial: (id) => `/trials/${id}`,
  event: (id) => `/events/${id}`,
  retreat: (id) => `/retreats/${id}`,
  article: (id) => `/articles/${id}`,
  theory: (id) => `/theories/${id}`,
  protocol: (id) => `/protocols/${id}`,
};

const SOURCES: Record<string, DrilldownSource[]> = {
  accounts: [
    {
      table: 'profiles',
      label: 'Accounts created',
      select: 'id, handle, display_name, symbol_count, created_at',
      primary: (r: Row) => str(r.handle) || str(r.display_name) || 'Anonymous account',
      secondary: (r: Row) => `${Number(r.symbol_count ?? 0)} symbols contributed`,
      preview: (r: Row) => [
        { label: 'handle', value: str(r.handle) || 'not set' },
        { label: 'symbols', value: String(Number(r.symbol_count ?? 0)) },
        { label: 'account id', value: String(r.id ?? '') },
      ],
    },
  ],
  emails: [
    {
      table: 'waitlist',
      label: 'General waitlist',
      select: 'id, email, source, created_at',
      primary: (r: Row) => str(r.email),
      secondary: (r: Row) => (str(r.source) ? `source: ${str(r.source)}` : null),
      href: mailto,
      preview: (r: Row) => [
        { label: 'email', value: str(r.email) || 'unknown' },
        { label: 'source', value: str(r.source) || 'unspecified' },
      ],
    },
    {
      table: 'product_signups',
      label: 'Kit signups',
      select: 'id, email, bundle_slug, notified_at, created_at',
      primary: (r: Row) => str(r.email),
      secondary: (r: Row) => `kit: ${str(r.bundle_slug) || 'unspecified'}`,
      href: mailto,
      preview: (r: Row) => [
        { label: 'email', value: str(r.email) || 'unknown' },
        { label: 'kit', value: str(r.bundle_slug) || 'unspecified' },
        { label: 'notified', value: str(r.notified_at) ? 'yes' : 'no' },
      ],
    },
  ],
  contributions: [
    {
      table: 'symbol_submissions',
      label: 'Symbol submissions',
      select: 'id, description, moderation_status, visibility_status, evidence_status, created_at',
      primary: (r: Row) => str(r.description).slice(0, 90) || 'Untitled symbol',
      secondary: (r: Row) =>
        `${str(r.moderation_status) || 'unreviewed'}, ${str(r.visibility_status) || 'private'}`,
      to: (r: Row) => `/registry/${String(r.id)}`,
      preview: (r: Row) => [
        { label: 'moderation', value: str(r.moderation_status) || 'unreviewed' },
        { label: 'visibility', value: str(r.visibility_status) || 'private' },
        { label: 'evidence', value: str(r.evidence_status) || 'community report' },
      ],
    },
    {
      table: 'registry_glyphs',
      label: 'Registry glyphs',
      select: 'id, source, perceived_surface, free_text_notes, created_at',
      primary: (r: Row) => str(r.free_text_notes).slice(0, 90) || 'Registry glyph',
      secondary: (r: Row) =>
        [str(r.source), str(r.perceived_surface)].filter(Boolean).join(', ') || null,
      preview: (r: Row) => [
        { label: 'source', value: str(r.source) || 'unspecified' },
        { label: 'surface', value: str(r.perceived_surface) || 'unspecified' },
        { label: 'glyph id', value: String(r.id ?? '') },
      ],
    },
  ],
  attention: [
    {
      table: 'trial_watchlist',
      label: 'Trials watched',
      select: 'id, trial_id, email, created_at',
      primary: (r: Row) => `Trial ${String(r.trial_id).slice(0, 8)}`,
      secondary: (r: Row) => str(r.email) || null,
      to: (r: Row) => `/trials/${String(r.trial_id)}`,
      preview: (r: Row) => [
        { label: 'trial id', value: String(r.trial_id ?? '') },
        { label: 'watcher', value: str(r.email) || 'signed-in account' },
      ],
    },
    {
      table: 'follows',
      label: 'Follows',
      select: 'id, entity_type, entity_id, created_at',
      primary: (r: Row) => `${str(r.entity_type) || 'entity'} followed`,
      secondary: (r: Row) => String(r.entity_id),
      to: (r: Row) => FOLLOW_PATHS[str(r.entity_type)]?.(String(r.entity_id)) ?? null,
      preview: (r: Row) => [
        { label: 'type', value: str(r.entity_type) || 'unknown' },
        { label: 'entity id', value: String(r.entity_id ?? '') },
      ],
    },
  ],
};


type WindowKey = '7d' | '30d' | 'all';

const WINDOWS: { key: WindowKey; label: string; days: number | null }[] = [
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: 'all', label: 'All time', days: null },
];

interface KitRow {
  slug: string;
  name: string;
  count: number;
}

interface WindowData {
  start: Date | null;
  end: Date;
  accounts: number | null;
  waitlist: number | null;
  signups: number | null;
  kits: KitRow[];
  submissions: number | null;
  glyphs: number | null;
  watchlist: number | null;
  follows: number | null;
}

const fmt = (d: Date) =>
  d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

// Returns a count, or null when the read fails (RLS or otherwise) so the row can be omitted.
async function countOf(table: string, since: Date | null): Promise<number | null> {
  let q = supabase.from(table as never).select('*', { count: 'exact', head: true });
  if (since) q = q.gte('created_at', since.toISOString());
  const { count, error } = await q;
  if (error) return null;
  return count ?? 0;
}

async function kitInterest(since: Date | null): Promise<KitRow[]> {
  let q = supabase.from('product_signups').select('bundle_slug, created_at');
  if (since) q = q.gte('created_at', since.toISOString());
  const [{ data: signups, error }, { data: bundles }] = await Promise.all([
    q,
    supabase.from('bundles').select('slug, name'),
  ]);
  if (error || !signups) return [];
  const names = new Map((bundles ?? []).map((b) => [b.slug, b.name]));
  const tally = new Map<string, number>();
  for (const s of signups) {
    if (!s.bundle_slug) continue;
    tally.set(s.bundle_slug, (tally.get(s.bundle_slug) ?? 0) + 1);
  }
  return Array.from(tally.entries())
    .map(([slug, count]) => ({ slug, name: names.get(slug) ?? slug, count }))
    .sort((a, b) => b.count - a.count);
}

async function loadWindow(days: number | null): Promise<WindowData> {
  const end = new Date();
  const start = days === null ? null : new Date(Date.now() - days * 86400000);
  const [accounts, waitlist, signups, kits, submissions, glyphs, watchlist, follows] =
    await Promise.all([
      countOf('profiles', start),
      countOf('waitlist', start),
      countOf('product_signups', start),
      kitInterest(start),
      countOf('symbol_submissions', start),
      countOf('registry_glyphs', start),
      countOf('trial_watchlist', start),
      countOf('follows', start),
    ]);
  return { start, end, accounts, waitlist, signups, kits, submissions, glyphs, watchlist, follows };
}

const StatRow = ({
  label,
  value,
  caption,
  onClick,
}: {
  label: string;
  value: number;
  caption?: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left flex items-start justify-between gap-4 p-3 bg-muted rounded-lg hover:bg-muted/70 transition-colors"
  >
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
    </div>
    <span className="flex items-center gap-1">
      <span className="text-lg font-semibold tabular-nums">{value.toLocaleString()}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </span>
  </button>
);

const WindowSection = ({ label, data }: { label: string; data: WindowData }) => {
  const [drill, setDrill] = useState<{ title: string; sources: DrilldownSource[] } | null>(null);
  const emails = (data.waitlist ?? 0) + (data.signups ?? 0);
  const emailsReadable = data.waitlist !== null || data.signups !== null;
  const contributions = (data.submissions ?? 0) + (data.glyphs ?? 0);
  const contributionsReadable = data.submissions !== null || data.glyphs !== null;
  const attention = (data.watchlist ?? 0) + (data.follows ?? 0);
  const attentionReadable = data.watchlist !== null || data.follows !== null;
  const kitTotal = data.kits.reduce((n, k) => n + k.count, 0);

  const open = (title: string, sources: DrilldownSource[]) => setDrill({ title, sources });

  const rows = [
    data.accounts ? (
      <StatRow
        key="accounts"
        label="Accounts created"
        value={data.accounts}
        onClick={() => open('Accounts created', SOURCES.accounts)}
      />
    ) : null,
    emailsReadable && emails > 0 ? (
      <StatRow
        key="emails"
        label="Emails captured"
        value={emails}
        caption={`${data.waitlist ?? 0} general waitlist, ${data.signups ?? 0} kit signups`}
        onClick={() => open('Emails captured', SOURCES.emails)}
      />
    ) : null,
    contributionsReadable && contributions > 0 ? (
      <StatRow
        key="contributions"
        label="Contributions"
        value={contributions}
        caption={`${data.submissions ?? 0} symbol submissions, ${data.glyphs ?? 0} registry glyphs`}
        onClick={() => open('Contributions', SOURCES.contributions)}
      />
    ) : null,
    attentionReadable && attention > 0 ? (
      <StatRow
        key="attention"
        label="Watching and following"
        value={attention}
        caption={`${data.watchlist ?? 0} trials watched, ${data.follows ?? 0} follows`}
        onClick={() => open('Watching and following', SOURCES.attention)}
      />
    ) : null,
  ].filter(Boolean);

  if (rows.length === 0 && kitTotal === 0) return null;

  const kitSource = (slug?: string, name?: string): DrilldownSource[] => [
    {
      table: 'product_signups',
      label: name ? `${name} signups` : 'All kit signups',
      select: 'id, email, bundle_slug, notified_at, created_at',
      eq: slug ? { column: 'bundle_slug', value: slug } : undefined,
      primary: (r) => (typeof r.email === 'string' ? r.email : 'Unknown email'),
      secondary: (r) => `kit: ${typeof r.bundle_slug === 'string' ? r.bundle_slug : 'unspecified'}`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>
          actions recorded between {data.start ? fmt(data.start) : 'the first record'} and{' '}
          {fmt(data.end)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {kitTotal > 0 && (
          <div className="p-4 rounded-lg border-2 border-primary/40 bg-primary/5 space-y-3">
            <button
              type="button"
              onClick={() => open('Kit interest', kitSource())}
              className="w-full flex items-baseline justify-between hover:opacity-80 transition-opacity"
            >
              <p className="text-sm font-semibold uppercase tracking-wide">Kit interest</p>
              <span className="flex items-center gap-1">
                <span className="text-2xl font-bold tabular-nums">{kitTotal.toLocaleString()}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </span>
            </button>
            <div className="space-y-2">
              {data.kits.map((k) => (
                <button
                  key={k.slug}
                  type="button"
                  onClick={() => open(`${k.name} signups`, kitSource(k.slug, k.name))}
                  className="w-full flex items-center justify-between gap-4 rounded-md px-1 py-0.5 hover:bg-primary/10 transition-colors"
                >
                  <span className="text-sm">{k.name}</span>
                  <Badge variant="secondary">{k.count.toLocaleString()}</Badge>
                </button>
              ))}
            </div>
          </div>
        )}
        {rows}
      </CardContent>

      <FunnelDrilldown
        open={drill !== null}
        onOpenChange={(o) => !o && setDrill(null)}
        title={drill?.title ?? ''}
        description={`${label}: records between ${
          data.start ? fmt(data.start) : 'the first record'
        } and ${fmt(data.end)}`}
        since={data.start}
        sources={drill?.sources ?? []}
      />
    </Card>
  );
};


export const ConversionFunnel = () => {
  const [data, setData] = useState<Record<WindowKey, WindowData> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const results = await Promise.all(WINDOWS.map((w) => loadWindow(w.days)));
      if (!active) return;
      setData({ '7d': results[0], '30d': results[1], all: results[2] });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        This site does not track visitors, so there is no visit count to convert from. These are
        consented actions users actually took.
      </p>
      {loading && <p className="text-sm text-muted-foreground">Loading recorded actions.</p>}
      {data &&
        WINDOWS.map((w) => <WindowSection key={w.key} label={w.label} data={data[w.key]} />)}
    </div>
  );
};
