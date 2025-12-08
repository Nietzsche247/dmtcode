// External Supabase API for Technology Forecasts
// Uses edge function proxy to avoid CORS issues with external Supabase

const PROXY_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forecasts-proxy`;

// Types for the forecasts data (matches actual external Supabase schema)
export interface Forecast {
  id: number;
  event_name: string;
  year: number;
  quarter: string;
  probability: number;
  is_median: boolean;
  event_description?: string | null;
  dependencies?: {
    depends_on?: string[];
    enables?: string[];
  } | null;
  cascade_effects?: {
    tier_1?: string[];
    tier_2?: string[];
    tier_3?: string[];
  } | null;
  conditional_modifier?: number;
  base_probability?: number | null;
  cumulative_probability?: number | null;
  confidence_interval_low?: number | null;
  confidence_interval_high?: number | null;
  bayesian_prior?: number | null;
  bayesian_posterior?: number | null;
  monte_carlo_mean?: number | null;
  monte_carlo_std?: number | null;
  time_decay_factor?: number | null;
  dependency_weight?: number | null;
  analysis_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Methodology {
  id: string;
  section_name: string;
  content: string;
  version: string;
  updated_at: string;
}

export interface ForecastEvent {
  name: string;
  type: 'positive' | 'negative' | 'foundation';
  median: string;
  description?: string;
  distributions: { quarter: string; year: number; probability: number }[];
  cascadeEffects: {
    tier_1: string[];
    tier_2: string[];
    tier_3: string[];
  };
  dependencies: {
    depends_on: string[];
    enables: string[];
  };
}

async function fetchViaProxy(table: string, select: string = '*', order?: string): Promise<unknown[]> {
  const params = new URLSearchParams({ table, select });
  if (order) params.append('order', order);
  
  const response = await fetch(`${PROXY_BASE_URL}?${params}`, {
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    console.error('Proxy fetch error:', response.status, response.statusText);
    return [];
  }
  
  return response.json();
}

export async function getForecasts(): Promise<Forecast[]> {
  try {
    const data = await fetchViaProxy('forecasts', '*', 'year,quarter');
    return data as Forecast[];
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    return [];
  }
}

export async function getMethodology(sectionName?: string): Promise<Methodology[]> {
  try {
    const data = await fetchViaProxy('methodology', '*');
    if (sectionName) {
      return (data as Methodology[]).filter(m => m.section_name === sectionName);
    }
    return data as Methodology[];
  } catch (error) {
    console.error('Error fetching methodology:', error);
    return [];
  }
}

export async function getCascadeEffects(): Promise<Methodology[]> {
  return getMethodology('cascade_effects_full_document');
}

export async function getConditionalRules(): Promise<Methodology[]> {
  return getMethodology('conditional_probability_rules');
}

// Infer event type based on event name keywords
function inferEventType(eventName: string): 'positive' | 'negative' | 'foundation' {
  const lowerName = eventName.toLowerCase();
  if (lowerName.includes('attack') || lowerName.includes('break') || lowerName.includes('risk')) {
    return 'negative';
  }
  if (lowerName.includes('agi') || lowerName.includes('rsi') || lowerName.includes('quantum')) {
    return 'foundation';
  }
  return 'positive';
}

// Process raw forecasts into grouped events
export function processForecasts(forecasts: Forecast[]): ForecastEvent[] {
  const eventMap = new Map<string, ForecastEvent>();
  
  forecasts.forEach(forecast => {
    const existing = eventMap.get(forecast.event_name);
    
    if (existing) {
      existing.distributions.push({
        quarter: forecast.quarter,
        year: forecast.year,
        probability: forecast.probability
      });
      // Update median if this is the median entry
      if (forecast.is_median) {
        existing.median = `${forecast.year} ${forecast.quarter}`;
      }
      // Update description if available
      if (forecast.event_description && !existing.description) {
        existing.description = forecast.event_description;
      }
    } else {
      eventMap.set(forecast.event_name, {
        name: forecast.event_name,
        type: inferEventType(forecast.event_name),
        median: forecast.is_median ? `${forecast.year} ${forecast.quarter}` : '',
        description: forecast.event_description || undefined,
        distributions: [{
          quarter: forecast.quarter,
          year: forecast.year,
          probability: forecast.probability
        }],
        cascadeEffects: {
          tier_1: forecast.cascade_effects?.tier_1 || [],
          tier_2: forecast.cascade_effects?.tier_2 || [],
          tier_3: forecast.cascade_effects?.tier_3 || []
        },
        dependencies: {
          depends_on: forecast.dependencies?.depends_on || [],
          enables: forecast.dependencies?.enables || []
        }
      });
    }
  });
  
  // Sort distributions and find median if not explicitly marked
  const events = Array.from(eventMap.values());
  events.forEach(event => {
    event.distributions.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.quarter.localeCompare(b.quarter);
    });
    
    // If no median was marked, estimate from highest probability distribution
    if (!event.median && event.distributions.length > 0) {
      const maxDist = event.distributions.reduce((max, d) => 
        d.probability > max.probability ? d : max
      );
      event.median = `${maxDist.year} ${maxDist.quarter}`;
    }
  });
  
  return events;
}

// Export data as JSON
export function exportAsJSON(events: ForecastEvent[], methodology: Methodology[]) {
  const exportData = {
    generated_at: new Date().toISOString(),
    version: '1.0',
    events: events.map(event => ({
      name: event.name,
      median: event.median,
      type: event.type,
      distribution: event.distributions,
      cascade_effects: event.cascadeEffects,
      dependencies: event.dependencies
    })),
    methodology: methodology.map(m => ({
      section: m.section_name,
      content: m.content,
      version: m.version
    }))
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `technology-forecasts-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Export data as CSV
export function exportAsCSV(events: ForecastEvent[]) {
  const headers = ['Event Name', 'Type', 'Median', 'Quarter', 'Year', 'Probability'];
  const rows: string[][] = [];
  
  events.forEach(event => {
    event.distributions.forEach(dist => {
      rows.push([
        event.name,
        event.type,
        event.median,
        dist.quarter,
        dist.year.toString(),
        dist.probability.toString()
      ]);
    });
  });
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `technology-forecasts-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
