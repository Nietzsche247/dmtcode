import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { type ForecastEvent, type DependencyRule, quarterToNumber, CATEGORY_COLORS } from "@/lib/forecasts-api";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RotateCcw, Share2, Check, Link, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface WhatIfSliderPanelProps {
  events: ForecastEvent[];
  dependencyRules: DependencyRule[];
  onAdjustmentsChange: (adjustments: Record<string, AdjustedEventData>) => void;
}

export interface AdjustedEventData {
  originalPosition: number;
  adjustedPosition: number;
  deltaQuarters: number;
  isManuallyAdjusted: boolean;
  cascadeSource?: string;
}

// Timeline constants
const TIMELINE_START = 2025;
const TIMELINE_END = 2035;

// Get current quarter as numeric value
const getCurrentQuarterNumeric = (): number => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const quarter = Math.floor(month / 3);
  return year + (quarter * 0.25);
};

// Convert median string to numeric
const medianToNumeric = (median: string): number => {
  const match = median.match(/(Q[1-4])\s*(\d{4})/);
  if (!match) return 2028;
  const quarter = match[1];
  const year = parseInt(match[2]);
  const quarterOffset = { Q1: 0, Q2: 0.25, Q3: 0.5, Q4: 0.75 }[quarter] || 0;
  return year + quarterOffset;
};

// Numeric to median string
const numericToMedian = (value: number): string => {
  const year = Math.floor(value);
  const fraction = value - year;
  let quarter = 'Q1';
  if (fraction >= 0.75) quarter = 'Q4';
  else if (fraction >= 0.5) quarter = 'Q3';
  else if (fraction >= 0.25) quarter = 'Q2';
  return `${quarter} ${year}`;
};

// Get short name for display
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
  if (name.includes('Superintelligence') || name.includes('ASI')) return 'ASI';
  if (name.includes('Chip')) return 'Chip Shortage';
  if (name.includes('Taiwan')) return 'Taiwan Conflict';
  if (name.includes('Unemployment')) return 'Unemployment';
  return name.substring(0, 18);
};

// Encode adjustments to URL
const encodeAdjustments = (values: Record<string, number>, initial: Record<string, number>): string => {
  const changes: string[] = [];
  Object.entries(values).forEach(([key, value]) => {
    if (Math.abs(value - initial[key]) > 0.01) {
      const shortKey = key.replace(/\s+/g, '_');
      changes.push(`${shortKey}:${value.toFixed(2)}`);
    }
  });
  return changes.join(',');
};

// Decode adjustments from URL
const decodeAdjustments = (encoded: string): Record<string, number> => {
  const result: Record<string, number> = {};
  if (!encoded) return result;
  
  encoded.split(',').forEach(pair => {
    const [key, value] = pair.split(':');
    if (key && value) {
      const normalKey = key.replace(/_/g, ' ');
      result[normalKey] = parseFloat(value);
    }
  });
  return result;
};

