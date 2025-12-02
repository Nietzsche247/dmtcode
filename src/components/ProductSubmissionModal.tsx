import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ProductSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductSubmissionModal = ({ open, onOpenChange }: ProductSubmissionModalProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    manufacturerUrl: "",
    wavelength: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate image URL
      if (formData.imageUrl) {
        const response = await fetch(formData.imageUrl, { method: 'HEAD' });
        if (!response.ok) {
          toast.error("Image URL is not accessible");
          setLoading(false);
          return;
        }
      }

      // Validate manufacturer URL
      if (!formData.manufacturerUrl) {
        toast.error("Manufacturer link is required");
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      // Create draft product in database
      const { error } = await supabase
        .from('products')
        .insert({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          image_url: formData.imageUrl,
          manufacturer_url: formData.manufacturerUrl,
          wavelength: formData.wavelength || null,
          is_approved: false,
          submitted_by: user?.id
        });

      if (error) throw error;

      toast.success("Product submitted for review", {
        description: "Admin will review and create in Shopify if approved"
      });

      onOpenChange(false);
      setFormData({
        title: "",
        description: "",
        price: "",
        category: "",
        imageUrl: "",
        manufacturerUrl: "",
        wavelength: ""
      });

      // Navigate to admin if user is admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (roles?.role === 'admin') {
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      toast.error("Failed to submit product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit New Product</DialogTitle>
          <DialogDescription>
            Submit a product for admin review. Approved products will be created as draft in Shopify.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Product Title*</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="MitoMAT Red Light Therapy Mat"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description*</Label>
            <Textarea
              id="description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Research-grade equipment for 650nm protocol..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)*</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="1299.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category*</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="laser">Laser Equipment</SelectItem>
                  <SelectItem value="lens">Optical Lenses</SelectItem>
                  <SelectItem value="red-light">Red Light Therapy</SelectItem>
                  <SelectItem value="integration">Psychedelic Integration</SelectItem>
                  <SelectItem value="mysticism">Mysticism & Symbolism</SelectItem>
                  <SelectItem value="retreat">Retreat/Experience</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wavelength">Wavelength (optional)</Label>
            <Input
              id="wavelength"
              value={formData.wavelength}
              onChange={(e) => setFormData({ ...formData, wavelength: e.target.value })}
              placeholder="650nm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL*</Label>
            <Input
              id="imageUrl"
              type="url"
              required
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/product-image.jpg"
            />
            <p className="text-xs text-muted-foreground">Must be a valid, accessible image URL</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manufacturerUrl">Manufacturer/Source Link*</Label>
            <Input
              id="manufacturerUrl"
              type="url"
              required
              value={formData.manufacturerUrl}
              onChange={(e) => setFormData({ ...formData, manufacturerUrl: e.target.value })}
              placeholder="https://manufacturer.com/product"
            />
            <p className="text-xs text-muted-foreground">Official product page or manufacturer link</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit for Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};