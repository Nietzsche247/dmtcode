import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import type { ForecastEvent, DependencyRule, EventCategory } from "@/lib/forecasts-api";
import { CATEGORY_COLORS, quarterToNumber } from "@/lib/forecasts-api";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface BarTimelineProps {
  events: ForecastEvent[];
  dependencyRules: DependencyRule[];
  onEventClick: (event: ForecastEvent) => void;
}

// Timeline configuration
const TIMELINE_START_YEAR = 2026;
const TIMELINE_END_YEAR = 2033;
const YEARS = Array.from({ length: TIMELINE_END_YEAR - TIMELINE_START_YEAR + 1 }, (_, i) => TIMELINE_START_YEAR + i);

// Primary events to show as bars - matched to real event names from data
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

// Secondary events mapped to parents
const SECONDARY_EVENTS: Record<string, string[]> = {
  "AI Agents Transform White-Collar Work": ["White-Collar Hiring Freeze", "Coding Bootcamp Collapse"],
  "AI Achieves Human-Level Novel Reasoning": ["Scientific Discovery Rate 10x", "First AI-Authored Paper"],
  "AGI / Human-Level General Intelligence": ["AI Capability Doubling Collapses", "Emergency Government Task Forces"],
  "Artificial Superintelligence Emerges": ["Human R&D Obsolescence", "Stock Market Circuit Breakers"],
  "China-Taiwan Military Conflict": ["US-China Direct Engagement", "Global Recession War-Induced"],
  "ASI Achieves Omniscience": ["Human Privacy Ends", "Encryption Broken"],
  "First 1M Humanoid Robots Delivered": ["Physical Labor Displacement", "Warehouse Automation"],
  "Quantum Computing Becomes Semi-Mainstream": ["Post-Quantum Crypto Emergency", "Cryptocurrency Collapse"],
  "DIY Bio-Attack with Major Impact": ["DNA Synthesis Restrictions", "Biosurveillance Expansion"],
  "Global Unemployment Crisis": ["UBI Legislation Fast-Tracked", "Mental Health Crisis"]
};

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
  // Exact match first
  let match = events.find(e => e.name === target);
  if (match) return match;
  
  // Partial match
  const targetLower = target.toLowerCase();
  match = events.find(e => e.name.toLowerCase().includes(targetLower.slice(0, 20)));
  if (match) return match;
  
  match = events.find(e => targetLower.includes(e.name.toLowerCase().slice(0, 20)));
  return match;
}

interface ProcessedEvent {
  event: ForecastEvent;
  position: number;
  barStart: number;
  barWidth: number;
  row: number;
  isAbove: boolean;
  secondaryEvents: string[];
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

