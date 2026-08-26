import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSessionId } from '@/lib/anonSession';

declare global {
  interface Window {
    posthog?: any;
  }
}

type VoteType = 'seen_it' | 'similar' | 'downvote';

const ALL_VOTE_TYPES: VoteType[] = ['seen_it', 'similar', 'downvote'];

interface VoteCounts {
  downvotes: number;
  seenItCount: number;
  similarCount: number;
}

interface UserVotes {
  hasDownvoted: boolean;
  hasSeenIt: boolean;
  hasSimilar: boolean;
}

export const useSymbolVoting = (symbolId: string, submitterId?: string) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<UserVotes>({
    hasDownvoted: false,
    hasSeenIt: false,
    hasSimilar: false,
  });
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({
    downvotes: 0,
    seenItCount: 0,
    similarCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isOwnSubmission, setIsOwnSubmission] = useState(false);

  // Stable anonymous device id for this hook instance.
  const sessionId = useMemo(() => getSessionId(), []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (symbolId) {
      loadVoteCounts();
      loadUserVotes();
      setIsOwnSubmission(!!userId && userId === submitterId);
    }
  }, [symbolId, userId, submitterId, sessionId]);

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
        downvotes: data.filter(v => v.vote_type === 'downvote').length,
        seenItCount: data.filter(v => v.vote_type === 'seen_it').length,
        similarCount: data.filter(v => (v.vote_type as string) === 'similar').length,
      });
    }
  };

  const loadUserVotes = async () => {
    let query = supabase
      .from('symbol_votes')
      .select('vote_type')
      .eq('symbol_id', symbolId);

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = (query as any).eq('session_id', sessionId).is('user_id', null);
    }

    const { data, error } = await query;

    if (!error && data) {
      setUserVotes({
        hasDownvoted: data.some(v => v.vote_type === 'downvote'),
        hasSeenIt: data.some(v => v.vote_type === 'seen_it'),
        hasSimilar: data.some(v => (v.vote_type as string) === 'similar'),
      });
    }
  };

  const vote = useCallback(async (voteType: VoteType) => {
    if (isOwnSubmission) {
      toast.error('You cannot vote on your own submission');
      return false;
    }

    const held = (t: VoteType) =>
      t === 'downvote' ? userVotes.hasDownvoted :
      t === 'seen_it' ? userVotes.hasSeenIt :
      userVotes.hasSimilar;

    const currentVote = held(voteType);

    // Anonymous visitors cannot delete: the DELETE policy is auth.uid() = user_id.
    if (!userId && currentVote) {
      toast.info('Recorded on this device already. Sign in if you want to change it.');
      return false;
    }

    setLoading(true);

    try {
      if (currentVote && userId) {
        // Remove the vote
        const { error } = await supabase
          .from('symbol_votes')
          .delete()
          .eq('symbol_id', symbolId)
          .eq('user_id', userId)
          .eq('vote_type', voteType as any);

        if (error) throw error;

        window.posthog?.capture('vote_removed', { 
          symbol_id: symbolId, 
          vote_type: voteType 
        });
        
        toast.success('Vote removed');
      } else {
        // Claim any recognition recorded anonymously on this device before
        // inserting, so one human is never counted twice.
        if (userId) {
          try {
            const { data: claimed, error: claimError } = await (supabase as any).rpc(
              'claim_anon_vote',
              { p_symbol_id: symbolId, p_session_id: sessionId },
            );
            if (!claimError && typeof claimed === 'number' && claimed > 0) {
              await Promise.all([loadVoteCounts(), loadUserVotes()]);
              return true;
            }
          } catch (e) {
            // Non-blocking: fall through to the normal insert path.
            console.warn('claim_anon_vote failed', e);
          }
        }

        // One stance per user per symbol: seen_it, similar and downvote are
        // fully mutually exclusive. Cleanup deletes require an authenticated user.
        if (userId) {

          const conflicting = ALL_VOTE_TYPES.filter((t) => t !== voteType && held(t));

          if (conflicting.length > 0) {
            await supabase
              .from('symbol_votes')
              .delete()
              .eq('symbol_id', symbolId)
              .eq('user_id', userId)
              .in('vote_type', conflicting as any);
          }
        }

        // Insert new vote. user_id must be explicitly null for anonymous rows,
        // because the RLS check compares it against auth.uid().
        const { error } = await supabase
          .from('symbol_votes')
          .insert({
            symbol_id: symbolId,
            user_id: userId ?? null,
            vote_type: voteType,
            session_id: sessionId,
          } as any);

        if (error) {
          // Unique violation: this stance is already recorded for this identity.
          if ((error as any).code === '23505') {
            setUserVotes((prev) => ({
              ...prev,
              hasDownvoted: voteType === 'downvote' ? true : prev.hasDownvoted,
              hasSeenIt: voteType === 'seen_it' ? true : prev.hasSeenIt,
              hasSimilar: voteType === 'similar' ? true : prev.hasSimilar,
            }));
            toast.info('Already recorded.');
            await loadVoteCounts();
            return true;
          }
          throw error;
        }

        const eventName = 
          voteType === 'downvote' ? 'symbol_downvoted' :
          voteType === 'similar' ? 'symbol_marked_similar' :
          'symbol_validated';

        window.posthog?.capture(eventName, { symbol_id: symbolId });
        
        toast.success(
          voteType === 'seen_it' ? 'Validation recorded' :
          voteType === 'similar' ? 'Recorded.' : 'Vote recorded'
        );

        // Log engagement activity (all stances count as a review).
        await logReviewActivity(voteType);
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
  }, [userId, sessionId, symbolId, userVotes, isOwnSubmission, logReviewActivity]);

  return {
    userId,
    userVotes,
    voteCounts,
    loading,
    isOwnSubmission,
    vote,
    downvote: () => vote('downvote'),
    seenIt: () => vote('seen_it'),
    similar: () => vote('similar'),
    // Records an honest "reviewed, no opinion" for the daily streak.
    markReviewed: () => logReviewActivity('reviewed_no_opinion'),
  };
};
