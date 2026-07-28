import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const escapeHtml = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  // Auth: verify JWT and require admin role
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace('Bearer ', '');
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claims?.claims?.sub) {
    return json({ error: 'Unauthorized' }, 401);
  }
  const userId = claims.claims.sub as string;

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: isAdmin, error: roleErr } = await admin.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });
  if (roleErr || !isAdmin) {
    return json({ error: 'Forbidden: admin only' }, 403);
  }

  let bundleSlug = '';
  try {
    const body = await req.json();
    bundleSlug = typeof body?.bundle_slug === 'string' ? body.bundle_slug.trim() : '';
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!bundleSlug) {
    return json({ error: 'bundle_slug is required' }, 400);
  }

  const { data: bundle, error: bundleErr } = await admin
    .from('bundles')
    .select('slug, name, ships_status')
    .eq('slug', bundleSlug)
    .maybeSingle();

  if (bundleErr) return json({ error: bundleErr.message }, 500);
  if (!bundle) return json({ error: 'Bundle not found' }, 404);

  if (bundle.ships_status !== 'now') {
    return json({ error: `The ${bundle.name} kit is not shipping yet. No emails were sent.` }, 400);
  }

  const { data: signups, error: signupErr } = await admin
    .from('product_signups')
    .select('id, email')
    .eq('bundle_slug', bundleSlug)
    .is('notified_at', null);

  if (signupErr) return json({ error: signupErr.message }, 500);

  const { count: alreadyNotified } = await admin
    .from('product_signups')
    .select('id', { count: 'exact', head: true })
    .eq('bundle_slug', bundleSlug)
    .not('notified_at', 'is', null);

  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    return json({ error: 'RESEND_API_KEY is not configured' }, 500);
  }

  let sent = 0;
  let failed = 0;

  for (const row of signups ?? []) {
    const name = escapeHtml(bundle.name);
    const html = `
      <p>You asked to be notified when the ${name} kit ships.</p>
      <p>It now ships.</p>
      <p><a href="https://dmtcode.com/bundles">https://dmtcode.com/bundles</a></p>
      <p>You received this one-time email because you signed up on dmtcode.com. Reply to this email if you want your address removed.</p>
    `;

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'DMT Code <notifications@dmtcode.com>',
          reply_to: 'notifications@dmtcode.com',
          to: [row.email],
          subject: `The ${bundle.name} kit is now shipping`,
          html,
        }),
      });

      if (!res.ok) {
        console.error(`Resend failed [${res.status}]: ${await res.text()}`);
        failed++;
        continue;
      }

      const { error: updErr } = await admin
        .from('product_signups')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', row.id);

      if (updErr) {
        console.error('Failed to record notified_at:', updErr.message);
        failed++;
        continue;
      }

      sent++;
    } catch (e) {
      console.error('Send error:', e);
      failed++;
    }
  }

  return json({ sent, failed, already_notified: alreadyNotified ?? 0 });
});
