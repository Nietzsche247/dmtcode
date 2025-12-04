import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ShoppingCart, Package, BookOpen, Sparkles, ArrowLeft, Microscope, Loader2 } from 'lucide-react';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { storefrontApiRequest, ShopifyProduct } from '@/lib/shopify';
import { useDynamicMeta } from '@/hooks/useDynamicMeta';

// Import generated bundle images
import bundleStarterImg from '@/assets/bundle-starter.jpg';
import bundleGatewayImg from '@/assets/bundle-gateway.jpg';
import bundleCompleteImg from '@/assets/bundle-complete.jpg';
import bundleCeremonyImg from '@/assets/bundle-ceremony.jpg';

declare global {
  interface Window {
    posthog?: any;
  }
}

// Shopify handle to bundle mapping
const bundleShopifyHandles: Record<string, string> = {
  starter: 'fractal-starter-kit',
  gateway: 'gateway-research-kit',
  complete: 'complete-symbol-kit',
  ceremony: 'extended-ceremony-package',
};

const bundleData = {
  starter: {
    id: 'starter',
    name: 'Fractal Starter Kit',
    tagline: 'Perfect for first-time researchers',
    description: 'Entry-level research kit containing essential documentation tools, intention-setting materials, and a grounding stone for integration work. Ideal for researchers beginning their exploration of the 650nm protocol.',
    price: 85,
    originalPrice: 106,
    discount: '20% OFF',
    tier: 'entry',
    items: [
      { name: 'Psychedelic Fractal Sticker Pack', value: 12, sku: 'sticker-pack' },
      { name: 'Sacred Geometry Incense Sticks', value: 18, sku: 'incense' },
      { name: 'Custom Psychedelic Journal', value: 22, sku: 'journal' },
      { name: 'Research Intention Card Deck', value: 15, sku: 'cards' },
      { name: 'Amethyst Worry Stone', value: 39, sku: 'amethyst' },
    ],
    features: [
      'Essential documentation tools',
      'Intention-setting materials',
      'Grounding stone for integration',
      'Perfect starting point for new researchers',
    ],
    image: bundleStarterImg,
    color: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-500/30',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
    relatedResearch: ['Davis 2021', 'Timmermann 2019'],
  },
  gateway: {
    id: 'gateway',
    name: 'Gateway Research Kit',
    tagline: 'Most popular for serious researchers',
    description: 'Comprehensive research package featuring 650nm red light therapy device, protective ceremonial wear, and full documentation setup. Includes free protocol guide access. Recommended for researchers committed to systematic study.',
    price: 1200,
    originalPrice: 1412,
    discount: '15% OFF',
    tier: 'mid',
    popular: true,
    items: [
      { name: 'iEDM Galaxy Hoodie', value: 625, sku: 'hoodie' },
      { name: 'Bon Charge Max Red Light Device', value: 799, sku: 'bon-charge' },
      { name: 'Rose Quartz Intention Roller', value: 55, sku: 'roller' },
      { name: 'Custom Psychedelic Journal', value: 22, sku: 'journal' },
    ],
    features: [
      '650nm red light therapy device',
      'Protective ceremonial wear',
      'Full documentation setup',
      'Free protocol guide access',
      'Priority community support',
    ],
    image: bundleGatewayImg,
    color: 'from-primary/30 to-primary/10',
    borderColor: 'border-primary/50',
    badgeColor: 'bg-primary/20 text-primary',
    relatedResearch: ['Goler 2025', 'Davis 2021', 'Lawrence 2022'],
  },
  complete: {
    id: 'complete',
    name: 'Complete Symbol Kit',
    tagline: 'Everything for advanced research',
    description: 'Full-spectrum research package with professional-grade 660nm light therapy equipment, recovery tools, and sacred ceremonial attire. Designed for dedicated researchers conducting extended studies.',
    price: 2300,
    originalPrice: 2875,
    discount: '20% OFF',
    tier: 'high',
    items: [
      { name: 'MitoMAT 660nm Yoga Mat', value: 1299, sku: 'mitomat' },
      { name: 'HigherDOSE Recovery Bundle', value: 899, sku: 'higherdose' },
      { name: 'SOL Seed of Life Tunic Dress', value: 450, sku: 'tunic' },
      { name: 'Custom Psychedelic Journal', value: 22, sku: 'journal' },
      { name: 'Research Intention Card Deck', value: 15, sku: 'cards' },
    ],
    features: [
      'Full-body 660nm light therapy',
      'Professional recovery equipment',
      'Sacred ceremonial attire',
      'Complete documentation tools',
      'Priority community access',
      'Direct researcher support',
    ],
    image: bundleCompleteImg,
    color: 'from-amber-500/20 to-amber-600/10',
    borderColor: 'border-amber-500/30',
    badgeColor: 'bg-amber-500/20 text-amber-400',
    relatedResearch: ['Goler 2025', 'Davis 2021', 'Timmermann 2019', 'Strassman 2001'],
  },
  ceremony: {
    id: 'ceremony',
    name: 'Extended Ceremony Package',
    tagline: 'For immersive ceremonial research',
    description: 'Premium research experience including legal ceremonial participation, full equipment setup, sacred attire, and comprehensive post-ceremony integration support. For researchers seeking profound, documented experiences.',
    price: 3500,
    originalPrice: 4375,
    discount: '20% OFF',
    tier: 'premium',
    items: [
      { name: 'Peyote Way Spirit Walk (3-Day)', value: 2000, sku: 'peyote-walk' },
      { name: 'MitoMAT 660nm Yoga Mat', value: 1299, sku: 'mitomat' },
      { name: 'Paradisiac Ritual Robe', value: 550, sku: 'robe' },
      { name: 'Custom Psychedelic Journal', value: 22, sku: 'journal' },
      { name: 'Integration Support Materials', value: 200, sku: 'integration' },
    ],
    features: [
      'Legal ceremonial experience',
      'Full equipment setup',
      'Sacred ceremonial attire',
      'Post-ceremony integration',
      'Direct researcher support',
      '1-on-1 integration coaching',
    ],
    image: bundleCeremonyImg,
    color: 'from-purple-500/20 to-purple-600/10',
    borderColor: 'border-purple-500/30',
    badgeColor: 'bg-purple-500/20 text-purple-400',
    relatedResearch: ['Strassman 2001', 'Goler 2025', 'Michael 2021'],
  },
};

