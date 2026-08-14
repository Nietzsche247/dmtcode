import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';

interface Check {
  label: string;
  ok: boolean;
}

interface SurfaceResult {
  surface: string;
  status: number | null;
  values: string[];
  checks: Check[];
  error?: string;
}

// Service workers and cached responses can make a plain same-origin fetch fail with an
// opaque "TypeError: Failed to fetch". Probe against an absolute URL with a cache-buster
// and retry once before reporting an error.
const probe = async (path: string): Promise<Response> => {
  const url = `${window.location.origin}${path}${path.includes('?') ? '&' : '?'}_geo=${Date.now()}`;
  try {
    return await fetch(url, { cache: 'no-store', credentials: 'omit', redirect: 'follow' });
  } catch {
    return await fetch(url, { credentials: 'omit', redirect: 'follow' });
  }
};

const describeError = (e: unknown) =>
  `${String(e)} (same-origin request to ${window.location.origin} was blocked: usually a stale service worker, an extension, or an offline preview tab)`;

const isProductionHost = () => window.location.hostname === 'dmtcode.com';

const runChecks = async (): Promise<SurfaceResult[]> => {
  const results: SurfaceResult[] = [];


  // /llms.txt
  try {
    const res = await fetch('/llms.txt', { cache: 'no-store' });
    const text = await res.text();
    results.push({
      surface: '/llms.txt',
      status: res.status,
      values: [`${text.length} bytes`],
      checks: [
        { label: 'HTTP 200', ok: res.status === 200 },
        { label: 'contains "publication_consent"', ok: text.includes('publication_consent') },
        { label: 'contains "/registry/tag/{tag}"', ok: text.includes('/registry/tag/{tag}') },
      ],
    });
  } catch (e) {
    results.push({ surface: '/llms.txt', status: null, values: [], checks: [], error: String(e) });
  }

  // /robots.txt
  try {
    const res = await fetch('/robots.txt', { cache: 'no-store' });
    const text = await res.text();
    const hasSitemap = /^\s*Sitemap:/im.test(text);
    results.push({
      surface: '/robots.txt',
      status: res.status,
      values: [`${text.length} bytes`],
      checks: [
        { label: 'HTTP 200', ok: res.status === 200 },
        { label: 'has Sitemap: line', ok: hasSitemap },
      ],
    });
  } catch (e) {
    results.push({ surface: '/robots.txt', status: null, values: [], checks: [], error: String(e) });
  }

  // /sitemap.xml
  try {
    const res = await fetch('/sitemap.xml', { cache: 'no-store' });
    const text = await res.text();
    const locCount = (text.match(/<loc>/g) || []).length;
    results.push({
      surface: '/sitemap.xml',
      status: res.status,
      values: [`${locCount} <loc> entries`],
      checks: [
        { label: 'HTTP 200', ok: res.status === 200 },
        { label: 'at least one <loc>', ok: locCount > 0 },
      ],
    });
  } catch (e) {
    results.push({ surface: '/sitemap.xml', status: null, values: [], checks: [], error: String(e) });
  }

  // /data.json
  try {
    const res = await fetch('/data.json', { cache: 'no-store' });
    const text = await res.text();
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      parsed = null;
    }
    const counts = (parsed?.counts ?? null) as Record<string, unknown> | null;
    const values: string[] = [];
    if (counts && typeof counts.symbols !== 'undefined') values.push(`counts.symbols = ${String(counts.symbols)}`);
    if (counts && typeof counts.total !== 'undefined') values.push(`counts.total = ${String(counts.total)}`);
    if (parsed && typeof parsed.dateModified !== 'undefined') values.push(`dateModified = ${String(parsed.dateModified)}`);
    if (values.length === 0) values.push('no counts / dateModified keys in payload');
    results.push({
      surface: '/data.json',
      status: res.status,
      values,
      checks: [
        { label: 'HTTP 200', ok: res.status === 200 },
        { label: 'JSON parses', ok: parsed !== null },
      ],
    });
  } catch (e) {
    results.push({ surface: '/data.json', status: null, values: [], checks: [], error: String(e) });
  }

  // /agent/
  try {
    const res = await fetch('/agent/', { cache: 'no-store' });
    const robotsTag = res.headers.get('x-robots-tag');
    results.push({
      surface: '/agent/',
      status: res.status,
      values: [`X-Robots-Tag: ${robotsTag ?? 'not readable'}`],
      checks: [
        { label: 'HTTP 200', ok: res.status === 200 },
        { label: 'X-Robots-Tag is "noindex, follow"', ok: (robotsTag || '').trim() === 'noindex, follow' },
      ],
    });
  } catch (e) {
    results.push({ surface: '/agent/', status: null, values: [], checks: [], error: String(e) });
  }

  return results;
};

export const ContentAuditor = () => {
  const [results, setResults] = useState<SurfaceResult[]>([]);
  const [running, setRunning] = useState(false);
  const [ranAt, setRanAt] = useState<Date | null>(null);

  const run = async () => {
    setRunning(true);
    const r = await runChecks();
    setResults(r);
    setRanAt(new Date());
    setRunning(false);
  };

  useEffect(() => {
    run();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>GEO Surface Health</CardTitle>
            <CardDescription>
              Live same-origin checks of the machine-readable surfaces. Values are measured at click time.
              {ranAt ? ` Last run ${ranAt.toLocaleTimeString()}.` : ''}
            </CardDescription>
          </div>
          <Button onClick={run} disabled={running} variant="outline" size="sm" className="self-start">
            <RefreshCw className={`mr-2 h-4 w-4 ${running ? 'animate-spin' : ''}`} />
            Run checks
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {running && results.length === 0 ? (
            <p className="text-sm text-muted-foreground">Running…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Surface</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Measured</TableHead>
                  <TableHead>Assertions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => {
                  const allOk = r.checks.length > 0 && r.checks.every((c) => c.ok);
                  return (
                    <TableRow key={r.surface}>
                      <TableCell className="font-mono text-xs">{r.surface}</TableCell>
                      <TableCell>
                        {r.error ? (
                          <Badge variant="destructive">error</Badge>
                        ) : (
                          <Badge variant={r.status === 200 ? 'secondary' : 'destructive'}>{r.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="space-y-1 text-xs text-muted-foreground">
                        {r.error ? <div className="break-all">{r.error}</div> : r.values.map((v) => <div key={v} className="break-all">{v}</div>)}
                      </TableCell>
                      <TableCell className="space-y-1">
                        {r.checks.map((c) => (
                          <div key={c.label} className="flex items-center gap-2 text-xs">
                            <Badge variant={c.ok ? 'secondary' : 'destructive'}>{c.ok ? 'pass' : 'fail'}</Badge>
                            <span className="text-muted-foreground">{c.label}</span>
                          </div>
                        ))}
                        {r.checks.length === 0 && <span className="text-xs text-muted-foreground">not checked</span>}
                        {allOk && <span className="sr-only">all checks passed</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
