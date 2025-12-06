import { ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSymbolVoting } from '@/hooks/useSymbolVoting';

interface VotingButtonsProps {
  symbolId: string;
  submitterId?: string;
  variant?: 'compact' | 'full';
  className?: string;
}

export const VotingButtons = ({ 
  symbolId, 
  submitterId, 
  variant = 'compact',
  className 
}: VotingButtonsProps) => {
  const {
    userId,
    userVotes,
    voteCounts,
    loading,
    isOwnSubmission,
    upvote,
    downvote,
    seenIt,
  } = useSymbolVoting(symbolId, submitterId);

  const isCompact = variant === 'compact';

  const VoteButton = ({ 
    onClick, 
    isActive, 
    disabled, 
    icon: Icon, 
    count, 
    label,
    activeClass,
  }: {
    onClick: () => void;
    isActive: boolean;
    disabled: boolean;
    icon: typeof ChevronUp;
    count: number;
    label: string;
    activeClass: string;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={isCompact ? 'sm' : 'default'}
            onClick={onClick}
            disabled={disabled || loading}
            className={cn(
              'flex items-center gap-1 transition-all duration-200',
              isActive && activeClass,
              isActive && 'shadow-sm',
              !disabled && 'hover:scale-105',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={label}
          >
            <Icon 
              className={cn(
                isCompact ? 'w-4 h-4' : 'w-5 h-5',
                isActive && 'fill-current'
              )} 
            />
            <span className={cn(
              'font-medium',
              isCompact ? 'text-xs' : 'text-sm'
            )}>
              {count}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isOwnSubmission ? "Can't vote on own submission" : label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (isCompact) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <VoteButton
          onClick={upvote}
          isActive={userVotes.hasUpvoted}
          disabled={!userId || isOwnSubmission}
          icon={ChevronUp}
          count={voteCounts.upvotes}
          label="Upvote"
          activeClass="text-green-500 bg-green-500/10"
        />
        <VoteButton
          onClick={downvote}
          isActive={userVotes.hasDownvoted}
          disabled={!userId || isOwnSubmission}
          icon={ChevronDown}
          count={voteCounts.downvotes}
          label="Downvote"
          activeClass="text-red-500 bg-red-500/10"
        />
        <VoteButton
          onClick={seenIt}
          isActive={userVotes.hasSeenIt}
          disabled={!userId || isOwnSubmission}
          icon={Eye}
          count={voteCounts.seenItCount}
          label="I've seen this too"
          activeClass="text-primary bg-primary/10"
        />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center">
          <Button
            variant={userVotes.hasUpvoted ? 'default' : 'outline'}
            size="lg"
            onClick={upvote}
            disabled={!userId || isOwnSubmission || loading}
            className={cn(
              'rounded-full w-14 h-14 p-0 transition-all duration-200',
              userVotes.hasUpvoted && 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30',
              !userId && 'opacity-50',
              !isOwnSubmission && userId && 'hover:scale-110'
            )}
            aria-label="Upvote symbol"
          >
            <ChevronUp className={cn(
              'w-8 h-8',
              userVotes.hasUpvoted && 'fill-current'
            )} />
          </Button>
          <span className="text-lg font-bold mt-1">{voteCounts.upvotes}</span>
          <span className="text-xs text-muted-foreground">upvotes</span>
        </div>

        <div className="flex flex-col items-center">
          <Button
            variant={userVotes.hasDownvoted ? 'default' : 'outline'}
            size="lg"
            onClick={downvote}
            disabled={!userId || isOwnSubmission || loading}
            className={cn(
              'rounded-full w-14 h-14 p-0 transition-all duration-200',
              userVotes.hasDownvoted && 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30',
              !userId && 'opacity-50',
              !isOwnSubmission && userId && 'hover:scale-110'
            )}
            aria-label="Downvote symbol"
          >
            <ChevronDown className={cn(
              'w-8 h-8',
              userVotes.hasDownvoted && 'fill-current'
            )} />
          </Button>
          <span className="text-lg font-bold mt-1">{voteCounts.downvotes}</span>
          <span className="text-xs text-muted-foreground">downvotes</span>
        </div>
      </div>

      <Button
        variant={userVotes.hasSeenIt ? 'default' : 'outline'}
        size="lg"
        onClick={seenIt}
        disabled={!userId || isOwnSubmission || loading}
        className={cn(
          'w-full transition-all duration-200',
          userVotes.hasSeenIt && 'bg-primary shadow-lg shadow-primary/30',
          !userId && 'opacity-50',
          !isOwnSubmission && userId && 'hover:scale-[1.02]'
        )}
        aria-label="Mark as I've seen this too"
      >
        <Eye className={cn('w-5 h-5 mr-2', userVotes.hasSeenIt && 'fill-current')} />
        I've Seen This Too
        <span className="ml-2 bg-background/20 px-2 py-0.5 rounded-full text-sm">
          {voteCounts.seenItCount}
        </span>
      </Button>

      {!userId && (
        <p className="text-xs text-muted-foreground text-center">
          <a href="/auth" className="text-primary hover:underline">Log in</a> to vote
        </p>
      )}

      {isOwnSubmission && (
        <p className="text-xs text-muted-foreground text-center">
          You cannot vote on your own submission
        </p>
      )}
    </div>
  );
};
