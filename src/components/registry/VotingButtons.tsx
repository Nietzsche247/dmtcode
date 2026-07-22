import { ChevronUp, ChevronDown, Eye, Ban, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSymbolVoting } from '@/hooks/useSymbolVoting';
import { useUgcTracking } from '@/hooks/useUgcTracking';
import { toast } from 'sonner';

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
    markReviewed,
  } = useSymbolVoting(symbolId, submitterId);
  
  const { trackSelfVoteAttempted } = useUgcTracking();

  // Handle self-vote attempt with feedback
  const handleSelfVoteAttempt = (voteType: 'upvote' | 'downvote' | 'seen_it') => {
    trackSelfVoteAttempted({ symbol_id: symbolId, vote_type: voteType });
    toast.error("Can't vote on your own submission", {
      description: "Community validation requires votes from other users.",
      icon: <Ban className="h-4 w-4" />,
    });
  };

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
          onClick={isOwnSubmission ? () => handleSelfVoteAttempt('upvote') : upvote}
          isActive={userVotes.hasUpvoted}
          disabled={!userId}
          icon={ChevronUp}
          count={voteCounts.upvotes}
          label={isOwnSubmission ? "Can't vote on own submission" : "Upvote"}
          activeClass="text-green-500 bg-green-500/10"
        />
        <VoteButton
          onClick={isOwnSubmission ? () => handleSelfVoteAttempt('downvote') : downvote}
          isActive={userVotes.hasDownvoted}
          disabled={!userId}
          icon={ChevronDown}
          count={voteCounts.downvotes}
          label={isOwnSubmission ? "Can't vote on own submission" : "Downvote"}
          activeClass="text-red-500 bg-red-500/10"
        />
        <VoteButton
          onClick={isOwnSubmission ? () => handleSelfVoteAttempt('seen_it') : seenIt}
          isActive={userVotes.hasSeenIt}
          disabled={!userId}
          icon={Eye}
          count={voteCounts.seenItCount}
          label={isOwnSubmission ? "Can't vote on own submission" : "I've seen this too"}
          activeClass="text-primary bg-primary/10"
        />
        {userId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markReviewed}
            disabled={loading}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            aria-label="Mark reviewed, no opinion"
            title="Reviewed, no opinion"
          >
            <Check className="w-4 h-4" />
            <span className="text-xs">Reviewed</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={userVotes.hasUpvoted ? 'default' : 'outline'}
                  size="lg"
                  onClick={isOwnSubmission ? () => handleSelfVoteAttempt('upvote') : upvote}
                  disabled={!userId || loading}
                  className={cn(
                    'rounded-full w-14 h-14 p-0 transition-all duration-200',
                    userVotes.hasUpvoted && 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30',
                    !userId && 'opacity-50',
                    isOwnSubmission && 'opacity-60 cursor-not-allowed',
                    !isOwnSubmission && userId && 'hover:scale-110'
                  )}
                  aria-label={isOwnSubmission ? "Can't vote on own submission" : "Upvote symbol"}
                >
                  <ChevronUp className={cn(
                    'w-8 h-8',
                    userVotes.hasUpvoted && 'fill-current'
                  )} />
                </Button>
              </TooltipTrigger>
              {isOwnSubmission && (
                <TooltipContent>Can't vote on your own submission</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <span className="text-lg font-bold mt-1">{voteCounts.upvotes}</span>
          <span className="text-xs text-muted-foreground">upvotes</span>
        </div>

        <div className="flex flex-col items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={userVotes.hasDownvoted ? 'default' : 'outline'}
                  size="lg"
                  onClick={isOwnSubmission ? () => handleSelfVoteAttempt('downvote') : downvote}
                  disabled={!userId || loading}
                  className={cn(
                    'rounded-full w-14 h-14 p-0 transition-all duration-200',
                    userVotes.hasDownvoted && 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30',
                    !userId && 'opacity-50',
                    isOwnSubmission && 'opacity-60 cursor-not-allowed',
                    !isOwnSubmission && userId && 'hover:scale-110'
                  )}
                  aria-label={isOwnSubmission ? "Can't vote on own submission" : "Downvote symbol"}
                >
                  <ChevronDown className={cn(
                    'w-8 h-8',
                    userVotes.hasDownvoted && 'fill-current'
                  )} />
                </Button>
              </TooltipTrigger>
              {isOwnSubmission && (
                <TooltipContent>Can't vote on your own submission</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <span className="text-lg font-bold mt-1">{voteCounts.downvotes}</span>
          <span className="text-xs text-muted-foreground">downvotes</span>
        </div>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={userVotes.hasSeenIt ? 'default' : 'outline'}
              size="lg"
              onClick={isOwnSubmission ? () => handleSelfVoteAttempt('seen_it') : seenIt}
              disabled={!userId || loading}
              className={cn(
                'w-full transition-all duration-200',
                userVotes.hasSeenIt && 'bg-primary shadow-lg shadow-primary/30',
                !userId && 'opacity-50',
                isOwnSubmission && 'opacity-60 cursor-not-allowed',
                !isOwnSubmission && userId && 'hover:scale-[1.02]'
              )}
              aria-label={isOwnSubmission ? "Can't vote on own submission" : "Mark as I've seen this too"}
            >
              <Eye className={cn('w-5 h-5 mr-2', userVotes.hasSeenIt && 'fill-current')} />
              I've Seen This Too
              <span className="ml-2 bg-background/20 px-2 py-0.5 rounded-full text-sm">
                {voteCounts.seenItCount}
              </span>
            </Button>
          </TooltipTrigger>
          {isOwnSubmission && (
            <TooltipContent>Can't vote on your own submission</TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {userId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={markReviewed}
          disabled={loading}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          <Check className="w-4 h-4 mr-2" />
          Reviewed, no opinion
        </Button>
      )}


      {!userId && (
        <p className="text-xs text-muted-foreground text-center">
          <a href="/auth" className="text-primary hover:underline">Log in</a> to vote
        </p>
      )}

      {isOwnSubmission && (
        <div className="flex items-center justify-center gap-2 text-xs text-amber-500 bg-amber-500/10 px-3 py-2 rounded-md">
          <Ban className="h-3 w-3" />
          <span>You cannot vote on your own submission</span>
        </div>
      )}
    </div>
  );
};
