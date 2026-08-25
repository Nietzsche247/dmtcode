import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Play, Trash2, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceLogRow {
  id: string;
  created_at: string;
  duration_seconds: number | null;
  audio_url: string | null;
  is_analyzed: boolean | null;
}

// Rows written before the private bucket migration hold a full public URL in
// audio_url; newer rows hold the bare object path inside the voice-logs bucket.
const storageRefFor = (audioUrl: string): { bucket: string; path: string } | null => {
  if (audioUrl.startsWith('http')) {
    const m = audioUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:[?#]|$)/);
    return m ? { bucket: m[1], path: decodeURIComponent(m[2]) } : null;
  }
  return { bucket: 'voice-logs', path: audioUrl };
};

const formatDuration = (seconds: number | null) => {
  if (!seconds && seconds !== 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const VoiceRecordingsList = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const [playUrls, setPlayUrls] = useState<Record<string, string>>({});
  const [loadingPlayId, setLoadingPlayId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['my-voice-logs', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voice_logs')
        .select('id, created_at, duration_seconds, audio_url, is_analyzed')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as VoiceLogRow[];
    },
  });

  const handlePlay = async (log: VoiceLogRow) => {
    if (!log.audio_url) return;
    if (playUrls[log.id]) return;
    const ref = storageRefFor(log.audio_url);
    if (!ref) {
      toast.error('This recording cannot be located.');
      return;
    }
    setLoadingPlayId(log.id);
    const { data, error } = await supabase.storage
      .from(ref.bucket)
      .createSignedUrl(ref.path, 3600);
    setLoadingPlayId(null);
    if (error || !data?.signedUrl) {
      toast.error('Could not load the recording for playback.');
      return;
    }
    setPlayUrls((prev) => ({ ...prev, [log.id]: data.signedUrl }));
  };

  const handleDelete = async (log: VoiceLogRow) => {
    setDeletingId(log.id);
    try {
      // Storage object first. If the row were deleted first, a failed storage
      // delete would leave a file nobody can find or remove. This order means
      // the worst case is a visible row the owner can retry on.
      if (log.audio_url) {
        const ref = storageRefFor(log.audio_url);
        if (ref) {
          const { error: storageError } = await supabase.storage
            .from(ref.bucket)
            .remove([ref.path]);
          if (storageError) {
            toast.error('Could not delete the audio file, so nothing was removed. Please try again.');
            return;
          }
        }
      }

      const { error: rowError } = await supabase
        .from('voice_logs')
        .delete()
        .eq('id', log.id);
      if (rowError) {
        toast.error('The audio file was deleted but the log entry could not be removed. Please try again.');
        return;
      }

      toast.success('Recording and log deleted permanently.');
      queryClient.invalidateQueries({ queryKey: ['my-voice-logs', userId] });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="p-8">
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
        <Volume2 className="w-5 h-5" />
        Your recordings
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Only you can see or play these. Deletion is permanent and removes the audio file and the log together.
      </p>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading your recordings...
        </div>
      )}

      {!isLoading && (!logs || logs.length === 0) && (
        <p className="text-sm text-muted-foreground">You have no recordings yet.</p>
      )}

      <div className="space-y-3">
        {logs?.map((log) => (
          <div key={log.id} className="p-4 border border-border rounded-md bg-card space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {new Date(log.created_at).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDuration(log.duration_seconds) && `${formatDuration(log.duration_seconds)} long`}
                  {log.is_analyzed ? ' · analyzed' : ' · analysis pending'}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {log.audio_url && !playUrls[log.id] && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlay(log)}
                    disabled={loadingPlayId === log.id}
                    aria-label="Play recording"
                  >
                    {loadingPlayId === log.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === log.id}
                      aria-label="Delete recording"
                    >
                      {deletingId === log.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this recording?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Deletion is permanent. The audio file and the log are removed together and cannot be recovered.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep it</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(log)}>
                        Delete permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            {playUrls[log.id] && (
              <audio controls src={playUrls[log.id]} className="w-full" />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
