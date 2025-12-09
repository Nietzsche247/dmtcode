import { useState, useCallback } from "react";
import { type ForecastEvent, type DependencyRule } from "@/lib/forecasts-api";
import { WhatIfSliderPanel, type AdjustedEventData } from "./WhatIfSliderPanel";
import { WhatIfTimelineVisual } from "./WhatIfTimelineVisual";

interface WhatIfSimulatorV2Props {
  events: ForecastEvent[];
  dependencyRules: DependencyRule[];
}

export function WhatIfSimulatorV2({ events, dependencyRules }: WhatIfSimulatorV2Props) {
  const [adjustments, setAdjustments] = useState<Record<string, AdjustedEventData>>({});

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

      {/* Slider Panel - Bottom */}
      <div className="bg-card/30 border border-border/50 rounded-xl p-4">
        <WhatIfSliderPanel
          events={events}
          dependencyRules={dependencyRules}
          onAdjustmentsChange={handleAdjustmentsChange}
        />
      </div>
    </div>
  );
}