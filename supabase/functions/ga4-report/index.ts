// GA4 Data API reader for the admin Analytics tab.
// Auth/token/query logic lives in ../_shared/ga4.ts and is shared with `intel-snapshot`.

import { parseServiceAccount, getAccessToken, runReport, num } from '../_shared/ga4.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const RANGES: Record<string, string> = { '7d': '7daysAgo', '28d': '28daysAgo', '90d': '90daysAgo' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const propertyId = Deno.env.get('GA4_PROPERTY_ID');
    if (!propertyId) {
      return json(
        { error: 'GA4_PROPERTY_ID is not set. Add the numeric GA4 property ID in Project Settings, Secrets.' },
        500,
      );
    }

    let sa;
    try {
      sa = parseServiceAccount(Deno.env.get('GA4_SERVICE_ACCOUNT_JSON'));
    } catch (e) {
      return json({ error: (e as Error).message }, 500);
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
      const res = await runReport(propertyId, token, r.payload);
      if (!res.ok) {
        console.error(`GA4 runReport (${r.key}) failed [${res.status}]: ${res.error}`);
        if (res.status === 403) {
          return json(
            {
              error:
                `Google returned 403 for property ${propertyId}. The service account (${sa.client_email}) has not been granted access to this GA4 property. Add it as a Viewer in GA4 Admin, Property access management.`,
              status: 403,
              details: res.error,
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
              details: res.error,
            },
            404,
          );
        }
        return json(
          { error: `GA4 request "${r.key}" failed (${res.status}).`, status: res.status, details: res.error },
          res.status,
        );
      }
      results[r.key] = res.data;
    }

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
