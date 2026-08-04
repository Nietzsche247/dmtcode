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
// Asymmetric on purpose. A wrongly parked paper costs a queue slot. A wrongly
// approved paper is published and gets cited by AI crawlers as something this
// site vouches for.
const APPROVE_THRESHOLD = 0.9;
const REJECT_THRESHOLD = 0.8;

const SYSTEM_PROMPT = `You classify bibliography records for a research library that studies ONE question: the perception of a structured, possibly-decodable other reality.

The test is POSITIVE and NARROW. A record is ON TOPIC only if it describes, studies, or bears directly on at least one of:
1. The structure or content of visual or perceptual experience: geometric form constants, recurring discrete visual forms, the structure of hallucination, visual imagery phenomenology.
2. Entity encounters or contact experiences.
3. The phenomenology of altered or non-ordinary states as experienced, including sober perception of the same.
4. First-person or experiential accounts of perceiving another reality that presents as structured or decodable.
5. Theory of consciousness, insofar as it addresses that perceptual content.

OUT OF SCOPE regardless of which substance is studied:
- Efficacy and safety trials
- Mechanism-of-action pharmacology
- Clinical outcomes of any condition, including depression, PTSD, eating disorders, bipolar disorder and pain
- Therapy protocols and integration protocols
- Epidemiology, adverse events, harm reduction, drug policy
- Animal behavioural models, including nociception and locomotion
- Social cognition or emotional cognition studies that do not address perceptual content
- Acronym collisions: multiple sclerosis "DMT" meaning disease-modifying therapy, "LSD-1" meaning the lysine-specific demethylase enzyme

CRITICAL. A paper that mentions DMT, psilocybin, LSD, ayahuasca, ketamine, MDMA or any other psychedelic is NOT thereby on topic. The substance is not the criterion. The described experience is the criterion. "A psychedelic was administered and an outcome was measured" is OFF TOPIC. "What the experience looked like, felt like, or contained" is ON TOPIC.

If you cannot name the specific phenomenological element the record addresses, it is NOT on topic. Say so rather than approving.

You are judging TOPIC FIT ONLY, never truth, rigour or credibility. A speculative first-person trip report is on topic. A rigorous oncology or psychiatry trial is off topic.

Return strict JSON only:
{"results":[{"index":<number>,"on_topic":<boolean>,"confidence":<number 0..1>,"phenomenological_element":"<the specific element found, or empty string if none>","reason":"<one sentence>"}]}
Return exactly one result object per record, using the record's index. When on_topic is true, phenomenological_element MUST name the specific perceptual or phenomenological content found in that record, and the reason must reference it. When on_topic is false, phenomenological_element must be an empty string. confidence is your certainty in the on_topic call.`;

interface Row {
  id: string;
  triage_status?: string | null;
  triage_confidence?: number | null;
  triage_reason?: string | null;
  title: string | null;
  abstract: string | null;
  journal: string | null;
  compounds: string[] | null;
}

interface Verdict {
  index: number;
  on_topic: boolean;
  confidence: number;
  element: string;
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
      element: String(item?.phenomenological_element ?? '').trim().slice(0, 300),
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

