import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function DeployButton() {
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  const trigger = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('netlify-deploy', {
        body: { reason: 'Manual deploy from DMTCode admin' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setLast(data?.triggered_at ?? new Date().toISOString());
      toast.success('Netlify build triggered from main.');
    } catch (e) {
      toast.error((e as Error).message || 'Could not trigger the deploy.');
    } finally {
      setBusy(false);
    }
  };

  return (
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
        <Button onClick={trigger} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
          Deploy main to production
        </Button>
        {last && (
          <p className="text-xs text-muted-foreground">
            Last triggered: {new Date(last).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
