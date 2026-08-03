// intel-snapshot: the single computation pass behind the unified analytics layer.
//
// It gathers GA4, crawler, and business-table numbers once, writes ONE
// intel_snapshots row plus N intel_metrics rows, and is read by both the admin
// Intel tab and by external agents over plain SQL. Nothing downstream may
// recompute a metric: one computation, two consumers.
//
// Extending: add an entry to METRIC_REGISTRY below. Nothing else needs to change.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { parseServiceAccount, getAccessToken, runReport, num } from '../_shared/ga4.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-intel-key',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

type Quality = 'ok' | 'degraded' | 'unavailable';

interface MetricResult {
  value: number | null;
  prior_value?: number | null;
  quality?: Quality;
  note?: string | null;
}

interface MetricDef {
  domain: 'traffic' | 'crawlers' | 'content' | 'community' | 'commerce' | 'moderation' | 'research';
  metric_key: string;
  label: string;
  unit: 'count' | 'percent' | 'seconds' | 'ratio';
  compute: (ctx: Ctx) => MetricResult | Promise<MetricResult>;
}

// ---------------------------------------------------------------- context

interface Ctx {
  db: ReturnType<typeof createClient>;
  periodDays: number;
  now: Date;
  curStart: Date;
  priorStart: Date;
  ga4: {
    reachable: boolean;
    error: string | null;
    cur: Record<string, number>;
    prior: Record<string, number>;
    payload: Record<string, unknown>;
  };
  crawlers: {
    ok: boolean;
    error: string | null;
    curTotal: number;
    priorTotal: number;
    uniqueBots: number;
    priorUniqueBots: number;
    answerHits: number;
    priorAnswerHits: number;
    sections: number;
    priorSections: number;
    silentBots: number;
    gapDays: string[];
    curGap: boolean;
    priorGap: boolean;
    statusCodeCoverage: number;
  };
  counts: Record<string, { value: number | null; prior: number | null; error?: string }>;
}

const iso = (d: Date) => d.toISOString();
const dayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

const gapNote = (days: string[]) =>
  `crawler_hits has no rows on ${days.join(', ')}. A change across a logging gap would be fictional, so no comparison is reported.`;

// ---------------------------------------------------------------- registry

const cumulative = (key: string) => (ctx: Ctx): MetricResult => {
  const c = ctx.counts[key];
  if (!c || c.value === null) {
    return { value: null, quality: 'unavailable', note: c?.error ?? 'Source table could not be read.' };
  }
  return { value: c.value, prior_value: c.prior };
};

