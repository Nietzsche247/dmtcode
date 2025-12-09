import { useMemo } from 'react';
import { useWhatIf, type ShiftedEvent } from '@/contexts/WhatIfContext';
import type { ForecastEvent } from '@/lib/forecasts-api';
import { CATEGORY_COLORS, inferCategory, quarterToNumber } from '@/lib/forecasts-api';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

interface WhatIfTimelineProps {
  events: ForecastEvent[];
}

// Timeline configuration (same as BarTimeline)
const TIMELINE_START_YEAR = 2026;
const TIMELINE_END_YEAR = 2033;
const YEARS = Array.from({ length: TIMELINE_END_YEAR - TIMELINE_START_YEAR + 1 }, (_, i) => TIMELINE_START_YEAR + i);

// Get position as percentage of timeline width
function getTimelinePosition(year: number, quarter: string): number {
  const q = quarterToNumber(quarter);
  const yearSpan = TIMELINE_END_YEAR - TIMELINE_START_YEAR;
  const yearOffset = year - TIMELINE_START_YEAR;
  const quarterOffset = (q - 1) / 4 + 0.125;
  return 5 + ((yearOffset + quarterOffset) / yearSpan) * 90;
}

// Match event by name (fuzzy)
function findEvent(name: string, events: ForecastEvent[]): ForecastEvent | undefined {
  let match = events.find(e => e.name === name);
  if (match) return match;
  
  const nameLower = name.toLowerCase();
  match = events.find(e => e.name.toLowerCase().includes(nameLower.slice(0, 20)));
  if (match) return match;
  
  match = events.find(e => nameLower.includes(e.name.toLowerCase().slice(0, 20)));
  return match;
}

interface ProcessedShiftedEvent {
  shiftedEvent: ShiftedEvent;
  event: ForecastEvent;
  originalPosition: number;
  shiftedPosition: number;
  color: string;
}

export function WhatIfTimeline({ events }: WhatIfTimelineProps) {
  const { shiftedEvents, hasRun, clearScenario } = useWhatIf();
  const isMobile = useIsMobile();

  // Process shifted events
  const processedEvents = useMemo((): ProcessedShiftedEvent[] => {
    return shiftedEvents
      .map(se => {
        const event = findEvent(se.event_name, events);
        if (!event) return null;

        const originalPosition = getTimelinePosition(se.original_year, se.original_quarter);
        const shiftedPosition = getTimelinePosition(se.shifted_year, se.shifted_quarter);
        const color = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default;

        return {
          shiftedEvent: se,
          event,
          originalPosition,
          shiftedPosition,
          color
        };
      })
      .filter((e): e is ProcessedShiftedEvent => e !== null);
  }, [shiftedEvents, events]);

  // Don't render if no scenario has run
  if (!hasRun || shiftedEvents.length === 0) {
    return null;
  }

  const timelineHeight = isMobile ? 280 : 350;
  const barHeight = isMobile ? 18 : 24;
  const centerY = timelineHeight / 2;

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 
              className="text-xl md:text-2xl font-black text-primary"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              SCENARIO RESULT
            </h2>
            <span className="text-sm text-muted-foreground">
              {processedEvents.length} events affected
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearScenario}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear Scenario
          </Button>
        </div>

        {/* Timeline Container */}
        <div 
          className="relative bg-card/30 border border-primary/30 rounded-xl p-4 md:p-6 overflow-hidden"
          style={{ opacity: 0.85 }}
        >
          <div className="relative w-full overflow-x-auto" style={{ height: timelineHeight }}>
            <div className="relative" style={{ height: timelineHeight, minWidth: isMobile ? 900 : '100%' }}>
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
                      <span className="mt-2 text-[10px] md:text-xs font-semibold text-muted-foreground/70">
                        {year}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Shifted Event Bars */}
              {processedEvents.map((pe, index) => {
                const { shiftedEvent, event, shiftedPosition, color } = pe;
                const yOffset = centerY - barHeight / 2 + (index % 5 - 2) * (barHeight + 8);

                return (
                  <div 
                    key={shiftedEvent.event_name}
                    className="animate-fade-in"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: 'both'
                    }}
                  >
                    {/* Bar */}
                    <div
                      className="absolute rounded-sm transition-all duration-300 ease-out"
                      style={{
                        left: `${shiftedPosition - 1.5}%`,
                        width: '3%',
                        height: barHeight,
                        top: yOffset,
                        background: `linear-gradient(90deg, ${color}40 0%, ${color}90 50%, ${color}40 100%)`,
                        boxShadow: `0 2px 8px ${color}40`,
                      }}
                    >
                      {/* Median marker */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-white/50" style={{ left: '50%' }} />
                    </div>

                    {/* Delta Badge */}
                    <div
                      className={cn(
                        "absolute flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap",
                        shiftedEvent.shift_direction === 'delay' 
                          ? "bg-destructive/20 text-destructive" 
                          : "bg-green-500/20 text-green-500"
                      )}
                      style={{
                        left: `${shiftedPosition + 1.5}%`,
                        top: yOffset - 4,
                      }}
                    >
                      {shiftedEvent.shift_direction === 'delay' ? (
                        <ArrowRight className="h-3 w-3" />
                      ) : (
                        <ArrowLeft className="h-3 w-3" />
                      )}
                      {shiftedEvent.delta_quarters > 0 ? '+' : ''}{shiftedEvent.delta_quarters}Q
                    </div>

                    {/* Label */}
                    <div
                      className="absolute text-[9px] md:text-[10px] font-medium text-muted-foreground whitespace-nowrap"
                      style={{
                        left: `${shiftedPosition - 1.5}%`,
                        top: yOffset + barHeight + 4,
                        maxWidth: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {event.name.length > 20 ? event.name.slice(0, 18) + '…' : event.name}
                    </div>
                  </div>
                );
              })}

              {/* Connector Lines to Main Timeline (desktop only) */}
              {!isMobile && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                  {processedEvents.map((pe, index) => {
                    const { shiftedEvent, originalPosition, shiftedPosition } = pe;
                    const yOffset = centerY - barHeight / 2 + (index % 5 - 2) * (barHeight + 8);
                    
                    return (
                      <line
                        key={`connector-${shiftedEvent.event_name}`}
                        x1={`${originalPosition}%`}
                        y1={-20} // Points up to main timeline
                        x2={`${shiftedPosition}%`}
                        y2={yOffset + barHeight / 2}
                        stroke="hsl(var(--primary))"
                        strokeWidth={1}
                        strokeDasharray="4,4"
                        opacity={0.4}
                        className="animate-fade-in"
                        style={{ 
                          animationDelay: `${index * 50 + 200}ms`,
                          animationFillMode: 'both'
                        }}
                      />
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-border/30 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Delayed: </span>
              <span className="font-semibold text-destructive">
                {shiftedEvents.filter(e => e.shift_direction === 'delay').length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Accelerated: </span>
              <span className="font-semibold text-green-500">
                {shiftedEvents.filter(e => e.shift_direction === 'acceleration').length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Max shift: </span>
              <span className="font-semibold text-foreground">
                {Math.max(...shiftedEvents.map(e => Math.abs(e.delta_quarters)))}Q
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
