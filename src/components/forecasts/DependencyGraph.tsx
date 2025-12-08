import { useMemo, useState } from "react";
import { type ForecastEvent } from "@/lib/forecasts-api";
import { cn } from "@/lib/utils";
import { AlertTriangle, Zap, TrendingUp } from "lucide-react";

interface DependencyGraphProps {
  events: ForecastEvent[];
  onEventClick?: (event: ForecastEvent) => void;
}

interface Node {
  id: string;
  name: string;
  shortName: string;
  type: 'positive' | 'negative' | 'foundation';
  x: number;
  y: number;
  median: string;
}

interface Edge {
  from: string;
  to: string;
  type: 'tier1' | 'tier2' | 'tier3';
  label?: string;
}

// Predefined layout positions for the 10 events
const NODE_POSITIONS: Record<string, { x: number; y: number; row: number }> = {
  'AI Agents': { x: 100, y: 80, row: 0 },
  'Novel Reasoning': { x: 280, y: 80, row: 0 },
  'Bio-Attack': { x: 100, y: 200, row: 1 },
  'AGI': { x: 460, y: 80, row: 0 },
  'RSI': { x: 640, y: 80, row: 0 },
  'Robots': { x: 460, y: 200, row: 1 },
  'Quantum': { x: 640, y: 200, row: 1 },
  'Q-AI': { x: 460, y: 320, row: 2 },
  'Encryption': { x: 640, y: 320, row: 2 },
  'Anti-Aging': { x: 550, y: 420, row: 3 },
};

// Map event names to short identifiers
const getShortName = (name: string): string => {
  if (name.includes('Agents')) return 'AI Agents';
  if (name.includes('Reasoning')) return 'Novel Reasoning';
  if (name.includes('Bio') || name.includes('Attack')) return 'Bio-Attack';
  if (name.includes('AGI') || name.includes('General Intelligence')) return 'AGI';
  if (name.includes('Recursive') || name.includes('RSI')) return 'RSI';
  if (name.includes('Robot')) return 'Robots';
  if (name.includes('Quantum') && name.includes('Mainstream')) return 'Quantum';
  if (name.includes('Quantum') && name.includes('AI')) return 'Q-AI';
  if (name.includes('Encryption') || name.includes('RSA')) return 'Encryption';
  if (name.includes('Anti-Aging') || name.includes('Aging')) return 'Anti-Aging';
  return name.substring(0, 12);
};

// Define edges based on typical dependency patterns
const DEPENDENCY_EDGES: Edge[] = [
  { from: 'AI Agents', to: 'Novel Reasoning', type: 'tier1', label: 'Enables' },
  { from: 'Novel Reasoning', to: 'AGI', type: 'tier1', label: 'Foundation' },
  { from: 'AGI', to: 'RSI', type: 'tier1', label: 'Triggers' },
  { from: 'AGI', to: 'Robots', type: 'tier2', label: 'Accelerates' },
  { from: 'RSI', to: 'Quantum', type: 'tier2', label: 'Accelerates' },
  { from: 'Quantum', to: 'Q-AI', type: 'tier1', label: 'Enables' },
  { from: 'Quantum', to: 'Encryption', type: 'tier1', label: 'Threatens' },
  { from: 'Q-AI', to: 'Anti-Aging', type: 'tier2', label: 'Accelerates' },
  { from: 'AGI', to: 'Bio-Attack', type: 'tier3', label: 'Risk' },
];

