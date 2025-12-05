import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Mic, MicOff, Pause, Play, Square, Upload, 
  Pencil, Clock, CheckCircle2, Loader2, Volume2, Stethoscope, Download
} from 'lucide-react';

// Clinical theme labels for Ketamine/Spravato protocol
const CLINICAL_THEMES = [
  'grief', 'self-criticism', 'hope', 'acceptance', 
  'relationship patterns', 'self-worth', 'meaning', 
  'connection', 'release', 'insight'
];

// Clinical prompts for KAP
const CLINICAL_PROMPTS = [
  "What emotions are present right now?",
  "Any shifts in perspective on your depression?",
  "What body sensations are you noticing?",
  "Any new insights about relationships or self-worth?",
  "What would you like to remember from this experience?",
  "Is there anything you feel ready to let go of?",
  "What feels different about how you see yourself?",
];

const VoiceLogger = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const protocolSlug = searchParams.get('protocol');
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [selectedProtocol, setSelectedProtocol] = useState<string>(protocolSlug || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Clinical mode state
  const [preMood, setPreMood] = useState<number>(5);
  const [postMood, setPostMood] = useState<number>(5);
  const [showPostMood, setShowPostMood] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkUser();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const { data: protocols } = useQuery({
    queryKey: ['protocols-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('protocols')
        .select('id, slug, title, compound, content_jsonb')
        .eq('is_published', true)
        .order('title');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Check if selected protocol is clinical mode
  const selectedProtocolData = protocols?.find(p => p.slug === selectedProtocol);
  const isClinicalMode = (selectedProtocolData?.content_jsonb as any)?.clinical_mode === true;
  const clinicalVoiceConfig = isClinicalMode 
    ? (selectedProtocolData?.content_jsonb as any)?.voice_logger_integration 
    : null;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
        setShowPostMood(true);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

      toast.success('Recording started');
    } catch (err) {
      toast.error('Microphone access denied. Please enable microphone permissions.');
      console.error('Recording error:', err);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) clearInterval(timerRef.current);
        setIsPaused(true);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      setIsPaused(false);
      toast.success('Recording stopped');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!audioBlob) {
      toast.error('No recording to submit');
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionId = userId || `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const protocolId = protocols?.find(p => p.slug === selectedProtocol)?.id || null;

      const fileName = `${sessionId}/${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('glyphs')
        .upload(`voice-logs/${fileName}`, audioBlob, {
          contentType: 'audio/webm'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('glyphs')
        .getPublicUrl(`voice-logs/${fileName}`);

      // Include clinical mode data in analysis_jsonb
      const analysisData = isClinicalMode ? {
        clinical_mode: true,
        pre_session_mood: preMood,
        post_session_mood: postMood,
        mood_change: postMood - preMood,
        theme_detection_enabled: true,
        archetype_matching_disabled: true
      } : null;

      const { data: voiceLog, error: insertError } = await supabase
        .from('voice_logs')
        .insert({
          user_id: userId,
          session_id: sessionId,
          protocol_id: protocolId,
          audio_url: publicUrl,
          duration_seconds: duration,
          tags: selectedProtocol ? [selectedProtocol] : [],
          is_analyzed: false,
          analysis_jsonb: analysisData
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success(isClinicalMode 
        ? 'Clinical session log submitted! Generating report...' 
        : 'Voice log submitted! Transcription starting...'
      );
      
      // Trigger transcription
      supabase.functions.invoke('transcribe-voice', {
        body: { 
          voice_log_id: voiceLog.id, 
          audio_url: publicUrl,
          clinical_mode: isClinicalMode
        }
      }).then(({ error }) => {
        if (error) {
          console.error('Transcription error:', error);
        }
      });
      
      navigate(`/log/analysis/${voiceLog.id}`);
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Failed to submit voice log');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setShowPostMood(false);
    setPostMood(5);
  };

  return (
    <>
      <Helmet>
        <title>Voice Logger | {isClinicalMode ? 'Clinical Session Documentation' : 'Experience Documentation'} | DMT Code</title>
        <meta 
          name="description" 
          content={isClinicalMode 
            ? "Clinical voice logging for ketamine-assisted psychotherapy sessions. Record, analyze therapeutic themes, and export PDF reports for patient charts."
            : "Document your consciousness experiences with voice logging. Record, analyze, and integrate insights from therapeutic protocols."
          }
        />
        <link rel="canonical" href="https://dmtcode.com/log" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        
        <main className="relative z-10 pt-4">
          {/* Hero Section */}
          <section className="container mx-auto px-4 py-8 text-center">
            <Badge variant="outline" className={`mb-4 ${isClinicalMode ? 'text-green-500 border-green-500/30' : 'text-primary border-primary/30'}`}>
              {isClinicalMode ? (
                <>
                  <Stethoscope className="w-3 h-3 mr-1" />
                  CLINICAL SESSION DOCUMENTATION
                </>
              ) : (
                <>
                  <Mic className="w-3 h-3 mr-1" />
                  EXPERIENCE DOCUMENTATION
                </>
              )}
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              {isClinicalMode ? 'CLINICAL SESSION LOG' : 'CONTRIBUTE'}
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {isClinicalMode 
                ? 'Record therapeutic sessions with mood tracking and theme detection. Exportable PDF reports for patient documentation.'
                : 'Document your experiences through voice logging or visual symbol drawing. Your contributions help build the open research dataset.'
              }
            </p>
          </section>

          {/* Tabbed Interface */}
          <section className="container mx-auto px-4 pb-16 max-w-4xl">
            <Tabs defaultValue="voice" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="voice" className="gap-2">
                  {isClinicalMode ? <Stethoscope className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isClinicalMode ? 'Clinical Voice Log' : 'Voice Logger'}
                </TabsTrigger>
                <TabsTrigger value="draw" className="gap-2" disabled={isClinicalMode}>
                  <Pencil className="w-4 h-4" />
                  Draw Glyphs
                </TabsTrigger>
              </TabsList>

              {/* Voice Logger Tab */}
              <TabsContent value="voice">
                <Card className="p-8">
                  {/* Protocol Selection */}
                  <div className="mb-8">
                    <Label htmlFor="protocol" className="text-base mb-3 block">
                      Select Protocol {isClinicalMode && <span className="text-green-500">(Clinical Mode Active)</span>}
                    </Label>
                    <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a protocol to tag this log..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific protocol</SelectItem>
                        {protocols?.map(p => (
                          <SelectItem key={p.id} value={p.slug}>
                            {p.title} ({p.compound})
                            {(p.content_jsonb as any)?.clinical_mode && ' • Clinical'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isClinicalMode && (
                      <p className="text-sm text-green-600 mt-2">
                        Clinical mode enabled: Therapeutic theme detection instead of visual pattern matching. 
                        Mood scales and PDF export available.
                      </p>
                    )}
                  </div>

                  {/* Pre-Session Mood Scale (Clinical Mode) */}
                  {isClinicalMode && !isRecording && !audioBlob && (
                    <div className="mb-8 p-4 bg-muted/50 rounded-lg">
                      <Label className="text-base mb-3 block">Pre-Session Mood (0-10)</Label>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-8">Low</span>
                        <Slider
                          value={[preMood]}
                          onValueChange={(v) => setPreMood(v[0])}
                          max={10}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground w-8">High</span>
                        <Badge variant="outline" className="ml-2 min-w-[3rem] justify-center">
                          {preMood}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Clinical Prompts Display */}
                  {isClinicalMode && !audioBlob && (
                    <div className="mb-8 p-4 border border-green-500/20 bg-green-500/5 rounded-lg">
                      <h3 className="font-medium mb-3 flex items-center gap-2 text-green-600">
                        <Stethoscope className="w-4 h-4" />
                        Therapeutic Session Prompts
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {(clinicalVoiceConfig?.prompts || CLINICAL_PROMPTS).slice(0, 5).map((prompt: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500">•</span>
                            "{prompt}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recording Interface */}
                  <div className="text-center space-y-6">
                    <div className="text-6xl font-mono font-bold text-primary">
                      {formatTime(duration)}
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      {isRecording && !isPaused && (
                        <>
                          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                          <span className="text-red-500 font-medium">Recording...</span>
                        </>
                      )}
                      {isRecording && isPaused && (
                        <>
                          <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                          <span className="text-yellow-500 font-medium">Paused</span>
                        </>
                      )}
                      {!isRecording && audioBlob && (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-green-500 font-medium">Recording Complete</span>
                        </>
                      )}
                      {!isRecording && !audioBlob && (
                        <span className="text-muted-foreground">Ready to record</span>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      {!isRecording && !audioBlob && (
                        <Button 
                          size="lg" 
                          onClick={startRecording}
                          className="gap-2 px-8"
                        >
                          <Mic className="w-5 h-5" />
                          {isClinicalMode ? 'Start Clinical Session' : 'Start Recording'}
                        </Button>
                      )}

                      {isRecording && (
                        <>
                          <Button 
                            variant="outline" 
                            size="lg"
                            onClick={pauseRecording}
                            className="gap-2"
                          >
                            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                            {isPaused ? 'Resume' : 'Pause'}
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="lg"
                            onClick={stopRecording}
                            className="gap-2"
                          >
                            <Square className="w-5 h-5" />
                            Stop
                          </Button>
                        </>
                      )}

                      {!isRecording && audioBlob && (
                        <>
                          <Button 
                            variant="outline" 
                            size="lg"
                            onClick={resetRecording}
                            className="gap-2"
                          >
                            <MicOff className="w-5 h-5" />
                            Re-record
                          </Button>
                          <Button 
                            size="lg"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="gap-2 px-8"
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isClinicalMode ? (
                              <Download className="w-5 h-5" />
                            ) : (
                              <Upload className="w-5 h-5" />
                            )}
                            {isSubmitting 
                              ? 'Processing...' 
                              : isClinicalMode 
                                ? 'Generate Report' 
                                : 'Submit for Analysis'
                            }
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Post-Session Mood Scale (Clinical Mode) */}
                    {isClinicalMode && showPostMood && (
                      <div className="pt-6 border-t">
                        <div className="p-4 bg-muted/50 rounded-lg max-w-md mx-auto">
                          <Label className="text-base mb-3 block">Post-Session Mood (0-10)</Label>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground w-8">Low</span>
                            <Slider
                              value={[postMood]}
                              onValueChange={(v) => setPostMood(v[0])}
                              max={10}
                              step={1}
                              className="flex-1"
                            />
                            <span className="text-sm text-muted-foreground w-8">High</span>
                            <Badge variant="outline" className="ml-2 min-w-[3rem] justify-center">
                              {postMood}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Mood change: <span className={postMood - preMood >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {postMood - preMood >= 0 ? '+' : ''}{postMood - preMood}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Audio Playback */}
                    {audioUrl && (
                      <div className="pt-6 border-t">
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Preview Recording
                        </Label>
                        <audio 
                          controls 
                          src={audioUrl} 
                          className="w-full max-w-md mx-auto"
                        />
                      </div>
                    )}
                  </div>

                  {/* Tips */}
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="font-medium mb-3">
                      {isClinicalMode ? 'Clinical Documentation Tips' : 'Recording Tips'}
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      {isClinicalMode ? (
                        <>
                          <li className="flex items-start gap-2">
                            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                            Document during the integration window (peak + 15-30 minutes)
                          </li>
                          <li className="flex items-start gap-2">
                            <Stethoscope className="w-4 h-4 mt-0.5 shrink-0" />
                            Focus on emotional content, perspective shifts, and insights
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                            Reports are exportable as PDF for patient charts
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-start gap-2">
                            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                            Record as soon as possible after your experience for best recall
                          </li>
                          <li className="flex items-start gap-2">
                            <Volume2 className="w-4 h-4 mt-0.5 shrink-0" />
                            Speak clearly and describe visual elements, emotions, and insights
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                            Selecting a protocol helps match your experience to research patterns
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </Card>
              </TabsContent>

              {/* Draw Glyphs Tab */}
              <TabsContent value="draw">
                <Card className="p-8 text-center">
                  <Pencil className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Visual Symbol Drawing</h3>
                  <p className="text-muted-foreground mb-6">
                    Use the full glyph submission form to draw and document visual symbols.
                  </p>
                  <Link to="/registry">
                    <Button size="lg" className="gap-2">
                      <Pencil className="w-4 h-4" />
                      Open Glyph Registry
                    </Button>
                  </Link>
                </Card>
              </TabsContent>
            </Tabs>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default VoiceLogger;