import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface Hit {
  id: string;
  ts: string | null;
  path: string | null;
  bot_name: string | null;
}

interface PathRow {
  path: string;
  hits: number;
  bots: number;
  last: number;
}

export const SeoInsights = () => {
  const [rows, setRows] = useState<PathRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error: err } = await supabase
        .from('crawler_hits')
        .select('id, ts, path, bot_name')
        .gte('ts', since)
        .order('ts', { ascending: false })
        .limit(10000);
      if (err) throw err;

      const map = new Map<string, { hits: number; bots: Set<string>; last: number }>();
      ((data || []) as Hit[]).forEach((h) => {
        const key = h.path || '';
        if (!key) return;
        const entry = map.get(key) || { hits: 0, bots: new Set<string>(), last: 0 };
        entry.hits += 1;
        if (h.bot_name) entry.bots.add(h.bot_name);
        const t = h.ts ? new Date(h.ts).getTime() : 0;
        if (t > entry.last) entry.last = t;
        map.set(key, entry);
      });

      setRows(
        Array.from(map.entries())
          .map(([path, v]) => ({ path, hits: v.hits, bots: v.bots.size, last: v.last }))
          .sort((a, b) => b.hits - a.hits)
          .slice(0, 15),
      );
    } catch (e) {
      console.error('SeoInsights load failed:', e);
      setError(e instanceof Error ? e.message : 'Failed to load crawler hits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Top Crawled Paths</CardTitle>
            <CardDescription>
              Bot traffic from the site's own edge logger over the last 30 days. This is not search ranking or human traffic.
            </CardDescription>
          </div>
          <Button onClick={load} disabled={loading} variant="outline" size="sm" className="self-start">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No crawler hits recorded in the last 30 days.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Path</TableHead>
                  <TableHead>Hits</TableHead>
                  <TableHead>Distinct bots</TableHead>
                  <TableHead>Last seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.path}>
                    <TableCell className="break-all font-mono text-xs">{r.path}</TableCell>
                    <TableCell>{r.hits}</TableCell>
                    <TableCell>{r.bots}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {r.last ? format(new Date(r.last), 'MMM d HH:mm') : '-'}
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