export function DependencyGraph({ events, onEventClick }: DependencyGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const nodes = useMemo((): Node[] => {
    return events.map(event => {
      const shortName = getShortName(event.name);
      const position = NODE_POSITIONS[shortName] || { x: 400, y: 250 };
      
      return {
        id: shortName,
        name: event.name,
        shortName,
        type: event.type,
        x: position.x,
        y: position.y,
        median: event.median,
      };
    });
  }, [events]);

  const edges = useMemo(() => {
    // Filter edges to only include nodes that exist
    const nodeIds = new Set(nodes.map(n => n.id));
    return DEPENDENCY_EDGES.filter(e => nodeIds.has(e.from) && nodeIds.has(e.to));
  }, [nodes]);

  const isConnected = (nodeId: string) => {
    if (!selectedNode) return true;
    if (nodeId === selectedNode) return true;
    return edges.some(e => 
      (e.from === selectedNode && e.to === nodeId) ||
      (e.to === selectedNode && e.from === nodeId)
    );
  };

  const isEdgeConnected = (edge: Edge) => {
    if (!selectedNode) return true;
    return edge.from === selectedNode || edge.to === selectedNode;
  };

  const getNodeColor = (type: 'positive' | 'negative' | 'foundation', isNegative: boolean) => {
    if (isNegative || type === 'negative') return 'fill-destructive';
    if (type === 'foundation') return 'fill-yellow-500';
    return 'fill-primary';
  };

  const getNodeBorder = (type: 'positive' | 'negative' | 'foundation', isNegative: boolean) => {
    if (isNegative || type === 'negative') return 'stroke-destructive';
    if (type === 'foundation') return 'stroke-yellow-500';
    return 'stroke-primary';
  };

  const getEdgeColor = (type: Edge['type']) => {
    switch (type) {
      case 'tier1': return 'stroke-primary';
      case 'tier2': return 'stroke-muted-foreground';
      case 'tier3': return 'stroke-muted-foreground/50';
    }
  };

  const getEdgeStyle = (type: Edge['type']) => {
    switch (type) {
      case 'tier1': return '';
      case 'tier2': return '8,4';
      case 'tier3': return '4,4';
    }
  };

  const isNegativeNode = (name: string) => {
    return name.includes('Bio-Attack') || name.includes('Encryption');
  };

  const getNodeById = (id: string) => nodes.find(n => n.id === id);

  const handleNodeClick = (node: Node) => {
    if (selectedNode === node.id) {
      setSelectedNode(null);
    } else {
      setSelectedNode(node.id);
    }
    const event = events.find(e => getShortName(e.name) === node.id);
    if (event && onEventClick) {
      onEventClick(event);
    }
  };

  return (
    <div className="w-full">
      <div className="relative overflow-x-auto">
        <svg 
          viewBox="0 0 800 500" 
          className="w-full min-w-[600px] h-auto"
          style={{ minHeight: '400px' }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border/20" />
            </pattern>
            
            {/* Arrow marker */}
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" className="fill-muted-foreground" />
            </marker>
            <marker
              id="arrowhead-primary"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" className="fill-primary" />
            </marker>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Edges */}
          {edges.map((edge, idx) => {
            const fromNode = getNodeById(edge.from);
            const toNode = getNodeById(edge.to);
            if (!fromNode || !toNode) return null;

            const connected = isEdgeConnected(edge);
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;
            
            // Calculate control point for curved lines
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const curve = Math.min(Math.abs(dx), Math.abs(dy)) * 0.2;
            
            return (
              <g key={idx} className={cn("transition-opacity duration-200", !connected && "opacity-20")}>
                <path
                  d={`M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY - curve} ${toNode.x} ${toNode.y}`}
                  fill="none"
                  className={cn(getEdgeColor(edge.type), "transition-all duration-200")}
                  strokeWidth={edge.type === 'tier1' ? 2.5 : 1.5}
                  strokeDasharray={getEdgeStyle(edge.type)}
                  markerEnd={edge.type === 'tier1' ? "url(#arrowhead-primary)" : "url(#arrowhead)"}
                />
                {/* Edge label */}
                {edge.label && connected && (
                  <text
                    x={midX}
                    y={midY - curve - 8}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px] font-medium"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isHovered = hoveredNode === node.id;
            const isSelected = selectedNode === node.id;
            const connected = isConnected(node.id);
            const negative = isNegativeNode(node.id);
            
            return (
              <g
                key={node.id}
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  !connected && "opacity-30"
                )}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(node)}
                transform={`translate(${node.x}, ${node.y})`}
              >
                {/* Glow effect for hovered/selected */}
                {(isHovered || isSelected) && (
                  <circle
                    r={40}
                    className={cn(
                      "transition-all duration-200",
                      negative ? "fill-destructive/20" : 
                      node.type === 'foundation' ? "fill-yellow-500/20" : "fill-primary/20"
                    )}
                  />
                )}
                
                {/* Node circle */}
                <circle
                  r={isHovered || isSelected ? 32 : 28}
                  className={cn(
                    "transition-all duration-200 fill-card",
                    getNodeBorder(node.type, negative),
                    isSelected ? "stroke-[3]" : "stroke-2"
                  )}
                />
                
                {/* Inner circle */}
                <circle
                  r={6}
                  className={cn(
                    "transition-all duration-200",
                    getNodeColor(node.type, negative)
                  )}
                />
                
                {/* Icon for negative events */}
                {negative && (
                  <g transform="translate(-8, -8)">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </g>
                )}
                
                {/* Node label */}
                <text
                  y={45}
                  textAnchor="middle"
                  className={cn(
                    "text-xs font-semibold transition-all duration-200",
                    negative ? "fill-destructive" : "fill-foreground"
                  )}
                >
                  {node.shortName}
                </text>
                
                {/* Median date */}
                <text
                  y={58}
                  textAnchor="middle"
                  className="text-[10px] fill-muted-foreground"
                >
                  {node.median}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-6 pt-4 border-t border-border/30">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-0.5 bg-primary" />
          <span className="text-muted-foreground">Tier 1 (Mandatory)</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-0.5 bg-muted-foreground border-dashed border-t-2 border-muted-foreground" style={{ borderStyle: 'dashed' }} />
          <span className="text-muted-foreground">Tier 2 (Strong)</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-0.5 bg-muted-foreground/50 border-dotted border-t-2 border-muted-foreground/50" style={{ borderStyle: 'dotted' }} />
          <span className="text-muted-foreground">Tier 3 (Conditional)</span>
        </div>
      </div>
      
      <p className="text-center text-xs text-muted-foreground mt-4">
        Click a node to highlight its connections. Click again to deselect.
      </p>
    </div>
  );
}
