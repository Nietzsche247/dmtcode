import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Package, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { storefrontApiRequest, STOREFRONT_PRODUCTS_QUERY, ShopifyProduct } from '@/lib/shopify';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';

const bundleData = [
  {
    name: "Starter Bundle",
    price: "$39",
    description: "Laser + 5 Gratings + Glyph Log Book",
    features: [
      "650nm 5mW red laser pointer",
      "5 diffraction grating tips",
      "Glyph documentation notebook",
      "Safety guidelines card",
      "Worldwide shipping",
    ],
    soldOut: true,
  },
  {
    name: "Pro Bundle", 
    price: "$79",
    description: "Starter items + Blackout Mask + Badge + Pens",
    features: [
      "Everything in Starter Bundle",
      "Premium blackout eye mask",
      "First-Time Replicator badge",
      "Fine drawing pens set",
      "Digital protocol handbook PDF",
      "Private Discord access",
    ],
    popular: true,
    soldOut: true,
  },
  {
    name: "Ultimate Bundle",
    price: "$129",
    description: "Pro items + 12 lb Weighted Blanket + Digital Glyph PDF",
    features: [
      "Everything in Pro Bundle",
      "12 lb weighted blanket",
      "Comprehensive glyph PDF archive",
      "Priority community support",
      "Exclusive early access to codex updates",
      "Premium gift packaging",
    ],
    soldOut: true,
  },
  {
    name: "Master Replicator Bundle",
    price: "$379",
    description: "Professional-grade equipment for serious researchers",
    features: [
      "100mW adjustable focus 650nm laser",
      "Full 10-pattern diffraction grating set",
      "Premium blackout mask",
      "15 lb weighted blanket",
      "Glyph log book (premium edition)",
      "Professional drawing pens set",
      "Digital research archive access",
      "Lifetime codex access",
      "Priority community support",
    ],
    soldOut: true,
  },
  {
    name: "Ultimate Discovery Suite",
    price: "$879",
    description: "Complete professional setup with lifetime access",
    features: [
      "Everything in Master Replicator Bundle",
      "High-end vaporizer device",
      "Multiple laser modules (5mW + 100mW)",
      "Luxury 20 lb organic cotton weighted blanket",
      "Custom journal bundle",
      "Lifetime premium codex access",
      "1-on-1 protocol consultation",
      "VIP Discord channel access",
      "Early access to all new equipment",
      "Free lifetime equipment upgrades",
    ],
    premium: true,
    soldOut: true,
  },
];

export const ShopSection = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, { first: 12 });
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

  return (
    <section id="shop" className="relative py-20 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold glow-text">
            Shop DMT Code Equipment
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Ships worldwide in 24-48 hours – Apple Pay, Google Pay, and Amazon Pay available
          </p>
        </div>

        {/* Single Items */}
        {products.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center">Most Popular Single Items</h3>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.slice(0, 4).map((product) => {
                const variant = product.node.variants.edges[0]?.node;
                const image = product.node.images.edges[0]?.node;
                
                return (
                  <Card key={product.node.id} className="p-4 bg-card border-border hover:border-primary/50 transition-all">
                    <div className="space-y-4">
                      {image && (
                        <div className="aspect-square bg-secondary/20 rounded-md overflow-hidden">
                          <img 
                            src={image.url} 
                            alt={image.altText || product.node.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <h4 className="font-semibold line-clamp-2">{product.node.title}</h4>
                        {variant && (
                          <p className="text-xl font-bold text-primary">
                            ${parseFloat(variant.price.amount).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Button 
                        onClick={() => handleAddToCart(product)}
                        className="w-full"
                        size="sm"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Journey Gift Bundles */}
        <div className="space-y-6 pt-8">
          <h3 className="text-2xl font-bold text-center">Journey Gift Bundles</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bundleData.map((bundle) => (
              <Card
                key={bundle.name}
                className={`relative p-8 bg-card border transition-all hover:scale-105 ${
                  bundle.premium
                    ? 'border-primary shadow-lg shadow-primary/20 glow-border ring-2 ring-primary/20' 
                    : bundle.popular 
                    ? 'border-primary shadow-lg shadow-primary/20 glow-border' 
                    : 'border-border'
                }`}
              >
                {bundle.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="px-4 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">
                      Most Popular
                    </div>
                  </div>
                )}
                {bundle.premium && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="px-4 py-1 bg-gradient-to-r from-primary to-primary/70 text-primary-foreground text-sm font-semibold rounded-full">
                      Premium Suite
                    </div>
                  </div>
                )}
                {bundle.soldOut && (
                  <div className="absolute -top-3 -right-3">
                    <Badge variant="destructive" className="text-xs">Sold Out</Badge>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      <h3 className="text-2xl font-bold">{bundle.name}</h3>
                    </div>
                    <p className="text-3xl font-bold text-primary">{bundle.price}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {bundle.description}
                    </p>
                  </div>

                  <ul className="space-y-3">
                    {bundle.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    size="lg" 
                    className={`w-full ${
                      bundle.premium
                        ? 'bg-gradient-to-r from-primary to-primary/70 hover:from-primary/90 hover:to-primary/60'
                        : bundle.popular 
                        ? 'glow-button bg-primary hover:bg-primary/90' 
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                    disabled={bundle.soldOut}
                  >
                    {bundle.soldOut ? 'Sold Out' : 'Add to Cart'}
                  </Button>

                  {bundle.soldOut && (
                    <p className="text-xs text-center text-muted-foreground">
                      Bundles available after individual products are added to Shopify
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No products found in your Shopify store yet.</p>
            <p className="text-sm text-muted-foreground">
              Tell me what products you'd like to create (e.g., "Create a 650nm red laser pointer product for $29.99")
            </p>
          </div>
        )}

        <div className="text-center pt-8">
          <p className="text-sm text-muted-foreground">
            All items ship worldwide with tracking · 30-day satisfaction guarantee
          </p>
        </div>
      </div>
    </section>
  );
};
