import { useState, useCallback } from "react";
import { type ForecastEvent, type DependencyRule } from "@/lib/forecasts-api";
import { WhatIfSliderPanel, type AdjustedEventData } from "./WhatIfSliderPanel";
import { WhatIfTimelineVisual } from "./WhatIfTimelineVisual";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface WhatIfSimulatorV2Props {
  events: ForecastEvent[];
  dependencyRules: DependencyRule[];
}

export function WhatIfSimulatorV2({ events, dependencyRules }: WhatIfSimulatorV2Props) {
  const isMobile = useIsMobile();
  const [adjustments, setAdjustments] = useState<Record<string, AdjustedEventData>>({});

  const handleAdjustmentsChange = useCallback((newAdjustments: Record<string, AdjustedEventData>) => {
    setAdjustments(newAdjustments);
  }, []);

  return (
    <div className={cn(
      "flex gap-4",
      isMobile ? "flex-col" : "flex-row"
    )}>
      {/* Timeline - Left/Top */}
      <div className={cn(
        "bg-card/20 border border-border/30 rounded-xl p-4",
        isMobile ? "w-full order-2" : "flex-1"
      )}>
        <WhatIfTimelineVisual 
          events={events} 
          adjustments={adjustments} 
        />
      </div>

      {/* Slider Panel - Right/Bottom */}
      <div className={cn(
        "bg-card/30 border border-border/50 rounded-xl p-4",
        isMobile ? "w-full order-1 max-h-[400px]" : "w-[320px] h-[450px]"
      )}>
        <WhatIfSliderPanel
          events={events}
          dependencyRules={dependencyRules}
          onAdjustmentsChange={handleAdjustmentsChange}
        />
      </div>
    </div>
  );
}