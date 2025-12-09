import { useState, useCallback } from "react";
import { type ForecastEvent, type DependencyRule } from "@/lib/forecasts-api";
import { WhatIfSliderPanel, type AdjustedEventData } from "./WhatIfSliderPanel";
import { WhatIfTimelineVisual } from "./WhatIfTimelineVisual";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col gap-4">
      {/* Timeline - Top */}
      <div className="bg-card/20 border border-border/30 rounded-xl p-4">
        <WhatIfTimelineVisual 
          events={events} 
          adjustments={adjustments} 
        />
      </div>

      {/* Collapsible Slider Panel - Bottom */}
      <div className="bg-card/30 border border-border/50 rounded-xl overflow-hidden">
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-card/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm font-medium">Event Sliders</span>
          </div>
          {isPanelOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        
        {isPanelOpen && (
          <div className="px-4 pb-4 animate-fade-in">
            <WhatIfSliderPanel
              events={events}
              dependencyRules={dependencyRules}
              onAdjustmentsChange={handleAdjustmentsChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}