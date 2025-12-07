import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, BookOpen, Microscope, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useDynamicMeta } from '@/hooks/useDynamicMeta';
import { useModeStore } from '@/stores/modeStore';
import { BundleCard } from '@/components/BundleCard';
import { LaserDivider } from '@/components/LaserDivider';
import { BundleComparisonTable } from '@/components/BundleComparisonTable';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Import bundle images
import bundleStarterImg from '@/assets/bundle-starter.jpg';
import bundleGatewayImg from '@/assets/bundle-gateway.jpg';
import bundleCompleteImg from '@/assets/bundle-complete.jpg';
import bundleCeremonyImg from '@/assets/bundle-ceremony.jpg';

declare global {
  interface Window {
    posthog?: any;
  }
}

// Research-focused bundles - NO woo/mystical items allowed
// Only: calibrated 650nm lasers, diffraction gratings, lab-grade timers, protocol journals, optical equipment
const bundles = [
  {
    id: 'starter',
    name: 'Fractal Starter Kit',
    tagline: 'Perfect for first-time researchers',
    price: 85,
    originalPrice: 106,
    discount: '20% OFF',
    tier: 'entry',
    image: bundleStarterImg,
    items: [
      { name: '650nm 5mW Laser Pointer', value: 28 },
      { name: '500 lines/mm Diffraction Grating', value: 22 },
      { name: 'Protocol Documentation Journal', value: 35 },
      { name: 'Lab Session Timer', value: 21 },
    ],
    features: [
      'Calibrated 650nm laser pointer',
      '500 lines/mm diffraction grating',
      'Protocol documentation journal',
      'Lab-grade session timer',
    ],
    cta: 'Start Research',
    color: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-500/30',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    id: 'gateway',
    name: 'Gateway Research Kit',
    tagline: 'Most popular for serious researchers',
    price: 1200,
    originalPrice: 1412,
    discount: '15% OFF',
    tier: 'mid',
    popular: true,
    image: bundleGatewayImg,
    items: [
      { name: 'Quarton VLM-650 Laser Module', value: 650 },
      { name: 'ZnSe High-Index Lens (RI 2.4)', value: 285 },
      { name: '1000 lines/mm Diffraction Grating', value: 145 },
      { name: 'Protocol Documentation Journal', value: 35 },
      { name: 'Precision Lab Timer', value: 42 },
    ],
    features: [
      'Precision 650nm laser module',
      'High-index ZnSe lens (RI 2.4)',
      'Research-grade diffraction grating',
      'Full documentation setup',
      'Priority community support',
    ],
    cta: 'Begin Research',
    color: 'from-primary/30 to-primary/10',
    borderColor: 'border-primary/50',
    badgeColor: 'bg-primary/20 text-primary',
  },
  {
    id: 'complete',
    name: 'Complete Symbol Kit',
    tagline: 'Everything for advanced research',
    price: 2300,
    originalPrice: 2875,
    discount: '20% OFF',
    tier: 'high',
    image: bundleCompleteImg,
    items: [
      { name: 'MitoMAT 660nm Red Light Mat', value: 1299 },
      { name: 'Quarton VLM-650 Laser Module', value: 650 },
      { name: 'ZnSe High-Index Lens Set', value: 425 },
      { name: 'Refraction Analysis Tank', value: 185 },
      { name: 'Protocol Documentation Journal', value: 35 },
    ],
    features: [
      'Full-body 660nm light therapy mat',
      'Precision laser module',
      'High-index lens set for beam shaping',
      'Refraction analysis equipment',
      'Complete documentation tools',
    ],
    cta: 'Full Research Setup',
    color: 'from-amber-500/20 to-amber-600/10',
    borderColor: 'border-amber-500/30',
    badgeColor: 'bg-amber-500/20 text-amber-400',
  },
  {
    id: 'ceremony',
    name: 'Extended Research Package',
    tagline: 'For comprehensive optical research',
    price: 3500,
    originalPrice: 4375,
    discount: '20% OFF',
    tier: 'premium',
    image: bundleCeremonyImg,
    items: [
      { name: 'MitoMAT 660nm Red Light Mat', value: 1299 },
      { name: 'Huepar Self-Leveling Laser System', value: 895 },
      { name: 'Quarton VLM-650 Laser Module', value: 650 },
      { name: 'Complete ZnSe Lens Kit', value: 580 },
      { name: 'Refraction Analysis Tank', value: 185 },
      { name: 'Extended Protocol Journal Set', value: 95 },
    ],
    features: [
      'Professional optical equipment',
      'Self-leveling laser system',
      'Complete lens kit',
      'Refraction analysis tools',
      'Extended documentation set',
      '1-on-1 researcher support',
    ],
    cta: 'Premium Research',
    color: 'from-purple-500/20 to-purple-600/10',
    borderColor: 'border-purple-500/30',
    badgeColor: 'bg-purple-500/20 text-purple-400',
  },
];

