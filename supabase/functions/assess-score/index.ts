import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PHQ-9 questions for conversational interview
const PHQ9_QUESTIONS = [
  "Over the last 2 weeks, how often have you had little interest or pleasure in doing things?",
  "Over the last 2 weeks, how often have you felt down, depressed, or hopeless?",
  "Over the last 2 weeks, how often have you had trouble falling or staying asleep, or sleeping too much?",
  "Over the last 2 weeks, how often have you felt tired or had little energy?",
  "Over the last 2 weeks, how often have you had poor appetite or been overeating?",
  "Over the last 2 weeks, how often have you felt bad about yourself — or that you are a failure?",
  "Over the last 2 weeks, how often have you had trouble concentrating on things?",
  "Over the last 2 weeks, how often have you been moving or speaking slowly, or been fidgety or restless?",
  "Over the last 2 weeks, how often have you had thoughts that you would be better off dead?"
];

// GAD-7 questions
const GAD7_QUESTIONS = [
  "Over the last 2 weeks, how often have you felt nervous, anxious, or on edge?",
  "Over the last 2 weeks, how often have you not been able to stop or control worrying?",
  "Over the last 2 weeks, how often have you worried too much about different things?",
  "Over the last 2 weeks, how often have you had trouble relaxing?",
  "Over the last 2 weeks, how often have you been so restless that it's hard to sit still?",
  "Over the last 2 weeks, how often have you become easily annoyed or irritable?",
  "Over the last 2 weeks, how often have you felt afraid as if something awful might happen?"
];

// MEQ-4 questions (Mystical Experience Questionnaire)
const MEQ4_QUESTIONS = [
  "Experience of unity with ultimate reality",
  "Sense of sacredness or reverence",
  "Noetic quality (sense of encountering ultimate truth)",
  "Positive mood (peace, joy, love)"
];

