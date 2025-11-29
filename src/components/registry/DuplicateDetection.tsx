import { useState, useEffect } from 'react';
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
}

interface DuplicateDetectionProps {
  currentImage: string;
  onDecision: (decision: 'same' | 'similar' | 'unique', matchedId?: string) => void;
}

export const DuplicateDetection = ({ currentImage, onDecision }: DuplicateDetectionProps) => {
  const [similarSymbols, setSimilarSymbols] = useState<RegistryGlyph[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimilarSymbols();
  }, [currentImage]);

  const loadSimilarSymbols = async () => {
    setLoading(true);
    // For now, just load the most confirmed symbols for manual comparison
    // In future, this could use CLIP embeddings for similarity
    const { data, error } = await supabase
      .from('registry_glyphs')
      .select('id, image_data, confirmation_count, motif_tags')
      .order('confirmation_count', { ascending: false })
      .limit(5);

    if (!error && data) {
      setSimilarSymbols(data);
    }
    setLoading(false);
  };

  const handleDecision = (decision: 'same' | 'similar' | 'unique', symbolId?: string) => {
    if (decision === 'same' && symbolId) {
      toast.success('Marked as duplicate - adding to existing symbol');
    } else if (decision === 'similar') {
      toast.success('Marked as similar variant');
    } else {
      toast.success('Marked as unique symbol');
    }
    onDecision(decision, symbolId);
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Checking for similar symbols...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Check for Duplicates</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Compare your symbol with existing submissions. Is it the same as any of these?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 bg-card border-border">
          <p className="text-xs text-muted-foreground text-center mb-2">Your Symbol</p>
          <img 
            src={currentImage} 
            alt="Your drawn symbol"
            className="w-full h-auto border border-border"
          />
        </Card>
        
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">Most Reported Symbols</p>
          <div className="grid grid-cols-2 gap-2">
            {similarSymbols.slice(0, 4).map((symbol) => (
              <div key={symbol.id} className="relative">
                <img 
                  src={symbol.image_data}
                  alt={`Symbol with ${symbol.confirmation_count} confirmations`}
                  className="w-full h-auto border border-border cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleDecision('same', symbol.id)}
                />
                <Badge variant="secondary" className="absolute top-1 right-1 text-xs">
                  {symbol.confirmation_count}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="default"
          size="lg"
          onClick={() => handleDecision('unique')}
          className="w-full"
        >
          This is a Unique Symbol
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDecision('similar')}
          className="w-full"
        >
          Similar But Different
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Click on any symbol above if yours is the same to add validation
      </p>
    </div>
  );
};
