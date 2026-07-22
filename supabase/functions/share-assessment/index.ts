import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, assessment_id, share_token } = await req.json();

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validActions = ['generate_link', 'get_shared', 'revoke_link'];
    if (!validActions.includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // generate_link and revoke_link require authenticated ownership
    if (action === 'generate_link' || action === 'revoke_link') {
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
      if (!assessment_id || !uuidRe.test(String(assessment_id))) {
        return new Response(JSON.stringify({ error: 'Invalid assessment_id' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: row } = await supabase
        .from('assessments')
        .select('user_id')
        .eq('id', assessment_id)
        .single();
      if (!row || row.user_id !== claimsData.claims.sub) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'generate_link') {
      // Generate shareable link for therapist viewing
      const { data, error } = await supabase
        .from('assessments')
        .update({ is_shared: true })
        .eq('id', assessment_id)
        .select('share_token')
        .single();

      if (error) throw error;

      const shareUrl = `${req.headers.get('origin') || 'https://dmtcode.com'}/assess/shared/${data.share_token}`;

      return new Response(JSON.stringify({
        success: true,
        share_url: shareUrl,
        share_token: data.share_token
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get_shared') {
      // Validate the share token format (must be a non-trivial opaque string)
      if (!share_token || typeof share_token !== 'string' || share_token.length < 16 || share_token.length > 128) {
        return new Response(JSON.stringify({ error: 'Invalid share token' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Fetch de-identified assessment by share token
      const { data, error } = await supabase
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
        .eq('share_token', share_token)
        .eq('is_shared', true)
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: 'Assessment not found or not shared' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Fetch voice log transcript separately if exists
      let voiceLogData = null;
      if (data.log_id) {
        const { data: voiceLog } = await supabase
          .from('voice_logs')
          .select('transcript, duration_seconds, archetype_matches, protocol_match_score')
          .eq('id', data.log_id)
          .single();
        voiceLogData = voiceLog;
      }

      // Return de-identified data (no user_id exposed)
      return new Response(JSON.stringify({
        success: true,
        assessment: {
          ...data,
          voice_log: voiceLogData
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'revoke_link') {
      // Revoke sharing
      const { error } = await supabase
        .from('assessments')
        .update({ is_shared: false })
        .eq('id', assessment_id);

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: 'Share link revoked'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Share assessment error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});