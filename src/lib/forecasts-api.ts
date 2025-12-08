// External Supabase API for Technology Forecasts
// This connects to a separate read-only Supabase project

const EXTERNAL_SUPABASE_URL = 'https://nhpesihbzrxiherrqhfh.supabase.co/rest/v1';

// Types for the forecasts data
export interface Forecast {
  id: string;
  event_name: string;
  event_type: 'positive' | 'negative' | 'foundation';
  year: number;
  quarter: string;
  probability: number;
  median_date: string;
  description?: string;
  cascade_effects?: {
    tier_1?: string[];
    tier_2?: string[];
    tier_3?: string[];
  };
  dependencies?: {
    depends_on?: string[];
    enables?: string[];
  };
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

// Use edge function proxy for secure access to external Supabase
async function fetchViaProxy(table: string, select: string = '*', order?: string) {
  const params = new URLSearchParams({ table, select });
  if (order) params.append('order', order);
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  const response = await fetch(`${supabaseUrl}/functions/v1/forecasts-proxy?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey
    }
  });
  
  if (!response.ok) {
    console.error('Proxy fetch error:', response.status, response.statusText);
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getForecasts(): Promise<Forecast[]> {
  try {
    return await fetchViaProxy('forecasts', '*', 'year,quarter');
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    return [];
  }
}

export async function getMethodology(sectionName?: string): Promise<Methodology[]> {
  try {
    // For methodology, we need to handle the section filter differently
    if (sectionName) {
      const all = await fetchViaProxy('methodology', '*');
      return all.filter((m: Methodology) => m.section_name === sectionName);
    }
    return await fetchViaProxy('methodology', '*');
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
    } else {
      eventMap.set(forecast.event_name, {
        name: forecast.event_name,
        type: forecast.event_type,
        median: forecast.median_date,
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
  
  return Array.from(eventMap.values());
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
