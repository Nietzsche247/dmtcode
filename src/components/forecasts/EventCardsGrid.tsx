import { type ForecastEvent, CATEGORY_COLORS } from "@/lib/forecasts-api";
import { type CascadeState, formatDelta } from "@/hooks/useCascadeEngine";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, Sparkles, Zap, ChevronRight } from "lucide-react";

interface EventCardsGridProps {
  events: ForecastEvent[];
  showSecondaryEvents: boolean;
  onEventClick: (event: ForecastEvent) => void;
  adjustedEvents?: Map<string, { quarter: string; year: number; deltaQuarters?: number }>;
  affectedEvents?: Set<string>;
  cascadeState?: CascadeState;
}

// Get category color
const getCategoryColor = (category: string, type: string): string => {
  if (type === 'negative') return '#C41E3A';
  if (type === 'foundation') return '#F59E0B';
  return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#22C55E';
};

export function EventCardsGrid({
  events,
  showSecondaryEvents,
  onEventClick,
  adjustedEvents,
  affectedEvents,
  cascadeState
}: EventCardsGridProps) {
  const filteredEvents = showSecondaryEvents ? events : events.filter(e => e.isPrimary);

  // Sort events chronologically
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const adjustedA = adjustedEvents?.get(a.name);
    const adjustedB = adjustedEvents?.get(b.name);
    const yearA = adjustedA?.year || a.medianYear;
    const yearB = adjustedB?.year || b.medianYear;
    
    if (yearA !== yearB) return yearA - yearB;
    return (adjustedA?.quarter || a.medianQuarter).localeCompare(adjustedB?.quarter || b.medianQuarter);
  });

  const typeConfig = {
    positive: {
      label: 'POSITIVE',
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
      Icon: TrendingUp
    },
    negative: {
      label: 'RISK',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
      Icon: AlertTriangle
    },
    foundation: {
      label: 'FOUNDATION',
      className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      Icon: Sparkles
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sortedEvents.map((event) => {
        const adjusted = adjustedEvents?.get(event.name);
        const currentQuarter = adjusted?.quarter || event.medianQuarter;
        const currentYear = adjusted?.year || event.medianYear;
        const deltaQuarters = adjusted?.deltaQuarters || 0;
        const hasShifted = deltaQuarters !== 0;
        const isAffected = affectedEvents?.has(event.name);
        const isCalculating = cascadeState?.isCalculating && isAffected;
        const color = getCategoryColor(event.category, event.type);
        const config = typeConfig[event.type];

        // Mini probability distribution
        const maxProb = Math.max(...event.distributions.map(d => d.probability), 0.01);

        return (
          <Card
            key={event.name}
            onClick={() => onEventClick(event)}
            className={cn(
              "group cursor-pointer transition-all duration-200",
              "bg-card hover:bg-accent/30 border-border/50",
              "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
              isAffected && "border-primary/50 bg-primary/5",
              isCalculating && "animate-pulse"
            )}
          >
            <CardContent className="p-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground leading-tight mb-2">
                    {event.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "font-mono text-xs",
                        hasShifted && "bg-primary text-primary-foreground border-primary"
                      )}
                    >
                      {currentQuarter} {currentYear}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={cn("text-[10px] border", config.className)}
                    >
                      {config.label}
                    </Badge>
                    {hasShifted && (
                      <Badge className="text-[10px] px-1.5 h-5 bg-primary">
                        {formatDelta(deltaQuarters)}
                      </Badge>
                    )}
                    {isAffected && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 h-5">
                        <Zap className="h-2.5 w-2.5 mr-0.5" />
                        Affected
                      </Badge>
                    )}
                  </div>
                </div>
                <div 
                  className="w-3 h-3 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: color }}
                />
              </div>

              {/* Mini probability distribution */}
              <div className="mb-3">
                <div className="flex items-end gap-px h-6">
                  {event.distributions.slice(0, 16).map((dist, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t transition-all"
                      style={{ 
                        height: `${(dist.probability / maxProb) * 100}%`,
                        backgroundColor: color,
                        opacity: 0.2 + (dist.probability / maxProb) * 0.8
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Cascade effects preview */}
              {event.cascadeEffects.tier_1.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Key Effects
                  </p>
                  <ul className="space-y-0.5">
                    {event.cascadeEffects.tier_1.slice(0, 2).map((effect, i) => (
                      <li 
                        key={i} 
                        className="text-xs text-muted-foreground flex items-start gap-1.5"
                      >
                        <span className="text-primary mt-0.5">•</span>
                        <span className="line-clamp-1">{effect}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* View details link */}
              <div className="flex items-center justify-end text-sm text-primary group-hover:underline">
                View Details
                <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}