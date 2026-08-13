// Receives Netlify outgoing deploy webhooks (deploy succeeded / deploy failed / deploy building)
// and turns them into in-app admin notifications plus an email to every admin.
//
// Netlify setup (human click): Site configuration > Notifications > Add notification >
//   HTTP POST request, for "Deploy succeeded" and "Deploy failed", URL:
//   https://<project>.supabase.co/functions/v1/netlify-deploy-webhook
//
// Secrets: NETLIFY_SITE_ID (payload site must match), RESEND_API_KEY (email).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-netlify-event',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

type DeployPayload = {
  id?: string;
  site_id?: string;
  state?: string;
  name?: string;
  branch?: string;
  context?: string;
  title?: string;
  error_message?: string;
  commit_ref?: string;
  admin_url?: string;
  deploy_ssl_url?: string;
  created_at?: string;
  published_at?: string;
  deploy_time?: number;
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'POST only.' }, 405);

  try {
    let payload: DeployPayload;
    try {
      payload = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    const expectedSite = Deno.env.get('NETLIFY_SITE_ID');
    if (!expectedSite) return json({ error: 'NETLIFY_SITE_ID is not set.' }, 500);
    if (payload.site_id !== expectedSite) {
      // Unknown sender or wrong site. Do not write anything.
      return json({ error: 'Unrecognised site.' }, 403);
    }

    const state = String(payload.state ?? 'unknown');
    const failed = state === 'error' || state === 'failed';
    const succeeded = state === 'ready';
    if (!failed && !succeeded) {
      return json({ ok: true, skipped: true, state });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const logsUrl = payload.admin_url
      ? `${payload.admin_url}/deploys/${payload.id ?? ''}`
      : 'https://app.netlify.com';

    const label = payload.context === 'production' ? 'Production' : (payload.context ?? 'Deploy');
    const branch = payload.branch ? ` (${payload.branch})` : '';
    const message = failed
      ? `${label} deploy failed${branch}. ${payload.error_message ?? 'No error message returned by Netlify.'}`
      : `${label} deploy published${branch}.${
          typeof payload.deploy_time === 'number' ? ` Build took ${payload.deploy_time}s.` : ''
        }`;

    const metadata = {
      deploy_id: payload.id ?? null,
      state,
      context: payload.context ?? null,
      branch: payload.branch ?? null,
      title: payload.title ?? null,
      commit_ref: payload.commit_ref ?? null,
      error_message: payload.error_message ?? null,
      deploy_time: payload.deploy_time ?? null,
      site_url: payload.deploy_ssl_url ?? null,
      logs_url: logsUrl,
      published_at: payload.published_at ?? null,
    };

    const { error: insertErr } = await supabase.from('admin_notifications').insert({
      type: failed ? 'deploy_failure' : 'deploy_success',
      message,
      metadata,
    });
    if (insertErr) console.error('admin_notifications insert failed:', insertErr.message);

    // ------------------------------------------------------------------ email
    let emailed = 0;
    let email_error: string | null = null;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      try {
        const { data: admins, error: rolesErr } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');
        if (rolesErr) throw new Error(rolesErr.message);

        const recipients: string[] = [];
        for (const row of admins ?? []) {
          const { data } = await supabase.auth.admin.getUserById(row.user_id as string);
          const email = data?.user?.email;
          if (email && !recipients.includes(email)) recipients.push(email);
        }

        if (recipients.length) {
          const subject = failed
            ? `DMTCode: ${label} deploy FAILED`
            : `DMTCode: ${label} deploy published`;
          const html = `
            <div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6">
              <p><strong>${esc(message)}</strong></p>
              <ul>
                <li>State: ${esc(state)}</li>
                <li>Context: ${esc(payload.context ?? 'unknown')}</li>
                <li>Branch: ${esc(payload.branch ?? 'unknown')}</li>
                ${payload.commit_ref ? `<li>Commit: ${esc(payload.commit_ref)}</li>` : ''}
                ${payload.title ? `<li>Trigger: ${esc(payload.title)}</li>` : ''}
              </ul>
              <p><a href="${esc(logsUrl)}">Open the build log on Netlify</a></p>
              ${payload.deploy_ssl_url ? `<p><a href="${esc(payload.deploy_ssl_url)}">View this deploy</a></p>` : ''}
              <p style="color:#666">Full status and the last log lines are also in Admin, Bundles, Build status.</p>
            </div>`;

          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'DMTCode Deploys <onboarding@resend.dev>',
              to: recipients,
              subject,
              html,
            }),
          });
          if (!res.ok) {
            email_error = `Resend ${res.status}: ${(await res.text()).slice(0, 300)}`;
          } else {
            emailed = recipients.length;
          }
        }
      } catch (e) {
        email_error = (e as Error).message;
      }
    } else {
      email_error = 'RESEND_API_KEY is not set.';
    }

    if (email_error) console.error('deploy email:', email_error);

    return json({ ok: true, state, notified: true, emailed, email_error });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
