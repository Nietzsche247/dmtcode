import { EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSymbolVoting } from '@/hooks/useSymbolVoting';

interface DidNotMatchButtonProps {
  symbolId: string;
  submitterId?: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const DidNotMatchButton = ({ symbolId, submitterId, size = 'default', className }: DidNotMatchButtonProps) => {
  const { userId, userVotes, voteCounts, loading, isOwnSubmission, downvote } = useSymbolVoting(symbolId, submitterId);

  if (!userId || isOwnSubmission) return null;

  const active = userVotes.hasDownvoted;
  const count = voteCounts.downvotes;

  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size={size}
      onClick={() => downvote()}
      disabled={loading}
      aria-label="This does not match what I saw"
      className={cn('rounded-full gap-2', className)}
    >
      <EyeOff className="w-4 h-4" />
      <span className="font-body">This does not match what I saw</span>
      {count > 0 && (
        <span className="font-display text-base leading-none tabular-nums px-2 py-0.5 rounded-full bg-muted text-foreground">
          {count}
        </span>
      )}
    </Button>
  );
};
