// bibliography-triage: automated PHENOMENOLOGICAL RELEVANCE triage for the
// research library.
//
// EPISTEMIC CONTRACT. Auto-approval means one thing only: the record is ON
// TOPIC for this library. It is NOT a claim that the record's findings are
// verified, endorsed, replicated, or scientifically sound. Nothing downstream
// may render triage_status as a validation badge, and the existing JSON-LD
// rule stands: emit ScholarlyArticle/Book markup only when a DOI or ISBN
// actually resolves.
//
// Idempotent and resumable: it only ever reads rows where triage_status IS
// NULL, so a re-run picks up exactly what the last run did not finish.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-intel-key',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const MODEL = 'google/gemini-2.5-flash';
const BATCH_SIZE = 20;
const CONFIDENCE_THRESHOLD = 0.8;

const SYSTEM_PROMPT = `You classify bibliography records for a research library that studies ONE question: the perception of a structured, possibly-decodable other reality.

For each record decide: does this record describe, study, or bear directly on the perception of a structured, possibly-decodable other reality?

IN SCOPE:
- Phenomenology, consciousness studies, entity encounters
- First-person and experiential reports
- Structure of visual forms, geometry, hallucination form-constants
- The whole tryptamine and psychedelic family: N,N-DMT, 5-MeO-DMT, ayahuasca, ibogaine, psilocybin, LSD and related compounds
- Sober perception of the same phenomena, with no substance involved

OUT OF SCOPE (these are acronym and keyword collisions, not topic matches):
- Multiple sclerosis "DMT" meaning disease-modifying therapy
- "LSD-1" or LSD1 meaning lysine-specific demethylase, the cancer enzyme
- Psychiatry or pharmacology trials with no perceptual or phenomenological content
- Orthopedics, oncology, cardiology, general neurology unrelated to perceptual structure
- Adverse-event or safety reports that merely use the word "consciousness"

You are judging TOPIC FIT ONLY. You are not judging whether the work is true, rigorous, or credible. A speculative first-person trip report is on topic. A rigorous oncology RCT is off topic.

Return strict JSON only:
{"results":[{"index":<number>,"on_topic":<boolean>,"confidence":<number 0..1>,"reason":"<one sentence>"}]}
Return exactly one result object per record, using the record's index. confidence is your certainty in the on_topic call. Keep each reason to one sentence.`;

interface Row {
  id: string;
  title: string | null;
  abstract: string | null;
  journal: string | null;
  compounds: string[] | null;
}

interface Verdict {
  index: number;
  on_topic: boolean;
  confidence: number;
  reason: string;
}

class GatewayStop extends Error {
  constructor(public status: number, public detail: string) {
    super(`AI gateway returned ${status}: ${detail}`);
  }
}

function clip(v: string | null | undefined, n: number): string {
  const s = (v ?? '').replace(/\s+/g, ' ').trim();
  return s.length > n ? `${s.slice(0, n)}...` : s;
}

function buildUserPrompt(rows: Row[]): string {
  const blocks = rows.map((r, i) => {
    const parts = [
      `INDEX: ${i}`,
      `TITLE: ${clip(r.title, 400) || '(none)'}`,
      `JOURNAL: ${clip(r.journal, 200) || '(none)'}`,
      `COMPOUNDS: ${(r.compounds ?? []).join(', ') || '(none listed)'}`,
      `ABSTRACT: ${clip(r.abstract, 2000) || '(no abstract available)'}`,
    ];
    return parts.join('\n');
  });
  return `Classify the following ${rows.length} records. Respond with JSON only.\n\n${blocks.join('\n\n---\n\n')}`;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error('The model did not return parseable JSON.');
  }
}

