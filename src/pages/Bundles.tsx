import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, BookOpen, Microscope, Sparkles, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useDynamicMeta } from '@/hooks/useDynamicMeta';
import { useModeStore } from '@/stores/modeStore';
import { LaserDivider } from '@/components/LaserDivider';
import { EmailCapture } from '@/components/EmailCapture';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BundleRow {
  slug: string;
  name: string;
  tagline: string | null;
  kind: string;
  tier: string;
  people: number;
  price_cents: number;
  ships_status: string;
  is_best: boolean;
  wave: number;
}

const priceUsd = (cents: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);

const Bundles = () => {
  const navigate = useNavigate();
  const meta = useDynamicMeta('bundles');
  const { mode } = useModeStore();

  const { data: rows = [] } = useQuery({
    queryKey: ['published-bundles'],
    queryFn: async (): Promise<BundleRow[]> => {
      const { data, error } = await supabase
        .from('bundles')
        .select('slug, name, tagline, kind, tier, people, price_cents, ships_status, is_best, wave')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as BundleRow[];
    },
  });

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href="https://dmtcode.com/bundles" />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dmtcode.com/bundles" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/bundles" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="robots" content="index, follow" />

        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dmtcode.com/' },
              { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://dmtcode.com/tools' },
              { '@type': 'ListItem', position: 3, name: 'Bundles', item: 'https://dmtcode.com/bundles' },
            ],
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <ParticleBackground />
        <Navigation />

        <main className="relative z-10 pt-24 pb-16">
          {/* Hero */}
          <section className="container mx-auto px-4 py-12 sm:py-16 max-w-6xl text-center">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30">
              <Package className="w-3 h-3 mr-1" />
              Planned Research Kits
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
              {mode === 'research' ? 'Complete Research Kits' : 'Journey Bundles'}
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              {mode === 'research'
                ? 'Pre-configured equipment packages for 650nm protocol research. Each kit lists its planned components and documentation tools.'
                : 'Curated equipment packages for every stage of your journey, from first sessions to group work.'}
            </p>

            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Nothing here is for sale yet. Leave your email on a kit and you will be notified when that kit ships.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
              <Link to="/protocol-guide" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                <BookOpen className="w-4 h-4" />
                View Protocol Guide
              </Link>
              <Link to="/tools" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                <Microscope className="w-4 h-4" />
                Browse Individual Items
              </Link>
              <Link to="/registry" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                <Sparkles className="w-4 h-4" />
                Symbol Registry
              </Link>
            </div>
          </section>

          {rows.length > 0 && (
            <section className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                {rows.map((row) => (
                  <Card
                    key={row.slug}
                    className={`relative p-6 sm:p-8 flex flex-col bg-gradient-to-br ${
                      row.is_best
                        ? 'from-primary/30 to-primary/10 border-primary/50 border-2'
                        : 'from-secondary/30 to-secondary/10 border-border/50 border'
                    }`}
                  >
                    {row.is_best && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-black shadow-lg z-10 whitespace-nowrap">
                        Featured
                      </Badge>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">{row.name}</h2>
                      <Badge variant={row.ships_status === 'now' ? 'default' : 'secondary'} className="shrink-0 font-black text-xs">
                        {row.ships_status === 'now' ? 'Ships now' : 'Preorder'}
                      </Badge>
                    </div>

                    {row.tagline && (
                      <p className="text-muted-foreground font-light text-sm mt-2">{row.tagline}</p>
                    )}

                    {row.people > 1 && (
                      <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="w-4 h-4 text-primary" />
                        for {row.people} people
                      </p>
                    )}

                    <p className="mt-4 text-3xl sm:text-4xl font-black tracking-tight">
                      {priceUsd(row.price_cents)}
                    </p>

                    <div className="mt-auto pt-2">
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                        Notify me when this ships
                      </p>
                      <div className="[&_section]:py-0 [&_section]:px-0 [&_section]:border-0 [&_h2]:hidden [&_section>div>div]:hidden [&_section>div>p]:hidden [&_section>div]:max-w-none [&_form]:max-w-none [&_form]:mt-3 [&_form_p]:mt-2">
                        <EmailCapture source="bundles" productSlug={row.slug} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <LaserDivider />

          {/* Protocol Link */}
          <section className="container mx-auto px-4 py-12 sm:py-16 max-w-4xl">
            <div className="p-6 sm:p-8 bg-card/50 border border-border rounded-2xl text-center">
              <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-black mb-3 tracking-tight">Need Help Choosing?</h2>
              <p className="text-muted-foreground font-light mb-6 max-w-xl mx-auto">
                Read our protocol guide to understand which equipment is essential for your research goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  className="rounded-full touch-manipulation min-h-[44px]"
                  onClick={() => navigate('/protocol-guide')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Read Protocol Guide
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full touch-manipulation min-h-[44px]"
                  onClick={() => navigate('/evidence-map')}
                >
                  View Research Evidence
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Bundles;
