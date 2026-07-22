import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Package, Beaker, Sparkles, BookOpen, Star } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';

export interface UnifiedProduct {
  slug: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  wavelength?: string;
  tradition?: string;
  symbolism?: string;
  specs?: Record<string, string>;
  relatedResearch?: string[];
}

export interface BundleInfo {
  id: string;
  name: string;
  price: number;
  items: string[];
}

export interface RelatedItem {
  slug: string;
  title: string;
  price: number;
  image: string;
}

interface UnifiedProductDetailProps {
  mode: 'research' | 'woo';
  item: UnifiedProduct | undefined;
  relatedItems: RelatedItem[];
  bundles?: BundleInfo[];
}

export const UnifiedProductDetail = ({ 
  mode, 
  item, 
  relatedItems, 
  bundles = [] 
}: UnifiedProductDetailProps) => {
  const { addItem } = useCartStore();
  const isResearch = mode === 'research';
  
  const backLink = isResearch ? '/tools' : '/community/woo';
  const backLabel = isResearch ? 'Back to Tools' : 'Back to Mysticism Store';
  const pageTitle = isResearch ? 'DMT Code Project Tools' : 'DMT Code Mysticism Store';
  const specsTitle = isResearch ? 'Specifications' : 'Details';
  const relatedTitle = isResearch ? 'Related Equipment' : 'Related Items';
  const referenceLabel = isResearch ? 'Referenced in:' : 'Connections in:';
  const itemPrefix = isResearch ? 'bundle-item' : 'woo-item';

  // Not found state
  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        {!isResearch && <ParticleBackground />}
        <Navigation />
        <main className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-black mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-8">This item doesn't exist in our catalog.</p>
            <Link to={backLink}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backLabel}
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // These catalog items are not backed by a real Shopify variant, so we route
  // to the waitlist instead of creating a dead-end cart line.
  const handleNotify = () => {
    window.location.href = `/waitlist?utm_source=product_detail&utm_item=${encodeURIComponent(item.slug)}`;
  };


  const containingBundles = bundles.filter(bundle => bundle.items.includes(item.slug));
  const relatedBasePath = isResearch ? '/tools' : '/community/woo';

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{item.title} | {pageTitle}</title>
        <meta name="description" content={item.description} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": item.title,
            "description": item.description,
            "image": item.image,
            "offers": {
              "@type": "Offer",
              "price": item.price,
              "priceCurrency": "USD",
              "availability": "https://schema.org/OutOfStock"
            }
          })}
        </script>
      </Helmet>

      {!isResearch && <ParticleBackground />}
      <Navigation />

      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link 
            to={backLink} 
            className={`inline-flex items-center gap-2 text-muted-foreground transition-colors ${
              isResearch ? 'hover:text-foreground' : 'hover:text-primary'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-light">{backLabel}</span>
          </Link>
        </nav>

        {/* Product Header */}
        <div className={`grid lg:grid-cols-2 gap-12 mb-16 ${!isResearch ? 'animate-fade-in' : ''}`}>
          {/* Image */}
          <div className={`relative aspect-square rounded-2xl overflow-hidden bg-card border border-border ${!isResearch ? 'group' : ''}`}>
            <img 
              src={item.image} 
              alt={item.title}
              className={`w-full h-full object-cover ${!isResearch ? 'group-hover:scale-105 transition-transform duration-700' : ''}`}
            />
            {/* Woo mystical glow overlay */}
            {!isResearch && (
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            )}
            {/* Badge: wavelength for research, tradition for woo */}
            {isResearch && item.wavelength && (
              <Badge className="absolute top-4 left-4 bg-primary/90 text-primary-foreground">
                {item.wavelength}
              </Badge>
            )}
            {!isResearch && item.tradition && (
              <Badge className="absolute top-4 left-4 bg-primary/90 text-primary-foreground">
                <Sparkles className="w-3 h-3 mr-1" />
                {item.tradition}
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <Badge variant="outline" className={`w-fit mb-4 text-xs font-light ${!isResearch ? 'border-primary/30' : ''}`}>
              {item.category}
            </Badge>
            
            <h1 className={`text-4xl lg:text-5xl font-black tracking-tight mb-4 ${
              !isResearch ? 'bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text' : ''
            }`}>
              {item.title}
            </h1>
            
            <p className="text-lg text-muted-foreground font-light leading-relaxed mb-6">
              {item.description}
            </p>

            {/* Symbolism (woo only) */}
            {!isResearch && item.symbolism && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                <p className="text-sm font-medium text-primary mb-1">Symbolism</p>
                <p className="text-sm text-muted-foreground">{item.symbolism}</p>
              </div>
            )}

            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl font-black">${item.price}</span>
              <span className="text-muted-foreground font-light">USD</span>
            </div>

            <Button
              size="lg"
              variant="outline"
              onClick={handleNotify}
              className={`w-full lg:w-auto px-12 py-6 text-lg font-semibold mb-6 ${!isResearch ? 'group' : ''}`}
            >
              {!isResearch && <Star className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />}
              Sold Out - Notify Me
            </Button>


            {/* Research References */}
            {item.relatedResearch && item.relatedResearch.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isResearch ? <Beaker className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                <span className="font-light">{referenceLabel} {item.relatedResearch.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Specifications */}
        {item.specs && Object.keys(item.specs).length > 0 && (
          <section className={`mb-16 ${!isResearch ? 'animate-fade-in' : ''}`} style={!isResearch ? { animationDelay: '0.1s' } : undefined}>
            <h2 className="text-2xl font-black mb-6">{specsTitle}</h2>
            <div className={`grid sm:grid-cols-2 ${isResearch ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
              {Object.entries(item.specs).map(([key, value]) => (
                <div 
                  key={key}
                  className={`p-4 rounded-xl bg-card border border-border ${!isResearch ? 'hover:border-primary/30 transition-colors' : ''}`}
                >
                  <p className="text-xs text-muted-foreground font-light uppercase tracking-wider mb-1">
                    {key}
                  </p>
                  <p className="font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bundles Section (research only) */}
        {isResearch && containingBundles.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-black mb-2">Save with Bundles</h2>
            <p className="text-muted-foreground font-light mb-6">
              This item is included in the following research bundles
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {containingBundles.map(bundle => (
                <Link
                  key={bundle.id}
                  to={`/bundles/${bundle.id}`}
                  className="group relative p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
                >
                  <div className="absolute inset-x-0 bottom-0 h-[1px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  <Package className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    {bundle.name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-light mb-2">
                    {bundle.items.length} items included
                  </p>
                  <p className="text-xl font-black">${bundle.price}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Research Tools CTA (woo only) */}
        {!isResearch && (
          <section className="mb-16 p-8 rounded-2xl bg-gradient-to-r from-card to-card/50 border border-border animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-black mb-2">Interested in Research Tools?</h2>
                <p className="text-muted-foreground font-light">
                  Explore calibrated 650nm lasers and optical equipment for the Goler protocol.
                </p>
              </div>
              <Link to="/tools">
                <Button variant="outline" size="lg">
                  View Research Tools →
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <section className={`mb-16 ${!isResearch ? 'animate-fade-in' : ''}`} style={!isResearch ? { animationDelay: '0.3s' } : undefined}>
            <h2 className="text-2xl font-black mb-2">{relatedTitle}</h2>
            <p className="text-muted-foreground font-light mb-6">
              {isResearch ? `Other items in ${item.category}` : `More from ${item.category}`}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedItems.map(related => (
                <Link
                  key={related.slug}
                  to={`${relatedBasePath}/${related.slug}`}
                  className="group relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300"
                >
                  <div className="absolute inset-x-0 bottom-0 h-[1px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={related.image} 
                      alt={related.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {related.title}
                    </h3>
                    <p className="text-lg font-black">${related.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Registry CTA (woo only) */}
        {!isResearch && (
          <section className="text-center py-12 border-t border-border animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-2xl font-black mb-4">Exploring Symbol Connections?</h2>
            <p className="text-muted-foreground font-light max-w-2xl mx-auto mb-6">
              Upload symbols from your practices to the registry for community analysis and pattern matching.
            </p>
            <Link to="/registry">
              <Button size="lg">
                <Sparkles className="w-4 h-4 mr-2" />
                Contribute to Registry
              </Button>
            </Link>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};
