import { ParticleBackground } from '@/components/ParticleBackground';
import { Navigation } from '@/components/Navigation';
import { LaserGuide } from '@/components/LaserGuide';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { storefrontApiRequest, STOREFRONT_PRODUCTS_QUERY, ShopifyProduct } from '@/lib/shopify';
import { useCartStore } from '@/stores/cartStore';
import { ShoppingCart, Search, Plus, AlertTriangle, BookOpen, Package, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { ProductSubmissionModal } from '@/components/ProductSubmissionModal';
import { getPlaceholderImage } from '@/utils/placeholderImage';
import { getProductImageWithFallback } from '@/utils/productImages';
import { supabase } from '@/integrations/supabase/client';
import { ShareButtons } from '@/components/ShareButtons';
import { ErrorBoundary } from '@/components/ErrorBoundary';


declare global {
  interface Window {
    posthog?: any;
  }
}

const peyoteRetreat = {
  title: "Peyote Way Church of God Spirit Walk (3-Day Peyote Ceremony)",
  price: 2000,
  image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
  description: "Legal peyote experiences in Aravaipa wilderness (Willcox, AZ: 1hr E of Tucson). Non-Native welcome for ceremonial experiences blending ancient Huichol roots with modern integration methodologies. Documented experiences tie to Strassman's clinical frameworks and Goler's laser protocol consciousness research. Three days on 160 acres—phenomenological observation meets traditional ceremonial practice. Ceremonial experiences for documented research.",
  tier: "retreat",
  type: "retreat",
  url: "https://peyoteway.org/spirit-walks?utm_source=tools_journey&utm_medium=affiliate&utm_campaign=dmtcode"
};

// Bundle definitions live in /bundles (single source of truth). Tools links there.


const Tools = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [affiliateProducts, setAffiliateProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const fetchProducts = async () => {
      setError(null);
      let shopifyFailed = false;
      try {
        // Fetch Shopify products
        const data = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, { first: 50 });
        if (data?.data?.products?.edges) {
          setProducts(data.data.products.edges);
        } else {
          shopifyFailed = true;
        }
      } catch (err) {
        console.error('Error fetching Shopify products:', err);
        shopifyFailed = true;
      }

      try {
        // Fetch affiliate-only products from database
        const { data: affiliateData, error: dbError } = await supabase
          .from('products')
          .select('*')
          .eq('affiliate_only', true)
          .eq('is_approved', true);

        if (dbError) throw dbError;
        if (affiliateData) {
          setAffiliateProducts(affiliateData);
        }
      } catch (err) {
        console.error('Error fetching affiliate products:', err);
      }

      if (shopifyFailed) {
        setError('Store temporarily unavailable. Please try again shortly.');
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);


  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const title = product.node?.title || '';
    const description = product.node?.description || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredAffiliateProducts = affiliateProducts.filter(product => {
    const title = product.title || '';
    const description = product.description || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const allProducts = [...filteredProducts, ...filteredAffiliateProducts];

  const handleAddToCart = (product: ShopifyProduct | any) => {
    // Check if affiliate-only product
    if (product.affiliate_only || product.affiliate_url) {
      // Track affiliate click with PostHog
      if (window.posthog) {
        window.posthog.capture('affiliate_click', {
          product_id: product.id,
          product_title: product.title || product.node?.title,
          product_price: product.price,
          affiliate_url: product.affiliate_url
        });
      }
      window.open(product.affiliate_url, '_blank');
      return;
    }

    // Handle Shopify products
    const variant = product.node?.variants?.edges[0]?.node;
    if (!variant) {
      toast.error("Product variant not available");
      return;
    }
    if (variant.availableForSale === false) {
      toast.error("This item is sold out", { description: "Join the waitlist to be notified when it returns." });
      return;
    }

    const cartItem = {
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || []
    };

    addItem(cartItem);
    toast.success("Added to cart", {
      description: product.node?.title || 'Product',
    });
  };


  const handleProductClick = (product: ShopifyProduct | any) => {
    const productId = product.node?.id || product.id;
    navigate(`/products/${productId}`);
  };

  const handleWaitlistClick = (productTitle: string, tier: string) => {
    const utm = `?utm_source=tools_soldout&utm_product=${encodeURIComponent(productTitle)}&utm_tier=${tier}`;
    navigate(`/waitlist${utm}`);
  };

  // Error fallback UI
  if (error) {
    return (
      <div className="relative min-h-screen bg-background">
        <ParticleBackground />
        <Navigation />
        <div className="relative z-10 flex items-center justify-center min-h-[80vh] p-4">
          <div className="max-w-md text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold">Unable to load products</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>650nm Laser Equipment & DMT Research Tools | DMT Code</title>
        <meta name="description" content="Scientific-grade laser pointers, diffraction gratings, and safety equipment for Code of Reality research protocols." />
        <link rel="canonical" href="https://dmtcode.com/tools" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/tools" />
        <meta property="og:title" content="650nm Laser Equipment & DMT Research Tools | DMT Code" />
        <meta property="og:description" content="Scientific-grade laser pointers, diffraction gratings, and safety equipment for Code of Reality research protocols." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dmtcode.com/tools" />
        <meta property="og:image" content="https://dmtcode.com/favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/tools" />
        <meta name="twitter:title" content="650nm Laser Equipment & DMT Research Tools | DMT Code" />
        <meta name="twitter:description" content="Scientific-grade laser pointers, diffraction gratings, and safety equipment for Code of Reality research protocols." />
        <meta name="twitter:image" content="https://dmtcode.com/favicon.png" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dmtcode.com/" },
              { "@type": "ListItem", "position": 2, "name": "Tools", "item": "https://dmtcode.com/tools" }
            ]
          })}
        </script>
        {products.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify(
              products.filter(p => p?.node).map(product => {
                const variant = product.node?.variants?.edges?.[0]?.node;
                const isAvailable = variant?.availableForSale === true;
                return {
                  "@context": "https://schema.org",
                  "@type": "Product",
                  "name": product.node?.title || '',
                  "description": product.node?.description || '',
                  "image": product.node?.images?.edges?.[0]?.node?.url || '',
                  "offers": {
                    "@type": "Offer",
                    "url": `https://dmtcode.com/tools#${product.node?.handle || ''}`,
                    "priceCurrency": product.node?.priceRange?.minVariantPrice?.currencyCode || 'USD',
                    "price": product.node?.priceRange?.minVariantPrice?.amount || '0',
                    "availability": isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                  }
                };
              })
            )}
          </script>
        )}

      </Helmet>

      <div className="relative min-h-screen bg-background">
        <ParticleBackground />
        
        <main id="main-content" className="relative z-10" role="main">
          <Navigation />
          
          <div className="pt-24 pb-12">
            {/* Hero Section */}
            <section className="relative px-4 py-20 md:py-28 overflow-hidden">
              <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6">
                <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
                  Curated for 650nm Protocol
                </p>
                
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.9]">
                  Research Equipment
                </h1>

                <p className="text-lg md:text-xl font-light text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Entry-level to premium equipment for the 650 nm protocol.
                  Availability and pricing update live from the store.
                </p>

                <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={() => navigate('/bundles')}
                    className="px-8 py-6 h-auto rounded-full btn-lickable border-beam"
                  >
                    <Package className="h-5 w-5 mr-2" />
                    View Bundles
                  </Button>
                </div>

                {/* Internal Links */}
                <div className="pt-4 flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
                  <Link to="/protocol-guide" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                    <BookOpen className="w-4 h-4" />
                    Protocol Guide
                  </Link>

                  <Link to="/registry" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                    Symbol Registry
                  </Link>
                  <Link to="/evidence-map" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                    Research Evidence
                  </Link>
                </div>
              </div>
            </section>

            {/* Laser Guide */}
            <LaserGuide />

            {/* Search and Filters */}
            <section className="px-4 py-8">
              <div className="max-w-7xl mx-auto">
                <div className="relative max-w-md mx-auto">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 rounded-full bg-card/50 border-border/50 focus:border-primary/50"
                  />
                </div>
              </div>
            </section>

            {/* Products Grid */}
            <section className="px-4 py-16">
              <div className="max-w-7xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                  <p className="text-primary text-sm font-medium tracking-widest uppercase">Product Catalogue</p>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">
                    Curated Equipment
                  </h2>
                  <p className="text-muted-foreground font-light max-w-2xl mx-auto">
                    Research-backed equipment and experiences for every researcher.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  {loading ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground">Loading products...</p>
                    </div>
                  ) : allProducts.length === 0 ? (
                    <div className="col-span-full text-center py-12 space-y-3">
                      <p className="text-muted-foreground">
                        {error ?? 'Store temporarily unavailable. Please try again shortly.'}
                      </p>
                      <Button variant="outline" onClick={() => window.location.reload()}>
                        Retry
                      </Button>
                    </div>

                  ) : (
                    <>
                      {filteredProducts.map((product) => {
                        // Skip products with missing node data
                        if (!product?.node) return null;

                        const variant = product.node.variants?.edges?.[0]?.node;
                        const image = product.node.images?.edges?.[0]?.node;
                        const price = variant ? parseFloat(variant.price?.amount || '0') : 0;
                        const title = product.node.title || 'Untitled Product';
                        const description = product.node.description || '';
                        const handle = product.node.handle || product.node.id;
                        const isAvailable = variant?.availableForSale === true;

                        const imageUrl = getProductImageWithFallback(title, image?.url, getPlaceholderImage);

                        return (
                          <Card
                            key={product.node.id}
                            className="p-6 bg-card border-border hover:border-primary/50 transition-all space-y-4 cursor-pointer"
                            itemScope
                            itemType="https://schema.org/Product"
                            onClick={() => handleProductClick(product)}
                          >
                            <meta itemProp="name" content={title} />
                            <meta itemProp="description" content={description} />
                            {image && <meta itemProp="image" content={image.url} />}
                            <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
                              <meta itemProp="price" content={price.toString()} />
                              <meta itemProp="priceCurrency" content={variant?.price?.currencyCode || 'USD'} />
                              <meta
                                itemProp="availability"
                                content={isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"}
                              />
                            </div>

                            <div className="flex gap-4">
                              <div className="w-32 h-32 flex-shrink-0 bg-secondary/20 rounded-lg overflow-hidden">
                                <img
                                  src={imageUrl}
                                  alt={image?.altText || `${title} - 650nm laser research equipment`}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = getPlaceholderImage(title, 'product');
                                  }}
                                />
                              </div>

                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-semibold text-lg leading-tight line-clamp-2">{title}</h3>
                                  <ShareButtons
                                    title={title}
                                    description={description?.slice(0, 100)}
                                    url={`https://dmtcode.com/products/${handle}`}
                                  />
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-2xl font-bold text-primary">
                                    ${price.toFixed(2)}
                                  </p>
                                  {!isAvailable && (
                                    <Badge variant="destructive" className="text-xs">Sold Out</Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                              {description}
                            </p>

                            <div className="pt-2">
                              {isAvailable ? (
                                <Button
                                  className="w-full bg-primary hover:bg-primary/90 glow-button touch-manipulation"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(product);
                                  }}
                                  aria-label={`Add ${title} to cart`}
                                  size="lg"
                                >
                                  <ShoppingCart className="w-5 h-5 mr-2" />
                                  Add to Cart
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground touch-manipulation"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWaitlistClick(title, 'single');
                                  }}
                                  aria-label={`Join waitlist for ${title}`}
                                  size="lg"
                                >
                                  <Bell className="w-5 h-5 mr-2" />
                                  Notify Me When Available
                                </Button>
                              )}
                            </div>
                          </Card>
                        );
                      })}

                      
                      {/* Affiliate-only products */}
                      {filteredAffiliateProducts.map((product) => {
                        const imageUrl = getProductImageWithFallback(product.title, product.image_url, getPlaceholderImage);
                        
                        return (
                          <Card 
                            key={product.id}
                            className="p-6 bg-card border-border hover:border-primary/50 transition-all space-y-4 cursor-pointer"
                            itemScope
                            itemType="https://schema.org/Product"
                            onClick={() => navigate(`/products/${product.id}`)}
                          >
                            <div className="flex gap-4">
                              <div className="w-32 h-32 flex-shrink-0 bg-secondary/20 rounded-lg overflow-hidden">
                                <img 
                                  src={imageUrl}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              
                              <div className="flex-1 space-y-2">
                                <h3 className="font-semibold text-lg leading-tight line-clamp-2">{product.title}</h3>
                                <p className="text-2xl font-bold text-primary">
                                  ${parseFloat(String(product.price || 0)).toFixed(2)}
                                </p>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                              {product.description}
                            </p>

                            <div className="pt-2">
                              <Button 
                                className="w-full bg-primary hover:bg-primary/90 glow-button touch-manipulation"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(product);
                                }}
                                size="lg"
                              >
                                Visit Retailer →
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                      
                      {/* Keep Peyote Way as legacy */}
                      <Card 
                        className="p-6 bg-card border-border hover:border-primary/50 transition-all space-y-4 cursor-pointer"
                        itemScope
                        itemType="https://schema.org/Product"
                        onClick={() => window.open(peyoteRetreat.url, '_blank')}
                      >
                        <meta itemProp="name" content={peyoteRetreat.title} />
                        <meta itemProp="description" content={peyoteRetreat.description} />
                        <meta itemProp="image" content={peyoteRetreat.image} />
                        <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
                          <meta itemProp="price" content={peyoteRetreat.price.toString()} />
                          <meta itemProp="priceCurrency" content="USD" />
                          <meta itemProp="availability" content="https://schema.org/InStock" />
                        </div>

                        <div className="flex gap-4">
                          <div className="w-32 h-32 flex-shrink-0 bg-secondary/20 rounded-lg overflow-hidden">
                            <img 
                              src={peyoteRetreat.image} 
                              alt="Peyote Way Church of God Spirit Walk - 3-day ceremonial research experience"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-lg leading-tight line-clamp-2">{peyoteRetreat.title}</h3>
                              <Badge variant="outline" className="flex-shrink-0">
                                {peyoteRetreat.tier}
                              </Badge>
                            </div>
                            <p className="text-2xl font-bold text-primary">
                              ${peyoteRetreat.price}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                          {peyoteRetreat.description}
                        </p>

                        <div className="pt-2">
                          <Button 
                            className="w-full bg-primary hover:bg-primary/90 glow-button touch-manipulation"
                            onClick={() => window.open(peyoteRetreat.url, '_blank')}
                            size="lg"
                          >
                            Book Now – Affiliate Link
                          </Button>
                        </div>
                      </Card>
                    </>
                  )}
                </div>

                {/* Bundles link (single source of truth lives on /bundles) */}
                <div className="pt-12 space-y-4 text-center">
                  <h3 className="text-2xl md:text-3xl font-bold">Pre-Curated Bundles</h3>
                  <p className="text-muted-foreground">Save vs. individual items. Availability updates live from the store.</p>
                  <Button
                    size="lg"
                    onClick={() => navigate('/bundles')}
                    className="rounded-full btn-lickable border-beam"
                  >
                    <Package className="w-5 h-5 mr-2" />
                    View All Bundles
                  </Button>
                </div>


                {/* Sacred Journeys Section */}
                <div className="pt-12 space-y-6">
                  <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/40 rounded-xl p-8 max-w-4xl mx-auto space-y-6 shadow-lg shadow-primary/20">
                    <h2 className="text-2xl md:text-3xl font-bold text-center glow-text">
                      Research Experiences
                    </h2>
                    
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      Extend your protocol beyond equipment: discover legal, vetted peyote experiences. The <strong>Peyote Way Church of God</strong> (peyoteway.org) 
                      offers Spirit Walks on 160 acres near <strong>Willcox, AZ</strong> (east of Tucson, north of Wilcox). Non-Native welcome; 
                      ceremonial experiences blend ancient Huichol roots with modern integration (ties to Davis phenomenology surveys). Book via affiliate link to support research.
                    </p>

                    <div className="flex justify-center">
                      <Button 
                        size="lg"
                        className="bg-primary hover:bg-primary/90 glow-button shadow-lg shadow-primary/30"
                        onClick={() => window.open('https://peyoteway.org/spirit-walks?utm_source=tools_journey&utm_medium=affiliate&utm_campaign=dmtcode', '_blank')}
                      >
                        Explore Peyote Way
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Waitlist CTA */}
                <div className="pt-8 text-center space-y-4">
                  <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-8 max-w-4xl mx-auto">
                    <p className="text-xl md:text-2xl font-bold mb-4 text-foreground">
                      Get Notified About Restocks
                    </p>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
                      Waitlist members get early access when items return.
                      Affiliate commissions support the open symbol catalogue.
                    </p>
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 glow-button"
                      onClick={() => navigate('/waitlist?utm_source=tools_cta&utm_campaign=restock')}
                    >
                      Join Waitlist
                    </Button>
                  </div>
                </div>

                {/* Registry CTA */}
                <div className="pt-8 text-center">
                  <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-8 max-w-4xl mx-auto">
                    <h3 className="text-xl md:text-2xl font-bold mb-4 glow-text">
                      Test Your Equipment
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-6">
                      Upload symbols from your laser experiments to the community registry.
                      Help validate reproducibility across different wavelengths and refractive indices.
                    </p>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={() => navigate('/registry?utm_source=tools&utm_campaign=upload_cta')}
                    >
                      Upload Symbols from This Lens →
                    </Button>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="pt-8 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center max-w-4xl mx-auto leading-relaxed">
                    <strong>Affiliate Disclosure:</strong> Affiliate commissions support symbol cataloguing.
                    No medical claims made: equipment supports phenomenological research per academic protocols (Goler 2025, Strassman 2001).
                    N,N-DMT remains Schedule I in most jurisdictions; consult local laws.
                    Store availability updates live from our fulfilment provider.
                  </p>
                </div>

              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
      <ProductSubmissionModal open={submissionModalOpen} onOpenChange={setSubmissionModalOpen} />
    </>
  );
};

export default Tools;
