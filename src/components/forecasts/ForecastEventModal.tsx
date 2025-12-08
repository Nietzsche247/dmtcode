import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Layers, ArrowRight, ChevronRight } from "lucide-react";
import type { ForecastEvent } from "@/lib/forecasts-api";

interface ForecastEventModalProps {
  event: ForecastEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allEvents?: ForecastEvent[];
}

export function ForecastEventModal({ 
  event, 
  open, 
  onOpenChange,
  allEvents = []
}: ForecastEventModalProps) {
  if (!event) return null;

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Layers className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'positive':
        return { label: 'Positive', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
      case 'negative':
        return { label: 'Negative', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
      default:
        return { label: 'Foundation', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    }
  };

  const typeInfo = getTypeLabel(event.type);
  
  // Calculate probability distribution stats
  const sortedDist = [...event.distributions].sort((a, b) => 
    a.year !== b.year ? a.year - b.year : a.quarter.localeCompare(b.quarter)
  );
  const maxProb = Math.max(...sortedDist.map(d => d.probability));
  const totalProb = sortedDist.reduce((sum, d) => sum + d.probability, 0);

  // Find related events
  const dependsOnEvents = allEvents.filter(e => 
    event.dependencies.depends_on.includes(e.name)
  );
  const enablesEvents = allEvents.filter(e => 
    event.dependencies.enables.includes(e.name)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getEventIcon(event.type)}
            <DialogTitle className="text-xl font-bold text-foreground">
              {event.name}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={`${typeInfo.color} border`}>
              {typeInfo.label}
            </Badge>
            <Badge variant="outline" className="font-mono">
              Median: {event.median}
            </Badge>
          </div>
        </DialogHeader>

        {/* Probability Distribution */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            Probability Distribution
          </h3>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
            <div className="space-y-2">
              {sortedDist.map((dist, i) => {
                const width = (dist.probability / maxProb) * 100;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">
                      {dist.quarter} {dist.year}
                    </span>
                    <div className="flex-1 h-6 bg-background/50 rounded overflow-hidden relative">
                      <div 
                        className="h-full bg-gradient-to-r from-primary/60 to-primary rounded transition-all"
                        style={{ width: `${width}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-medium text-foreground">
                        {(dist.probability * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
              Total probability mass: {(totalProb * 100).toFixed(0)}%
            </p>
          </div>
        </section>

        {/* Dependencies */}
        {(dependsOnEvents.length > 0 || event.dependencies.depends_on.length > 0) && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              Dependencies (requires)
            </h3>
            <div className="space-y-2">
              {event.dependencies.depends_on.map((depName, i) => {
                const depEvent = allEvents.find(e => e.name === depName);
                return (
                  <div 
                    key={i}
                    className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20"
                  >
                    <ChevronRight className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-foreground">{depName}</span>
                    {depEvent && (
                      <Badge variant="outline" className="ml-auto text-xs font-mono">
                        {depEvent.median}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Enables */}
        {(enablesEvents.length > 0 || event.dependencies.enables.length > 0) && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Enables (unlocks)
            </h3>
            <div className="space-y-2">
              {event.dependencies.enables.map((enName, i) => {
                const enEvent = allEvents.find(e => e.name === enName);
                return (
                  <div 
                    key={i}
                    className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20"
                  >
                    <ArrowRight className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-foreground">{enName}</span>
                    {enEvent && (
                      <Badge variant="outline" className="ml-auto text-xs font-mono">
                        {enEvent.median}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Cascade Effects */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
            Cascade Effects
          </h3>
          <div className="space-y-4">
            {/* Tier 1 */}
            {event.cascadeEffects.tier_1.length > 0 && (
              <div>
                <p className="text-xs font-medium text-purple-400 mb-2">
                  Tier 1 — Immediate Effects
                </p>
                <ul className="space-y-1.5">
                  {event.cascadeEffects.tier_1.map((effect, i) => (
                    <li 
                      key={i}
                      className="text-sm text-foreground pl-4 border-l-2 border-purple-500/50"
                    >
                      {effect}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tier 2 */}
            {event.cascadeEffects.tier_2.length > 0 && (
              <div>
                <p className="text-xs font-medium text-purple-400/80 mb-2">
                  Tier 2 — Secondary Effects
                </p>
                <ul className="space-y-1.5">
                  {event.cascadeEffects.tier_2.map((effect, i) => (
                    <li 
                      key={i}
                      className="text-sm text-muted-foreground pl-4 border-l-2 border-purple-500/30"
                    >
                      {effect}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tier 3 */}
            {event.cascadeEffects.tier_3.length > 0 && (
              <div>
                <p className="text-xs font-medium text-purple-400/60 mb-2">
                  Tier 3 — Long-term Effects
                </p>
                <ul className="space-y-1.5">
                  {event.cascadeEffects.tier_3.map((effect, i) => (
                    <li 
                      key={i}
                      className="text-sm text-muted-foreground/80 pl-4 border-l-2 border-purple-500/20"
                    >
                      {effect}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {event.cascadeEffects.tier_1.length === 0 && 
             event.cascadeEffects.tier_2.length === 0 && 
             event.cascadeEffects.tier_3.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No cascade effects documented.
              </p>
            )}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
