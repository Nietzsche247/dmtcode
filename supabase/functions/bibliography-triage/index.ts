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
// Retained for audit. No longer gates rejection: see the two-axis rubric above.
const REJECT_THRESHOLD = 0.8;

// ---- Rubric v2 + Issue-1 AND-gate (Workstream C, 2026-08-05) ---------------
// Two SEPARATE axes; do not collapse them.
//   REJECTION: only genuinely off-domain records may ever be auto_rejected, and
//              only when NO psychedelic term appears anywhere in the record.
//   APPROVAL : the Issue-1 perceptual AND-gate. Eligible for auto_approved only
//              if a DMT-family term appears (UNGATED) or a non-DMT psychedelic
//              term appears AND a perceptual term appears.
// Everything else -> needs_review, so a human reads it.
// ANTI-SUBTRACTION: no path here removes a row or clears is_approved=true.

const DMT_TERMS = [
  'dimethyltryptamine', 'n,n-dmt', 'nn-dmt', '5-meo-dmt',
  '5-methoxy-n,n-dimethyltryptamine', 'ayahuasca', 'banisteriopsis',
  'psychotria viridis', 'harmine', 'harmaline', 'harmala', 'bufotenin',
  'bufotenine', 'changa', 'yage', 'yagé', 'incilius alvarius', 'bufo alvarius',
];

const NON_DMT_PSYCHEDELIC_TERMS = [
  'psilocybin', 'psilocin', 'psilocybe', 'lysergic', 'lsd-25', 'mescaline',
  'peyote', 'lophophora', 'san pedro', 'ibogaine', 'iboga', 'tabernanthe',
  'ketamine', 'mdma', 'salvinorin', 'salvia divinorum', '2c-b',
  'serotonergic psychedelic', 'classic psychedelic', 'psychedelic',
  'entheogen', 'hallucinogen', 'tryptamine', 'phenethylamine', '5-ht2a',
];

const PERCEPTUAL_TERMS = [
  'visual', 'vision', 'geometr', 'hallucinat', 'phosphene', 'entoptic',
  'perception', 'perceptual', 'imagery', 'phenomenolog', 'form constant',
  'entity', 'ego dissolution', 'mystical experience', 'altered state',
  'non-ordinary state', 'subjective experience', 'first-person', 'closed-eye',
  'hypnagogic', 'near-death', 'consciousness', 'dream', 'synesthesia',
  'synaesthesia', 'apparition', 'presence',
];

const OFF_DOMAIN_TERMS = [
  'multiple sclerosis', 'diroximel fumarate', 'direct mass technology',
  'transthyretin', 'dimethoate', 'lumpy skin disease', 'histone demethylase',
  'lysine-specific demethylase', 'lysine specific demethylase', 'kdm1a',
  'lsd1', 'lsd-1', 'syndesmotic', 'lysosomal storage', 'migraine',
  'lumateperone', 'crown morphology', 'malpighiaceae', 'elastin', 'monkeypox',
  'feral cat', 'canine blood', 'disease-modifying therap',
  'disease modifying therap', 'long-acting injectable', 'orthopedic surgery',
  'opioid-free anesthesia', 'buprenorphine/naloxone', 'mog antibody',
];

const haystack = (r: Row) =>
  [r.title, r.abstract, r.journal, (r.compounds ?? []).join(' ')]
    .filter(Boolean).join(' ').toLowerCase();

const anyHit = (h: string, terms: string[]) => terms.some((t) => h.includes(t));

interface Gate {
  hasDmt: boolean; hasOther: boolean; hasPerceptual: boolean;
  offDomain: boolean; approvable: boolean; rejectable: boolean;
}

function evaluateGate(r: Row): Gate {
  const h = haystack(r);
  const hasDmt = anyHit(h, DMT_TERMS);
  const hasOther = anyHit(h, NON_DMT_PSYCHEDELIC_TERMS);
  const hasPerceptual = anyHit(h, PERCEPTUAL_TERMS);
  const offDomain = anyHit(h, OFF_DOMAIN_TERMS) && !hasDmt && !hasOther;
  return {
    hasDmt, hasOther, hasPerceptual, offDomain,
    approvable: hasDmt || (hasOther && hasPerceptual),
    rejectable: offDomain,
  };
}

