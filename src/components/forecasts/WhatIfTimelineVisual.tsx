import { useMemo } from "react";
import type { ForecastEvent, DependencyRule } from "@/lib/forecasts-api";
import { CATEGORY_COLORS, quarterToNumber } from "@/lib/forecasts-api";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { AdjustedEventData } from "./WhatIfSliderPanel";

interface WhatIfTimelineVisualProps {
  events: ForecastEvent[];
  adjustments: Record<string, AdjustedEventData>;
}

// Timeline configuration
const TIMELINE_START_YEAR = 2025;
const TIMELINE_END_YEAR = 2035;
const YEARS = Array.from({ length: TIMELINE_END_YEAR - TIMELINE_START_YEAR + 1 }, (_, i) => TIMELINE_START_YEAR + i);

// Primary events
const PRIMARY_EVENTS_ABOVE = [
  "AI Agents Transform White-Collar Work",
  "AI Achieves Human-Level Novel Reasoning",
  "AGI / Human-Level General Intelligence",
  "Recursive Learning Algorithms Discovered",
  "Artificial Superintelligence Emerges",
  "First 1M Humanoid Robots Delivered",
  "Quantum Computing Becomes Semi-Mainstream",
  "Anti-Aging Breakthrough"
];

const PRIMARY_EVENTS_BELOW = [
  "China-Taiwan Military Conflict",
  "Global Chip Shortage",
  "DIY Bio-Attack with Major Impact",
  "Quantum Computing Breaks RSA/ECC",
  "Global Unemployment Crisis",
  "ASI Achieves Omniscience",
  "ASI Controls Global Infrastructure"
];

// Get position as percentage
function getPositionFromNumeric(value: number): number {
  const yearSpan = TIMELINE_END_YEAR - TIMELINE_START_YEAR;
  const yearOffset = value - TIMELINE_START_YEAR;
  return 5 + (yearOffset / yearSpan) * 90;
}

// Fuzzy match
function matchEventName(target: string, events: ForecastEvent[]): ForecastEvent | undefined {
  let match = events.find(e => e.name === target);
  if (match) return match;
  
  const targetLower = target.toLowerCase();
  match = events.find(e => e.name.toLowerCase().includes(targetLower.slice(0, 20)));
  if (match) return match;
  
  match = events.find(e => targetLower.includes(e.name.toLowerCase().slice(0, 20)));
  return match;
}

interface ProcessedEvent {
  event: ForecastEvent;
  originalPosition: number;
  adjustedPosition: number;
  deltaQuarters: number;
  row: number;
  isAbove: boolean;
  isManuallyAdjusted: boolean;
  cascadeSource?: string;
}

