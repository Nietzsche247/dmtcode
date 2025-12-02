import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, ExternalLink, ShoppingCart, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import CommunityNotes from "@/components/events/CommunityNotes";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  manufacturer_url: string | null;
  specs: any;
  category: string;
  wavelength: string | null;
  is_affiliate: boolean;
  affiliate_url: string | null;
}

interface Rating {
  id: string;
  quality_rating: number;
  accuracy_rating: number;
  value_rating: number;
  research_rating: number;
  review_text: string | null;
  created_at: string;
  user_id: string;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState<Rating | null>(null);
  const [newRating, setNewRating] = useState({
    quality_rating: 5,
    accuracy_rating: 5,
    value_rating: 5,
    research_rating: 5,
    review_text: ""
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchRatings();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from("product_ratings")
        .select("*")
        .eq("product_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRatings(data || []);

      // Check if user has already rated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const existing = data?.find(r => r.user_id === user.id);
        if (existing) setUserRating(existing);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  const handleSubmitRating = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to submit a rating");
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("product_ratings")
        .insert({
          product_id: id,
          user_id: user.id,
          ...newRating
        });

      if (error) throw error;

      toast.success("Rating submitted!");
      fetchRatings();
      setNewRating({
        quality_rating: 5,
        accuracy_rating: 5,
        value_rating: 5,
        research_rating: 5,
        review_text: ""
      });
    } catch (error: any) {
      console.error("Error submitting rating:", error);
      toast.error(error.message || "Failed to submit rating");
    }
  };

  const calculateAverageRating = () => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => 
      acc + r.quality_rating + r.accuracy_rating + r.value_rating + r.research_rating, 0
    );
    return (sum / (ratings.length * 4)).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Product not found</p>
          <Button onClick={() => navigate("/tools")}>Back to Tools</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{product.title} | DMT Code</title>
        <meta name="description" content={product.description.slice(0, 160)} />
        <link rel="canonical" href={`https://dmtcode.com/products/${id}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.title,
            "description": product.description,
            "image": product.image_url,
            "brand": { "@type": "Brand", "name": "DMT Code" },
            "offers": {
              "@type": "Offer",
              "price": product.price,
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            },
            "aggregateRating": ratings.length > 0 ? {
              "@type": "AggregateRating",
              "ratingValue": calculateAverageRating(),
              "reviewCount": ratings.length
            } : undefined
          })}
        </script>
      </Helmet>

      <ParticleBackground />
      <Navigation />

      <main className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/tools">Tools</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{product.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Product Header */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <img
                src={product.image_url}
                alt={product.title}
                className="w-full aspect-square object-cover rounded-lg border border-border"
              />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge>{product.category}</Badge>
                  {product.wavelength && (
                    <Badge variant="outline">{product.wavelength}</Badge>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">{product.title}</h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-primary text-primary" />
                    <span className="font-semibold">{calculateAverageRating()}</span>
                    <span className="text-muted-foreground">({ratings.length} reviews)</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <p className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</p>
                
                {product.is_affiliate && product.affiliate_url ? (
                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={() => window.open(product.affiliate_url!, '_blank')}
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Buy Now (Affiliate Link)
                  </Button>
                ) : (
                  <Button size="lg" className="w-full">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                )}

                {product.manufacturer_url && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(product.manufacturer_url!, '_blank')}
                  >
                    View Manufacturer Site
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specs">Specs</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({ratings.length})</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-4">
              <Card className="p-6">
                <p className="text-lg leading-relaxed">{product.description}</p>
              </Card>
            </TabsContent>

            <TabsContent value="specs" className="space-y-4">
              <Card className="p-6">
                {Object.keys(product.specs).length > 0 ? (
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <dt className="text-sm font-semibold text-muted-foreground uppercase">
                          {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="text-lg">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-muted-foreground">No specifications available</p>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              {!userRating && (
                <Card className="p-6 space-y-6">
                  <h3 className="text-xl font-bold">Submit Your Rating</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {['quality_rating', 'accuracy_rating', 'value_rating', 'research_rating'].map((key) => (
                      <div key={key} className="space-y-2">
                        <label className="text-sm font-semibold capitalize">
                          {key.replace('_rating', '').replace('_', ' ')}
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewRating({ ...newRating, [key]: star })}
                              className="transition-colors"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  star <= (newRating[key as keyof typeof newRating] as number)
                                    ? 'fill-primary text-primary'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Review (optional)</label>
                    <textarea
                      className="w-full min-h-[100px] p-3 rounded-md border border-border bg-background"
                      placeholder="Share your experience with this product..."
                      value={newRating.review_text}
                      onChange={(e) => setNewRating({ ...newRating, review_text: e.target.value })}
                    />
                  </div>

                  <Button onClick={handleSubmitRating} className="w-full">
                    Submit Rating
                  </Button>
                </Card>
              )}

              <div className="space-y-4">
                {ratings.map((rating) => (
                  <Card key={rating.id} className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-primary text-primary" />
                        <span className="font-semibold">
                          {((rating.quality_rating + rating.accuracy_rating + rating.value_rating + rating.research_rating) / 4).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Quality: {rating.quality_rating}/5</div>
                      <div>Accuracy: {rating.accuracy_rating}/5</div>
                      <div>Value: {rating.value_rating}/5</div>
                      <div>Research: {rating.research_rating}/5</div>
                    </div>

                    {rating.review_text && (
                      <p className="text-muted-foreground">{rating.review_text}</p>
                    )}
                  </Card>
                ))}

                {ratings.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No reviews yet. Be the first to rate this product!
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <Card className="p-6">
                <p className="text-muted-foreground">
                  Community notes coming soon. Check back later!
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ProductDetail;
