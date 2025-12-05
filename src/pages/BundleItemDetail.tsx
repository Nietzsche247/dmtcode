import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Package, Beaker } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getBundleItem, bundleItems } from '@/data/bundleItems';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';

// Bundle definitions to show which bundles contain this item
const BUNDLES = [
  { id: 'starter', name: 'Fractal Starter Kit', price: 85, items: ['650nm-laser-pointer', 'diffraction-grating'] },
  { id: 'gateway', name: 'Gateway Research Kit', price: 299, items: ['650nm-laser-pointer', 'diffraction-grating', 'protocol-journal', 'lab-timer'] },
  { id: 'complete', name: 'Complete Symbol Kit', price: 599, items: ['650nm-laser-pointer', 'diffraction-grating', 'protocol-journal', 'lab-timer', 'quarton-laser-module', 'znse-lens'] },
  { id: 'ceremony', name: 'Extended Ceremony Package', price: 1999, items: ['650nm-laser-pointer', 'diffraction-grating', 'protocol-journal', 'lab-timer', 'quarton-laser-module', 'znse-lens', 'mitomat-yoga-mat', 'huepar-laser-level', 'refraction-tank'] },
];

const BundleItemDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCartStore();
  const item = slug ? getBundleItem(slug) : undefined;

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-black mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-8">This item doesn't exist in our catalog.</p>
            <Link to="/tools">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tools
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Find bundles that contain this item
  const containingBundles = BUNDLES.filter(bundle => bundle.items.includes(item.slug));

  // Find related items (same category, excluding current)
  const relatedItems = Object.values(bundleItems)
    .filter(i => i.category === item.category && i.slug !== item.slug)
    .slice(0, 3);

  const handleAddToCart = () => {
    // Create a cart item for bundle items
    addItem({
      product: {
        node: {
          id: `bundle-item-${item.slug}`,
          title: item.title,
          description: item.description,
          handle: item.slug,
          priceRange: {
            minVariantPrice: {
              amount: item.price.toString(),
              currencyCode: 'USD',
            },
          },
          images: { edges: [{ node: { url: item.image, altText: item.title } }] },
          variants: { edges: [] },
          options: [],
        },
      },
      variantId: `bundle-item-variant-${item.slug}`,
      variantTitle: 'Default',
      price: { amount: item.price.toString(), currencyCode: 'USD' },
      quantity: 1,
      selectedOptions: [],
    });
    toast.success(`${item.title} added to cart`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{item.title} | DMT Code Project Tools</title>
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
              "availability": "https://schema.org/InStock"
            }
          })}
        </script>
      </Helmet>

      <Navigation />

      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link 
            to="/tools" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-light">Back to Tools</span>
          </Link>
        </nav>

        {/* Product Header */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-card border border-border">
            <img 
              src={item.image} 
              alt={item.title}
              className="w-full h-full object-cover"
            />
            {item.wavelength && (
              <Badge className="absolute top-4 left-4 bg-primary/90 text-primary-foreground">
                {item.wavelength}
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <Badge variant="outline" className="w-fit mb-4 text-xs font-light">
              {item.category}
            </Badge>
            
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
              {item.title}
            </h1>
            
            <p className="text-lg text-muted-foreground font-light leading-relaxed mb-6">
              {item.description}
            </p>

            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl font-black">${item.price}</span>
              <span className="text-muted-foreground font-light">USD</span>
            </div>

            <Button 
              size="lg" 
              onClick={handleAddToCart}
              className="w-full lg:w-auto px-12 py-6 text-lg font-semibold mb-6"
            >
              Add to Cart
            </Button>

            {/* Research References */}
            {item.relatedResearch && item.relatedResearch.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Beaker className="w-4 h-4" />
                <span className="font-light">Referenced in: {item.relatedResearch.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Specifications */}
        {item.specs && Object.keys(item.specs).length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-black mb-6">Specifications</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(item.specs).map(([key, value]) => (
                <div 
                  key={key}
                  className="p-4 rounded-xl bg-card border border-border"
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

        {/* Bundles Containing This Item */}
        {containingBundles.length > 0 && (
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

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-black mb-2">Related Equipment</h2>
            <p className="text-muted-foreground font-light mb-6">
              Other items in {item.category}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedItems.map(related => (
                <Link
                  key={related.slug}
                  to={`/tools/${related.slug}`}
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
      </main>

      <Footer />
    </div>
  );
};

export default BundleItemDetail;
