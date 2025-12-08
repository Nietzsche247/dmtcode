import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTERNAL_SUPABASE_URL = 'https://nhpesihbzrxiherrqhfh.supabase.co/rest/v1';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const table = url.searchParams.get('table') || 'forecasts';
    const select = url.searchParams.get('select') || '*';
    const order = url.searchParams.get('order') || '';
    
    // Get the external Supabase anon key from secrets
    const externalKey = Deno.env.get('EXTERNAL_SUPABASE_ANON_KEY');
    
    if (!externalKey) {
      throw new Error('External Supabase key not configured');
    }

    // Build the query URL
    let queryUrl = `${EXTERNAL_SUPABASE_URL}/${table}?select=${select}`;
    if (order) {
      queryUrl += `&order=${order}`;
    }

    // Fetch from external Supabase
    const response = await fetch(queryUrl, {
      headers: {
        'apikey': externalKey,
        'Authorization': `Bearer ${externalKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in forecasts-proxy:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