export function WhatIfSliderPanel({ events, dependencyRules, onAdjustmentsChange }: WhatIfSliderPanelProps) {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  
  const minDateValue = useMemo(() => getCurrentQuarterNumeric(), []);

  // Build dependency map from rules
  const dependencyMap = useMemo(() => {
    const map: Record<string, { targets: { name: string; ratio: number; floor?: string }[] }> = {};
    
    dependencyRules.forEach(rule => {
      const sourceShort = getShortName(rule.source_event);
      const targetShort = getShortName(rule.target_event);
      
      if (!map[sourceShort]) {
        map[sourceShort] = { targets: [] };
      }
      
      if (!map[sourceShort].targets.some(t => t.name === targetShort)) {
        map[sourceShort].targets.push({
          name: targetShort,
          ratio: rule.shift_ratio,
          floor: rule.constraint_floor || undefined
        });
      }
    });
    
    return map;
  }, [dependencyRules]);

  // Get source events (events that trigger cascades)
  const sourceEvents = useMemo(() => {
    const sourceNames = new Set(dependencyRules.map(r => r.source_event));
    return events.filter(e => {
      const shortName = getShortName(e.name);
      return Array.from(sourceNames).some(s => getShortName(s) === shortName);
    });
  }, [events, dependencyRules]);

  // Initialize values from events
  const initialValues = useMemo(() => {
    const values: Record<string, number> = {};
    events.forEach(event => {
      const shortName = getShortName(event.name);
      values[shortName] = medianToNumeric(event.median);
    });
    return values;
  }, [events]);

  const [adjustedValues, setAdjustedValues] = useState<Record<string, number>>(initialValues);
  const [manuallyAdjusted, setManuallyAdjusted] = useState<Set<string>>(new Set());

  // Load from URL on mount
  useEffect(() => {
    const scenario = searchParams.get('scenario');
    if (scenario && Object.keys(initialValues).length > 0) {
      const decoded = decodeAdjustments(scenario);
      if (Object.keys(decoded).length > 0) {
        const merged = { ...initialValues, ...decoded };
        setAdjustedValues(merged);
        setManuallyAdjusted(new Set(Object.keys(decoded)));
      }
    }
  }, [searchParams, initialValues]);

  // Calculate cascade with depth limit
  const calculateCascade = useCallback((
    source: string,
    newValue: number,
    current: Record<string, number>,
    visited: Set<string> = new Set(),
    depth: number = 0
  ): Record<string, number> => {
    if (visited.has(source) || depth >= 5) return current;
    visited.add(source);

    const originalValue = initialValues[source];
    const shift = newValue - originalValue;
    
    const rules = dependencyMap[source];
    if (!rules) return current;

    let updated = { ...current };
    
    rules.targets.forEach(target => {
      if (manuallyAdjusted.has(target.name)) return;
      
      const targetOriginal = initialValues[target.name];
      if (targetOriginal === undefined) return;
      
      let cascadeShift = shift * target.ratio;
      let newTargetValue = targetOriginal + cascadeShift;
      
      // Apply constraint floor if set
      if (target.floor) {
        const floorMatch = target.floor.match(/(Q[1-4])\s*(\d{4})/);
        if (floorMatch) {
          const floorValue = medianToNumeric(target.floor);
          newTargetValue = Math.max(floorValue, newTargetValue);
        }
      }
      
      // Apply minimum date floor
      newTargetValue = Math.max(minDateValue, newTargetValue);
      
      updated[target.name] = newTargetValue;
      
      // Recursive cascade
      updated = calculateCascade(target.name, newTargetValue, updated, visited, depth + 1);
    });

    return updated;
  }, [initialValues, manuallyAdjusted, dependencyMap, minDateValue]);

  // Handle slider change - instant cascade
  const handleSliderChange = useCallback((shortName: string, value: number[]) => {
    const newValue = value[0];
    
    setManuallyAdjusted(prev => new Set(prev).add(shortName));
    
    setAdjustedValues(prev => {
      const updated = { ...prev, [shortName]: newValue };
      const cascaded = calculateCascade(shortName, newValue, updated);
      return cascaded;
    });

    // Track with PostHog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('whatif_slider_moved', {
        event_name: shortName,
        new_value: newValue,
        original_value: initialValues[shortName]
      });
    }
  }, [calculateCascade, initialValues]);

  // Report adjustments to parent
  useEffect(() => {
    const adjustments: Record<string, AdjustedEventData> = {};
    
    events.forEach(event => {
      const shortName = getShortName(event.name);
      const original = initialValues[shortName];
      const adjusted = adjustedValues[shortName] || original;
      const deltaQuarters = Math.round((adjusted - original) * 4);
      
      // Find cascade source
      let cascadeSource: string | undefined;
      if (!manuallyAdjusted.has(shortName) && deltaQuarters !== 0) {
        for (const [source, rules] of Object.entries(dependencyMap)) {
          if (rules.targets.some(t => t.name === shortName)) {
            const sourceAdjusted = adjustedValues[source];
            const sourceOriginal = initialValues[source];
            if (sourceAdjusted !== undefined && Math.abs(sourceAdjusted - sourceOriginal) > 0.01) {
              cascadeSource = source;
              break;
            }
          }
        }
      }

      adjustments[event.name] = {
        originalPosition: original,
        adjustedPosition: adjusted,
        deltaQuarters,
        isManuallyAdjusted: manuallyAdjusted.has(shortName),
        cascadeSource
      };
    });
    
    onAdjustmentsChange(adjustments);
  }, [adjustedValues, events, initialValues, manuallyAdjusted, dependencyMap, onAdjustmentsChange]);

  // Reset
  const handleReset = useCallback(() => {
    setAdjustedValues(initialValues);
    setManuallyAdjusted(new Set());
    searchParams.delete('scenario');
    setSearchParams(searchParams);
    
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('whatif_reset');
    }
  }, [initialValues, searchParams, setSearchParams]);

  // Share
  const handleShare = useCallback(async () => {
    const encoded = encodeAdjustments(adjustedValues, initialValues);
    
    if (!encoded) {
      toast({ title: "Nothing to share", description: "Make some adjustments first." });
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('scenario', encoded);
    
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setSearchParams({ scenario: encoded });
      toast({ title: "Link copied!", description: "Share this URL to let others see your scenario." });
      
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('whatif_share');
      }
    } catch {
      toast({ title: "Share URL", description: url.toString() });
    }
  }, [adjustedValues, initialValues, setSearchParams]);

  const hasChanges = useMemo(() => {
    return Object.entries(adjustedValues).some(([key, val]) => 
      Math.abs(val - initialValues[key]) > 0.01
    );
  }, [adjustedValues, initialValues]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground">Event Sliders</h3>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            disabled={!hasChanges}
            className="h-7 px-2 text-xs gap-1"
          >
            {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
            {isMobile ? '' : 'Share'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            disabled={!hasChanges}
            className="h-7 px-2 text-xs gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            {isMobile ? '' : 'Reset'}
          </Button>
        </div>
      </div>

      {/* Sliders - Two column grid, condensed 40% */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-1">
        {sourceEvents.map((event) => {
          const shortName = getShortName(event.name);
          const original = initialValues[shortName];
          const current = adjustedValues[shortName] || original;
          const deltaQuarters = Math.round((current - original) * 4);

          return (
            <div 
              key={event.name} 
              className={cn(
                "p-2 rounded-lg border transition-all duration-200",
                deltaQuarters !== 0 
                  ? "bg-card border-border shadow-sm" 
                  : "bg-card/50 border-border/50"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Link className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-foreground truncate max-w-[80px]">
                    {shortName}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-muted-foreground">{numericToMedian(current)}</span>
                  {deltaQuarters !== 0 && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[8px] px-0.5 py-0 h-3",
                        deltaQuarters > 0 ? "border-destructive/50 text-destructive" : "border-green-500/50 text-green-500"
                      )}
                    >
                      {deltaQuarters > 0 ? '+' : ''}{deltaQuarters}Q
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[8px] text-muted-foreground w-6">{TIMELINE_START}</span>
                <div className="flex-1 relative">
                  <Slider
                    value={[current]}
                    onValueChange={(value) => handleSliderChange(shortName, value)}
                    min={TIMELINE_START}
                    max={TIMELINE_END}
                    step={0.25}
                    className="flex-1 h-4"
                  />
                </div>
                <span className="text-[8px] text-muted-foreground w-6 text-right">{TIMELINE_END}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {hasChanges && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-muted-foreground">Earlier: </span>
              <span className="text-green-500 font-medium">
                {Object.entries(adjustedValues).filter(([k, v]) => v < initialValues[k] - 0.01).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Later: </span>
              <span className="text-destructive font-medium">
                {Object.entries(adjustedValues).filter(([k, v]) => v > initialValues[k] + 0.01).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}