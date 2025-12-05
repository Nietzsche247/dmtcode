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
          duration: transcriptionResult.duration,
          language: transcriptionResult.language,
          segments: transcriptionResult.segments?.map((s: any) => ({
            start: s.start,
            end: s.end,
            text: s.text,
          })),
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
        duration: transcriptionResult.duration,
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