  // Re-audit mode re-reads rows that already carry a verdict and re-scores them
  // under the current rubric, ignoring the stored triage_status. Approvals that
  // fail the new rubric are UNWOUND (is_approved back to false) rather than left
  // live, and the previous verdict is preserved in triage_reason for audit.
  let reauditOf: string | null = null;
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      if (typeof body?.reaudit === 'string') reauditOf = body.reaudit;
    } catch {
      // No body is the normal cron case.
    }
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
  let pulled_back = 0;
  let stoppedReason: string | null = null;
  let stoppedStatus: number | null = null;
  const seen = new Set<string>();

  try {
    // Bounded loop: each pass re-reads only rows still NULL, so a partial run
    // is always safe to resume.
    for (let pass = 0; pass < 50; pass++) {
      let q = db
        .from('bibliography')
        .select('id, title, abstract, journal, compounds, triage_status, triage_confidence, triage_reason')
        .order('created_at', { ascending: true })
        .limit(BATCH_SIZE);

      q = reauditOf
        ? q.eq('triage_status', reauditOf)
        : q.eq('is_approved', false).is('triage_status', null);

      const { data, error } = await q;

      if (error) throw new Error(`Could not read bibliography: ${error.message}`);
      // In re-audit mode the filter does not shrink as we write, so track ids
      // we have already scored and stop when a pass yields nothing new.
      const rows = ((data ?? []) as Row[]).filter((r) => !seen.has(r.id));
      if (!rows.length) break;
      for (const r of rows) seen.add(r.id);

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
        } else if (v.on_topic && v.confidence >= APPROVE_THRESHOLD && v.element.length > 0) {
          triage_status = 'auto_approved';
          is_approved = true;
        } else if (!v.on_topic && v.confidence >= REJECT_THRESHOLD) {
          triage_status = 'auto_rejected';
        } else {
          triage_status = 'needs_review';
        }

        const patch: Record<string, unknown> = {
          triage_status,
          triage_confidence: v ? v.confidence : null,
          triage_reason: v ? (v.element ? `${v.reason} [element: ${v.element}]` : v.reason) : 'The model returned no verdict for this record, so it needs a human read.',
          triage_at,
          triage_model: MODEL,
        };
        if (is_approved === true) patch.is_approved = true;

        if (reauditOf) {
          const prior = `[re-audited ${triage_at.slice(0, 10)} under the tightened rubric. Previous verdict: ${row.triage_status ?? 'none'}, confidence ${row.triage_confidence ?? 'n/a'} - ${row.triage_reason ?? 'no reason recorded'}]`;
          patch.triage_reason = `${patch.triage_reason} ${prior}`.slice(0, 2000);
          if (triage_status !== 'auto_approved' && row.triage_status === 'auto_approved') {
            // Unwind the live approval rather than leaving it published.
            patch.is_approved = false;
            patch.triage_status = 'needs_review';
            triage_status = 'needs_review';
            pulled_back++;
          }
        }

        const { error: upErr } = await db.from('bibliography').update(patch).eq('id', row.id);
        if (upErr) {
          console.error('triage update failed', row.id, upErr.message);
          continue;
        }

        // Durable audit row per decision. This is what makes classifier drift
        // measurable: the model, its confidence, and the specific element it
        // claimed to find are all recoverable later, per record, over SQL.
        const { error: auditErr } = await db.from('audit_events').insert({
          event_name: 'bibliography_triage_decision',
          actor_kind: 'classifier',
          subject_type: 'bibliography',
          subject_id: row.id,
          properties: {
            triage_status: patch.triage_status ?? triage_status,
            triage_confidence: v ? v.confidence : null,
            phenomenological_element: v?.element || null,
            on_topic: v ? v.on_topic : null,
            triage_model: MODEL,
            triage_reason: patch.triage_reason,
            is_approved: patch.is_approved ?? null,
            mode: reauditOf ? 'reaudit' : 'backlog',
            prior_triage_status: reauditOf ? row.triage_status ?? null : null,
            prior_triage_confidence: reauditOf ? row.triage_confidence ?? null : null,
            pulled_back: Boolean(reauditOf && patch.is_approved === false),
            title: row.title,
          },
        });
        if (auditErr) console.error('triage audit insert failed', row.id, auditErr.message);

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
    pulled_back,
    remaining,
    mode: reauditOf ? `reaudit:${reauditOf}` : 'pending',
    model: MODEL,
    ...(stoppedReason ? { stopped: true, stopped_status: stoppedStatus, stopped_reason: stoppedReason } : {}),
    note:
      'auto_approved means the record is on topic for this library. It is not a claim that the record is verified, endorsed, or scientifically sound.',
  });
});