export const METRIC_REGISTRY: MetricDef[] = [
  // ---- traffic (GA4 Data API) ----
  {
    domain: 'traffic', metric_key: 'ga4_sessions', label: 'Sessions', unit: 'count',
    compute: (c) => ga4Metric(c, 'sessions'),
  },
  {
    domain: 'traffic', metric_key: 'ga4_active_users', label: 'Active users', unit: 'count',
    compute: (c) => ga4Metric(c, 'activeUsers'),
  },
  {
    domain: 'traffic', metric_key: 'ga4_pageviews', label: 'Pageviews', unit: 'count',
    compute: (c) => ga4Metric(c, 'screenPageViews'),
  },
  {
    domain: 'traffic', metric_key: 'ga4_bounce_rate', label: 'Bounce rate', unit: 'percent',
    compute: (c) => ga4Metric(c, 'bounceRate', 100),
  },
  {
    domain: 'traffic', metric_key: 'ga4_avg_session_seconds', label: 'Avg session duration', unit: 'seconds',
    compute: (c) => ga4Metric(c, 'averageSessionDuration'),
  },

  // ---- crawlers (crawler_hits) ----
  {
    domain: 'crawlers', metric_key: 'crawler_hits_total', label: 'Crawler hits', unit: 'count',
    compute: (c) => crawlerMetric(c, c.crawlers.curTotal, c.crawlers.priorTotal),
  },
  {
    domain: 'crawlers', metric_key: 'crawler_unique_bots', label: 'Unique bots', unit: 'count',
    compute: (c) => crawlerMetric(c, c.crawlers.uniqueBots, c.crawlers.priorUniqueBots),
  },
  {
    domain: 'crawlers', metric_key: 'crawler_answer_bot_hits', label: 'Answer-engine hits', unit: 'count',
    compute: (c) => crawlerMetric(c, c.crawlers.answerHits, c.crawlers.priorAnswerHits),
  },
  {
    domain: 'crawlers', metric_key: 'crawler_answer_bot_rate', label: 'Answer-engine share', unit: 'percent',
    compute: (c) => {
      const cur = c.crawlers.curTotal > 0 ? (c.crawlers.answerHits / c.crawlers.curTotal) * 100 : null;
      const prior = c.crawlers.priorTotal > 0 ? (c.crawlers.priorAnswerHits / c.crawlers.priorTotal) * 100 : null;
      return crawlerMetric(c, cur, prior);
    },
  },
  {
    domain: 'crawlers', metric_key: 'crawler_sections_covered', label: 'Site sections crawled', unit: 'count',
    compute: (c) => crawlerMetric(c, c.crawlers.sections, c.crawlers.priorSections),
  },
  {
    domain: 'crawlers', metric_key: 'crawler_bots_silent_7d', label: 'Bots gone quiet', unit: 'count',
    compute: (c) => {
      if (!c.crawlers.ok) return unavailable(c.crawlers.error);
      return { value: c.crawlers.silentBots, prior_value: null };
    },
  },

  // ---- content ----
  { domain: 'content', metric_key: 'content_articles', label: 'Published articles', unit: 'count', compute: cumulative('content_articles') },
  { domain: 'content', metric_key: 'content_guides', label: 'Published guides', unit: 'count', compute: cumulative('content_guides') },
  { domain: 'content', metric_key: 'content_protocols', label: 'Published protocols', unit: 'count', compute: cumulative('content_protocols') },
  { domain: 'content', metric_key: 'content_theories', label: 'Approved theories', unit: 'count', compute: cumulative('content_theories') },
  { domain: 'content', metric_key: 'content_bibliography_total', label: 'Bibliography records', unit: 'count', compute: cumulative('content_bibliography_total') },
  { domain: 'content', metric_key: 'content_bibliography_approved', label: 'Bibliography approved', unit: 'count', compute: cumulative('content_bibliography_approved') },
  {
    domain: 'content', metric_key: 'content_stale_90d', label: 'Published items stale 90d+', unit: 'count',
    compute: (c) => {
      const s = c.counts.content_stale_90d;
      if (!s || s.value === null) return unavailable(s?.error);
      return { value: s.value, prior_value: null };
    },
  },

  // ---- community ----
  { domain: 'community', metric_key: 'community_profiles', label: 'Profiles', unit: 'count', compute: cumulative('community_profiles') },
  { domain: 'community', metric_key: 'community_symbol_submissions', label: 'Symbol submissions', unit: 'count', compute: cumulative('community_symbol_submissions') },
  { domain: 'community', metric_key: 'community_registry_glyphs', label: 'Registry glyphs', unit: 'count', compute: cumulative('community_registry_glyphs') },
  { domain: 'community', metric_key: 'community_follows', label: 'Follows', unit: 'count', compute: cumulative('community_follows') },
  { domain: 'community', metric_key: 'community_trial_watchers', label: 'Trial watchers', unit: 'count', compute: cumulative('community_trial_watchers') },

  // ---- commerce ----
  { domain: 'commerce', metric_key: 'commerce_product_signups', label: 'Kit signups', unit: 'count', compute: cumulative('commerce_product_signups') },
  { domain: 'commerce', metric_key: 'commerce_waitlist', label: 'Waitlist', unit: 'count', compute: cumulative('commerce_waitlist') },
  { domain: 'commerce', metric_key: 'commerce_bundles_active', label: 'Published bundles', unit: 'count', compute: cumulative('commerce_bundles_active') },

  // ---- moderation (backlogs: rising is bad) ----
  { domain: 'moderation', metric_key: 'moderation_symbols_unreviewed', label: 'Symbols awaiting review', unit: 'count', compute: cumulative('moderation_symbols_unreviewed') },
  { domain: 'moderation', metric_key: 'moderation_bibliography_unapproved', label: 'Bibliography awaiting approval', unit: 'count', compute: cumulative('moderation_bibliography_unapproved') },

  // ---- research ----
  { domain: 'research', metric_key: 'research_trials_total', label: 'Trial records', unit: 'count', compute: cumulative('research_trials_total') },
  { domain: 'research', metric_key: 'research_trials_approved', label: 'Trial records approved', unit: 'count', compute: cumulative('research_trials_approved') },
];

