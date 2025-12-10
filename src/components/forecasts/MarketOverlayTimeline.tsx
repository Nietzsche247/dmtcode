import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import type { ForecastEvent, DependencyRule, MarketPrediction } from "@/lib/forecasts-api";
import { CATEGORY_COLORS, quarterToNumber, getMarketPredictions } from "@/lib/forecasts-api";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MarketOverlayTimelineProps {
  events: ForecastEvent[];
  dependencyRules: DependencyRule[];
  onEventClick: (event: ForecastEvent) => void;
}

// Timeline configuration - extended to accommodate Metaculus data
const TIMELINE_START_YEAR = 2025;
const TIMELINE_END_YEAR = 2055;
const YEARS = Array.from({ length: Math.floor((TIMELINE_END_YEAR - TIMELINE_START_YEAR) / 5) + 1 }, (_, i) => TIMELINE_START_YEAR + i * 5);

// Zoom configuration
const MIN_ZOOM = 0.8;
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

// Get position as percentage of timeline width
function getTimelinePosition(year: number, quarter: string): number {
  const q = quarterToNumber(quarter);
  const yearSpan = TIMELINE_END_YEAR - TIMELINE_START_YEAR;
  const yearOffset = year - TIMELINE_START_YEAR;
  const quarterOffset = (q - 1) / 4 + 0.125;
  return 5 + ((yearOffset + quarterOffset) / yearSpan) * 90;
}