async function classify(rows: Row[], apiKey: string): Promise<Verdict[]> {
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Lovable-API-Key': apiKey,
      'X-Lovable-AIG-SDK': 'fetch',
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(rows) },
      ],
    }),
  });

  if (res.status === 429 || res.status === 402) {
    // Never silently skip rows. Stop cleanly and let the caller report the
    // remaining backlog; those rows keep triage_status NULL and are picked up
    // by the next run.
    throw new GatewayStop(res.status, await res.text());
  }
  if (!res.ok) {
    throw new Error(`AI gateway request failed [${res.status}]: ${await res.text()}`);
  }

  const payload = await res.json();
  const content: string = payload?.choices?.[0]?.message?.content ?? '';
  const parsed = extractJson(content) as { results?: unknown };
  const raw = Array.isArray(parsed?.results) ? parsed.results : [];

  const out: Verdict[] = [];
  for (const item of raw as Record<string, unknown>[]) {
    const index = Number(item?.index);
    if (!Number.isInteger(index) || index < 0 || index >= rows.length) continue;
    const confidence = Number(item?.confidence);
    out.push({
      index,
      on_topic: item?.on_topic === true,
      confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0,
      reason: String(item?.reason ?? '').slice(0, 500) || 'No reason returned by the model.',
    });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const cronSecret = Deno.env.get('INTEL_CRON_SECRET');
  if (!cronSecret || req.headers.get('x-intel-key') !== cronSecret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return json({ error: 'LOVABLE_API_KEY is not configured' }, 500);

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const countPending = async (): Promise<number> => {
    const { count } = await db
      .from('bibliography')
      .select('id', { count: 'exact', head: true })
      .eq('is_approved', false)
      .is('triage_status', null);
    return count ?? 0;
  };

  let processed = 0;
  let approved = 0;
  let rejected = 0;
  let needs_review = 0;
  let stoppedReason: string | null = null;
  let stoppedStatus: number | null = null;

  try {
    // Bounded loop: each pass re-reads only rows still NULL, so a partial run
    // is always safe to resume.
    for (let pass = 0; pass < 50; pass++) {
      const { data, error } = await db
        .from('bibliography')
        .select('id, title, abstract, journal, compounds')
        .eq('is_approved', false)
        .is('triage_status', null)
        .order('created_at', { ascending: true })
        .limit(BATCH_SIZE);

      if (error) throw new Error(`Could not read bibliography: ${error.message}`);
      const rows = (data ?? []) as Row[];
      if (!rows.length) break;

      const verdicts = await classify(rows, apiKey);
      const byIndex = new Map(verdicts.map((v) => [v.index, v]));
      const triage_at = new Date().toISOString();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const v = byIndex.get(i);

        let triage_status: 'auto_approved' | 'auto_rejected' | 'needs_review';
        let is_approved: boolean | undefined;

        if (!v) {
          // A missing verdict is never treated as a rejection.
          triage_status = 'needs_review';
        } else if (v.on_topic && v.confidence >= CONFIDENCE_THRESHOLD) {
          triage_status = 'auto_approved';
          is_approved = true;
        } else if (!v.on_topic && v.confidence >= CONFIDENCE_THRESHOLD) {
          triage_status = 'auto_rejected';
        } else {
          triage_status = 'needs_review';
        }

        const patch: Record<string, unknown> = {
          triage_status,
          triage_confidence: v ? v.confidence : null,
          triage_reason: v ? v.reason : 'The model returned no verdict for this record, so it needs a human read.',
          triage_at,
          triage_model: MODEL,
        };
        if (is_approved === true) patch.is_approved = true;

        const { error: upErr } = await db.from('bibliography').update(patch).eq('id', row.id);
        if (upErr) {
          console.error('triage update failed', row.id, upErr.message);
          continue;
        }

        processed++;
        if (triage_status === 'auto_approved') approved++;
        else if (triage_status === 'auto_rejected') rejected++;
        else needs_review++;
      }
    }
  } catch (e) {
    if (e instanceof GatewayStop) {
      stoppedStatus = e.status;
      stoppedReason =
        e.status === 429
          ? 'The AI gateway rate limit was hit. Triage stopped cleanly; untriaged rows are untouched and the next run resumes from them.'
          : 'AI credits are exhausted. Triage stopped cleanly; untriaged rows are untouched and the next run resumes from them.';
      console.error(e.message);
    } else {
      const remaining = await countPending();
      console.error('bibliography-triage failed', e);
      return json(
        {
          error: (e as Error).message,
          processed, approved, rejected, needs_review, remaining,
        },
        500,
      );
    }
  }

  const remaining = await countPending();
  return json({
    processed,
    approved,
    rejected,
    needs_review,
    remaining,
    model: MODEL,
    ...(stoppedReason ? { stopped: true, stopped_status: stoppedStatus, stopped_reason: stoppedReason } : {}),
    note:
      'auto_approved means the record is on topic for this library. It is not a claim that the record is verified, endorsed, or scientifically sound.',
  });
});