// CEQ-7 questions (Challenging Experience Questionnaire)
const CEQ7_QUESTIONS = [
  "Fear or anxiety",
  "Grief or sadness",
  "Physical distress",
  "Insanity or losing one's mind",
  "Isolation or loneliness",
  "Death or dying",
  "Paranoia"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const { action, assessment_id, responses, interview_step, user_response } = body;

    // Validate inputs
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validActions = ['get_next_question', 'score_assessment', 'generate_report'];
    if (!validActions.includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (action !== 'get_next_question' && (!assessment_id || !uuidRe.test(String(assessment_id)))) {
      return new Response(JSON.stringify({ error: 'Invalid assessment_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const validateArr = (a: unknown, maxLen: number) =>
      Array.isArray(a) && a.length <= maxLen && a.every(v => typeof v === 'number' && v >= 0 && v <= 5);
    if (action === 'score_assessment') {
      if (!responses || typeof responses !== 'object') {
        return new Response(JSON.stringify({ error: 'Invalid responses' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { phq9 = [], gad7 = [], meq4 = [], ceq7 = [] } = responses;
      if (!validateArr(phq9, 9) || !validateArr(gad7, 7) || !validateArr(meq4, 4) || !validateArr(ceq7, 7)) {
        return new Response(JSON.stringify({ error: 'Invalid response arrays' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For actions targeting an existing assessment, ensure caller owns it
    if (action === 'score_assessment' || action === 'generate_report') {
      const { data: own } = await supabase
        .from('assessments')
        .select('user_id')
        .eq('id', assessment_id)
        .single();
      if (!own || (own.user_id && own.user_id !== userId)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'get_next_question') {
      // Conversational interviewer flow
      const totalQuestions = PHQ9_QUESTIONS.length + GAD7_QUESTIONS.length;
      
      if (interview_step < PHQ9_QUESTIONS.length) {
        return new Response(JSON.stringify({
          question: PHQ9_QUESTIONS[interview_step],
          type: 'phq9',
          step: interview_step,
          total: totalQuestions,
          options: [
            { value: 0, label: "Not at all" },
            { value: 1, label: "Several days" },
            { value: 2, label: "More than half the days" },
            { value: 3, label: "Nearly every day" }
          ]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } else if (interview_step < totalQuestions) {
        const gadIndex = interview_step - PHQ9_QUESTIONS.length;
        return new Response(JSON.stringify({
          question: GAD7_QUESTIONS[gadIndex],
          type: 'gad7',
          step: interview_step,
          total: totalQuestions,
          options: [
            { value: 0, label: "Not at all" },
            { value: 1, label: "Several days" },
            { value: 2, label: "More than half the days" },
            { value: 3, label: "Nearly every day" }
          ]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } else {
        return new Response(JSON.stringify({
          complete: true,
          message: "Assessment interview complete."
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (action === 'score_assessment') {
      // Calculate scores from responses
      const phq9Responses = responses.phq9 || [];
      const gad7Responses = responses.gad7 || [];
      const meq4Responses = responses.meq4 || [];
      const ceq7Responses = responses.ceq7 || [];

      const phq9Score = phq9Responses.reduce((sum: number, val: number) => sum + val, 0);
      const gad7Score = gad7Responses.reduce((sum: number, val: number) => sum + val, 0);
      const meq4Score = meq4Responses.reduce((sum: number, val: number) => sum + val, 0);
      const ceq7Score = ceq7Responses.reduce((sum: number, val: number) => sum + val, 0);

      // Update assessment with scores
      const { data, error } = await supabase
        .from('assessments')
        .update({
          phq9_score: phq9Score,
          gad7_score: gad7Score,
          meq4_score: meq4Score,
          ceq7_score: ceq7Score,
          context_jsonb: responses.context || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', assessment_id)
        .select()
        .single();

      if (error) throw error;

      // Generate interpretation
      const interpretation = {
        phq9: getPhq9Interpretation(phq9Score),
        gad7: getGad7Interpretation(gad7Score),
        meq4: getMeq4Interpretation(meq4Score),
        ceq7: getCeq7Interpretation(ceq7Score),
        moodDelta: data.mood_post !== null && data.mood_pre !== null 
          ? data.mood_post - data.mood_pre 
          : null
      };

      return new Response(JSON.stringify({
        success: true,
        scores: { phq9Score, gad7Score, meq4Score, ceq7Score },
        interpretation,
        assessment: data
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate_report') {
      // Fetch assessment data (avoid ambiguous FK by not embedding voice_logs)
      const { data: assessment, error } = await supabase
        .from('assessments')
        .select(`
          id,
          phq9_score,
          gad7_score,
          meq4_score,
          ceq7_score,
          context_jsonb,
          mood_pre,
          mood_post,
          log_id,
          created_at
        `)
        .eq('id', assessment_id)
        .single();

      if (error) throw error;

      // Fetch voice log separately if log_id exists
      let transcript = null;
      if (assessment.log_id) {
        const { data: voiceLog } = await supabase
          .from('voice_logs')
          .select('transcript')
          .eq('id', assessment.log_id)
          .single();
        transcript = voiceLog?.transcript || null;
      }

      // Generate report data
      const report = {
        generated_at: new Date().toISOString(),
        assessment_id: assessment.id,
        scores: {
          phq9: { score: assessment.phq9_score, interpretation: getPhq9Interpretation(assessment.phq9_score) },
          gad7: { score: assessment.gad7_score, interpretation: getGad7Interpretation(assessment.gad7_score) },
          meq4: { score: assessment.meq4_score, interpretation: getMeq4Interpretation(assessment.meq4_score) },
          ceq7: { score: assessment.ceq7_score, interpretation: getCeq7Interpretation(assessment.ceq7_score) }
        },
        mood: {
          pre: assessment.mood_pre,
          post: assessment.mood_post,
          delta: assessment.mood_post !== null && assessment.mood_pre !== null 
            ? assessment.mood_post - assessment.mood_pre 
            : null
        },
        transcript: transcript,
        context: assessment.context_jsonb
      };

      return new Response(JSON.stringify({
        success: true,
        report
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Assessment scoring error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function getPhq9Interpretation(score: number | null): string {
  if (score === null) return "Not assessed";
  if (score <= 4) return "Minimal depression";
  if (score <= 9) return "Mild depression";
  if (score <= 14) return "Moderate depression";
  if (score <= 19) return "Moderately severe depression";
  return "Severe depression";
}

function getGad7Interpretation(score: number | null): string {
  if (score === null) return "Not assessed";
  if (score <= 4) return "Minimal anxiety";
  if (score <= 9) return "Mild anxiety";
  if (score <= 14) return "Moderate anxiety";
  return "Severe anxiety";
}

function getMeq4Interpretation(score: number | null): string {
  if (score === null) return "Not assessed";
  if (score <= 4) return "Minimal mystical experience";
  if (score <= 8) return "Low mystical experience";
  if (score <= 12) return "Moderate mystical experience";
  if (score <= 16) return "Strong mystical experience";
  return "Complete mystical experience";
}

function getCeq7Interpretation(score: number | null): string {
  if (score === null) return "Not assessed";
  if (score <= 7) return "Minimal challenging experience";
  if (score <= 14) return "Mild challenging experience";
  if (score <= 21) return "Moderate challenging experience";
  return "Intense challenging experience";
}
