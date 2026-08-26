import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { theorySlug } from '@/lib/theorySlug';

interface Entry {
  key: string;
  label: string;
  text: string;
  created_at: string;
  to?: string;
  note?: string;
}

const firstWords = (value: string | null) => {
  if (!value) return '';
  const words = value.trim().split(/\s+/).slice(0, 12).join(' ');
  return words.length < value.trim().length ? `${words}...` : words;
};

export const ActivityThread = ({ userId }: { userId: string }) => {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [subsRes, savedRes, watchRes] = await Promise.all([
        supabase
          .from('symbol_submissions')
          .select('id, description, visibility_status, moderation_status, rejection_reason, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('saved_symbols')
          .select('id, symbol_id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('trial_watchlist')
          .select('id, trial_id, created_at')
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      const merged: Entry[] = [];

      for (const s of subsRes.data || []) {
        // Visibility, not review. A public symbol may still be unreviewed.
        // Review outcome is a separate dimension and the submitter is entitled
        // to see their own, including the reason a reviewer wrote.
        const isPublic = s.visibility_status === 'public';
        const moderation = (s as { moderation_status?: string | null }).moderation_status || 'unreviewed';
        const reason = (s as { rejection_reason?: string | null }).rejection_reason || '';

        const parts: string[] = [];
        if (!isPublic) parts.push('not published');
        if (moderation === 'denied') parts.push('review outcome: declined');
        else if (moderation === 'reviewed') parts.push('review outcome: reviewed');
        else if (moderation === 'reported') parts.push('review outcome: reported');
        else parts.push('review outcome: not yet reviewed');
        if (reason) parts.push(`reason: ${reason}`);

        merged.push({
          key: `sub-${s.id}`,
          label: 'Submitted a symbol',
          text: firstWords(s.description) || 'Symbol report',
          created_at: s.created_at,
          to: isPublic ? `/registry/${s.id}` : undefined,
          note: parts.join(' | '),
        });
      }

      for (const s of savedRes.data || []) {
        merged.push({
          key: `saved-${s.id}`,
          label: 'Saved a symbol',
          text: '',
          created_at: s.created_at,
          to: `/registry/${s.symbol_id}`,
        });
      }

      const watches = watchRes.data || [];
      let trialTitles: Record<string, string> = {};
      const trialIds = Array.from(new Set(watches.map((w) => w.trial_id).filter(Boolean)));
      if (trialIds.length > 0) {
        const { data } = await supabase
          .from('clinical_trials')
          .select('id, title')
          .in('id', trialIds);
        for (const t of data || []) trialTitles[t.id] = t.title;
      }

      for (const w of watches) {
        merged.push({
          key: `watch-${w.id}`,
          label: 'Started watching',
          text: trialTitles[w.trial_id] || 'Trial record',
          created_at: w.created_at,
          to: `/trials/${w.trial_id}`,
        });
      }

      const { data: followsData } = await supabase
        .from('follows')
        .select('id, entity_type, entity_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      const follows = followsData || [];
      if (follows.length > 0) {
        const idsFor = (type: string) =>
          Array.from(new Set(follows.filter((f) => f.entity_type === type).map((f) => f.entity_id)));

        const articleIds = idsFor('article');
        const theoryIds = idsFor('theory');
        const protocolIds = idsFor('protocol');
        const retreatIds = idsFor('retreat');
        const eventIds = idsFor('event');
        const followedTrialIds = idsFor('trial');

        const [articles, theories, protocols, retreats, events, trials] = await Promise.all([
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
          followedTrialIds.length
            ? supabase.from('clinical_trials').select('id, title').in('id', followedTrialIds)
            : Promise.resolve({ data: [] as any[] }),
        ]);

        for (const f of follows) {
          let text: string | null = null;
          let to: string | undefined;

          if (f.entity_type === 'article') {
            const a = (articles.data ?? []).find((x: any) => x.id === f.entity_id);
            if (a) { text = a.title; to = `/articles/${a.slug}`; }
          } else if (f.entity_type === 'theory') {
            const t = (theories.data ?? []).find((x: any) => x.id === f.entity_id);
            if (t) { text = t.title; to = `/theories/${theorySlug(t.title)}`; }
          } else if (f.entity_type === 'protocol') {
            const p = (protocols.data ?? []).find((x: any) => x.id === f.entity_id);
            if (p) { text = p.title; to = `/protocols/${p.slug}`; }
          } else if (f.entity_type === 'retreat') {
            const r = (retreats.data ?? []).find((x: any) => x.id === f.entity_id);
            if (r) { text = r.name; to = `/retreats/${r.id}`; }
          } else if (f.entity_type === 'event') {
            const e = (events.data ?? []).find((x: any) => x.id === f.entity_id);
            if (e) { text = e.title; to = `/events/${e.id}`; }
          } else if (f.entity_type === 'trial') {
            const tr = (trials.data ?? []).find((x: any) => x.id === f.entity_id);
            if (tr) { text = tr.title; to = `/trials/${tr.id}`; }
          }

          if (!text || !to) continue;

          merged.push({
            key: `follow-${f.id}`,
            label: 'Followed',
            text,
            created_at: f.created_at,
            to,
          });
        }
      }

      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (!cancelled) setEntries(merged.slice(0, 30));
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (entries.length === 0) return null;

  return (
    <section className="mt-12 space-y-4">
      <h2 className="text-xl font-serif">Your thread</h2>
      <div className="space-y-2">
        {entries.map((e) => (
          <Card key={e.key} className="p-4 bg-card border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm">
                  <span className="font-medium">{e.label}</span>
                  {e.text && (
                    <>
                      {': '}
                      {e.to ? (
                        <Link to={e.to} className="text-primary underline underline-offset-2">
                          {e.text}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{e.text}</span>
                      )}
                    </>
                  )}
                  {!e.text && e.to && (
                    <>
                      {' '}
                      <Link to={e.to} className="text-primary underline underline-offset-2">
                        View
                      </Link>
                    </>
                  )}
                </div>
                {e.note && <div className="text-xs text-muted-foreground mt-1">{e.note}</div>}
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {new Date(e.created_at).toLocaleDateString()}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
