import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { 
  type ForecastEvent, 
  type DependencyRule,
  CATEGORY_COLORS, 
  toDecimalDate,
  quarterToNumber 
} from "@/lib/forecasts-api";
import { cn } from "@/lib/utils";
import { Info, Zap, AlertTriangle } from "lucide-react";

interface InteractiveTimelineProps {
  events: ForecastEvent[];
  dependencyRules: DependencyRule[];
  showSecondaryEvents: boolean;
  onEventClick: (event: ForecastEvent) => void;
  onEventDrag?: (eventName: string, newQuarter: string, newYear: number) => void;
  adjustedEvents?: Map<string, { quarter: string; year: number }>;
  affectedEvents?: Set<string>;
}

interface TimelineNode {
  event: ForecastEvent;
  x: number;
  y: number;
  radius: number;
  color: string;
}

// Timeline configuration
const TIMELINE_START_YEAR = 2026;
const TIMELINE_END_YEAR = 2030;
const TIMELINE_PADDING = 60;
const NODE_MIN_RADIUS = 18;
const NODE_MAX_RADIUS = 32;
const ROW_HEIGHT = 80;
const QUARTER_WIDTH = 80;

// Calculate total width
const TOTAL_QUARTERS = (TIMELINE_END_YEAR - TIMELINE_START_YEAR + 1) * 4;
const TIMELINE_WIDTH = TOTAL_QUARTERS * QUARTER_WIDTH + TIMELINE_PADDING * 2;

