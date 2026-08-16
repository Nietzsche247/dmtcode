// Admin-only, read-only translation aid for the moderation dialog.
// It stores NOTHING: the submitter's original text remains the record.
// Gate order mirrors admin-member-emails: JWT -> caller -> has_role('admin').
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GLOSSARY = 'DMT Code, Code of Reality, 650nm, 650 nm, N,N-DMT, DMT, Apple Vision Pro, ORCID';

const MODEL = 'google/gemini-3.6-flash';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Authentication required.' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } = await callerClient.auth.getUser();
    const user = userData?.user;
    if (userError || !user) return json({ error: 'Authentication required.' }, 401);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: isAdmin, error: roleError } = await admin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });
    // An rpc error is a denial, never a pass.
    if (roleError || isAdmin !== true) return json({ error: 'Admin role required.' }, 403);

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      return json({ error: 'A submissionId is required.' }, 400);
    }
    const submissionId = typeof body.submissionId === 'string' ? body.submissionId : '';
    if (!UUID_RE.test(submissionId)) {
      return json({ error: 'A valid submissionId is required.' }, 400);
    }

    const { data: row, error: rowError } = await admin
      .from('symbol_submissions')
      .select('id, description, context_note')
      .eq('id', submissionId)
      .maybeSingle();

    if (rowError) return json({ error: rowError.message }, 500);
    if (!row) return json({ error: 'Submission not found.' }, 404);

    const description = String(row.description ?? '').trim();
    const contextNote = String(row.context_note ?? '').trim();
    if (!description && !contextNote) return json({ nothing_to_translate: true });

    const sys =
      'You are translating a first-person perceptual report so a moderator can understand what they are publishing. '
      + 'Identify the source language and translate into English. Preserve meaning, hedging and uncertainty exactly. '
      + 'Never smooth, interpret, complete or explain the account. Do not add or remove content. '
      + `Keep these terms verbatim: ${GLOSSARY}. `
      + 'If the text is already English, return it unchanged and set the code to "en". '
      + 'Return ONLY a JSON object with exactly these keys and no code fences: '
      + '{"detected_language":"<ISO 639-1 code>","description_en":"<translation or empty string>","context_note_en":"<translation or empty string>"}';

    const userPayload = JSON.stringify({ description, context_note: contextNote });

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30_000);
    let raw = '';
    try {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Lovable-API-Key': Deno.env.get('LOVABLE_API_KEY')!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.2,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: userPayload },
          ],
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const detail = (await res.text()).slice(0, 200);
        return json({ error: `The translation service failed (${res.status}). ${detail}` }, 502);
      }
      const j = await res.json();
      raw = String(j.choices?.[0]?.message?.content ?? '').trim();
    } finally {
      clearTimeout(timer);
    }

    // Defensive parse: never pass raw model output through as a translation.
    const fenced = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const start = fenced.indexOf('{');
    const end = fenced.lastIndexOf('}');
    let parsed: Record<string, unknown> | null = null;
    if (start !== -1 && end > start) {
      try {
        parsed = JSON.parse(fenced.slice(start, end + 1));
      } catch {
        parsed = null;
      }
    }
    if (!parsed) {
      return json({ error: 'The translation service returned an unreadable response.' }, 502);
    }

    console.log(`admin-translate-submission: admin=${user.id} submission=${submissionId}`);

    return json({
      detected_language: typeof parsed.detected_language === 'string' ? parsed.detected_language : '',
      description_en: typeof parsed.description_en === 'string' ? parsed.description_en : '',
      context_note_en: typeof parsed.context_note_en === 'string' ? parsed.context_note_en : '',
      engine: 'lovable-ai-gateway',
      model: MODEL,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected failure.';
    return json({ error: message }, 500);
  }
});
