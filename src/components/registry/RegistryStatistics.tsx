import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';

/**
 * Real registry statistics.
 *
 * Two rules govern this component.
 *
 * 1. Reference symbols never count as observer submissions. The forms added by
 *    the site operator in November 2025 are illustrations, not reports from
 *    people who saw something, and folding them into a contributor total would
 *    overstate participation.
 *
 * 2. A recognition recorded on this site is post exposure recognition. The
 *    reader was already looking at the symbol here when they pressed the
 *    control. It is not an independent match and it must never be labelled as
 *    one. Independence is the question this registry exists to answer, not
 *    something a vote count can settle.
 *
 * registry_glyphs is a separate anonymous capture table and is not counted here.
 */
export const RegistryStatistics = () => {
  const [stats, setStats] = useState({
    observerSubmissions: 0,
    curatedExamples: 0,
    recognitions: 0,
    multiRecognized: 0,
    lastContribution: null as Date | null,
  });

  const loadStats = async () => {
    const [
      { count: observerCount },
      { count: curatedCount },
      { count: seenCount },
      { data: multi },
      { data: latest },
    ] = await Promise.all([
      supabase
        .from('symbol_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('is_curated_example', false),
      supabase
        .from('symbol_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('is_curated_example', true),
      supabase
        .from('symbol_votes')
        .select('*', { count: 'exact', head: true })
        .eq('vote_type', 'seen_it'),
      supabase
        .from('symbol_submissions')
        .select('id')
        .eq('is_curated_example', false)
        .gte('upvotes', 3),
      supabase
        .from('symbol_submissions')
        .select('created_at')
        .eq('is_curated_example', false)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    setStats({
      observerSubmissions: observerCount ?? 0,
      curatedExamples: curatedCount ?? 0,
      recognitions: seenCount ?? 0,
      multiRecognized: multi?.length ?? 0,
      lastContribution: latest && latest[0] ? new Date(latest[0].created_at) : null,
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
      <p className="text-center text-sm text-muted-foreground mb-8 max-w-3xl mx-auto">
        Counted live from the database. Reference symbols added by the site operator are counted
        separately and are never folded into the observer total. Anonymous captures made through
        the drawing tool are held in a different table and are not counted here.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
        <Card className="p-6 text-center bg-card border-border">
          <div className="text-3xl md:text-4xl font-bold text-gold mb-2">
            {stats.observerSubmissions}
          </div>
          <div className="text-sm text-muted-foreground">Observer Submissions</div>
          <p className="text-xs text-muted-foreground/80 mt-2 leading-relaxed">
            People reporting what they saw
          </p>
        </Card>

        <Card className="p-6 text-center bg-card border-border">
          <div className="text-3xl md:text-4xl font-bold text-gold mb-2">
            {stats.recognitions}
          </div>
          <div className="text-sm text-muted-foreground">Recognized After Seeing It Here</div>
          <p className="text-xs text-muted-foreground/80 mt-2 leading-relaxed">
            Recognition after exposure to this catalogue, not an independent match
          </p>
        </Card>

        <Card className="p-6 text-center bg-card border-border">
          <div className="text-3xl md:text-4xl font-bold text-gold mb-2">
            {stats.multiRecognized}
          </div>
          <div className="text-sm text-muted-foreground">Recognized by 3 or More Readers</div>
          <p className="text-xs text-muted-foreground/80 mt-2 leading-relaxed">
            Observer submissions only
          </p>
        </Card>

        <Card className="p-6 text-center bg-card border-border">
          <div className="text-3xl md:text-4xl font-bold text-gold mb-2">
            {stats.curatedExamples}
          </div>
          <div className="text-sm text-muted-foreground">Reference Symbols</div>
          <p className="text-xs text-muted-foreground/80 mt-2 leading-relaxed">
            Added by the site operator, excluded from every evidence total
          </p>
        </Card>
      </div>

      {stats.lastContribution && (
        <p className="text-center text-sm text-muted-foreground mt-6">
          Last observer submission {stats.lastContribution.toLocaleDateString()}
        </p>
      )}
    </section>
  );
};
