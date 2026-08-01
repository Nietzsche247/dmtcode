import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Bot, RefreshCw, Fingerprint, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface CrawlerHit {
  id: string;
  ts: string | null;
  path: string | null;
  bot_name: string | null;
  bot_class: string | null;
}

interface FreshnessRow {
  table: string;
  latest: string | null;
  stale90: number;
  total: number;
}

const DAY = 24 * 60 * 60 * 1000;

// Each entry: table name, and the publication filter that table's own admin
// surface uses. No filter where the table has no such column.
const FRESHNESS_SOURCES: Array<{ table: 'articles' | 'guides' | 'protocols' | 'theories'; filter?: { column: string; value: boolean } }> = [
  { table: 'articles', filter: { column: 'is_published', value: true } },
  { table: 'guides', filter: { column: 'is_published', value: true } },
  { table: 'protocols', filter: { column: 'is_published', value: true } },
  { table: 'theories', filter: { column: 'is_approved', value: true } },
];

export const GeoAeoInsights = () => {
  const [hits, setHits] = useState<CrawlerHit[]>([]);
  const [priorCount, setPriorCount] = useState<number | null>(null);
  const [freshness, setFreshness] = useState<FreshnessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const now = Date.now();
      const since30 = new Date(now - 30 * DAY).toISOString();
      const since60 = new Date(now - 60 * DAY).toISOString();
      const stale = new Date(now - 90 * DAY).toISOString();

      const [current, prior] = await Promise.all([
        supabase
          .from('crawler_hits')
          .select('id, ts, path, bot_name, bot_class')
          .gte('ts', since30)
          .order('ts', { ascending: false })
          .limit(10000),
        supabase
          .from('crawler_hits')
          .select('id', { count: 'exact', head: true })
          .gte('ts', since60)
          .lt('ts', since30),
      ]);

      if (current.error) throw current.error;
      if (prior.error) throw prior.error;

      setHits((current.data || []) as CrawlerHit[]);
      setPriorCount(prior.count ?? 0);

      const fresh = await Promise.all(
        FRESHNESS_SOURCES.map(async (src) => {
          let latestQ = supabase
            .from(src.table)
            .select('updated_at')
            .order('updated_at', { ascending: false })
            .limit(1);
          let staleQ = supabase
            .from(src.table)
            .select('id', { count: 'exact', head: true })
            .lt('updated_at', stale);
          let totalQ = supabase.from(src.table).select('id', { count: 'exact', head: true });

          if (src.filter) {
            latestQ = latestQ.eq(src.filter.column, src.filter.value);
            staleQ = staleQ.eq(src.filter.column, src.filter.value);
            totalQ = totalQ.eq(src.filter.column, src.filter.value);
          }

          const [latestRes, staleRes, totalRes] = await Promise.all([latestQ, staleQ, totalQ]);
          if (latestRes.error) throw latestRes.error;
          if (staleRes.error) throw staleRes.error;
          if (totalRes.error) throw totalRes.error;

          const latestRow = (latestRes.data || [])[0] as { updated_at?: string } | undefined;
          return {
            table: src.table,
            latest: latestRow?.updated_at ?? null,
            stale90: staleRes.count ?? 0,
            total: totalRes.count ?? 0,
          } as FreshnessRow;
        }),
      );
      setFreshness(fresh);
    } catch (e) {
      console.error('GeoAeoInsights load failed:', e);
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const distinctBots = new Set(hits.map((h) => h.bot_name).filter(Boolean)).size;

  const classMap = new Map<string, number>();
  hits.forEach((h) => {
    const key = h.bot_class || 'unclassified';
    classMap.set(key, (classMap.get(key) || 0) + 1);
  });
  const byClass = Array.from(classMap.entries())
    .map(([klass, count]) => ({ klass, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const trend =
    priorCount === null
      ? null
      : priorCount === 0
        ? 'no prior-window data yet'
        : `${hits.length >= priorCount ? '+' : ''}${Math.round(((hits.length - priorCount) / priorCount) * 100)}% vs prior 30 days`;

  const recent = hits.slice(0, 15);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Crawler activity</h2>
          <p className="text-sm text-muted-foreground">
            Bot requests recorded by the site's own edge logger. Humans are never logged.
          </p>
        </div>
        <Button onClick={load} disabled={loading} variant="outline" size="sm" className="self-start">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hits, last 30 days</CardTitle>
            <Bot className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : hits.length}</div>
            <p className="text-xs text-muted-foreground">{loading ? 'Loading…' : (trend ?? '')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Distinct bots</CardTitle>
            <Fingerprint className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : distinctBots}</div>
            <p className="text-xs text-muted-foreground">Distinct bot_name values in window</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hits by class</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : byClass.length === 0 ? (
              <p className="text-xs text-muted-foreground">No hits in window</p>
            ) : (
              byClass.map((c) => (
                <div key={c.klass} className="flex items-center justify-between text-sm">
                  <span className="truncate">{c.klass}</span>
                  <Badge variant="secondary">{c.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent crawler hits</CardTitle>
          <CardDescription>Last 15 logged requests</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No crawler hits in the last 30 days.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Bot</TableHead>
                  <TableHead>Path</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {h.ts ? format(new Date(h.ts), 'MMM d HH:mm') : '—'}
                    </TableCell>
                    <TableCell className="text-sm">{h.bot_name || '—'}</TableCell>
                    <TableCell className="break-all font-mono text-xs">{h.path || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content freshness</CardTitle>
          <CardDescription>Latest updated_at per table, and rows untouched for 90+ days</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : freshness.length === 0 ? (
            <p className="text-sm text-muted-foreground">No freshness data available.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Last updated</TableHead>
                  <TableHead>90+ days stale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {freshness.map((f) => (
                  <TableRow key={f.table}>
                    <TableCell className="font-medium">{f.table}</TableCell>
                    <TableCell>{f.total}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {f.latest ? format(new Date(f.latest), 'MMM d, yyyy') : 'none'}
                    </TableCell>
                    <TableCell>
                      {f.stale90 > 0 ? <Badge variant="outline">{f.stale90}</Badge> : <span className="text-sm">0</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
