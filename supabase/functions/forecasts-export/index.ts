import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=3600',
}

// External forecasts database (separate from main dmtcode.com database)
const EXTERNAL_FORECASTS_URL = 'https://nhpesihbzrxiherrqhfh.supabase.co'
const EXTERNAL_FORECASTS_ANON_KEY = Deno.env.get("EXTERNAL_SUPABASE_ANON_KEY")!

// Primary database for access logging
const PRIMARY_SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const PRIMARY_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

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

  // Connect to external forecasts database
  const supabase = createClient(EXTERNAL_FORECASTS_URL, EXTERNAL_FORECASTS_ANON_KEY)
  
  // Primary database for logging
  const primaryDb = createClient(PRIMARY_SUPABASE_URL, PRIMARY_SERVICE_ROLE_KEY)

  // Build forecasts query
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

  // Fetch all data in parallel
  const [
    forecastsResult,
    dependenciesResult,
    marketsResult,
    falsificationResult,
    disagreementsResult,
    changelogResult
  ] = await Promise.all([
    forecastsQuery,
    supabase.from('dependency_rules').select('source_event, target_event, relationship, shift_ratio, notes'),
    supabase.from('market_predictions').select('source, mapped_event_name, probability, median_date, percentile_25, percentile_75, forecaster_count, last_scraped'),
    supabase.from('falsification_criteria').select('event_name, criterion, consequence, deadline, status'),
    supabase.from('market_disagreements').select('event_name, market_source, their_position, our_position, reasoning'),
    supabase.from('forecast_changelog').select('event_name, previous_quarter, previous_year, new_quarter, new_year, trigger_reason, updated_at').order('updated_at', { ascending: false }).limit(20)
  ])

  const forecasts = forecastsResult.data
  const dependencies = dependenciesResult.data
  const markets = marketsResult.data
  const falsification = falsificationResult.data
  const disagreements = disagreementsResult.data
  const changelog = changelogResult.data

  // Build response based on format
  const response: Record<string, unknown> = {
    meta: {
      generated_at: new Date().toISOString(),
      source: "dmtcode.com/forecasts",
      version: "2.0",
      methodology_summary: "Mechanism-based forecasting for unprecedented events. No reference class anchoring. Exponential compounding assumed.",
      total_events: forecasts?.length || 0,
      endpoints: {
        full: "/api/forecasts/export",
        summary: "/api/forecasts/export?format=summary",
        timeline: "/api/forecasts/export?format=timeline"
      },
      error: forecastsResult.error?.message || null
    },
    paradigm: {
      statement: "Traditional forecasting assumes stable systems. We model compounding breakthroughs that invalidate base rates.",
      master_fork: {
        event: "China-Taiwan Military Conflict",
        probability_cumulative: 73,
        window: "Q1 2026 - Q2 2027",
        impact: "All AI timelines delay 4-10 quarters if triggered"
      },
      alignment_branches: {
        cooperative: { probability: 40, human_survival: "99%+", planning_relevance: "Primary target" },
        paternalistic: { probability: 25, human_survival: "95%+", planning_relevance: "Secondary" },
        indifferent: { probability: 20, human_survival: "50-80%", planning_relevance: "Hedge" },
        adversarial: { probability: 15, human_survival: "<10%", planning_relevance: "Excluded per game theory" }
      }
    }
  }

  if (format === 'summary') {
    // Condensed format for token-limited contexts
    response.forecasts = forecasts?.map(f => ({
      event: f.event_name,
      when: `${f.quarter} ${f.year}`,
      probability: `${f.probability}%`
    })) || []
    response.recent_updates = changelog?.slice(0, 5).map(c => ({
      event: c.event_name,
      change: `${c.previous_quarter} ${c.previous_year} → ${c.new_quarter} ${c.new_year}`,
      reason: c.trigger_reason
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
    // Full format - enrich forecasts with related data
    response.forecasts = forecasts?.map(f => {
      const eventFalsification = falsification?.filter(x => x.event_name === f.event_name) || []
      const eventDisagreements = disagreements?.filter(x => x.event_name === f.event_name) || []
      const eventChangelog = changelog?.filter(x => x.event_name === f.event_name) || []
      const eventMarkets = markets?.filter(x => x.mapped_event_name === f.event_name) || []

      return {
        ...f,
        falsification_criteria: eventFalsification.map(x => ({
          test: x.criterion,
          if_triggered: x.consequence,
          deadline: x.deadline,
          status: x.status
        })),
        market_comparison: eventMarkets.map(m => ({
          source: m.source,
          their_position: m.source === 'metaculus' ? m.median_date : `${m.probability}%`,
          forecasters: m.forecaster_count
        })),
        our_reasoning_vs_markets: eventDisagreements.map(d => ({
          vs: d.market_source,
          their: d.their_position,
          ours: d.our_position,
          why: d.reasoning
        })),
        update_history: eventChangelog.map(c => ({
          date: c.updated_at,
          from: `${c.previous_quarter} ${c.previous_year}`,
          to: `${c.new_quarter} ${c.new_year}`,
          trigger: c.trigger_reason
        }))
      }
    }) || []
    response.dependencies = dependencies || []
    response.model_track_record = {
      total_updates: changelog?.length || 0,
      recent_changes: changelog?.slice(0, 5) || []
    }
    response.key_assumptions = [
      "Taiwan conflict (73% by Q2 2027) is master fork - delays all AI timelines 4-10 quarters if triggered",
      "Recursive self-improvement enables exponential capability gains",
      "Adversarial alignment branch (15%) excluded from planning per game theory",
      "Physical constraints (manufacturing, clinical trials) create hard floors regardless of AI acceleration"
    ]
  }

  // Get IP address and user agent from request headers
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    req.headers.get('x-real-ip') || 
                    'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  // Log access to primary database (silent fail if table doesn't exist)
  try {
    await primaryDb.from('api_access_log').insert({
      endpoint: '/api/forecasts/export',
      format,
      filters: { min_probability: minProbability, year },
      accessed_at: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent
    })
  } catch {
    // Silent fail
  }

  console.log(`Forecasts export: format=${format}, events=${forecasts?.length || 0}`)

  return new Response(JSON.stringify(response, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
