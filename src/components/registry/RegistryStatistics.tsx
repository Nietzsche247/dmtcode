import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';

export const RegistryStatistics = () => {
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    uniqueSymbols: 0,
    multipleReports: 0,
    lastUpdated: null as Date | null
  });

  useEffect(() => {
    const loadStats = async () => {
      const { data, error } = await supabase
        .from('registry_glyphs')
        .select('id, is_unique, confirmation_count, created_at');

      if (!error && data) {
        const uniqueCount = data.filter(g => g.is_unique).length;
        const multipleReports = data.filter(g => g.confirmation_count >= 3).length;
        const lastUpdated = data.length > 0 
          ? new Date(Math.max(...data.map(g => new Date(g.created_at).getTime())))
          : null;

        setStats({
          totalSubmissions: data.length,
          uniqueSymbols: uniqueCount,
          multipleReports,
          lastUpdated
        });
      }
    };

    loadStats();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('registry-stats')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'registry_glyphs' 
      }, () => {
        loadStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Live Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
        <Card className="p-6 text-center bg-card border-border">
          <div className="text-3xl md:text-4xl font-bold text-gold mb-2">
            {stats.totalSubmissions}
          </div>
          <div className="text-sm text-muted-foreground">Total Submissions</div>
        </Card>

        <Card className="p-6 text-center bg-card border-border">
          <div className="text-3xl md:text-4xl font-bold text-gold mb-2">
            {stats.uniqueSymbols}
          </div>
          <div className="text-sm text-muted-foreground">Unique Symbols</div>
        </Card>

        <Card className="p-6 text-center bg-card border-border">
          <div className="text-3xl md:text-4xl font-bold text-gold mb-2">
            {stats.multipleReports}
          </div>
          <div className="text-sm text-muted-foreground">Symbols Reported by ≥3 Participants</div>
        </Card>

        <Card className="p-6 text-center bg-card border-border">
          <div className="text-3xl md:text-4xl font-bold text-gold mb-2">
            {stats.lastUpdated ? stats.lastUpdated.toLocaleDateString() : 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">Last Updated</div>
        </Card>
      </div>
    </section>
  );
};
