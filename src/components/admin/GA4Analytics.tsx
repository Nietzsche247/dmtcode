import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';

type RangeKey = '7d' | '28d' | '90d';

interface GA4Report {
  dateRange: string;
  totals: {
    activeUsers: number;
    sessions: number;
    screenPageViews: number;
    averageSessionDuration: number;
    bounceRate: number;
  };
  byDate: { date: string; activeUsers: number; sessions: number }[];
  topPages: { pagePath: string; screenPageViews: number; activeUsers: number }[];
  channels: { channel: string; sessions: number }[];
  events: { eventName: string; eventCount: number }[];
}

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '28d', label: 'Last 28 days' },
  { key: '90d', label: 'Last 90 days' },
];

const formatDuration = (seconds: number) => {
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2, '0')}s`;
};

export const GA4Analytics = () => {
  const [range, setRange] = useState<RangeKey>('28d');
  const [data, setData] = useState<GA4Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (dateRange: RangeKey) => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: fnError } = await supabase.functions.invoke('ga4-report', {
        body: { dateRange },
      });

      if (fnError) {
        let message = fnError.message;
        if (fnError instanceof FunctionsHttpError) {
          const raw = await fnError.context.text();
          try {
            message = JSON.parse(raw)?.error ?? raw;
          } catch {
            message = raw || message;
          }
        }
        // Never fall through to zeros: a silent zero reads as "no traffic".
        setData(null);
        setError(message);
        return;
      }

      if (res?.error) {
        setData(null);
        setError(String(res.error));
        return;
      }

      setData(res as GA4Report);
    } catch (e) {
      setData(null);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  const tiles = data
    ? [
        { label: 'Active users', value: data.totals.activeUsers.toLocaleString() },
        { label: 'Sessions', value: data.totals.sessions.toLocaleString() },
        { label: 'Page views', value: data.totals.screenPageViews.toLocaleString() },
        { label: 'Avg. session', value: formatDuration(data.totals.averageSessionDuration) },
        { label: 'Bounce rate', value: `${(data.totals.bounceRate * 100).toFixed(1)}%` },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Google Analytics 4</h2>
          <p className="text-sm text-muted-foreground">
            Live traffic read from the GA4 Data API. Not sampled client-side.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.key}
              size="sm"
              variant={range === r.key ? 'default' : 'outline'}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => load(range)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analytics unavailable</AlertTitle>
          <AlertDescription className="break-words whitespace-pre-wrap">{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      )}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {tiles.map((t) => (
              <Card key={t.label}>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.label}</p>
                  <p className="text-2xl font-bold mt-1 tabular-nums">{t.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Traffic over time</CardTitle>
              <CardDescription>Sessions and active users per day</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {data.byDate.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  GA4 returned no rows for this period.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.byDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <RTooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      name="Sessions"
                      stroke="hsl(var(--primary))"
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="activeUsers"
                      name="Active users"
                      stroke="hsl(var(--muted-foreground))"
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top pages</CardTitle>
              <CardDescription>Highest page views in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {data.topPages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No page rows returned.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                        <th className="py-2 pr-4 font-medium">Path</th>
                        <th className="py-2 pr-4 font-medium text-right">Views</th>
                        <th className="py-2 font-medium text-right">Users</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topPages.map((p) => (
                        <tr key={p.pagePath} className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs truncate max-w-[380px]">{p.pagePath}</td>
                          <td className="py-2 pr-4 text-right tabular-nums">{p.screenPageViews.toLocaleString()}</td>
                          <td className="py-2 text-right tabular-nums">{p.activeUsers.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Channels</CardTitle>
                <CardDescription>Sessions by default channel group</CardDescription>
              </CardHeader>
              <CardContent>
                {data.channels.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No channel rows returned.</p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody>
                      {data.channels.map((c) => (
                        <tr key={c.channel} className="border-b border-border/50">
                          <td className="py-2 pr-4">{c.channel}</td>
                          <td className="py-2 text-right tabular-nums">{c.sessions.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Events</CardTitle>
                <CardDescription>Top events by count</CardDescription>
              </CardHeader>
              <CardContent>
                {data.events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No event rows returned.</p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody>
                      {data.events.map((e) => (
                        <tr key={e.eventName} className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs">{e.eventName}</td>
                          <td className="py-2 text-right tabular-nums">{e.eventCount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
