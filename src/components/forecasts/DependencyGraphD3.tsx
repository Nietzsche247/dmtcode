import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { ForecastEvent, DependencyRule } from "@/lib/forecasts-api";
import { CATEGORY_COLORS, type EventCategory } from "@/lib/forecasts-api";

interface DependencyGraphD3Props {
  events: ForecastEvent[];
  dependencyRules: DependencyRule[];
  onEventClick?: (event: ForecastEvent) => void;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  event: ForecastEvent;
  category: EventCategory;
  isPrimary: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  rule: DependencyRule;
  isCriticalChain: boolean;
}

// Critical chain events (foundation sequence)
const CRITICAL_CHAIN = [
  "AI Novel Reasoning",
  "AGI",
  "Recursive Self-Improvement (RSI)",
  "ASI",
  "ASI Omniscience"
];

export function DependencyGraphD3({ events, dependencyRules, onEventClick }: DependencyGraphD3Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const miniMapRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [viewportRect, setViewportRect] = useState({ x: 0, y: 0, width: 100, height: 100, scale: 1 });

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(500, Math.min(700, entry.contentRect.width * 0.6))
        });
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || events.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create nodes from events
    const nodes: GraphNode[] = events.map(event => ({
      id: event.name,
      event,
      category: event.category,
      isPrimary: event.isPrimary
    }));

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Create links from dependency rules
    const links: GraphLink[] = dependencyRules
      .filter(rule => nodeMap.has(rule.source_event) && nodeMap.has(rule.target_event))
      .map(rule => {
        const sourceIdx = CRITICAL_CHAIN.indexOf(rule.source_event);
        const targetIdx = CRITICAL_CHAIN.indexOf(rule.target_event);
        const isCriticalChain = sourceIdx !== -1 && targetIdx !== -1 && targetIdx === sourceIdx + 1;
        
        return {
          source: rule.source_event,
          target: rule.target_event,
          rule,
          isCriticalChain
        };
      });

    // Create container group
    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add zoom behavior with mini-map sync
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        
        // Update viewport rect for mini-map
        const transform = event.transform;
        setViewportRect({
          x: -transform.x / transform.k,
          y: -transform.y / transform.k,
          width: width / transform.k,
          height: height / transform.k,
          scale: transform.k
        });
      });

    svg.call(zoom);
    
    // Store zoom for mini-map interaction
    (svgRef.current as any).__zoom = zoom;

    // Gradient definitions for critical chain
    const defs = svg.append("defs");
    
    const gradient = defs.append("linearGradient")
      .attr("id", "critical-chain-gradient")
      .attr("gradientUnits", "userSpaceOnUse");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#C41E3A");
    
    gradient.append("stop")
      .attr("offset", "50%")
      .attr("stop-color", "#FF6B6B");
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#C41E3A");

    // Glow filter for critical chain nodes
    const glowFilter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    
    glowFilter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    
    const glowMerge = glowFilter.append("feMerge");
    glowMerge.append("feMergeNode").attr("in", "coloredBlur");
    glowMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Pulse animation filter
    const pulseFilter = defs.append("filter")
      .attr("id", "pulse-glow")
      .attr("x", "-100%")
      .attr("y", "-100%")
      .attr("width", "300%")
      .attr("height", "300%");
    
    pulseFilter.append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "coloredBlur");
    
    const pulseMerge = pulseFilter.append("feMerge");
    pulseMerge.append("feMergeNode").attr("in", "coloredBlur");
    pulseMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Arrow marker
    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "hsl(var(--muted-foreground))")
      .attr("d", "M0,-5L10,0L0,5");

    defs.append("marker")
      .attr("id", "arrow-critical")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#C41E3A")
      .attr("d", "M0,-5L10,0L0,5");

    // Force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(d => d.isCriticalChain ? 80 : 120)
        .strength(d => d.isCriticalChain ? 1 : 0.3))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force("collision", d3.forceCollide().radius(40))
      .force("x", d3.forceX(innerWidth / 2).strength(0.05))
      .force("y", d3.forceY(innerHeight / 2).strength(0.05));

    // Draw links
    const linkGroup = g.append("g").attr("class", "links");
    
    const link = linkGroup
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", d => d.isCriticalChain ? "#C41E3A" : "hsl(var(--muted-foreground))")
      .attr("stroke-opacity", d => d.isCriticalChain ? 0.9 : 0.3)
      .attr("stroke-width", d => d.isCriticalChain ? 3 : 1)
      .attr("marker-end", d => d.isCriticalChain ? "url(#arrow-critical)" : "url(#arrow)");

    // Flowing particles on critical chain edges
    const criticalLinks = links.filter(l => l.isCriticalChain);
    const particleGroup = g.append("g").attr("class", "particles");
    
    // Create multiple particles per critical link
    const particles: { link: GraphLink; offset: number; speed: number }[] = [];
    criticalLinks.forEach(link => {
      // 3 particles per link with different offsets
      for (let i = 0; i < 3; i++) {
        particles.push({
          link,
          offset: i * 0.33,
          speed: 0.008 + Math.random() * 0.004
        });
      }
    });

    const particleCircles = particleGroup
      .selectAll("circle")
      .data(particles)
      .enter()
      .append("circle")
      .attr("r", 3)
      .attr("fill", "#FF6B6B")
      .attr("filter", "url(#glow)")
      .attr("opacity", 0.9);

    // Particle animation loop
    let particleTime = 0;
    const animateParticles = () => {
      particleTime += 1;
      
      particleCircles.attr("cx", d => {
        const source = d.link.source as GraphNode;
        const target = d.link.target as GraphNode;
        if (!source.x || !target.x) return 0;
        const progress = ((particleTime * d.speed + d.offset) % 1);
        return source.x + (target.x - source.x) * progress;
      })
      .attr("cy", d => {
        const source = d.link.source as GraphNode;
        const target = d.link.target as GraphNode;
        if (!source.y || !target.y) return 0;
        const progress = ((particleTime * d.speed + d.offset) % 1);
        return source.y + (target.y - source.y) * progress;
      })
      .attr("opacity", d => {
        const progress = ((particleTime * d.speed + d.offset) % 1);
        // Fade in at start, fade out at end
        if (progress < 0.1) return progress * 9;
        if (progress > 0.9) return (1 - progress) * 9;
        return 0.9;
      });

      requestAnimationFrame(animateParticles);
    };
    
    const particleAnimation = requestAnimationFrame(animateParticles);

    // Link labels (shift ratio)
    const linkLabels = g.append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(links.filter(l => l.isCriticalChain))
      .enter()
      .append("text")
      .attr("font-size", "10px")
      .attr("fill", "#C41E3A")
      .attr("text-anchor", "middle")
      .text(d => `${(d.rule.shift_ratio * 100).toFixed(0)}%`);

    // Draw nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Pulse ring for critical chain nodes (behind main circle)
    node.filter(d => CRITICAL_CHAIN.includes(d.id))
      .append("circle")
      .attr("class", "pulse-ring")
      .attr("r", 18)
      .attr("fill", "none")
      .attr("stroke", "#C41E3A")
      .attr("stroke-width", 2)
      .attr("opacity", 0.6)
      .attr("filter", "url(#pulse-glow)");

    // Second pulse ring with offset animation
    node.filter(d => CRITICAL_CHAIN.includes(d.id))
      .append("circle")
      .attr("class", "pulse-ring-2")
      .attr("r", 18)
      .attr("fill", "none")
      .attr("stroke", "#FF6B6B")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.4)
      .attr("filter", "url(#pulse-glow)");

    // Node circles
    node.append("circle")
      .attr("class", "node-circle")
      .attr("r", d => {
        if (CRITICAL_CHAIN.includes(d.id)) return 18;
        return d.isPrimary ? 14 : 10;
      })
      .attr("fill", d => CATEGORY_COLORS[d.category] || CATEGORY_COLORS.default)
      .attr("stroke", d => CRITICAL_CHAIN.includes(d.id) ? "#C41E3A" : "hsl(var(--background))")
      .attr("stroke-width", d => CRITICAL_CHAIN.includes(d.id) ? 3 : 2)
      .attr("filter", d => CRITICAL_CHAIN.includes(d.id) ? "url(#glow)" : "none")
      .on("mouseenter", (_, d) => setHoveredNode(d.id))
      .on("mouseleave", () => setHoveredNode(null))
      .on("click", (_, d) => onEventClick?.(d.event));

    // Animated pulse effect for critical chain nodes
    const pulseAnimation = () => {
      const time = Date.now() / 1000;
      
      svg.selectAll(".pulse-ring")
        .attr("r", 18 + Math.sin(time * 2) * 6)
        .attr("opacity", 0.3 + Math.sin(time * 2) * 0.3)
        .attr("stroke-width", 1 + Math.sin(time * 2) * 1.5);

      svg.selectAll(".pulse-ring-2")
        .attr("r", 18 + Math.sin(time * 2 + Math.PI) * 8)
        .attr("opacity", 0.2 + Math.sin(time * 2 + Math.PI) * 0.2)
        .attr("stroke-width", 1 + Math.sin(time * 2 + Math.PI) * 1);

      requestAnimationFrame(pulseAnimation);
    };
    
    const pulseAnimationId = requestAnimationFrame(pulseAnimation);

    // Node labels
    node.append("text")
      .attr("dy", d => {
        if (CRITICAL_CHAIN.includes(d.id)) return 30;
        return d.isPrimary ? 26 : 22;
      })
      .attr("text-anchor", "middle")
      .attr("font-size", d => CRITICAL_CHAIN.includes(d.id) ? "11px" : "9px")
      .attr("font-weight", d => CRITICAL_CHAIN.includes(d.id) ? "bold" : "normal")
      .attr("fill", "hsl(var(--foreground))")
      .text(d => {
        const name = d.id;
        if (name.length > 20) return name.slice(0, 18) + "...";
        return name;
      });

    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);

      linkLabels
        .attr("x", d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr("y", d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2 - 5);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Initial animation
    simulation.alpha(1).restart();

    return () => {
      simulation.stop();
      cancelAnimationFrame(particleAnimation);
      cancelAnimationFrame(pulseAnimationId);
    };
  }, [events, dependencyRules, dimensions, onEventClick]);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
          <span>AI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
          <span>Geopolitical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
          <span>Economic</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
          <span>Quantum</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#10B981]" />
          <span>Biological</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#EC4899]" />
          <span>Robotics</span>
        </div>
        <div className="flex items-center gap-2 border-l border-border pl-4">
          <div className="w-6 h-0.5 bg-[#C41E3A]" />
          <span>Critical Chain</span>
        </div>
      </div>

      {/* Graph container */}
      <div 
        ref={containerRef} 
        className="relative w-full bg-card/20 border border-border/50 rounded-xl overflow-hidden"
      >
        <svg ref={svgRef} className="w-full" />
        
        {/* Mini-map overlay */}
        <div className="absolute bottom-4 right-4 w-40 h-28 bg-card/90 backdrop-blur-sm border border-border/70 rounded-lg overflow-hidden shadow-xl z-20">
          <div className="absolute top-1 left-2 text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
            Overview
          </div>
          <svg 
            ref={miniMapRef}
            className="w-full h-full cursor-move"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            preserveAspectRatio="xMidYMid meet"
            onClick={(e) => {
              if (!svgRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const scaleX = dimensions.width / rect.width;
              const scaleY = dimensions.height / rect.height;
              const clickX = (e.clientX - rect.left) * scaleX;
              const clickY = (e.clientY - rect.top) * scaleY;
              
              const svg = d3.select(svgRef.current);
              const zoom = (svgRef.current as any).__zoom;
              if (zoom) {
                const currentTransform = d3.zoomTransform(svgRef.current);
                const newX = dimensions.width / 2 - clickX * currentTransform.k;
                const newY = dimensions.height / 2 - clickY * currentTransform.k;
                svg.transition().duration(300).call(
                  zoom.transform,
                  d3.zoomIdentity.translate(newX, newY).scale(currentTransform.k)
                );
              }
            }}
          >
            {/* Render simplified nodes */}
            {events.map((event, i) => {
              const angle = (i / events.length) * 2 * Math.PI;
              const radius = Math.min(dimensions.width, dimensions.height) * 0.35;
              const cx = dimensions.width / 2 + Math.cos(angle) * radius;
              const cy = dimensions.height / 2 + Math.sin(angle) * radius;
              const isCritical = CRITICAL_CHAIN.includes(event.name);
              return (
                <circle
                  key={event.name}
                  cx={cx}
                  cy={cy}
                  r={isCritical ? 8 : 5}
                  fill={CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default}
                  opacity={0.8}
                />
              );
            })}
            
            {/* Viewport rectangle */}
            <rect
              x={viewportRect.x}
              y={viewportRect.y}
              width={viewportRect.width}
              height={viewportRect.height}
              fill="hsl(var(--primary) / 0.1)"
              stroke="hsl(var(--primary))"
              strokeWidth={3 / viewportRect.scale}
              rx={4}
            />
          </svg>
        </div>
        
        {/* Hover tooltip */}
        {hoveredNode && (
          <div className="absolute top-4 left-4 bg-card border border-border rounded-lg p-3 shadow-xl max-w-xs pointer-events-none z-10">
            <p className="font-semibold text-foreground text-sm">{hoveredNode}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {events.find(e => e.name === hoveredNode)?.median}
            </p>
            <p className="text-xs text-muted-foreground">
              Click to view details · Drag to reposition
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <p className="text-xs text-center text-muted-foreground">
        Drag nodes to explore · Scroll to zoom · Click nodes for details · 
        <span className="text-primary font-medium ml-1">Red path = critical AI chain</span>
      </p>
    </div>
  );
}