function unavailable(note?: string | null): MetricResult {
  return { value: null, quality: 'unavailable', note: note ?? 'Source could not be read.' };
}

function ga4Metric(c: Ctx, key: string, scale = 1): MetricResult {
  if (!c.ga4.reachable) {
    return {
      value: null,
      quality: 'unavailable',
      note: c.ga4.error ?? 'The GA4 Data API could not be reached, so no traffic number is reported.',
    };
  }
  return { value: c.ga4.cur[key] * scale, prior_value: c.ga4.prior[key] * scale };
}

function crawlerMetric(c: Ctx, cur: number | null, prior: number | null): MetricResult {
  if (!c.crawlers.ok) return unavailable(c.crawlers.error);
  if (c.crawlers.curGap || c.crawlers.priorGap) {
    return {
      value: cur,
      prior_value: null,
      quality: 'degraded',
      note: gapNote(c.crawlers.gapDays),
    };
  }
  return { value: cur, prior_value: prior };
}

// ---------------------------------------------------------------- gathering

async function countRows(
  db: Ctx['db'],
  table: string,
  build: (q: any) => any,
): Promise<{ value: number | null; error?: string }> {
  const { count, error } = await build(db.from(table).select('*', { count: 'exact', head: true }));
  if (error) return { value: null, error: `Could not read ${table}: ${error.message}` };
  return { value: count ?? 0 };
}

/** Cumulative total now, and the same total as it stood at the start of the window. */
async function cumulativePair(
  db: Ctx['db'],
  table: string,
  curStart: Date,
  filter: (q: any) => any = (q) => q,
  createdCol = 'created_at',
) {
  const now = await countRows(db, table, filter);
  if (now.value === null) return { value: null, prior: null, error: now.error };
  const before = await countRows(db, table, (q) => filter(q).lt(createdCol, iso(curStart)));
  return { value: now.value, prior: before.value };
}

const ANSWER_BOTS = new Set([
  'ChatGPT-User', 'OAI-SearchBot', 'Claude-User', 'Claude-SearchBot', 'Perplexity-User', 'PerplexityBot',
]);

