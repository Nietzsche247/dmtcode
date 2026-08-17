import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { tagLabel } from '@/lib/tags';
import { isRenderableImage } from '@/lib/imageValue';

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
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
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
      // Hide tiles with no renderable image: an empty frame reads as a
      // missing record, and short data: URIs cannot be a real drawing.
      setSymbols(data.filter((s) => isRenderableImage(s.image_url)));
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-10">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-96 max-w-full mx-auto" />
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
    <section className="container mx-auto px-4 py-10 border-t border-border/30 max-w-6xl">
      <div className="mb-8">
        <p className="label-data text-xs text-primary mb-4">COMMUNITY</p>
        <h2
          className="text-3xl md:text-4xl text-foreground mb-3"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
        >
          Recent contributions
        </h2>
        <p
          className="text-base text-muted-foreground"
          style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
        >
          The latest symbols added to the open record.
        </p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        {symbols.filter((symbol) => !failedIds.has(symbol.id)).map((symbol) => (
          <Link key={symbol.id} to={`/registry/${symbol.id}`} className="group">
            <article className="rounded-sm border border-border bg-card p-3 transition-colors hover:border-foreground/40">
              <div className="aspect-square bg-card rounded-sm border border-border overflow-hidden mb-2">
                <img
                  src={symbol.image_url}
                  alt={symbol.description || 'Recent symbol'}
                  className="w-full h-full object-contain p-1"
                  loading="lazy"
                  onError={() =>
                    setFailedIds((prev) => {
                      const next = new Set(prev);
                      next.add(symbol.id);
                      return next;
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground min-h-[18px]">
                {symbol.upvotes > 0 ? (
                  <span className="flex items-center gap-1 tabular-nums">
                    <ChevronUp className="w-3 h-3" aria-hidden="true" />
                    {symbol.upvotes}
                  </span>
                ) : (
                  <span aria-hidden="true" />
                )}
                {symbol.tags && symbol.tags[0] && (
                  <span className="label-data text-[10px] text-muted-foreground truncate">
                    {tagLabel(symbol.tags[0])}
                  </span>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>

      <div>
        <Button
          variant="outline"
          className="rounded-sm border-border hover:border-foreground/40 group"
          onClick={() => navigate('/registry')}
        >
          Browse all symbols
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </section>
  );
};
