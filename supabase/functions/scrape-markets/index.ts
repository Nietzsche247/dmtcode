import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const METACULUS_QUESTIONS = [
  { id: "5121", mapped_event: "AGI (Human-Level General Intelligence)" },
  { id: "3479", mapped_event: "AI Achieves Human-Level Novel Reasoning" },
]

const POLYMARKET_QUESTIONS = [
  { slug: "openai-announces-it-has-achieved-agi-in-2025", mapped_event: "AGI (Human-Level General Intelligence)", source_id: "agi-2025" },
  { slug: "openai-announces-it-has-achieved-agi-before-2027", mapped_event: "AGI (Human-Level General Intelligence)", source_id: "agi-2027" },
]

async function fetchMetaculus(questionId: string) {
  const url = `https://www.metaculus.com/api2/questions/${questionId}/`
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
    })
    if (!resp.ok) {
      console.error(`Metaculus fetch failed: ${resp.status}`)
      return null
    }
    return resp.json()
  } catch (error) {
    console.error(`Metaculus fetch error:`, error)
    return null
  }
}

function parseMetaculusDate(data: any) {
  const question = data?.question || {}
  const scaling = question?.scaling || {}
  const rangeMin = scaling?.range_min
  const rangeMax = scaling?.range_max
  const agg = question?.aggregations?.recency_weighted?.latest || {}
  const centers = agg?.centers || []
  const lower = agg?.interval_lower_bounds || []
  const upper = agg?.interval_upper_bounds || []

  if (!rangeMin || !rangeMax || !centers.length) return null

  const toDate = (normalized: number) => {
    const ts = rangeMin + (normalized * (rangeMax - rangeMin))
    return new Date(ts * 1000).toISOString().split("T")[0]
  }

  return {
    median_date: toDate(centers[0]),
    percentile_25: lower.length ? toDate(lower[0]) : null,
    percentile_75: upper.length ? toDate(upper[0]) : null,
    forecaster_count: data?.nr_forecasters,
    question_title: data?.title,
    source_url: `https://www.metaculus.com/questions/${data?.id}/`
  }
}

async function fetchPolymarket(slug: string) {
  const url = `https://gamma-api.polymarket.com/markets?slug=${slug}`
  try {
    const resp = await fetch(url)
    if (!resp.ok) {
      console.error(`Polymarket fetch failed: ${resp.status}`)
      return null
    }
    const data = await resp.json()
    return data[0] || null
  } catch (error) {
    console.error(`Polymarket fetch error:`, error)
    return null
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Verify cron secret or allow manual trigger
  const authHeader = req.headers.get("Authorization")
  const cronSecret = Deno.env.get("CRON_SECRET")
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow if called with service role key
    const isServiceRole = authHeader?.includes(SUPABASE_SERVICE_ROLE_KEY)
    if (!isServiceRole && req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const results: any[] = []

  console.log("Starting market data scrape...")

  // Scrape Metaculus
  for (const q of METACULUS_QUESTIONS) {
    console.log(`Fetching Metaculus: ${q.id} -> ${q.mapped_event}`)
    const data = await fetchMetaculus(q.id)
    if (data) {
      const parsed = parseMetaculusDate(data)
      if (parsed) {
        const { error } = await supabase
          .from("market_predictions")
          .update({
            median_date: parsed.median_date,
            percentile_25: parsed.percentile_25,
            percentile_75: parsed.percentile_75,
            forecaster_count: parsed.forecaster_count,
            question_title: parsed.question_title,
            source_url: parsed.source_url,
            last_scraped: new Date().toISOString()
          })
          .eq("mapped_event_name", q.mapped_event)
          .eq("source", "metaculus")

        results.push({
          source: "metaculus",
          event: q.mapped_event,
          status: error ? "error" : "updated",
          error: error?.message,
          median: parsed.median_date,
          forecasters: parsed.forecaster_count
        })
        
        console.log(`Metaculus ${q.id}: ${error ? 'ERROR' : 'OK'} - median: ${parsed.median_date}`)
      }
    } else {
      results.push({
        source: "metaculus",
        event: q.mapped_event,
        status: "fetch_failed"
      })
    }
  }

  // Scrape Polymarket
  for (const q of POLYMARKET_QUESTIONS) {
    console.log(`Fetching Polymarket: ${q.slug}`)
    const data = await fetchPolymarket(q.slug)
    if (data) {
      let probability = 0
      try {
        if (data.outcomePrices) {
          probability = parseFloat(JSON.parse(data.outcomePrices)[0]) * 100
        } else if (data.bestBid !== undefined) {
          probability = data.bestBid * 100
        }
      } catch (e) {
        console.error("Error parsing probability:", e)
      }

      const { error } = await supabase
        .from("market_predictions")
        .update({
          probability: probability,
          volume_usd: data.volume || data.liquidityNum || 0,
          question_title: data.question,
          source_url: `https://polymarket.com/event/${q.slug}`,
          last_scraped: new Date().toISOString()
        })
        .eq("mapped_event_name", q.mapped_event)
        .eq("source", "polymarket")

      results.push({
        source: "polymarket",
        event: q.mapped_event,
        slug: q.slug,
        status: error ? "error" : "updated",
        error: error?.message,
        probability: probability.toFixed(1) + "%",
        volume: data.volume || data.liquidityNum
      })
      
      console.log(`Polymarket ${q.slug}: ${error ? 'ERROR' : 'OK'} - prob: ${probability.toFixed(1)}%`)
    } else {
      results.push({
        source: "polymarket",
        event: q.mapped_event,
        slug: q.slug,
        status: "fetch_failed"
      })
    }
  }

  console.log("Scrape complete:", JSON.stringify(results))

  return new Response(JSON.stringify({
    success: true,
    timestamp: new Date().toISOString(),
    results
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  })
})
