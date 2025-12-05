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
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Mic, MicOff, Pause, Play, Square, Upload, 
  Pencil, Clock, CheckCircle2, Loader2, Volume2
} from 'lucide-react';

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
        .select('id, slug, title, compound')
        .eq('is_published', true)
        .order('title');
      
      if (error) throw error;
      return data || [];
    }
  });

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
      };

      mediaRecorder.start(1000); // Collect data every second
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
      // Generate session ID for anonymous users
      const sessionId = userId || `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Find protocol ID if selected
      const protocolId = protocols?.find(p => p.slug === selectedProtocol)?.id || null;

      // Upload audio to storage
      const fileName = `${sessionId}/${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('glyphs') // Reusing glyphs bucket for voice logs
        .upload(`voice-logs/${fileName}`, audioBlob, {
          contentType: 'audio/webm'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('glyphs')
        .getPublicUrl(`voice-logs/${fileName}`);

      // Create voice log entry
      const { data: voiceLog, error: insertError } = await supabase
        .from('voice_logs')
        .insert({
          user_id: userId,
          session_id: sessionId,
          protocol_id: protocolId,
          audio_url: publicUrl,
          duration_seconds: duration,
          tags: selectedProtocol ? [selectedProtocol] : [],
          is_analyzed: false
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Voice log submitted successfully!');
      
      // Navigate to analysis page
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
  };

  return (
    <>
      <Helmet>
        <title>Voice Logger | Experience Documentation | DMT Code</title>
        <meta 
          name="description" 
          content="Document your consciousness experiences with voice logging. Record, analyze, and integrate insights from therapeutic protocols." 
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
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              <Mic className="w-3 h-3 mr-1" />
              EXPERIENCE DOCUMENTATION
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              CONTRIBUTE
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Document your experiences through voice logging or visual symbol drawing. 
              Your contributions help build the open research dataset.
            </p>
          </section>

          {/* Tabbed Interface */}
          <section className="container mx-auto px-4 pb-16 max-w-4xl">
            <Tabs defaultValue="voice" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="voice" className="gap-2">
                  <Mic className="w-4 h-4" />
                  Voice Logger
                </TabsTrigger>
                <TabsTrigger value="draw" className="gap-2">
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
                      Select Protocol (Optional)
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
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedProtocol && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Your log will be tagged with the {selectedProtocol} protocol for analysis.
                      </p>
                    )}
                  </div>

                  {/* Recording Interface */}
                  <div className="text-center space-y-6">
                    {/* Timer Display */}
                    <div className="text-6xl font-mono font-bold text-primary">
                      {formatTime(duration)}
                    </div>

                    {/* Recording Status */}
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

                    {/* Control Buttons */}
                    <div className="flex items-center justify-center gap-4">
                      {!isRecording && !audioBlob && (
                        <Button 
                          size="lg" 
                          onClick={startRecording}
                          className="gap-2 px-8"
                        >
                          <Mic className="w-5 h-5" />
                          Start Recording
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
                            ) : (
                              <Upload className="w-5 h-5" />
                            )}
                            {isSubmitting ? 'Submitting...' : 'Submit for Analysis'}
                          </Button>
                        </>
                      )}
                    </div>

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
                    <h3 className="font-medium mb-3">Recording Tips</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
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
                        Selecting a protocol helps match your experience to research archetypes
                      </li>
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