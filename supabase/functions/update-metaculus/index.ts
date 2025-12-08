import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapping of forecast event names to Metaculus question IDs
const METACULUS_QUESTIONS: Record<string, { id: number; title: string }> = {
  'AGI (Human-Level General Intelligence)': { 
    id: 5121, 
    title: 'When will the first general AI system be devised?' 
  },
  'RSI (Recursive Self-Improvement)': { 
    id: 19356, 
    title: 'When will we have transformative AI?' 
  },
  'Humanoid Robots (Mass Production)': { 
    id: 16625, 
    title: 'When will a reliable and general household robot be developed?' 
  },
  'Quantum Computing (Quantum Advantage)': { 
    id: 3684, 
    title: 'When will quantum computer factor RSA numbers using Shors algorithm?' 
  },
  'Anti-Aging Breakthrough': { 
    id: 6592, 
    title: 'When will a country reach longevity escape velocity?' 
  },
};

interface MetaculusQuestionData {
  id: number;
  title: string;
  url: string;
  nr_forecasters: number;
  question?: {
    scaling?: {
      range_min?: number;
      range_max?: number;
    };
    aggregations?: {
      recency_weighted?: {
        latest?: {
          centers?: number[];
          interval_lower_bounds?: number[];
          interval_upper_bounds?: number[];
        };
      };
    };
  };
}

// Convert fractional timestamp to date string
function fractionToDate(fraction: number, rangeMin: number, rangeMax: number): string {
  const timestamp = rangeMin + fraction * (rangeMax - rangeMin);
  const date = new Date(timestamp * 1000);
  return date.toISOString().split('T')[0];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Starting Metaculus data update...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: { event: string; success: boolean; error?: string }[] = [];

    for (const [eventName, questionInfo] of Object.entries(METACULUS_QUESTIONS)) {
      try {
        console.log(`Fetching Metaculus question ${questionInfo.id} for "${eventName}"...`);
        
        const response = await fetch(
          `https://www.metaculus.com/api2/questions/${questionInfo.id}/`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'DMTCode-Forecasts/1.0'
            }
          }
        );

        if (!response.ok) {
          console.error(`Metaculus API error for ${eventName}: ${response.status}`);
          results.push({ event: eventName, success: false, error: `API error: ${response.status}` });
          continue;
        }

        const data: MetaculusQuestionData = await response.json();
        console.log(`Received data for "${eventName}": ${data.nr_forecasters} forecasters`);

        const q = data.question;
        const scaling = q?.scaling;
        const agg = q?.aggregations?.recency_weighted?.latest;

        if (!agg || !scaling?.range_min || !scaling?.range_max) {
          console.warn(`No aggregation data for ${eventName}`);
          results.push({ event: eventName, success: false, error: 'No aggregation data' });
          continue;
        }

        // Extract median (center) and 25th/75th percentiles
        const medianFrac = agg.centers?.[0];
        const lowerFrac = agg.interval_lower_bounds?.[0];
        const upperFrac = agg.interval_upper_bounds?.[0];

        if (medianFrac === undefined) {
          console.warn(`No median for ${eventName}`);
          results.push({ event: eventName, success: false, error: 'No median data' });
          continue;
        }

        const medianDate = fractionToDate(medianFrac, scaling.range_min, scaling.range_max);
        const lowerDate = lowerFrac !== undefined 
          ? fractionToDate(lowerFrac, scaling.range_min, scaling.range_max) 
          : null;
        const upperDate = upperFrac !== undefined 
          ? fractionToDate(upperFrac, scaling.range_min, scaling.range_max) 
          : null;

        console.log(`${eventName}: Median=${medianDate}, 25th=${lowerDate}, 75th=${upperDate}`);

        // Upsert to database
        const { error: upsertError } = await supabase
          .from('metaculus_comparisons')
          .upsert({
            forecast_event_name: eventName,
            metaculus_question_id: questionInfo.id,
            metaculus_title: data.title || questionInfo.title,
            metaculus_url: `https://www.metaculus.com/questions/${questionInfo.id}/`,
            metaculus_median_date: medianDate,
            metaculus_25th_date: lowerDate,
            metaculus_75th_date: upperDate,
            metaculus_forecasters: data.nr_forecasters,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'forecast_event_name'
          });

        if (upsertError) {
          console.error(`Database error for ${eventName}:`, upsertError);
          results.push({ event: eventName, success: false, error: upsertError.message });
        } else {
          console.log(`Successfully updated ${eventName}`);
          results.push({ event: eventName, success: true });
        }

        // Rate limit: wait 500ms between API calls to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error processing ${eventName}:`, error);
        results.push({ event: eventName, success: false, error: String(error) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Update complete: ${successCount} succeeded, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary: { succeeded: successCount, failed: failCount },
        results 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Fatal error in update-metaculus:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
