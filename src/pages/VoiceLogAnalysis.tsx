import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Mic, Share2, Download, Clock, 
  Target, Brain, Sparkles, CheckCircle2, Loader2
} from 'lucide-react';

const VoiceLogAnalysis = () => {
  const { id } = useParams<{ id: string }>();

  const { data: voiceLog, isLoading, error } = useQuery({
    queryKey: ['voice-log', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voice_logs')
        .select(`
          *,
          protocols:protocol_id (
            slug,
            title,
            compound
          )
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Voice log not found');
      return data;
    }
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !voiceLog) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Voice Log Not Found</h1>
          <p className="text-muted-foreground mb-8">This voice log doesn't exist or you don't have access to it.</p>
          <Link to="/log">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Voice Logger
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const protocol = voiceLog.protocols as any;
  const archetypeMatches = (voiceLog.archetype_matches as any[]) || [];
  const integrationPrompts = (voiceLog.integration_prompts as any[]) || [];

  return (
    <>
      <Helmet>
        <title>Voice Log Analysis | DMT Code</title>
        <meta 
          name="description" 
          content="Analysis of your voice log submission with archetype matches and integration prompts." 
        />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        
        <main className="relative z-10 pt-4">
          <section className="container mx-auto px-4 py-8 max-w-4xl">
            <Link 
              to="/log" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Voice Logger
            </Link>

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
              <div>
                <Badge variant="outline" className="mb-2">
                  <Mic className="w-3 h-3 mr-1" />
                  Voice Log Analysis
                </Badge>
                <h1 className="text-3xl font-black tracking-tight">
                  Session Analysis
                </h1>
                <p className="text-muted-foreground mt-1">
                  {new Date(voiceLog.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-2xl font-bold">{formatTime(voiceLog.duration_seconds || 0)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Protocol Match</p>
                    <p className="text-2xl font-bold">
                      {voiceLog.protocol_match_score ? `${voiceLog.protocol_match_score}%` : 'Pending'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-2xl font-bold">
                      {voiceLog.is_analyzed ? 'Complete' : 'Processing'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Protocol Tag */}
            {protocol && (
              <Card className="p-6 mb-8 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tagged Protocol</p>
                    <h3 className="text-lg font-semibold">{protocol.title}</h3>
                    <Badge variant="outline" className="mt-1">{protocol.compound}</Badge>
                  </div>
                  <Link to={`/protocols/${protocol.slug}`}>
                    <Button variant="outline" size="sm">View Protocol</Button>
                  </Link>
                </div>
              </Card>
            )}

            {/* Audio Playback */}
            {voiceLog.audio_url && (
              <Card className="p-6 mb-8">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Recording
                </h3>
                <audio 
                  controls 
                  src={voiceLog.audio_url} 
                  className="w-full"
                />
              </Card>
            )}

            {/* Transcript */}
            <Card className="p-6 mb-8">
              <h3 className="font-semibold mb-4">Transcript</h3>
              {voiceLog.transcript ? (
                <p className="text-muted-foreground whitespace-pre-wrap">{voiceLog.transcript}</p>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transcription processing... Check back soon.</span>
                </div>
              )}
            </Card>

            {/* Archetype Matches */}
            <Card className="p-6 mb-8">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Archetype Matches
              </h3>
              {archetypeMatches.length > 0 ? (
                <div className="space-y-3">
                  {archetypeMatches.map((match: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span>{match.name || match}</span>
                      {match.score && (
                        <Badge variant="secondary">{match.score}% match</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Archetype analysis will appear here once processing is complete.
                </p>
              )}
            </Card>

            {/* Integration Prompts */}
            <Card className="p-6 mb-8">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Integration Prompts
              </h3>
              {integrationPrompts.length > 0 ? (
                <ul className="space-y-3">
                  {integrationPrompts.map((prompt: any, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-muted-foreground">{prompt}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  Personalized integration prompts will appear here based on your recording content.
                </p>
              )}
            </Card>

            {/* Premium Analysis Upsell - Hidden until ready */}
            {/*
            <Card className="p-8 bg-primary/5 border-primary/20 text-center">
              <h3 className="text-xl font-semibold mb-2">Unlock Premium Analysis</h3>
              <p className="text-muted-foreground mb-4">
                Get deeper insights, therapist matching, and personalized integration plans.
              </p>
              <Button>Upgrade to Premium</Button>
            </Card>
            */}

            {/* Actions */}
            <div className="flex justify-center gap-4 pt-8">
              <Link to="/log">
                <Button variant="outline" className="gap-2">
                  <Mic className="w-4 h-4" />
                  Record Another
                </Button>
              </Link>
              <Link to="/registry">
                <Button className="gap-2">
                  Draw Glyphs
                </Button>
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default VoiceLogAnalysis;