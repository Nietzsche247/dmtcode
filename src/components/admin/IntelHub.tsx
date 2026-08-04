import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Minus, RefreshCw } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { toast } from 'sonner';

/**
 * Intel Hub. Reads stored snapshot rows only.
 * It must never recompute a metric: intel-snapshot is the single source.
 */

interface IntelMetric {
  id: number;
  snapshot_id: string | null;
  captured_at: string;
  domain: string;
  metric_key: string;
  label: string;
  value: number | null;
  prior_value: number | null;
  delta_pct: number | null;
  unit: string | null;
  quality: string;
  note: string | null;
}

interface DataHealth {
  crawler_gap_days?: string[];
  crawler_status_code_coverage?: number;
  ga4_reachable?: boolean;
  ga4_error?: string | null;
  posthog_installed?: boolean;
  last_successful_snapshot?: string | null;
  stale?: boolean;
  warnings?: string[];
}

interface IntelSnapshot {
  id: string;
  captured_at: string;
  period_days: number;
  payload: {
    ga4?: {
      topPages?: { pagePath: string; screenPageViews: number; activeUsers: number }[];
      channels?: { channel: string; sessions: number }[];
      events?: { eventName: string; eventCount: number }[];
    };
  } | null;
  data_health: DataHealth | null;
  duration_ms: number | null;
  status: string;
  error: string | null;
}

const DOMAINS: { key: string; title: string }[] = [
  { key: 'traffic', title: 'Traffic' },
  { key: 'crawlers', title: 'Crawlers' },
  { key: 'content', title: 'Content' },
  { key: 'community', title: 'Community' },
  { key: 'commerce', title: 'Commerce' },
  { key: 'moderation', title: 'Moderation' },
  { key: 'research', title: 'Research' },
];

