import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { type ForecastEvent, type DependencyRule } from "@/lib/forecasts-api";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RotateCcw, ArrowRight, AlertTriangle, Zap, TrendingUp, Share2, Check, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface WhatIfSimulatorProps {
  events: ForecastEvent[];
  dependencyRules: DependencyRule[];
}

interface AdjustedEvent {
  name: string;
  originalMedian: string;
  adjustedMedian: string;
  quarterOffset: number;
  isManuallyAdjusted: boolean;
  cascadeSource?: string;
}

// Get current quarter as numeric value (floor for all adjustments)
const getCurrentQuarterNumeric = (): number => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  const quarter = Math.floor(month / 3); // 0-3
  return year + (quarter * 0.25);
};

// Quarter to numeric value (Q1 2025 = 2025.0, Q2 2025 = 2025.25, etc.)
const medianToNumeric = (median: string): number => {
  const match = median.match(/(Q[1-4])\s*(\d{4})/);
  if (!match) return 2028;
  const quarter = match[1];
  const year = parseInt(match[2]);
  const quarterOffset = { Q1: 0, Q2: 0.25, Q3: 0.5, Q4: 0.75 }[quarter] || 0;
  return year + quarterOffset;
};

// Numeric value back to median string
const numericToMedian = (value: number): string => {
  const year = Math.floor(value);
  const fraction = value - year;
  let quarter = 'Q1';
  if (fraction >= 0.75) quarter = 'Q4';
  else if (fraction >= 0.5) quarter = 'Q3';
  else if (fraction >= 0.25) quarter = 'Q2';
  return `${quarter} ${year}`;
};

// Short name mapping
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
  return name.substring(0, 15);
};

// Build dependency rules map from database rules
const buildDependencyRulesMap = (rules: DependencyRule[]): Record<string, { targets: { name: string; ratio: number }[] }> => {
  const rulesMap: Record<string, { targets: { name: string; ratio: number }[] }> = {};
  
  rules.forEach(rule => {
    const sourceShort = getShortName(rule.source_event);
    const targetShort = getShortName(rule.target_event);
    
    if (!rulesMap[sourceShort]) {
      rulesMap[sourceShort] = { targets: [] };
    }
    
    // Avoid duplicate targets
    if (!rulesMap[sourceShort].targets.some(t => t.name === targetShort)) {
      rulesMap[sourceShort].targets.push({
        name: targetShort,
        ratio: rule.shift_ratio
      });
    }
  });
  
  console.log('[WhatIfSimulator] Built dependency rules from database:', rulesMap);
  return rulesMap;
};

// Encode adjustments to URL-safe string
const encodeAdjustments = (values: Record<string, number>, initial: Record<string, number>): string => {
  const changes: string[] = [];
  Object.entries(values).forEach(([key, value]) => {
    if (value !== initial[key]) {
      const shortKey = key.replace(/\s+/g, '_');
      changes.push(`${shortKey}:${value.toFixed(2)}`);
    }
  });
  return changes.join(',');
};

// Decode adjustments from URL string
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

