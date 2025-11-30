import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SymbolNode {
  id: string;
  tags: string[];
  confirmations: number;
  surface: string | null;
}

interface Correlation {
  symbol1: string;
  symbol2: string;
  sharedTags: string[];
  coOccurrence: number;
}

export const CorrelationsNetwork = () => {
  const [symbols, setSymbols] = useState<SymbolNode[]>([]);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadSymbols();
  }, []);

  const loadSymbols = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('registry_glyphs')
      .select('id, motif_tags, confirmation_count, perceived_surface')
      .gte('confirmation_count', 2); // Only symbols with multiple confirmations

    if (!error && data) {
      setSymbols(data.map(s => ({
        id: s.id,
        tags: s.motif_tags || [],
        confirmations: s.confirmation_count,
        surface: s.perceived_surface
      })));
    }
    setLoading(false);
  };

  const analyzeCorrelations = () => {
    setAnalyzing(true);
    const correlationMap: Correlation[] = [];

    // Calculate pairwise correlations
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const s1 = symbols[i];
        const s2 = symbols[j];
        
        const sharedTags = s1.tags.filter(tag => s2.tags.includes(tag));
        
        if (sharedTags.length > 0) {
          const coOccurrence = (sharedTags.length / Math.max(s1.tags.length, s2.tags.length)) * 100;
          
          correlationMap.push({
            symbol1: s1.id,
            symbol2: s2.id,
            sharedTags,
            coOccurrence: Math.round(coOccurrence)
          });
        }
      }
    }

    // Sort by co-occurrence strength
    correlationMap.sort((a, b) => b.coOccurrence - a.coOccurrence);
    setCorrelations(correlationMap);
    setAnalyzing(false);
    toast.success(`Found ${correlationMap.length} correlation pairs`);
  };

  const exportCSV = () => {
    const csv = [
      ['Symbol 1', 'Symbol 2', 'Shared Tags', 'Co-occurrence %'],
      ...correlations.map(c => [
        c.symbol1,
        c.symbol2,
        c.sharedTags.join('; '),
        c.coOccurrence.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dmtcode-correlations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Correlation data exported');
  };

  const exportJSON = () => {
    const json = JSON.stringify({
      metadata: {
        generated: new Date().toISOString(),
        symbolCount: symbols.length,
        correlationCount: correlations.length
      },
      symbols: symbols.map(s => ({
        id: s.id,
        tags: s.tags,
        confirmations: s.confirmations,
        surface: s.surface
      })),
      correlations: correlations.map(c => ({
        pair: [c.symbol1, c.symbol2],
        sharedTags: c.sharedTags,
        coOccurrence: c.coOccurrence
      }))
    }, null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dmtcode-correlations-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Correlation data exported');
  };

  // Calculate surface-specific clusters
  const surfaceClusters = symbols.reduce((acc, s) => {
    if (s.surface) {
      if (!acc[s.surface]) acc[s.surface] = [];
      acc[s.surface].push(s);
    }
    return acc;
  }, {} as Record<string, SymbolNode[]>);

  // Calculate tag frequency
  const tagFrequency = symbols.reduce((acc, s) => {
    s.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (symbols.length < 100) {
    return (
      <Card className="p-8 bg-muted/30 border-border">
        <div className="text-center space-y-4">
          <Network className="w-16 h-16 mx-auto text-muted-foreground" />
          <h3 className="text-2xl font-semibold">Network Analysis Locked</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Network graph and correlation analysis requires ≥100 symbols with multiple confirmations. 
            Current dataset: {symbols.length} symbols.
          </p>
          <div className="h-3 bg-muted rounded-full max-w-sm mx-auto overflow-hidden">
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: `${(symbols.length / 100) * 100}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>{100 - symbols.length} symbols remaining</strong> before activation
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Network Analysis Active</h3>
            <p className="text-sm text-muted-foreground">
              {symbols.length} symbols · {correlations.length} correlation pairs detected
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={analyzeCorrelations}
              disabled={analyzing}
              variant="default"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Network className="w-4 h-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
            <Button onClick={exportCSV} variant="outline" disabled={correlations.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button onClick={exportJSON} variant="outline" disabled={correlations.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>
      </Card>

      {/* Top Tag Frequency */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Top Motif Tags</h3>
        <div className="flex flex-wrap gap-3">
          {topTags.map(([tag, count]) => (
            <Badge key={tag} variant="secondary" className="text-sm">
              {tag} <span className="ml-2 text-xs text-muted-foreground">({count})</span>
            </Badge>
          ))}
        </div>
      </Card>

      {/* Surface Clusters */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Surface-Specific Clustering</h3>
        <div className="space-y-4">
          {Object.entries(surfaceClusters).map(([surface, nodes]) => {
            const avgConfirmations = nodes.reduce((sum, n) => sum + n.confirmations, 0) / nodes.length;
            const allTags = nodes.flatMap(n => n.tags);
            const uniqueTags = [...new Set(allTags)];
            
            return (
              <div key={surface} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold capitalize">{surface}</h4>
                  <Badge variant="outline">
                    {nodes.length} symbols · {avgConfirmations.toFixed(1)} avg confirmations
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {uniqueTags.slice(0, 8).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {uniqueTags.length > 8 && (
                    <Badge variant="outline" className="text-xs">
                      +{uniqueTags.length - 8} more
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Top Correlations */}
      {correlations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Strongest Correlations</h3>
          <div className="space-y-3">
            {correlations.slice(0, 20).map((corr, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-mono text-muted-foreground mb-1">
                    {corr.symbol1.substring(0, 8)} ↔ {corr.symbol2.substring(0, 8)}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {corr.sharedTags.map((tag, j) => (
                      <Badge key={j} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Badge variant="default" className="ml-4">
                  {corr.coOccurrence}% match
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};