function formatValue(value: number | null, unit: string | null) {
  if (value === null) return '-';
  if (unit === 'percent') return `${value.toFixed(1)}%`;
  if (unit === 'seconds') {
    const m = Math.floor(value / 60);
    const s = Math.round(value % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }
  if (unit === 'ratio') return value.toFixed(2);
  return Math.round(value).toLocaleString();
}

function Delta({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-xs text-muted-foreground">no comparison</span>;
  }
  const up = pct > 0;
  const flat = Math.abs(pct) < 0.05;
  const Icon = flat ? Minus : up ? ArrowUp : ArrowDown;
  return (
    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {flat ? '0%' : `${Math.abs(pct).toFixed(1)}%`}
      <span className="opacity-60">vs prior period</span>
    </span>
  );
}

function Sparkline({ points }: { points: { value: number }[] }) {
  if (points.length < 2) return <div className="h-8" />;
  return (
    <div className="h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MetricTile({ metric, history }: { metric: IntelMetric; history: { value: number }[] }) {
  const unavailable = metric.quality === 'unavailable';
  const degraded = metric.quality === 'degraded';

  const tile = (
    <Card className="h-full">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-muted-foreground leading-tight">{metric.label}</p>
          {degraded && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />}
        </div>
        <p className={`text-2xl font-semibold ${unavailable ? 'text-muted-foreground' : ''}`}>
          {unavailable ? '-' : formatValue(metric.value, metric.unit)}
        </p>
        {unavailable ? (
          <span className="text-xs text-muted-foreground">unavailable</span>
        ) : (
          <Delta pct={metric.delta_pct} />
        )}
        <Sparkline points={history} />
        {degraded && metric.note && (
          <p className="text-[11px] leading-snug text-amber-600 dark:text-amber-400">{metric.note}</p>
        )}
      </CardContent>
    </Card>
  );

  if (!metric.note) return tile;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>{tile}</div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{metric.note}</TooltipContent>
    </Tooltip>
  );
}

export const IntelHub = () => {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);

  const { data: snapshot, isLoading: loadingSnap } = useQuery({
    queryKey: ['intel-snapshot-latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intel_snapshots')
        .select('*')
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as IntelSnapshot | null;
    },
  });

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['intel-metrics', snapshot?.id],
    enabled: !!snapshot?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intel_metrics')
        .select('*')
        .eq('snapshot_id', snapshot!.id)
        .order('id', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as IntelMetric[];
    },
  });

  // Last 30 snapshots worth of values per metric, for sparklines.
  const { data: history } = useQuery({
    queryKey: ['intel-metrics-history'],
    queryFn: async () => {
      const since = new Date(Date.now() - 60 * 86400_000).toISOString();
      const { data, error } = await supabase
        .from('intel_metrics')
        .select('metric_key,value,captured_at')
        .gte('captured_at', since)
        .order('captured_at', { ascending: true })
        .limit(5000);
      if (error) throw error;
      const map: Record<string, { value: number }[]> = {};
      for (const row of (data ?? []) as { metric_key: string; value: number | null }[]) {
        if (row.value === null) continue;
        (map[row.metric_key] ??= []).push({ value: Number(row.value) });
      }
      for (const k of Object.keys(map)) map[k] = map[k].slice(-30);
      return map;
    },
  });

  const runNow = useMutation({
    mutationFn: async () => {
      setRunning(true);
      const { data, error } = await supabase.functions.invoke('intel-snapshot', { body: {} });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return data;
    },
    onSuccess: () => {
      toast.success('Snapshot captured');
      queryClient.invalidateQueries({ queryKey: ['intel-snapshot-latest'] });
      queryClient.invalidateQueries({ queryKey: ['intel-metrics-history'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Snapshot failed'),
    onSettled: () => setRunning(false),
  });

  if (loadingSnap) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!snapshot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Intel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No snapshot has been captured yet. Run one to populate the tables that the dashboard and
            external agents both read.
          </p>
          <Button onClick={() => runNow.mutate()} disabled={running}>
            <RefreshCw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
            Run now
          </Button>
        </CardContent>
      </Card>
    );
  }

  const health = snapshot.data_health ?? {};
  const warnings = health.warnings ?? [];
  const capturedAt = new Date(snapshot.captured_at);
  const ageHours = (Date.now() - capturedAt.getTime()) / 3600_000;
  const isStale = ageHours > 48;
  const payload = snapshot.payload?.ga4 ?? {};

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {warnings.length === 0 ? (
          <Alert className="border-emerald-600/40">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Data health clean</AlertTitle>
            <AlertDescription>
              No pipeline gaps detected in this snapshot.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-amber-500/50 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle>Data health: {warnings.length} warning{warnings.length === 1 ? '' : 's'}</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1.5 list-disc pl-4 text-sm">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Intel</h2>
            <p className="text-sm text-muted-foreground">
              As of {capturedAt.toLocaleString()} - {snapshot.period_days}-day window
              {snapshot.duration_ms ? ` - captured in ${(snapshot.duration_ms / 1000).toFixed(1)}s` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={snapshot.status === 'ok' ? 'secondary' : 'destructive'}>{snapshot.status}</Badge>
            {isStale && <Badge variant="destructive">stale ({Math.round(ageHours)}h old)</Badge>}
            <Button size="sm" onClick={() => runNow.mutate()} disabled={running}>
              <RefreshCw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
              Run now
            </Button>
          </div>
        </div>

        {loadingMetrics ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          DOMAINS.map(({ key, title }) => {
            const rows = (metrics ?? []).filter((m) => m.domain === key);
            if (!rows.length) return null;
            return (
              <section key={key} className="space-y-3">
                <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {rows.map((m) => (
                    <MetricTile key={m.metric_key} metric={m} history={history?.[m.metric_key] ?? []} />
                  ))}
                </div>
              </section>
            );
          })
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top pages</CardTitle>
            </CardHeader>
            <CardContent>
              {payload.topPages?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Path</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payload.topPages.map((p) => (
                      <TableRow key={p.pagePath}>
                        <TableCell className="font-mono text-xs">{p.pagePath}</TableCell>
                        <TableCell className="text-right">{p.screenPageViews.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No page data in this snapshot.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Channels</CardTitle>
            </CardHeader>
            <CardContent>
              {payload.channels?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payload.channels.map((c) => (
                      <TableRow key={c.channel}>
                        <TableCell>{c.channel}</TableCell>
                        <TableCell className="text-right">{c.sessions.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No channel data in this snapshot.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Events</CardTitle>
            </CardHeader>
            <CardContent>
              {payload.events?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payload.events.map((e) => (
                      <TableRow key={e.eventName}>
                        <TableCell className="font-mono text-xs">{e.eventName}</TableCell>
                        <TableCell className="text-right">{e.eventCount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No event data in this snapshot.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};
