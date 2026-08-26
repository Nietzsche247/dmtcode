import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Read path for the hero segmentation door. Counts per segment and the most
// recent tap. The table was write only until now.

const LABELS: Record<string, string> = {
  ran_protocol_saw_symbols: 'Ran the laser protocol and saw symbols',
  met_entity_on_dmt: 'Have met something on DMT',
  dmt_no_protocol: 'Used DMT, not the laser protocol',
  planning_protocol: 'Planning to try the protocol',
  reading_researching: 'Reading and researching',
};

interface Bucket {
  segment: string;
  count: number;
  latest: string;
}

export const DoorTapsPanel = () => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('door_taps')
        .select('segment, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (cancelled) return;
      if (error) console.error('Door taps read failed:', error);

      const rows = data ?? [];
      const map = new Map<string, Bucket>();
      for (const row of rows) {
        const segment = (row as { segment: string }).segment;
        const created = (row as { created_at: string }).created_at;
        const existing = map.get(segment);
        if (!existing) {
          map.set(segment, { segment, count: 1, latest: created });
        } else {
          existing.count += 1;
          if (created > existing.latest) existing.latest = created;
        }
      }
      setBuckets(Array.from(map.values()).sort((a, b) => b.count - a.count));
      setTotal(rows.length);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Registry door taps</h2>
        <Badge variant="outline">{total} taps</Badge>
      </div>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : buckets.length === 0 ? (
        <p className="text-muted-foreground text-sm">No taps recorded.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segment</TableHead>
                <TableHead className="text-right">Taps</TableHead>
                <TableHead>Most recent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buckets.map((b) => (
                <TableRow key={b.segment}>
                  <TableCell>{LABELS[b.segment] || b.segment}</TableCell>
                  <TableCell className="text-right font-medium">{b.count}</TableCell>
                  <TableCell>{new Date(b.latest).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};