const BUNDLE_PRODUCT_QUERY = `
  query GetProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      description
      handle
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 5) {
        edges {
          node {
            url
            altText
          }
        }
      }
      variants(first: 10) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            availableForSale
            selectedOptions {
              name
              value
            }
          }
        }
      }
      options {
        name
        values
      }
    }
  }
`;

const RELATED_PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          description
          handle
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`;

const BundleDetail = () => {
  const { bundleId } = useParams<{ bundleId: string }>();
  const navigate = useNavigate();
  const meta = useDynamicMeta('bundles');
  const [shopifyProduct, setShopifyProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<ShopifyProduct[]>([]);
  const addItem = useCartStore(state => state.addItem);

  const bundle = bundleId ? bundleData[bundleId as keyof typeof bundleData] : null;
  const shopifyHandle = bundleId ? bundleShopifyHandles[bundleId] : null;

  useEffect(() => {
    // Track bundle view
    if (bundle && window.posthog) {
      window.posthog.capture('bundle_viewed', {
        bundle_id: bundle.id,
        bundle_name: bundle.name,
        bundle_price: bundle.price,
        bundle_tier: bundle.tier,
      });
    }

    // Fetch Shopify bundle product
    const fetchBundleProduct = async () => {
      if (!shopifyHandle) return;
      try {
        const data = await storefrontApiRequest(BUNDLE_PRODUCT_QUERY, { handle: shopifyHandle });
        if (data?.data?.productByHandle) {
          setShopifyProduct(data.data.productByHandle);
        }
      } catch (err) {
        console.error('Error fetching bundle product:', err);
      }
    };

    // Fetch related products
    const fetchRelatedProducts = async () => {
      try {
        const data = await storefrontApiRequest(RELATED_PRODUCTS_QUERY, { first: 4 });
        if (data?.data?.products?.edges) {
          setRelatedProducts(data.data.products.edges.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching related products:', err);
      }
    };

    fetchBundleProduct();
    fetchRelatedProducts();
  }, [bundle, shopifyHandle]);

  if (!bundle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Bundle not found</h1>
          <Button onClick={() => navigate('/bundles')}>View All Bundles</Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    setIsLoading(true);
    
    // Track add to cart
    if (window.posthog) {
      window.posthog.capture('bundle_added_to_cart', {
        bundle_id: bundle.id,
        bundle_name: bundle.name,
        bundle_price: bundle.price,
        bundle_tier: bundle.tier,
        shopify_product_id: shopifyProduct?.id || null,
      });
    }

    // If we have the Shopify product, add to cart
    if (shopifyProduct?.variants?.edges?.[0]?.node) {
      const variant = shopifyProduct.variants.edges[0].node;
      const cartItem: CartItem = {
        product: { node: shopifyProduct },
        variantId: variant.id,
        variantTitle: variant.title,
        price: variant.price,
        quantity: 1,
        selectedOptions: variant.selectedOptions || [],
      };
      
      addItem(cartItem);
      toast.success('Bundle added to cart!', {
        description: 'Proceed to checkout to complete your purchase.',
      });
    } else {
      // Fallback to waitlist if product not found
      navigate(`/waitlist?utm_source=bundle_detail&utm_bundle=${encodeURIComponent(bundle.name)}&utm_tier=${bundle.id}`);
      toast.success('Bundle reserved!', {
        description: 'Join the waitlist to secure your bundle.',
      });
    }
    
    setIsLoading(false);
  };

  // Dynamic OG image URL
  const ogImageUrl = `https://bbmhrgpsyiahefnxqwfg.supabase.co/functions/v1/og-image?bundle=${bundle.id}`;

  return (
    <>
      <Helmet>
        <title>{bundle.name} | DMT Code Research Equipment</title>
        <meta name="description" content={bundle.description} />
        <link rel="canonical" href={`https://dmtcode.com/bundles/${bundle.id}`} />
        <meta property="og:title" content={`${bundle.name} - $${bundle.price}`} />
        <meta property="og:description" content={bundle.description} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://dmtcode.com/bundles/${bundle.id}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={bundle.name} />
        <meta name="twitter:description" content={bundle.description} />
        <meta name="twitter:image" content={ogImageUrl} />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": bundle.name,
            "description": bundle.description,
            "image": ogImageUrl,
            "offers": {
              "@type": "Offer",
              "price": bundle.price,
              "priceCurrency": "USD",
              "availability": "https://schema.org/PreOrder",
              "priceValidUntil": "2025-12-31"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "24"
            }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dmtcode.com/" },
              { "@type": "ListItem", "position": 2, "name": "Bundles", "item": "https://dmtcode.com/bundles" },
              { "@type": "ListItem", "position": 3, "name": bundle.name, "item": `https://dmtcode.com/bundles/${bundle.id}` }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <ParticleBackground />
        <Navigation />

        <main className="relative z-10 pt-24 pb-16">
          {/* Back Button */}
          <div className="container mx-auto px-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/bundles')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              All Bundles
            </Button>
          </div>

          {/* Bundle Hero */}
          <section className="container mx-auto px-4 max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Image */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-card/50">
                <img 
                  src={bundle.image} 
                  alt={`${bundle.name} - Complete research kit containing ${bundle.items.map(i => i.name).join(', ')}`}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                {'popular' in bundle && bundle.popular && (
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <Badge className={`absolute top-4 right-4 ${bundle.badgeColor}`}>
                  {bundle.discount}
                </Badge>
              </div>

              {/* Details */}
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                    {bundle.tagline}
                  </p>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">
                    {bundle.name}
                  </h1>
                </div>

                <div className="flex items-baseline gap-4">
                  <span className="text-4xl md:text-5xl font-black text-primary">
                    ${bundle.price}
                  </span>
                  <span className="text-xl text-muted-foreground line-through">
                    ${bundle.originalPrice}
                  </span>
                  <Badge variant="secondary" className="text-sm">
                    Save ${bundle.originalPrice - bundle.price}
                  </Badge>
                </div>

                <p className="text-muted-foreground text-lg leading-relaxed">
                  {bundle.description}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="flex-1 h-14 rounded-full btn-lickable border-beam text-lg"
                    onClick={handleAddToCart}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        {shopifyProduct ? 'Add to Cart' : 'Reserve Bundle'}
                      </>
                    )}
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="flex-1 h-14 rounded-full"
                    onClick={() => navigate('/protocol-guide')}
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    View Protocol
                  </Button>
                </div>

                {/* Features */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    What's Included:
                  </p>
                  <ul className="grid gap-2">
                    {bundle.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Bundle Contents */}
          <section className="container mx-auto px-4 max-w-6xl py-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Bundle Contents</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bundle.items.map((item, i) => (
                <Card key={i} className="p-4 bg-card/50 border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-primary" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="text-muted-foreground">${item.value}</span>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total Value:</span>
                <span className="text-xl font-bold">${bundle.items.reduce((sum, i) => sum + i.value, 0)}</span>
              </div>
              <div className="flex items-center justify-between text-primary mt-2">
                <span className="font-semibold">You Pay:</span>
                <span className="text-2xl font-black">${bundle.price}</span>
              </div>
            </div>
          </section>

          {/* Related Research */}
          <section className="container mx-auto px-4 max-w-6xl py-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Related Research</h2>
            <div className="flex flex-wrap gap-3">
              {bundle.relatedResearch.map((paper, i) => (
                <Link 
                  key={i} 
                  to="/bibliography"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-card/50 rounded-full border border-border hover:border-primary/50 transition-colors"
                >
                  <Microscope className="w-4 h-4 text-primary" />
                  <span className="text-sm">{paper}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Internal Links */}
          <section className="container mx-auto px-4 max-w-6xl py-8">
            <Card className="p-8 bg-card/50 border-border">
              <div className="grid md:grid-cols-3 gap-6">
                <Link to="/protocol-guide" className="flex items-center gap-4 p-4 rounded-lg bg-background/50 hover:bg-background transition-colors">
                  <BookOpen className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Protocol Guide</h3>
                    <p className="text-sm text-muted-foreground">Learn the 650nm research methodology</p>
                  </div>
                </Link>
                <Link to="/registry" className="flex items-center gap-4 p-4 rounded-lg bg-background/50 hover:bg-background transition-colors">
                  <Sparkles className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Symbol Registry</h3>
                    <p className="text-sm text-muted-foreground">Browse community-documented symbols</p>
                  </div>
                </Link>
                <Link to="/evidence-map" className="flex items-center gap-4 p-4 rounded-lg bg-background/50 hover:bg-background transition-colors">
                  <Microscope className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Evidence Map</h3>
                    <p className="text-sm text-muted-foreground">Explore research timeline</p>
                  </div>
                </Link>
              </div>
            </Card>
          </section>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="container mx-auto px-4 max-w-6xl py-16">
              <h2 className="text-2xl md:text-3xl font-bold mb-8">Individual Items</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedProducts.map((product) => {
                  if (!product?.node) return null;
                  const image = product.node.images?.edges?.[0]?.node;
                  const price = product.node.priceRange?.minVariantPrice?.amount || '0';
                  
                  return (
                    <Card 
                      key={product.node.id}
                      className="p-4 bg-card/50 border-border hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() => navigate(`/products/${product.node.handle}`)}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-secondary/20 mb-3">
                        {image && (
                          <img 
                            src={image.url} 
                            alt={image.altText || `${product.node.title} - Research equipment`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2">{product.node.title}</h3>
                      <p className="text-primary font-bold mt-1">${parseFloat(price).toFixed(2)}</p>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default BundleDetail;
