import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useSymbolVoting } from '@/hooks/useSymbolVoting';
import { ShareConvergence } from './ShareConvergence';
import { ShareConvergenceDialog } from './ShareConvergenceDialog';

interface SeenItButtonProps {
  symbolId: string;
  submitterId?: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  imageUrl?: string;
}

const trackGA = (event: string, params: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', event, params);
  }
};

const CW_INVITE_KEY = 'cw_invite_seen';

export const SeenItButton = ({
  symbolId,
  submitterId,
  size = 'default',
  className,
  imageUrl,
}: SeenItButtonProps) => {
  const navigate = useNavigate();
  const [revealOpen, setRevealOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [hideCard, setHideCard] = useState(false);
  const { userId, userVotes, voteCounts, loading, isOwnSubmission, seenIt } =
    useSymbolVoting(symbolId, submitterId);

  useEffect(() => {
    if (revealOpen) {
      setHideCard(false);
      trackGA('convergence_card_previewed', { symbol_id: symbolId });
    }
  }, [revealOpen, symbolId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOwnSubmission) return;
    if (!userId) {
      trackGA('recognition_reveal_opened', {
        symbol_id: symbolId,
        seen_it_count: voteCounts.seenItCount,
      });
      setRevealOpen(true);
      return;
    }
    const wasSeen = userVotes.hasSeenIt;
    await seenIt();
    // Only offer the share nudge on a new recognition, not on toggle-off.
    if (wasSeen) return;
    // Suppress the toast when the CoWitnessInviteDialog is about to appear.
    // The invite dialog fires when localStorage cw_invite_seen is unset AND
    // there is no co_witness_prefs row. We approximate that here with the
    // localStorage check to avoid a duplicate DB round-trip.
    if (typeof window !== 'undefined' && !window.localStorage.getItem(CW_INVITE_KEY)) {
      return;
    }
    toast.success('Recognition recorded.', {
      action: {
        label: 'Share it',
        onClick: () => setShareOpen(true),
      },
    });
  };

  const handleSaveRecognition = () => {
    trackGA('recognition_reveal_claim_clicked', {
      symbol_id: symbolId,
      seen_it_count: voteCounts.seenItCount,
    });
    const returnTo = `/registry/${symbolId}?pendingVote=seen_it`;
    navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const active = userVotes.hasSeenIt;
  const count = voteCounts.seenItCount;

  return (
    <>
      <Button
        type="button"
        variant={active ? 'default' : 'outline'}
        size={size}
        onClick={handleClick}
        disabled={loading || isOwnSubmission}
        aria-label="I saw this too"
        className={cn(
          'rounded-full gap-2 group',
          active && 'bg-primary text-primary-foreground',
          isOwnSubmission && 'opacity-50 cursor-not-allowed',
          className,
        )}
      >
        <Eye className={cn('w-4 h-4', active && 'fill-current')} />
        <span className="font-body">I saw this too</span>
        <span
          className={cn(
            'font-display text-base leading-none tabular-nums px-2 py-0.5 rounded-full',
            active ? 'bg-background/20' : 'bg-muted text-foreground',
          )}
        >
          {count}
        </span>
      </Button>

      <Dialog open={revealOpen} onOpenChange={setRevealOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          {imageUrl && (
            <div className="w-full aspect-square bg-white flex items-center justify-center border-b border-border">
              <img
                src={imageUrl}
                alt="Recognized symbol"
                className="w-full h-full object-contain p-6"
              />
            </div>
          )}
          <div className="p-6">
            <DialogHeader className="text-left space-y-3">
              <DialogTitle className="font-display text-2xl leading-tight">
                {count > 0 ? 'You are not the only one.' : 'You may be the first to recognize this.'}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                {count > 0
                  ? `${count.toLocaleString()} ${count === 1 ? 'other has' : 'others have'} recognized this symbol. Save yours and we map the overlap together.`
                  : 'Save it and start the count. Every recognition helps us map where these forms converge.'}
              </DialogDescription>
            </DialogHeader>
            {!hideCard && (
              <img
                src={`/card/${symbolId}.svg`}
                alt="Convergence card for this symbol"
                loading="lazy"
                onError={() => setHideCard(true)}
                className="w-full rounded-lg border border-border mt-4"
              />
            )}
            <DialogFooter className="mt-6 flex-col-reverse sm:flex-col-reverse gap-2 sm:gap-2 sm:space-x-0">
              <ShareConvergence
                symbolId={symbolId}
                seenItCount={count}
              />
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={() => setRevealOpen(false)}
              >
                Keep exploring
              </Button>
              <Button
                type="button"
                size="lg"
                className="w-full rounded-full"
                onClick={handleSaveRecognition}
              >
                <Eye className="w-4 h-4 mr-2" />
                Save my recognition
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ShareConvergenceDialog
        symbolId={symbolId}
        seenItCount={count}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </>
  );
};
