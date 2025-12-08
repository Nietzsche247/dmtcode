import { useMemo, useState, useRef, useCallback } from "react";
import { type ForecastEvent } from "@/lib/forecasts-api";
import { AlertTriangle, TrendingUp, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineVisualizationProps {
  events: ForecastEvent[];
  onEventClick?: (event: ForecastEvent) => void;
}

interface CursorTooltip {
  x: number;
  y: number;
  year: string;
  probability: number;
  eventName: string;
  isLocked: boolean;
}

// Years to display on timeline
const YEARS = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

// Quarter to decimal position within year (0-1)
const quarterToPosition = (quarter: string): number => {
  switch (quarter) {
    case 'Q1': return 0.125;
    case 'Q2': return 0.375;
    case 'Q3': return 0.625;
    case 'Q4': return 0.875;
    default: return 0.5;
  }
};

// Parse median date like "Q4 2028" to a decimal year value
const parseMedianToDecimal = (median: string): number => {
  const match = median.match(/(Q[1-4])\s*(\d{4})/);
  if (!match) return 2028;
  const quarter = match[1];
  const year = parseInt(match[2]);
  return year + quarterToPosition(quarter);
};

// Calculate the spread of distributions using cumulative probability thresholds
const calculateSpread = (distributions: { quarter: string; year: number; probability: number }[]): { 
  start: number; 
  end: number;
  peakPosition: number;
  distributionData: { position: number; probability: number }[];
} => {
  if (distributions.length === 0) return { start: 2025, end: 2035, peakPosition: 2030, distributionData: [] };
  
  // Sort by year and quarter
  const sorted = [...distributions].sort((a, b) => {
    const aVal = a.year + quarterToPosition(a.quarter);
    const bVal = b.year + quarterToPosition(b.quarter);
    return aVal - bVal;
  });
  
  const totalProb = sorted.reduce((sum, d) => sum + d.probability, 0);
  
  // Create distribution data for gradient calculation
  const distributionData = sorted.map(d => ({
    position: d.year + quarterToPosition(d.quarter),
    probability: d.probability / totalProb // Normalize
  }));
  
  // Find peak probability position (for darkest gradient point)
  let maxProb = 0;
  let peakPosition = distributionData[0]?.position || 2030;
  for (const d of distributionData) {
    if (d.probability > maxProb) {
      maxProb = d.probability;
      peakPosition = d.position;
    }
  }
  
  // Calculate cumulative probability to find 5% and 95% thresholds
  let cumProb = 0;
  let startPosition = distributionData[0]?.position || 2025;
  let endPosition = distributionData[distributionData.length - 1]?.position || 2035;
  let foundStart = false;
  
  for (const d of distributionData) {
    cumProb += d.probability;
    // Find first position where cumulative prob > 5%
    if (!foundStart && cumProb > 0.05) {
      startPosition = d.position;
      foundStart = true;
    }
    // Find first position where cumulative prob > 95%
    if (cumProb > 0.95) {
      endPosition = d.position;
      break;
    }
  }
  
  return { start: startPosition, end: endPosition, peakPosition, distributionData };
};

export function TimelineVisualization({ events, onEventClick }: TimelineVisualizationProps) {
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [cursorTooltip, setCursorTooltip] = useState<CursorTooltip | null>(null);
  const [lockedTooltip, setLockedTooltip] = useState<CursorTooltip | null>(null);
  const barRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Calculate cumulative probability at a given position within an event's distribution
  const getCumulativeProbabilityAtPosition = useCallback((
    distributionData: { position: number; probability: number }[],
    targetPosition: number
  ): number => {
    if (distributionData.length === 0) return 0;
    
    let cumulative = 0;
    for (const d of distributionData) {
      if (d.position <= targetPosition) {
        cumulative += d.probability;
      }
    }
    return Math.min(cumulative * 100, 100);
  }, []);

  // Handle mouse move on bar to show probability tooltip
  const handleBarMouseMove = useCallback((
    e: React.MouseEvent<HTMLDivElement>,
    event: { name: string; spread: { start: number; end: number; distributionData: { position: number; probability: number }[] } }
  ) => {
    // Don't update cursor tooltip if we have a locked tooltip
    if (lockedTooltip) return;

    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const percentInBar = relativeX / rect.width;
    
    // Calculate the year position from percentage in bar
    const barStart = event.spread.start;
    const barEnd = event.spread.end;
    const yearPosition = barStart + percentInBar * (barEnd - barStart);
    
    // Get cumulative probability at this position
    const cumProb = getCumulativeProbabilityAtPosition(
      event.spread.distributionData,
      yearPosition
    );
    
    // Format year as quarter
    const year = Math.floor(yearPosition);
    const quarterNum = Math.ceil((yearPosition % 1) * 4) || 1;
    const quarterStr = `Q${quarterNum} ${year}`;
    
    setCursorTooltip({
      x: e.clientX,
      y: rect.top,
      year: quarterStr,
      probability: cumProb,
      eventName: event.name,
      isLocked: false
    });
  }, [getCumulativeProbabilityAtPosition, lockedTooltip]);

  // Handle click on bar to lock/unlock tooltip
  const handleBarClick = useCallback((
    e: React.MouseEvent<HTMLDivElement>,
    event: { name: string; spread: { start: number; end: number; distributionData: { position: number; probability: number }[] } }
  ) => {
    e.stopPropagation();
    
    // If already locked, unlock
    if (lockedTooltip) {
      setLockedTooltip(null);
      return;
    }

    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const percentInBar = relativeX / rect.width;
    
    const barStart = event.spread.start;
    const barEnd = event.spread.end;
    const yearPosition = barStart + percentInBar * (barEnd - barStart);
    
    const cumProb = getCumulativeProbabilityAtPosition(
      event.spread.distributionData,
      yearPosition
    );
    
    const year = Math.floor(yearPosition);
    const quarterNum = Math.ceil((yearPosition % 1) * 4) || 1;
    const quarterStr = `Q${quarterNum} ${year}`;
    
    setLockedTooltip({
      x: e.clientX,
      y: rect.top,
      year: quarterStr,
      probability: cumProb,
      eventName: event.name,
      isLocked: true
    });
    setCursorTooltip(null);
  }, [getCumulativeProbabilityAtPosition, lockedTooltip]);

  const handleBarMouseLeave = useCallback(() => {
    if (!lockedTooltip) {
      setCursorTooltip(null);
    }
  }, [lockedTooltip]);

  // Click outside to unlock
  const handleContainerClick = useCallback(() => {
    if (lockedTooltip) {
      setLockedTooltip(null);
    }
  }, [lockedTooltip]);

  // Process events for timeline positioning
  const processedEvents = useMemo(() => {
    return events.map(event => {
      const medianDecimal = parseMedianToDecimal(event.median);
      const spread = calculateSpread(event.distributions);
      
      // Calculate percentiles from distributions
      const sorted = [...event.distributions].sort((a, b) => {
        return (a.year + quarterToPosition(a.quarter)) - (b.year + quarterToPosition(b.quarter));
      });
      
      let cumProb = 0;
      const total = sorted.reduce((sum, d) => sum + d.probability, 0);
      let p25 = medianDecimal;
      let p75 = medianDecimal;
      
      for (let i = 0; i < sorted.length; i++) {
        cumProb += sorted[i].probability;
        const val = sorted[i].year + quarterToPosition(sorted[i].quarter);
        if (cumProb >= total * 0.25 && p25 === medianDecimal) {
          p25 = val;
        }
        if (cumProb >= total * 0.75 && p75 === medianDecimal) {
          p75 = val;
          break;
        }
      }
      
      return {
        ...event,
        medianDecimal,
        spread,
        p25,
        p75,
        totalProbability: total
      };
    }).sort((a, b) => a.medianDecimal - b.medianDecimal);
  }, [events]);

  // Calculate position percentage for a decimal year
  const yearToPercent = (decimalYear: number): number => {
    const startYear = YEARS[0];
    const endYear = YEARS[YEARS.length - 1];
    return ((decimalYear - startYear) / (endYear - startYear)) * 100;
  };

  const getEventColor = (type: ForecastEvent['type'], isNegative: boolean) => {
    if (isNegative || type === 'negative') return 'bg-destructive/80 border-destructive';
    if (type === 'foundation') return 'bg-yellow-500/80 border-yellow-500';
    return 'bg-primary/80 border-primary';
  };

  // Generate inline gradient style based on probability distribution
  const getBarGradientStyle = (
    type: ForecastEvent['type'],
    medianPercent: number, // Position of median within bar (0-100)
    distributionData: { position: number; probability: number }[],
    barStart: number,
    barEnd: number
  ): React.CSSProperties => {
    const baseColor = type === 'negative' 
      ? 'hsl(var(--destructive))' 
      : type === 'foundation' 
        ? 'hsl(48, 96%, 53%)' // yellow-500
        : 'hsl(var(--primary))';
    
    const barWidth = barEnd - barStart;
    if (barWidth <= 0 || distributionData.length === 0) {
      return { background: `${baseColor}40` };
    }
    
    // Build gradient stops based on actual probability distribution
    const stops: string[] = [];
    
    for (const d of distributionData) {
      // Calculate position within the bar (0-100%)
      const posInBar = ((d.position - barStart) / barWidth) * 100;
      if (posInBar >= 0 && posInBar <= 100) {
        // Opacity based on probability (derivative of cumulative = PDF)
        // Scale probability to opacity (min 15%, max 85%)
        const maxProb = Math.max(...distributionData.map(x => x.probability));
        const normalizedProb = d.probability / maxProb;
        const opacity = 0.15 + normalizedProb * 0.70;
        const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
        stops.push(`${baseColor.replace(')', `, ${opacity})`).replace('hsl', 'hsla')} ${posInBar.toFixed(1)}%`);
      }
    }
    
    // Add edge fades if needed
    if (stops.length === 0) {
      return { background: `${baseColor}40` };
    }
    
    // Ensure smooth edges
    const firstStop = stops[0];
    const lastStop = stops[stops.length - 1];
    
    return {
      background: `linear-gradient(to right, ${baseColor}10 0%, ${stops.join(', ')}, ${baseColor}10 100%)`
    };
  };

  const isNegativeEvent = (name: string) => {
    return name.toLowerCase().includes('attack') || 
           name.toLowerCase().includes('break') || 
           name.toLowerCase().includes('encryption');
  };

  return (
    <div className="w-full relative" onClick={handleContainerClick}>
      {/* Cursor Probability Tooltip */}
      {cursorTooltip && !lockedTooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-popover/95 border border-border rounded-md px-2 py-1 shadow-lg backdrop-blur-sm animate-fade-in"
          style={{
            left: cursorTooltip.x,
            top: cursorTooltip.y - 40,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="text-xs font-medium text-foreground whitespace-nowrap">
            <span className="text-muted-foreground">{cursorTooltip.year}:</span>
            <span className="ml-1.5 text-primary font-semibold">{cursorTooltip.probability.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Locked Probability Tooltip */}
      {lockedTooltip && (
        <div
          className="fixed z-50 bg-popover border-2 border-primary rounded-md px-3 py-2 shadow-xl backdrop-blur-sm animate-fade-in cursor-pointer"
          style={{
            left: lockedTooltip.x,
            top: lockedTooltip.y - 56,
            transform: 'translateX(-50%)'
          }}
          onClick={(e) => { e.stopPropagation(); setLockedTooltip(null); }}
        >
          <div className="text-xs font-medium text-foreground whitespace-nowrap">
            <div className="text-muted-foreground text-[10px] mb-0.5">{lockedTooltip.eventName}</div>
            <div>
              <span className="text-muted-foreground">{lockedTooltip.year}:</span>
              <span className="ml-1.5 text-primary font-bold">{lockedTooltip.probability.toFixed(1)}%</span>
            </div>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-b-2 border-r-2 border-primary rotate-45" />
          <div className="text-[9px] text-muted-foreground mt-1 text-center">click to dismiss</div>
        </div>
      )}

      {/* Timeline Container */}
      <div className="relative overflow-x-auto pb-4">
        <div className="min-w-[900px] px-4">
          {/* Year Labels */}
          <div className="relative h-8 mb-2">
            {YEARS.map((year, idx) => (
              <div
                key={year}
                className="absolute text-sm font-medium text-muted-foreground"
                style={{ left: `${(idx / (YEARS.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
              >
                {year}
              </div>
            ))}
          </div>

          {/* Timeline Axis */}
          <div className="relative h-2 bg-border/50 rounded-full mb-6">
            {/* Year Markers */}
            {YEARS.map((year, idx) => (
              <div
                key={year}
                className="absolute w-0.5 h-4 bg-border -top-1"
                style={{ left: `${(idx / (YEARS.length - 1)) * 100}%` }}
              />
            ))}
          </div>

          {/* Events */}
          <div className="relative space-y-3">
            {processedEvents.map((event, idx) => {
              const leftPercent = yearToPercent(event.spread.start);
              const rightPercent = yearToPercent(event.spread.end);
              const widthPercent = Math.max(rightPercent - leftPercent, 3); // Minimum width
              const medianPercent = yearToPercent(event.medianDecimal);
              const medianInBar = widthPercent > 0 ? ((medianPercent - leftPercent) / widthPercent) * 100 : 50;
              const isHovered = hoveredEvent === event.name;
              const negative = isNegativeEvent(event.name);

              // Get gradient style based on actual distribution data
              const gradientStyle = getBarGradientStyle(
                event.type,
                medianInBar,
                event.spread.distributionData,
                event.spread.start,
                event.spread.end
              );

              return (
                <div 
                  key={event.name}
                  className="relative h-12 group"
                  onMouseEnter={() => setHoveredEvent(event.name)}
                  onMouseLeave={() => setHoveredEvent(null)}
                >
                  {/* Probability Distribution Bar */}
                  <div
                    className={cn(
                      "absolute h-8 rounded-lg cursor-pointer transition-all duration-200",
                      isHovered && "scale-y-110 shadow-lg"
                    )}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      ...gradientStyle
                    }}
                    onClick={(e) => handleBarClick(e, event)}
                    onMouseMove={(e) => handleBarMouseMove(e, event)}
                    onMouseLeave={handleBarMouseLeave}
                  >
                    {/* Median Marker */}
                    <div
                      className={cn(
                        "absolute w-1 h-full rounded-full",
                        event.type === 'negative' ? 'bg-destructive' : 
                        event.type === 'foundation' ? 'bg-yellow-500' : 'bg-primary'
                      )}
                      style={{
                        left: `${medianInBar}%`,
                        transform: 'translateX(-50%)'
                      }}
                    />
                  </div>

                  {/* Event Label */}
                  <div
                    className={cn(
                      "absolute flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200",
                      "bg-card/90 border backdrop-blur-sm",
                      isHovered ? "shadow-lg z-10" : "shadow-sm",
                      negative ? "border-destructive/50 text-destructive" : "border-border text-foreground"
                    )}
                    style={{
                      left: `${medianPercent}%`,
                      transform: 'translateX(-50%)',
                      top: isHovered ? '-4px' : '0'
                    }}
                  >
                    {negative && <AlertTriangle className="h-3 w-3" />}
                    {event.type === 'foundation' && <Zap className="h-3 w-3 text-yellow-500" />}
                    {event.type === 'positive' && !negative && <TrendingUp className="h-3 w-3 text-primary" />}
                    <span className="max-w-[180px] truncate">{event.name}</span>
                    <span className="text-muted-foreground ml-1">{event.median}</span>
                  </div>

                  {/* Hover Tooltip */}
                  {isHovered && (
                    <div 
                      className="absolute z-20 bg-popover border border-border rounded-lg p-3 shadow-xl min-w-[220px] animate-fade-in"
                      style={{
                        left: `${medianPercent}%`,
                        transform: 'translateX(-50%)',
                        bottom: '100%',
                        marginBottom: '8px'
                      }}
                    >
                      <div className="text-sm font-semibold text-foreground mb-2">{event.name}</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Median:</span>
                          <span className="font-medium text-primary">{event.median}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">25th Percentile:</span>
                          <span className="font-medium">Q{Math.ceil((event.p25 % 1) * 4) || 4} {Math.floor(event.p25)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">75th Percentile:</span>
                          <span className="font-medium">Q{Math.ceil((event.p75 % 1) * 4) || 4} {Math.floor(event.p75)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Probability Mass:</span>
                          <span className="font-medium">{event.totalProbability.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-border/30">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded bg-primary/60" />
              <span className="text-muted-foreground">Positive Event</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded bg-yellow-500/60" />
              <span className="text-muted-foreground">Foundation Event</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded bg-destructive/60" />
              <span className="text-muted-foreground">Negative Event</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-0.5 h-4 bg-foreground" />
              <span className="text-muted-foreground">Median Date</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Hint for Mobile */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2 md:hidden">
        <ChevronLeft className="h-3 w-3" />
        <span>Scroll horizontally to explore</span>
        <ChevronRight className="h-3 w-3" />
      </div>
    </div>
  );
}
