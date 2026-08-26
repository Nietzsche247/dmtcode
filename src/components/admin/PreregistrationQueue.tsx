import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Status = 'submitted' | 'under_review' | 'published' | 'declined';

const STATUSES: Status[] = ['submitted', 'under_review', 'published', 'declined'];

interface Prereg {
  id: string;
  title: string;
  hypothesis: string;
  method_summary: string;
  instruments: string | null;
  contact_email: string;
  orcid: string | null;
  affiliation: string | null;
  status: string;
  created_at: string;
}

export const PreregistrationQueue = () => {
  const [rows, setRows] = useState<Prereg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('research_preregistrations')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      console.error(error);
      toast.error('Could not load pre-registrations');
      return;
    }
    setRows((data ?? []) as Prereg[]);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: Status) => {
    const { error } = await supabase
      .from('research_preregistrations')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      console.error(error);
      toast.error('Status not saved');
      return;
    }
    toast.success(`Marked ${status.replace('_', ' ')}`);
    load();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Research pre-registrations</h2>
        <Badge variant="outline">{rows.length}</Badge>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No pre-registrations yet.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="border border-border rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">{r.title}</h3>
                <Badge variant="secondary">{r.status.replace('_', ' ')}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(r.created_at).toLocaleString()} | {r.contact_email}
                {r.affiliation ? ` | ${r.affiliation}` : ''}
                {r.orcid ? ` | ORCID ${r.orcid}` : ''}
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="font-medium">Hypothesis:</span> {r.hypothesis}</p>
                <p><span className="font-medium">Method:</span> {r.method_summary}</p>
                {r.instruments && (
                  <p><span className="font-medium">Instruments:</span> {r.instruments}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {STATUSES.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={r.status === s ? 'default' : 'outline'}
                    onClick={() => setStatus(r.id, s)}
                  >
                    {s.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
