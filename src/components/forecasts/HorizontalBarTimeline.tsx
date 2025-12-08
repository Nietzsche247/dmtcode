import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { 
  type ForecastEvent, 
  type DependencyRule,
  CATEGORY_COLORS, 
  quarterToNumber 
} from "@/lib/forecasts-api";
import { type CascadeState, formatDelta } from "@/hooks/useCascadeEngine";
import { cn } from "@/lib/utils";
import { GripVertical, ChevronRight, ChevronUp, ChevronDown, GripHorizontal, Zap, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface HorizontalBarTimelineProps {
  events: ForecastEvent[];
  dependencyRules: DependencyRule[];
  showSecondaryEvents: boolean;
  onEventClick: (event: ForecastEvent) => void;
  onEventDrag?: (eventName: string, newQuarter: string, newYear: number) => void;
  adjustedEvents?: Map<string, { quarter: string; year: number; deltaQuarters?: number }>;
  affectedEvents?: Set<string>;
  cascadeState?: CascadeState;
}

// Timeline configuration
const TIMELINE_START_YEAR = 2026;
const TIMELINE_END_YEAR = 2030;
const TOTAL_QUARTERS = (TIMELINE_END_YEAR - TIMELINE_START_YEAR + 1) * 4;
const BAR_HEIGHT = 32;
const ROW_GAP = 16;
const LABEL_WIDTH = 220;
const DATE_WIDTH = 100;
const QUARTER_OPTIONS = (() => {
  const options: { quarter: string; year: number; label: string }[] = [];
  for (let year = TIMELINE_START_YEAR; year <= TIMELINE_END_YEAR; year++) {
    for (let q = 1; q <= 4; q++) {
      options.push({ quarter: `Q${q}`, year, label: `Q${q} ${year}` });
    }
  }
  return options;
})();

// Get category color for gradient
const getCategoryColor = (category: string, type: string): string => {
  if (type === 'negative') return '#C41E3A'; // red for risks
  if (type === 'foundation') return '#F59E0B'; // gold for foundation
  return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#22C55E'; // green for positive
};

export function HorizontalBarTimeline({
  events,
  showSecondaryEvents,
  onEventClick,
  onEventDrag,
  adjustedEvents,
  affectedEvents,
  cascadeState
}: HorizontalBarTimelineProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mobile drag state
  const [mobileDragEvent, setMobileDragEvent] = useState<string | null>(null);
  const [mobileDragStartY, setMobileDragStartY] = useState<number>(0);
  const [mobileDragCurrentY, setMobileDragCurrentY] = useState<number>(0);
  const [mobileQuarterIndex, setMobileQuarterIndex] = useState<number>(0);
  const MOBILE_DRAG_THRESHOLD = 30;

  // Desktop drag state
  const [desktopDragEvent, setDesktopDragEvent] = useState<string | null>(null);
  const [desktopDragStartX, setDesktopDragStartX] = useState<number>(0);
  const [desktopDragCurrentX, setDesktopDragCurrentX] = useState<number>(0);
  const [desktopQuarterIndex, setDesktopQuarterIndex] = useState<number>(0);
  const barContainerRef = useRef<HTMLDivElement>(null);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (showSecondaryEvents) return events;
    return events.filter(e => e.isPrimary);
  }, [events, showSecondaryEvents]);

  // Sort events chronologically
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const adjustedA = adjustedEvents?.get(a.name);
      const adjustedB = adjustedEvents?.get(b.name);
      const yearA = adjustedA?.year || a.medianYear;
      const yearB = adjustedB?.year || b.medianYear;
      const qA = quarterToNumber(adjustedA?.quarter || a.medianQuarter);
      const qB = quarterToNumber(adjustedB?.quarter || b.medianQuarter);
      
      if (yearA !== yearB) return yearA - yearB;
      return qA - qB;
    });
  }, [filteredEvents, adjustedEvents]);

  // Get quarter index from quarter/year
  const getQuarterIndex = useCallback((quarter: string, year: number): number => {
    const q = quarterToNumber(quarter);
    return (year - TIMELINE_START_YEAR) * 4 + (q - 1);
  }, []);

  // Get bar position percentage for a distribution
  const getBarPosition = useCallback((year: number, quarter: string): number => {
    const quarterIndex = getQuarterIndex(quarter, year);
    return (quarterIndex / TOTAL_QUARTERS) * 100;
  }, [getQuarterIndex]);

  // Mobile touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, eventName: string, quarter: string, year: number) => {
    if (!onEventDrag) return;
    const touch = e.touches[0];
    setMobileDragEvent(eventName);
    setMobileDragStartY(touch.clientY);
    setMobileDragCurrentY(touch.clientY);
    setMobileQuarterIndex(getQuarterIndex(quarter, year));
  }, [onEventDrag, getQuarterIndex]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!mobileDragEvent) return;
    const touch = e.touches[0];
    setMobileDragCurrentY(touch.clientY);
  }, [mobileDragEvent]);

  const handleTouchEnd = useCallback(() => {
    if (!mobileDragEvent || !onEventDrag) {
      setMobileDragEvent(null);
      return;
    }

    const deltaY = mobileDragStartY - mobileDragCurrentY;
    const quarterChange = Math.round(deltaY / MOBILE_DRAG_THRESHOLD);
    
    if (quarterChange !== 0) {
      const newIndex = Math.max(0, Math.min(mobileQuarterIndex + quarterChange, QUARTER_OPTIONS.length - 1));
      const newOption = QUARTER_OPTIONS[newIndex];
      onEventDrag(mobileDragEvent, newOption.quarter, newOption.year);
    }

    setMobileDragEvent(null);
  }, [mobileDragEvent, mobileDragStartY, mobileDragCurrentY, mobileQuarterIndex, onEventDrag]);

  // Get mobile drag preview
  const getMobileDragPreview = useCallback(() => {
    if (!mobileDragEvent) return null;
    
    const deltaY = mobileDragStartY - mobileDragCurrentY;
    const quarterChange = Math.round(deltaY / MOBILE_DRAG_THRESHOLD);
    const newIndex = Math.max(0, Math.min(mobileQuarterIndex + quarterChange, QUARTER_OPTIONS.length - 1));
    
    return {
      ...QUARTER_OPTIONS[newIndex],
      quarterChange,
      isDragging: Math.abs(deltaY) > 10
    };
  }, [mobileDragEvent, mobileDragStartY, mobileDragCurrentY, mobileQuarterIndex]);

  // Desktop mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, eventName: string, quarter: string, year: number) => {
    if (!onEventDrag || isMobile) return;
    e.preventDefault();
    setDesktopDragEvent(eventName);
    setDesktopDragStartX(e.clientX);
    setDesktopDragCurrentX(e.clientX);
    setDesktopQuarterIndex(getQuarterIndex(quarter, year));
  }, [onEventDrag, isMobile, getQuarterIndex]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!desktopDragEvent) return;
    setDesktopDragCurrentX(e.clientX);
  }, [desktopDragEvent]);

  const handleMouseUp = useCallback(() => {
    if (!desktopDragEvent || !onEventDrag || !barContainerRef.current) {
      setDesktopDragEvent(null);
      return;
    }

    const containerWidth = barContainerRef.current.getBoundingClientRect().width;
    const pixelsPerQuarter = containerWidth / TOTAL_QUARTERS;
    const deltaX = desktopDragCurrentX - desktopDragStartX;
    const quarterChange = Math.round(deltaX / pixelsPerQuarter);
    
    if (quarterChange !== 0) {
      const newIndex = Math.max(0, Math.min(desktopQuarterIndex + quarterChange, QUARTER_OPTIONS.length - 1));
      const newOption = QUARTER_OPTIONS[newIndex];
      onEventDrag(desktopDragEvent, newOption.quarter, newOption.year);
    }

    setDesktopDragEvent(null);
  }, [desktopDragEvent, desktopDragStartX, desktopDragCurrentX, desktopQuarterIndex, onEventDrag]);

  // Get desktop drag preview
  const getDesktopDragPreview = useCallback(() => {
    if (!desktopDragEvent || !barContainerRef.current) return null;
    
    const containerWidth = barContainerRef.current.getBoundingClientRect().width;
    const pixelsPerQuarter = containerWidth / TOTAL_QUARTERS;
    const deltaX = desktopDragCurrentX - desktopDragStartX;
    const quarterChange = Math.round(deltaX / pixelsPerQuarter);
    const newIndex = Math.max(0, Math.min(desktopQuarterIndex + quarterChange, QUARTER_OPTIONS.length - 1));
    
    return {
      ...QUARTER_OPTIONS[newIndex],
      quarterChange,
      isDragging: Math.abs(deltaX) > 10
    };
  }, [desktopDragEvent, desktopDragStartX, desktopDragCurrentX, desktopQuarterIndex]);

  // Add global mouse event listeners for desktop drag
  useEffect(() => {
    if (desktopDragEvent) {
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
  }, [desktopDragEvent, handleMouseMove, handleMouseUp]);

  // Generate year markers
  const yearMarkers = useMemo(() => {
    const markers = [];
    for (let year = TIMELINE_START_YEAR; year <= TIMELINE_END_YEAR; year++) {
      const quarterIndex = (year - TIMELINE_START_YEAR) * 4;
      const position = (quarterIndex / TOTAL_QUARTERS) * 100;
      markers.push({ year, position });
    }
    return markers;
  }, []);

  const affectedCount = affectedEvents?.size || 0;
  const dragPreview = getMobileDragPreview();
  const desktopPreview = getDesktopDragPreview();

  return (
    <div ref={containerRef} className="w-full">
      {/* Year axis header */}
      <div 
        className="flex items-center border-b border-border/30 pb-3 mb-4"
        style={{ paddingLeft: isMobile ? 0 : LABEL_WIDTH, paddingRight: isMobile ? 0 : DATE_WIDTH }}
      >
        <div className="flex-1 relative h-8">
          {yearMarkers.map(({ year, position }) => (
            <div
              key={year}
              className="absolute text-sm font-bold text-foreground"
              style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
            >
              {year}
            </div>
          ))}
        </div>
      </div>

      {/* Event rows */}
      <div className="space-y-0" style={{ gap: ROW_GAP }}>
        {sortedEvents.map((event) => {
          const adjusted = adjustedEvents?.get(event.name);
          const currentQuarter = adjusted?.quarter || event.medianQuarter;
          const currentYear = adjusted?.year || event.medianYear;
          const deltaQuarters = adjusted?.deltaQuarters || 0;
          const hasShifted = deltaQuarters !== 0;
          const isAffected = affectedEvents?.has(event.name);
          const isCalculating = cascadeState?.isCalculating && isAffected;
          const isPrimary = event.isPrimary;
          const color = getCategoryColor(event.category, event.type);
          const isDragging = mobileDragEvent === event.name || desktopDragEvent === event.name;

          // Find peak probability quarter
          const peakDist = event.distributions.reduce(
            (max, d) => (d.probability > max.probability ? d : max),
            event.distributions[0]
          );

          return (
            <div
              key={event.name}
              className={cn(
                "flex items-center gap-3 py-2 rounded-lg transition-all duration-200",
                isAffected && "bg-primary/5",
                isCalculating && "animate-pulse",
                isDragging && "bg-primary/10"
              )}
              style={{ marginBottom: ROW_GAP }}
              onTouchStart={(e) => isPrimary && onEventDrag && handleTouchStart(e, event.name, currentQuarter, currentYear)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Event name (left-aligned) */}
              {!isMobile && (
                <div 
                  className="flex items-center gap-2 shrink-0 cursor-pointer hover:text-primary transition-colors"
                  style={{ width: LABEL_WIDTH }}
                  onClick={() => onEventClick(event)}
                >
                  <div 
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className={cn(
                    "text-sm font-medium truncate",
                    isPrimary ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {event.name}
                  </span>
                  {!isPrimary && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0">
                      COND
                    </Badge>
                  )}
                  {isPrimary && onEventDrag && (
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  )}
                </div>
              )}

              {/* Mobile: Stacked layout */}
              {isMobile && (
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => !isDragging && onEventClick(event)}
                  style={{ touchAction: isPrimary && onEventDrag ? 'none' : 'auto' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className={cn(
                        "text-sm font-medium",
                        isPrimary ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {event.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
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
                      {isPrimary && onEventDrag && (
                        <div className="flex flex-col items-center opacity-40">
                          <ChevronUp className="h-3 w-3" />
                          <GripHorizontal className="h-3 w-3" />
                          <ChevronDown className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Probability distribution bar */}
              <div 
                ref={event === sortedEvents[0] ? barContainerRef : undefined}
                className={cn(
                  "relative rounded-full overflow-hidden bg-muted/30",
                  isMobile ? "w-full" : "flex-1",
                  isPrimary && onEventDrag && !isMobile && "cursor-grab active:cursor-grabbing"
                )}
                style={{ height: BAR_HEIGHT }}
                onMouseDown={(e) => isPrimary && handleMouseDown(e, event.name, currentQuarter, currentYear)}
              >
                {/* Background grid lines for years */}
                {yearMarkers.map(({ year, position }) => (
                  <div
                    key={year}
                    className="absolute top-0 bottom-0 w-px bg-border/20"
                    style={{ left: `${position}%` }}
                  />
                ))}

                {/* Gradient bar showing probability distribution */}
                {(() => {
                  // Get min and max quarters from distributions
                  const validDists = event.distributions.filter(d => d.probability > 0);
                  if (validDists.length === 0) return null;

                  const minPos = Math.min(...validDists.map(d => getBarPosition(d.year, d.quarter)));
                  const maxPos = Math.max(...validDists.map(d => getBarPosition(d.year, d.quarter)));
                  const width = Math.max(maxPos - minPos + (100 / TOTAL_QUARTERS), 100 / TOTAL_QUARTERS);
                  const peakPos = getBarPosition(peakDist.year, peakDist.quarter);
                  const peakRelative = ((peakPos - minPos) / width) * 100;

                  return (
                    <div
                      className="absolute top-1 bottom-1 rounded-full transition-all duration-300"
                      style={{
                        left: `${minPos}%`,
                        width: `${width}%`,
                        background: `linear-gradient(90deg, 
                          ${color}20 0%, 
                          ${color}60 ${Math.max(peakRelative - 20, 0)}%, 
                          ${color} ${peakRelative}%, 
                          ${color}60 ${Math.min(peakRelative + 20, 100)}%, 
                          ${color}20 100%
                        )`,
                        boxShadow: isAffected ? `0 0 12px ${color}40` : undefined
                      }}
                    />
                  );
                })()}

                {/* Median marker */}
                <div
                  className={cn(
                    "absolute top-0 bottom-0 w-0.5 transition-all duration-300",
                    hasShifted ? "bg-primary" : "bg-foreground/60"
                  )}
                  style={{ 
                    left: `${getBarPosition(currentYear, currentQuarter)}%`,
                    boxShadow: hasShifted ? '0 0 8px rgba(196, 30, 58, 0.5)' : undefined
                  }}
                />

                {/* Original position ghost if shifted */}
                {hasShifted && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/30"
                    style={{ 
                      left: `${getBarPosition(event.medianYear, event.medianQuarter)}%`,
                      borderStyle: 'dashed'
                    }}
                  />
                )}
              </div>

              {/* Date badge (right-aligned) - desktop only */}
              {!isMobile && (
                <div 
                  className="flex items-center gap-2 shrink-0"
                  style={{ width: DATE_WIDTH }}
                >
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
                  {isAffected && (
                    <Zap className="h-4 w-4 text-primary" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-border/30">
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
        <div className="flex items-center gap-2 text-xs">
          <div className="w-6 h-3 rounded-full bg-gradient-to-r from-muted/30 via-primary to-muted/30" />
          <span className="text-muted-foreground">Probability Gradient</span>
        </div>
        {onEventDrag && (
          <div className="flex items-center gap-2 text-xs">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Drag to Adjust</span>
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

      {/* Mobile drag indicator */}
      {mobileDragEvent && dragPreview && dragPreview.isDragging && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <Badge 
            className={cn(
              "px-4 py-2 text-sm font-semibold shadow-xl",
              dragPreview.quarterChange > 0 ? "bg-green-600" : dragPreview.quarterChange < 0 ? "bg-amber-600" : "bg-muted"
            )}
          >
            <div className="flex items-center gap-2">
              {dragPreview.quarterChange > 0 ? (
                <ChevronUp className="h-4 w-4" />
              ) : dragPreview.quarterChange < 0 ? (
                <ChevronDown className="h-4 w-4" />
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

      {/* Desktop drag indicator */}
      {desktopDragEvent && desktopPreview && desktopPreview.isDragging && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <Badge 
            className={cn(
              "px-4 py-2 text-sm font-semibold shadow-xl",
              desktopPreview.quarterChange > 0 ? "bg-green-600" : desktopPreview.quarterChange < 0 ? "bg-amber-600" : "bg-muted"
            )}
          >
            <div className="flex items-center gap-2">
              {desktopPreview.quarterChange > 0 ? (
                <ChevronRight className="h-4 w-4" />
              ) : desktopPreview.quarterChange < 0 ? (
                <ChevronRight className="h-4 w-4 rotate-180" />
              ) : null}
              <span>{desktopPreview.label}</span>
              {desktopPreview.quarterChange !== 0 && (
                <span className="opacity-70">
                  ({desktopPreview.quarterChange > 0 ? '+' : ''}{desktopPreview.quarterChange}Q)
                </span>
              )}
            </div>
          </Badge>
        </div>
      )}
    </div>
  );
}