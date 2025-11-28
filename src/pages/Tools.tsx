import { ParticleBackground } from '@/components/ParticleBackground';
import { Navigation } from '@/components/Navigation';
import { LaserGuide } from '@/components/LaserGuide';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { storefrontApiRequest, STOREFRONT_PRODUCTS_QUERY, ShopifyProduct } from '@/lib/shopify';
import { useCartStore } from '@/stores/cartStore';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

const peyoteRetreat = {
  title: "Peyote Way Church of God Spirit Walk (3-Day Peyote Ceremony)",
  price: 2000,
  image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
  description: "Legal peyote experiences in Aravaipa wilderness (Willcox, AZ: 1hr E of Tucson). Non-Native welcome for ceremonial experiences blending ancient Huichol roots with modern integration methodologies. Documented experiences tie to Strassman's clinical frameworks and Goler's laser protocol consciousness research. Three days on 160 acres—phenomenological observation meets traditional ceremonial practice. Ceremonial experiences for documented research.",
  tier: "retreat",
  type: "retreat",
  url: "https://peyoteway.org/spirit-walks?utm_source=tools_journey&utm_medium=affiliate&utm_campaign=dmtcode"
};

const bundles = [
  {
    name: "Fractal Starter",
    price: 85,
    originalPrice: 106,
    items: ["Sticker Pack", "Incense Sticks", "Journal"],
    discount: "20% off",
    tier: "low"
  },
  {
    name: "Gateway Kit",
    price: 1200,
    originalPrice: 1412,
    items: ["Hoodie", "Bon Charge Device", "Intention Roller"],
    discount: "15% off",
    tier: "high"
  },
  {
    name: "Extended Symbol Kit",
    price: 2300,
    originalPrice: 2875,
    items: ["MitoMAT", "Peyote Spirit Walk", "Journal"],
    discount: "20% off",
    tier: "retreat"
  }
];

