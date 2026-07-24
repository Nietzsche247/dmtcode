import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Row {
  count: number | null;
}

interface Pending {
  id: string;
  title: string;
  trial_registry_id: string | null;
  status: string | null;
  url: string | null;
  created_at: string;
}

export function TrialsBackfillPanel() {
  const [candidateCount, setCandidateCount] = useState<number | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const loadCounts = async () => {
    const { count } = await supabase
      .from('clinical_trials')
      .select('id', { count: 'exact', head: true })
      .eq('is_approved', true)
      .filter('trial_registry_id', 'match', '^NCT[0-9]{8}$');
    setCandidateCount(count ?? 0);

    const { data } = await supabase
      .from('clinical_trials')
      .select('id, title, trial_registry_id, status, url, created_at')
      .eq('is_approved', false)
      .order('created_at', { ascending: false })
      .limit(50);
    setPending((data ?? []) as Pending[]);
  };

  useEffect(() => { loadCounts(); }, []);

  const runBackfill = async () => {
    setRunning(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('backfill-trials', {});
      if (error) throw error;
      setLastResult(JSON.stringify(data, null, 2));
      toast.success(`Backfill complete: ${data?.updated ?? 0} updated, ${data?.not_found ?? 0} not found, ${data?.failed ?? 0} failed`);
    } catch (e: any) {
      toast.error(e?.message || 'Backfill failed');
    } finally {
      setRunning(false);
      loadCounts();
    }
  };

  const decide = async (id: string, approve: boolean) => {
    if (approve) {
      const { error } = await supabase
        .from('clinical_trials')
        .update({ is_approved: true })
        .eq('id', id);
      if (error) return toast.error(error.message);
      toast.success('Approved');
    } else {
      // Reject = leave hidden. No row deletion.
      toast.info('Left as hidden (is_approved stays false)');
    }
    loadCounts();
  };

  return (
    <div className="space-y-6">
      <div className="rounded border border-border/60 p-5">
        <h3 className="font-semibold mb-2">Clinical Trials Registry Backfill</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Refreshes description, eligibility, principal investigator, institution,
          location, status and dates directly from ClinicalTrials.gov for approved
          rows with a valid NCT id. Does not touch hidden rows and does not overwrite titles.
        </p>
        <p className="text-sm mb-4">
          Candidate rows: <strong>{candidateCount ?? 'loading...'}</strong>
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={running || candidateCount === null}>
              {running ? 'Running...' : 'Run trials backfill'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Run backfill on {candidateCount} rows?</AlertDialogTitle>
              <AlertDialogDescription>
                This will fetch each NCT id from ClinicalTrials.gov and overwrite
                description, eligibility, principal investigator, institution,
                location, status and dates. Titles are preserved. Hidden rows are not touched.
                Runs synchronously and may take a few minutes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={runBackfill}>Run backfill</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {lastResult && (
          <pre className="mt-4 max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{lastResult}</pre>
        )}
      </div>

      <div className="rounded border border-border/60 p-5">
        <h3 className="font-semibold mb-3">Pending trials (unapproved)</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending trials.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => (
              <li key={p.id} className="border-b border-border/60 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[p.trial_registry_id, p.status].filter(Boolean).join(' · ')}
                    </p>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline">
                        View on ClinicalTrials.gov
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => decide(p.id, true)}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => decide(p.id, false)}>
                      Keep hidden
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
