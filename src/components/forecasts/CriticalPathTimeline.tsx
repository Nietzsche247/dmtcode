import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { 
  type ForecastEvent, 
  type DependencyRule,
  CATEGORY_COLORS, 
  quarterToNumber 
} from "@/lib/forecasts-api";
import { type CascadeState, formatDelta } from "@/hooks/useCascadeEngine";
import { cn } from "@/lib/utils";
import { GripHorizontal, ChevronRight, ChevronLeft, Zap, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { type ConfidenceTier } from "./ConfidenceTierFilters";

interface CriticalPathTimelineProps {
  events: ForecastEvent[];
  dependencyRules: DependencyRule[];
  confidenceTier: ConfidenceTier;
  onEventClick: (event: ForecastEvent) => void;
  onEventDrag?: (eventName: string, newQuarter: string, newYear: number) => void;
  adjustedEvents?: Map<string, { quarter: string; year: number; deltaQuarters?: number }>;
  affectedEvents?: Set<string>;
  cascadeState?: CascadeState;
}

// Critical path spine events (always visible)
const SPINE_EVENT_NAMES = [
  "AI Achieves Human-Level Novel Reasoning",
  "AGI / Human-Level General Intelligence",
  "Recursive Learning Algorithms Discovered",
  "Artificial Superintelligence Emerges",
  "First 1M Humanoid Robots Delivered",
  "ASI Controls Global Infrastructure"
];

// Timeline configuration
const TIMELINE_START_YEAR = 2026;
const TIMELINE_END_YEAR = 2033;
const TOTAL_QUARTERS = (TIMELINE_END_YEAR - TIMELINE_START_YEAR + 1) * 4;
const SPINE_BAR_HEIGHT = 48;
const SECONDARY_BAR_HEIGHT = 32;
const ROW_GAP = 12;

const QUARTER_OPTIONS = (() => {
  const options: { quarter: string; year: number; label: string }[] = [];
  for (let year = TIMELINE_START_YEAR; year <= TIMELINE_END_YEAR; year++) {
    for (let q = 1; q <= 4; q++) {
      options.push({ quarter: `Q${q}`, year, label: `Q${q} ${year}` });
    }
  }
  return options;
})();

const getCategoryColor = (category: string, type: string): string => {
  if (type === 'negative') return '#C41E3A';
  if (type === 'foundation') return '#F59E0B';
  return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#22C55E';
};

export function CriticalPathTimeline({
  events,
  dependencyRules,
  confidenceTier,
  onEventClick,
  onEventDrag,
  adjustedEvents,
  affectedEvents,
  cascadeState
}: CriticalPathTimelineProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const barContainerRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [dragEvent, setDragEvent] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragCurrentX, setDragCurrentX] = useState<number>(0);
  const [dragQuarterIndex, setDragQuarterIndex] = useState<number>(0);

  // Filter and categorize events
  const { spineEvents, secondaryEvents } = useMemo(() => {
    const spine = events.filter(e => SPINE_EVENT_NAMES.includes(e.name));
    
    let secondary: ForecastEvent[] = [];
    
    if (confidenceTier === 'all') {
      secondary = events.filter(e => !SPINE_EVENT_NAMES.includes(e.name));
    } else if (confidenceTier === 'medium') {
      secondary = events.filter(e => 
        !SPINE_EVENT_NAMES.includes(e.name) && 
        e.distributions.some(d => d.probability >= 0.6)
      );
    } else if (confidenceTier === 'speculative') {
      secondary = events.filter(e => 
        !SPINE_EVENT_NAMES.includes(e.name) && 
        e.distributions.some(d => d.probability < 0.6)
      );
    }
    // 'high' tier shows only spine events
    
    return { spineEvents: spine, secondaryEvents: secondary };
  }, [events, confidenceTier]);

  // Sort events chronologically
  const sortedSpineEvents = useMemo(() => {
    return [...spineEvents].sort((a, b) => {
      const adjustedA = adjustedEvents?.get(a.name);
      const adjustedB = adjustedEvents?.get(b.name);
      const yearA = adjustedA?.year || a.medianYear;
      const yearB = adjustedB?.year || b.medianYear;
      const qA = quarterToNumber(adjustedA?.quarter || a.medianQuarter);
      const qB = quarterToNumber(adjustedB?.quarter || b.medianQuarter);
      if (yearA !== yearB) return yearA - yearB;
      return qA - qB;
    });
  }, [spineEvents, adjustedEvents]);

  const sortedSecondaryEvents = useMemo(() => {
    return [...secondaryEvents].sort((a, b) => {
      const adjustedA = adjustedEvents?.get(a.name);
      const adjustedB = adjustedEvents?.get(b.name);
      const yearA = adjustedA?.year || a.medianYear;
      const yearB = adjustedB?.year || b.medianYear;
      const qA = quarterToNumber(adjustedA?.quarter || a.medianQuarter);
      const qB = quarterToNumber(adjustedB?.quarter || b.medianQuarter);
      if (yearA !== yearB) return yearA - yearB;
      return qA - qB;
    });
  }, [secondaryEvents, adjustedEvents]);

  // Quarter/position helpers
  const getQuarterIndex = useCallback((quarter: string, year: number): number => {
    const q = quarterToNumber(quarter);
    return (year - TIMELINE_START_YEAR) * 4 + (q - 1);
  }, []);

  const getBarPosition = useCallback((year: number, quarter: string): number => {
    const quarterIndex = getQuarterIndex(quarter, year);
    return Math.max(0, Math.min((quarterIndex / TOTAL_QUARTERS) * 100, 100));
  }, [getQuarterIndex]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, eventName: string, quarter: string, year: number) => {
    if (!onEventDrag) return;
    e.preventDefault();
    setDragEvent(eventName);
    setDragStartX(e.clientX);
    setDragCurrentX(e.clientX);
    setDragQuarterIndex(getQuarterIndex(quarter, year));
  }, [onEventDrag, getQuarterIndex]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragEvent) return;
    setDragCurrentX(e.clientX);
  }, [dragEvent]);

  const handleMouseUp = useCallback(() => {
    if (!dragEvent || !onEventDrag || !barContainerRef.current) {
      setDragEvent(null);
      return;
    }

    const containerWidth = barContainerRef.current.getBoundingClientRect().width;
    const pixelsPerQuarter = containerWidth / TOTAL_QUARTERS;
    const deltaX = dragCurrentX - dragStartX;
    const quarterChange = Math.round(deltaX / pixelsPerQuarter);
    
    if (quarterChange !== 0) {
      const newIndex = Math.max(0, Math.min(dragQuarterIndex + quarterChange, QUARTER_OPTIONS.length - 1));
      const newOption = QUARTER_OPTIONS[newIndex];
      onEventDrag(dragEvent, newOption.quarter, newOption.year);
    }

    setDragEvent(null);
  }, [dragEvent, dragStartX, dragCurrentX, dragQuarterIndex, onEventDrag]);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent, eventName: string, quarter: string, year: number) => {
    if (!onEventDrag) return;
    const touch = e.touches[0];
    setDragEvent(eventName);
    setDragStartX(touch.clientX);
    setDragCurrentX(touch.clientX);
    setDragQuarterIndex(getQuarterIndex(quarter, year));
  }, [onEventDrag, getQuarterIndex]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragEvent) return;
    const touch = e.touches[0];
    setDragCurrentX(touch.clientX);
  }, [dragEvent]);

  const handleTouchEnd = useCallback(() => {
    if (!dragEvent || !onEventDrag || !barContainerRef.current) {
      setDragEvent(null);
      return;
    }

    const containerWidth = barContainerRef.current.getBoundingClientRect().width;
    const pixelsPerQuarter = containerWidth / TOTAL_QUARTERS;
    const deltaX = dragCurrentX - dragStartX;
    const quarterChange = Math.round(deltaX / pixelsPerQuarter);
    
    if (quarterChange !== 0) {
      const newIndex = Math.max(0, Math.min(dragQuarterIndex + quarterChange, QUARTER_OPTIONS.length - 1));
      const newOption = QUARTER_OPTIONS[newIndex];
      onEventDrag(dragEvent, newOption.quarter, newOption.year);
    }

    setDragEvent(null);
  }, [dragEvent, dragStartX, dragCurrentX, dragQuarterIndex, onEventDrag]);

  // Global mouse listeners
  useEffect(() => {
    if (dragEvent) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragEvent, handleMouseMove, handleMouseUp]);

  // Year markers
  const yearMarkers = useMemo(() => {
    const markers = [];
    for (let year = TIMELINE_START_YEAR; year <= TIMELINE_END_YEAR; year++) {
      const quarterIndex = (year - TIMELINE_START_YEAR) * 4;
      const position = (quarterIndex / TOTAL_QUARTERS) * 100;
      markers.push({ year, position });
    }
    return markers;
  }, []);

  // Drag preview
  const getDragPreview = useCallback(() => {
    if (!dragEvent || !barContainerRef.current) return null;
    const containerWidth = barContainerRef.current.getBoundingClientRect().width;
    const pixelsPerQuarter = containerWidth / TOTAL_QUARTERS;
    const deltaX = dragCurrentX - dragStartX;
    const quarterChange = Math.round(deltaX / pixelsPerQuarter);
    const newIndex = Math.max(0, Math.min(dragQuarterIndex + quarterChange, QUARTER_OPTIONS.length - 1));
    return {
      ...QUARTER_OPTIONS[newIndex],
      quarterChange,
      isDragging: Math.abs(deltaX) > 10
    };
  }, [dragEvent, dragStartX, dragCurrentX, dragQuarterIndex]);

  const dragPreview = getDragPreview();
  const affectedCount = affectedEvents?.size || 0;

  const renderEventRow = (event: ForecastEvent, isSpine: boolean) => {
    const adjusted = adjustedEvents?.get(event.name);
    const currentQuarter = adjusted?.quarter || event.medianQuarter;
    const currentYear = adjusted?.year || event.medianYear;
    const deltaQuarters = adjusted?.deltaQuarters || 0;
    const hasShifted = deltaQuarters !== 0;
    const isAffected = affectedEvents?.has(event.name);
    const isCalculating = cascadeState?.isCalculating && isAffected;
    const color = getCategoryColor(event.category, event.type);
    const isDragging = dragEvent === event.name;
    const barHeight = isSpine ? SPINE_BAR_HEIGHT : SECONDARY_BAR_HEIGHT;

    const peakDist = event.distributions.reduce(
      (max, d) => (d.probability > max.probability ? d : max),
      event.distributions[0]
    );

    return (
      <div
        key={event.name}
        className={cn(
          "group transition-all duration-300",
          isAffected && "bg-primary/5 rounded-lg",
          isCalculating && "animate-pulse",
          isDragging && "bg-primary/10 rounded-lg",
          !isSpine && "ml-4 md:ml-8 opacity-80"
        )}
        style={{ marginBottom: ROW_GAP }}
      >
        {/* Event label and bar container */}
        <div className="flex items-center gap-3">
          {/* Event name */}
          <div 
            className={cn(
              "shrink-0 cursor-pointer hover:text-primary transition-colors",
              isSpine ? "w-[180px] md:w-[260px]" : "w-[160px] md:w-[220px]"
            )}
            onClick={() => onEventClick(event)}
          >
            <div className="flex items-center gap-2">
              <div 
                className={cn(
                  "rounded-full shrink-0",
                  isSpine ? "w-3 h-3" : "w-2 h-2"
                )}
                style={{ backgroundColor: color }}
              />
              <span className={cn(
                "font-medium truncate",
                isSpine ? "text-sm md:text-base text-foreground" : "text-xs md:text-sm text-muted-foreground"
              )}>
                {event.name}
              </span>
            </div>
          </div>

          {/* Probability bar */}
          <div 
            ref={event.name === sortedSpineEvents[0]?.name ? barContainerRef : undefined}
            className={cn(
              "relative flex-1 rounded-full overflow-hidden bg-muted/20",
              isSpine && onEventDrag && "cursor-grab active:cursor-grabbing"
            )}
            style={{ height: barHeight }}
            onMouseDown={isSpine ? (e) => handleMouseDown(e, event.name, currentQuarter, currentYear) : undefined}
            onTouchStart={isSpine ? (e) => handleTouchStart(e, event.name, currentQuarter, currentYear) : undefined}
            onTouchMove={isSpine ? handleTouchMove : undefined}
            onTouchEnd={isSpine ? handleTouchEnd : undefined}
          >
            {/* Year grid lines */}
            {yearMarkers.map(({ year, position }) => (
              <div
                key={year}
                className="absolute top-0 bottom-0 w-px bg-border/20"
                style={{ left: `${position}%` }}
              />
            ))}

            {/* Gradient bar */}
            {(() => {
              const validDists = event.distributions.filter(d => d.probability > 0);
              if (validDists.length === 0) return null;

              const minPos = Math.min(...validDists.map(d => getBarPosition(d.year, d.quarter)));
              const maxPos = Math.max(...validDists.map(d => getBarPosition(d.year, d.quarter)));
              const width = Math.max(maxPos - minPos + (100 / TOTAL_QUARTERS), 100 / TOTAL_QUARTERS);
              const peakPos = getBarPosition(peakDist.year, peakDist.quarter);
              const peakRelative = width > 0 ? ((peakPos - minPos) / width) * 100 : 50;

              return (
                <div
                  className="absolute top-1 bottom-1 rounded-full transition-all duration-300"
                  style={{
                    left: `${minPos}%`,
                    width: `${width}%`,
                    background: `linear-gradient(90deg, 
                      ${color}15 0%, 
                      ${color}50 ${Math.max(peakRelative - 25, 0)}%, 
                      ${color} ${peakRelative}%, 
                      ${color}50 ${Math.min(peakRelative + 25, 100)}%, 
                      ${color}15 100%
                    )`,
                    boxShadow: isAffected ? `0 0 16px ${color}40` : undefined
                  }}
                />
              );
            })()}

            {/* Median marker */}
            <div
              className={cn(
                "absolute top-0 bottom-0 w-1 transition-all duration-300 rounded-full",
                hasShifted ? "bg-primary" : "bg-foreground/70"
              )}
              style={{ 
                left: `${getBarPosition(currentYear, currentQuarter)}%`,
                transform: 'translateX(-50%)',
                boxShadow: hasShifted ? '0 0 8px rgba(196, 30, 58, 0.6)' : undefined
              }}
            />

            {/* Original position ghost */}
            {hasShifted && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/30"
                style={{ 
                  left: `${getBarPosition(event.medianYear, event.medianQuarter)}%`,
                  transform: 'translateX(-50%)'
                }}
              />
            )}

            {/* Drag handle indicator for spine events */}
            {isSpine && onEventDrag && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity">
                <GripHorizontal className="h-4 w-4 text-foreground" />
              </div>
            )}
          </div>

          {/* Date badge */}
          <div className="shrink-0 flex items-center gap-2 w-[90px] md:w-[120px]">
            <Badge 
              variant="outline" 
              className={cn(
                "font-mono text-xs",
                hasShifted && "bg-primary text-primary-foreground border-primary"
              )}
            >
              {currentQuarter} {currentYear}
            </Badge>
            {hasShifted && (
              <Badge className="text-[10px] px-1.5 h-5 bg-primary">
                {formatDelta(deltaQuarters)}
              </Badge>
            )}
            {isAffected && !hasShifted && (
              <Zap className="h-4 w-4 text-primary" />
            )}
          </div>
        </div>

        {/* Dependency arrow for secondary events */}
        {!isSpine && (
          <div className="flex items-center gap-1 mt-1 ml-4 md:ml-8">
            <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground/50">depends on parent</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full">
      {/* Year axis header */}
      <div className="flex items-center border-b border-border/30 pb-3 mb-6">
        <div className={cn("shrink-0", isMobile ? "w-[180px]" : "w-[260px]")} />
        <div className="flex-1 relative h-8">
          {yearMarkers.map(({ year, position }) => (
            <div
              key={year}
              className="absolute text-xs md:text-sm font-bold text-foreground"
              style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
            >
              {year}
            </div>
          ))}
        </div>
        <div className="shrink-0 w-[90px] md:w-[120px]" />
      </div>

      {/* Critical path spine events */}
      <div className="space-y-0">
        {sortedSpineEvents.map(event => renderEventRow(event, true))}
      </div>

      {/* Secondary events with animation */}
      {sortedSecondaryEvents.length > 0 && (
        <div 
          className={cn(
            "mt-6 pt-6 border-t border-border/20 space-y-0 transition-all duration-300",
            confidenceTier === 'high' && "opacity-0 max-h-0 overflow-hidden mt-0 pt-0 border-t-0"
          )}
        >
          <p className="text-xs text-muted-foreground mb-4 pl-4">
            {confidenceTier === 'medium' && 'Secondary effects (60-80% confidence)'}
            {confidenceTier === 'speculative' && 'Speculative outcomes (<60% confidence)'}
            {confidenceTier === 'all' && 'All events in model'}
          </p>
          {sortedSecondaryEvents.map(event => renderEventRow(event, false))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-4 border-t border-border/30">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-[#C41E3A]" />
          <span className="text-muted-foreground">Risk Events</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
          <span className="text-muted-foreground">Foundation Events</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
          <span className="text-muted-foreground">Positive Outcomes</span>
        </div>
        {onEventDrag && (
          <div className="flex items-center gap-2 text-xs">
            <GripHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Drag spine events to adjust</span>
          </div>
        )}
      </div>

      {/* Affected count badge */}
      {affectedCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <Badge 
            variant="destructive" 
            className="px-4 py-2 text-sm font-semibold shadow-lg bg-primary/90 backdrop-blur-sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            {affectedCount} events affected
          </Badge>
        </div>
      )}

      {/* Drag indicator */}
      {dragEvent && dragPreview && dragPreview.isDragging && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <Badge 
            className={cn(
              "px-4 py-2 text-sm font-semibold shadow-xl",
              dragPreview.quarterChange > 0 ? "bg-green-600" : dragPreview.quarterChange < 0 ? "bg-amber-600" : "bg-muted"
            )}
          >
            <div className="flex items-center gap-2">
              {dragPreview.quarterChange > 0 ? (
                <ChevronRight className="h-4 w-4" />
              ) : dragPreview.quarterChange < 0 ? (
                <ChevronLeft className="h-4 w-4" />
              ) : null}
              <span>{dragPreview.label}</span>
              {dragPreview.quarterChange !== 0 && (
                <span className="opacity-70">
                  ({dragPreview.quarterChange > 0 ? '+' : ''}{dragPreview.quarterChange}Q)
                </span>
              )}
            </div>
          </Badge>
        </div>
      )}
    </div>
  );
}
