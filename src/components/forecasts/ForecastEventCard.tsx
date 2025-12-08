import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp, Sparkles, ExternalLink } from "lucide-react";
import type { ForecastEvent, MetaculusComparison } from "@/lib/forecasts-api";

interface ForecastEventCardProps {
  event: ForecastEvent;
  metaculus?: MetaculusComparison;
  onClick?: () => void;
}

// Format ISO date to readable format
const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

// Parse our median "Q4 2028" to comparable date
const parseOurMedian = (median: string): Date | null => {
  const match = median.match(/(Q[1-4])\s*(\d{4})/);
  if (!match) return null;
  const quarter = parseInt(match[1].slice(1));
  const year = parseInt(match[2]);
  const month = (quarter - 1) * 3 + 1; // Q1=Jan, Q2=Apr, Q3=Jul, Q4=Oct
  return new Date(year, month, 1);
};

// Calculate difference in months
const getMonthsDiff = (date1: Date | null, date2: string | null): number | null => {
  if (!date1 || !date2) return null;
  const d2 = new Date(date2);
  return Math.round((d2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24 * 30));
};

export function ForecastEventCard({ event, metaculus, onClick }: ForecastEventCardProps) {
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

  // Calculate difference between our prediction and Metaculus
  const ourDate = parseOurMedian(event.median);
  const monthsDiff = metaculus ? getMonthsDiff(ourDate, metaculus.metaculus_median_date) : null;

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

        {/* Metaculus Comparison */}
        {metaculus && (
          <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                vs Metaculus
              </span>
              <a 
                href={metaculus.metaculus_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            
            {/* Side by side comparison */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground block">Our Forecast</span>
                <span className="font-semibold text-primary">{event.median}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Community</span>
                <span className="font-semibold text-blue-400">
                  {formatDate(metaculus.metaculus_median_date)}
                </span>
              </div>
            </div>

            {/* Difference indicator */}
            {monthsDiff !== null && (
              <div className="mt-2 pt-2 border-t border-blue-500/20">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Difference</span>
                  <span className={cn(
                    "font-medium",
                    Math.abs(monthsDiff) <= 6 ? "text-green-400" :
                    Math.abs(monthsDiff) <= 18 ? "text-yellow-400" : "text-red-400"
                  )}>
                    {monthsDiff === 0 ? 'Aligned' :
                     monthsDiff > 0 ? `+${monthsDiff} months` : `${monthsDiff} months`}
                  </span>
                </div>
              </div>
            )}

            {/* Forecaster count */}
            {metaculus.metaculus_forecasters && (
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-muted-foreground">Forecasters</span>
                <span className="font-medium text-foreground">
                  {metaculus.metaculus_forecasters.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

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
