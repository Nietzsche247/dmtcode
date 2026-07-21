import { useNavigate, useLocation } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSymbolVoting } from '@/hooks/useSymbolVoting';

interface SeenItButtonProps {
  symbolId: string;
  submitterId?: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

/**
 * Prominent one-tap "I saw this too" button with live count.
 * Redirects unauthenticated users to /auth and auto-fires the vote
 * on return via ?pendingVote=seen_it on the symbol detail page.
 */
export const SeenItButton = ({
  symbolId,
  submitterId,
  size = 'default',
  className,
}: SeenItButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, userVotes, voteCounts, loading, isOwnSubmission, seenIt } =
    useSymbolVoting(symbolId, submitterId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOwnSubmission) return;
    if (!userId) {
      const returnTo = `/registry/${symbolId}?pendingVote=seen_it`;
      navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    seenIt();
  };

  const active = userVotes.hasSeenIt;

  return (
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
        {voteCounts.seenItCount}
      </span>
    </Button>
  );
};
