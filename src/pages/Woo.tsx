import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/stores/cartStore";
import { storefrontApiRequest, STOREFRONT_PRODUCTS_QUERY, ShopifyProduct } from "@/lib/shopify";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Woo = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, {
          first: 50,
          query: "tag:mysticism OR tag:jewish"
        });
        
        if (data?.data?.products?.edges) {
          setProducts(data.data.products.edges);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
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
      description: `${product.node.title} has been added to your cart.`,
    });
  };

  return (
    <>
      <Helmet>
        <title>Mysticism & Symbolism Store | DMT Code</title>
        <meta name="description" content="Explore Jewish mysticism symbols and protective amulets. Collection includes Hamsa, Star of David, Chai, Pomegranate, Evil Eye, Mezuzah, and Kabbalah Tree of Life items." />
        <link rel="canonical" href="https://dmtcode.com/woo" />
      </Helmet>

      <ParticleBackground />
      <Navigation />

      <main className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-16 pt-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 glow-text">
              Mysticism & Symbolism Store
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Explore Jewish mysticism symbols and protective amulets. Each item represents the power of characters, symbols, and sacred letters in faith traditions.
            </p>
            <Button 
              onClick={() => navigate('/tools')}
              variant="outline"
              size="lg"
              className="text-primary border-primary hover:bg-primary/10"
            >
              Explore research tools for variant tests →
            </Button>
          </section>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => {
                const image = product.node.images?.edges?.[0]?.node;
                const variant = product.node.variants.edges[0]?.node;
                const price = variant?.price;

                return (
                  <Card key={product.node.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="p-0">
                      {image && (
                        <div className="aspect-square overflow-hidden bg-secondary/20">
                          <img
                            src={image.url}
                            alt={image.altText || product.node.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-6">
                      <CardTitle className="text-xl mb-2">{product.node.title}</CardTitle>
                      <CardDescription className="text-sm mb-4">
                        {product.node.description}
                      </CardDescription>
                      {price && (
                        <p className="text-2xl font-bold text-primary">
                          {price.currencyCode} ${parseFloat(price.amount).toFixed(2)}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="w-full"
                        disabled={!variant?.availableForSale}
                      >
                        {variant?.availableForSale ? "Add to Cart" : "Out of Stock"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}

          {/* CTA Section */}
          <section className="mt-20 text-center border-t border-border pt-16">
            <h2 className="text-3xl font-bold mb-6">Ready for Scientific Research?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Explore our research-grade lasers and lenses for 650nm laser protocol experiments.
            </p>
            <Button 
              onClick={() => navigate('/tools')}
              size="lg"
              className="text-lg px-8"
            >
              View Research Tools
            </Button>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Woo;