async function gatherCrawlers(db: Ctx['db'], now: Date, curStart: Date, priorStart: Date) {
  const out: Ctx['crawlers'] = {
    ok: false, error: null, curTotal: 0, priorTotal: 0, uniqueBots: 0, priorUniqueBots: 0,
    answerHits: 0, priorAnswerHits: 0, sections: 0, priorSections: 0, silentBots: 0,
    gapDays: [], curGap: false, priorGap: false, statusCodeCoverage: 0,
  };

  const since30 = new Date(now.getTime() - 30 * 86400_000);
  const { data, error } = await db
    .from('crawler_hits')
    .select('ts,path,bot_name,bot_class')
    .gte('ts', iso(since30))
    .order('ts', { ascending: false })
    .limit(50000);

  if (error) {
    out.error = `Could not read crawler_hits: ${error.message}`;
    return out;
  }
  out.ok = true;

  const rows = (data ?? []) as Array<{ ts: string; path: string | null; bot_name: string | null; bot_class: string | null }>;

  const inRange = (r: { ts: string }, from: Date, to: Date) => {
    const t = new Date(r.ts).getTime();
    return t >= from.getTime() && t < to.getTime();
  };
  const cur = rows.filter((r) => inRange(r, curStart, now));
  const prior = rows.filter((r) => inRange(r, priorStart, curStart));

  const section = (p: string | null) => (p ? '/' + p.split('/').filter(Boolean)[0] ?? '/' : '/');

  out.curTotal = cur.length;
  out.priorTotal = prior.length;
  out.uniqueBots = new Set(cur.map((r) => r.bot_name)).size;
  out.priorUniqueBots = new Set(prior.map((r) => r.bot_name)).size;
  out.answerHits = cur.filter((r) => r.bot_class === 'answer' || ANSWER_BOTS.has(r.bot_name ?? '')).length;
  out.priorAnswerHits = prior.filter((r) => r.bot_class === 'answer' || ANSWER_BOTS.has(r.bot_name ?? '')).length;
  out.sections = new Set(cur.map((r) => section(r.path))).size;
  out.priorSections = new Set(prior.map((r) => section(r.path))).size;

  const seenEver = new Set(rows.map((r) => r.bot_name).filter(Boolean) as string[]);
  const seenNow = new Set(cur.map((r) => r.bot_name).filter(Boolean) as string[]);
  out.silentBots = [...seenEver].filter((b) => !seenNow.has(b)).length;

  // Gap detection across the last 30 days.
  const present = new Set(rows.map((r) => dayKey(r.ts)));
  for (let i = 1; i <= 30; i++) {
    const d = new Date(now.getTime() - i * 86400_000);
    const k = dayKey(d);
    if (!present.has(k)) out.gapDays.push(k);
  }
  out.gapDays.sort();
  const curGapDays = out.gapDays.filter((d) => d >= dayKey(curStart));
  const priorGapDays = out.gapDays.filter((d) => d >= dayKey(priorStart) && d < dayKey(curStart));
  out.curGap = curGapDays.length > 0;
  out.priorGap = priorGapDays.length > 0;

  // status_code coverage: the column does not exist yet. Report 0 honestly.
  const probe = await db.from('crawler_hits').select('status_code').limit(1);
  if (probe.error) {
    out.statusCodeCoverage = 0;
  } else {
    const last7 = await db
      .from('crawler_hits')
      .select('status_code')
      .gte('ts', iso(curStart))
      .limit(50000);
    const r7 = (last7.data ?? []) as Array<{ status_code: number | null }>;
    out.statusCodeCoverage = r7.length
      ? Math.round((r7.filter((x) => x.status_code != null).length / r7.length) * 100)
      : 0;
  }

  return out;
}

