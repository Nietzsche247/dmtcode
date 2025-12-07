import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ChevronUp, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentSymbol {
  id: string;
  image_url: string;
  description: string | null;
  tags: string[] | null;
  upvotes: number;
  created_at: string;
}

export const RecentContributions = () => {
  const [symbols, setSymbols] = useState<RecentSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecentSymbols();
  }, []);

  const loadRecentSymbols = async () => {
    const { data, error } = await supabase
      .from('symbol_submissions')
      .select('id, image_url, description, tags, upvotes, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(6);

    if (!error && data) {
      setSymbols(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (symbols.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-16 border-t border-border/30">
      <div className="text-center mb-12">
        <p className="font-montserrat font-light italic text-muted-foreground text-lg tracking-wide mb-4">
          Community
        </p>
        <h2 
          className="text-3xl md:text-4xl font-bold uppercase tracking-[0.02em] text-foreground mb-4"
          style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
        >
          Recent Contributions
        </h2>
        <p 
          className="text-muted-foreground max-w-xl mx-auto"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          Latest approved symbols from our community of researchers
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {symbols.map((symbol) => (
          <Link
            key={symbol.id}
            to={`/registry/${symbol.id}`}
            className="group"
          >
            <Card className="p-3 bg-card/50 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="aspect-square bg-white rounded border border-border overflow-hidden mb-2">
                <img
                  src={symbol.image_url}
                  alt={symbol.description || 'Recent symbol'}
                  className="w-full h-full object-contain p-1"
                  loading="lazy"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ChevronUp className="w-3 h-3" />
                  {symbol.upvotes}
                </span>
                {symbol.tags && symbol.tags[0] && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {symbol.tags[0]}
                  </Badge>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="text-center">
        <Button 
          size="lg"
          variant="outline"
          className="rounded-full px-8 border-primary/50 hover:border-primary group"
          onClick={() => navigate('/registry')}
        >
          Browse All Symbols
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </section>
  );
};