const Bundles = () => {
  const navigate = useNavigate();
  const meta = useDynamicMeta('bundles');
  const { mode } = useModeStore();

  // Check if user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin-bundles'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      return !!data;
    }
  });

  const handleBundleClick = (bundleId: string) => {
    // Track bundle view on click
    const bundle = bundles.find(b => b.id === bundleId);
    if (window.posthog && bundle) {
      window.posthog.capture('bundle_viewed', {
        bundle_id: bundleId,
        bundle_name: bundle.name,
        bundle_price: bundle.price,
        bundle_tier: bundle.tier,
      });
    }
    navigate(`/bundles/${bundleId}`);
  };

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
        <meta property="og:image" content="https://dmtcode.com/favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/bundles" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content="https://dmtcode.com/favicon.png" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "DMT Code Research Equipment Bundles",
            "description": meta.description,
            "numberOfItems": bundles.length,
            "itemListElement": bundles.map((bundle, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Product",
                "name": bundle.name,
                "description": bundle.tagline,
                "offers": {
                  "@type": "Offer",
                  "price": bundle.price,
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/PreOrder"
                }
              }
            }))
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dmtcode.com/" },
              { "@type": "ListItem", "position": 2, "name": "Tools", "item": "https://dmtcode.com/tools" },
              { "@type": "ListItem", "position": 3, "name": "Bundles", "item": "https://dmtcode.com/bundles" }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <ParticleBackground />
        <Navigation />
        
        <main className="relative z-10 pt-24 pb-16">
          {/* Admin Status Banner */}
          {isAdmin && (
            <div className="container mx-auto px-4 mb-4">
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-medium">Shopify claimed</span>
                <span className="text-muted-foreground">–</span>
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span className="text-muted-foreground">webhook active</span>
                <span className="text-muted-foreground">–</span>
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span className="text-muted-foreground">inventory syncing nightly</span>
              </div>
            </div>
          )}
          {/* Hero */}
          <section className="container mx-auto px-4 py-16 max-w-6xl text-center">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30">
              <Package className="w-3 h-3 mr-1" />
              Save Up to 20%
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
              {mode === 'research' ? 'Complete Research Kits' : 'Journey Bundles'}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              {mode === 'research' 
                ? 'Pre-configured equipment packages for 650nm protocol research. Each bundle includes verified components and documentation tools.'
                : 'Curated equipment packages for every stage of your journey. From first-time explorers to advanced practitioners.'
              }
            </p>

            <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
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

          <section className="container mx-auto px-4 py-12 max-w-7xl">
            <div className="grid md:grid-cols-2 gap-8">
              {bundles.map((bundle, index) => (
                <div 
                  key={bundle.id}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  className="opacity-0 animate-fade-slide-up"
                >
                  <BundleCard
                    {...bundle}
                    onClick={handleBundleClick}
                  />
                </div>
              ))}
            </div>
          </section>

          <LaserDivider />

          {/* Comparison Table */}
          <section className="container mx-auto px-4 py-12 max-w-6xl">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-center mb-8">
              Compare All Bundles
            </h2>
            <div className="bg-card/50 border border-border/50 rounded-2xl p-4 md:p-6">
              <BundleComparisonTable />
            </div>
          </section>

          <LaserDivider />

          {/* Protocol Link */}
          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <div className="p-8 bg-card/50 border border-border rounded-2xl text-center">
              <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-black mb-3 tracking-tight">Need Help Choosing?</h2>
              <p className="text-muted-foreground font-light mb-6 max-w-xl mx-auto">
                Read our comprehensive protocol guide to understand which equipment is essential for your research goals.
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
