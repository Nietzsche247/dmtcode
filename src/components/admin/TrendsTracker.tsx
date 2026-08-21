import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/**
 * Trends tracker. Reads rows written by the trends-ingest edge function.
 * It never recomputes anything: the tracker and the ingest function are the
 * single source for these numbers.
 */

interface TrendsRun {
  id: string;
  run_date: string;
  received_at: string;
  metrics_count: number;
  media_new: number;
  media_updated: number;
  media_total: number;
}

interface TrendsMetric {
  id: number;
  run_date: string;
  source: string;
  keyword: string;
  keyword_group: string | null;
  last7: number | null;
  prior7: number | null;
  delta_pct: number | null;
  anchor_ratio: number | null;
  peak_date: string | null;
  peak_val: number | null;
  last28: number | null;
  prior28: number | null;
  delta28_pct: number | null;
}

interface MediaItem {
  id: string;
  kind: string;
  title: string;
  channel: string | null;
  published_raw: string | null;
  url: string | null;
  views: number | null;
  views_gain: number | null;
  first_seen: string;
}

const KIND_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'video', label: 'Videos' },
  { key: 'podcast', label: 'Podcasts' },
  { key: 'article', label: 'Articles' },
  { key: 'thread', label: 'Threads' },
];

const fmt = (n: number | null | undefined) =>
  n === null || n === undefined ? '' : Math.round(n).toLocaleString();