export function WhatIfSimulator({ events, dependencyRules }: WhatIfSimulatorProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  
  // Build dynamic dependency rules map from database
  const dynamicRulesMap = useMemo(() => {
    return buildDependencyRulesMap(dependencyRules);
  }, [dependencyRules]);
  
  // Calculate the minimum allowed date (current quarter)
  const minDateValue = useMemo(() => getCurrentQuarterNumeric(), []);
  
  // Initialize adjusted values from original events
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

  // Load state from URL on mount
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

  // Calculate cascading effects using dynamic rules
  const calculateCascade = useCallback((
    source: string, 
    newValue: number, 
    current: Record<string, number>,
    visited: Set<string> = new Set()
  ): Record<string, number> => {
    if (visited.has(source)) return current;
    visited.add(source);

    const originalValue = initialValues[source];
    const shift = newValue - originalValue;
    
    const rules = dynamicRulesMap[source];
    if (!rules) return current;

    let updated = { ...current };
    
    rules.targets.forEach(target => {
      if (manuallyAdjusted.has(target.name)) return; // Don't cascade to manually adjusted
      
      const targetOriginal = initialValues[target.name];
      if (targetOriginal === undefined) return;
      
      const cascadeShift = shift * target.ratio;
      const newTargetValue = Math.max(minDateValue, targetOriginal + cascadeShift);
      
      updated[target.name] = newTargetValue;
      
      // Recursively cascade
      updated = calculateCascade(target.name, newTargetValue, updated, visited);
    });

    return updated;
  }, [initialValues, manuallyAdjusted, dynamicRulesMap, minDateValue]);

  // Handle slider change
  const handleSliderChange = (shortName: string, value: number[]) => {
    const newValue = value[0];
    
    setManuallyAdjusted(prev => new Set(prev).add(shortName));
    
    setAdjustedValues(prev => {
      const updated = { ...prev, [shortName]: newValue };
      return calculateCascade(shortName, newValue, updated);
    });
  };

  // Reset all adjustments
  const handleReset = () => {
    setAdjustedValues(initialValues);
    setManuallyAdjusted(new Set());
    // Clear URL params
    searchParams.delete('scenario');
    setSearchParams(searchParams);
  };

  // Generate and copy share URL
  const handleShare = async () => {
    const encoded = encodeAdjustments(adjustedValues, initialValues);
    
    if (!encoded) {
      toast({
        title: "Nothing to share",
        description: "Make some adjustments first to create a scenario.",
      });
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('scenario', encoded);
    
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Also update the URL without reload
      setSearchParams({ scenario: encoded });
      
      toast({
        title: "Link copied!",
        description: "Share this URL to let others see your scenario.",
      });
    } catch (err) {
      // Fallback for browsers without clipboard API
      toast({
        title: "Share URL",
        description: url.toString(),
      });
    }
  };

  // Calculate adjusted events for display
  const adjustedEvents = useMemo((): AdjustedEvent[] => {
    return events.map(event => {
      const shortName = getShortName(event.name);
      const original = medianToNumeric(event.median);
      const adjusted = adjustedValues[shortName] || original;
      const quarterOffset = Math.round((adjusted - original) * 4);
      
      // Find cascade source using dynamic rules
      let cascadeSource: string | undefined;
      if (!manuallyAdjusted.has(shortName) && quarterOffset !== 0) {
        // Find which event caused this cascade
        for (const [source, rules] of Object.entries(dynamicRulesMap)) {
          if (rules.targets.some(t => t.name === shortName)) {
            const sourceAdjusted = adjustedValues[source];
            const sourceOriginal = initialValues[source];
            if (sourceAdjusted !== sourceOriginal) {
              cascadeSource = source;
              break;
            }
          }
        }
      }

      return {
        name: shortName,
        originalMedian: event.median,
        adjustedMedian: numericToMedian(adjusted),
        quarterOffset,
        isManuallyAdjusted: manuallyAdjusted.has(shortName),
        cascadeSource,
      };
    });
  }, [events, adjustedValues, initialValues, manuallyAdjusted, dynamicRulesMap]);

  const hasChanges = useMemo(() => {
    return adjustedEvents.some(e => e.quarterOffset !== 0);
  }, [adjustedEvents]);

  const isNegativeEvent = (name: string) => {
    return name.includes('Bio-Attack') || name.includes('Encryption');
  };

  const getEventType = (name: string): 'positive' | 'negative' | 'foundation' => {
    if (isNegativeEvent(name)) return 'negative';
    if (name === 'AGI') return 'foundation';
    return 'positive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Drag the sliders to shift event timelines and see how changes cascade through dependencies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
            disabled={!hasChanges}
            className="gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Share Scenario'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            disabled={!hasChanges}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Shared Scenario Indicator */}
      {searchParams.get('scenario') && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm">
          <Link2 className="h-4 w-4 text-primary" />
          <span className="text-foreground">
            Viewing a shared scenario. 
            <button 
              onClick={handleReset} 
              className="ml-1 text-primary hover:underline"
            >
              Reset to defaults
            </button>
          </span>
        </div>
      )}

      {/* Event Sliders */}
      <div className="space-y-4">
        {adjustedEvents.map((event) => {
          const original = medianToNumeric(event.originalMedian);
          const type = getEventType(event.name);
          
          return (
            <div 
              key={event.name} 
              className={cn(
                "p-4 rounded-lg border transition-all duration-200",
                event.quarterOffset !== 0 
                  ? "bg-card border-border shadow-sm" 
                  : "bg-card/50 border-border/50"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {type === 'negative' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  {type === 'foundation' && <Zap className="h-4 w-4 text-yellow-500" />}
                  {type === 'positive' && <TrendingUp className="h-4 w-4 text-primary" />}
                  <span className={cn(
                    "font-semibold",
                    type === 'negative' ? "text-destructive" : "text-foreground"
                  )}>
                    {event.name}
                  </span>
                  {event.isManuallyAdjusted && (
                    <Badge variant="secondary" className="text-xs">Manual</Badge>
                  )}
                  {event.cascadeSource && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <span className="text-muted-foreground">via</span> {event.cascadeSource}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{event.originalMedian}</span>
                  {event.quarterOffset !== 0 && (
                    <>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className={cn(
                        "font-medium",
                        event.quarterOffset > 0 ? "text-destructive" : "text-green-500"
                      )}>
                        {event.adjustedMedian}
                      </span>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        event.quarterOffset > 0 
                          ? "bg-destructive/10 text-destructive" 
                          : "bg-green-500/10 text-green-500"
                      )}>
                        {event.quarterOffset > 0 ? '+' : ''}{event.quarterOffset}Q
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-16">{Math.ceil(minDateValue)}</span>
                <Slider
                  value={[adjustedValues[event.name] || original]}
                  onValueChange={(value) => handleSliderChange(event.name, value)}
                  min={minDateValue}
                  max={2035}
                  step={0.25}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-16 text-right">2035</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {hasChanges && (
        <div className="p-4 bg-secondary/30 rounded-lg border border-border/50">
          <h4 className="font-semibold text-foreground mb-2">Impact Summary</h4>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Events shifted earlier: </span>
              <span className="font-medium text-green-500">
                {adjustedEvents.filter(e => e.quarterOffset < 0).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Events shifted later: </span>
              <span className="font-medium text-destructive">
                {adjustedEvents.filter(e => e.quarterOffset > 0).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Cascade effects: </span>
              <span className="font-medium text-foreground">
                {adjustedEvents.filter(e => e.cascadeSource).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total shift: </span>
              <span className={cn(
                "font-medium",
                adjustedEvents.reduce((sum, e) => sum + e.quarterOffset, 0) > 0 
                  ? "text-destructive" 
                  : "text-green-500"
              )}>
                {adjustedEvents.reduce((sum, e) => sum + e.quarterOffset, 0) > 0 ? '+' : ''}
                {adjustedEvents.reduce((sum, e) => sum + e.quarterOffset, 0)} quarters
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-muted-foreground text-center">
        Events marked "Manual" were directly adjusted. Events with "via [Source]" were automatically shifted due to dependency cascades.
      </p>
    </div>
  );
}
