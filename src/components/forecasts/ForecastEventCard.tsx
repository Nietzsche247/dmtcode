import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp, Sparkles } from "lucide-react";
import type { ForecastEvent } from "@/lib/forecasts-api";

interface ForecastEventCardProps {
  event: ForecastEvent;
  onClick?: () => void;
}

export function ForecastEventCard({ event, onClick }: ForecastEventCardProps) {
  const typeConfig = {
    positive: {
      label: 'POSITIVE',
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
      icon: TrendingUp
    },
    negative: {
      label: 'NEGATIVE',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
      icon: AlertTriangle
    },
    foundation: {
      label: 'FOUNDATION',
      className: 'bg-gold/20 text-gold border-gold/30',
      icon: Sparkles
    }
  };

  const config = typeConfig[event.type];
  const Icon = config.icon;

  // Calculate total probability for sparkline
  const maxProb = Math.max(...event.distributions.map(d => d.probability), 1);

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-300",
        "bg-card/50 border-border/50 backdrop-blur-sm",
        "hover:scale-[1.02] hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold text-foreground leading-tight line-clamp-2">
              {event.name}
            </CardTitle>
          </div>
          <Icon className={cn(
            "w-5 h-5 flex-shrink-0",
            event.type === 'negative' ? 'text-red-400' : 
            event.type === 'foundation' ? 'text-gold' : 'text-green-400'
          )} />
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Badge 
            variant="outline" 
            className="bg-primary text-primary-foreground border-primary font-mono text-xs"
          >
            {event.median}
          </Badge>
          <Badge 
            variant="outline" 
            className={cn("text-xs border", config.className)}
          >
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Mini probability distribution sparkline */}
        <div className="mb-4">
          <div className="flex items-end gap-0.5 h-8">
            {event.distributions.slice(0, 12).map((dist, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-t transition-all",
                  event.type === 'negative' ? 'bg-red-500' : 
                  event.type === 'foundation' ? 'bg-gold' : 'bg-primary'
                )}
                style={{ 
                  height: `${(dist.probability / maxProb) * 100}%`,
                  opacity: 0.3 + (dist.probability / maxProb) * 0.7
                }}
                title={`${dist.quarter} ${dist.year}: ${dist.probability}%`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Probability distribution
          </p>
        </div>

        {/* Cascade effects preview */}
        {event.cascadeEffects.tier_1.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Key Effects
            </p>
            <ul className="space-y-1">
              {event.cascadeEffects.tier_1.slice(0, 3).map((effect, i) => (
                <li 
                  key={i} 
                  className="text-sm text-foreground/80 flex items-start gap-2"
                >
                  <span className="text-primary mt-1">•</span>
                  <span className="line-clamp-1">{effect}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* View details link */}
        <p className="text-sm text-primary mt-3 group-hover:underline">
          View Details →
        </p>
      </CardContent>
    </Card>
  );
}