      result.push({
        event,
        position,
        barStart: spread.startPercent,
        barWidth: spread.widthPercent,
        row: assignedRow,
        isAbove,
        secondaryEvents: SECONDARY_EVENTS[eventName] || []
      });
    });

    return result;
  }, [events]);

  // Handle bar hover
  const handleBarHover = useCallback((e: React.MouseEvent, pe: ProcessedEvent | null) => {
    if (pe) {
      setHoveredEvent(pe.event.name);
      setTooltip({ visible: true, x: e.clientX, y: e.clientY, event: pe.event });
    } else {
      setHoveredEvent(null);
      setTooltip({ visible: false, x: 0, y: 0, event: null });
    }
  }, []);

  // Handle bar click
  const handleBarClick = useCallback((pe: ProcessedEvent) => {
    setExpandedEvent(prev => prev === pe.event.name ? null : pe.event.name);
    onEventClick(pe.event);
  }, [onEventClick]);

  const timelineHeight = isMobile ? 450 : 550;
  const barHeight = isMobile ? 18 : 24;
  const rowGap = isMobile ? 36 : 44;
  const centerY = timelineHeight / 2;

  return (
    <div 
      ref={containerRef}
      className="relative w-full overflow-x-auto"
      style={{ height: timelineHeight }}
    >
      <div 
        className="relative"
        style={{ 
          height: timelineHeight,
          minWidth: isMobile ? 900 : '100%'
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
                onMouseLeave={() => handleBarHover(null as any, null)}
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

              {/* Secondary Circles */}
              {(isHovered || isExpanded) && pe.secondaryEvents.map((secName, i) => {
                const offset = (i - (pe.secondaryEvents.length - 1) / 2) * 18;
                const secY = isAbove 
                  ? yOffset - 28 - i * 10
                  : yOffset + barHeight + 24 + i * 10;
                
                return (
                  <div key={secName} className="pointer-events-none">
                    {/* Callout line */}
                    <svg className="absolute inset-0 overflow-visible" style={{ zIndex: 5 }}>
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
                      className="absolute w-2.5 h-2.5 rounded-full"
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
                        {secName.length > 20 ? secName.slice(0, 18) + '…' : secName}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.event && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-lg shadow-xl p-3 pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10, maxWidth: 280 }}
        >
          <div className="font-semibold text-sm text-foreground mb-1">{tooltip.event.name}</div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div><span className="font-medium">Median:</span> {tooltip.event.medianQuarter} {tooltip.event.medianYear}</div>
            <div><span className="font-medium">Probability:</span> {(tooltip.event.probability * 100).toFixed(0)}%</div>
            {tooltip.event.distributions.length > 1 && (
              <div><span className="font-medium">Range:</span> {tooltip.event.distributions[0].quarter} {tooltip.event.distributions[0].year} – {tooltip.event.distributions[tooltip.event.distributions.length - 1].quarter} {tooltip.event.distributions[tooltip.event.distributions.length - 1].year}</div>
            )}
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground/70">Click for details</div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
        {isMobile ? "Tap bars to expand" : "Hover for details • Click to expand"}
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
  );
}
              }}
              onMouseLeave={() => handleBarHover(null as any, null)}
              onClick={() => handleBarClick(pe)}
            >
              {/* Median marker */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white/60"
                style={{ left: '50%' }}
              />
            </div>
          );
        })}

        {/* Vertical connectors from bars to timeline */}
        <svg 
          width="100%" 
          height="100%" 
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 5 }}
        >
          {processedEvents.map((pe) => {
            const { event, position, row, isAbove } = pe;
            const color = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default;
            const barY = isAbove 
              ? 50 - ((row + 1) * rowHeight / timelineHeight) * 100
              : 50 + ((row * rowHeight + 12 + barHeight) / timelineHeight) * 100;
            
            return (
              <line
                key={`conn-${event.name}`}
                x1={`calc(5% + ${position * 0.9}%)`}
                y1={`${barY}%`}
                x2={`calc(5% + ${position * 0.9}%)`}
                y2="50%"
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray={isAbove ? "none" : "3,2"}
                opacity={0.6}
              />
            );
          })}
        </svg>

        {/* Event Labels */}
        {processedEvents.map((pe) => {
          const { event, barStart, barWidth, row, isAbove } = pe;
          const isHovered = hoveredEvent === event.name;
          const isExpanded = expandedEvent === event.name;
          const showLabel = !isMobile || isHovered || isExpanded;
          
          if (!showLabel && isMobile) return null;

          const labelY = isAbove
            ? `calc(50% - ${(row + 1) * rowHeight}px - ${barHeight}px - 4px)`
            : `calc(50% + ${row * rowHeight + 12}px + ${barHeight}px + 12px)`;

          const displayName = event.name.length > 25 && !isHovered && !isExpanded
            ? event.name.slice(0, 22) + '…' 
            : event.name;

          return (
            <div
              key={`label-${event.name}`}
              className={cn(
                "absolute text-[10px] md:text-xs font-medium pointer-events-none transition-opacity duration-200",
                isHovered || isExpanded ? "opacity-100" : "opacity-70"
              )}
              style={{
                left: `calc(5% + ${(barStart + barWidth / 2) * 0.9}%)`,
                top: labelY,
                transform: 'translateX(-50%)',
                color: 'hsl(var(--foreground))',
                whiteSpace: 'nowrap',
                maxWidth: '150px',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                textAlign: 'center'
              }}
            >
              {displayName}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.event && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-lg shadow-xl p-3 pointer-events-none"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y - 10,
            maxWidth: 280,
          }}
        >
          <div className="font-semibold text-sm text-foreground mb-1">
            {tooltip.event.name}
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div><span className="font-medium">Median:</span> {tooltip.event.medianQuarter} {tooltip.event.medianYear}</div>
            <div><span className="font-medium">Probability:</span> {(tooltip.event.probability * 100).toFixed(0)}%</div>
            <div><span className="font-medium">Range:</span> {
              tooltip.event.distributions.length > 1
                ? `${tooltip.event.distributions[0].quarter} ${tooltip.event.distributions[0].year} – ${tooltip.event.distributions[tooltip.event.distributions.length - 1].quarter} ${tooltip.event.distributions[tooltip.event.distributions.length - 1].year}`
                : `${tooltip.event.distributions[0]?.quarter} ${tooltip.event.distributions[0]?.year}`
            }</div>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground/70">
            Click for details
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
        {isMobile ? "Tap bars to expand" : "Hover bars to see details • Click to expand"}
      </div>

      {/* Category Legend */}
      <div className="absolute bottom-2 right-2 flex flex-wrap gap-2 text-[9px] bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
        {Object.entries(CATEGORY_COLORS).filter(([cat]) => cat !== 'default').map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize text-muted-foreground">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
