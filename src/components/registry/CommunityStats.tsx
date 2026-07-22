import { useEffect, useState } from 'react';
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

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Real convergence: symbol_submissions + symbol_votes only.
      // Seeded registry_glyphs are a separate reference library and are
      // intentionally NOT counted here.
      const { count: submissionCount } = await supabase
        .from('symbol_submissions')
        .select('*', { count: 'exact', head: true });

      const { data: contributors } = await supabase
        .from('symbol_submissions')
        .select('user_id');

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
    }
    setLoading(false);
  };

  const statItems = [
    {
      value: stats.totalSymbols.toLocaleString(),
      label: 'Community Submissions',
      icon: Image,
    },
    {
      value: stats.totalContributors.toLocaleString(),
      label: 'Independent Contributors',
      icon: Users,
    },
    { 
      value: stats.totalValidations.toLocaleString(), 
      label: 'Community Validations',
      icon: Eye,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {statItems.map((stat, i) => (
        <div 
          key={i}
          className="text-center p-6 rounded-2xl bg-card/30 border border-border/30"
        >
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
        </div>
      ))}
    </div>
  );
};
