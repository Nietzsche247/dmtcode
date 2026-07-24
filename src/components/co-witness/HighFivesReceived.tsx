import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { AvatarGlyph } from '@/components/AvatarGlyph';

interface Row {
  id: string;
  from_user: string;
  symbol_id: string;
  created_at: string;
  handle: string;
  avatar_seed: string;
  image_url: string | null;
  svg_data: string | null;
  returned: boolean;
}

/**
 * Quiet list of high-fives the signed-in user has received. Renders nothing
 * when empty. If the viewer has not high-fived back on the same symbol, a
 * "Return it" link points to the symbol page.
 */
export const HighFivesReceived = ({ userId }: { userId: string }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: hf } = await (supabase as any)
        .from('co_witness_high_fives')
        .select('id, from_user, symbol_id, created_at')
        .eq('to_user', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      const list = (hf as any[]) || [];
      if (list.length === 0) {
        setLoading(false);
        return;
      }
      const userIds = Array.from(new Set(list.map((r) => r.from_user)));
      const symIds = Array.from(new Set(list.map((r) => r.symbol_id)));
      const [{ data: profs }, { data: syms }, { data: returned }] = await Promise.all([
        (supabase as any).from('profiles').select('id,handle,avatar_seed').in('id', userIds),
        (supabase as any).from('symbol_submissions').select('id,image_url,svg_data').in('id', symIds),
        (supabase as any)
          .from('co_witness_high_fives')
          .select('to_user, symbol_id')
          .eq('from_user', userId)
          .in('symbol_id', symIds),
      ]);
      const pmap = new Map<string, any>((profs || []).map((p: any) => [p.id, p]));
      const smap = new Map<string, any>((syms || []).map((s: any) => [s.id, s]));
      const rset = new Set<string>(
        (returned || []).map((r: any) => `${r.to_user}:${r.symbol_id}`)
      );
      const enriched: Row[] = list.map((r) => ({
        id: r.id,
        from_user: r.from_user,
        symbol_id: r.symbol_id,
        created_at: r.created_at,
        handle: pmap.get(r.from_user)?.handle || 'anon',
        avatar_seed: pmap.get(r.from_user)?.avatar_seed || r.from_user,
        image_url: smap.get(r.symbol_id)?.image_url || null,
        svg_data: smap.get(r.symbol_id)?.svg_data || null,
        returned: rset.has(`${r.from_user}:${r.symbol_id}`),
      }));
      setRows(enriched);
      setLoading(false);
    })();
  }, [userId]);

  if (loading || rows.length === 0) return null;

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="font-medium text-base">High-fives received</h3>
        <p className="text-sm text-muted-foreground">
          People who recognized the same symbol and sent an "I believe you".
        </p>
      </div>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-3 border-t border-border pt-3 first:border-0 first:pt-0"
          >
            <AvatarGlyph seed={r.avatar_seed} handle={r.handle} size={36} />
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                <span className="font-medium">@{r.handle}</span> believes you.
              </div>
              <div className="text-[11px] text-muted-foreground">
                {format(new Date(r.created_at), 'MMM d, yyyy')}
              </div>
            </div>
            <Link to={`/registry/${r.symbol_id}`} className="shrink-0" aria-label="View symbol">
              {r.svg_data ? (
                <div
                  className="w-12 h-12 border border-border bg-white"
                  dangerouslySetInnerHTML={{ __html: r.svg_data }}
                />
              ) : r.image_url ? (
                <img
                  src={r.image_url}
                  alt="symbol"
                  className="w-12 h-12 border border-border object-contain bg-white"
                  loading="lazy"
                />
              ) : (
                <div className="w-12 h-12 border border-border bg-muted" />
              )}
            </Link>
            {!r.returned && (
              <Link
                to={`/registry/${r.symbol_id}`}
                className="text-xs text-primary hover:underline whitespace-nowrap"
              >
                Return it
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
};