async function gatherGa4(periodDays: number) {
  const res: Ctx['ga4'] = { reachable: false, error: null, cur: {}, prior: {}, payload: {} };
  const propertyId = Deno.env.get('GA4_PROPERTY_ID');
  if (!propertyId) {
    res.error = 'GA4_PROPERTY_ID is not set, so no traffic numbers were collected.';
    return res;
  }
  let sa;
  try {
    sa = parseServiceAccount(Deno.env.get('GA4_SERVICE_ACCOUNT_JSON'));
  } catch (e) {
    res.error = (e as Error).message;
    return res;
  }

  let token: string;
  try {
    token = await getAccessToken(sa);
  } catch (e) {
    res.error = `Could not mint a Google access token: ${(e as Error).message}`;
    return res;
  }

  const curRange = [{ startDate: `${periodDays}daysAgo`, endDate: 'today' }];
  const priorRange = [{ startDate: `${periodDays * 2}daysAgo`, endDate: `${periodDays + 1}daysAgo` }];
  const metrics = [
    { name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' },
    { name: 'averageSessionDuration' }, { name: 'bounceRate' },
  ];
  const keys = ['activeUsers', 'sessions', 'screenPageViews', 'averageSessionDuration', 'bounceRate'];

  const totals = await runReport(propertyId, token, { dateRanges: curRange, metrics });
  if (!totals.ok) {
    res.error = `GA4 returned ${totals.status}: ${String(totals.error).slice(0, 300)}`;
    return res;
  }
  const priorTotals = await runReport(propertyId, token, { dateRanges: priorRange, metrics });

  const read = (data: any) => {
    const mv = data?.rows?.[0]?.metricValues ?? [];
    const o: Record<string, number> = {};
    keys.forEach((k, i) => (o[k] = num(mv[i]?.value)));
    return o;
  };
  res.cur = read(totals.data);
  res.prior = priorTotals.ok ? read(priorTotals.data) : read(null);
  res.reachable = true;

  const [byDate, topPages, channels, events] = await Promise.all([
    runReport(propertyId, token, {
      dateRanges: curRange, dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 400,
    }),
    runReport(propertyId, token, {
      dateRanges: curRange, dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 20,
    }),
    runReport(propertyId, token, {
      dateRanges: curRange, dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 20,
    }),
    runReport(propertyId, token, {
      dateRanges: curRange, dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }], limit: 20,
    }),
  ]);

  res.payload = {
    byDate: (byDate.data?.rows ?? []).map((row: any) => {
      const d = String(row.dimensionValues?.[0]?.value ?? '');
      return {
        date: d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d,
        activeUsers: num(row.metricValues?.[0]?.value),
        sessions: num(row.metricValues?.[1]?.value),
      };
    }),
    topPages: (topPages.data?.rows ?? []).map((row: any) => ({
      pagePath: String(row.dimensionValues?.[0]?.value ?? ''),
      screenPageViews: num(row.metricValues?.[0]?.value),
      activeUsers: num(row.metricValues?.[1]?.value),
    })),
    channels: (channels.data?.rows ?? []).map((row: any) => ({
      channel: String(row.dimensionValues?.[0]?.value ?? ''),
      sessions: num(row.metricValues?.[0]?.value),
    })),
    events: (events.data?.rows ?? []).map((row: any) => ({
      eventName: String(row.dimensionValues?.[0]?.value ?? ''),
      eventCount: num(row.metricValues?.[0]?.value),
    })),
  };
  return res;
}

