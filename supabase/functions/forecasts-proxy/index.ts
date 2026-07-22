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
    const ALLOWED_TABLES = ['forecasts', 'methodology', 'conditional_probability_rules', 'dependency_rules'];
    const table = url.searchParams.get('table') || 'forecasts';
    if (!ALLOWED_TABLES.includes(table)) {
      return new Response(JSON.stringify({ error: 'Invalid table' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Restrict select/order to safe character set
    const safe = /^[a-zA-Z0-9_,.\s()*-]+$/;
    const rawSelect = url.searchParams.get('select') || '*';
    const select = safe.test(rawSelect) ? rawSelect : '*';
    const rawOrder = url.searchParams.get('order') || '';
    const order = rawOrder && safe.test(rawOrder) ? rawOrder : '';

    const externalKey = Deno.env.get('EXTERNAL_SUPABASE_ANON_KEY');
    if (!externalKey) {
      throw new Error('External Supabase key not configured');
    }

    let queryUrl = `${EXTERNAL_SUPABASE_URL}/${table}?select=${encodeURIComponent(select)}`;
    if (order) {
      queryUrl += `&order=${encodeURIComponent(order)}`;
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
