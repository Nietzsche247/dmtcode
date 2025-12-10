import { useMemo, useState, useRef, useCallback } from "react";
import type { ForecastEvent, DependencyRule } from "@/lib/forecasts-api";
import { CATEGORY_COLORS, quarterToNumber } from "@/lib/forecasts-api";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clampProbability, parseConditionalProbability, formatDependencyHover, formatConditionalLabel } from "@/lib/probability-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
interface BarTimelineProps {
  events: ForecastEvent[];
  dependencyRules: DependencyRule[];
  onEventClick: (event: ForecastEvent) => void;
}

// Timeline configuration
const TIMELINE_START_YEAR = 2026;
const TIMELINE_END_YEAR = 2033;
const YEARS = Array.from({ length: TIMELINE_END_YEAR - TIMELINE_START_YEAR + 1 }, (_, i) => TIMELINE_START_YEAR + i);

// Zoom configuration
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

// Primary events to show as bars
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

// Build secondary events map dynamically from dependency rules with conditional probability
interface SecondaryEventData {
  target: string;
  conditionalProbability: number | null;
  shiftRatio: number;
  confidenceFloor: number | null;
  confidenceCeiling: number | null;
  notes: string | null;
}

function buildSecondaryEventsMap(dependencyRules: DependencyRule[]): Record<string, SecondaryEventData[]> {
  const map: Record<string, SecondaryEventData[]> = {};
  console.log('[BarTimeline] Building secondary events map from', dependencyRules?.length || 0, 'dependency rules');
  
  dependencyRules?.forEach(rule => {
    const source = rule.source_event;
    const target = rule.target_event;
    if (source && target) {
      if (!map[source]) {
        map[source] = [];
      }
      // Check if target already exists
      const exists = map[source].some(s => s.target === target);
      if (!exists) {
        const notes = rule.notes || rule.description || null;
        
        // Prefer conditional_probability column when available, fall back to parsing from notes
        const conditionalProbability = 
          rule.conditional_probability != null 
            ? rule.conditional_probability 
            : parseConditionalProbability(notes);
        
        map[source].push({
          target,
          conditionalProbability,
          shiftRatio: rule.shift_ratio,
          confidenceFloor: rule.confidence_floor ?? null,
          confidenceCeiling: rule.confidence_ceiling ?? null,
          notes
        });
      }
    }
  });
  
  console.log('[BarTimeline] Secondary events map:', map);
  console.log('[BarTimeline] Total parent events with children:', Object.keys(map).length);
  return map;
}

// Get position as percentage of timeline width (5% margin on each side)
function getTimelinePosition(year: number, quarter: string): number {
  const q = quarterToNumber(quarter);
  const yearSpan = TIMELINE_END_YEAR - TIMELINE_START_YEAR;
  const yearOffset = year - TIMELINE_START_YEAR;
  const quarterOffset = (q - 1) / 4 + 0.125;
  return 5 + ((yearOffset + quarterOffset) / yearSpan) * 90;
}

// Calculate bar spread from distributions
function getBarSpread(distributions: { quarter: string; year: number; probability: number }[]) {
  if (distributions.length === 0) return { startPercent: 50, widthPercent: 4 };
  
  const meaningful = distributions.filter(d => d.probability > 0.03);
  const toUse = meaningful.length > 0 ? meaningful : distributions;
  
  const positions = toUse.map(d => getTimelinePosition(d.year, d.quarter));
  const startPercent = Math.min(...positions);
  const endPercent = Math.max(...positions);
  const widthPercent = Math.max(3, endPercent - startPercent + 2);
  
  return { startPercent: startPercent - 1, widthPercent };
}

// Fuzzy match event name
function matchEventName(target: string, events: ForecastEvent[]): ForecastEvent | undefined {
  let match = events.find(e => e.name === target);
  if (match) return match;
  
  const targetLower = target.toLowerCase();
  match = events.find(e => e.name.toLowerCase().includes(targetLower.slice(0, 20)));
  if (match) return match;
  
  match = events.find(e => targetLower.includes(e.name.toLowerCase().slice(0, 20)));
  return match;
}

interface SecondaryEventInfo {
  name: string;
  conditionalProbability: number | null;
  shiftRatio: number;
  confidenceFloor: number | null;
  confidenceCeiling: number | null;
  notes: string | null;
}

