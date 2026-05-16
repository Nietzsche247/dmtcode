import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type TestResult = {
  sent: boolean;
  send_status: number;
  validation: any;
  payload: any;
  note: string;
};

export const GA4DebugTester = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fire = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ga4-test-event', {
        body: {
          bundle_id: 'admin-test-bundle',
          bundle_name: 'Admin Test Laser Bundle',
          label: 'Get Your Laser Bundle',
          value: 49,
        },
      });
      if (error) throw error;
      setResult(data as TestResult);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fire test event');
    } finally {
      setLoading(false);
    }
  };

  const validationMessages = result?.validation?.validationMessages ?? [];
  const isValid = result?.sent && validationMessages.length === 0;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-black tracking-tight">GA4 DebugView Tester</h3>
          <p className="text-sm text-muted-foreground font-light mt-1">
            Fires a <code className="text-xs bg-muted px-1.5 py-0.5 rounded">bundle_cta_click</code> event via the Measurement Protocol API.
          </p>
        </div>
        <Button onClick={fire} disabled={loading} className="font-black">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Firing…</> : 'Fire Test Event'}
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-sm">
          <div className="flex items-center gap-2 font-bold text-destructive">
            <XCircle className="w-4 h-4" /> {error}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={result.sent ? 'default' : 'destructive'} className="font-black">
              {result.sent ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              HTTP {result.send_status}
            </Badge>
            <Badge variant={isValid ? 'default' : 'destructive'} className="font-black">
              {isValid ? 'Validation Passed' : `${validationMessages.length} validation issue(s)`}
            </Badge>
          </div>

          {validationMessages.length > 0 && (
            <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-xs space-y-1">
              {validationMessages.map((m: any, i: number) => (
                <div key={i}>
                  <strong>{m.fieldPath}:</strong> {m.description}
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Event params sent</p>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
              {JSON.stringify(result.payload.events[0], null, 2)}
            </pre>
          </div>

          <a
            href="https://analytics.google.com/analytics/web/#/p/debugview"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary font-bold hover:underline"
          >
            Open GA4 DebugView <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      <div className="p-4 rounded-lg border border-amber-500/40 bg-amber-500/5 text-xs space-y-2">
        <div className="flex items-center gap-2 font-black text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4" /> About one-click key event registration
        </div>
        <p className="text-muted-foreground font-light leading-relaxed">
          Google does <strong>not</strong> expose a public API to mark an event as a "key event" — the GA4 Admin API
          covers properties, streams, and custom dimensions, but key-event toggles are UI-only. So a true one-click
          register is technically impossible without browser-automating the GA4 dashboard against your Google session
          (fragile and against ToS).
        </p>
        <p className="text-muted-foreground font-light leading-relaxed">
          <strong>Fastest path:</strong> click "Fire Test Event" above → wait ~10s → open the link below, then in GA4:
          Admin → <strong>Key events</strong> → <strong>New key event</strong> → enter <code className="bg-muted px-1 rounded">bundle_cta_click</code> → Save. One-time, ~15 seconds.
        </p>
        <a
          href="https://analytics.google.com/analytics/web/#/a/admin/key-events"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
        >
          Open GA4 Key Events admin <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </Card>
  );
};
