import { useState, useCallback } from "react";
import { type ForecastEvent, type DependencyRule } from "@/lib/forecasts-api";
import { WhatIfSliderPanel, type AdjustedEventData } from "./WhatIfSliderPanel";
import { WhatIfTimelineVisual } from "./WhatIfTimelineVisual";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";

interface WhatIfSimulatorV2Props {
  events: ForecastEvent[];
  dependencyRules: DependencyRule[];
}

export function WhatIfSimulatorV2({ events, dependencyRules }: WhatIfSimulatorV2Props) {
  const [adjustments, setAdjustments] = useState<Record<string, AdjustedEventData>>({});
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const handleAdjustmentsChange = useCallback((newAdjustments: Record<string, AdjustedEventData>) => {
    setAdjustments(newAdjustments);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Timeline - Left (65% on desktop) */}
      <div className="w-full lg:w-[65%] bg-card/20 border border-border/30 rounded-xl p-4 min-h-[400px]">
        <WhatIfTimelineVisual 
          events={events} 
          adjustments={adjustments} 
        />
      </div>

      {/* Slider Panel - Right (35% on desktop) */}
      <div className="w-full lg:w-[35%] bg-card/30 border border-border/50 rounded-xl overflow-hidden">
        {/* Mobile-only collapsible header */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="lg:hidden w-full flex items-center justify-between p-4 hover:bg-card/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm font-medium">Event Sliders</span>
            {!isPanelOpen && Object.keys(adjustments).length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                {Object.keys(adjustments).length} adjusted
              </span>
            )}
          </div>
          {isPanelOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Desktop header (always visible) */}
        <div className="hidden lg:flex items-center gap-2 p-4 border-b border-border/30">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Event Sliders</span>
          {Object.keys(adjustments).length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
              {Object.keys(adjustments).length} adjusted
            </span>
          )}
        </div>
        
        {/* Panel content - always open on desktop, collapsible on mobile */}
        <div className={`px-4 pb-4 ${isPanelOpen ? 'block' : 'hidden lg:block'}`}>
          <WhatIfSliderPanel
            events={events}
            dependencyRules={dependencyRules}
            onAdjustmentsChange={handleAdjustmentsChange}
          />
        </div>
      </div>
    </div>
  );
}