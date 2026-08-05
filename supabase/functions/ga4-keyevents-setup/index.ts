const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b, null, 2), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const safe = (t: string) => { try { return JSON.parse(t); } catch { return t; } };

function b64url(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let bin = ''; for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function pemToPkcs8(pem: string): ArrayBuffer {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\\n/g, '').replace(/\s+/g, '');
  const raw = atob(body); const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i); return bytes.buffer;
}
async function editToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/analytics.edit', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now }));
  const signingInput = `${header}.${claims}`;
  const key = await crypto.subtle.importKey('pkcs8', pemToPkcs8(sa.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput)));
  const assertion = `${signingInput}.${b64url(sig)}`;
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
  const text = await res.text();
  if (!res.ok) throw new Error(`token exchange ${res.status}: ${text}`);
  return JSON.parse(text).access_token;
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const propertyId = Deno.env.get('GA4_PROPERTY_ID');
    if (!propertyId) return json({ error: 'GA4_PROPERTY_ID not set' }, 500);
    const saRaw = Deno.env.get('GA4_SERVICE_ACCOUNT_JSON');
    if (!saRaw) return json({ error: 'GA4_SERVICE_ACCOUNT_JSON not set' }, 500);
    const sa = JSON.parse(saRaw);
    let token: string;
    try { token = await editToken(sa); } catch (e) { return json({ step: 'token', error: String(e) }, 500); }
    const base = `https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}/keyEvents`;
    const events = ['bundle_cta_click', 'form_start', 'purchase', 'prepare_notify_signup'];
    const created: unknown[] = [];
    for (const eventName of events) {
      const r = await fetch(base, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ eventName }) });
      created.push({ eventName, status: r.status, ok: r.ok, body: safe(await r.text()) });
    }
    const listRes = await fetch(base, { headers: { Authorization: `Bearer ${token}` } });
    return json({ propertyId, serviceAccount: sa.client_email, created, list: { status: listRes.status, body: safe(await listRes.text()) } });
  } catch (e) { return json({ error: String(e) }, 500); }
});
