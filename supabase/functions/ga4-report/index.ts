// GA4 Data API reader. Mints a Google OAuth2 token from a service-account key
// using the hand-rolled JWT-bearer flow (Deno has no googleapis helper), then
// calls properties/{id}:runReport.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Module-scope token cache: reused across invocations on a warm instance.
let cachedToken: { token: string; expiresAt: number } | null = null;

function pemToPkcs8(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '');
  const raw = atob(body);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

function b64url(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  // Reuse until ~5 minutes before expiry.
  if (cachedToken && cachedToken.expiresAt - 300 > now) return cachedToken.token;

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }),
  );
  const signingInput = `${header}.${claims}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput)),
  );
  const assertion = `${signingInput}.${b64url(sig)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Google token exchange failed [${res.status}]: ${text}`);
  }
  const data = JSON.parse(text) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: now + (data.expires_in || 3600) };
  return data.access_token;
}

const RANGES: Record<string, string> = { '7d': '7daysAgo', '28d': '28daysAgo', '90d': '90daysAgo' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const rawSa = Deno.env.get('GA4_SERVICE_ACCOUNT_JSON');
    const propertyId = Deno.env.get('GA4_PROPERTY_ID');

    if (!rawSa) {
      return json(
        { error: 'GA4_SERVICE_ACCOUNT_JSON is not set. Add the service-account key JSON in Project Settings, Secrets.' },
        500,
      );
    }
    if (!propertyId) {
      return json(
        { error: 'GA4_PROPERTY_ID is not set. Add the numeric GA4 property ID in Project Settings, Secrets.' },
        500,
      );
    }

    let sa: { client_email: string; private_key: string };
    try {
      sa = JSON.parse(rawSa);
    } catch {
      return json({ error: 'GA4_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the full service-account key file contents.' }, 500);
    }
    if (!sa.client_email || !sa.private_key) {
      return json({ error: 'GA4_SERVICE_ACCOUNT_JSON is missing client_email or private_key.' }, 500);
    }

    let body: { dateRange?: string } = {};
    try {
      body = await req.json();
    } catch { /* empty body is fine */ }
    const rangeKey = RANGES[body.dateRange ?? '28d'] ? (body.dateRange as string) : '28d';
    const startDate = RANGES[rangeKey];

    let token: string;
    try {
      token = await getAccessToken(sa);
    } catch (e) {
      return json({ error: `Could not mint a Google access token: ${(e as Error).message}` }, 500);
    }

    const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
    const dateRanges = [{ startDate, endDate: 'today' }];

    const requests: { key: string; payload: Record<string, unknown> }[] = [
      {
        key: 'totals',
        payload: {
          dateRanges,
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
        },
      },
      {
        key: 'byDate',
        payload: {
          dateRanges,
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
          limit: 400,
        },
      },
      {
        key: 'topPages',
        payload: {
          dateRanges,
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 20,
        },
      },
      {
        key: 'channels',
        payload: {
          dateRanges,
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 20,
        },
      },
      {
        key: 'events',
        payload: {
          dateRanges,
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: 20,
        },
      },
    ];

    const results: Record<string, any> = {};
    for (const r of requests) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(r.payload),
      });
      if (!res.ok) {
        const detail = await res.text();
        console.error(`GA4 runReport (${r.key}) failed [${res.status}]: ${detail}`);
        if (res.status === 403) {
          return json(
            {
              error:
                `Google returned 403 for property ${propertyId}. The service account (${sa.client_email}) has not been granted access to this GA4 property. Add it as a Viewer in GA4 Admin, Property access management.`,
              status: 403,
              details: detail,
            },
            403,
          );
        }
        if (res.status === 404) {
          return json(
            {
              error:
                `Google returned 404 for property ${propertyId}. The GA4 property ID looks wrong. Use the numeric property ID from GA4 Admin, Property settings (not the measurement ID starting with G-).`,
              status: 404,
              details: detail,
            },
            404,
          );
        }
        return json({ error: `GA4 request "${r.key}" failed (${res.status}).`, status: res.status, details: detail }, res.status);

      }
      results[r.key] = await res.json();
    }

    const num = (v: string | undefined) => (v == null ? 0 : Number(v) || 0);
    const totalsRow = results.totals?.rows?.[0]?.metricValues ?? [];

    const payload = {
      dateRange: rangeKey,
      totals: {
        activeUsers: num(totalsRow[0]?.value),
        sessions: num(totalsRow[1]?.value),
        screenPageViews: num(totalsRow[2]?.value),
        averageSessionDuration: num(totalsRow[3]?.value),
        bounceRate: num(totalsRow[4]?.value),
      },
      byDate: (results.byDate?.rows ?? []).map((row: any) => {
        const d = String(row.dimensionValues?.[0]?.value ?? '');
        return {
          date: d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d,
          activeUsers: num(row.metricValues?.[0]?.value),
          sessions: num(row.metricValues?.[1]?.value),
        };
      }),
      topPages: (results.topPages?.rows ?? []).map((row: any) => ({
        pagePath: String(row.dimensionValues?.[0]?.value ?? ''),
        screenPageViews: num(row.metricValues?.[0]?.value),
        activeUsers: num(row.metricValues?.[1]?.value),
      })),
      channels: (results.channels?.rows ?? []).map((row: any) => ({
        channel: String(row.dimensionValues?.[0]?.value ?? ''),
        sessions: num(row.metricValues?.[0]?.value),
      })),
      events: (results.events?.rows ?? []).map((row: any) => ({
        eventName: String(row.dimensionValues?.[0]?.value ?? ''),
        eventCount: num(row.metricValues?.[0]?.value),
      })),
    };

    return json(payload);
  } catch (e) {
    console.error('ga4-report unexpected failure:', e);
    return json({ error: `Unexpected failure: ${(e as Error).message}` }, 500);
  }
});
