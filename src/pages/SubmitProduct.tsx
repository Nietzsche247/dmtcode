import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const SubmitProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    image_url: "",
    manufacturer_url: "",
    category: "tool",
    wavelength: "",
    specs: {} as Record<string, string>
  });

  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");

  const handleAddSpec = () => {
    if (specKey && specValue) {
      setFormData({
        ...formData,
        specs: { ...formData.specs, [specKey]: specValue }
      });
      setSpecKey("");
      setSpecValue("");
    }
  };

  const handleRemoveSpec = (key: string) => {
    const newSpecs = { ...formData.specs };
    delete newSpecs[key];
    setFormData({ ...formData, specs: newSpecs });
  };

  const testImageUrl = async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.price || !formData.image_url) {
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Test image URL
      const imageValid = await testImageUrl(formData.image_url);
      if (!imageValid) {
        toast.error("Image URL is not accessible. Please provide a valid image URL.");
        setLoading(false);
        return;
      }

      // Validate manufacturer URL if provided
      if (formData.manufacturer_url) {
        try {
          new URL(formData.manufacturer_url);
        } catch {
          toast.error("Please provide a valid manufacturer URL");
          setLoading(false);
          return;
        }
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to submit a product");
        navigate("/auth");
        return;
      }

      // Submit product
      const { error } = await supabase.from("products").insert({
        ...formData,
        price: parseFloat(formData.price),
        submitted_by: user.id,
        is_approved: false
      });

      if (error) throw error;

      toast.success("Product submitted for review! You'll be notified when it's approved.");
      navigate("/tools");
    } catch (error: any) {
      console.error("Error submitting product:", error);
      toast.error(error.message || "Failed to submit product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Submit Product | DMT Code</title>
        <meta name="description" content="Submit a new research product to the DMT Code catalogue" />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <ParticleBackground />
      <Navigation />

      <main className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/tools")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tools
          </Button>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">Submit Product</h1>
            <p className="text-muted-foreground">
              Share research equipment, tools, or experiences with the community. All submissions are reviewed before approval.
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="MitoMAT Red Light Therapy Yoga Mat"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[120px] p-3 rounded-md border border-border bg-background"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description including research relevance and citations..."
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="99.99"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tool">Tool</SelectItem>
                      <SelectItem value="laser">Laser</SelectItem>
                      <SelectItem value="woo">Mysticism</SelectItem>
                      <SelectItem value="retreat">Retreat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL *</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Image will be tested for accessibility before submission
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer_url">Manufacturer URL</Label>
                <Input
                  id="manufacturer_url"
                  type="url"
                  value={formData.manufacturer_url}
                  onChange={(e) => setFormData({ ...formData, manufacturer_url: e.target.value })}
                  placeholder="https://manufacturer.com/product"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wavelength">Wavelength (optional)</Label>
                <Input
                  id="wavelength"
                  value={formData.wavelength}
                  onChange={(e) => setFormData({ ...formData, wavelength: e.target.value })}
                  placeholder="650nm or 660nm + 850nm"
                />
              </div>

              <div className="space-y-4">
                <Label>Product Specifications</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Spec name (e.g., power)"
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Value (e.g., 180W)"
                      value={specValue}
                      onChange={(e) => setSpecValue(e.target.value)}
                    />
                    <Button type="button" onClick={handleAddSpec}>
                      Add
                    </Button>
                  </div>
                </div>

                {Object.entries(formData.specs).length > 0 && (
                  <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                    {Object.entries(formData.specs).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">
                          <strong>{key}:</strong> {value}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSpec(key)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Product for Review"}
              </Button>
            </form>
          </Card>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default SubmitProduct;