export function InteractiveTimeline({
  events,
  dependencyRules,
  showSecondaryEvents,
  onEventClick,
  onEventDrag,
  adjustedEvents,
  affectedEvents
}: InteractiveTimelineProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragX, setDragX] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter events based on showSecondaryEvents toggle
  const filteredEvents = useMemo(() => {
    if (showSecondaryEvents) return events;
    return events.filter(e => e.isPrimary);
  }, [events, showSecondaryEvents]);

  // Get position for a quarter/year on the timeline
  const getXPosition = useCallback((year: number, quarter: string) => {
    const q = quarterToNumber(quarter);
    const quartersFromStart = (year - TIMELINE_START_YEAR) * 4 + (q - 1);
    return TIMELINE_PADDING + quartersFromStart * QUARTER_WIDTH + QUARTER_WIDTH / 2;
  }, []);

  // Get quarter/year from X position
  const getQuarterFromX = useCallback((x: number): { quarter: string; year: number } => {
    const quartersFromStart = Math.round((x - TIMELINE_PADDING - QUARTER_WIDTH / 2) / QUARTER_WIDTH);
    const clampedQuarters = Math.max(0, Math.min(quartersFromStart, TOTAL_QUARTERS - 1));
    const year = TIMELINE_START_YEAR + Math.floor(clampedQuarters / 4);
    const q = (clampedQuarters % 4) + 1;
    return { quarter: `Q${q}`, year };
  }, []);

  // Calculate node positions with vertical stacking for overlapping events
  const nodes = useMemo((): TimelineNode[] => {
    // Group events by their x position (quarter)
    const positionMap = new Map<number, ForecastEvent[]>();
    
    filteredEvents.forEach(event => {
      const adjusted = adjustedEvents?.get(event.name);
      const year = adjusted?.year || event.medianYear;
      const quarter = adjusted?.quarter || event.medianQuarter;
      const x = getXPosition(year, quarter);
      
      const existing = positionMap.get(x) || [];
      existing.push(event);
      positionMap.set(x, existing);
    });

    // Create nodes with stacked y positions
    const result: TimelineNode[] = [];
    positionMap.forEach((eventsAtPos, x) => {
      eventsAtPos.forEach((event, index) => {
        // Calculate radius based on probability (18-32px)
        const prob = event.probability || 0.5;
        const radius = NODE_MIN_RADIUS + (NODE_MAX_RADIUS - NODE_MIN_RADIUS) * Math.min(prob, 1);
        
        result.push({
          event,
          x,
          y: 120 + index * ROW_HEIGHT,
          radius: Math.max(radius, NODE_MIN_RADIUS), // Ensure minimum visibility
          color: CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default
        });
      });
    });

    return result;
  }, [filteredEvents, getXPosition, adjustedEvents]);

  // Get node by event name
  const getNodeByName = useCallback((name: string) => {
    return nodes.find(n => n.event.name === name);
  }, [nodes]);

  // Filter dependency rules to only show connections between visible events
  const visibleRules = useMemo(() => {
    const eventNames = new Set(filteredEvents.map(e => e.name));
    return dependencyRules.filter(
      rule => eventNames.has(rule.source_event) && eventNames.has(rule.target_event)
    );
  }, [dependencyRules, filteredEvents]);

  // Generate year/quarter markers
  const timeMarkers = useMemo(() => {
    const markers: { x: number; label: string; isYear: boolean }[] = [];
    for (let year = TIMELINE_START_YEAR; year <= TIMELINE_END_YEAR; year++) {
      for (let q = 1; q <= 4; q++) {
        const x = getXPosition(year, `Q${q}`);
        markers.push({
          x,
          label: q === 1 ? `${year}` : `Q${q}`,
          isYear: q === 1
        });
      }
    }
    return markers;
  }, [getXPosition]);

  // Calculate max height based on stacking
  const maxY = useMemo(() => {
    return Math.max(...nodes.map(n => n.y)) + 100;
  }, [nodes]);

  // Mouse handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, eventName: string, isPrimary: boolean) => {
    if (!isPrimary || !onEventDrag) return;
    e.preventDefault();
    setDraggingNode(eventName);
  }, [onEventDrag]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingNode || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setDragX(x);
  }, [draggingNode]);

  const handleMouseUp = useCallback(() => {
    if (draggingNode && dragX !== null && onEventDrag) {
      const { quarter, year } = getQuarterFromX(dragX);
      onEventDrag(draggingNode, quarter, year);
    }
    setDraggingNode(null);
    setDragX(null);
  }, [draggingNode, dragX, getQuarterFromX, onEventDrag]);

  useEffect(() => {
    if (draggingNode) {
      const handleGlobalMouseUp = () => {
        setDraggingNode(null);
        setDragX(null);
      };
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [draggingNode]);

  // Get the display position for a node (accounting for drag)
  const getDisplayX = useCallback((node: TimelineNode) => {
    if (draggingNode === node.event.name && dragX !== null) {
      return dragX;
    }
    return node.x;
  }, [draggingNode, dragX]);

  // Truncate long event names
  const truncateName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 2) + '…';
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg
        ref={svgRef}
        width={TIMELINE_WIDTH}
        height={maxY}
        className="min-w-full"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background */}
        <rect width="100%" height="100%" className="fill-background" />

        {/* Grid lines */}
        {timeMarkers.map((marker, i) => (
          <line
            key={i}
            x1={marker.x}
            y1={60}
            x2={marker.x}
            y2={maxY - 20}
            className={cn(
              "stroke-border/30",
              marker.isYear && "stroke-border/50"
            )}
            strokeWidth={marker.isYear ? 1.5 : 0.5}
            strokeDasharray={marker.isYear ? undefined : "4,4"}
          />
        ))}

        {/* Horizontal axis */}
        <line
          x1={TIMELINE_PADDING}
          y1={70}
          x2={TIMELINE_WIDTH - TIMELINE_PADDING}
          y2={70}
          className="stroke-border"
          strokeWidth={2}
        />

        {/* Time labels */}
        {timeMarkers.map((marker, i) => (
          <text
            key={i}
            x={marker.x}
            y={50}
            textAnchor="middle"
            className={cn(
              "fill-muted-foreground",
              marker.isYear ? "text-sm font-bold" : "text-xs font-light"
            )}
          >
            {marker.label}
          </text>
        ))}

        {/* Dependency lines */}
        {visibleRules.map((rule, i) => {
          const fromNode = getNodeByName(rule.source_event);
          const toNode = getNodeByName(rule.target_event);
          if (!fromNode || !toNode) return null;

          const fromX = getDisplayX(fromNode);
          const toX = getDisplayX(toNode);
          const fromY = fromNode.y;
          const toY = toNode.y;

          // Calculate control points for curved lines
          const midX = (fromX + toX) / 2;
          const midY = Math.min(fromY, toY) - 30;

          const isHard = rule.dependency_type === 'hard';
          const isHighlighted = hoveredNode === rule.source_event || hoveredNode === rule.target_event;

          return (
            <g key={i} className={cn("transition-opacity duration-200", !isHighlighted && hoveredNode && "opacity-20")}>
              <path
                d={`M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`}
                fill="none"
                className={cn(
                  "transition-all duration-200",
                  isHighlighted ? "stroke-primary" : "stroke-muted-foreground/40"
                )}
                strokeWidth={isHard ? 2 : 1}
                strokeDasharray={isHard ? undefined : "6,4"}
              />
              {/* Arrow at end */}
              <circle
                cx={toX}
                cy={toY - toNode.radius - 4}
                r={3}
                className={cn(
                  isHighlighted ? "fill-primary" : "fill-muted-foreground/40"
                )}
              />
            </g>
          );
        })}

        {/* Event nodes */}
        {nodes.map((node) => {
          const isHovered = hoveredNode === node.event.name;
          const isDragging = draggingNode === node.event.name;
          const isAffected = affectedEvents?.has(node.event.name);
          const isPrimary = node.event.isPrimary;
          const isConditional = !isPrimary;
          const displayX = getDisplayX(node);

          return (
            <g
              key={node.event.name}
              className={cn(
                "cursor-pointer transition-all duration-200",
                isDragging && "cursor-grabbing",
                isPrimary && onEventDrag && "cursor-grab"
              )}
              transform={`translate(${displayX}, ${node.y})`}
              onMouseEnter={(e) => {
                setHoveredNode(node.event.name);
                setTooltipPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredNode(null)}
              onMouseDown={(e) => handleMouseDown(e, node.event.name, isPrimary)}
              onClick={() => !isDragging && onEventClick(node.event)}
            >
              {/* Glow effect */}
              {(isHovered || isDragging || isAffected) && (
                <circle
                  r={node.radius + 12}
                  className="transition-all duration-200"
                  fill={isAffected ? "rgba(196, 30, 58, 0.3)" : `${node.color}33`}
                />
              )}

              {/* Pulse animation for affected events */}
              {isAffected && (
                <circle
                  r={node.radius + 8}
                  className="animate-ping"
                  fill="none"
                  stroke="#C41E3A"
                  strokeWidth={2}
                  opacity={0.5}
                />
              )}

              {/* Node circle */}
              <circle
                r={node.radius}
                fill={node.color}
                className={cn(
                  "transition-all duration-200",
                  isConditional && "opacity-70"
                )}
                stroke={isHovered || isDragging ? "#FFFFFF" : "transparent"}
                strokeWidth={2}
              />

              {/* Conditional indicator */}
              {isConditional && (
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white text-[10px] font-bold pointer-events-none"
                >
                  C
                </text>
              )}

              {/* Probability text inside node for primary events */}
              {isPrimary && (
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white text-xs font-bold pointer-events-none"
                >
                  {Math.round(node.event.probability * 100)}%
                </text>
              )}

              {/* Event name label */}
              <text
                y={node.radius + 16}
                textAnchor="middle"
                className={cn(
                  "text-xs font-semibold pointer-events-none",
                  isConditional ? "fill-muted-foreground" : "fill-foreground"
                )}
              >
                {truncateName(node.event.name)}
              </text>

              {/* Median date label */}
              <text
                y={node.radius + 30}
                textAnchor="middle"
                className="text-[10px] fill-muted-foreground pointer-events-none"
              >
                {node.event.medianQuarter} {node.event.medianYear}
              </text>

              {/* Delta indicator for adjusted events */}
              {isAffected && (
                <g transform={`translate(${node.radius - 5}, ${-node.radius + 5})`}>
                  <circle r={10} fill="#C41E3A" />
                  <Zap className="h-3 w-3 text-white" style={{ transform: 'translate(-6px, -6px)' }} />
                </g>
              )}
            </g>
          );
        })}

        {/* Drag ghost indicator */}
        {draggingNode && dragX !== null && (
          <g>
            <line
              x1={dragX}
              y1={60}
              x2={dragX}
              y2={maxY - 20}
              stroke="#C41E3A"
              strokeWidth={2}
              strokeDasharray="4,4"
              opacity={0.7}
            />
            <text
              x={dragX}
              y={maxY - 5}
              textAnchor="middle"
              className="fill-primary text-xs font-bold"
            >
              {(() => {
                const { quarter, year } = getQuarterFromX(dragX);
                return `${quarter} ${year}`;
              })()}
            </text>
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {hoveredNode && !draggingNode && (
        <div
          className="fixed z-50 bg-card border border-border rounded-lg shadow-xl p-3 max-w-xs pointer-events-none"
          style={{
            left: tooltipPos.x + 15,
            top: tooltipPos.y + 15
          }}
        >
          {(() => {
            const event = filteredEvents.find(e => e.name === hoveredNode);
            if (!event) return null;
            
            return (
              <>
                <div className="font-semibold text-foreground mb-1">{event.name}</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CATEGORY_COLORS[event.category] }}
                    />
                    <span className="capitalize">{event.category}</span>
                  </div>
                  <div>{event.medianQuarter} {event.medianYear}</div>
                  <div className="font-medium">{Math.round(event.probability * 100)}% probability</div>
                  {!event.isPrimary && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <AlertTriangle className="h-3 w-3" />
                      <span>CONDITIONAL</span>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-border/30">
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <div key={category} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <span className="text-muted-foreground capitalize">{category}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-muted-foreground" />
          <span>Hard dependency</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-muted-foreground/40 border-dashed border-t border-muted-foreground/40" style={{ borderStyle: 'dashed' }} />
          <span>Soft dependency</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-muted-foreground/50 flex items-center justify-center text-[8px] text-white font-bold">C</div>
          <span>Conditional event</span>
        </div>
      </div>
    </div>
  );
}