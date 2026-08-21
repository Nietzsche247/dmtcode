// trends-ingest: receives raw output files from the Python trends tracker that
// runs in an external sandbox every other day, parses them server side, and
// upserts trends_runs, trends_metrics and media_items.
//
// The tracker script must never need to change: it just posts its files.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-trends-key',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// ------------------------------------------------------------------ helpers

/** CSV line split that respects double quoted fields. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const nn = (v: string | undefined): string | null => {
  if (v === undefined) return null;
  const t = v.trim();
  return t === '' ? null : t;
};

const numOrNull = (v: string | undefined): number | null => {
  const s = nn(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const isoDate = (v: string | null): string | null =>
  v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;

async function fieldText(fd: FormData, name: string): Promise<string | null> {
  const v = fd.get(name);
  if (v === null) return null;
  if (typeof v === 'string') return v;
  return await (v as File).text();
}

interface MetricRow {
  run_date: string;
  source: string;
  keyword: string;
  keyword_group: string | null;
  last7: number | null;
  prior7: number | null;
  delta_pct: number | null;
  anchor_ratio: number | null;
  peak_date: string | null;
  peak_val: number | null;
  last28: number | null;
  prior28: number | null;
  delta28_pct: number | null;
}

function parseCsv(text: string): MetricRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];
  const rows: MetricRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    const f = splitCsvLine(lines[i]);
    if (i === 0 && f[0]?.toLowerCase() === 'run_date') continue;
    if (f.length < 10) continue;
    const run_date = isoDate(nn(f[0]));
    const source = nn(f[1]);
    const keyword = nn(f[2]);
    if (!run_date || !source || !keyword) continue;
    rows.push({
      run_date,
      source,
      keyword,
      keyword_group: nn(f[3]),
      last7: numOrNull(f[4]),
      prior7: numOrNull(f[5]),
      delta_pct: numOrNull(f[6]),
      anchor_ratio: numOrNull(f[7]),
      peak_date: isoDate(nn(f[8])),
      peak_val: numOrNull(f[9]),
      last28: f.length >= 13 ? numOrNull(f[10]) : null,
      prior28: f.length >= 13 ? numOrNull(f[11]) : null,
      delta28_pct: f.length >= 13 ? numOrNull(f[12]) : null,
    });
  }
  return rows;
}

interface MediaRow {
  id: string;
  kind: string;
  title: string;
  channel: string | null;
  published_raw: string | null;
  published_date: string | null;
  url: string | null;
  views: number | null;
  first_seen: string;
  last_seen: string;
}

function parseMedia(raw: unknown, runDate: string): MediaRow[] {
  const out: MediaRow[] = [];
  const doc = (raw ?? {}) as Record<string, Record<string, Record<string, unknown>>>;
  const str = (v: unknown): string | null =>
    typeof v === 'string' && v.trim() !== '' ? v.trim() : null;

  for (const [key, e] of Object.entries(doc.videos ?? {})) {
    const published = str(e.published);
    out.push({
      id: `yt:${key}`,
      kind: 'video',
      title: str(e.title) ?? key,
      channel: str(e.channel),
      published_raw: published,
      published_date: isoDate(published),
      url: `https://youtu.be/${key}`,
      views: typeof e.views === 'number' ? e.views : null,
      first_seen: isoDate(str(e.first_seen)) ?? runDate,
      last_seen: runDate,
    });
  }

  for (const [key, e] of Object.entries(doc.podcasts ?? {})) {
    const date = str(e.date);
    out.push({
      id: `pod:${key}`,
      kind: 'podcast',
      title: str(e.title) ?? key,
      channel: str(e.show),
      published_raw: date,
      published_date: isoDate(date),
      url: null,
      views: null,
      first_seen: isoDate(str(e.first_seen)) ?? runDate,
      last_seen: runDate,
    });
  }

  for (const [key, e] of Object.entries(doc.news ?? {})) {
    const date = str(e.date);
    const title = str(e.title) ?? key;
    const idx = title.lastIndexOf(' - ');
    out.push({
      id: `news:${key}`,
      kind: 'article',
      title,
      channel: idx > -1 ? title.slice(idx + 3).trim() || null : null,
      published_raw: date,
      published_date: isoDate(date),
      url: key,
      views: null,
      first_seen: isoDate(str(e.first_seen)) ?? runDate,
      last_seen: runDate,
    });
  }

  for (const [key, e] of Object.entries(doc.reddit ?? {})) {
    const date = str(e.date);
    out.push({
      id: `reddit:${key}`,
      kind: 'thread',
      title: str(e.title) ?? key,
      channel: null,
      published_raw: date,
      published_date: isoDate(date),
      url: `https://redd.it/${key.replace(/^t3_/, '')}`,
      views: null,
      first_seen: isoDate(str(e.first_seen)) ?? runDate,
      last_seen: runDate,
    });
  }

  return out;
}

// --------------------------------------------------------------------- main

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const started = Date.now();

  try {
    const expected =
      Deno.env.get('TRENDS_INGEST_SECRET') ?? Deno.env.get('INTEL_CRON_SECRET') ?? null;
    const provided = req.headers.get('x-trends-key');
    if (!expected || provided !== expected) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    const fd = await req.formData();
    const csvText = await fieldText(fd, 'csv');
    const mediaText = await fieldText(fd, 'media_seen');
    if (!csvText || !mediaText) {
      return json({ error: 'csv and media_seen are required' }, 400);
    }
    const summaryText = await fieldText(fd, 'summary');
    let summary: unknown = null;
    if (summaryText) {
      try {
        summary = JSON.parse(summaryText);
      } catch {
        summary = { raw: summaryText };
      }
    }

    const allRows = parseCsv(csvText);
    if (allRows.length === 0) {
      return json({ error: 'no parsable csv rows' }, 400);
    }

    const distinctDates = [...new Set(allRows.map((r) => r.run_date))].sort();
    const latestDate = distinctDates[distinctDates.length - 1];
    const requested = isoDate(nn((fd.get('run_date') as string | null) ?? null));
    const ingestAll = String(fd.get('all') ?? '') === '1';

    const runDates = ingestAll
      ? distinctDates
      : [requested && distinctDates.includes(requested) ? requested : latestDate];

    // ---------------------------------------------------------------- media
    let mediaDoc: unknown;
    try {
      mediaDoc = JSON.parse(mediaText);
    } catch {
      return json({ error: 'media_seen is not valid JSON' }, 400);
    }
    const mediaRows = parseMedia(mediaDoc, latestDate);
    const mediaTotal = mediaRows.length;

    const ids = mediaRows.map((m) => m.id);
    const existing = new Map<string, { views: number | null; prior_views: number | null }>();
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const { data, error } = await db
        .from('media_items')
        .select('id, views, prior_views')
        .in('id', chunk);
      if (error) throw error;
      for (const r of data ?? []) {
        existing.set(r.id as string, {
          views: (r.views as number | null) ?? null,
          prior_views: (r.prior_views as number | null) ?? null,
        });
      }
    }

    let mediaNew = 0;
    let mediaUpdated = 0;
    const upserts = mediaRows.map((m) => {
      const prev = existing.get(m.id);
      if (!prev) mediaNew++;
      let views = m.views;
      let prior_views = prev?.prior_views ?? null;
      if (prev) {
        if (m.views !== null && m.views !== prev.views) {
          prior_views = prev.views;
          views = m.views;
          mediaUpdated++;
        } else {
          views = prev.views;
        }
      }
      const row: Record<string, unknown> = {
        id: m.id,
        kind: m.kind,
        title: m.title,
        channel: m.channel,
        published_raw: m.published_raw,
        published_date: m.published_date,
        views,
        prior_views,
        last_seen: m.last_seen,
        updated_at: new Date().toISOString(),
      };
      if (m.url !== null) row.url = m.url;
      // first_seen is only written on insert; it must never change on conflict.
      if (!prev) row.first_seen = m.first_seen;

      return row;
    });

    // Rows that already exist keep their stored first_seen, so split the write:
    // inserts carry first_seen, updates omit it.
    const toInsert = upserts.filter((r) => 'first_seen' in r);
    const toUpdate = upserts.filter((r) => !('first_seen' in r));

    for (let i = 0; i < toInsert.length; i += 200) {
      const { error } = await db
        .from('media_items')
        .upsert(toInsert.slice(i, i + 200), { onConflict: 'id' });
      if (error) throw error;
    }
    for (const row of toUpdate) {
      const { id, ...patch } = row as { id: string } & Record<string, unknown>;
      const { error } = await db.from('media_items').update(patch).eq('id', id);
      if (error) throw error;
    }

    // -------------------------------------------------------------- metrics
    let metricsUpserted = 0;

    for (const runDate of runDates) {
      const rows = allRows.filter((r) => r.run_date === runDate);
      const isLatest = runDate === runDates[runDates.length - 1];

      const { data: runRow, error: runErr } = await db
        .from('trends_runs')
        .upsert(
          {
            run_date: runDate,
            received_at: new Date().toISOString(),
            summary: isLatest ? summary : null,
            metrics_count: rows.length,
            media_new: isLatest ? mediaNew : 0,
            media_updated: isLatest ? mediaUpdated : 0,
            media_total: isLatest ? mediaTotal : 0,
            source: 'tracker',
          },
          { onConflict: 'run_date' },
        )
        .select('id')
        .single();
      if (runErr) throw runErr;

      const { error: delErr } = await db
        .from('trends_metrics')
        .delete()
        .eq('run_date', runDate);
      if (delErr) throw delErr;

      const payload = rows.map((r) => ({ ...r, run_id: runRow.id as string }));
      for (let i = 0; i < payload.length; i += 500) {
        const { error } = await db.from('trends_metrics').insert(payload.slice(i, i + 500));
        if (error) throw error;
      }
      metricsUpserted += payload.length;
    }

    return json({
      ok: true,
      run_dates: runDates,
      metrics_upserted: metricsUpserted,
      media_new: mediaNew,
      media_updated: mediaUpdated,
      media_total: mediaTotal,
      duration_ms: Date.now() - started,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('trends-ingest failed:', message);
    return json({ error: message }, 500);
  }
});
