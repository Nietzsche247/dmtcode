import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Bot, Route, Fingerprint, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

interface CrawlerHit {
  id: string;
  ts: string | null;
  path: string | null;
  bot_name: string | null;
  bot_class: string | null;
  user_agent: string | null;
}

const PROBE_PATTERNS = [
  '.env',
  '.git',
  '.aws',
  '.netrc',
  '.npmrc',
  'wp-config',
  'local_settings',
  'terraform',
  'application.yml',
  'config.yml',
  'web.config',
  'gitlab-ci',
  '.github/',
  'actuator',
  '/debug/',
  '/graphql',
  '/instance/',
  '/laravel/',
  '/wp/',
];

const utcStamp = (d: Date) => d.toISOString().slice(0, 16).replace('T', ' ');


const isProbe = (path: string | null) => {
  const p = (path || '').toLowerCase();
  if (p === '/graphql') return true;
  return PROBE_PATTERNS.some((pattern) => p.includes(pattern));
};

export const CrawlerIntelligence = () => {
  const [rows, setRows] = useState<CrawlerHit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crawler_hits')
        .select('id, ts, path, bot_name, bot_class, user_agent')
        .order('ts', { ascending: false })
        .limit(10000);

      if (error) throw error;
      setRows((data || []) as CrawlerHit[]);
    } catch (error) {
      console.error('Failed to fetch crawler hits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHits();
  }, []);

  const probes = rows.filter((r) => isProbe(r.path));
  const verified = rows.filter((r) => !isProbe(r.path));

  const times = rows.map((r) => (r.ts ? new Date(r.ts).getTime() : NaN)).filter((n) => !Number.isNaN(n));
  const minTs = times.length ? new Date(Math.min(...times)) : null;
  const maxTs = times.length ? new Date(Math.max(...times)) : null;

  const distinctPaths = new Set(verified.map((r) => r.path).filter(Boolean)).size;
  const distinctBots = new Set(verified.map((r) => r.bot_name).filter(Boolean)).size;

  const botMap = new Map<string, { hits: number; paths: Set<string>; klass: string | null; last: number }>();
  verified.forEach((r) => {
    const key = r.bot_name || '';
    if (!key) return;
    const entry = botMap.get(key) || { hits: 0, paths: new Set<string>(), klass: r.bot_class, last: 0 };
    entry.hits += 1;
    if (r.path) entry.paths.add(r.path);
    if (!entry.klass && r.bot_class) entry.klass = r.bot_class;
    const t = r.ts ? new Date(r.ts).getTime() : 0;
    if (t > entry.last) entry.last = t;
    botMap.set(key, entry);
  });
  const botRows = Array.from(botMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.hits - a.hits);

  const pathMap = new Map<string, { hits: number; bots: Set<string> }>();
  verified.forEach((r) => {
    const key = r.path || '';
    if (!key) return;
    const entry = pathMap.get(key) || { hits: 0, bots: new Set<string>() };
    entry.hits += 1;
    if (r.bot_name) entry.bots.add(r.bot_name);
    pathMap.set(key, entry);
  });
  const topPaths = Array.from(pathMap.entries())
    .map(([path, v]) => ({ path, ...v }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 20);

  const recentProbes = probes.slice(0, 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Crawler Intelligence</h2>
          <p className="text-muted-foreground">AI and search crawler traffic on the prerender layer</p>
        </div>
        <Button onClick={fetchHits} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {minTs && maxTs && (
        <p className="text-sm text-muted-foreground">
          {`Logging window: ${utcStamp(minTs)} UTC to ${utcStamp(maxTs)} UTC. Only requests matching a known-bot allowlist are logged. Human visitors are never logged.`}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Crawler hits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{verified.length}</div>
            <p className="text-xs text-muted-foreground">Verified-pattern traffic</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Route className="w-4 h-4" />
              Distinct paths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{distinctPaths}</div>
            <p className="text-xs text-muted-foreground">Pages reached</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Fingerprint className="w-4 h-4" />
              Bot identities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{distinctBots}</div>
            <p className="text-xs text-muted-foreground">Distinct bot names</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Suspicious probes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{probes.length}</div>
            <p className="text-xs text-muted-foreground">spoofed user agents, shown below</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No crawler data visible for this account.</div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>By bot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Class is what the operator says the bot is for: search indexing, answering user questions live, or model training.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bot</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Hits</TableHead>
                    <TableHead>Distinct paths</TableHead>
                    <TableHead>Last seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {botRows.map((b) => (
                    <TableRow key={b.name}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell>{b.klass ? <Badge variant="secondary">{b.klass}</Badge> : null}</TableCell>
                      <TableCell>{b.hits}</TableCell>
                      <TableCell>{b.paths.size}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {b.last ? format(new Date(b.last), 'MMM d, yyyy HH:mm') : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top content</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Path</TableHead>
                    <TableHead>Hits</TableHead>
                    <TableHead>Distinct bots</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPaths.map((p) => (
                    <TableRow key={p.path}>
                      <TableCell className="font-mono text-xs">{p.path}</TableCell>
                      <TableCell>{p.hits}</TableCell>
                      <TableCell>{p.bots.size}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle>Suspicious probes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                User agent strings are self-reported. Requests claiming to be Googlebot or GPTBot while probing for server
                credential files are spoofed vulnerability scanners, and counting them as real crawler interest would overstate
                every number. This site logs only an allowlist of known bot user agent patterns and never logs human visitors.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Claimed bot</TableHead>
                    <TableHead>Path</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProbes.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {p.ts ? format(new Date(p.ts), 'MMM d HH:mm:ss') : null}
                      </TableCell>
                      <TableCell>
                        {p.bot_name ? <Badge variant="destructive">{p.bot_name}</Badge> : null}
                      </TableCell>
                      <TableCell className="font-mono text-xs break-all">{p.path}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
