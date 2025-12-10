// External Supabase API for Technology Forecasts
// Uses edge function proxy to avoid CORS issues with external Supabase

const PROXY_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forecasts-proxy`;
const LOCAL_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const LOCAL_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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

export interface DependencyRule {
  id: number;
  source_event: string;
  target_event: string;
  dependency_type: 'hard' | 'soft';
  shift_ratio: number;
  min_gap_quarters?: number | null;
  constraint_floor?: string | null;
  constraint_ceiling?: string | null;
  confidence_floor?: number | null;
  confidence_ceiling?: number | null;
  description?: string | null;
  notes?: string | null;
  conditional_probability?: number | null;
}

// Unified market prediction interface
export interface MarketPrediction {
  id: number;
  source: 'polymarket' | 'metaculus';
  source_url: string | null;
  question_title: string | null;
  mapped_event_name: string;
  prediction_type: 'binary' | 'date';
  probability: number | null;
  median_date: string | null;
  percentile_25: string | null;
  percentile_75: string | null;
  forecaster_count: number | null;
  volume_usd: number | null;
  last_scraped: string;
}

// Legacy interfaces for backwards compatibility (deprecated)
export interface MetaculusComparison {
  id: number;
  forecast_event_name: string;
  metaculus_question_id: number;
  metaculus_title: string | null;
  metaculus_url: string | null;
  metaculus_median_date: string | null;
  metaculus_25th_date: string | null;
  metaculus_75th_date: string | null;
  metaculus_forecasters: number | null;
  last_updated: string;
}

export interface PolymarketPrediction {
  id: number;
  forecast_event_name: string;
  question_title: string | null;
  question_url: string | null;
  probability: number | null;
  volume_usd: number | null;
  liquidity_usd: number | null;
  end_date: string | null;
  last_updated: string;
}

export interface ForecastEvent {
  name: string;
  type: 'positive' | 'negative' | 'foundation';
  category: EventCategory;
  median: string;
  medianYear: number;
  medianQuarter: string;
  probability: number;
  isPrimary: boolean;
  isConditional: boolean;
  conditionalUpstream?: string;
  description?: string;
  analysisNotes?: string;
  confidenceFloor?: number;
  confidenceCeiling?: number;
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

export type EventCategory = 
  | 'ai' 
  | 'geopolitical' 
  | 'economic' 
  | 'quantum' 
  | 'biological' 
  | 'robotics' 
  | 'governance' 
  | 'default';

// Category colors for timeline nodes
export const CATEGORY_COLORS: Record<EventCategory, string> = {
  ai: '#3B82F6',        // blue
  geopolitical: '#EF4444', // red
  economic: '#F59E0B',  // amber
  quantum: '#8B5CF6',   // purple
  biological: '#10B981', // green
  robotics: '#EC4899',  // pink
  governance: '#6366F1', // indigo
  default: '#94A3B8',   // gray
};

// Derive category from event name patterns
export function inferCategory(eventName: string): EventCategory {
  const lowerName = eventName.toLowerCase();
  
  if (lowerName.includes('ai') || lowerName.includes('agi') || lowerName.includes('asi') || 
      lowerName.includes('reasoning') || lowerName.includes('rsi') || 
      lowerName.includes('cognitive') || lowerName.includes('r&d') || lowerName.includes('agent')) {
    return 'ai';
  }
  if (lowerName.includes('taiwan') || lowerName.includes('china') || 
      lowerName.includes('military') || lowerName.includes('conflict')) {
    return 'geopolitical';
  }
  if (lowerName.includes('unemployment') || lowerName.includes('market') || 
      lowerName.includes('financial') || lowerName.includes('recession') || 
      lowerName.includes('ubi') || lowerName.includes('hiring') || lowerName.includes('economic')) {
    return 'economic';
  }
  if (lowerName.includes('quantum') || lowerName.includes('encryption') || 
      lowerName.includes('crypto') || lowerName.includes('rsa')) {
    return 'quantum';
  }
  if (lowerName.includes('bio') || lowerName.includes('anti-aging') || 
      lowerName.includes('health') || lowerName.includes('dna') || lowerName.includes('aging')) {
    return 'biological';
  }
  if (lowerName.includes('robot') || lowerName.includes('labor') || 
      lowerName.includes('warehouse') || lowerName.includes('automation') || lowerName.includes('humanoid')) {
    return 'robotics';
  }
  if (lowerName.includes('government') || lowerName.includes('regulation') || 
      lowerName.includes('un') || lowerName.includes('task force') || lowerName.includes('policy')) {
    return 'governance';
  }
  
  return 'default';
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

export async function getDependencyRules(): Promise<DependencyRule[]> {
  try {
    const data = await fetchViaProxy('dependency_rules', '*');
    return data as DependencyRule[];
  } catch (error) {
    console.error('Error fetching dependency rules:', error);
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

// Fetch all market predictions from unified table
export async function getMarketPredictions(): Promise<MarketPrediction[]> {
  try {
    const response = await fetch(
      `${LOCAL_SUPABASE_URL}/rest/v1/market_predictions?select=*`,
      {
        headers: {
          'apikey': LOCAL_SUPABASE_KEY,
          'Authorization': `Bearer ${LOCAL_SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      console.error('Market predictions fetch error:', response.status, response.statusText);
      return [];
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching market predictions:', error);
    return [];
  }
}

// Get Metaculus predictions (filtered from unified table)
export async function getMetaculusComparisons(): Promise<MarketPrediction[]> {
  const all = await getMarketPredictions();
  return all.filter(p => p.source === 'metaculus');
}

// Get Polymarket predictions (filtered from unified table)
export async function getPolymarketPredictions(): Promise<MarketPrediction[]> {
  const all = await getMarketPredictions();
  return all.filter(p => p.source === 'polymarket');
}

