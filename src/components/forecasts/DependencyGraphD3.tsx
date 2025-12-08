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
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

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

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

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
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", d => d.isCriticalChain ? "#C41E3A" : "hsl(var(--muted-foreground))")
      .attr("stroke-opacity", d => d.isCriticalChain ? 0.9 : 0.3)
      .attr("stroke-width", d => d.isCriticalChain ? 3 : 1)
      .attr("marker-end", d => d.isCriticalChain ? "url(#arrow-critical)" : "url(#arrow)");

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

    // Node circles
    node.append("circle")
      .attr("r", d => {
        if (CRITICAL_CHAIN.includes(d.id)) return 18;
        return d.isPrimary ? 14 : 10;
      })
      .attr("fill", d => CATEGORY_COLORS[d.category] || CATEGORY_COLORS.default)
      .attr("stroke", d => CRITICAL_CHAIN.includes(d.id) ? "#C41E3A" : "hsl(var(--background))")
      .attr("stroke-width", d => CRITICAL_CHAIN.includes(d.id) ? 3 : 2)
      .on("mouseenter", (_, d) => setHoveredNode(d.id))
      .on("mouseleave", () => setHoveredNode(null))
      .on("click", (_, d) => onEventClick?.(d.event));

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