import { useMemo } from 'react';
import { useWhatIf } from '@/contexts/WhatIfContext';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DependencyRule } from '@/lib/forecasts-api';

interface ScenarioInputPanelProps {
  dependencyRules: DependencyRule[];
}

export function ScenarioInputPanel({ dependencyRules }: ScenarioInputPanelProps) {
  const { 
    selectedEvent, 
    shiftQuarters, 
    isLoading, 
    setSelectedEvent, 
    setShiftQuarters,
    runScenario 
  } = useWhatIf();

  // Get unique source events that have downstream dependencies
  const sourceEvents = useMemo(() => {
    const sources = new Set<string>();
    dependencyRules.forEach(rule => {
      if (rule.source_event) {
        sources.add(rule.source_event);
      }
    });
    return Array.from(sources).sort();
  }, [dependencyRules]);

  // Format shift label
  const shiftLabel = useMemo(() => {
    if (shiftQuarters === 0) return "No shift";
    const absVal = Math.abs(shiftQuarters);
    const direction = shiftQuarters > 0 ? "later" : "earlier";
    const unit = absVal === 1 ? "quarter" : "quarters";
    return `${shiftQuarters > 0 ? '+' : ''}${shiftQuarters} ${unit} (${direction})`;
  }, [shiftQuarters]);

  const canRun = selectedEvent && shiftQuarters !== 0 && !isLoading;

  return (
    <div className="bg-card/50 border border-border/50 rounded-xl p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-black text-lg text-foreground">Run Scenario</h3>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:items-end">
          {/* Event Selector */}
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Select Event
            </label>
            <Select
              value={selectedEvent || ''}
              onValueChange={setSelectedEvent}
            >
              <SelectTrigger 
                className="w-full h-11 min-h-[44px]"
                aria-label="Select an event to shift"
              >
                <SelectValue placeholder="Choose an event with dependencies..." />
              </SelectTrigger>
              <SelectContent>
                {sourceEvents.map(event => (
                  <SelectItem key={event} value={event}>
                    {event}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shift Slider */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                Time Shift
              </label>
              <span className={cn(
                "text-sm font-semibold",
                shiftQuarters > 0 ? "text-destructive" : 
                shiftQuarters < 0 ? "text-green-500" : "text-muted-foreground"
              )}>
                {shiftLabel}
              </span>
            </div>
            <Slider
              value={[shiftQuarters]}
              onValueChange={([val]) => setShiftQuarters(val)}
              min={-4}
              max={4}
              step={1}
              className="w-full"
              aria-label="Shift quarters"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-4Q (earlier)</span>
              <span>+4Q (later)</span>
            </div>
          </div>

          {/* Run Button */}
          <div className="flex-shrink-0">
            <Button
              onClick={runScenario}
              disabled={!canRun}
              className={cn(
                "h-11 min-h-[44px] px-6 font-bold transition-all duration-200",
                "bg-primary hover:bg-primary/90",
                canRun && "shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] hover:scale-105"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Run Scenario
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground text-center md:text-left">
          Select an event that has downstream dependencies, then shift its timeline to see cascading effects across related events.
        </p>
      </div>
    </div>
  );
}
