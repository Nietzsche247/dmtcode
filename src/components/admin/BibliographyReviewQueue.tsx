import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Row {
  id: string;
  title: string;
  journal: string | null;
  publication_date: string | null;
  content_type: string | null;
  source: string | null;
  abstract: string | null;
  url: string | null;
  triage_status: string | null;
  triage_confidence: number | null;
  triage_reason: string | null;
}

type Filter = 'all' | 'needs_review' | 'untriaged' | 'auto_rejected';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All unapproved' },
  { key: 'needs_review', label: 'Needs review' },
  { key: 'untriaged', label: 'Not yet triaged' },
  { key: 'auto_rejected', label: 'Auto-rejected' },
];

export const BibliographyReviewQueue = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [hiddenInSession, setHiddenInSession] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>('all');
  const [autoApprovedCount, setAutoApprovedCount] = useState<number | null>(null);
  const [autoRejectedCount, setAutoRejectedCount] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const [queue, approvedCount, rejectedCount] = await Promise.all([
      supabase
        .from('bibliography')
        .select('id, title, journal, publication_date, content_type, source, abstract, url, triage_status, triage_confidence, triage_reason')
        .eq('is_approved', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('bibliography')
        .select('id', { count: 'exact', head: true })
        .eq('triage_status', 'auto_approved'),
      supabase
        .from('bibliography')
        .select('id', { count: 'exact', head: true })
        .eq('triage_status', 'auto_rejected'),
    ]);

    if (queue.error) {
      toast({ title: 'Failed to load queue', description: queue.error.message, variant: 'destructive' });
    } else {
      setRows((queue.data ?? []) as Row[]);
    }
    setAutoApprovedCount(approvedCount.count ?? null);
    setAutoRejectedCount(rejectedCount.count ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    const { error } = await supabase.from('bibliography').update({ is_approved: true }).eq('id', id);
    if (error) {
      toast({ title: 'Approve failed', description: error.message, variant: 'destructive' });
      return;
    }
    setRows((r) => r.filter((x) => x.id !== id));
    toast({ title: 'Approved', description: 'Record is now public.' });
  };

  const reject = async (id: string) => {
    const { error } = await supabase
      .from('bibliography')
      .update({ triage_status: 'auto_rejected', triage_reason: 'Rejected by a human reviewer.' })
      .eq('id', id);
    if (error) {
      toast({ title: 'Reject failed', description: error.message, variant: 'destructive' });
      return;
    }
    setRows((r) => r.map((x) => (x.id === id ? { ...x, triage_status: 'auto_rejected' } : x)));
    setAutoRejectedCount((c) => (c == null ? c : c + 1));
    toast({ title: 'Marked off topic', description: 'Record stays unpublished.' });
  };

  const keepHidden = (id: string) => {
    setHiddenInSession((s) => new Set(s).add(id));
  };

  const matchesFilter = (r: Row) => {
    if (filter === 'all') return true;
    if (filter === 'untriaged') return r.triage_status === null;
    return r.triage_status === filter;
  };

  const notHidden = rows.filter((r) => !hiddenInSession.has(r.id));
  const visible = notHidden.filter(matchesFilter);
  const count = visible.length;
  const needsReviewCount = notHidden.filter((r) => r.triage_status === 'needs_review').length;

  if (loading) {
    return <Card><CardContent className="py-6 text-sm text-muted-foreground">Loading review queue...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Bibliography review queue
            {count > 0 && <Badge variant="secondary">{count}</Badge>}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? 'default' : 'outline'}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.key === 'needs_review' && needsReviewCount > 0 && (
                <span className="ml-2 text-xs opacity-80">{needsReviewCount}</span>
              )}
            </Button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Automated triage to date: {autoApprovedCount ?? '-'} auto-approved, {autoRejectedCount ?? '-'} auto-rejected.
          Auto-approval means the record is on topic for this library. It is not a claim that the record is
          verified, endorsed, or scientifically sound.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {count === 0 && <p className="text-sm text-muted-foreground">No records in this view.</p>}
        {visible.map((r) => {
          const open = expanded[r.id];
          return (
            <div key={r.id} className="rounded-md border border-border p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="hover:underline">{r.title}</a> : r.title}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                    {r.journal && <span>{r.journal}</span>}
                    {r.publication_date && <span>{r.publication_date}</span>}
                    {r.content_type && <Badge variant="outline" className="text-[10px]">{r.content_type}</Badge>}
                    {r.source && <span className="uppercase tracking-wide">{r.source}</span>}
                    {r.triage_status && (
                      <Badge variant="outline" className="text-[10px]">
                        {r.triage_status.replace('_', ' ')}
                        {r.triage_confidence != null && ` ${Math.round(r.triage_confidence * 100)}%`}
                      </Badge>
                    )}
                  </div>
                  {r.triage_reason && (
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      Triage note: {r.triage_reason}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => approve(r.id)}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => reject(r.id)}>Reject</Button>
                  <Button size="sm" variant="ghost" onClick={() => keepHidden(r.id)}>Keep hidden</Button>
                </div>
              </div>
              {r.abstract && (
                <div>
                  <button
                    className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => setExpanded((e) => ({ ...e, [r.id]: !e[r.id] }))}
                  >
                    {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    Abstract
                  </button>
                  {open && <p className="mt-2 text-sm whitespace-pre-wrap">{r.abstract}</p>}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
