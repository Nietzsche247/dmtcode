import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface KitRow {
  slug: string;
  name: string;
  ships_status: string | null;
  signups: number;
  awaiting: number;
}

export const KitSignups = () => {
  const [rows, setRows] = useState<KitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingSlug, setSendingSlug] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: signups }, { data: bundles }] = await Promise.all([
      supabase.from('product_signups').select('bundle_slug, notified_at'),
      supabase.from('bundles').select('slug, name, ships_status'),
    ]);

    const bundleMap = new Map(
      (bundles ?? []).map((b) => [b.slug, b as { slug: string; name: string; ships_status: string | null }])
    );

    const grouped = new Map<string, KitRow>();
    for (const s of signups ?? []) {
      const slug = s.bundle_slug;
      if (!slug) continue;
      const existing = grouped.get(slug);
      const base =
        existing ??
        {
          slug,
          name: bundleMap.get(slug)?.name ?? slug,
          ships_status: bundleMap.get(slug)?.ships_status ?? null,
          signups: 0,
          awaiting: 0,
        };
      base.signups += 1;
      if (!s.notified_at) base.awaiting += 1;
      grouped.set(slug, base);
    }

    setRows(Array.from(grouped.values()).sort((a, b) => b.signups - a.signups));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const notify = async (slug: string) => {
    setSendingSlug(slug);
    try {
      const { data, error } = await supabase.functions.invoke('notify-kit-ships', {
        body: { bundle_slug: slug },
      });
      if (error) throw error;
      toast.success(
        `Sent ${data.sent}, failed ${data.failed}, already notified ${data.already_notified}`
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Notification failed');
    } finally {
      setSendingSlug(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kit signups</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kit</TableHead>
                  <TableHead>Signups</TableHead>
                  <TableHead>Awaiting notice</TableHead>
                  <TableHead>Ships status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.slug}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.signups}</TableCell>
                    <TableCell>{row.awaiting}</TableCell>
                    <TableCell>
                      {row.ships_status ? (
                        <Badge variant={row.ships_status === 'now' ? 'default' : 'secondary'}>
                          {row.ships_status === 'now' ? 'Ships now' : 'Preorder'}
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        disabled={
                          row.ships_status !== 'now' ||
                          row.awaiting === 0 ||
                          sendingSlug === row.slug
                        }
                        onClick={() => notify(row.slug)}
                      >
                        {sendingSlug === row.slug ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Send ship notification'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