interface ProcessedEvent {
  event: ForecastEvent;
  position: number;
  barStart: number;
  barWidth: number;
  row: number;
  isAbove: boolean;
  secondaryEvents: SecondaryEventInfo[];
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  event: ForecastEvent | null;
}

export function BarTimeline({ events, dependencyRules, onEventClick }: BarTimelineProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, event: null });
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, scrollLeft: 0 });

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPanX(0);
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, scrollLeft: containerRef.current?.scrollLeft || 0 });
  }, [zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !containerRef.current) return;
    const dx = e.clientX - panStart.x;
    containerRef.current.scrollLeft = panStart.scrollLeft - dx;
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Build secondary events map from dependency rules
  const secondaryEventsMap = useMemo(() => {
    return buildSecondaryEventsMap(dependencyRules);
  }, [dependencyRules]);

  // Process events into positioned bars
  const processedEvents = useMemo(() => {
    const result: ProcessedEvent[] = [];
    const aboveRows: { start: number; end: number }[][] = [[], [], [], [], []];
    const belowRows: { start: number; end: number }[][] = [[], [], [], [], []];

    const allPrimaryNames = [...PRIMARY_EVENTS_ABOVE, ...PRIMARY_EVENTS_BELOW];
    
    allPrimaryNames.forEach(eventName => {
      const event = matchEventName(eventName, events);
      if (!event) return;

      const isAbove = PRIMARY_EVENTS_ABOVE.includes(eventName);
      const position = getTimelinePosition(event.medianYear, event.medianQuarter);
      const spread = getBarSpread(event.distributions);
      
      // Find a row without overlap
      const rows = isAbove ? aboveRows : belowRows;
      let assignedRow = 0;
      for (let r = 0; r < rows.length; r++) {
        const overlaps = rows[r].some(bar => 
          !(spread.startPercent + spread.widthPercent < bar.start - 0.5 || spread.startPercent > bar.end + 0.5)
        );
        if (!overlaps) {
          assignedRow = r;
          rows[r].push({ start: spread.startPercent, end: spread.startPercent + spread.widthPercent });
          break;
        }
      }

      // Get secondary events from dynamic map, with fuzzy matching for event names
      let matchedSecondaryData: SecondaryEventData[] = [];
      let matchType = 'none';
      
      if (secondaryEventsMap[eventName]) {
        matchedSecondaryData = secondaryEventsMap[eventName];
        matchType = 'exact-primary';
      } else if (secondaryEventsMap[event.name]) {
        matchedSecondaryData = secondaryEventsMap[event.name];
        matchType = 'exact-event';
      } else {
        const fuzzyMatch = Object.entries(secondaryEventsMap).find(([key]) => 
          key.toLowerCase().includes(eventName.toLowerCase().slice(0, 15)) ||
          eventName.toLowerCase().includes(key.toLowerCase().slice(0, 15))
        );
        if (fuzzyMatch) {
          matchedSecondaryData = fuzzyMatch[1];
          matchType = `fuzzy:${fuzzyMatch[0]}`;
        }
      }
      
      // Convert to SecondaryEventInfo format
      const secondaryEvents: SecondaryEventInfo[] = matchedSecondaryData.map(data => ({
        name: data.target,
        conditionalProbability: data.conditionalProbability,
        shiftRatio: data.shiftRatio,
        confidenceFloor: data.confidenceFloor,
        confidenceCeiling: data.confidenceCeiling,
        notes: data.notes
      }));
      
      console.log(`[BarTimeline] Event "${eventName}" → ${secondaryEvents.length} secondary events (${matchType})`, 
        secondaryEvents.length > 0 ? secondaryEvents.map(s => s.name) : '');

      result.push({
        event,
        position,
        barStart: spread.startPercent,
        barWidth: spread.widthPercent,
        row: assignedRow,
        isAbove,
        secondaryEvents
      });
    });

    return result;
  }, [events, secondaryEventsMap]);

  // Handle bar hover
  const handleBarHover = useCallback((e: React.MouseEvent, pe: ProcessedEvent | null) => {
    if (isPanning) return;
    if (pe) {
      setHoveredEvent(pe.event.name);
      setTooltip({ visible: true, x: e.clientX, y: e.clientY, event: pe.event });
    } else {
      setHoveredEvent(null);
      setTooltip({ visible: false, x: 0, y: 0, event: null });
    }
  }, [isPanning]);

  // Handle bar click
  const handleBarClick = useCallback((pe: ProcessedEvent) => {
    if (isPanning) return;
    setExpandedEvent(prev => prev === pe.event.name ? null : pe.event.name);
    onEventClick(pe.event);
  }, [onEventClick, isPanning]);

  const timelineHeight = isMobile ? 450 : 550;
  const barHeight = isMobile ? 18 : 24;
  const rowGap = isMobile ? 36 : 44;
  const centerY = timelineHeight / 2;
  const baseWidth = isMobile ? 900 : 1200;

  return (
    <div className="relative">
      {/* Zoom Controls */}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-1 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleZoomOut}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs font-medium text-muted-foreground w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleZoomIn}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        {zoom > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleResetZoom}
            aria-label="Reset zoom"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div 
        ref={containerRef}
        className={cn(
          "relative w-full overflow-x-auto",
          zoom > 1 && "cursor-grab",
          isPanning && "cursor-grabbing"
        )}
        style={{ height: timelineHeight }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="relative transition-transform duration-150"
          style={{ 
            height: timelineHeight,
            width: `${baseWidth * zoom}px`,
            minWidth: '100%'
          }}
        >
        {/* Timeline Spine (Red Line) */}
        <div 
          className="absolute left-[5%] right-[5%] h-0.5 bg-primary"
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
              <div className="w-0.5 h-4 bg-primary" />
              {showLabel && (
                <span className="mt-2 text-[10px] md:text-xs font-semibold text-muted-foreground">
                  {year}
                </span>
              )}
            </div>
          );
        })}

        {/* Event Bars */}
        {processedEvents.map((pe) => {
          const { event, barStart, barWidth, row, isAbove } = pe;
          const color = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default;
          
          const yOffset = isAbove 
            ? centerY - (row + 1) * rowGap - barHeight 
            : centerY + 16 + row * rowGap;
          
          const isHovered = hoveredEvent === event.name;
          const isExpanded = expandedEvent === event.name;

          return (
            <div key={event.name}>
              {/* Vertical Connector */}
              <div
                className="absolute w-px"
                style={{
                  left: `${barStart + barWidth / 2}%`,
                  top: isAbove ? yOffset + barHeight : centerY,
                  height: isAbove ? centerY - yOffset - barHeight : yOffset - centerY,
                  backgroundColor: color,
                  opacity: 0.5
                }}
              />
              
              {/* Bar */}
              <div
                className={cn(
                  "absolute cursor-pointer transition-all duration-150 rounded-sm",
                  (isHovered || isExpanded) && "shadow-lg z-20"
                )}
                style={{
                  left: `${barStart}%`,
                  width: `${barWidth}%`,
                  height: barHeight,
                  top: yOffset,
                  background: `linear-gradient(90deg, ${color}50 0%, ${color} 45%, ${color} 55%, ${color}50 100%)`,
                  transform: isHovered || isExpanded ? 'scaleY(1.15)' : 'scaleY(1)',
                  boxShadow: isHovered || isExpanded ? `0 2px 12px ${color}60` : 'none',
                }}
                onMouseEnter={(e) => handleBarHover(e, pe)}
                onMouseMove={(e) => setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }))}
                onMouseLeave={() => handleBarHover(null as unknown as React.MouseEvent, null)}
                onClick={() => handleBarClick(pe)}
              >
                {/* Median marker */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-white/70" style={{ left: '50%' }} />
              </div>

              {/* Label */}
              <div
                className={cn(
                  "absolute text-[9px] md:text-[11px] font-medium transition-opacity pointer-events-none text-center",
                  (isHovered || isExpanded) ? "opacity-100" : "opacity-70"
                )}
                style={{
                  left: `${barStart + barWidth / 2}%`,
                  top: isAbove ? yOffset - 14 : yOffset + barHeight + 4,
                  transform: 'translateX(-50%)',
                  maxWidth: 140,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: 'hsl(var(--foreground))'
                }}
              >
                {event.name.length > 24 ? event.name.slice(0, 22) + '…' : event.name}
              </div>

              {/* Secondary Circles with Conditional Probability */}
              {(isHovered || isExpanded) && pe.secondaryEvents.map((secInfo, i) => {
                const offset = (i - (pe.secondaryEvents.length - 1) / 2) * 18;
                const secY = isAbove 
                  ? yOffset - 28 - i * 10
                  : yOffset + barHeight + 24 + i * 10;
                
                const condProbLabel = secInfo.conditionalProbability 
                  ? `P(${secInfo.name.slice(0, 12)}… | ${event.name.slice(0, 12)}…) = ${Math.round(secInfo.conditionalProbability * 100)}%`
                  : null;
                
                return (
                  <TooltipProvider key={secInfo.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="pointer-events-auto cursor-help">
                          {/* Callout line */}
                          <svg className="absolute inset-0 overflow-visible pointer-events-none" style={{ zIndex: 5 }}>
                            <line
                              x1={`${barStart + barWidth / 2}%`}
                              y1={isAbove ? yOffset : yOffset + barHeight}
                              x2={`calc(${barStart + barWidth / 2}% + ${offset}px)`}
                              y2={secY + 5}
                              stroke="hsl(var(--muted-foreground))"
                              strokeWidth={1}
                              strokeDasharray="2,2"
                              opacity={0.4}
                            />
                          </svg>
                          {/* Circle */}
                          <div
                            className="absolute w-2.5 h-2.5 rounded-full hover:scale-150 transition-transform"
                            style={{
                              left: `calc(${barStart + barWidth / 2}% + ${offset - 5}px)`,
                              top: secY,
                              backgroundColor: color,
                              opacity: 0.8
                            }}
                          />
                          {/* Label */}
                          {!isMobile && (
                            <div
                              className="absolute text-[8px] text-muted-foreground whitespace-nowrap"
                              style={{
                                left: `calc(${barStart + barWidth / 2}% + ${offset + 8}px)`,
                                top: secY - 2
                              }}
                            >
                              {secInfo.name.length > 20 ? secInfo.name.slice(0, 18) + '…' : secInfo.name}
                              {secInfo.conditionalProbability && (
                                <span className="ml-1 text-primary font-medium">
                                  ({Math.round(secInfo.conditionalProbability * 100)}%)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1.5">
                          <div className="font-semibold text-xs">{secInfo.name}</div>
                          {/* Enhanced dependency hover with P, range, and delay ratio */}
                          {formatDependencyHover(
                            secInfo.name,
                            event.name,
                            secInfo.conditionalProbability,
                            secInfo.shiftRatio,
                            secInfo.confidenceFloor,
                            secInfo.confidenceCeiling
                          ).map((line, idx) => (
                            <div key={idx} className="text-xs text-primary font-mono">{line}</div>
                          ))}
                          {secInfo.notes && (
                            <div className="text-[10px] text-muted-foreground border-t border-border/30 pt-1 mt-1">{secInfo.notes}</div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Tooltip with Probability Clamping */}
      {tooltip.visible && tooltip.event && (() => {
        const probClamped = clampProbability(tooltip.event.probability);
        return (
          <div
            className="fixed z-50 bg-popover border border-border rounded-lg shadow-xl p-3 pointer-events-none"
            style={{ left: tooltip.x + 12, top: tooltip.y - 10, maxWidth: 280 }}
          >
            <div className="font-semibold text-sm text-foreground mb-1">{tooltip.event.name}</div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div><span className="font-medium">Median:</span> {tooltip.event.medianQuarter} {tooltip.event.medianYear}</div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Probability:</span> 
                <span>{probClamped.display}</span>
                {probClamped.isClamped && (
                  <span className="text-[10px] text-amber-500" title={probClamped.tooltip || ''}>*</span>
                )}
              </div>
              {probClamped.isClamped && (
                <div className="text-[10px] text-amber-500/80 italic">
                  {probClamped.tooltip}
                </div>
              )}
              {tooltip.event.distributions.length > 1 && (
                <div>
                  <span className="font-medium">Range:</span> {tooltip.event.distributions[0].quarter} {tooltip.event.distributions[0].year} – {tooltip.event.distributions[tooltip.event.distributions.length - 1].quarter} {tooltip.event.distributions[tooltip.event.distributions.length - 1].year}
                </div>
              )}
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground/70">Click for details</div>
          </div>
        );
      })()}

        {/* Instructions */}
        <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
          {isMobile ? "Tap bars to expand" : zoom > 1 ? "Drag to pan • Click bars to expand" : "Hover for details • Click to expand"}
        </div>

        {/* Legend */}
        <div className="absolute bottom-2 right-2 flex flex-wrap gap-2 text-[9px] bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
          {Object.entries(CATEGORY_COLORS).filter(([cat]) => cat !== 'default').slice(0, 6).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize text-muted-foreground">{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
