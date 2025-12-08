import { useMemo } from "react";
import { X, ExternalLink, ArrowRight, ArrowLeft, Zap, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  type ForecastEvent, 
  type DependencyRule,
  CATEGORY_COLORS 
} from "@/lib/forecasts-api";
import { cn } from "@/lib/utils";

interface EventDetailPanelProps {
  event: ForecastEvent | null;
  dependencyRules: DependencyRule[];
  allEvents: ForecastEvent[];
  isOpen: boolean;
  onClose: () => void;
  onEventClick: (event: ForecastEvent) => void;
}

export function EventDetailPanel({
  event,
  dependencyRules,
  allEvents,
  isOpen,
  onClose,
  onEventClick
}: EventDetailPanelProps) {
  // Get upstream dependencies (events this depends on)
  const upstreamDeps = useMemo(() => {
    if (!event) return [];
    return dependencyRules
      .filter(rule => rule.target_event === event.name)
      .map(rule => ({
        ...rule,
        event: allEvents.find(e => e.name === rule.source_event)
      }))
      .filter(d => d.event);
  }, [event, dependencyRules, allEvents]);

  // Get downstream dependencies (events triggered by this)
  const downstreamDeps = useMemo(() => {
    if (!event) return [];
    return dependencyRules
      .filter(rule => rule.source_event === event.name)
      .map(rule => ({
        ...rule,
        event: allEvents.find(e => e.name === rule.target_event)
      }))
      .filter(d => d.event);
  }, [event, dependencyRules, allEvents]);

  if (!event) return null;

  return (
    <div
      className={cn(
        "fixed top-0 right-0 h-full w-[400px] max-w-full bg-card border-l border-border shadow-2xl z-50",
        "transform transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border">
        <div className="flex-1">
          <h2 className="text-lg font-black text-foreground pr-8">{event.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge 
              variant="outline" 
              className="capitalize"
              style={{ borderColor: CATEGORY_COLORS[event.category], color: CATEGORY_COLORS[event.category] }}
            >
              {event.category}
            </Badge>
            <Badge variant="secondary">
              {event.medianQuarter} {event.medianYear}
            </Badge>
            <Badge 
              className="text-white"
              style={{ backgroundColor: event.probability >= 0.5 ? '#10B981' : event.probability >= 0.3 ? '#F59E0B' : '#EF4444' }}
            >
              {Math.round(event.probability * 100)}%
            </Badge>
            {!event.isPrimary && (
              <Badge variant="outline" className="border-amber-500 text-amber-500">
                <AlertTriangle className="h-3 w-3 mr-1" />
                CONDITIONAL
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-3 right-3"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-80px)]">
        <div className="p-4 space-y-6">
          {/* Description */}
          {event.description && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Description
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Conditional notice */}
          {!event.isPrimary && upstreamDeps.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-sm text-amber-400">
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                This event occurs IF{' '}
                <button 
                  className="underline font-medium hover:text-amber-300 transition-colors"
                  onClick={() => upstreamDeps[0]?.event && onEventClick(upstreamDeps[0].event)}
                >
                  {upstreamDeps[0]?.event?.name}
                </button>
                {' '}happens.
              </p>
            </div>
          )}

          <Separator />

          {/* Upstream Dependencies */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Depends On ({upstreamDeps.length})
            </h3>
            {upstreamDeps.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No upstream dependencies</p>
            ) : (
              <div className="space-y-2">
                {upstreamDeps.map((dep, i) => (
                  <button
                    key={i}
                    className="w-full text-left p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-colors group"
                    onClick={() => dep.event && onEventClick(dep.event)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: CATEGORY_COLORS[dep.event?.category || 'default'] }}
                        />
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {dep.event?.name}
                        </span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] py-0">
                        {dep.dependency_type}
                      </Badge>
                      <span>Shift ratio: {dep.shift_ratio}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Downstream Dependencies */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Triggers ({downstreamDeps.length})
            </h3>
            {downstreamDeps.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No downstream effects</p>
            ) : (
              <div className="space-y-2">
                {downstreamDeps.map((dep, i) => (
                  <button
                    key={i}
                    className="w-full text-left p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-colors group"
                    onClick={() => dep.event && onEventClick(dep.event)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-primary" />
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {dep.event?.name}
                        </span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] py-0">
                        {dep.dependency_type}
                      </Badge>
                      <span>Shift ratio: {dep.shift_ratio}</span>
                      {dep.min_gap_quarters && (
                        <span>Min gap: {dep.min_gap_quarters}Q</span>
                      )}
                    </div>
                    {dep.description && (
                      <p className="mt-2 text-xs text-muted-foreground italic">
                        {dep.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Analysis Notes */}
          {event.analysisNotes && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Analysis Notes</h3>
              <div className="bg-secondary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {event.analysisNotes}
                </p>
              </div>
            </div>
          )}

          {/* Probability Distribution */}
          {event.distributions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Distribution</h3>
              <div className="grid grid-cols-4 gap-1">
                {event.distributions.slice(0, 12).map((dist, i) => {
                  const isMedian = dist.quarter === event.medianQuarter && dist.year === event.medianYear;
                  return (
                    <div 
                      key={i}
                      className={cn(
                        "text-center p-2 rounded text-xs",
                        isMedian ? "bg-primary/20 text-primary font-bold" : "bg-secondary/20 text-muted-foreground"
                      )}
                    >
                      <div className="text-[10px]">{dist.quarter} {dist.year}</div>
                      <div>{Math.round(dist.probability * 100)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}