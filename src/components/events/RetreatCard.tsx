import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

const RetreatCard = ({ retreat }: { retreat: Retreat }) => {
  const [metrics, setMetrics] = useState<TrustMetrics | null>(null);


  useEffect(() => {
    fetchTrustMetrics();
  }, [retreat.id]);

  const fetchTrustMetrics = async () => {
    const { data, error } = await supabase
      .from("trust_ratings")
      .select("safety_rating, authenticity_rating, value_rating, integration_rating")
      .eq("retreat_id", retreat.id);

    if (error) {
      console.error("Error fetching trust metrics:", error);
      return;
    }

    if (data && data.length > 0) {
      const avgSafety = data.reduce((sum, r) => sum + r.safety_rating, 0) / data.length;
      const avgAuth = data.reduce((sum, r) => sum + r.authenticity_rating, 0) / data.length;
      const avgValue = data.reduce((sum, r) => sum + r.value_rating, 0) / data.length;
      const avgIntegration = data.reduce((sum, r) => sum + r.integration_rating, 0) / data.length;
      const overall = (avgSafety + avgAuth + avgValue + avgIntegration) / 4;

      setMetrics({
        safety: avgSafety,
        authenticity: avgAuth,
        value: avgValue,
        integration: avgIntegration,
        overall,
        count: data.length,
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? 'fill-[hsl(var(--gold))] text-[hsl(var(--gold))]' : 'text-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Link to={`/retreats/${retreat.id}`} className="block h-full">
      <Card
        className="overflow-hidden hover:shadow-lg transition-all cursor-pointer h-full flex flex-col border border-border/50 shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
      >
        {retreat.image_url && (
          <div className="h-48 overflow-hidden">
            <img
              src={retreat.image_url}
              alt={`${retreat.name} retreat center`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{retreat.name}</CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{retreat.location}</span>
            {retreat.country && <span>, {retreat.country}</span>}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {metrics && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Overall Trust</span>
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(metrics.overall))}
                  <span className="text-xs text-muted-foreground">({metrics.count})</span>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Safety</span>
                  {renderStars(Math.round(metrics.safety))}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Authenticity</span>
                  {renderStars(Math.round(metrics.authenticity))}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Value</span>
                  {renderStars(Math.round(metrics.value))}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Integration</span>
                  {renderStars(Math.round(metrics.integration))}
                </div>
              </div>
            </div>
          )}

          {retreat.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {retreat.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-auto">
            {retreat.tags && retreat.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {retreat.website_url && (
            <div className="mt-4 pt-4 border-t border-border">
              <a
                href={retreat.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                Visit Website <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default RetreatCard;
