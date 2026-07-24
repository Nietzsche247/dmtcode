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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Pending {
  id: string;
  title: string;
  trial_registry_id: string | null;
  status: string | null;
  url: string | null;
  created_at: string;
}

interface RunRow {
  id: string;
  started_at: string;
  finished_at: string | null;
  run_by: string | null;
  total: number | null;
  updated: number | null;
  not_found: number | null;
  failed: number | null;
  title_mismatches: unknown;
  errors: unknown;
}

export function TrialsBackfillPanel() {
  const [candidateCount, setCandidateCount] = useState<number | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

    const { data: runData } = await supabase
      .from('trial_backfill_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20);
    setRuns((runData ?? []) as RunRow[]);
  };

  useEffect(() => { loadCounts(); }, []);

  const runBackfill = async () => {
    setRunning(true);
    setLastResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sign in required');
        setRunning(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke('backfill-trials', {});
      if (error) throw error;
      setLastResult(data);
      toast.success(
        `Backfill complete: ${data?.updated ?? 0} updated, ${data?.not_found ?? 0} not found, ${data?.failed ?? 0} failed`
      );
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
      toast.info('Left as hidden (is_approved stays false)');
    }
    loadCounts();
  };

  return (
    <div className="space-y-6">
      <div className="rounded border border-border/60 p-5">
        <h3 className="font-semibold mb-2">Refresh trials from ClinicalTrials.gov</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Rewrites description, eligibility, institution, location, status, dates,
          principal investigator and phase on every approved trial that carries a
          valid NCT id, sourced directly from the registry. Titles are only
          overwritten when the stored title matches neither the registry brief nor
          the official title. Hidden rows are not touched.
        </p>
        <p className="text-sm mb-4">
          Candidate rows: <strong>{candidateCount ?? 'loading...'}</strong>
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={running || candidateCount === null}>
              {running && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {running ? 'Running...' : 'Refresh trials from ClinicalTrials.gov'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Run backfill on {candidateCount} rows?</AlertDialogTitle>
              <AlertDialogDescription>
                This rewrites description, eligibility, institution, location,
                status, dates and principal investigator on every approved trial
                with an NCT id, from the registry. Runs synchronously and may take
                a few minutes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={runBackfill}>Run backfill</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {lastResult && (
          <div className="mt-4 rounded bg-muted p-3 text-xs">
            <div>Total: {lastResult.total}</div>
            <div>Updated: {lastResult.updated}</div>
            <div>Not found: {lastResult.not_found}</div>
            <div>Failed: {lastResult.failed}</div>
            <div>Title mismatches: {lastResult.title_mismatch_count}</div>
          </div>
        )}
      </div>

      <div className="rounded border border-border/60 p-5">
        <h3 className="font-semibold mb-3">Backfill run history</h3>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No run has been recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {runs.map((r) => {
              const mismatches = Array.isArray(r.title_mismatches) ? r.title_mismatches as any[] : [];
              const errs = Array.isArray(r.errors) ? r.errors as any[] : [];
              const isOpen = !!expanded[r.id];
              return (
                <li key={r.id} className="border-b border-border/60 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                      <span className="font-medium">
                        {format(new Date(r.started_at), 'yyyy-MM-dd HH:mm')}
                      </span>
                      {r.finished_at && (
                        <span className="text-muted-foreground">
                          {' '}to {format(new Date(r.finished_at), 'HH:mm')}
                        </span>
                      )}
                      <span className="ml-2 text-xs text-muted-foreground">
                        by {r.run_by ? r.run_by.slice(0, 8) : 'operator'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      total {r.total ?? 0} · updated {r.updated ?? 0} · not found {r.not_found ?? 0} · failed {r.failed ?? 0}
                    </div>
                  </div>
                  {(mismatches.length > 0 || errs.length > 0) && (
                    <button
                      onClick={() => setExpanded((e) => ({ ...e, [r.id]: !isOpen }))}
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      {isOpen ? 'Hide' : 'Show'} {mismatches.length} title mismatches, {errs.length} errors
                    </button>
                  )}
                  {isOpen && (
                    <div className="mt-2 space-y-2 text-xs">
                      {mismatches.length > 0 && (
                        <div>
                          <div className="font-medium">Title mismatches</div>
                          <pre className="max-h-48 overflow-auto rounded bg-muted p-2">
                            {JSON.stringify(mismatches, null, 2)}
                          </pre>
                        </div>
                      )}
                      {errs.length > 0 && (
                        <div>
                          <div className="font-medium">Errors</div>
                          <pre className="max-h-48 overflow-auto rounded bg-muted p-2">
                            {JSON.stringify(errs, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
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
