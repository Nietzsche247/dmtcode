import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceNoteRecorderProps {
  onRecordingChange: (audioBlob: Blob | null) => void;
}

export const VoiceNoteRecorder = ({ onRecordingChange }: VoiceNoteRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingChange(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer (max 30 seconds)
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

      toast.success('Recording started (max 30s)');
    } catch (error) {
      console.error('Microphone access error:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingTime(0);
    onRecordingChange(null);
  };

  return (
    <div className="space-y-3">
      {!audioUrl ? (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            aria-label={isRecording ? "Stop recording voice note" : "Start recording voice note"}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop ({30 - recordingTime}s)
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Record Voice Note
              </>
            )}
          </Button>
          {isRecording && (
            <span className="text-sm text-muted-foreground animate-pulse">
              Recording... {recordingTime}s / 30s
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 border border-border rounded-md bg-card">
          <audio src={audioUrl} controls className="flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={deleteRecording}
            aria-label="Delete voice note recording"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Optional: Record up to 30 seconds describing your experience
      </p>
    </div>
  );
};
