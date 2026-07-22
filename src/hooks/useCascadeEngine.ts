import { useState, useCallback, useMemo, useRef } from 'react';
import { type ForecastEvent, type DependencyRule, quarterToNumber } from '@/lib/forecasts-api';

export interface AdjustedPosition {
  quarter: string;
  year: number;
  deltaQuarters?: number; // How many quarters shifted from original
}

export interface CascadeState {
  isCalculating: boolean;
  lastDraggedEvent: string | null;
}

// Calculate quarter difference between two dates
function calculateQuarterDiff(
  fromQuarter: string, fromYear: number,
  toQuarter: string, toYear: number
): number {
  const fromQ = quarterToNumber(fromQuarter);
  const toQ = quarterToNumber(toQuarter);
  const yearDiff = toYear - fromYear;
  const quarterDiff = toQ - fromQ;
  return yearDiff * 4 + quarterDiff;
}

// Add quarters to a date
function addQuarters(
  quarter: string, 
  year: number, 
  quartersToAdd: number
): { quarter: string; year: number } {
  const q = quarterToNumber(quarter);
  const totalQuarters = (year * 4) + (q - 1) + quartersToAdd;
  const newYear = Math.floor(totalQuarters / 4);
  const newQ = (totalQuarters % 4) + 1;
  return { quarter: `Q${newQ}`, year: newYear };
}

// Parse constraint floor string (e.g., "Q2 2027")
function parseQuarterYear(str: string): { quarter: string; year: number } | null {
  const match = str.match(/(Q\d)\s+(\d{4})/);
  if (!match) return null;
  return { quarter: match[1], year: parseInt(match[2]) };
}

// Compare two dates, returns negative if a < b
function compareDates(
  a: { quarter: string; year: number },
  b: { quarter: string; year: number }
): number {
  if (a.year !== b.year) return a.year - b.year;
  return quarterToNumber(a.quarter) - quarterToNumber(b.quarter);
}

