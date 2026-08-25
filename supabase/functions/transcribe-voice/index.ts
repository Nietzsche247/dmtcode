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
    // Require auth
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

    const { voice_log_id, audio_url, audio_path } = await req.json();

    // Validate inputs
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!voice_log_id || !uuidRe.test(String(voice_log_id))) {
      return new Response(JSON.stringify({ error: 'Invalid voice_log_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve the audio to a fetchable URL. The voice-logs bucket is private,
    // so new callers pass audio_path (the object path) and we mint a short
    // lived signed URL with the service role. The legacy audio_url form is
    // still accepted for rows written before the migration.
    let fetchUrl: string;
    if (audio_path) {
      const callerId = String(claimsData.claims.sub || '');
      const pathStr = String(audio_path);
      if (!callerId || !pathStr.startsWith(`${callerId}/`) || pathStr.includes('..')) {
        return new Response(JSON.stringify({ error: 'audio_path must live in your own folder' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const signingClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      const { data: signed, error: signErr } = await signingClient.storage
        .from('voice-logs')
        .createSignedUrl(pathStr, 600);
      if (signErr || !signed?.signedUrl) {
        return new Response(JSON.stringify({ error: 'Could not access the stored recording' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      fetchUrl = signed.signedUrl;
    } else {
      // Only allow audio URLs from Supabase storage to prevent SSRF
      const supaUrlHost = new URL(Deno.env.get('SUPABASE_URL')!).host;
      let parsed: URL;
      try { parsed = new URL(audio_url); } catch {
        return new Response(JSON.stringify({ error: 'Invalid audio_url' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (parsed.protocol !== 'https:' || parsed.host !== supaUrlHost) {
        return new Response(JSON.stringify({ error: 'audio_url must be a Supabase storage URL' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      fetchUrl = audio_url;
    }

    console.log(`Starting transcription for voice log: ${voice_log_id}`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch the audio file
    const audioResponse = await fetch(fetchUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio file: ${audioResponse.statusText}`);
    }
    
    const audioBlob = await audioResponse.blob();
    console.log(`Audio blob size: ${audioBlob.size} bytes`);

    // Transcribe via the Lovable AI Gateway. Whisper is not served there;
    // gpt-4o-transcribe is the default transcription model. Language is left
    // unset so the model auto-detects (logs are not English-only).
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'openai/gpt-4o-transcribe');

    console.log('Calling Lovable AI transcription endpoint...');
    const sttResponse = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: formData,
    });

    if (!sttResponse.ok) {
      const errorText = await sttResponse.text();
      console.error('Transcription gateway error:', sttResponse.status, errorText);
      // Pass the gateway status and message through; 402/403 are terminal and
      // must not be retried or flattened into a generic 500.
      return new Response(
        JSON.stringify({ error: `Transcription failed (${sttResponse.status}): ${errorText.slice(0, 500)}` }),
        { status: sttResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buffered JSON response: { text, usage }. Defensively also handle SSE.
    let transcriptTextRaw = '';
    const contentType = sttResponse.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      const sseText = await sttResponse.text();
      for (const line of sseText.split('\n')) {
        if (!line.startsWith('data:')) continue;
        try {
          const evt = JSON.parse(line.slice(5).trim());
          if (evt.type === 'transcript.text.done') transcriptTextRaw = evt.text ?? transcriptTextRaw;
          else if (evt.type === 'transcript.text.delta') transcriptTextRaw += evt.delta ?? '';
        } catch { /* ignore non-JSON keepalive lines */ }
      }
    } else {
      const result = await sttResponse.json();
      transcriptTextRaw = result.text ?? '';
    }
    const transcriptionResult = { text: transcriptTextRaw };
    console.log('Transcription completed:', transcriptionResult.text?.substring(0, 100));

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const transcriptText = transcriptionResult.text?.toLowerCase() || '';
    
    // Fetch symbols with their tags for archetype matching
    console.log('Fetching symbols for archetype matching...');
    const { data: symbols, error: symbolsError } = await supabase
      .from('registry_glyphs')
      .select('id, motif_tags, source, emotional_valence, symmetry')
      .not('motif_tags', 'is', null);

    if (symbolsError) {
      console.error('Error fetching symbols:', symbolsError);
    }

    // Define archetype keywords for matching
    const archetypeKeywords: Record<string, string[]> = {
      'geometric_patterns': ['geometric', 'pattern', 'grid', 'lattice', 'fractal', 'spiral', 'mandala', 'kaleidoscope', 'tessellation'],
      'entity_encounter': ['entity', 'being', 'presence', 'figure', 'face', 'eyes', 'watching', 'communicating', 'intelligent'],
      'tunnel_vortex': ['tunnel', 'vortex', 'portal', 'gateway', 'passage', 'spinning', 'entering', 'traveling'],
      'light_phenomena': ['light', 'glow', 'bright', 'luminous', 'radiant', 'beam', 'flash', 'illumination'],
      'symbolic_language': ['symbol', 'language', 'writing', 'hieroglyph', 'code', 'alphabet', 'letter', 'text', 'meaning'],
      'emotional_transcendence': ['love', 'peace', 'unity', 'oneness', 'bliss', 'awe', 'profound', 'transcendent', 'connected'],
      'death_rebirth': ['death', 'dying', 'rebirth', 'transformation', 'dissolving', 'ego', 'surrender'],
      'nature_organic': ['nature', 'organic', 'plant', 'vine', 'tree', 'flower', 'growing', 'alive', 'breathing'],
      'crystalline_structures': ['crystal', 'jewel', 'gem', 'faceted', 'prism', 'diamond', 'refraction'],
      'machine_technology': ['machine', 'mechanical', 'technology', 'circuit', 'digital', 'synthetic', 'artificial']
    };

    // Match archetypes based on transcript content
    const archetypeMatches: Array<{ name: string; score: number; keywords_found: string[] }> = [];
    
    for (const [archetype, keywords] of Object.entries(archetypeKeywords)) {
      const foundKeywords = keywords.filter(kw => transcriptText.includes(kw));
      if (foundKeywords.length > 0) {
        const score = Math.min(100, Math.round((foundKeywords.length / keywords.length) * 100 + foundKeywords.length * 10));
        archetypeMatches.push({
          name: archetype.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          score,
          keywords_found: foundKeywords
        });
      }
    }

    // Sort by score descending
    archetypeMatches.sort((a, b) => b.score - a.score);
    console.log(`Found ${archetypeMatches.length} archetype matches`);

    // Match against symbol motif tags
    const symbolMatches: Array<{ symbol_id: string; tags_matched: string[]; score: number }> = [];
    if (symbols && symbols.length > 0) {
      for (const symbol of symbols) {
        const tags = symbol.motif_tags as string[] || [];
        const matchedTags = tags.filter(tag => transcriptText.includes(tag.toLowerCase()));
        if (matchedTags.length > 0) {
          symbolMatches.push({
            symbol_id: symbol.id,
            tags_matched: matchedTags,
            score: Math.round((matchedTags.length / tags.length) * 100)
          });
        }
      }
      symbolMatches.sort((a, b) => b.score - a.score);
    }

    // Generate integration prompts based on archetypes
    const integrationPrompts: string[] = [];
    if (archetypeMatches.some(a => a.name.includes('Emotional'))) {
      integrationPrompts.push('Reflect on the feelings of unity or connection. How can you bring this sense of oneness into your daily life?');
    }
    if (archetypeMatches.some(a => a.name.includes('Entity'))) {
      integrationPrompts.push('Consider journaling about any perceived communications or insights. What message felt most significant?');
    }
    if (archetypeMatches.some(a => a.name.includes('Geometric'))) {
      integrationPrompts.push('The geometric patterns may represent underlying order. How does this relate to patterns in your own life?');
    }
    if (archetypeMatches.some(a => a.name.includes('Death') || a.name.includes('Rebirth'))) {
      integrationPrompts.push('Themes of transformation often indicate readiness for change. What aspects of your life are ready for renewal?');
    }
    if (integrationPrompts.length === 0) {
      integrationPrompts.push('Take time to sit with your experience. What feelings or images stand out most?');
      integrationPrompts.push('Consider creating art or writing to express elements of your experience that words cannot capture.');
    }

    // Calculate protocol match score if protocol was tagged
    let protocolMatchScore = null;
    const { data: voiceLog } = await supabase
      .from('voice_logs')
      .select('protocol_id')
      .eq('id', voice_log_id)
      .single();
    
    if (voiceLog?.protocol_id) {
      // Higher score if transcript mentions relevant protocol keywords
      const protocolKeywords = ['laser', '650', 'red light', 'protocol', 'session'];
      const protocolMatches = protocolKeywords.filter(kw => transcriptText.includes(kw));
      protocolMatchScore = Math.min(100, 50 + protocolMatches.length * 10 + archetypeMatches.length * 5);
    }

    // Update the voice log with transcription and analysis
    const { error: updateError } = await supabase
      .from('voice_logs')
      .update({
        transcript: transcriptionResult.text,
        is_analyzed: true,
        archetype_matches: archetypeMatches.slice(0, 5), // Top 5 archetypes
        integration_prompts: integrationPrompts,
        protocol_match_score: protocolMatchScore,
        analysis_jsonb: {
          // The gateway transcription endpoint does not return per-segment
          // timestamps or audio duration, so those fields are omitted.
          symbol_matches: symbolMatches.slice(0, 10), // Top 10 symbol matches
          total_archetypes_found: archetypeMatches.length,
          analyzed_at: new Date().toISOString(),
        },
      })
      .eq('id', voice_log_id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update voice log: ${updateError.message}`);
    }

    console.log(`Successfully transcribed and analyzed voice log: ${voice_log_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        transcript: transcriptionResult.text,
        archetype_matches: archetypeMatches.slice(0, 5),
        integration_prompts: integrationPrompts,
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
