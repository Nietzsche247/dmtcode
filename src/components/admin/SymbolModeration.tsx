import { useEffect, useState } from 'react';
import type { Database } from "@/integrations/supabase/types";
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, EyeOff } from 'lucide-react';

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

    // registry_glyphs has no review status column, so there is no real pending
    // queue yet. confirmation_count defaults to 1 and has never been
    // incremented, so filtering on it matched every row in the table. Until a
    // review status column exists, list the most recent glyphs and label the
    // section for what it actually is.
    const { data: pending } = await supabase
      .from('registry_glyphs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (pending) {
      setPendingSymbols(pending);
    }

    setLoading(false);
  };

  // A write filtered out by a row-level permission rule comes back as success
  // with an empty array. Zero rows changed is a FAILURE, never a success.
  const writeGlyph = async (
    symbolId: string,
    patch: Database["public"]["Tables"]["registry_glyphs"]["Update"],
    verb: string,
  ) => {
    const { data, error } = await supabase
      .from('registry_glyphs')
      .update(patch)
      .eq('id', symbolId)
      .select('id');

    if (error) {
      toast.error(`Could not ${verb}: ${error.message}`);
      return false;
    }
    if (!data || data.length === 0) {
      toast.error(
        `Could not ${verb}. The database changed zero rows, which means the write was blocked by a permission rule. Nothing was saved.`,
      );
      return false;
    }
    return true;
  };

  const handleApprove = async (symbolId: string) => {
    if (!(await writeGlyph(symbolId, { is_unique: true }, 'approve this symbol'))) return;
    toast.success('Symbol approved');
    loadSymbols();
  };

  // There is deliberately no delete handler in this component. registry_glyphs
  // holds sealed captures, and a sealed record must not be destroyable from an
  // admin screen. Hiding is the strongest action available here.

  const handleHide = async (symbolId: string) => {
    if (!(await writeGlyph(symbolId, { is_unique: false }, 'hide this symbol'))) return;
    toast.success('Symbol hidden from gallery');
    loadSymbols();
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
                    aria-label="Show this symbol in the gallery"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Show
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleHide(symbol.id)}
                    className="flex-1"
                    aria-label="Hide this symbol from the gallery, keeping the record"
                  >
                    <EyeOff className="w-4 h-4 mr-1" />
                    Hide
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Pending Review */}
      <div>
        <h2 className="text-2xl font-bold mb-6">All registry glyphs, most recent first</h2>
        <div className="text-sm text-muted-foreground mb-4">
          Showing the {pendingSymbols.length} most recent glyphs. There is no review queue yet, because registry_glyphs has no review status column. This section used to filter on confirmation_count, which defaults to 1 and has never been incremented, so it matched every row.
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
                    aria-label="Show this symbol in the gallery"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleHide(symbol.id)}
                    className="flex-1"
                    aria-label="Hide this symbol from the gallery, keeping the record"
                  >
                    <EyeOff className="w-3 h-3" />
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
            <div className="text-sm text-muted-foreground">Glyphs listed below</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">
              {recentSymbols.filter(s => s.is_unique).length}
            </div>
            <div className="text-sm text-muted-foreground">Shown in gallery</div>
          </div>
        </div>
      </Card>
    </div>
  );
};