async function gatherCounts(db: Ctx['db'], curStart: Date) {
  const stale = new Date(Date.now() - 90 * 86400_000);
  const out: Ctx['counts'] = {};

  out.content_articles = await cumulativePair(db, 'articles', curStart, (q) => q.eq('is_published', true));
  out.content_guides = await cumulativePair(db, 'guides', curStart, (q) => q.eq('is_published', true));
  out.content_protocols = await cumulativePair(db, 'protocols', curStart, (q) => q.eq('is_published', true));
  out.content_theories = await cumulativePair(db, 'theories', curStart, (q) => q.eq('is_approved', true));
  out.content_bibliography_total = await cumulativePair(db, 'bibliography', curStart);
  out.content_bibliography_approved = await cumulativePair(db, 'bibliography', curStart, (q) => q.eq('is_approved', true));

  const staleParts = await Promise.all([
    countRows(db, 'articles', (q) => q.eq('is_published', true).lt('updated_at', iso(stale))),
    countRows(db, 'guides', (q) => q.eq('is_published', true).lt('updated_at', iso(stale))),
    countRows(db, 'protocols', (q) => q.eq('is_published', true).lt('updated_at', iso(stale))),
  ]);
  const staleErr = staleParts.find((p) => p.value === null);
  out.content_stale_90d = staleErr
    ? { value: null, prior: null, error: staleErr.error }
    : { value: staleParts.reduce((a, p) => a + (p.value ?? 0), 0), prior: null };

  out.community_profiles = await cumulativePair(db, 'profiles', curStart);
  out.community_symbol_submissions = await cumulativePair(db, 'symbol_submissions', curStart, (q) => q.eq('is_curated_example', false));
  out.community_registry_glyphs = await cumulativePair(db, 'registry_glyphs', curStart);
  out.community_follows = await cumulativePair(db, 'follows', curStart);
  out.community_trial_watchers = await cumulativePair(db, 'trial_watchlist', curStart);

  out.commerce_product_signups = await cumulativePair(db, 'product_signups', curStart);
  out.commerce_waitlist = await cumulativePair(db, 'waitlist', curStart);
  out.commerce_bundles_active = await cumulativePair(db, 'bundles', curStart, (q) => q.eq('is_published', true));

  out.moderation_symbols_unreviewed = await cumulativePair(db, 'symbol_submissions', curStart, (q) =>
    q.eq('moderation_status', 'unreviewed').eq('is_curated_example', false));
  out.moderation_bibliography_unapproved = await cumulativePair(db, 'bibliography', curStart, (q) => q.eq('is_approved', false));

  out.research_trials_total = await cumulativePair(db, 'clinical_trials', curStart);
  out.research_trials_approved = await cumulativePair(db, 'clinical_trials', curStart, (q) => q.eq('is_approved', true));

  return out;
}

