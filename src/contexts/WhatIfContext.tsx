import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';

export interface ShiftedEvent {
  event_name: string;
  original_quarter: string;
  original_year: number;
  shifted_quarter: string;
  shifted_year: number;
  delta_quarters: number;
  shift_direction: 'delay' | 'acceleration' | 'none';
}

interface WhatIfContextType {
  // State
  selectedEvent: string | null;
  shiftQuarters: number;
  shiftedEvents: ShiftedEvent[];
  isLoading: boolean;
  hasRun: boolean;
  error: string | null;
  
  // Actions
  setSelectedEvent: (event: string | null) => void;
  setShiftQuarters: (quarters: number) => void;
  runScenario: () => Promise<void>;
  clearScenario: () => void;
}

const WhatIfContext = createContext<WhatIfContextType | null>(null);

export function WhatIfProvider({ children }: { children: React.ReactNode }) {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [shiftQuarters, setShiftQuarters] = useState<number>(0);
  const [shiftedEvents, setShiftedEvents] = useState<ShiftedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScenario = useCallback(async () => {
    if (!selectedEvent || shiftQuarters === 0) {
      toast({
        title: "Invalid scenario",
        description: "Please select an event and adjust the shift value.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-cascade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_event: selectedEvent,
            shift_quarters: shiftQuarters
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to calculate cascade');
      }

      const data: ShiftedEvent[] = await response.json();
      setShiftedEvents(data);
      setHasRun(true);

      // Track with PostHog
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('whatif_scenario_run', {
          source_event: selectedEvent,
          shift_quarters: shiftQuarters,
          affected_count: data.length
        });
      }

      // Announce for screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Scenario calculated. ${data.length} events affected.`;
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast({
        title: "Calculation failed",
        description: "Try again or adjust your scenario.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent, shiftQuarters]);

  const clearScenario = useCallback(() => {
    setShiftedEvents([]);
    setHasRun(false);
    setError(null);
    setSelectedEvent(null);
    setShiftQuarters(0);
  }, []);

  const value = useMemo(() => ({
    selectedEvent,
    shiftQuarters,
    shiftedEvents,
    isLoading,
    hasRun,
    error,
    setSelectedEvent,
    setShiftQuarters,
    runScenario,
    clearScenario
  }), [selectedEvent, shiftQuarters, shiftedEvents, isLoading, hasRun, error, runScenario, clearScenario]);

  return (
    <WhatIfContext.Provider value={value}>
      {children}
    </WhatIfContext.Provider>
  );
}

export function useWhatIf() {
  const context = useContext(WhatIfContext);
  if (!context) {
    throw new Error('useWhatIf must be used within a WhatIfProvider');
  }
  return context;
}