const Tools = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, { first: 20 });
        if (data?.data?.products?.edges) {
          setProducts(data.data.products.edges);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) {
      toast.error("Product variant not available");
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
      description: product.node.title,
    });
  };

  const handleWaitlistClick = (productTitle: string, tier: string) => {
    const utm = `?utm_source=tools_soldout&utm_product=${encodeURIComponent(productTitle)}&utm_tier=${tier}`;
    navigate(`/waitlist${utm}`);
  };

  return (
    <>
      <Helmet>
        <title>Research Equipment - DMT Code Visual Symbol Catalogue</title>
        <meta 
          name="description" 
          content="Curated 650 nm protocol equipment and research tools. $12 entry items to $2,000 research experiences. Verified equipment for symbol documentation." 
        />
        <link rel="canonical" href="https://dmtcode.com/tools" />
        <meta name="keywords" content="affordable psychedelic journey merch, DMT laser tools, biohacking equipment, peyote journeys near Tucson, psychedelic gifts, 650nm neural priming mat, DMT code reality tools" />
        <script type="application/ld+json">
          {JSON.stringify(
            products.map(product => ({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": product.node.title,
              "description": product.node.description,
              "image": product.node.images.edges[0]?.node.url,
              "category": product.node.title.includes("Red Light") || product.node.title.includes("MitoMAT") || product.node.title.includes("Bon Charge") ? "Red Light Therapy" : "Psychedelic Integration",
              "brand": {
                "@type": "Brand",
                "name": "DMT Code"
              },
              "offers": {
                "@type": "Offer",
                "url": `https://dmtcode.com/tools#${product.node.handle}`,
                "priceCurrency": product.node.priceRange.minVariantPrice.currencyCode,
                "price": product.node.priceRange.minVariantPrice.amount,
                "availability": "https://schema.org/InStock"
              }
            }))
          )}
        </script>
      </Helmet>

      <div className="relative min-h-screen">
        <ParticleBackground />
        
        <main className="relative z-10">
          <Navigation />
          
          <div className="pt-24 pb-12">
            {/* Hero Section */}
            <section className="px-4 py-16 bg-gradient-to-b from-background via-muted/20 to-background">
              <div className="max-w-5xl mx-auto text-center space-y-6">
                <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-4">
                  <span className="text-sm font-semibold text-primary">Curated for 650nm Protocol</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold glow-text leading-tight">
                  Research Equipment Catalogue:<br />
                  <span className="text-primary">From Entry Items to Research Experiences</span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Curated for 650 nm Protocol—Goler 2025. Entry-level to premium research equipment (Strassman 2001). 
                  Limited stock—join waitlist for exclusives. $12 items to $2,000 legal research experiences.
                </p>

                <div className="pt-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Sold out?</span> Join for restocks.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => handleWaitlistClick('Hero CTA', 'mixed')}
                    className="bg-primary hover:bg-primary/90 glow-button"
                  >
                    Join Waitlist for Exclusive Restocks
                  </Button>
                </div>
              </div>
            </section>

            {/* Laser Guide */}
            <LaserGuide />

            {/* Products Grid */}
            <section className="px-4 py-16 bg-muted/30">
              <div className="max-w-7xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl md:text-4xl font-bold">
                    Research Equipment: $12 → $2,000
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Research-backed equipment and experiences for every researcher. Sold out items fund ongoing symbol cataloguing research.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {loading ? (
                    <div className="col-span-2 text-center py-12">
                      <p className="text-muted-foreground">Loading products...</p>
                    </div>
                  ) : (
                    <>
                      {products.map((product) => {
                        const variant = product.node.variants.edges[0]?.node;
                        const image = product.node.images.edges[0]?.node;
                        const price = variant ? parseFloat(variant.price.amount) : 0;
                        
                        return (
                          <Card 
                            key={product.node.id} 
                            className="p-6 bg-card border-border hover:border-primary/50 transition-all space-y-4"
                            itemScope
                            itemType="https://schema.org/Product"
                          >
                            <meta itemProp="name" content={product.node.title} />
                            <meta itemProp="description" content={product.node.description} />
                            {image && <meta itemProp="image" content={image.url} />}
                            <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
                              <meta itemProp="price" content={price.toString()} />
                              <meta itemProp="priceCurrency" content={variant?.price.currencyCode || 'USD'} />
                              <meta itemProp="availability" content="https://schema.org/InStock" />
                            </div>

                            <div className="flex gap-4">
                              <div className="w-32 h-32 flex-shrink-0 bg-secondary/20 rounded-lg overflow-hidden">
                                {image && (
                                  <img 
                                    src={image.url} 
                                    alt={image.altText || `${product.node.title} - 650nm laser research equipment`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                )}
                              </div>
                              
                              <div className="flex-1 space-y-2">
                                <h3 className="font-semibold text-lg leading-tight line-clamp-2">{product.node.title}</h3>
                                <p className="text-2xl font-bold text-primary">
                                  ${price.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                              {product.node.description}
                            </p>

                            <div className="pt-2">
                              <Button 
                                className="w-full bg-primary hover:bg-primary/90 glow-button touch-manipulation"
                                onClick={() => handleAddToCart(product)}
                                aria-label={`Add ${product.node.title} to cart`}
                                size="lg"
                              >
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Add to Cart
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                      
                      {/* Peyote Way Retreat */}
                      <Card 
                        className="p-6 bg-card border-border hover:border-primary/50 transition-all space-y-4"
                        itemScope
                        itemType="https://schema.org/Product"
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

                {/* Tiered Bundles */}
                <div className="pt-12 space-y-8">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl md:text-3xl font-bold">Pre-Curated Bundles</h3>
                    <p className="text-muted-foreground">One-click bundles save 15-20% vs. individual items</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {bundles.map((bundle) => (
                      <Card 
                        key={bundle.name}
                        className="p-8 bg-card border-primary/50 hover:border-primary transition-all space-y-6"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-2xl font-bold">{bundle.name}</h4>
                            <Badge className="bg-primary text-primary-foreground">
                              {bundle.discount}
                            </Badge>
                          </div>
                          
                          <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-primary">${bundle.price}</span>
                            <span className="text-lg text-muted-foreground line-through">${bundle.originalPrice}</span>
                          </div>

                          <ul className="space-y-2">
                            {bundle.items.map((item) => (
                              <li key={item} className="text-sm text-muted-foreground">
                                • {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <Badge variant="destructive" className="w-full justify-center py-2">
                            SOLD OUT
                          </Badge>
                          <Button 
                            variant="outline" 
                            className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            onClick={() => {
                              const utm = `?utm_source=bundle&utm_campaign=${encodeURIComponent(bundle.name)}&utm_tier=${bundle.tier}`;
                              navigate(`/waitlist${utm}`);
                            }}
                          >
                            Join Waitlist
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Sacred Journeys Section */}
                <div className="pt-12 space-y-6">
                  <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/40 rounded-xl p-8 max-w-4xl mx-auto space-y-6 shadow-lg shadow-primary/20">
                    <h2 className="text-2xl md:text-3xl font-bold text-center glow-text">
                      Research Experiences
                    </h2>
                    
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      Extend your protocol beyond equipment—discover legal, vetted peyote experiences. The <strong>Peyote Way Church of God</strong> (peyoteway.org) 
                      offers Spirit Walks on 160 acres near <strong>Willcox, AZ</strong> (east of Tucson, north of Wilcox). Non-Native welcome; 
                      ceremonial experiences blend ancient Huichol roots with modern integration (ties to Davis phenomenology surveys). Book via affiliate link—supports research.
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

                {/* CTA Section */}
                <div className="pt-8 text-center space-y-4">
                  <div className="bg-destructive/20 border-2 border-destructive/50 rounded-lg p-8 max-w-4xl mx-auto shadow-lg shadow-destructive/20">
                    <p className="text-xl md:text-2xl font-bold mb-4 text-foreground">
                      All Items Sold Out—Purchases Support Research
                    </p>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
                      All waitlist members get 72-hour early access to restocks + exclusive Q1 2025 bundle drops.
                      Affiliate commissions support symbol cataloguing research and open data infrastructure.
                    </p>
                    <Button 
                      size="lg"
                      className="bg-primary hover:bg-primary/90 glow-button"
                      onClick={() => navigate('/waitlist?utm_source=tools_cta&utm_campaign=soldout')}
                    >
                      Get First Dibs—Join Waitlist
                    </Button>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="pt-8 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center max-w-4xl mx-auto leading-relaxed">
                    <strong>Affiliate Disclosure:</strong> Affiliate commissions support symbol cataloguing.
                    No medical claims made—equipment supports phenomenological research per academic protocols (Goler 2025, Strassman 2001). 
                    N,N-DMT remains Schedule I in most jurisdictions; consult local laws. Equipment sales fund community symbol catalogue. 
                    All "sold out" statuses accurate as of Nov 2025; waitlist notified upon restock.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Tools;
