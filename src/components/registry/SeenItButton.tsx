import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
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

/**
 * Recognition-first "I saw this too" button.
 * Unauthenticated tap opens a reveal dialog showing the real live seen_it
 * count. Login becomes the reward (Save my recognition), never a toll.
 * Authenticated tap fires the vote immediately, unchanged.
 */
export const SeenItButton = ({
  symbolId,
  submitterId,
  size = 'default',
  className,
  imageUrl,
}: SeenItButtonProps) => {
  const navigate = useNavigate();
  const [revealOpen, setRevealOpen] = useState(false);
  const { userId, userVotes, voteCounts, loading, isOwnSubmission, seenIt } =
    useSymbolVoting(symbolId, submitterId);

  const handleClick = (e: React.MouseEvent) => {
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
    seenIt();
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
            <DialogFooter className="mt-6 flex-col-reverse sm:flex-col-reverse gap-2 sm:gap-2 sm:space-x-0">
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
    </>
  );
};
