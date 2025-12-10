import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Database, Clock, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface ApiLog {
  id: number;
  endpoint: string;
  format: string | null;
  filters: Record<string, unknown> | null;
  accessed_at: string | null;
}

export const ApiAccessLog = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, today: 0, unique_formats: 0 });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_access_log')
        .select('*')
        .order('accessed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        filters: item.filters as Record<string, unknown> | null
      }));
      
      setLogs(typedData);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayCount = typedData.filter(log => 
        log.accessed_at?.startsWith(today)
      ).length;
      const uniqueFormats = new Set(typedData.map(log => log.format)).size;

      setStats({
        total: typedData.length,
        today: todayCount,
        unique_formats: uniqueFormats
      });
    } catch (error) {
      console.error('Failed to fetch API logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getFormatBadge = (format: string | null) => {
    const colors: Record<string, string> = {
      full: 'bg-primary/20 text-primary',
      summary: 'bg-accent/20 text-accent-foreground',
      timeline: 'bg-secondary/20 text-secondary-foreground'
    };
    return (
      <Badge className={colors[format || 'full'] || 'bg-muted text-muted-foreground'}>
        {format || 'full'}
      </Badge>
    );
  };

  const formatFilters = (filters: Record<string, unknown> | null) => {
    if (!filters || Object.keys(filters).length === 0) return '—';
    const activeFilters = Object.entries(filters)
      .filter(([_, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${k}=${v}`);
    return activeFilters.length > 0 ? activeFilters.join(', ') : '—';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Access Log</h2>
          <p className="text-muted-foreground">
            Track which AI systems are querying the forecasts API
          </p>
        </div>
        <Button onClick={fetchLogs} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Last 100 logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">Requests today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Formats Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.unique_formats}</div>
            <p className="text-xs text-muted-foreground">Unique formats</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No API requests logged yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Filters</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.accessed_at 
                        ? format(new Date(log.accessed_at), 'MMM d, yyyy HH:mm:ss')
                        : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.endpoint}
                    </TableCell>
                    <TableCell>
                      {getFormatBadge(log.format)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFilters(log.filters)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
