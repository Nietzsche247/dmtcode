import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Loader2, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Target = 'production' | 'staging';

export function DeployButton() {
  const [busy, setBusy] = useState<Target | null>(null);
  const [last, setLast] = useState<Record<Target, string | null>>({
    production: null,
    staging: null,
  });

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
    } catch (e) {
      toast.error((e as Error).message || 'Could not trigger the deploy.');
    } finally {
      setBusy(null);
    }
  };

  return (
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
  );
}