function DeltaCell({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span>-</span>;
  const cls =
    value >= 25 ? 'text-emerald-600 dark:text-emerald-400'
      : value <= -25 ? 'text-destructive'
        : 'text-foreground';
  const sign = value > 0 ? '+' : '';
  return <span className={cls}>{`${sign}${value.toFixed(1)}%`}</span>;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="text-muted-foreground">-</span>;
  const w = 80;
  const h = 20;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (w - 2) + 1;
      const y = h - 1 - ((v - min) / span) * (h - 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export const TrendsTracker = () => {
  const [kind, setKind] = useState('all');
  const [newOnly, setNewOnly] = useState(false);

  const runsQ = useQuery({
    queryKey: ['trends-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trends_runs')
        .select('*')
        .order('run_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TrendsRun[];
    },
  });

  const metricsQ = useQuery({
    queryKey: ['trends-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trends_metrics')
        .select('*')
        .order('run_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TrendsMetric[];
    },
  });

  const mediaQ = useQuery({
    queryKey: ['trends-media'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_items')
        .select('id, kind, title, channel, published_raw, url, views, views_gain, first_seen')
        .order('views_gain', { ascending: false, nullsFirst: false })
        .order('first_seen', { ascending: false })
        .order('views', { ascending: false, nullsFirst: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as MediaItem[];
    },
  });

  const runs = runsQ.data ?? [];
  const metrics = useMemo(() => metricsQ.data ?? [], [metricsQ.data]);
  const latestDate = runs[0]?.run_date ?? null;

  const gtrendsLatest = useMemo(() => {
    if (!latestDate) return [];
    return metrics
      .filter((m) => m.source === 'gtrends' && m.run_date === latestDate)
      .sort((a, b) => {
        const g = (a.keyword_group ?? '').localeCompare(b.keyword_group ?? '');
        if (g !== 0) return g;
        return (b.last7 ?? 0) - (a.last7 ?? 0);
      });
  }, [metrics, latestDate]);

  const historyByKeyword = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const m of metrics) {
      if (m.source !== 'gtrends' || m.last7 === null) continue;
      const list = map.get(m.keyword) ?? [];
      list.push(Number(m.last7));
      map.set(m.keyword, list);
    }
    return map;
  }, [metrics]);

  const wikiRow = useMemo(
    () =>
      latestDate
        ? metrics.find((m) => m.source === 'wikipedia' && m.run_date === latestDate) ?? null
        : null,
    [metrics, latestDate],
  );

  const suggestGroups = useMemo(() => {
    const rows = metrics.filter((m) => m.source === 'suggest_new');
    const map = new Map<string, TrendsMetric[]>();
    for (const r of rows) {
      const list = map.get(r.run_date) ?? [];
      list.push(r);
      map.set(r.run_date, list);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [metrics]);

  const media = useMemo(() => {
    let rows = mediaQ.data ?? [];
    if (kind !== 'all') rows = rows.filter((r) => r.kind === kind);
    if (newOnly && latestDate) rows = rows.filter((r) => r.first_seen === latestDate);
    return rows;
  }, [mediaQ.data, kind, newOnly, latestDate]);

  const loading = runsQ.isLoading || metricsQ.isLoading || mediaQ.isLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No tracker runs ingested yet. The first scheduled run posts here automatically.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card 1 -------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Keyword demand</CardTitle>
          <p className="text-sm text-muted-foreground">
            Last run {latestDate}, {runs.length} runs logged. Source: Google Trends, Google
            Autocomplete, Wikipedia pageviews. Runs every other day at 7 AM MST.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-right">Last 7d</TableHead>
                  <TableHead className="text-right">7d delta</TableHead>
                  <TableHead className="text-right">28d delta</TableHead>
                  <TableHead className="text-right">vs anchor</TableHead>
                  <TableHead>90d peak</TableHead>
                  <TableHead>History</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gtrendsLatest.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.keyword}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {m.keyword_group ?? '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {m.last7 === null ? '-' : Number(m.last7).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeltaCell value={m.delta_pct === null ? null : Number(m.delta_pct)} />
                    </TableCell>
                    <TableCell className="text-right">
                      {m.delta28_pct === null ? (
                        ''
                      ) : (
                        <DeltaCell value={Number(m.delta28_pct)} />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {m.anchor_ratio === null ? '-' : Number(m.anchor_ratio).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.peak_val === null || !m.peak_date
                        ? '-'
                        : `${Number(m.peak_val)} on ${m.peak_date}`}
                    </TableCell>
                    <TableCell>
                      <Sparkline values={historyByKeyword.get(m.keyword) ?? []} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {wikiRow && (
            <p className="text-sm text-muted-foreground">
              Wikipedia {wikiRow.keyword}: {wikiRow.last7 === null ? '-' : Number(wikiRow.last7)}
              /day, prior {wikiRow.prior7 === null ? '-' : Number(wikiRow.prior7)}/day
            </p>
          )}
        </CardContent>
      </Card>

      {/* Card 2 -------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Media watch</CardTitle>
          <div className="flex flex-wrap gap-2 pt-2">
            {KIND_FILTERS.map((f) => (
              <Button
                key={f.key}
                size="sm"
                variant={kind === f.key ? 'default' : 'outline'}
                onClick={() => setKind(f.key)}
              >
                {f.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant={newOnly ? 'default' : 'outline'}
              onClick={() => setNewOnly((v) => !v)}
            >
              New this run
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Kind</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Channel / show</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Gain</TableHead>
                  <TableHead>First seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {media.map((m) => {
                  const href =
                    m.url ??
                    (m.kind === 'podcast'
                      ? `https://podcasts.apple.com/us/search?term=${encodeURIComponent(m.title)}`
                      : null);
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {m.kind}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[320px]">
                        <div className="flex items-center gap-2">
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline underline-offset-2"
                            >
                              {m.title}
                            </a>
                          ) : (
                            m.title
                          )}
                          {latestDate && m.first_seen === latestDate && (
                            <Badge className="text-[10px]">New</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {m.channel ?? ''}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {m.published_raw ?? ''}
                      </TableCell>
                      <TableCell className="text-right">{fmt(m.views)}</TableCell>
                      <TableCell className="text-right">
                        {m.views_gain === null || m.views_gain === undefined
                          ? ''
                          : `+${fmt(m.views_gain)}`}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.first_seen}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Card 3 -------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>New autocomplete terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestGroups.length === 0 && (
            <p className="text-sm text-muted-foreground">No new terms recorded yet.</p>
          )}
          {suggestGroups.map(([date, rows]) => (
            <div key={date} className="space-y-1">
              <p className="text-sm font-medium">{date}</p>
              <ul className="space-y-1">
                {rows.map((r) => (
                  <li key={r.id} className="text-sm">
                    {r.keyword}{' '}
                    <span className="text-muted-foreground text-xs">{r.keyword_group ?? ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
