import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Package, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { storefrontApiRequest, STOREFRONT_PRODUCTS_QUERY, ShopifyProduct } from '@/lib/shopify';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';

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
