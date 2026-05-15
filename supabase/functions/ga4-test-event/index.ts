import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const MEASUREMENT_ID = 'G-CWVKJBDG7L';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const API_SECRET = Deno.env.get('GA4_API_SECRET');
  if (!API_SECRET) {
    return new Response(JSON.stringify({ error: 'GA4_API_SECRET not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body ok */ }

  const clientId = body.client_id ?? `test.${crypto.randomUUID()}`;
  const payload = {
    client_id: clientId,
    timestamp_micros: Date.now() * 1000,
    non_personalized_ads: false,
    events: [{
      name: 'bundle_cta_click',
      params: {
        bundle_id: body.bundle_id ?? 'test-bundle-001',
        bundle_name: body.bundle_name ?? 'Test Laser Bundle',
        label: body.label ?? 'Get Your Laser Bundle',
        value: body.value ?? 49,
        currency: 'USD',
        debug_mode: 1,
        engagement_time_msec: 100,
      },
    }],
  };

  // Use /debug/mp/collect for validation, /mp/collect to actually send.
  const validateUrl = `https://www.google-analytics.com/debug/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`;
  const sendUrl = `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`;

  const validateRes = await fetch(validateUrl, { method: 'POST', body: JSON.stringify(payload) });
  const validation = await validateRes.json().catch(() => ({}));

  const sendRes = await fetch(sendUrl, { method: 'POST', body: JSON.stringify(payload) });

  return new Response(JSON.stringify({
    sent: sendRes.status === 204,
    send_status: sendRes.status,
    validation,
    payload,
    note: 'Open GA4 → Admin → DebugView. Event should appear within ~10 seconds.',
  }, null, 2), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
