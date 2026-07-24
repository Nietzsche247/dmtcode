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
}

export const BibliographyReviewQueue = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [hiddenInSession, setHiddenInSession] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bibliography')
      .select('id, title, journal, publication_date, content_type, source, abstract, url')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Failed to load queue', description: error.message, variant: 'destructive' });
    } else {
      setRows((data ?? []) as Row[]);
    }
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

  const keepHidden = (id: string) => {
    setHiddenInSession((s) => new Set(s).add(id));
  };

  const visible = rows.filter((r) => !hiddenInSession.has(r.id));
  const count = visible.length;

  if (loading) {
    return <Card><CardContent className="py-6 text-sm text-muted-foreground">Loading review queue...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Bibliography review queue
          {count > 0 && <Badge variant="secondary">{count}</Badge>}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {count === 0 && <p className="text-sm text-muted-foreground">No pending records.</p>}
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
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => approve(r.id)}>Approve</Button>
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