const SYSTEM_PROMPT = `You classify bibliography records for a research library studying ONE question: the perception of a structured, possibly-decodable other reality - its visual and experiential phenomenology.

You judge RELEVANCE TO THAT SUBJECT. You never judge rigour, methodology, sample size, credibility, or whether the findings are true. A weak, speculative or preliminary paper that is about the subject IS on topic and should be marked on topic with lower confidence. That is deliberate: this library presents the literature and lets the reader decide.

A record is ON TOPIC if it bears on any of:
1. The structure or content of visual or perceptual experience: geometric form constants, recurring discrete visual forms, the structure of hallucination, visual imagery, phosphenes, entoptic phenomena, synesthesia.
2. Entity encounters, perceived presences, or contact experiences.
3. The phenomenology of altered or non-ordinary states, including sober routes to the same phenomena: meditation, sensory deprivation, hypnagogia, near-death experience, dreaming.
4. First-person or experiential accounts of perceiving another reality that presents as structured or decodable.
5. Theory of consciousness or perception insofar as it addresses that content.
6. Neuroscience, pharmacology or mechanism work on DMT-family compounds, or on other psychedelics where perceptual or experiential effects are part of what is studied or reported. Mechanism that plausibly explains the perceptual content counts.
7. The cultural, historical, legal, indigenous or ethical context of the substances and practices that produce these experiences.

DMT-family material - N,N-DMT, dimethyltryptamine, 5-MeO-DMT, ayahuasca, Banisteriopsis, harmine, harmaline, bufotenin - is ALWAYS on topic. There is no additional test for it. Never mark a DMT-family record off topic.

For non-DMT psychedelics (psilocybin, LSD, mescaline, ibogaine, ketamine, MDMA and the rest), the record is on topic when the perceptual or experiential dimension is present in the work. A pure dosing-safety or non-perceptual clinical-outcome study with no experiential dimension is not on topic, but it is NOT junk either - say so plainly and let it go to human review rather than condemning it.

OFF TOPIC means genuinely unrelated material only. Almost always an acronym collision or a different field entirely: multiple sclerosis "DMT" meaning disease-modifying therapy, "LSD-1"/KDM1A the lysine-specific demethylase, lumpy skin disease, dimethoate the pesticide, lysosomal storage disease, Direct Mass Technology, syndesmotic/ankle radiology, unrelated veterinary, botany, orthopedics or forensics.

When you are unsure, say on_topic true with low confidence, or on_topic false with low confidence. Low confidence sends the record to a human. Only assert high confidence on an off-topic call when the record is unmistakably from another field.

You are judging TOPIC FIT ONLY, never truth, rigour or credibility. A speculative first-person trip report is on topic. An ankle-radiograph paper is not.

Return strict JSON only:
{"results":[{"index":<number>,"on_topic":<boolean>,"confidence":<number 0..1>,"phenomenological_element":"<the specific element found, or empty string if none>","reason":"<one sentence>"}]}
Return exactly one result object per record, using the record's index. When on_topic is true, phenomenological_element MUST name the specific perceptual, experiential or subject-matter element found in that record, and the reason must reference it. When on_topic is false, phenomenological_element must be an empty string. confidence is your certainty in the on_topic call.`;

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
  let allowUnwind = false;
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      if (typeof body?.reaudit === 'string') reauditOf = body.reaudit;
      // ANTI-SUBTRACTION: demotion of a live approval is opt-in only.
      allowUnwind = body?.allow_unwind === true;
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
  let would_pull_back = 0;
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

        const g = evaluateGate(row);

        if (g.rejectable && (!v || !v.on_topic)) {
          // Off-domain AND no psychedelic term anywhere. The only rejection path.
          triage_status = 'auto_rejected';
        } else if (!v) {
          triage_status = 'needs_review';
        } else if (g.approvable && v.on_topic && v.confidence >= APPROVE_THRESHOLD && v.element.length > 0) {
          triage_status = 'auto_approved';
          is_approved = true;
        } else {
          // Includes: on-topic but AND-gate not met, and low-confidence calls.
          // A human reads it. It is never binned.
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
            if (allowUnwind) {
              patch.is_approved = false;
              patch.triage_status = 'needs_review';
              triage_status = 'needs_review';
              pulled_back++;
            } else {
              // ANTI-SUBTRACTION DEFAULT: never demote a live approval
              // automatically. Record the intent, change nothing.
              patch.triage_status = 'auto_approved';
              triage_status = 'auto_approved';
              delete patch.is_approved;
              would_pull_back++;
            }
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
            would_have_pulled_back: Boolean(reauditOf && !allowUnwind && row.triage_status === 'auto_approved' && triage_status !== 'auto_approved'),
            gate_has_dmt: g.hasDmt,
            gate_has_non_dmt_psychedelic: g.hasOther,
            gate_has_perceptual: g.hasPerceptual,
            gate_off_domain: g.offDomain,
            gate_approvable: g.approvable,
            rubric: 'rubric-v2-two-axis+issue1-and-gate',
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
    would_pull_back,
    remaining,
    mode: reauditOf ? `reaudit:${reauditOf}` : 'pending',
    model: MODEL,
    ...(stoppedReason ? { stopped: true, stopped_status: stoppedStatus, stopped_reason: stoppedReason } : {}),
    note:
      'auto_approved means the record is on topic for this library. It is not a claim that the record is verified, endorsed, or scientifically sound.',
  });
});
