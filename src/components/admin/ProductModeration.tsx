import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, ExternalLink, Flag } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  manufacturer_url: string | null;
  category: string;
  wavelength: string | null;
  is_approved: boolean;
  submitted_by: string | null;
  created_at: string;
}

export const ProductModeration = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter === 'pending') {
        query = query.eq('is_approved', false);
      } else if (filter === 'approved') {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_approved: true })
        .eq("id", id);

      if (error) throw error;

      toast.success("Product approved!");
      fetchProducts();
    } catch (error) {
      console.error("Error approving product:", error);
      toast.error("Failed to approve product");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Product rejected and deleted");
      fetchProducts();
    } catch (error) {
      console.error("Error rejecting product:", error);
      toast.error("Failed to reject product");
    }
  };

  const handleFlag = async (id: string) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_approved: false })
        .eq("id", id);

      if (error) throw error;

      toast.success("Product flagged for review");
      fetchProducts();
    } catch (error) {
      console.error("Error flagging product:", error);
      toast.error("Failed to flag product");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Product Moderation</h2>
        <div className="flex gap-2">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Pending ({products.filter(p => !p.is_approved).length})
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilter('approved')}
          >
            Approved
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No products found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.id} className="p-6">
              <div className="flex gap-6">
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-32 h-32 object-cover rounded-lg border border-border"
                />

                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">{product.title}</h3>
                      <Badge variant={product.is_approved ? "default" : "secondary"}>
                        {product.is_approved ? "Approved" : "Pending"}
                      </Badge>
                      <Badge>{product.category}</Badge>
                      {product.wavelength && (
                        <Badge variant="outline">{product.wavelength}</Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</p>
                  </div>

                  <p className="text-muted-foreground line-clamp-3">{product.description}</p>

                  {product.manufacturer_url && (
                    <a
                      href={product.manufacturer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      Manufacturer URL
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  <div className="text-sm text-muted-foreground">
                    Submitted: {new Date(product.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex gap-2">
                    {!product.is_approved ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(product.id)}
                          className="gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(product.id)}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFlag(product.id)}
                        className="gap-2"
                      >
                        <Flag className="h-4 w-4" />
                        Flag for Review
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
