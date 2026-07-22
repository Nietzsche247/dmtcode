import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    posthog?: any;
  }
}

type VoteType = 'upvote' | 'downvote' | 'seen_it';

interface VoteCounts {
  upvotes: number;
  downvotes: number;
  seenItCount: number;
}

interface UserVotes {
  hasUpvoted: boolean;
  hasDownvoted: boolean;
  hasSeenIt: boolean;
}

export const useSymbolVoting = (symbolId: string, submitterId?: string) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<UserVotes>({
    hasUpvoted: false,
    hasDownvoted: false,
    hasSeenIt: false,
  });
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({
    upvotes: 0,
    downvotes: 0,
    seenItCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isOwnSubmission, setIsOwnSubmission] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (symbolId) {
      loadVoteCounts();
      if (userId) {
        loadUserVotes();
        setIsOwnSubmission(userId === submitterId);
      }
    }
  }, [symbolId, userId, submitterId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
  };

  // Engagement-only: never touches symbol_votes or convergence counts.
  const logReviewActivity = useCallback(async (source: string) => {
    if (!userId) return;
    try {
      await (supabase as any)
        .from('review_activity')
        .upsert(
          { user_id: userId, source },
          { onConflict: 'user_id,activity_date', ignoreDuplicates: true }
        );
      window.dispatchEvent(new CustomEvent('review-activity-logged'));
    } catch (e) {
      // Non-blocking. Streak is a nice-to-have; never fail the vote.
      console.warn('review_activity log failed', e);
    }
  }, [userId]);

  const loadVoteCounts = async () => {
    const { data, error } = await supabase
      .from('symbol_votes')
      .select('vote_type')
      .eq('symbol_id', symbolId);

    if (!error && data) {
      setVoteCounts({
        upvotes: data.filter(v => v.vote_type === 'upvote').length,
        downvotes: data.filter(v => v.vote_type === 'downvote').length,
        seenItCount: data.filter(v => v.vote_type === 'seen_it').length,
      });
    }
  };

  const loadUserVotes = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('symbol_votes')
      .select('vote_type')
      .eq('symbol_id', symbolId)
      .eq('user_id', userId);

    if (!error && data) {
      setUserVotes({
        hasUpvoted: data.some(v => v.vote_type === 'upvote'),
        hasDownvoted: data.some(v => v.vote_type === 'downvote'),
        hasSeenIt: data.some(v => v.vote_type === 'seen_it'),
      });
    }
  };

  const vote = useCallback(async (voteType: VoteType) => {
    if (!userId) {
      toast.error('Please log in to vote');
      return false;
    }

    if (isOwnSubmission) {
      toast.error('You cannot vote on your own submission');
      return false;
    }

    setLoading(true);

    try {
      const currentVote = 
        voteType === 'upvote' ? userVotes.hasUpvoted :
        voteType === 'downvote' ? userVotes.hasDownvoted :
        userVotes.hasSeenIt;

      if (currentVote) {
        // Remove the vote
        const { error } = await supabase
          .from('symbol_votes')
          .delete()
          .eq('symbol_id', symbolId)
          .eq('user_id', userId)
          .eq('vote_type', voteType);

        if (error) throw error;

        window.posthog?.capture('vote_removed', { 
          symbol_id: symbolId, 
          vote_type: voteType 
        });
        
        toast.success('Vote removed');
      } else {
        // For upvote/downvote, they are mutually exclusive
        if (voteType === 'upvote' || voteType === 'downvote') {
          const oppositeType = voteType === 'upvote' ? 'downvote' : 'upvote';
          const hasOpposite = voteType === 'upvote' ? userVotes.hasDownvoted : userVotes.hasUpvoted;
          
          if (hasOpposite) {
            // Remove opposite vote first
            await supabase
              .from('symbol_votes')
              .delete()
              .eq('symbol_id', symbolId)
              .eq('user_id', userId)
              .eq('vote_type', oppositeType);
          }
        }

        // Insert new vote
        const { error } = await supabase
          .from('symbol_votes')
          .insert({
            symbol_id: symbolId,
            user_id: userId,
            vote_type: voteType,
          });

        if (error) throw error;

        const eventName = 
          voteType === 'upvote' ? 'symbol_upvoted' :
          voteType === 'downvote' ? 'symbol_downvoted' :
          'symbol_validated';

        window.posthog?.capture(eventName, { symbol_id: symbolId });
        
        toast.success(
          voteType === 'seen_it' ? 'Validation recorded' : 'Vote recorded'
        );
      }

      // Reload votes
      await Promise.all([loadVoteCounts(), loadUserVotes()]);
      return true;
    } catch (error) {
      console.error('Vote error:', error);
      toast.error('Failed to record vote');
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, symbolId, userVotes, isOwnSubmission]);

  return {
    userId,
    userVotes,
    voteCounts,
    loading,
    isOwnSubmission,
    vote,
    upvote: () => vote('upvote'),
    downvote: () => vote('downvote'),
    seenIt: () => vote('seen_it'),
  };
};