// Format delta for display
export function formatDelta(delta: number): string {
  if (delta === 0) return '';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}Q`;
}

export function useCascadeEngine(
  events: ForecastEvent[],
  dependencyRules: DependencyRule[]
) {
  const [adjustedEvents, setAdjustedEvents] = useState<Map<string, AdjustedPosition>>(new Map());
  const [affectedEvents, setAffectedEvents] = useState<Set<string>>(new Set());
  const [cascadeState, setCascadeState] = useState<CascadeState>({
    isCalculating: false,
    lastDraggedEvent: null
  });
  const cascadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build event lookup map
  const eventMap = useMemo(() => {
    const map = new Map<string, ForecastEvent>();
    events.forEach(e => map.set(e.name, e));
    return map;
  }, [events]);

  // Build dependency lookup map (source -> targets)
  const dependencyMap = useMemo(() => {
    const map = new Map<string, DependencyRule[]>();
    dependencyRules.forEach(rule => {
      const existing = map.get(rule.source_event) || [];
      existing.push(rule);
      map.set(rule.source_event, existing);
    });
    return map;
  }, [dependencyRules]);

  // Get current position (adjusted or original)
  const getEventPosition = useCallback((eventName: string): AdjustedPosition | null => {
    const adjusted = adjustedEvents.get(eventName);
    if (adjusted) return adjusted;
    
    const event = eventMap.get(eventName);
    if (event) {
      return { quarter: event.medianQuarter, year: event.medianYear, deltaQuarters: 0 };
    }
    return null;
  }, [adjustedEvents, eventMap]);

  // Get delta from original position
  const getEventDelta = useCallback((eventName: string): number => {
    const adjusted = adjustedEvents.get(eventName);
    return adjusted?.deltaQuarters || 0;
  }, [adjustedEvents]);

  // Propagate shift to dependent events
  const propagateShift = useCallback((
    eventName: string,
    newQuarter: string,
    newYear: number,
    visited: Set<string> = new Set()
  ): Map<string, AdjustedPosition> => {
    if (visited.has(eventName)) return new Map();
    visited.add(eventName);

    const originalEvent = eventMap.get(eventName);
    if (!originalEvent) return new Map();

    const shiftQuarters = calculateQuarterDiff(
      originalEvent.medianQuarter, originalEvent.medianYear,
      newQuarter, newYear
    );

    if (shiftQuarters === 0) return new Map();

    const updates = new Map<string, AdjustedPosition>();
    const rules = dependencyMap.get(eventName) || [];

    for (const rule of rules) {
      const targetEvent = eventMap.get(rule.target_event);
      if (!targetEvent) continue;

      // Calculate target shift based on ratio
      const targetShift = Math.round(shiftQuarters * rule.shift_ratio);
      if (targetShift === 0) continue;

      // Calculate new target position
      let newDate = addQuarters(
        targetEvent.medianQuarter, 
        targetEvent.medianYear, 
        targetShift
      );

      // Apply constraint floor if exists
      if (rule.constraint_floor) {
        const floor = parseQuarterYear(rule.constraint_floor);
        if (floor && compareDates(newDate, floor) < 0) {
          newDate = floor;
        }
      }

      // Apply minimum gap
      if (rule.min_gap_quarters) {
        const minDate = addQuarters(newQuarter, newYear, rule.min_gap_quarters);
        if (compareDates(newDate, minDate) < 0) {
          newDate = minDate;
        }
      }

      // Calculate actual delta from original
      const actualDelta = calculateQuarterDiff(
        targetEvent.medianQuarter, targetEvent.medianYear,
        newDate.quarter, newDate.year
      );

      updates.set(rule.target_event, { ...newDate, deltaQuarters: actualDelta });

      // Recurse to get cascading effects
      const cascadeUpdates = propagateShift(
        rule.target_event,
        newDate.quarter,
        newDate.year,
        visited
      );
      cascadeUpdates.forEach((pos, name) => updates.set(name, pos));
    }

    return updates;
  }, [eventMap, dependencyMap]);

  // Handle event drag with visual feedback
  const handleEventDrag = useCallback((
    eventName: string,
    newQuarter: string,
    newYear: number
  ) => {
    // Start calculating state
    setCascadeState({ isCalculating: true, lastDraggedEvent: eventName });

    // Clear any existing timeout
    if (cascadeTimeoutRef.current) {
      clearTimeout(cascadeTimeoutRef.current);
    }

    const originalEvent = eventMap.get(eventName);
    const dragDelta = originalEvent 
      ? calculateQuarterDiff(originalEvent.medianQuarter, originalEvent.medianYear, newQuarter, newYear)
      : 0;

    // Update the dragged event
    const newAdjusted = new Map(adjustedEvents);
    newAdjusted.set(eventName, { quarter: newQuarter, year: newYear, deltaQuarters: dragDelta });

    // Calculate cascading effects
    const cascadeUpdates = propagateShift(eventName, newQuarter, newYear);
    cascadeUpdates.forEach((pos, name) => {
      newAdjusted.set(name, pos);
    });

    setAdjustedEvents(newAdjusted);
    
    // Track affected events (excluding the dragged one)
    const affected = new Set<string>();
    cascadeUpdates.forEach((_, name) => affected.add(name));
    setAffectedEvents(affected);

    // End calculating state after animation
    cascadeTimeoutRef.current = setTimeout(() => {
      setCascadeState({ isCalculating: false, lastDraggedEvent: eventName });
    }, 600);
  }, [adjustedEvents, propagateShift, eventMap]);

  // Reset all adjustments
  const reset = useCallback(() => {
    setAdjustedEvents(new Map());
    setAffectedEvents(new Set());
    setCascadeState({ isCalculating: false, lastDraggedEvent: null });
  }, []);

  // Generate shareable URL state
  const getShareState = useCallback(() => {
    const params = new URLSearchParams();
    adjustedEvents.forEach((pos, name) => {
      // Shorten event names for URL
      const shortName = name.replace(/\s+/g, '_').toLowerCase().slice(0, 20);
      params.set(shortName, `${pos.quarter}_${pos.year}`);
    });
    return params.toString();
  }, [adjustedEvents]);

  // Load state from URL
  const loadFromUrl = useCallback((searchParams: URLSearchParams) => {
    const newAdjusted = new Map<string, AdjustedPosition>();
    
    searchParams.forEach((value, key) => {
      const match = value.match(/(Q\d)_(\d{4})/);
      if (match) {
        // Find matching event by partial name
        const foundEvent = events.find(e => 
          e.name.replace(/\s+/g, '_').toLowerCase().startsWith(key)
        );
        
        if (foundEvent) {
          const delta = calculateQuarterDiff(
            foundEvent.medianQuarter, foundEvent.medianYear,
            match[1], parseInt(match[2])
          );
          newAdjusted.set(foundEvent.name, {
            quarter: match[1],
            year: parseInt(match[2]),
            deltaQuarters: delta
          });
        }
      }
    });

    if (newAdjusted.size > 0) {
      setAdjustedEvents(newAdjusted);
    }
  }, [events]);

  return {
    adjustedEvents,
    affectedEvents,
    cascadeState,
    handleEventDrag,
    reset,
    getEventPosition,
    getEventDelta,
    getShareState,
    loadFromUrl,
    affectedCount: affectedEvents.size
  };
}