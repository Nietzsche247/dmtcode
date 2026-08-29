import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, Image, Eye } from 'lucide-react';

interface Stats {
  totalSymbols: number;
  totalContributors: number;
  totalValidations: number;
}

export const CommunityStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalSymbols: 0,
    totalContributors: 0,
    totalValidations: 0,
  });
  const [loading, setLoading] = useState(true);
  // A failed fetch must never read as zero. Zero is a real number here.
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Real convergence: symbol_submissions + symbol_votes only.
      // Seeded registry_glyphs are a separate reference library and are
      // intentionally NOT counted here.
      //
      // Scoped to status = 'approved' so the number equals exactly the rows a
      // reader can open in the registry explorer at /registry?set=submissions.
      // A counter that cannot be walked back to its rows is not checkable.
      const { count: submissionCount } = await supabase
        .from('symbol_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { data: contributors } = await supabase
        .from('symbol_submissions')
        .select('user_id')
        .eq('status', 'approved');

      const uniqueContributors = new Set(
        (contributors || []).map(c => c.user_id).filter(Boolean)
      );

      const { count: validationCount } = await supabase
        .from('symbol_votes')
        .select('*', { count: 'exact', head: true })
        .eq('vote_type', 'seen_it');

      setStats({
        totalSymbols: submissionCount || 0,
        totalContributors: uniqueContributors.size,
        totalValidations: validationCount || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setFailed(true);
    }
    setLoading(false);
  };

  const fmt = (n: number) => (loading ? '\u2026' : failed ? 'unavailable' : n.toLocaleString());

  const statItems: {
    value: string;
    label: string;
    icon: typeof Image;
    href?: string;
    note?: string;
  }[] = [
    {
      value: fmt(stats.totalSymbols),
      label: 'Community Submissions',
      icon: Image,
      // Backed by a real filtered query: the explorer loads exactly these rows.
      href: '/registry?set=submissions#browse',
    },
    {
      value: fmt(stats.totalContributors),
      label: 'Independent Contributors',
      icon: Users,
      // NOT LINKED ON PURPOSE. This is a count of distinct submitting accounts.
      // The registry explorer lists symbols, not contributors, so no filtered
      // registry view returns this set of rows. Linking it to a symbol list
      // would show a different number of rows than the counter states.
      note: 'Distinct submitting accounts. No registry view lists contributors, so this number is not linked.',
    },
    {
      value: fmt(stats.totalValidations),
      label: 'Community Validations',
      icon: Eye,
      // NOT LINKED ON PURPOSE. This counts rows in symbol_votes, not symbols.
      // A link to a symbol list would return a different row count, and these
      // are post-exposure recognitions, not independent replications.
      note: 'Counts recognition responses recorded after seeing a form here, not independent replications.',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {statItems.map((stat, i) => {
        const body = (
          <>
            <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
            <div
              className={`text-3xl md:text-4xl font-bold text-primary mb-2 ${loading ? 'animate-pulse' : ''}`}
              style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
            >
              {stat.value}
            </div>
            <div
              className="text-sm text-muted-foreground"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {stat.label}
            </div>
            {stat.note && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">{stat.note}</p>
            )}
            {stat.href && (
              <p className="mt-2 text-xs text-muted-foreground/80">See the rows behind this number</p>
            )}
          </>
        );

        const shell = 'text-center p-6 rounded-2xl bg-card/30 border border-border/30';

        return stat.href ? (
          <Link
            key={i}
            to={stat.href}
            className={`${shell} block transition-colors hover:border-primary/50`}
          >
            {body}
          </Link>
        ) : (
          <div key={i} className={shell}>
            {body}
          </div>
        );
      })}
    </div>
  );
};
