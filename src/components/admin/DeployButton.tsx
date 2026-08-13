import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Loader2, FlaskConical, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Target = 'production' | 'staging';

type NetlifyDeploy = {
  id: string;
  state: string;
  context?: string | null;
  branch?: string | null;
  title?: string | null;
  error_message?: string | null;
  created_at?: string | null;
  published_at?: string | null;
  deploy_time?: number | null;
  deploy_ssl_url?: string | null;
  admin_url?: string | null;
  build_id?: string | null;
};

type LogLine = { ts?: string; message?: string };

const TERMINAL = new Set(['ready', 'error', 'cancelled', 'skipped']);

function stateVariant(state?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (state === 'ready') return 'default';
  if (state === 'error' || state === 'cancelled') return 'destructive';
  if (!state) return 'outline';
  return 'secondary';
}

export function DeployButton() {
  const [busy, setBusy] = useState<Target | null>(null);
  const [last, setLast] = useState<Record<Target, string | null>>({
    production: null,
    staging: null,
  });

  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [deploys, setDeploys] = useState<NetlifyDeploy[]>([]);
  const [current, setCurrent] = useState<NetlifyDeploy | null>(null);
  const [log, setLog] = useState<LogLine[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const logRef = useRef<HTMLPreElement | null>(null);

  const loadStatus = useCallback(async (deployId?: string) => {
    setStatusLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('netlify-deploy', {
        body: { action: 'status', deploy_id: deployId },
      });
      if (error) throw error;
      if (data?.unavailable) {
        setUnavailable(true);
        setStatusError(data.error ?? null);
        setAutoRefresh(false);
        return;
      }
      if (data?.error) throw new Error(data.error);
      setUnavailable(false);
      setStatusError(null);
      setDeploys(data?.deploys ?? []);
      setCurrent(data?.current ?? null);
      setLog(data?.log ?? []);
      if (data?.current && TERMINAL.has(String(data.current.state))) setAutoRefresh(false);
    } catch (e) {
      setStatusError((e as Error).message || 'Could not read build status.');
      setAutoRefresh(false);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => loadStatus(), 10000);
    return () => clearInterval(id);
  }, [autoRefresh, loadStatus]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const trigger = async (target: Target) => {
    setBusy(target);
    try {
      const { data, error } = await supabase.functions.invoke('netlify-deploy', {
        body: { target, reason: `Manual ${target} deploy from DMTCode admin` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const at = data?.triggered_at ?? new Date().toISOString();
      setLast((prev) => ({ ...prev, [target]: at }));
      toast.success(
        target === 'staging'
          ? 'Netlify staging build triggered.'
          : 'Netlify production build triggered from main.',
      );
      setAutoRefresh(true);
      setTimeout(() => loadStatus(), 4000);
    } catch (e) {
      toast.error((e as Error).message || 'Could not trigger the deploy.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="h-4 w-4" />
              Staging deploy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Builds the staging site so prerender output and /symbols assets can be checked
              before production. Requires the NETLIFY_STAGING_BUILD_HOOK_URL secret.
            </p>
            <Button variant="secondary" onClick={() => trigger('staging')} disabled={busy !== null}>
              {busy === 'staging' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="mr-2 h-4 w-4" />
              )}
              Deploy to staging
            </Button>
            {last.staging && (
              <p className="text-xs text-muted-foreground">
                Last triggered: {new Date(last.staging).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Rocket className="h-4 w-4" />
              Production deploy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Triggers a Netlify build from the <code>main</code> branch. Requires the
              NETLIFY_BUILD_HOOK_URL secret to be set.
            </p>
            <Button onClick={() => trigger('production')} disabled={busy !== null}>
              {busy === 'production' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="mr-2 h-4 w-4" />
              )}
              Deploy main to production
            </Button>
            {last.production && (
              <p className="text-xs text-muted-foreground">
                Last triggered: {new Date(last.production).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Build status</CardTitle>
          <div className="flex items-center gap-2">
            {autoRefresh && (
              <span className="text-xs text-muted-foreground">Auto refreshing</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadStatus(current?.id)}
              disabled={statusLoading}
            >
              {statusLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {unavailable && (
            <p className="text-sm text-muted-foreground">
              {statusError ??
                'Build status needs the NETLIFY_API_TOKEN and NETLIFY_SITE_ID secrets.'}
            </p>
          )}

          {!unavailable && statusError && (
            <p className="text-sm text-destructive">{statusError}</p>
          )}

          {!unavailable && !statusError && current && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={stateVariant(current.state)}>{current.state}</Badge>
                <span className="text-muted-foreground">
                  {current.context ?? 'unknown context'}
                  {current.branch ? ` / ${current.branch}` : ''}
                </span>
                {current.created_at && (
                  <span className="text-xs text-muted-foreground">
                    started {new Date(current.created_at).toLocaleString()}
                  </span>
                )}
                {typeof current.deploy_time === 'number' && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {current.deploy_time}s
                  </span>
                )}
              </div>

              {current.error_message && (
                <p className="text-sm text-destructive">{current.error_message}</p>
              )}

              <pre
                ref={logRef}
                className="max-h-80 overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed"
              >
                {log.length
                  ? log.map((l) => l.message).join('\n')
                  : 'No build log lines available yet.'}
              </pre>

              <div className="space-y-1">
                {deploys.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => loadStatus(d.id)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted ${
                      d.id === current.id ? 'bg-muted' : ''
                    }`}
                  >
                    <Badge variant={stateVariant(d.state)} className="text-[10px]">
                      {d.state}
                    </Badge>
                    <span className="truncate text-muted-foreground">
                      {d.title || d.branch || d.id}
                    </span>
                    <span className="ml-auto shrink-0 text-muted-foreground">
                      {d.created_at ? new Date(d.created_at).toLocaleTimeString() : ''}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {!unavailable && !statusError && !current && !statusLoading && (
            <p className="text-sm text-muted-foreground">No deploys found for this site yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
