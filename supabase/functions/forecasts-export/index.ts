import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=3600',
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const searchParams = url.searchParams

  // Optional filters
  const minProbability = searchParams.get('min_probability')
  const year = searchParams.get('year')
  const format = searchParams.get('format') || 'full' // full, summary, timeline

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Fetch forecasts from the external forecasts database via the proxy
  // Since forecasts are in an external DB, we'll fetch via the forecasts-proxy or direct query
  let forecastsQuery = supabase
    .from('forecasts')
    .select('event_name, event_description, quarter, year, probability, analysis_notes, dependencies')
    .order('year')
    .order('quarter')

  if (minProbability) {
    forecastsQuery = forecastsQuery.gte('probability', parseFloat(minProbability))
  }
  if (year) {
    forecastsQuery = forecastsQuery.eq('year', parseInt(year))
  }

  const { data: forecasts, error: forecastError } = await forecastsQuery

  // Fetch dependency rules
  const { data: dependencies } = await supabase
    .from('dependency_rules')
    .select('source_event, target_event, relationship, shift_ratio, notes')

  // Fetch market comparisons from unified table
  const { data: markets } = await supabase
    .from('market_predictions')
    .select('source, mapped_event_name, probability, median_date, percentile_25, percentile_75, forecaster_count, last_scraped')

  // Build response based on format
  const response: Record<string, unknown> = {
    meta: {
      generated_at: new Date().toISOString(),
      source: "dmtcode.com/forecasts",
      methodology: "Mechanism-based forecasting for unprecedented events. No reference class anchoring.",
      paradigm_note: "These forecasts model compounding technological breakthroughs 2025-2035. Traditional base rate forecasting does not apply.",
      total_events: forecasts?.length || 0,
      error: forecastError?.message || null
    }
  }

  if (format === 'summary') {
    // Condensed format for token-limited contexts
    response.forecasts = forecasts?.map(f => ({
      event: f.event_name,
      when: `${f.quarter} ${f.year}`,
      probability: `${f.probability}%`
    })) || []
  } else if (format === 'timeline') {
    // Grouped by year
    const timeline: Record<string, Array<{ event: string; quarter: string; probability: number }>> = {}
    forecasts?.forEach(f => {
      const key = `${f.year}`
      if (!timeline[key]) timeline[key] = []
      timeline[key].push({
        event: f.event_name,
        quarter: f.quarter,
        probability: f.probability
      })
    })
    response.timeline = timeline
  } else {
    // Full format
    response.forecasts = forecasts || []
    response.dependencies = dependencies || []
    response.market_comparisons = markets || []
    response.key_assumptions = [
      "Taiwan conflict (73% by Q2 2027) is master fork - delays all AI timelines 4-10 quarters if triggered",
      "Recursive self-improvement enables exponential capability gains",
      "Adversarial alignment branch (15%) excluded from planning per game theory",
      "Physical constraints (manufacturing, clinical trials) create hard floors regardless of AI acceleration"
    ]
  }

  // Log access (silent fail if table doesn't exist)
  try {
    await supabase.from('api_access_log').insert({
      endpoint: '/api/forecasts/export',
      format,
      filters: { min_probability: minProbability, year },
      accessed_at: new Date().toISOString()
    })
  } catch {
    // Silent fail
  }

  console.log(`Forecasts export: format=${format}, events=${forecasts?.length || 0}`)

  return new Response(JSON.stringify(response, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
