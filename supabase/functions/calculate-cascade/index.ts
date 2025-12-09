import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTERNAL_SUPABASE_URL = 'https://nhpesihbzrxiherrqhfh.supabase.co/rest/v1';

interface DependencyRule {
  id: number;
  source_event: string;
  target_event: string;
  dependency_type: 'hard' | 'soft';
  shift_ratio: number;
  min_gap_quarters?: number | null;
  constraint_floor?: string | null;
  description?: string | null;
}

interface Forecast {
  id: number;
  event_name: string;
  year: number;
  quarter: string;
  probability: number;
  is_median: boolean;
}

interface ShiftedEvent {
  event_name: string;
  original_quarter: string;
  original_year: number;
  shifted_quarter: string;
  shifted_year: number;
  delta_quarters: number;
  shift_direction: 'delay' | 'acceleration' | 'none';
}

// Parse quarter string like "Q2" to number 1-4
function quarterToNumber(quarter: string): number {
  const match = quarter.match(/Q(\d)/);
  return match ? parseInt(match[1]) : 1;
}

// Convert quarter number back to string
function numberToQuarter(num: number): string {
  return `Q${Math.max(1, Math.min(4, num))}`;
}

// Get current quarter as numeric value (floor for all adjustments)
function getCurrentQuarterNumeric(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const quarter = Math.floor(month / 3);
  return year + (quarter * 0.25);
}

// Convert year + quarter to numeric value
function toNumeric(year: number, quarter: string): number {
  const q = quarterToNumber(quarter);
  return year + (q - 1) * 0.25;
}

// Convert numeric value back to year + quarter
function fromNumeric(value: number): { year: number; quarter: string } {
  const year = Math.floor(value);
  const fraction = value - year;
  let quarterNum = 1;
  if (fraction >= 0.75) quarterNum = 4;
  else if (fraction >= 0.5) quarterNum = 3;
  else if (fraction >= 0.25) quarterNum = 2;
  return { year, quarter: numberToQuarter(quarterNum) };
}