export function WhatIfTimelineVisual({ events, adjustments }: WhatIfTimelineVisualProps) {
  const isMobile = useIsMobile();

  const processedEvents = useMemo(() => {
    const result: ProcessedEvent[] = [];
    const aboveRows: { start: number; end: number }[][] = [[], [], [], [], []];
    const belowRows: { start: number; end: number }[][] = [[], [], [], [], []];

    const allPrimaryNames = [...PRIMARY_EVENTS_ABOVE, ...PRIMARY_EVENTS_BELOW];
    
    allPrimaryNames.forEach(eventName => {
      const event = matchEventName(eventName, events);
      if (!event) return;

      const adjustment = adjustments[event.name];
      if (!adjustment) return;

      const isAbove = PRIMARY_EVENTS_ABOVE.includes(eventName);
      const originalPosition = getPositionFromNumeric(adjustment.originalPosition);
      const adjustedPosition = getPositionFromNumeric(adjustment.adjustedPosition);
      
      // Find row
      const rows = isAbove ? aboveRows : belowRows;
      let assignedRow = 0;
      for (let r = 0; r < rows.length; r++) {
        const overlaps = rows[r].some(bar => 
          !(adjustedPosition + 3 < bar.start - 0.5 || adjustedPosition - 3 > bar.end + 0.5)
        );
        if (!overlaps) {
          assignedRow = r;
          rows[r].push({ start: adjustedPosition - 3, end: adjustedPosition + 3 });
          break;
        }
      }

      result.push({
        event,
        originalPosition,
        adjustedPosition,
        deltaQuarters: adjustment.deltaQuarters,
        row: assignedRow,
        isAbove,
        isManuallyAdjusted: adjustment.isManuallyAdjusted,
        cascadeSource: adjustment.cascadeSource
      });
    });

    return result;
  }, [events, adjustments]);

  const hasChanges = processedEvents.some(pe => pe.deltaQuarters !== 0);

  const timelineHeight = isMobile ? 400 : 450;
  const barHeight = isMobile ? 16 : 20;
  const rowGap = isMobile ? 34 : 40;
  const centerY = timelineHeight / 2;

  if (!hasChanges) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Adjust the sliders to see events shift on the timeline
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-x-auto" style={{ height: timelineHeight }}>
      <div 
        className="relative"
        style={{ 
          height: timelineHeight,
          minWidth: isMobile ? 700 : 900
        }}
      >
        {/* Timeline Spine */}
        <div 
          className="absolute left-[5%] right-[5%] h-0.5 bg-primary/50"
          style={{ top: centerY }}
        />

        {/* Year Markers */}
        {YEARS.map((year, i) => {
          const x = 5 + (i / (YEARS.length - 1)) * 90;
          const showLabel = !isMobile || i % 2 === 0;
          return (
            <div 
              key={year}
              className="absolute flex flex-col items-center"
              style={{ left: `${x}%`, top: centerY - 8 }}
            >
              <div className="w-0.5 h-4 bg-primary/50" />
              {showLabel && (
                <span className="mt-2 text-[10px] md:text-xs font-semibold text-muted-foreground">
                  {year}
                </span>
              )}
            </div>
          );
        })}

        {/* Event Bars */}
        {processedEvents.map((pe, index) => {
          const { event, adjustedPosition, deltaQuarters, row, isAbove, isManuallyAdjusted } = pe;
          const color = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default;
          
          const yOffset = isAbove 
            ? centerY - (row + 1) * rowGap - barHeight 
            : centerY + 16 + row * rowGap;

          return (
            <div 
              key={event.name}
              className="animate-fade-in"
              style={{ 
                animationDelay: `${index * 50}ms`,
                animationDuration: '300ms',
                animationFillMode: 'both'
              }}
            >
              {/* Vertical Connector */}
              <div
                className="absolute w-px transition-all duration-300"
                style={{
                  left: `${adjustedPosition}%`,
                  top: isAbove ? yOffset + barHeight : centerY,
                  height: isAbove ? centerY - yOffset - barHeight : yOffset - centerY,
                  backgroundColor: color,
                  opacity: 0.4
                }}
              />
              
              {/* Bar */}
              <div
                className="absolute rounded-sm transition-all duration-300 ease-out"
                style={{
                  left: `${adjustedPosition - 2}%`,
                  width: '4%',
                  height: barHeight,
                  top: yOffset,
                  backgroundColor: color,
                  opacity: 0.85,
                }}
              >
                {/* Delta Badge */}
                {deltaQuarters !== 0 && (
                  <Badge 
                    variant="outline"
                    className={cn(
                      "absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] px-1 py-0 flex items-center gap-0.5 whitespace-nowrap",
                      deltaQuarters > 0 
                        ? "border-destructive/50 text-destructive bg-destructive/10" 
                        : "border-green-500/50 text-green-500 bg-green-500/10"
                    )}
                  >
                    {deltaQuarters > 0 ? (
                      <ArrowRight className="h-2 w-2" />
                    ) : (
                      <ArrowLeft className="h-2 w-2" />
                    )}
                    {deltaQuarters > 0 ? '+' : ''}{deltaQuarters}Q
                  </Badge>
                )}
              </div>

              {/* Label */}
              <div
                className="absolute text-[8px] md:text-[10px] font-medium transition-opacity pointer-events-none text-center opacity-60"
                style={{
                  left: `${adjustedPosition}%`,
                  top: isAbove ? yOffset - 18 : yOffset + barHeight + 6,
                  transform: 'translateX(-50%)',
                  maxWidth: 100,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: 'hsl(var(--foreground))'
                }}
              >
                {event.name.length > 18 ? event.name.slice(0, 16) + '…' : event.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}