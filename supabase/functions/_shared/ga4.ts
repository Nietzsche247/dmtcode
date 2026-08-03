// Shared GA4 Data API auth + query helpers.
// Deno has no googleapis helper, so the service-account JWT-bearer flow is
// hand-rolled here. Used by both `ga4-report` and `intel-snapshot`.

export interface ServiceAccount {
  client_email: string;
  private_key: string;
}

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

/** Parses GA4_SERVICE_ACCOUNT_JSON, throwing readable errors. */
export function parseServiceAccount(raw: string | undefined): ServiceAccount {
  if (!raw) {
    throw new Error(
      'GA4_SERVICE_ACCOUNT_JSON is not set. Add the service-account key JSON in Project Settings, Secrets.',
    );
  }
  let sa: ServiceAccount;
  try {
    sa = JSON.parse(raw);
  } catch {
    throw new Error(
      'GA4_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the full service-account key file contents.',
    );
  }
  if (!sa.client_email || !sa.private_key) {
    throw new Error('GA4_SERVICE_ACCOUNT_JSON is missing client_email or private_key.');
  }
  return sa;
}

export async function getAccessToken(sa: ServiceAccount): Promise<string> {
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
  if (!res.ok) throw new Error(`Google token exchange failed [${res.status}]: ${text}`);
  const data = JSON.parse(text) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: now + (data.expires_in || 3600) };
  return data.access_token;
}

export interface RunReportResult {
  ok: boolean;
  status: number;
  data?: any;
  error?: string;
}

export async function runReport(
  propertyId: string,
  token: string,
  payload: Record<string, unknown>,
): Promise<RunReportResult> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const detail = await res.text();
    return { ok: false, status: res.status, error: detail };
  }
  return { ok: true, status: res.status, data: await res.json() };
}

export const num = (v: string | undefined | null): number => (v == null ? 0 : Number(v) || 0);
