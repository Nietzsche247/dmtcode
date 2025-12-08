import { useMemo, useState } from "react";
import { type ForecastEvent } from "@/lib/forecasts-api";
import { AlertTriangle, TrendingUp, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineVisualizationProps {
  events: ForecastEvent[];
  onEventClick?: (event: ForecastEvent) => void;
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

// Calculate the spread of distributions (uncertainty range)
const calculateSpread = (distributions: { quarter: string; year: number; probability: number }[]): { start: number; end: number } => {
  if (distributions.length === 0) return { start: 0, end: 0 };
  
  // Sort by year and quarter
  const sorted = [...distributions].sort((a, b) => {
    const aVal = a.year + quarterToPosition(a.quarter);
    const bVal = b.year + quarterToPosition(b.quarter);
    return aVal - bVal;
  });
  
  // Find the range that contains most of the probability mass (e.g., 80%)
  let totalProb = sorted.reduce((sum, d) => sum + d.probability, 0);
  let cumProb = 0;
  let startIdx = 0;
  let endIdx = sorted.length - 1;
  
  // Find 10th percentile
  for (let i = 0; i < sorted.length; i++) {
    cumProb += sorted[i].probability;
    if (cumProb >= totalProb * 0.1) {
      startIdx = i;
      break;
    }
  }
  
  // Find 90th percentile
  cumProb = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    cumProb += sorted[i].probability;
    if (cumProb >= totalProb * 0.1) {
      endIdx = i;
      break;
    }
  }
  
  const startVal = sorted[startIdx].year + quarterToPosition(sorted[startIdx].quarter);
  const endVal = sorted[endIdx].year + quarterToPosition(sorted[endIdx].quarter);
  
  return { start: startVal, end: endVal };
};

export function TimelineVisualization({ events, onEventClick }: TimelineVisualizationProps) {
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  
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

  const getBarGradient = (type: ForecastEvent['type']) => {
    if (type === 'negative') return 'from-destructive/30 via-destructive/60 to-destructive/30';
    if (type === 'foundation') return 'from-yellow-500/30 via-yellow-500/60 to-yellow-500/30';
    return 'from-primary/30 via-primary/60 to-primary/30';
  };

  const isNegativeEvent = (name: string) => {
    return name.toLowerCase().includes('attack') || 
           name.toLowerCase().includes('break') || 
           name.toLowerCase().includes('encryption');
  };

  return (
    <div className="w-full">
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
              const isHovered = hoveredEvent === event.name;
              const negative = isNegativeEvent(event.name);

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
                      "bg-gradient-to-r",
                      getBarGradient(event.type),
                      isHovered && "scale-y-110 shadow-lg"
                    )}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                    onClick={() => onEventClick?.(event)}
                  >
                    {/* Median Marker */}
                    <div
                      className={cn(
                        "absolute w-1 h-full rounded-full",
                        event.type === 'negative' ? 'bg-destructive' : 
                        event.type === 'foundation' ? 'bg-yellow-500' : 'bg-primary'
                      )}
                      style={{
                        left: `${((medianPercent - leftPercent) / widthPercent) * 100}%`,
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