// Parse constraint_floor like "Q1 2027" to numeric
function parseConstraintFloor(floor: string | null | undefined): number | null {
  if (!floor) return null;
  const match = floor.match(/(Q[1-4])\s*(\d{4})/);
  if (!match) return null;
  return toNumeric(parseInt(match[2]), match[1]);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { source_event, shift_quarters } = await req.json();
    
    if (!source_event || shift_quarters === undefined) {
      throw new Error('Missing required parameters: source_event, shift_quarters');
    }

    console.log(`[calculate-cascade] Starting cascade for "${source_event}" with shift: ${shift_quarters} quarters`);

    const externalKey = Deno.env.get('EXTERNAL_SUPABASE_ANON_KEY');
    if (!externalKey) {
      throw new Error('External Supabase key not configured');
    }

    // Fetch dependency rules
    const rulesResponse = await fetch(
      `${EXTERNAL_SUPABASE_URL}/dependency_rules?select=*`,
      {
        headers: {
          'apikey': externalKey,
          'Authorization': `Bearer ${externalKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!rulesResponse.ok) {
      throw new Error(`Failed to fetch dependency rules: ${rulesResponse.status}`);
    }

    const dependencyRules: DependencyRule[] = await rulesResponse.json();
    console.log(`[calculate-cascade] Loaded ${dependencyRules.length} dependency rules`);

    // Fetch forecasts (only medians)
    const forecastsResponse = await fetch(
      `${EXTERNAL_SUPABASE_URL}/forecasts?select=*&is_median=eq.true`,
      {
        headers: {
          'apikey': externalKey,
          'Authorization': `Bearer ${externalKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!forecastsResponse.ok) {
      throw new Error(`Failed to fetch forecasts: ${forecastsResponse.status}`);
    }

    const forecasts: Forecast[] = await forecastsResponse.json();
    console.log(`[calculate-cascade] Loaded ${forecasts.length} median forecasts`);

    // Build event position map
    const eventPositions: Record<string, { year: number; quarter: string; numeric: number }> = {};
    forecasts.forEach(f => {
      eventPositions[f.event_name] = {
        year: f.year,
        quarter: f.quarter,
        numeric: toNumeric(f.year, f.quarter)
      };
    });

    // Current quarter floor
    const minDateValue = getCurrentQuarterNumeric();

    // Result array
    const shiftedEvents: ShiftedEvent[] = [];
    const processed = new Set<string>();

    // Recursive cascade function with max depth
    function processCascade(
      currentSource: string, 
      currentShift: number, 
      depth: number = 0
    ) {
      if (depth > 5) {
        console.log(`[calculate-cascade] Max depth reached for ${currentSource}`);
        return;
      }

      // Find rules where this is the source
      const applicableRules = dependencyRules.filter(r => {
        const sourceMatch = r.source_event.toLowerCase().includes(currentSource.toLowerCase().slice(0, 20)) ||
                           currentSource.toLowerCase().includes(r.source_event.toLowerCase().slice(0, 20)) ||
                           r.source_event === currentSource;
        return sourceMatch;
      });

      console.log(`[calculate-cascade] Processing ${currentSource} at depth ${depth}, found ${applicableRules.length} rules`);

      for (const rule of applicableRules) {
        const targetName = rule.target_event;
        
        // Skip if already processed
        if (processed.has(targetName)) continue;
        processed.add(targetName);

        // Find target position
        const targetPos = Object.entries(eventPositions).find(([name]) => 
          name.toLowerCase().includes(targetName.toLowerCase().slice(0, 20)) ||
          targetName.toLowerCase().includes(name.toLowerCase().slice(0, 20)) ||
          name === targetName
        );

        if (!targetPos) {
          console.log(`[calculate-cascade] No position found for target: ${targetName}`);
          continue;
        }

        const [matchedName, pos] = targetPos;
        const originalNumeric = pos.numeric;

        // Calculate new quarters based on shift_ratio
        const targetShift = currentShift * rule.shift_ratio;

        // Apply shift (0.25 per quarter)
        let newNumeric = originalNumeric + (targetShift * 0.25);

        // Apply constraint_floor if set
        const constraintFloor = parseConstraintFloor(rule.constraint_floor);
        if (constraintFloor !== null) {
          newNumeric = Math.max(constraintFloor, newNumeric);
        }

        // Apply minimum date (current quarter) floor
        newNumeric = Math.max(minDateValue, newNumeric);

        // Convert back to year/quarter
        const newPos = fromNumeric(newNumeric);
        const deltaQuarters = Math.round((newNumeric - originalNumeric) * 4);

        if (deltaQuarters !== 0) {
          shiftedEvents.push({
            event_name: matchedName,
            original_quarter: pos.quarter,
            original_year: pos.year,
            shifted_quarter: newPos.quarter,
            shifted_year: newPos.year,
            delta_quarters: deltaQuarters,
            shift_direction: deltaQuarters > 0 ? 'delay' : 'acceleration'
          });

          console.log(`[calculate-cascade] Shifted ${matchedName}: ${pos.quarter} ${pos.year} → ${newPos.quarter} ${newPos.year} (${deltaQuarters > 0 ? '+' : ''}${deltaQuarters}Q)`);

          // Recursively process this target as a new source
          processCascade(matchedName, targetShift, depth + 1);
        }
      }
    }

    // Add the source event shift first
    const sourcePos = Object.entries(eventPositions).find(([name]) =>
      name.toLowerCase().includes(source_event.toLowerCase().slice(0, 20)) ||
      source_event.toLowerCase().includes(name.toLowerCase().slice(0, 20)) ||
      name === source_event
    );

    if (sourcePos) {
      const [matchedName, pos] = sourcePos;
      let newNumeric = pos.numeric + (shift_quarters * 0.25);
      newNumeric = Math.max(minDateValue, newNumeric);
      const newPos = fromNumeric(newNumeric);
      const deltaQuarters = Math.round((newNumeric - pos.numeric) * 4);

      if (deltaQuarters !== 0) {
        shiftedEvents.push({
          event_name: matchedName,
          original_quarter: pos.quarter,
          original_year: pos.year,
          shifted_quarter: newPos.quarter,
          shifted_year: newPos.year,
          delta_quarters: deltaQuarters,
          shift_direction: deltaQuarters > 0 ? 'delay' : 'acceleration'
        });
      }

      processed.add(matchedName);
      processCascade(matchedName, shift_quarters, 0);
    }

    console.log(`[calculate-cascade] Complete. ${shiftedEvents.length} events affected.`);

    return new Response(JSON.stringify(shiftedEvents), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[calculate-cascade] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
