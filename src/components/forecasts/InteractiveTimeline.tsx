import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { ForecastEvent, DependencyRule } from "@/lib/forecasts-api";
import { CATEGORY_COLORS, quarterToNumber, type EventCategory } from "@/lib/forecasts-api";
import { type CascadeState, formatDelta } from "@/hooks/useCascadeEngine";
import { type ConfidenceTier } from "./ConfidenceTierFilters";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Particle animation state
interface Particle {
  id: number;
  pathIndex: number;
  offset: number;
  speed: number;
}

interface InteractiveTimelineProps {
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
const SPINE_NODE_RADIUS = 28;
const CHILD_NODE_RADIUS = 18;

// Base dimensions for the timeline content (will be scaled by zoom)
const BASE_WIDTH = 1600;
const BASE_HEIGHT = 600;

const QUARTER_OPTIONS = (() => {
  const options: { quarter: string; year: number; label: string }[] = [];
  for (let year = TIMELINE_START_YEAR; year <= TIMELINE_END_YEAR; year++) {
    for (let q = 1; q <= 4; q++) {
      options.push({ quarter: `Q${q}`, year, label: `Q${q} ${year}` });
    }
  }
  return options;
})();

interface TimelineNode {
  id: string;
  event: ForecastEvent;
  isSpine: boolean;
  parentId?: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  magnitude: number; // 0-1 scale for pulse intensity
}

// Get magnitude based on event importance
function getEventMagnitude(event: ForecastEvent): number {
  // Higher probability distributions = more certain = higher magnitude
  const maxProb = Math.max(...event.distributions.map(d => d.probability));
  // Critical chain events get boosted magnitude
  const isCritical = SPINE_EVENT_NAMES.includes(event.name);
  const criticalBoost = isCritical ? 0.3 : 0;
  return Math.min(1, (maxProb + criticalBoost));
}

export function InteractiveTimeline({
  events,
  dependencyRules,
  confidenceTier,
  onEventClick,
  onEventDrag,
  adjustedEvents,
  affectedEvents,
  cascadeState
}: InteractiveTimelineProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);
  