// ---------------------------------------------------------------- handler

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Machine callers (pg_cron) present the shared secret. Browser callers
  // ("Run now" in the admin UI) can never hold it, so they present a Supabase
  // JWT and are checked for the admin role instead.
  const cronSecret = Deno.env.get('INTEL_CRON_SECRET');
  const hasCronKey = !!cronSecret && req.headers.get('x-intel-key') === cronSecret;
  let authorized = hasCronKey;

  if (!authorized) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const token = authHeader.replace('Bearer ', '');
      const { data: claimData } = await userClient.auth.getClaims(token);
      const userId = claimData?.claims?.sub as string | undefined;
      if (userId) {
        const admin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          { auth: { persistSession: false } },
        );
        const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin' });
        authorized = isAdmin === true;
      }
    }
  }

  if (!authorized) return json({ error: 'Unauthorized' }, 401);


  const started = Date.now();
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  let periodDays = 7;
  try {
    const body = await req.json();
    if (typeof body?.periodDays === 'number' && body.periodDays > 0) periodDays = Math.floor(body.periodDays);
  } catch { /* no body is fine */ }

  const now = new Date();
  const curStart = new Date(now.getTime() - periodDays * 86400_000);
  const priorStart = new Date(now.getTime() - periodDays * 2 * 86400_000);

  try {
    const [ga4, crawlers, counts] = await Promise.all([
      gatherGa4(periodDays),
      gatherCrawlers(db, now, curStart, priorStart),
      gatherCounts(db, curStart),
    ]);

    const ctx: Ctx = { db, periodDays, now, curStart, priorStart, ga4, crawlers, counts };

    // ---- data_health ----
    const prevSnap = await db
      .from('intel_snapshots')
      .select('captured_at')
      .eq('status', 'ok')
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastSuccessful = (prevSnap.data as { captured_at: string } | null)?.captured_at ?? null;
    const stale = lastSuccessful ? Date.now() - new Date(lastSuccessful).getTime() > 48 * 3600_000 : true;

    const warnings: string[] = [];
    if (crawlers.gapDays.length) {
      warnings.push(
        `Crawler logging has ${crawlers.gapDays.length} day(s) with zero rows in the last 30 days (${crawlers.gapDays.join(', ')}). Period-over-period crawler comparisons spanning those days are suppressed.`,
      );
    }
    if (crawlers.statusCodeCoverage === 0) {
      warnings.push(
        'crawler_hits records no status_code, so a bot hammering 404s is indistinguishable from a bot successfully reading pages. Crawl coverage numbers should be read as requests, not successful reads.',
      );
    }
    if (!ga4.reachable) {
      warnings.push(`Traffic numbers are unavailable: ${ga4.error}`);
    }
    warnings.push(
      'posthog-js is absent from package.json; bundle_purchased, bundle_checkout_started and upsell events fire into a no-op.',
    );
    if (stale) {
      warnings.push(
        lastSuccessful
          ? `The previous successful snapshot is older than 48 hours (${lastSuccessful}). The scheduled job may not be running.`
          : 'This is the first snapshot, so there is no history to compare against yet.',
      );
    }
    const failedCounts = Object.entries(counts).filter(([, v]) => v.value === null);
    for (const [k, v] of failedCounts) warnings.push(`${k} is unavailable: ${v.error}`);

    const data_health = {
      crawler_gap_days: crawlers.gapDays,
      crawler_status_code_coverage: crawlers.statusCodeCoverage,
      ga4_reachable: ga4.reachable,
      ga4_error: ga4.reachable ? null : ga4.error,
      posthog_installed: false,
      posthog_note:
        'posthog-js absent from package.json; bundle_purchased, bundle_checkout_started and upsell events fire into a no-op',
      last_successful_snapshot: lastSuccessful,
      stale,
      warnings,
    };

    const degraded = !ga4.reachable || !crawlers.ok || failedCounts.length > 0;
    const capturedAt = new Date().toISOString();

    const { data: snapRow, error: snapErr } = await db
      .from('intel_snapshots')
      .insert({
        captured_at: capturedAt,
        period_days: periodDays,
        payload: { ga4: ga4.payload, period: { start: iso(curStart), end: iso(now) } },
        data_health,
        duration_ms: Date.now() - started,
        status: degraded ? 'partial' : 'ok',
      })
      .select('id')
      .single();

    if (snapErr) throw new Error(`Could not write intel_snapshots: ${snapErr.message}`);
    const snapshotId = (snapRow as { id: string }).id;

    // ---- run the registry ----
    const rows: Record<string, unknown>[] = [];
    for (const def of METRIC_REGISTRY) {
      let r: MetricResult;
      try {
        r = await def.compute(ctx);
      } catch (e) {
        r = { value: null, quality: 'unavailable', note: `Computation failed: ${(e as Error).message}` };
      }
      const value = r.value == null ? null : Number(r.value.toFixed(4));
      const prior = r.prior_value == null ? null : Number(r.prior_value.toFixed(4));
      const delta =
        value != null && prior != null && prior !== 0
          ? Number((((value - prior) / prior) * 100).toFixed(2))
          : null;

      rows.push({
        snapshot_id: snapshotId,
        captured_at: capturedAt,
        domain: def.domain,
        metric_key: def.metric_key,
        label: def.label,
        value,
        prior_value: prior,
        delta_pct: delta,
        unit: def.unit,
        quality: r.quality ?? 'ok',
        note: r.note ?? null,
      });
    }

    const { error: metricErr } = await db.from('intel_metrics').insert(rows);
    if (metricErr) throw new Error(`Could not write intel_metrics: ${metricErr.message}`);

    return json({
      snapshot_id: snapshotId,
      captured_at: capturedAt,
      status: degraded ? 'partial' : 'ok',
      metrics_written: rows.length,
      duration_ms: Date.now() - started,
      data_health,
    });
  } catch (e) {
    const message = (e as Error).message;
    console.error('intel-snapshot failed:', message);
    try {
      await db.from('intel_snapshots').insert({
        period_days: periodDays,
        payload: {},
        data_health: { warnings: [`Snapshot run failed: ${message}`] },
        duration_ms: Date.now() - started,
        status: 'failed',
        error: message,
      });
    } catch { /* nothing more we can do */ }
    return json({ error: message }, 500);
  }
});
