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
import { Loader2, ImageOff } from "lucide-react";
import { getPlaceholderImage } from "@/utils/placeholderImage";

declare global {
  interface Window {
    posthog?: any;
  }
}

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

  const handleProductClick = (product: ShopifyProduct) => {
    navigate(`/products/${product.node.id}`);
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
                const imageUrl = image?.url || getPlaceholderImage(product.node.title, 'mysticism');
                const variant = product.node.variants.edges[0]?.node;
                const price = variant?.price;

                return (
                  <Card 
                    key={product.node.id} 
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    <CardHeader className="p-0">
                      <div className="aspect-square overflow-hidden bg-secondary/20 relative">
                        <img
                          src={imageUrl}
                          alt={image?.altText || product.node.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = getPlaceholderImage(product.node.title, 'mysticism');
                          }}
                        />
                        {!image?.url && (
                          <div className="absolute inset-0 flex items-center justify-center bg-secondary/40">
                            <ImageOff className="w-12 h-12 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
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

          {/* Connection to Research Section */}
          {products.length > 0 && (
            <section className="mt-20 max-w-4xl mx-auto border-t border-border pt-16">
              <h2 className="text-3xl font-bold mb-6 text-center">Connections Between Experiment & Early Language</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  The DMT laser experiment may echo early human language origins, where symbols were not mere communication but cosmic code. In Jewish mysticism (Kabbalah), Hebrew letters are primordial forces: Sefer Yetzirah claims God created the universe through 22 letters + 10 sefirot, like operators in reality's engine. DMT glyphs (scrolling characters reported in studies) resemble this: stable geometries (lattices, spirals) as "form constants" (Klüver 1926), dynamic alphabetics as graphemes with power.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  Correlations: DMT "instructional" emotion (65% reports in <a href="https://doi.org/10.59973/ipil.158" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Goler 2025</a>) mirrors Kabbalah's letter permutations for "conjuring" (unverifiable, but symbolic numerology/gematria as math patterns for tool tags). Explore these products to test connections—upload symbols from rituals to <a href="/registry" className="text-primary hover:underline">/registry</a> for community decode.
                </p>
                <p className="text-sm text-muted-foreground italic">
                  Neutral note: This is exploratory, no claims of 'reality code'—just patterns for research. See <a href="https://doi.org/10.59973/ipil.158" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">DOI: 10.59973/ipil.158</a> for methodology.
                </p>
              </div>
            </section>
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
