import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WatchRow {
  id: string;
  trial_id: string;
  created_at: string;
}

interface TrialRow {
  id: string;
  title: string;
  status: string | null;
  phase: string | null;
}

interface WatchedTrial extends WatchRow {
  trial?: TrialRow;
}

export const WatchedTrials = ({ userId }: { userId: string }) => {
  const [rows, setRows] = useState<WatchedTrial[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: watches } = await supabase
        .from('trial_watchlist')
        .select('id, trial_id, created_at')
        .order('created_at', { ascending: false });

      if (cancelled || !watches || watches.length === 0) {
        if (!cancelled) setRows([]);
        return;
      }

      const trialIds = Array.from(new Set(watches.map((w) => w.trial_id).filter(Boolean)));
      let trials: TrialRow[] = [];
      if (trialIds.length > 0) {
        const { data } = await supabase
          .from('clinical_trials')
          .select('id, title, status, phase')
          .in('id', trialIds);
        if (data) trials = data as TrialRow[];
      }

      if (cancelled) return;
      setRows(
        (watches as WatchRow[]).map((w) => ({
          ...w,
          trial: trials.find((t) => t.id === w.trial_id),
        }))
      );
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const stopWatching = async (rowId: string) => {
    const previous = rows;
    setRows((r) => r.filter((x) => x.id !== rowId));
    const { error } = await supabase.from('trial_watchlist').delete().eq('id', rowId);
    if (error) {
      setRows(previous);
      toast.error('Could not remove that trial');
    }
  };

  if (rows.length === 0) return null;

  return (
    <section className="mt-12 space-y-4">
      <h2 className="text-xl font-serif">Trials you are watching</h2>
      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={row.id} className="p-4 bg-card border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Link
                  to={`/trials/${row.trial_id}`}
                  className="text-sm text-primary underline underline-offset-2"
                >
                  {row.trial?.title || 'Trial record'}
                </Link>
                <div className="text-xs text-muted-foreground mt-1">
                  {row.trial?.status ? row.trial.status : 'Status not recorded'}
                  {row.trial?.phase ? ` · ${row.trial.phase}` : ''}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => stopWatching(row.id)}>
                Stop watching
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
