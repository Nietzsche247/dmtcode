import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

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
          .select('id, description, status, created_at')
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
        const approved = s.status === 'approved';
        merged.push({
          key: `sub-${s.id}`,
          label: 'Submitted a symbol',
          text: firstWords(s.description) || 'Symbol report',
          created_at: s.created_at,
          to: approved ? `/registry/${s.id}` : undefined,
          note: approved ? undefined : 'pending review',
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
