import { useState, useCallback, useMemo } from 'react';
import { type ForecastEvent, type DependencyRule, quarterToNumber } from '@/lib/forecasts-api';

export interface AdjustedPosition {
  quarter: string;
  year: number;
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

export function useCascadeEngine(
  events: ForecastEvent[],
  dependencyRules: DependencyRule[]
) {
  const [adjustedEvents, setAdjustedEvents] = useState<Map<string, AdjustedPosition>>(new Map());
  const [affectedEvents, setAffectedEvents] = useState<Set<string>>(new Set());

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
      return { quarter: event.medianQuarter, year: event.medianYear };
    }
    return null;
  }, [adjustedEvents, eventMap]);

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

      updates.set(rule.target_event, newDate);

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

  // Handle event drag
  const handleEventDrag = useCallback((
    eventName: string,
    newQuarter: string,
    newYear: number
  ) => {
    // Update the dragged event
    const newAdjusted = new Map(adjustedEvents);
    newAdjusted.set(eventName, { quarter: newQuarter, year: newYear });

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
  }, [adjustedEvents, propagateShift]);

  // Reset all adjustments
  const reset = useCallback(() => {
    setAdjustedEvents(new Map());
    setAffectedEvents(new Set());
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
        const eventName = events.find(e => 
          e.name.replace(/\s+/g, '_').toLowerCase().startsWith(key)
        )?.name;
        
        if (eventName) {
          newAdjusted.set(eventName, {
            quarter: match[1],
            year: parseInt(match[2])
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
    handleEventDrag,
    reset,
    getEventPosition,
    getShareState,
    loadFromUrl,
    affectedCount: affectedEvents.size
  };
}