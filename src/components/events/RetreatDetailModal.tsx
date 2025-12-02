import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MapPin, ExternalLink, Mail, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CommunityNotes from "./CommunityNotes";
import NotifyMeForm from "./NotifyMeForm";
import SocialShare from "./SocialShare";

interface Retreat {
  id: string;
  name: string;
  description: string | null;
  location: string;
  country: string | null;
  image_url: string | null;
  website_url: string | null;
  contact_email: string | null;
  tags: string[];
}

interface TrustMetrics {
  safety: number;
  authenticity: number;
  value: number;
  integration: number;
  overall: number;
  count: number;
}

interface RetreatDetailModalProps {
  retreat: Retreat | null;
  metrics: TrustMetrics | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RetreatDetailModal = ({ retreat, metrics, open, onOpenChange }: RetreatDetailModalProps) => {
  const [user, setUser] = useState<any>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [safety, setSafety] = useState([3]);
  const [authenticity, setAuthenticity] = useState([3]);
  const [value, setValue] = useState([3]);
  const [integration, setIntegration] = useState([3]);
  const [review, setReview] = useState("");
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  useEffect(() => {
    if (user && retreat) {
      checkUserRating();
    }
  }, [user, retreat]);

  const checkUserRating = async () => {
    if (!user || !retreat) return;

    const { data } = await supabase
      .from("trust_ratings")
      .select("*")
      .eq("retreat_id", retreat.id)
      .eq("user_id", user.id)
      .single();

    if (data) {
      setHasRated(true);
      setSafety([data.safety_rating]);
      setAuthenticity([data.authenticity_rating]);
      setValue([data.value_rating]);
      setIntegration([data.integration_rating]);
      setReview(data.review_text || "");
    }
  };

  const handleSubmitRating = async () => {
    if (!user) {
      toast.error("Please log in to rate retreats");
      return;
    }

    const { error } = await supabase.from("trust_ratings").upsert({
      retreat_id: retreat!.id,
      user_id: user.id,
      safety_rating: safety[0],
      authenticity_rating: authenticity[0],
      value_rating: value[0],
      integration_rating: integration[0],
      review_text: review || null,
    });

    if (error) {
      toast.error("Failed to submit rating");
      console.error(error);
    } else {
      toast.success("Rating submitted successfully");
      setShowRatingForm(false);
      setHasRated(true);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-[hsl(var(--gold))] text-[hsl(var(--gold))]' : 'text-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  if (!retreat) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{retreat.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {retreat.image_url && (
            <img 
              src={retreat.image_url} 
              alt={`${retreat.name} retreat center`}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{retreat.location}{retreat.country && `, ${retreat.country}`}</span>
            </div>
            {retreat.contact_email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${retreat.contact_email}`} className="hover:underline">
                  {retreat.contact_email}
                </a>
              </div>
            )}
          </div>

          {retreat.description && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground">{retreat.description}</p>
            </div>
          )}

          {metrics && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Trust Metrics ({metrics.count} ratings)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Overall Trust</span>
                  {renderStars(Math.round(metrics.overall))}
                </div>
                <div className="flex justify-between items-center">
                  <span>Safety</span>
                  {renderStars(Math.round(metrics.safety))}
                </div>
                <div className="flex justify-between items-center">
                  <span>Authenticity</span>
                  {renderStars(Math.round(metrics.authenticity))}
                </div>
                <div className="flex justify-between items-center">
                  <span>Value</span>
                  {renderStars(Math.round(metrics.value))}
                </div>
                <div className="flex justify-between items-center">
                  <span>Integration Support</span>
                  {renderStars(Math.round(metrics.integration))}
                </div>
              </div>
            </div>
          )}

          {user && !showRatingForm && (
            <Button 
              onClick={() => setShowRatingForm(true)}
              variant="outline"
              className="w-full"
            >
              {hasRated ? "Update Your Rating" : "Rate This Retreat"}
            </Button>
          )}

          {showRatingForm && (
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Your Rating</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Safety: {safety[0]}/5</Label>
                  <Slider value={safety} onValueChange={setSafety} min={1} max={5} step={1} />
                </div>
                <div>
                  <Label>Authenticity: {authenticity[0]}/5</Label>
                  <Slider value={authenticity} onValueChange={setAuthenticity} min={1} max={5} step={1} />
                </div>
                <div>
                  <Label>Value: {value[0]}/5</Label>
                  <Slider value={value} onValueChange={setValue} min={1} max={5} step={1} />
                </div>
                <div>
                  <Label>Integration Support: {integration[0]}/5</Label>
                  <Slider value={integration} onValueChange={setIntegration} min={1} max={5} step={1} />
                </div>
                <div>
                  <Label>Review (optional)</Label>
                  <Textarea 
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your experience..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmitRating} className="flex-1">
                  Submit Rating
                </Button>
                <Button onClick={() => setShowRatingForm(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {retreat.tags && retreat.tags.map((tag, i) => (
              <Badge key={i} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          {retreat.website_url && (
            <a
              href={retreat.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Visit Website <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <div className="border-t pt-4 space-y-3">
            <SocialShare
              title={retreat.name}
              description={retreat.description || undefined}
              entityType="retreat"
            />
            <NotifyMeForm
              entityType="retreat"
              entityName={retreat.name}
            />
          </div>

          <CommunityNotes entityType="retreat" entityId={retreat.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RetreatDetailModal;
