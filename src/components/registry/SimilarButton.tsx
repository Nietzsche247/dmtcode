import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSymbolVoting } from '@/hooks/useSymbolVoting';

interface SimilarButtonProps {
  symbolId: string;
  submitterId?: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const SimilarButton = ({ symbolId, submitterId, size = 'default', className }: SimilarButtonProps) => {
  const { userVotes, voteCounts, loading, isOwnSubmission, similar } = useSymbolVoting(symbolId, submitterId);

  if (isOwnSubmission) return null;

  const active = userVotes.hasSimilar;
  const count = voteCounts.similarCount;

  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size={size}
      onClick={() => similar()}
      disabled={loading}
      aria-label="I've seen something similar"
      className={cn('rounded-full gap-2', className)}
    >
      <Layers className="w-4 h-4" />
      <span className="font-body">I've seen something similar</span>
      {count > 0 && (
        <span className="font-display text-base leading-none tabular-nums px-2 py-0.5 rounded-full bg-muted text-foreground">
          {count}
        </span>
      )}
    </Button>
  );
};
