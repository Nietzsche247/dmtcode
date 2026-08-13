// Triggers a Netlify build and reports build status plus build logs.
// Admin-only: caller must present a valid user JWT and hold the `admin` role.
// Secrets:
//   NETLIFY_BUILD_HOOK_URL          production build hook (required to deploy production)
//   NETLIFY_STAGING_BUILD_HOOK_URL  staging build hook (optional)
//   NETLIFY_API_TOKEN               personal access token (required for status/logs)
//   NETLIFY_SITE_ID                 site id or api id (required for status/logs)

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

const NETLIFY_API = 'https://api.netlify.com/api/v1';

async function netlifyGet(path: string, token: string) {
  const res = await fetch(`${NETLIFY_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Netlify API ${res.status} on ${path}: ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
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

    let body: { reason?: string; target?: string; action?: string; deploy_id?: string } = {};
    try { body = await req.json(); } catch { /* optional */ }

    const action = body.action === 'status' ? 'status' : 'deploy';

    // ---------------------------------------------------------------- status
    if (action === 'status') {
      const apiToken = Deno.env.get('NETLIFY_API_TOKEN');
      const siteId = Deno.env.get('NETLIFY_SITE_ID');
      if (!apiToken || !siteId) {
        return json({
          ok: false,
          unavailable: true,
          error:
            'Build status needs the NETLIFY_API_TOKEN and NETLIFY_SITE_ID secrets. Deploys still work without them.',
        });
      }

      const deploys = await netlifyGet(
        `/sites/${siteId}/deploys?per_page=5`,
        apiToken,
      ) as Array<Record<string, unknown>>;

      const list = (deploys ?? []).map((d) => ({
        id: d.id,
        state: d.state,
        context: d.context,
        branch: d.branch,
        title: d.title,
        error_message: d.error_message,
        created_at: d.created_at,
        published_at: d.published_at,
        deploy_time: d.deploy_time,
        deploy_ssl_url: d.deploy_ssl_url,
        admin_url: d.admin_url,
        build_id: d.build_id,
      }));

      const target = list.find((d) => String(d.id) === body.deploy_id) ?? list[0];

      let log: Array<{ ts?: string; message?: string }> = [];
      let log_error: string | null = null;
      if (target?.build_id) {
        try {
          const raw = await netlifyGet(`/builds/${target.build_id}/log`, apiToken);
          if (Array.isArray(raw)) {
            log = raw
              .slice(-200)
              .map((l: Record<string, unknown>) => ({
                ts: (l?.ts as string) ?? undefined,
                message: String(l?.message ?? ''),
              }));
          }
        } catch (e) {
          log_error = (e as Error).message;
        }
      }

      return json({ ok: true, deploys: list, current: target ?? null, log, log_error });
    }

    // ---------------------------------------------------------------- deploy
    const target = body.target === 'staging' ? 'staging' : 'production';
    const secretName = target === 'staging' ? 'NETLIFY_STAGING_BUILD_HOOK_URL' : 'NETLIFY_BUILD_HOOK_URL';
    const hook = Deno.env.get(secretName);
    if (!hook) {
      return json(
        { error: `${secretName} is not set. Add the Netlify build hook URL in Project Settings, Secrets.` },
        500,
      );
    }

    // Netlify build hooks accept an optional trigger title via query param.
    const title = encodeURIComponent(body.reason || `Manual ${target} deploy from DMTCode admin`);
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
      target,
      note: `Netlify is now building the ${target} site. Deploy usually takes a few minutes.`,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
