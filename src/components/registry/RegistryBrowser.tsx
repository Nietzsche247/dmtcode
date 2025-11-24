import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface RegistryGlyph {
  id: string;
  image_data: string;
  confirmation_count: number;
  motif_tags: string[];
  created_at: string;
}

export const RegistryBrowser = () => {
  const [glyphs, setGlyphs] = useState<RegistryGlyph[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);

  useEffect(() => {
    loadGlyphs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('registry-browser')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'registry_glyphs' 
      }, () => {
        loadGlyphs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadGlyphs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('registry_glyphs')
      .select('id, image_data, confirmation_count, motif_tags, created_at')
      .order('confirmation_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGlyphs(data);
    }
    setLoading(false);
  };

  const handleVote = async (glyphId: string, type: 'exact' | 'similar' | 'not_match') => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('registry_confirmations').insert({
        glyph_id: glyphId,
        user_id: userData.user?.id || null,
        session_id: sessionId,
        confirmation_type: type
      });

      if (error) throw error;

      // Update confirmation count if exact or similar
      if (type === 'exact' || type === 'similar') {
        const glyph = glyphs.find(g => g.id === glyphId);
        if (glyph) {
          await supabase
            .from('registry_glyphs')
            .update({ confirmation_count: glyph.confirmation_count + 1 })
            .eq('id', glyphId);
        }
      }

      toast.success('Vote recorded');
      loadGlyphs();
    } catch (error) {
      console.error('Vote error:', error);
      toast.error('Failed to record vote');
    }
  };

  if (loading) {
    return (
      <section id="browse" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Browse Registry</h2>
        <div className="text-center text-muted-foreground">Loading symbols...</div>
      </section>
    );
  }

  return (
    <section id="browse" className="container mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Browse Registry</h2>
      
      {glyphs.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No symbols submitted yet. Be the first to contribute.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {glyphs.map((glyph) => (
            <Card key={glyph.id} className="p-6 bg-card border-border">
              <div className="flex justify-center mb-4">
               <img 
                  src={glyph.image_data} 
                  alt={`Registry glyph symbol - ${glyph.motif_tags?.slice(0, 3).join(', ') || 'visual symbol'} - reported ${glyph.confirmation_count} times`}
                  className="w-[100px] h-[100px] border border-border"
                  style={{ imageRendering: 'pixelated' }}
                  loading="lazy"
                />
              </div>

              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Independently reported by <span className="font-semibold text-foreground">{glyph.confirmation_count}</span> participant{glyph.confirmation_count !== 1 ? 's' : ''}
                </p>
                
                {glyph.motif_tags && glyph.motif_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {glyph.motif_tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleVote(glyph.id, 'exact')}
                  aria-label={`Vote exact match for glyph with ${glyph.confirmation_count} confirmations`}
                >
                  Exact Match
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleVote(glyph.id, 'similar')}
                  aria-label={`Vote highly similar for glyph with ${glyph.confirmation_count} confirmations`}
                >
                  Highly Similar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleVote(glyph.id, 'not_match')}
                  aria-label={`Vote not this symbol for glyph with ${glyph.confirmation_count} confirmations`}
                >
                  Not This Symbol
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};
