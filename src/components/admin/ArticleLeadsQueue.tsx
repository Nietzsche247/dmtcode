import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface Row {
  id: string;
  url: string;
  title: string;
  excerpt: string | null;
  outlet: string | null;
  author: string | null;
  published_at: string | null;
  source: string;
  topic_tags: string[] | null;
  compounds: string[] | null;
  relevance_score: number;
  triage_status: string | null;
  triage_reason: string | null;
  created_at: string;
  ai_summary: string | null;
  ai_tags: string[] | null;
  ai_key_points: string[] | null;
  ai_enriched_at: string | null;
}

type Filter = 'all' | 'strong_match' | 'needs_review' | 'auto_rejected';
type Sort = 'relevance' | 'newest' | 'published';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All unapproved' },
  { key: 'strong_match', label: 'Strong match' },
  { key: 'needs_review', label: 'Needs review' },
  { key: 'auto_rejected', label: 'Auto-rejected' },
];

const SORTS: { key: Sort; label: string }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'newest', label: 'Newest found' },
  { key: 'published', label: 'Publication date' },
];

export const ArticleLeadsQueue = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [hiddenInSession, setHiddenInSession] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('relevance');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [approvedCount, setApprovedCount] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const [queue, approved] = await Promise.all([
      supabase
        .from('article_leads')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('article_leads')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', true),
    ]);

    if (queue.error) {
      toast({ title: 'Failed to load article leads', description: queue.error.message, variant: 'destructive' });
    } else {
      setRows((queue.data ?? []) as Row[]);
    }
    setApprovedCount(approved.count ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    const { error } = await supabase.from('article_leads').update({ is_approved: true }).eq('id', id);
    if (error) {
      toast({ title: 'Approve failed', description: error.message, variant: 'destructive' });
      return;
    }
    setRows((r) => r.filter((x) => x.id !== id));
    setApprovedCount((c) => (c == null ? c : c + 1));
    toast({ title: 'Kept', description: 'Lead marked as worth using.' });
  };

  const reject = async (id: string) => {
    const { error } = await supabase
      .from('article_leads')
      .update({ triage_status: 'auto_rejected', triage_reason: 'Rejected by a human reviewer.' })
      .eq('id', id);
    if (error) {
      toast({ title: 'Reject failed', description: error.message, variant: 'destructive' });
      return;
    }
    setRows((r) => r.map((x) => (x.id === id ? { ...x, triage_status: 'auto_rejected' } : x)));
    toast({ title: 'Marked off topic', description: 'Lead stays unapproved.' });
  };

  const matchesFilter = (r: Row) => (filter === 'all' ? true : r.triage_status === filter);
  const matchesSource = (r: Row) => (sourceFilter === 'all' ? true : r.source === sourceFilter);

  const sources = Array.from(new Set(rows.map((r) => r.source))).sort();

  const notHidden = rows.filter((r) => !hiddenInSession.has(r.id));
  const visible = notHidden
    .filter(matchesFilter)
    .filter(matchesSource)
    .sort((a, b) => {
      if (sort === 'relevance') return b.relevance_score - a.relevance_score;
      if (sort === 'published') {
        return (Date.parse(b.published_at ?? '') || 0) - (Date.parse(a.published_at ?? '') || 0);
      }
      return (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0);
    });

  const strongCount = notHidden.filter((r) => r.triage_status === 'strong_match').length;

  if (loading) {
    return <Card><CardContent className="py-6 text-sm text-muted-foreground">Loading article leads...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Article leads queue
            {visible.length > 0 && <Badge variant="secondary">{visible.length}</Badge>}
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
              {f.key === 'strong_match' && strongCount > 0 && (
                <span className="ml-2 text-xs opacity-80">{strongCount}</span>
              )}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort</span>
          {SORTS.map((s) => (
            <Button
              key={s.key}
              size="sm"
              variant={sort === s.key ? 'secondary' : 'ghost'}
              onClick={() => setSort(s.key)}
            >
              {s.label}
            </Button>
          ))}
        </div>

        {sources.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Source</span>
            <Button
              size="sm"
              variant={sourceFilter === 'all' ? 'secondary' : 'ghost'}
              onClick={() => setSourceFilter('all')}
            >
              All
            </Button>
            {sources.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={sourceFilter === s ? 'secondary' : 'ghost'}
                onClick={() => setSourceFilter(s)}
              >
                {s.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Kept to date: {approvedCount ?? '-'}. Keeping a lead means it is on topic and worth reading. It is not a
          claim that the article is accurate, peer reviewed, or endorsed.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {visible.length === 0 && <p className="text-sm text-muted-foreground">No leads in this view.</p>}
        {visible.map((r) => {
          const open = expanded[r.id];
          return (
            <div key={r.id} className="rounded-md border border-border p-4 space-y-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 hover:underline">
                      {r.title}
                      <ExternalLink className="mt-1 h-3 w-3 shrink-0" />
                    </a>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {r.outlet && <span>{r.outlet}</span>}
                    {r.published_at && <span>{new Date(r.published_at).toLocaleDateString()}</span>}
                    <span className="uppercase tracking-wide">{r.source.replace(/_/g, ' ')}</span>
                    <Badge variant="outline" className="text-[10px] tabular-nums">score {r.relevance_score}</Badge>
                    {r.triage_status && (
                      <Badge variant="outline" className="text-[10px]">{r.triage_status.replace(/_/g, ' ')}</Badge>
                    )}
                  </div>
                  {(r.compounds?.length || r.topic_tags?.length) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(r.compounds ?? []).map((c) => (
                        <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                      ))}
                      {(r.topic_tags ?? []).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  )}
                  {r.triage_reason && (
                    <p className="mt-2 text-xs italic text-muted-foreground">Triage note: {r.triage_reason}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" onClick={() => approve(r.id)}>Keep</Button>
                  <Button size="sm" variant="outline" onClick={() => reject(r.id)}>Reject</Button>
                  <Button size="sm" variant="ghost" onClick={() => setHiddenInSession((s) => new Set(s).add(r.id))}>
                    Hide
                  </Button>
                </div>
              </div>

              {r.excerpt && (
                <div>
                  <button
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setExpanded((e) => ({ ...e, [r.id]: !e[r.id] }))}
                  >
                    {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    Excerpt
                  </button>
                  {open && <p className="mt-2 whitespace-pre-wrap text-sm">{r.excerpt}</p>}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
