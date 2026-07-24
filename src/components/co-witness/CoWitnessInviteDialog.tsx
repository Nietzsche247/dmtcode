import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const KEY = 'cw_invite_seen';

const trackGA = (event: string, params: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', event, params);
  }
};

interface Props {
  userId: string | null;
  hasSeenIt: boolean;
}

/**
 * One-time gentle invitation shown after a signed-in user first records a
 * recognition, if they have no co_witness_prefs row and have never seen this
 * invitation before. Does not block the vote path.
 */
export const CoWitnessInviteDialog = ({ userId, hasSeenIt }: Props) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId || !hasSeenIt) return;
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(KEY)) return;

    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from('co_witness_prefs')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (cancelled) return;
      if (!data) {
        setOpen(true);
      } else {
        // Already opted in or out via settings; do not ask again.
        window.localStorage.setItem(KEY, '1');
      }
    })();
    return () => { cancelled = true; };
  }, [userId, hasSeenIt]);

  const markSeen = () => {
    try { window.localStorage.setItem(KEY, '1'); } catch { /* noop */ }
  };

  const makeVisible = async () => {
    if (!userId) return;
    const { error } = await (supabase as any)
      .from('co_witness_prefs')
      .upsert(
        { user_id: userId, visibility: 'pairs_only', allow_high_five: true },
        { onConflict: 'user_id' }
      );
    markSeen();
    setOpen(false);
    if (error) {
      toast.error('Could not save. Try again from your profile.');
      return;
    }
    trackGA('co_witness_optin', { source: 'invite_dialog' });
    toast.success('You are visible to co-witnesses now.');
  };

  const stayPrivate = () => {
    markSeen();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) stayPrivate(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left space-y-3">
          <DialogTitle className="font-display text-2xl leading-tight">
            You are not alone in this.
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Other explorers marked the same symbol. If you opt in, you can see each other,
            handles and avatars only. Private by default, change anytime in your profile.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button size="lg" className="w-full rounded-full" onClick={makeVisible}>
            Make me visible
          </Button>
          <Button size="lg" variant="ghost" className="w-full" onClick={stayPrivate}>
            Stay private
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
