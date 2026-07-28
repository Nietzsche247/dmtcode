import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { theorySlug } from '@/lib/theorySlug';

interface FollowRow {
  id: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

interface Entry {
  id: string;
  type: string;
  label: string;
  to: string;
}

export const Following = ({ userId }: { userId: string }) => {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: follows } = await supabase
        .from('follows')
        .select('id, entity_type, entity_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (cancelled) return;
      const rows = (follows ?? []) as FollowRow[];
      if (rows.length === 0) {
        setEntries([]);
        return;
      }

      const idsFor = (type: string) =>
        Array.from(new Set(rows.filter((r) => r.entity_type === type).map((r) => r.entity_id)));

      const articleIds = idsFor('article');
      const theoryIds = idsFor('theory');
      const protocolIds = idsFor('protocol');
      const retreatIds = idsFor('retreat');
      const eventIds = idsFor('event');
      const trialIds = idsFor('trial');
      const symbolIds = idsFor('symbol');

      const [articles, theories, protocols, retreats, events, trials, symbols] = await Promise.all([
        articleIds.length
          ? supabase.from('articles').select('id, title, slug').in('id', articleIds)
          : Promise.resolve({ data: [] as any[] }),
        theoryIds.length
          ? supabase.from('theories').select('id, title').in('id', theoryIds)
          : Promise.resolve({ data: [] as any[] }),
        protocolIds.length
          ? supabase.from('protocols').select('id, title, slug').in('id', protocolIds)
          : Promise.resolve({ data: [] as any[] }),
        retreatIds.length
          ? supabase.from('retreats').select('id, name').in('id', retreatIds)
          : Promise.resolve({ data: [] as any[] }),
        eventIds.length
          ? supabase.from('events').select('id, title').in('id', eventIds)
          : Promise.resolve({ data: [] as any[] }),
        trialIds.length
          ? supabase.from('clinical_trials').select('id, title').in('id', trialIds)
          : Promise.resolve({ data: [] as any[] }),
        symbolIds.length
          ? supabase.from('symbol_submissions').select('id, description, image_url').in('id', symbolIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      if (cancelled) return;

      const resolve = (row: FollowRow): Entry | null => {
        if (row.entity_type === 'article') {
          const a = (articles.data ?? []).find((x: any) => x.id === row.entity_id);
          return a ? { id: row.id, type: 'article', label: a.title, to: `/articles/${a.slug}` } : null;
        }
        if (row.entity_type === 'theory') {
          const t = (theories.data ?? []).find((x: any) => x.id === row.entity_id);
          return t ? { id: row.id, type: 'theory', label: t.title, to: `/theories/${theorySlug(t.title)}` } : null;
        }
        if (row.entity_type === 'protocol') {
          const p = (protocols.data ?? []).find((x: any) => x.id === row.entity_id);
          return p ? { id: row.id, type: 'protocol', label: p.title, to: `/protocols/${p.slug}` } : null;
        }
        if (row.entity_type === 'retreat') {
          const r = (retreats.data ?? []).find((x: any) => x.id === row.entity_id);
          return r ? { id: row.id, type: 'retreat', label: r.name, to: `/retreats/${r.id}` } : null;
        }
        if (row.entity_type === 'event') {
          const e = (events.data ?? []).find((x: any) => x.id === row.entity_id);
          return e ? { id: row.id, type: 'event', label: e.title, to: `/events/${e.id}` } : null;
        }
        if (row.entity_type === 'trial') {
          const tr = (trials.data ?? []).find((x: any) => x.id === row.entity_id);
          return tr ? { id: row.id, type: 'trial', label: tr.title, to: `/trials/${tr.id}` } : null;
        }
        if (row.entity_type === 'symbol') {
          const sy = (symbols.data ?? []).find((x: any) => x.id === row.entity_id);
          if (!sy) return null;
          const desc = (sy.description ?? '').trim();
          return {
            id: row.id,
            type: 'symbol',
            label: desc ? desc.slice(0, 70) : 'Untitled symbol',
            to: `/registry/${sy.id}`,
          };
        }
        return null;
      };

      setEntries(rows.map(resolve).filter(Boolean) as Entry[]);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (entries.length === 0) return null;

  return (
    <section className="mt-12 space-y-4">
      <h2 className="text-2xl font-bold">Following</h2>
      <div className="space-y-2">
        {entries.map((e) => (
          <Card key={e.id} className="p-4 flex items-start justify-between gap-4">
            <Link to={e.to} className="font-medium hover:underline">
              {e.label}
            </Link>
            <span className="text-xs text-muted-foreground shrink-0">{e.type}</span>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default Following;
