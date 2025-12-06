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
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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