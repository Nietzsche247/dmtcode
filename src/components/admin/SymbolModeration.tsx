import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, Eye, EyeOff, Ban } from 'lucide-react';

interface RegistrySymbol {
  id: string;
  image_data: string;
  source: string;
  confirmation_count: number;
  created_at: string;
  is_unique: boolean;
  user_id: string | null;
  motif_tags: string[];
}

export const SymbolModeration = () => {
  const [pendingSymbols, setPendingSymbols] = useState<RegistrySymbol[]>([]);
  const [recentSymbols, setRecentSymbols] = useState<RegistrySymbol[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSymbols();
    
    // Real-time updates
    const channel = supabase
      .channel('symbol-moderation')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'registry_glyphs'
      }, () => {
        loadSymbols();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSymbols = async () => {
    setLoading(true);

    // Load recent submissions (last 24h)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const { data: recent } = await supabase
      .from('registry_glyphs')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });

    if (recent) {
      setRecentSymbols(recent);
    }

    // Load flagged symbols (would need a flag column in future)
    // For now just show all symbols with low confirmation
    const { data: pending } = await supabase
      .from('registry_glyphs')
      .select('*')
      .eq('confirmation_count', 1)
      .order('created_at', { ascending: false })
      .limit(20);

    if (pending) {
      setPendingSymbols(pending);
    }

    setLoading(false);
  };

  const handleApprove = async (symbolId: string) => {
    const { error } = await supabase
      .from('registry_glyphs')
      .update({ is_unique: true })
      .eq('id', symbolId);

    if (error) {
      toast.error('Failed to approve symbol');
    } else {
      toast.success('Symbol approved');
      loadSymbols();
    }
  };

  const handleReject = async (symbolId: string) => {
    const { error } = await supabase
      .from('registry_glyphs')
      .delete()
      .eq('id', symbolId);

    if (error) {
      toast.error('Failed to reject symbol');
    } else {
      toast.success('Symbol rejected and removed');
      loadSymbols();
    }
  };

  const handleHide = async (symbolId: string) => {
    const { error } = await supabase
      .from('registry_glyphs')
      .update({ is_unique: false })
      .eq('id', symbolId);

    if (error) {
      toast.error('Failed to hide symbol');
    } else {
      toast.success('Symbol hidden from gallery');
      loadSymbols();
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading moderation queue...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Recent Submissions */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Recent Submissions (Last 24h)</h2>
        <div className="text-sm text-muted-foreground mb-4">
          {recentSymbols.length} new symbols submitted
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentSymbols.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-8">
              No recent submissions
            </p>
          ) : (
            recentSymbols.map((symbol) => (
              <Card key={symbol.id} className="p-4 space-y-4">
                <div className="aspect-square w-full bg-white rounded overflow-hidden">
                  <img 
                    src={symbol.image_data} 
                    alt={`Symbol ${symbol.id}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline">{symbol.source}</Badge>
                    <span className="text-muted-foreground">
                      {symbol.confirmation_count} confirmations
                    </span>
                  </div>
                  {symbol.motif_tags && symbol.motif_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {symbol.motif_tags.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Submitted {new Date(symbol.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(symbol.id)}
                    className="flex-1"
                    aria-label="Approve symbol"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleHide(symbol.id)}
                    aria-label="Hide symbol"
                  >
                    <EyeOff className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(symbol.id)}
                    aria-label="Reject and delete symbol"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Pending Review */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Pending Review (Low Confirmation)</h2>
        <div className="text-sm text-muted-foreground mb-4">
          {pendingSymbols.length} symbols with ≤1 confirmation requiring review
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pendingSymbols.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-8">
              No pending reviews
            </p>
          ) : (
            pendingSymbols.map((symbol) => (
              <Card key={symbol.id} className="p-3 space-y-3">
                <div className="aspect-square w-full bg-white rounded overflow-hidden">
                  <img 
                    src={symbol.image_data} 
                    alt={`Symbol ${symbol.id}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(symbol.id)}
                    className="flex-1"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(symbol.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Statistics */}
      <Card className="p-6 bg-muted/30">
        <h3 className="text-xl font-semibold mb-4">Moderation Statistics</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-3xl font-bold text-primary">{recentSymbols.length}</div>
            <div className="text-sm text-muted-foreground">Last 24h submissions</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">{pendingSymbols.length}</div>
            <div className="text-sm text-muted-foreground">Pending review</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">
              {recentSymbols.filter(s => s.is_unique).length}
            </div>
            <div className="text-sm text-muted-foreground">Approved (unique)</div>
          </div>
        </div>
      </Card>
    </div>
  );
};