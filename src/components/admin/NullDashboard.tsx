import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle } from 'lucide-react';

interface NullReport {
  wavelength: string;
  surface: string;
  count: number;
}

export const NullDashboard = () => {
  const [nullReports, setNullReports] = useState<NullReport[]>([]);
  const [totalNulls, setTotalNulls] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNullReports();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('null_reports')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registry_glyphs',
          filter: 'motif_tags=cs.{null_report}'
        },
        () => {
          loadNullReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNullReports = async () => {
    try {
      const { data, error } = await supabase
        .from('registry_glyphs')
        .select('motif_tags, perceived_surface')
        .contains('motif_tags', ['null_report']);

      if (error) throw error;

      // Group by wavelength and surface
      const grouped: { [key: string]: NullReport } = {};
      
      data?.forEach(report => {
        const tags = report.motif_tags || [];
        const wavelength = tags.find((tag: string) => tag.startsWith('wavelength_'))?.replace('wavelength_', '') || 'unknown';
        const surface = report.perceived_surface || 'not_specified';
        const key = `${wavelength}_${surface}`;

        if (!grouped[key]) {
          grouped[key] = { wavelength, surface, count: 0 };
        }
        grouped[key].count++;
      });

      const chartData = Object.values(grouped).sort((a, b) => b.count - a.count);
      setNullReports(chartData);
      setTotalNulls(data?.length || 0);
    } catch (error) {
      console.error('Error loading null reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#ff0000', '#ffeb3b', '#00ff00', '#0000ff', '#ff00ff', '#00ffff'];

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">Loading null reports...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-muted/30 border-2 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-gold" />
          <div>
            <h3 className="text-xl font-bold">Null Report Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Live heatmap of "I saw nothing" submissions by wavelength and surface
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-background/50">
            <div className="text-2xl font-bold text-primary">{totalNulls}</div>
            <div className="text-sm text-muted-foreground">Total Null Reports</div>
          </Card>
          <Card className="p-4 bg-background/50">
            <div className="text-2xl font-bold text-gold">{nullReports.length}</div>
            <div className="text-sm text-muted-foreground">Unique Conditions</div>
          </Card>
          <Card className="p-4 bg-background/50">
            <div className="text-2xl font-bold text-green-500">
              {totalNulls > 0 ? ((totalNulls / (totalNulls + 100)) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Null Rate (est.)</div>
          </Card>
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Wavelength × Surface Distribution</h4>
        {nullReports.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={nullReports}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="wavelength" 
                stroke="#888"
                tick={{ fill: '#888' }}
              />
              <YAxis 
                stroke="#888"
                tick={{ fill: '#888' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #333',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#ffeb3b' }}
              />
              <Legend />
              <Bar dataKey="count" name="Null Reports">
                {nullReports.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            No null reports yet. Baseline data pending.
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Detailed Breakdown</h4>
        <div className="space-y-2">
          {nullReports.map((report, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div>
                  <div className="font-medium capitalize">
                    {report.wavelength.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    Surface: {report.surface.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>
              <div className="text-xl font-bold text-primary">
                {report.count}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