// Parse date to position
function dateToPosition(dateStr: string): number {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  return getTimelinePosition(year, `Q${quarter}`);
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

// Match market prediction to event using mapped_event_name
function matchMarketPrediction(eventName: string, predictions: MarketPrediction[], source: 'metaculus' | 'polymarket'): MarketPrediction | undefined {
  const eventLower = eventName.toLowerCase();
  const sourcePredictions = predictions.filter(p => p.source === source);
  
  // Direct match on mapped_event_name first
  const direct = sourcePredictions.find(p => p.mapped_event_name.toLowerCase() === eventLower);
  if (direct) return direct;

  // Fuzzy match
  return sourcePredictions.find(p => {
    const mappedLower = p.mapped_event_name.toLowerCase();
    return eventLower.includes(mappedLower.slice(0, 15)) || 
           mappedLower.includes(eventLower.slice(0, 15)) ||
           (eventLower.includes('agi') && mappedLower.includes('agi')) ||
           (eventLower.includes('robot') && mappedLower.includes('robot')) ||
           (eventLower.includes('quantum') && mappedLower.includes('quantum')) ||
           (eventLower.includes('aging') && mappedLower.includes('aging'));
  });
}

interface ProcessedEvent {
  event: ForecastEvent;
  position: number;
  barStart: number;
  barWidth: number;
  row: number;
  isAbove: boolean;
  metaculus?: MarketPrediction;
  polymarket?: MarketPrediction;
}

export function MarketOverlayTimeline({ events, dependencyRules, onEventClick }: MarketOverlayTimelineProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<MarketPrediction[]>([]);
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, scrollLeft: 0 });

  // Fetch unified market data
  useEffect(() => {
    getMarketPredictions().then(setMarketData);
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
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

      // Match market data from unified table
      const metaculus = matchMarketPrediction(event.name, marketData, 'metaculus');
      const polymarket = matchMarketPrediction(event.name, marketData, 'polymarket');

      result.push({
        event,
        position,
        barStart: spread.startPercent,
        barWidth: spread.widthPercent,
        row: assignedRow,
        isAbove,
        metaculus,
        polymarket
      });
    });

    return result;
  }, [events, marketData]);

  const timelineHeight = isMobile ? 500 : 600;
  const barHeight = isMobile ? 18 : 24;
  const rowGap = isMobile ? 40 : 48;
  const centerY = timelineHeight / 2;
  const baseWidth = isMobile ? 900 : 1200;

  return (
    <TooltipProvider>
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
            {/* Timeline Spine */}
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

            {/* Event Bars with Market Overlays */}
            {processedEvents.map((pe) => {
              const { event, barStart, barWidth, row, isAbove, metaculus, polymarket } = pe;
              const color = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default;
              
              const yOffset = isAbove 
                ? centerY - (row + 1) * rowGap - barHeight 
                : centerY + 16 + row * rowGap;
              
              const isHovered = hoveredEvent === event.name;
              const metaculusPosition = metaculus?.median_date 
                ? dateToPosition(metaculus.median_date)
                : null;
              const polymarketPosition = polymarket?.median_date 
                ? dateToPosition(polymarket.median_date)
                : null;

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
                      isHovered && "shadow-lg z-20"
                    )}
                    style={{
                      left: `${barStart}%`,
                      width: `${barWidth}%`,
                      height: barHeight,
                      top: yOffset,
                      background: `linear-gradient(90deg, ${color}50 0%, ${color} 45%, ${color} 55%, ${color}50 100%)`,
                      transform: isHovered ? 'scaleY(1.15)' : 'scaleY(1)',
                      boxShadow: isHovered ? `0 2px 12px ${color}60` : 'none',
                    }}
                    onMouseEnter={() => setHoveredEvent(event.name)}
                    onMouseLeave={() => setHoveredEvent(null)}
                    onClick={() => onEventClick(event)}
                  >
                    {/* Median marker */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white/70" style={{ left: '50%' }} />
                  </div>

                  {/* Label */}
                  <div
                    className={cn(
                      "absolute text-[9px] md:text-[11px] font-medium transition-opacity pointer-events-none text-center",
                      isHovered ? "opacity-100" : "opacity-70"
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

                  {/* Metaculus Market Overlay with 25th-75th Range */}
                  {metaculus && metaculusPosition && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute cursor-pointer z-10"
                          style={{
                            left: `${metaculusPosition}%`,
                            top: isAbove ? yOffset + barHeight + 4 : yOffset - 28,
                          }}
                        >
                          {/* 25th-75th Percentile Range Bar */}
                          {metaculus.percentile_25 && metaculus.percentile_75 && (() => {
                            const pos25 = dateToPosition(metaculus.percentile_25);
                            const pos75 = Math.min(dateToPosition(metaculus.percentile_75), 95); // Cap at timeline end
                            const rangeWidth = pos75 - pos25;
                            const offsetFromMedian = pos25 - metaculusPosition;
                            
                            return (
                              <div
                                className="absolute h-2 rounded-full opacity-40"
                                style={{
                                  left: `${offsetFromMedian}%`,
                                  width: `${rangeWidth}%`,
                                  top: 10,
                                  background: 'linear-gradient(90deg, transparent 0%, hsl(25 95% 53%) 20%, hsl(25 95% 53%) 80%, transparent 100%)',
                                  minWidth: 20,
                                }}
                              />
                            );
                          })()}
                          
                          {/* Vertical connector line */}
                          <div 
                            className="absolute w-px bg-orange-500/60"
                            style={{
                              left: 5,
                              top: isAbove ? -4 : 16,
                              height: 16,
                            }}
                          />
                          
                          {/* Metaculus diamond badge */}
                          <div 
                            className="w-3 h-3 bg-orange-500 flex items-center justify-center shadow-sm hover:scale-125 transition-transform relative z-10"
                            style={{ transform: 'rotate(45deg)' }}
                          >
                            <span 
                              className="text-[6px] font-bold text-white"
                              style={{ transform: 'rotate(-45deg)' }}
                            >
                              M
                            </span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side={isAbove ? "bottom" : "top"} className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold text-orange-500">Metaculus</p>
                          <p className="text-sm">
                            Median: {new Date(metaculus.median_date!).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {metaculus.forecaster_count?.toLocaleString()} forecasters
                          </p>
                          {metaculus.percentile_25 && metaculus.percentile_75 && (
                            <p className="text-xs text-muted-foreground">
                              25th-75th: {new Date(metaculus.percentile_25).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} – {new Date(metaculus.percentile_75).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Polymarket Market Overlay */}
                  {polymarket && polymarketPosition && polymarket.probability && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute cursor-pointer z-10"
                          style={{
                            left: `${polymarketPosition}%`,
                            top: isAbove ? yOffset + barHeight + 20 : yOffset - 44,
                          }}
                        >
                          {/* Vertical connector line */}
                          <div 
                            className="absolute w-px bg-blue-500/60"
                            style={{
                              left: 5,
                              top: isAbove ? -16 : 14,
                              height: 16,
                            }}
                          />
                          
                          {/* Polymarket circle badge */}
                          <div 
                            className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-sm hover:scale-110 transition-transform relative z-10 border border-blue-400"
                          >
                            <span className="text-[8px] font-bold text-white">
                              {Math.round(Number(polymarket.probability) * 100)}%
                            </span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side={isAbove ? "bottom" : "top"} className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold text-blue-500">Polymarket</p>
                          <p className="text-sm">{polymarket.question_title}</p>
                          <p className="text-sm font-medium">
                            {Math.round(Number(polymarket.probability) * 100)}% probability
                          </p>
                          {polymarket.volume_usd && (
                            <p className="text-xs text-muted-foreground">
                              ${Number(polymarket.volume_usd).toLocaleString()} volume
                            </p>
                          )}
                          {polymarket.median_date && (
                            <p className="text-xs text-muted-foreground">
                              Ends: {new Date(polymarket.median_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-[7px] font-bold text-white">P</span>
            </div>
            <span>Polymarket</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500" style={{ transform: 'rotate(45deg)' }} />
            <span>Metaculus median</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}