import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Require authentication to prevent unauthenticated cost abuse
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supa = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsErr } = await supa.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { text, voice = 'nova', speed = 0.95 } = await req.json()

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Cap length to prevent cost abuse
    const MAX_LEN = 2000;
    if (text.length > MAX_LEN) {
      return new Response(JSON.stringify({ error: `Text exceeds max length of ${MAX_LEN} characters` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const allowedVoices = ['alloy','echo','fable','onyx','nova','shimmer'];
    const useVoice = allowedVoices.includes(voice) ? voice : 'nova';

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    // Validate speed (OpenAI supports 0.25 to 4.0)
    const speedNum = typeof speed === 'number' ? speed : parseFloat(String(speed)) || 1.0;
    const validSpeed = Math.max(0.25, Math.min(4.0, speedNum))
    
    
    console.log(`Generating TTS for ${text.length} characters with voice: ${voice}, speed: ${validSpeed}`)

    // Generate speech from text using OpenAI TTS
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: 'mp3',
        speed: validSpeed,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI TTS error:', error)
      throw new Error(error.error?.message || 'Failed to generate speech')
    }

    // Return audio as binary
    const audioBuffer = await response.arrayBuffer()
    console.log(`Generated audio: ${audioBuffer.byteLength} bytes`)

    return new Response(audioBuffer, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'audio/mpeg',
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in text-to-speech function:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
