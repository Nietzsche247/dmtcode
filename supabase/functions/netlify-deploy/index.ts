// Triggers a Netlify production build from `main` by POSTing to a Netlify build hook.
// Admin-only: caller must present a valid user JWT and hold the `admin` role.
// Secret required: NETLIFY_BUILD_HOOK_URL (Netlify: Site configuration > Build & deploy > Build hooks).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const hook = Deno.env.get('NETLIFY_BUILD_HOOK_URL');
    if (!hook) {
      return json(
        { error: 'NETLIFY_BUILD_HOOK_URL is not set. Add the Netlify build hook URL in Project Settings, Secrets.' },
        500,
      );
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'Missing Authorization header.' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: 'Invalid session.' }, 401);

    const { data: isAdmin, error: roleErr } = await supabase.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    });
    if (roleErr) return json({ error: `Role check failed: ${roleErr.message}` }, 500);
    if (!isAdmin) return json({ error: 'Admin role required.' }, 403);

    let body: { reason?: string } = {};
    try { body = await req.json(); } catch { /* optional */ }

    // Netlify build hooks accept an optional trigger title via query param.
    const title = encodeURIComponent(body.reason || 'Manual deploy from DMTCode admin');
    const url = `${hook}?trigger_title=${title}`;

    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const text = await res.text();

    if (!res.ok) {
      return json({ error: `Netlify returned ${res.status}`, detail: text.slice(0, 500) }, 502);
    }

    return json({
      ok: true,
      triggered_at: new Date().toISOString(),
      triggered_by: userData.user.email ?? userData.user.id,
      netlify_status: res.status,
      note: 'Netlify is now building from `main`. Deploy usually takes a few minutes.',
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
