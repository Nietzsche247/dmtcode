import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface NullReport {
  wavelength: string;
  surface: string;
  count: number;
}

const NullReports = () => {
  const [nullReports, setNullReports] = useState<NullReport[]>([]);
  const [totalNulls, setTotalNulls] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNullReports();
    
    const channel = supabase
      .channel('null_reports_changes')
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
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('registry_glyphs')
        .select('*')
        .contains('motif_tags', ['null_report']);

      if (error) throw error;

      const aggregated: Record<string, NullReport> = {};
      
      data?.forEach((report) => {
        const wavelengthTag = report.motif_tags?.find((tag: string) => tag.startsWith('wavelength_')) || 'wavelength_unknown';
        const wavelength = wavelengthTag.replace('wavelength_', '').replace('_', ' ');
        const surface = report.perceived_surface || 'unspecified';
        const key = `${wavelength}_${surface}`;
        
        if (!aggregated[key]) {
          aggregated[key] = { wavelength, surface, count: 0 };
        }
        aggregated[key].count += 1;
      });

      const reports = Object.values(aggregated);
      setNullReports(reports);
      setTotalNulls(data?.length || 0);
    } catch (error) {
      console.error('Error loading null reports:', error);
      toast.error('Failed to load null reports');
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Wavelength', 'Surface', 'Count'];
    const rows = nullReports.map(r => [r.wavelength, r.surface, r.count]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `null-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const exportJSON = () => {
    const json = JSON.stringify(nullReports, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `null-reports-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON downloaded');
  };

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6'];

  return (
    <>
      <Helmet>
        <title>Null Reports - DMT Code</title>
        <meta name="description" content="Live data tracking null reports: wavelength vs surface conditions where no visual symbols appeared. Help us kill selection bias." />
        <link rel="canonical" href="https://dmtcode.com/null-reports" />
      </Helmet>
      
      <Navigation />
      
      <main className="min-h-screen bg-background py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Null Reports Registry
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Help us kill selection bias – every null counts
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Null Reports</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalNulls}</div>
                <p className="text-xs text-muted-foreground">No visual symbols reported</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Conditions</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nullReports.length}</div>
                <p className="text-xs text-muted-foreground">Wavelength × Surface combinations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Export Data</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button onClick={exportCSV} variant="outline" size="sm">
                    CSV
                  </Button>
                  <Button onClick={exportJSON} variant="outline" size="sm">
                    JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Heatmap Chart */}
          {!isLoading && nullReports.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Null Report Distribution</CardTitle>
                <CardDescription>Wavelength × Surface heatmap showing negative result frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={nullReports}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="wavelength" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border p-3 rounded shadow-lg">
                              <p className="font-semibold">{data.wavelength}</p>
                              <p className="text-sm text-muted-foreground">{data.surface}</p>
                              <p className="text-sm">Count: {data.count}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" name="Null Reports">
                      {nullReports.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Breakdown</CardTitle>
              <CardDescription>All wavelength × surface combinations with null results</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading null reports...</p>
              ) : nullReports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No null reports yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Wavelength</TableHead>
                        <TableHead>Perceived Surface</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nullReports
                        .sort((a, b) => b.count - a.count)
                        .map((report, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{report.wavelength}</TableCell>
                            <TableCell>{report.surface}</TableCell>
                            <TableCell className="text-right">{report.count}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <Card className="bg-muted/50 border-2">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-3">Submit Your Null Report</h2>
                <p className="text-muted-foreground mb-4">
                  Observed no visual symbols during laser exposure? Your negative result is valuable data.
                </p>
                <Button asChild size="lg" variant="default">
                  <a href="/submit?null=true">Report Null Observation</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default NullReports;