// Infer event type based on event name keywords
function inferEventType(eventName: string): 'positive' | 'negative' | 'foundation' {
  const lowerName = eventName.toLowerCase();
  if (lowerName.includes('attack') || lowerName.includes('break') || lowerName.includes('risk') || 
      lowerName.includes('conflict') || lowerName.includes('unemployment') || lowerName.includes('recession')) {
    return 'negative';
  }
  if (lowerName.includes('agi') || lowerName.includes('rsi') || lowerName.includes('quantum') ||
      lowerName.includes('asi') || lowerName.includes('superintelligence')) {
    return 'foundation';
  }
  return 'positive';
}

// Check if event is primary (not conditional)
function isPrimaryEvent(analysisNotes?: string | null): boolean {
  if (!analysisNotes) return true;
  return !analysisNotes.trim().toUpperCase().startsWith('CONDITIONAL');
}

// Parse conditional flag and upstream dependency from analysis notes
function parseConditionalFlag(analysisNotes?: string | null): { isConditional: boolean; upstream?: string } {
  if (!analysisNotes) return { isConditional: false };
  
  const notes = analysisNotes.trim();
  if (!notes.toUpperCase().startsWith('CONDITIONAL')) {
    return { isConditional: false };
  }
  
  // Try to extract upstream event: "CONDITIONAL on Taiwan Conflict" or "CONDITIONAL: Taiwan Conflict"
  const patterns = [
    /CONDITIONAL\s+(?:on|if|upon)\s+(.+?)(?:\.|$)/i,
    /CONDITIONAL[:\s]+(.+?)(?:\.|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = notes.match(pattern);
    if (match) {
      return { isConditional: true, upstream: match[1].trim() };
    }
  }
  
  return { isConditional: true };
}

// Parse quarter string to numeric quarter
export function quarterToNumber(quarter: string): number {
  const match = quarter.match(/Q(\d)/);
  return match ? parseInt(match[1]) : 1;
}

// Convert year and quarter to decimal position
export function toDecimalDate(year: number, quarter: string): number {
  const q = quarterToNumber(quarter);
  return year + (q - 1) * 0.25;
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
        existing.median = `${forecast.quarter} ${forecast.year}`;
        existing.medianYear = forecast.year;
        existing.medianQuarter = forecast.quarter;
        existing.probability = forecast.probability;
      }
      // Update description if available
      if (forecast.event_description && !existing.description) {
        existing.description = forecast.event_description;
      }
      // Update analysis notes
      if (forecast.analysis_notes && !existing.analysisNotes) {
        existing.analysisNotes = forecast.analysis_notes;
        existing.isPrimary = isPrimaryEvent(forecast.analysis_notes);
      }
    } else {
      // Parse conditional info from analysis notes
      const { isConditional, upstream } = parseConditionalFlag(forecast.analysis_notes);
      
      eventMap.set(forecast.event_name, {
        name: forecast.event_name,
        type: inferEventType(forecast.event_name),
        category: inferCategory(forecast.event_name),
        median: forecast.is_median ? `${forecast.quarter} ${forecast.year}` : '',
        medianYear: forecast.is_median ? forecast.year : 0,
        medianQuarter: forecast.is_median ? forecast.quarter : '',
        probability: forecast.is_median ? forecast.probability : 0,
        isPrimary: isPrimaryEvent(forecast.analysis_notes),
        isConditional,
        conditionalUpstream: upstream,
        description: forecast.event_description || undefined,
        analysisNotes: forecast.analysis_notes || undefined,
        confidenceFloor: forecast.confidence_interval_low || undefined,
        confidenceCeiling: forecast.confidence_interval_high || undefined,
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
      event.median = `${maxDist.quarter} ${maxDist.year}`;
      event.medianYear = maxDist.year;
      event.medianQuarter = maxDist.quarter;
      event.probability = maxDist.probability;
    }
  });
  
  // Sort events chronologically by median
  events.sort((a, b) => toDecimalDate(a.medianYear, a.medianQuarter) - toDecimalDate(b.medianYear, b.medianQuarter));
  
  return events;
}

// Export data as JSON with scenario state
export function exportAsJSON(
  events: ForecastEvent[], 
  methodology: Methodology[],
  scenarios?: { taiwanConflict: boolean; alignment: string }
) {
  const exportData = {
    export_date: new Date().toISOString().split('T')[0],
    version: '2.0',
    events: events.map(event => ({
      name: event.name,
      category: event.category,
      median: event.median,
      probability: event.probability,
      isPrimary: event.isPrimary,
      type: event.type,
      distribution: event.distributions,
      cascade_effects: event.cascadeEffects,
      dependencies: event.dependencies
    })),
    methodology: methodology.map(m => ({
      section: m.section_name,
      content: m.content,
      version: m.version
    })),
    scenarios: scenarios || {
      taiwan_conflict: true,
      alignment: 'cooperative'
    }
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-timeline-forecast-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Export data as CSV
export function exportAsCSV(events: ForecastEvent[]) {
  const headers = ['Event Name', 'Category', 'Type', 'Primary', 'Median', 'Probability', 'Quarter', 'Year', 'Distribution Probability'];
  const rows: string[][] = [];
  
  events.forEach(event => {
    event.distributions.forEach(dist => {
      rows.push([
        event.name,
        event.category,
        event.type,
        event.isPrimary ? 'Yes' : 'No',
        event.median,
        (event.probability * 100).toFixed(1) + '%',
        dist.quarter,
        dist.year.toString(),
        (dist.probability * 100).toFixed(1) + '%'
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
  a.download = `ai-timeline-forecast-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