  // Interaction state
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragCurrentX, setDragCurrentX] = useState(0);
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartX, setPanStartX] = useState(0);
  
  // Calculate dimensions based on zoom
  const viewportHeight = isMobile ? 500 : 650;
  const contentWidth = BASE_WIDTH * zoom;
  const contentHeight = BASE_HEIGHT * zoom;
  
  // Resize observer for container width
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Filter and categorize events
  const { spineEvents, childEventsByParent } = useMemo(() => {
    const spine = events.filter(e => SPINE_EVENT_NAMES.includes(e.name));
    
    // Group child events by their parent (based on dependencies)
    const childMap = new Map<string, ForecastEvent[]>();
    
    events.forEach(event => {
      if (SPINE_EVENT_NAMES.includes(event.name)) return;
      
      // Check confidence tier filter
      if (confidenceTier === 'high') return;
      if (confidenceTier === 'medium' && !event.distributions.some(d => d.probability >= 0.6)) return;
      if (confidenceTier === 'speculative' && !event.distributions.some(d => d.probability < 0.6)) return;
      
      // Find parent from dependency rules
      const parentRule = dependencyRules.find(r => r.target_event === event.name);
      const parentName = parentRule?.source_event || event.dependencies.depends_on[0];
      
      if (parentName && SPINE_EVENT_NAMES.includes(parentName)) {
        const existing = childMap.get(parentName) || [];
        existing.push(event);
        childMap.set(parentName, existing);
      }
    });
    
    return { spineEvents: spine, childEventsByParent: childMap };
  }, [events, dependencyRules, confidenceTier]);

  // Sort spine events chronologically
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

  // Calculate node positions in content space
  const getXPosition = useCallback((year: number, quarter: string) => {
    const margin = 150;
    const usableWidth = BASE_WIDTH - margin * 2;
    const quarterIndex = (year - TIMELINE_START_YEAR) * 4 + quarterToNumber(quarter) - 1;
    return margin + (quarterIndex / Math.max(TOTAL_QUARTERS - 1, 1)) * usableWidth;
  }, []);

  // Build nodes array
  const nodes = useMemo((): TimelineNode[] => {
    const result: TimelineNode[] = [];
    const centerY = BASE_HEIGHT / 2;
    
    sortedSpineEvents.forEach((event) => {
      const adjusted = adjustedEvents?.get(event.name);
      const year = adjusted?.year || event.medianYear;
      const quarter = adjusted?.quarter || event.medianQuarter;
      const x = getXPosition(year, quarter);
      const magnitude = getEventMagnitude(event);
      
      result.push({
        id: event.name,
        event,
        isSpine: true,
        x,
        y: centerY,
        baseX: getXPosition(event.medianYear, event.medianQuarter),
        baseY: centerY,
        magnitude
      });
      
      // Add children if expanded
      if (expandedNodes.has(event.name)) {
        const children = childEventsByParent.get(event.name) || [];
        children.forEach((child, i) => {
          const childAdjusted = adjustedEvents?.get(child.name);
          const childYear = childAdjusted?.year || child.medianYear;
          const childQuarter = childAdjusted?.quarter || child.medianQuarter;
          const childX = getXPosition(childYear, childQuarter);
          // Alternate above/below with increasing offset
          const yOffset = (i % 2 === 0 ? -1 : 1) * (90 + Math.floor(i / 2) * 65);
          
          result.push({
            id: child.name,
            event: child,
            isSpine: false,
            parentId: event.name,
            x: childX,
            y: centerY + yOffset,
            baseX: getXPosition(child.medianYear, child.medianQuarter),
            baseY: centerY + yOffset,
            magnitude: getEventMagnitude(child)
          });
        });
      }
    });
    
    return result;
  }, [sortedSpineEvents, childEventsByParent, expandedNodes, adjustedEvents, getXPosition]);

  // Get quarter index for dragging
  const getQuarterIndex = useCallback((x: number): number => {
    const margin = 150;
    const usableWidth = BASE_WIDTH - margin * 2;
    const ratio = Math.max(0, Math.min(1, (x - margin) / usableWidth));
    return Math.round(ratio * (TOTAL_QUARTERS - 1));
  }, []);

  // Handle node click to toggle expansion
  const handleNodeClick = useCallback((nodeId: string, isSpine: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpine) {
      setExpandedNodes(prev => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });
    }
  }, []);

  // Handle text click for detail panel
  const handleTextClick = useCallback((event: ForecastEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick(event);
  }, [onEventClick]);

  // Drag handlers
  const handleDragStart = useCallback((nodeId: string, clientX: number) => {
    if (!onEventDrag) return;
    const node = nodes.find(n => n.id === nodeId);
    if (!node?.isSpine) return;
    
    setDragNode(nodeId);
    setDragStartX(clientX);
    setDragCurrentX(clientX);
  }, [nodes, onEventDrag]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!dragNode) return;
    setDragCurrentX(clientX);
  }, [dragNode]);

  const handleDragEnd = useCallback(() => {
    if (!dragNode || !onEventDrag) {
      setDragNode(null);
      return;
    }

    const node = nodes.find(n => n.id === dragNode);
    if (!node) {
      setDragNode(null);
      return;
    }

    const deltaX = (dragCurrentX - dragStartX) / zoom;
    const newX = node.x + deltaX;
    const quarterIndex = getQuarterIndex(newX);
    const option = QUARTER_OPTIONS[Math.min(quarterIndex, QUARTER_OPTIONS.length - 1)];
    
    onEventDrag(dragNode, option.quarter, option.year);
    setDragNode(null);
  }, [dragNode, dragStartX, dragCurrentX, nodes, onEventDrag, getQuarterIndex, zoom]);

  // Pan handlers
  const handlePanStart = useCallback((clientX: number) => {
    if (dragNode) return;
    setIsPanning(true);
    setPanStartX(clientX - panX);
  }, [dragNode, panX]);

  const handlePanMove = useCallback((clientX: number) => {
    if (!isPanning) return;
    const newPanX = clientX - panStartX;
    // Limit panning
    const maxPan = Math.max(0, contentWidth - containerWidth);
    setPanX(Math.max(-maxPan, Math.min(0, newPanX)));
  }, [isPanning, panStartX, contentWidth, containerWidth]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Global mouse/touch listeners
  useEffect(() => {
    if (!dragNode && !isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragNode) handleDragMove(e.clientX);
      if (isPanning) handlePanMove(e.clientX);
    };
    const handleMouseUp = () => {
      handleDragEnd();
      handlePanEnd();
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        if (dragNode) handleDragMove(e.touches[0].clientX);
        if (isPanning) handlePanMove(e.touches[0].clientX);
      }
    };
    const handleTouchEnd = () => {
      handleDragEnd();
      handlePanEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    document.body.style.cursor = dragNode ? 'grabbing' : 'move';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragNode, isPanning, handleDragMove, handleDragEnd, handlePanMove, handlePanEnd]);

  // Calculate drag delta for preview
  const getDragDelta = useCallback(() => {
    if (!dragNode) return null;
    const node = nodes.find(n => n.id === dragNode);
    if (!node) return null;
    
    const deltaX = (dragCurrentX - dragStartX) / zoom;
    const currentQuarterIndex = getQuarterIndex(node.x);
    const newQuarterIndex = getQuarterIndex(node.x + deltaX);
    const quarterChange = newQuarterIndex - currentQuarterIndex;
    
    return { deltaX, quarterChange };
  }, [dragNode, dragStartX, dragCurrentX, nodes, getQuarterIndex, zoom]);

  const dragDelta = getDragDelta();

  // Zoom controls
  const handleZoom = useCallback((direction: 'in' | 'out' | 'reset') => {
    if (direction === 'reset') {
      setZoom(1);
      setPanX(0);
    } else {
      const factor = direction === 'in' ? 1.25 : 0.8;
      setZoom(prev => Math.max(0.6, Math.min(2.5, prev * factor)));
    }
  }, []);

  // Year markers
  const yearMarkers = useMemo(() => {
    const markers = [];
    for (let year = TIMELINE_START_YEAR; year <= TIMELINE_END_YEAR; year++) {
      const x = getXPosition(year, 'Q1');
      markers.push({ year, x });
    }
    return markers;
  }, [getXPosition]);

  // Get color for category
  const getCategoryColor = (category: EventCategory): string => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  };

  // Particle animation state
  const [particleTime, setParticleTime] = useState(0);
  const animationRef = useRef<number>();
  
  // Generate particles for critical chain
  const particles = useMemo((): Particle[] => {
    const spineNodes = nodes.filter(n => n.isSpine);
    const result: Particle[] = [];
    let id = 0;
    
    for (let i = 0; i < spineNodes.length - 1; i++) {
      // 3 particles per connection with different offsets
      for (let j = 0; j < 3; j++) {
        result.push({
          id: id++,
          pathIndex: i,
          offset: j * 0.33,
          speed: 0.008 + Math.random() * 0.004
        });
      }
    }
    return result;
  }, [nodes]);
  
  // Particle animation loop
  useEffect(() => {
    const animate = () => {
      setParticleTime(prev => prev + 1);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Calculate particle position along quadratic bezier curve
  const getParticlePosition = useCallback((
    sourceX: number, sourceY: number, 
    targetX: number, targetY: number,
    progress: number
  ) => {
    // Control point for quadratic bezier
    const midX = (sourceX + targetX) / 2;
    const controlY = sourceY - 40;
    
    // Quadratic bezier formula: (1-t)²P0 + 2(1-t)tP1 + t²P2
    const t = progress;
    const mt = 1 - t;
    
    const x = mt * mt * (sourceX + SPINE_NODE_RADIUS) + 
              2 * mt * t * midX + 
              t * t * (targetX - SPINE_NODE_RADIUS);
    const y = mt * mt * sourceY + 
              2 * mt * t * controlY + 
              t * t * targetY;
    
    return { x, y };
  }, []);

  // Render spine connections
  const renderConnections = () => {
    const spineNodes = nodes.filter(n => n.isSpine);
    const connections: React.ReactNode[] = [];
    
    // Spine-to-spine connections (critical chain)
    for (let i = 0; i < spineNodes.length - 1; i++) {
      const source = spineNodes[i];
      const target = spineNodes[i + 1];
      
      // Find the dependency rule for this connection
      const rule = dependencyRules.find(
        r => r.source_event === source.event.name && r.target_event === target.event.name
      );
      const shiftRatio = rule?.shift_ratio || 0.8;
      
      // Calculate positions with drag offset
      let sourceX = source.x;
      let targetX = target.x;
      if (dragNode === source.id && dragDelta) {
        sourceX += dragDelta.deltaX;
      }
      if (dragNode === target.id && dragDelta) {
        targetX += dragDelta.deltaX;
      }
      
      // Curved path
      const midX = (sourceX + targetX) / 2;
      const midY = source.y - 40;
      const path = `M ${sourceX + SPINE_NODE_RADIUS} ${source.y} 
                    Q ${midX} ${midY} ${targetX - SPINE_NODE_RADIUS} ${target.y}`;
      
      connections.push(
        <path
          key={`spine-${i}`}
          d={path}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={3}
          strokeOpacity={0.7}
          className="transition-all duration-300"
          style={{
            filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.5))'
          }}
        />
      );
      
      // Shift percentage label
      const labelX = midX;
      const labelY = midY - 12;
      connections.push(
        <text
          key={`label-${i}`}
          x={labelX}
          y={labelY}
          textAnchor="middle"
          fontSize="12px"
          fontWeight="600"
          fill="hsl(var(--primary))"
          className="select-none pointer-events-none"
        >
          {(shiftRatio * 100).toFixed(0)}%
        </text>
      );
    }
    
    // Parent-to-child connections
    nodes.filter(n => !n.isSpine && n.parentId).forEach(child => {
      const parent = nodes.find(n => n.id === child.parentId);
      if (!parent) return;
      
      let parentX = parent.x;
      if (dragNode === parent.id && dragDelta) {
        parentX += dragDelta.deltaX;
      }
      
      const startY = parent.y + (child.y > parent.y ? SPINE_NODE_RADIUS : -SPINE_NODE_RADIUS);
      const endY = child.y + (child.y > parent.y ? -CHILD_NODE_RADIUS : CHILD_NODE_RADIUS);
      
      connections.push(
        <line
          key={`child-${child.id}`}
          x1={parentX}
          y1={startY}
          x2={child.x}
          y2={endY}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={1.5}
          strokeOpacity={0.4}
          strokeDasharray="4,4"
          className="transition-all duration-300"
        />
      );
    });
    
    return connections;
  };
  
  // Render flowing particles
  const renderParticles = () => {
    const spineNodes = nodes.filter(n => n.isSpine);
    
    return particles.map(particle => {
      if (particle.pathIndex >= spineNodes.length - 1) return null;
      
      const source = spineNodes[particle.pathIndex];
      const target = spineNodes[particle.pathIndex + 1];
      
      // Calculate positions with drag offset
      let sourceX = source.x;
      let targetX = target.x;
      if (dragNode === source.id && dragDelta) {
        sourceX += dragDelta.deltaX;
      }
      if (dragNode === target.id && dragDelta) {
        targetX += dragDelta.deltaX;
      }
      
      // Calculate progress along path
      const progress = ((particleTime * particle.speed + particle.offset) % 1);
      const pos = getParticlePosition(sourceX, source.y, targetX, target.y, progress);
      
      // Fade in at start, fade out at end
      let opacity = 0.9;
      if (progress < 0.1) opacity = progress * 9;
      if (progress > 0.9) opacity = (1 - progress) * 9;
      
      return (
        <circle
          key={`particle-${particle.id}`}
          cx={pos.x}
          cy={pos.y}
          r={4}
          fill="#FF6B6B"
          opacity={opacity}
          style={{
            filter: 'drop-shadow(0 0 4px #FF6B6B)'
          }}
        />
      );
    });
  };

  // Render node with magnitude-based pulsing
  const renderNode = (node: TimelineNode) => {
    const { event, isSpine, id, magnitude } = node;
    const adjusted = adjustedEvents?.get(id);
    const deltaQuarters = adjusted?.deltaQuarters || 0;
    const hasShifted = deltaQuarters !== 0;
    const isAffected = affectedEvents?.has(id);
    const isExpanded = expandedNodes.has(id);
    const isHovered = hoveredNode === id;
    const isDragging = dragNode === id;
    const hasChildren = (childEventsByParent.get(id)?.length || 0) > 0;
    
    const radius = isSpine ? SPINE_NODE_RADIUS : CHILD_NODE_RADIUS;
    const color = getCategoryColor(event.category);
    
    // Calculate position with drag offset
    let displayX = node.x;
    if (isDragging && dragDelta) {
      displayX = node.x + dragDelta.deltaX;
    }
    
    // Calculate pulse animation duration based on magnitude (higher = faster pulse)
    const pulseDuration = 2.5 - (magnitude * 1.5); // 1s to 2.5s
    const pulseMaxRadius = radius + 8 + (magnitude * 16); // Higher magnitude = larger pulse
    
    return (
      <g
        key={id}
        className={cn(
          "transition-opacity duration-300",
          isAffected && !isDragging && "animate-pulse"
        )}
        style={{
          opacity: expandedNodes.size > 0 && !isExpanded && isSpine && !expandedNodes.has(id) ? 0.5 : 1
        }}
        transform={`translate(${displayX}, ${node.y})`}
      >
        {/* Magnitude-based animated pulse rings for spine nodes */}
        {isSpine && (
          <>
            {/* Primary pulse ring - magnitude determines intensity */}
            <circle
              r={radius + 8}
              fill="none"
              stroke={color}
              strokeWidth={2}
              style={{
                filter: `drop-shadow(0 0 ${8 + magnitude * 8}px ${color})`,
                animation: `pulse-expand-${id.replace(/[^a-zA-Z0-9]/g, '')} ${pulseDuration}s ease-in-out infinite`
              }}
            />
            {/* Secondary pulse ring (offset animation) */}
            <circle
              r={radius + 8}
              fill="none"
              stroke="#FF6B6B"
              strokeWidth={1.5}
              style={{
                filter: `drop-shadow(0 0 ${6 + magnitude * 6}px #FF6B6B)`,
                animation: `pulse-expand-2-${id.replace(/[^a-zA-Z0-9]/g, '')} ${pulseDuration}s ease-in-out infinite`,
                animationDelay: `${pulseDuration / 2}s`
              }}
            />
            {/* Define unique keyframes for this node's magnitude */}
            <style>{`
              @keyframes pulse-expand-${id.replace(/[^a-zA-Z0-9]/g, '')} {
                0%, 100% {
                  r: ${radius + 8};
                  opacity: ${0.5 + magnitude * 0.3};
                  stroke-width: 2;
                }
                50% {
                  r: ${pulseMaxRadius};
                  opacity: ${0.2 + magnitude * 0.2};
                  stroke-width: 1;
                }
              }
              @keyframes pulse-expand-2-${id.replace(/[^a-zA-Z0-9]/g, '')} {
                0%, 100% {
                  r: ${radius + 8};
                  opacity: ${0.3 + magnitude * 0.2};
                  stroke-width: 1.5;
                }
                50% {
                  r: ${pulseMaxRadius + 8};
                  opacity: 0.1;
                  stroke-width: 0.5;
                }
              }
            `}</style>
            {/* Static outer ring */}
            <circle
              r={radius + 8}
              fill="none"
              stroke={color}
              strokeWidth={1}
              strokeOpacity={isHovered || isDragging ? 0.8 : 0.2}
              className="transition-all duration-300"
            />
          </>
        )}
        
        {/* Original position ghost */}
        {hasShifted && (
          <circle
            cx={node.baseX - displayX}
            cy={0}
            r={radius * 0.5}
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            strokeDasharray="2,2"
            strokeOpacity={0.4}
          />
        )}
        
        {/* Main node circle */}
        <circle
          r={radius}
          fill={color}
          stroke={hasShifted ? "hsl(var(--primary))" : "hsl(var(--background))"}
          strokeWidth={hasShifted ? 3 : 2}
          className={cn(
            "transition-all duration-200 cursor-pointer",
            isSpine && onEventDrag && "cursor-grab active:cursor-grabbing"
          )}
          filter={isSpine ? (isHovered || isDragging ? "url(#spine-glow-intense)" : "url(#spine-glow)") : undefined}
          onMouseEnter={() => setHoveredNode(id)}
          onMouseLeave={() => setHoveredNode(null)}
          onClick={(e) => handleNodeClick(id, isSpine, e)}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (isSpine) handleDragStart(id, e.clientX);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            if (isSpine && e.touches[0]) handleDragStart(id, e.touches[0].clientX);
          }}
        />
        
        {/* Expand/collapse indicator for spine nodes with children */}
        {isSpine && hasChildren && confidenceTier !== 'high' && (
          <g
            className="cursor-pointer"
            transform={`translate(0, ${radius + 16})`}
            onClick={(e) => {
              e.stopPropagation();
              handleNodeClick(id, true, e);
            }}
          >
            <circle
              r={12}
              fill="hsl(var(--background))"
              stroke="hsl(var(--border))"
              strokeWidth={1.5}
            />
            <text
              y={1}
              textAnchor="middle"
              className="text-[12px] fill-foreground font-bold select-none"
              style={{ dominantBaseline: 'middle' }}
            >
              {isExpanded ? '−' : '+'}
            </text>
          </g>
        )}
        
        {/* Node label */}
        <text
          y={radius + (isSpine && hasChildren && confidenceTier !== 'high' ? 38 : 22)}
          textAnchor="middle"
          className={cn(
            "fill-foreground cursor-pointer hover:fill-primary transition-colors select-none",
            isSpine ? "text-[13px] font-semibold" : "text-[11px]"
          )}
          onClick={(e) => handleTextClick(event, e as unknown as React.MouseEvent)}
        >
          {event.name.length > 32 ? event.name.slice(0, 30) + '...' : event.name}
        </text>
        
        {/* Date badge */}
        <text
          y={radius + (isSpine && hasChildren && confidenceTier !== 'high' ? 54 : 38)}
          textAnchor="middle"
          className="text-[11px] fill-muted-foreground select-none"
        >
          {adjusted?.quarter || event.medianQuarter} {adjusted?.year || event.medianYear}
        </text>
        
        {/* Delta badge */}
        {hasShifted && (
          <g transform={`translate(${radius + 8}, ${-radius - 8})`}>
            <rect
              x={-16}
              y={-10}
              width={32}
              height={20}
              rx={5}
              fill="hsl(var(--primary))"
            />
            <text
              textAnchor="middle"
              dy={4}
              className="text-[10px] fill-primary-foreground font-semibold"
            >
              {formatDelta(deltaQuarters)}
            </text>
          </g>
        )}
        
        {/* Drag preview badge */}
        {isDragging && dragDelta && dragDelta.quarterChange !== 0 && (
          <g transform={`translate(0, ${-radius - 30})`}>
            <rect
              x={-28}
              y={-14}
              width={56}
              height={28}
              rx={7}
              fill="hsl(var(--primary))"
              fillOpacity={0.95}
            />
            <text
              textAnchor="middle"
              dy={5}
              className="text-[13px] fill-primary-foreground font-bold"
            >
              {dragDelta.quarterChange > 0 ? '+' : ''}{dragDelta.quarterChange}Q
            </text>
          </g>
        )}
      </g>
    );
  };

  // Tooltip for hovered node
  const renderTooltip = () => {
    if (!hoveredNode || dragNode) return null;
    
    const node = nodes.find(n => n.id === hoveredNode);
    if (!node) return null;
    
    const { event, x, y, isSpine } = node;
    const adjusted = adjustedEvents?.get(event.name);
    const hasChildren = (childEventsByParent.get(event.name)?.length || 0) > 0;
    
    // Calculate position relative to container
    const tooltipX = (x * zoom + panX);
    const tooltipY = (y * zoom - (isSpine ? SPINE_NODE_RADIUS : CHILD_NODE_RADIUS) * zoom - 120);
    
    return (
      <div
        className="absolute z-50 pointer-events-none"
        style={{
          left: tooltipX,
          top: Math.max(60, tooltipY),
          transform: 'translateX(-50%)'
        }}
      >
        <div className="bg-popover border border-border rounded-lg p-4 shadow-xl max-w-[280px]">
          <h4 className="font-semibold text-sm text-foreground mb-1">{event.name}</h4>
          <p className="text-xs text-muted-foreground mb-2">
            Target: {adjusted?.quarter || event.medianQuarter} {adjusted?.year || event.medianYear}
          </p>
          {event.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-3">{event.description}</p>
          )}
          <p className="text-[11px] text-primary font-medium">
            {isSpine && hasChildren && confidenceTier !== 'high' 
              ? 'Click node to expand · Click label for details' 
              : 'Click label for full details'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom('out')}
            className="h-9 w-9 p-0"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom('in')}
            className="h-9 w-9 p-0"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom('reset')}
            className="h-9 px-3"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset View
          </Button>
          <span className="text-xs text-muted-foreground ml-2">{Math.round(zoom * 100)}%</span>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-3 md:gap-4 text-[11px] md:text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-[#3B82F6]" />
            <span>AI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-[#F59E0B]" />
            <span>Foundation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-[#EC4899]" />
            <span>Robotics</span>
          </div>
          <div className="hidden md:flex items-center gap-2 border-l border-border pl-3">
            <div className="w-6 h-0.5 bg-primary rounded" />
            <span>Critical Chain</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 border-l border-border pl-3">
            <span className="text-primary font-medium">80%</span>
            <span>Cascade Strength</span>
          </div>
        </div>
      </div>
      
      {/* Cascade strength tooltip */}
      <p className="text-[11px] md:text-xs text-muted-foreground/70 text-center max-w-2xl mx-auto">
        Percentages indicate cascade strength: when an upstream event shifts, downstream events shift proportionally. An 80% cascade means a 4-quarter delay upstream causes a 3.2-quarter delay downstream.
      </p>

      {/* Timeline container - self-contained with fixed height */}
      <div 
        ref={containerRef}
        className="relative w-full bg-card/20 border border-border/50 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ height: viewportHeight }}
        onMouseDown={(e) => handlePanStart(e.clientX)}
        onTouchStart={(e) => e.touches[0] && handlePanStart(e.touches[0].clientX)}
      >
        {/* Year axis - fixed at top */}
        <div className="absolute top-0 left-0 right-0 h-14 border-b border-border/30 bg-background/80 backdrop-blur-sm z-20">
          <div 
            className="relative h-full"
            style={{
              transform: `translateX(${panX}px)`,
              width: contentWidth
            }}
          >
            {yearMarkers.map(({ year, x }) => (
              <div
                key={year}
                className="absolute top-0 h-full flex flex-col items-center justify-center"
                style={{ left: x * zoom }}
              >
                <span className="text-sm font-bold text-foreground">{year}</span>
                <div className="absolute bottom-0 w-px h-3 bg-border" />
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable SVG timeline */}
        <div
          className="absolute top-14 left-0 right-0 bottom-0 overflow-hidden"
        >
          <svg
            width={contentWidth}
            height={contentHeight}
            style={{
              transform: `translateX(${panX}px)`
            }}
          >
            {/* Filters and animation styles */}
            <defs>
              {/* Glow filter for spine nodes */}
              <filter id="spine-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              
              {/* Intense glow for hovered/dragging state */}
              <filter id="spine-glow-intense" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              
              {/* Pulsing background gradient */}
              <radialGradient id="bg-pulse-gradient" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.06">
                  <animate 
                    attributeName="stop-opacity" 
                    values="0.06;0.12;0.06" 
                    dur="4s" 
                    repeatCount="indefinite" 
                  />
                </stop>
                <stop offset="40%" stopColor="hsl(var(--primary))" stopOpacity="0.03">
                  <animate 
                    attributeName="stop-opacity" 
                    values="0.03;0.06;0.03" 
                    dur="4s" 
                    repeatCount="indefinite" 
                  />
                </stop>
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              
              {/* Secondary ambient glow */}
              <radialGradient id="bg-ambient-glow" cx="30%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.04">
                  <animate 
                    attributeName="stop-opacity" 
                    values="0.04;0.08;0.04" 
                    dur="3s" 
                    repeatCount="indefinite" 
                  />
                </stop>
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              
              <radialGradient id="bg-ambient-glow-2" cx="70%" cy="60%" r="45%">
                <stop offset="0%" stopColor="#EC4899" stopOpacity="0.03">
                  <animate 
                    attributeName="stop-opacity" 
                    values="0.03;0.06;0.03" 
                    dur="5s" 
                    repeatCount="indefinite" 
                  />
                </stop>
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </defs>
            
            {/* Pulsing background layers */}
            <rect 
              x="0" 
              y="0" 
              width={contentWidth} 
              height={contentHeight} 
              fill="url(#bg-pulse-gradient)" 
            />
            <rect 
              x="0" 
              y="0" 
              width={contentWidth} 
              height={contentHeight} 
              fill="url(#bg-ambient-glow)" 
            />
            <rect 
              x="0" 
              y="0" 
              width={contentWidth} 
              height={contentHeight} 
              fill="url(#bg-ambient-glow-2)" 
            />
            
            {/* Floating dust particles */}
            <g className="dust-particles">
              {Array.from({ length: 15 }).map((_, i) => {
                const startX = (i * 107) % contentWidth;
                const startY = (i * 67) % contentHeight;
                const size = 1.5 + (i % 3) * 0.5;
                const duration = 18 + (i % 10) * 4;
                const delay = i * 0.8;
                const opacity = 0.12 + (i % 5) * 0.04;
                
                return (
                  <circle
                    key={`dust-${i}`}
                    r={size}
                    fill="hsl(var(--foreground))"
                    opacity={opacity}
                  >
                    <animate
                      attributeName="cx"
                      values={`${startX};${startX + 50};${startX - 30};${startX + 40};${startX}`}
                      dur={`${duration}s`}
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      values={`${startY};${startY - 40};${startY + 30};${startY - 50};${startY}`}
                      dur={`${duration}s`}
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                );
              })}
            </g>
            
            <g transform={`scale(${zoom})`}>
              {/* Grid lines */}
              {yearMarkers.map(({ year, x }) => (
                <line
                  key={`grid-${year}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={BASE_HEIGHT}
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.15}
                  strokeDasharray="6,10"
                />
              ))}
              
              {/* Center guideline */}
              <line
                x1={150}
                y1={BASE_HEIGHT / 2}
                x2={BASE_WIDTH - 150}
                y2={BASE_HEIGHT / 2}
                stroke="hsl(var(--border))"
                strokeOpacity={0.1}
              />
              
              {/* Connections */}
              {renderConnections()}
              
              {/* Flowing particles on critical chain */}
              {renderParticles()}
              
              {/* Nodes */}
              {nodes.map(renderNode)}
            </g>
          </svg>
        </div>

        {/* Tooltip */}
        {renderTooltip()}
        
        {/* Instructions */}
        <div className="absolute bottom-3 left-3 text-[11px] text-muted-foreground bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50">
          {isMobile 
            ? 'Tap nodes to expand · Drag to pan · Pinch to zoom' 
            : 'Click nodes to expand · Drag nodes to simulate cascades · Drag background to pan'}
        </div>
      </div>
    </div>
  );
}
