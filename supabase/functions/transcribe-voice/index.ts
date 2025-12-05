import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { voice_log_id, audio_url } = await req.json();
    
    if (!voice_log_id || !audio_url) {
      throw new Error('voice_log_id and audio_url are required');
    }

    console.log(`Starting transcription for voice log: ${voice_log_id}`);
    console.log(`Audio URL: ${audio_url}`);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Fetch the audio file
    const audioResponse = await fetch(audio_url);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio file: ${audioResponse.statusText}`);
    }
    
    const audioBlob = await audioResponse.blob();
    console.log(`Audio blob size: ${audioBlob.size} bytes`);

    // Create form data for Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'verbose_json');

    // Call OpenAI Whisper API
    console.log('Calling OpenAI Whisper API...');
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('Whisper API error:', errorText);
      throw new Error(`Whisper API error: ${whisperResponse.status} - ${errorText}`);
    }

    const transcriptionResult = await whisperResponse.json();
    console.log('Transcription completed:', transcriptionResult.text?.substring(0, 100));

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the voice log with transcription
    const { error: updateError } = await supabase
      .from('voice_logs')
      .update({
        transcript: transcriptionResult.text,
        is_analyzed: true,
        analysis_jsonb: {
          duration: transcriptionResult.duration,
          language: transcriptionResult.language,
          segments: transcriptionResult.segments?.map((s: any) => ({
            start: s.start,
            end: s.end,
            text: s.text,
          })),
        },
      })
      .eq('id', voice_log_id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update voice log: ${updateError.message}`);
    }

    console.log(`Successfully transcribed voice log: ${voice_log_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        transcript: transcriptionResult.text,
        duration: transcriptionResult.duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Transcription error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
