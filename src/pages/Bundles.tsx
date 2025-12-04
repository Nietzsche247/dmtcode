import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Package, ArrowRight, BookOpen, Microscope, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useDynamicMeta } from '@/hooks/useDynamicMeta';
import { useModeStore } from '@/stores/modeStore';

// Import bundle images
import bundleStarterImg from '@/assets/bundle-starter.jpg';
import bundleGatewayImg from '@/assets/bundle-gateway.jpg';
import bundleCompleteImg from '@/assets/bundle-complete.jpg';
import bundleCeremonyImg from '@/assets/bundle-ceremony.jpg';

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
      { name: 'Psychedelic Fractal Sticker Pack', value: 12 },
      { name: 'Sacred Geometry Incense Sticks', value: 18 },
      { name: 'Custom Psychedelic Journal', value: 22 },
      { name: 'Research Intention Card Deck', value: 15 },
      { name: 'Amethyst Worry Stone', value: 39 },
    ],
    features: [
      'Essential documentation tools',
      'Intention-setting materials',
      'Grounding stone for integration',
    ],
    cta: 'Start Your Journey',
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
      { name: 'iEDM Galaxy Hoodie', value: 625 },
      { name: 'Bon Charge Max Red Light Device', value: 799 },
      { name: 'Rose Quartz Intention Roller', value: 55 },
      { name: 'Custom Psychedelic Journal', value: 22 },
    ],
    features: [
      '650nm red light therapy device',
      'Protective ceremonial wear',
      'Full documentation setup',
      'Free protocol guide access',
    ],
    cta: 'Unlock the Gateway',
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
      { name: 'MitoMAT 660nm Yoga Mat', value: 1299 },
      { name: 'HigherDOSE Recovery Bundle', value: 899 },
      { name: 'SOL Seed of Life Tunic Dress', value: 450 },
      { name: 'Custom Psychedelic Journal', value: 22 },
      { name: 'Research Intention Card Deck', value: 15 },
    ],
    features: [
      'Full-body 660nm light therapy',
      'Professional recovery equipment',
      'Sacred ceremonial attire',
      'Complete documentation tools',
      'Priority community access',
    ],
    cta: 'Go Complete',
    color: 'from-amber-500/20 to-amber-600/10',
    borderColor: 'border-amber-500/30',
    badgeColor: 'bg-amber-500/20 text-amber-400',
  },
  {
    id: 'ceremony',
    name: 'Extended Ceremony Package',
    tagline: 'For immersive ceremonial research',
    price: 3500,
    originalPrice: 4375,
    discount: '20% OFF',
    tier: 'premium',
    image: bundleCeremonyImg,
    items: [
      { name: 'Peyote Way Spirit Walk (3-Day)', value: 2000 },
      { name: 'MitoMAT 660nm Yoga Mat', value: 1299 },
      { name: 'Paradisiac Ritual Robe', value: 550 },
      { name: 'Custom Psychedelic Journal', value: 22 },
      { name: 'Integration Support Materials', value: 200 },
    ],
    features: [
      'Legal ceremonial experience',
      'Full equipment setup',
      'Sacred ceremonial attire',
      'Post-ceremony integration',
      'Direct researcher support',
    ],
    cta: 'Reserve Ceremony',
    color: 'from-purple-500/20 to-purple-600/10',
    borderColor: 'border-purple-500/30',
    badgeColor: 'bg-purple-500/20 text-purple-400',
  },
];

const Bundles = () => {
  const navigate = useNavigate();
  const meta = useDynamicMeta('bundles');
  const { mode } = useModeStore();

  const handleBundleClick = (bundleId: string) => {
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

          {/* Bundles Grid */}
          <section className="container mx-auto px-4 py-12 max-w-7xl">
            <div className="grid md:grid-cols-2 gap-8">
              {bundles.map((bundle) => (
                <Card 
                  key={bundle.id}
                  className={`relative p-8 bg-gradient-to-br ${bundle.color} ${bundle.borderColor} border-2 hover:scale-[1.02] transition-transform`}
                >
                  {bundle.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}
                  
                  <div className="space-y-6">
                    {/* Bundle Image */}
                    <div className="aspect-video rounded-lg overflow-hidden bg-background/50">
                      <img 
                        src={bundle.image} 
                        alt={`${bundle.name} - Research equipment bundle`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    
                    <div>
                      <Badge className={bundle.badgeColor}>{bundle.discount}</Badge>
                      <h2 className="text-2xl font-bold mt-3">{bundle.name}</h2>
                      <p className="text-muted-foreground">{bundle.tagline}</p>
                    </div>

                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-black text-primary">${bundle.price}</span>
                      <span className="text-lg text-muted-foreground line-through">${bundle.originalPrice}</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Includes:</p>
                      <ul className="space-y-2">
                        {bundle.items.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                            <span>{item.name}</span>
                            <span className="text-muted-foreground ml-auto">${item.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-border/50">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Features:</p>
                      <ul className="space-y-1">
                        {bundle.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-3 h-3 text-primary flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button 
                      className="w-full h-12 rounded-full btn-lickable border-beam group touch-manipulation"
                      onClick={() => handleBundleClick(bundle.id)}
                    >
                      {bundle.cta}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Protocol Link */}
          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <Card className="p-8 bg-card/50 border-border text-center">
              <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3">Need Help Choosing?</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Read our comprehensive protocol guide to understand which equipment is essential for your research goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="outline" 
                  className="rounded-full"
                  onClick={() => navigate('/protocol-guide')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Read Protocol Guide
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-full"
                  onClick={() => navigate('/evidence-map')}
                >
                  View Research Evidence
                </Button>
              </div>
            </Card>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Bundles;
