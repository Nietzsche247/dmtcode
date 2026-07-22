import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';

/**
 * Real convergence stats. Reads ONLY symbol_submissions + symbol_votes.
 * The seeded registry_glyphs table is a separate reference library and is
 * intentionally NOT counted here.
 */
export const RegistryStatistics = () => {
  const [stats, setStats] = useState({
    contributedSubmissions: 0,
    independentConfirmations: 0,
    multiConfirmed: 0,
    lastUpdated: null as Date | null,
  });

  const loadStats = async () => {
    const [{ count: subCount }, { count: seenCount }, { data: multi }, { data: latest }] =
      await Promise.all([
        supabase.from('symbol_submissions').select('*', { count: 'exact', head: true }),
        supabase
          .from('symbol_votes')
          .select('*', { count: 'exact', head: true })
          .eq('vote_type', 'seen_it'),
        supabase.from('symbol_submissions').select('id').gte('upvotes', 3),
        supabase
          .from('symbol_submissions')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

    setStats({
      contributedSubmissions: subCount ?? 0,
      independentConfirmations: seenCount ?? 0,
      multiConfirmed: multi?.length ?? 0,
      lastUpdated: latest && latest[0] ? new Date(latest[0].created_at) : null,
    });
  };

  useEffect(() => {
    loadStats();

    const channel = supabase
      .channel('registry-stats-real')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'symbol_submissions' },
        () => loadStats(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'symbol_votes' },
        () => loadStats(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Live Statistics</h2>
      <p className="text-center text-sm text-muted-foreground mb-8">
        Contributed symbols and independent confirmations from real participants.
        Seeded reference glyphs are excluded.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
        <Card className="p-6 text-center bg-card border-border">
          <div className="text-3xl md:text-4xl font-bold text-gold mb-2">
            {stats.contributedSubmissions}
          </div>
          <div className="text-sm text-muted-foreground">Contributed Submissions</div>
        </Card>

        <Card className="p-6 text-center bg-card border-border">
          <div className="text-3xl md:text-4xl font-bold text-gold mb-2">
            {stats.independentConfirmations}
          </div>
          <div className="text-sm text-muted-foreground">Independent Confirmations</div>
        </Card>

        <Card className="p-6 text-center bg-card border-border">
          <div className="text-3xl md:text-4xl font-bold text-gold mb-2">
            {stats.multiConfirmed}
          </div>
          <div className="text-sm text-muted-foreground">
            Symbols Confirmed by ≥3 Participants
          </div>
        </Card>

        <Card className="p-6 text-center bg-card border-border">
          <div className="text-3xl md:text-4xl font-bold text-gold mb-2">
            {stats.lastUpdated ? stats.lastUpdated.toLocaleDateString() : 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">Last Contribution</div>
        </Card>
      </div>
    </section>
  );
};
