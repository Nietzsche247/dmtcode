import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { VOICE_NOTE_SECONDS } from '@/lib/recordDraft';

interface Props { glyphId: string; submissionId: string; userId: string; copy: (key: string) => string }

export function RecordVoiceNote({ glyphId, submissionId, userId, copy }: Props) {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [playback, setPlayback] = useState('');
  const stop = () => { if (recorder.current?.state === 'recording') recorder.current.stop(); };
  useEffect(() => { mounted.current = true; return () => {
    mounted.current = false;
    if (recorder.current) recorder.current.onstop = null;
    stop(); stream.current?.getTracks().forEach(track => track.stop());
    if (timer.current) clearTimeout(timer.current);
    if (ticker.current) clearInterval(ticker.current);
  }; }, []);
  const start = async () => {
    setMessage('');
    try {
      if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported('audio/webm')) throw new Error('unsupported');
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const device = new MediaRecorder(media, { mimeType: 'audio/webm' });
      recorder.current = device;
      const chunks: Blob[] = [];
      const started = Date.now();
      device.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      device.onstop = async () => {
        media.getTracks().forEach(track => track.stop());
        if (timer.current) clearTimeout(timer.current);
        if (ticker.current) clearInterval(ticker.current);
        setRecording(false); setSaving(true);
        const path = `${userId}/${glyphId}.webm`;
        let uploaded = false;
        try {
          const { error: uploadError } = await supabase.storage.from('voice-notes').upload(path, new Blob(chunks, { type: 'audio/webm' }), { contentType: 'audio/webm', upsert: false });
          if (uploadError) throw uploadError;
          uploaded = true;
          const { error } = await supabase.from('voice_logs').insert({ user_id: userId, glyph_id: glyphId, symbol_id: submissionId, session_id: glyphId, audio_url: `voice-notes/${path}`, duration_seconds: Math.min(VOICE_NOTE_SECONDS, Math.ceil((Date.now() - started) / 1000)) });
          if (error) throw error;
          uploaded = false;
          const { data } = await supabase.storage.from('voice-notes').createSignedUrl(path, 3600);
          setPlayback(data?.signedUrl || ''); setMessage(copy('voiceSaved'));
        } catch { if (uploaded) await supabase.storage.from('voice-notes').remove([path]); setMessage(copy('voiceError')); }
        finally { setSaving(false); }
      };
      device.start(1000); setSeconds(0); setRecording(true);
      ticker.current = setInterval(() => setSeconds(Math.min(VOICE_NOTE_SECONDS, Math.floor((Date.now() - started) / 1000))), 1000);
      timer.current = setTimeout(stop, VOICE_NOTE_SECONDS * 1000);
    } catch { setMessage(copy('voiceError')); }
  };
  return <section className="border-t border-border py-6 space-y-4">
    <h2 className="text-xl">{copy('voiceTitle')}</h2>
    <p className="text-sm text-muted-foreground">{copy('voicePrivacy')}</p>
    <Button className="min-h-12" variant="outline" disabled={saving || !!playback} onClick={recording ? stop : start}>
      {recording ? <Square className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}{copy(recording ? 'stopVoice' : saving ? 'saving' : 'startVoice')}
    </Button>
    {recording && <p role="timer">{seconds} / {VOICE_NOTE_SECONDS} s</p>}
    {message && <p role="status">{message}</p>}
    {playback && <audio controls src={playback} className="w-full" />}
  </section>;
}