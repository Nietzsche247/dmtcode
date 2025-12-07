import { useCallback } from 'react';

declare global {
  interface Window {
    posthog?: any;
  }
}

/**
 * Hook for tracking UGC flywheel events via PostHog
 */
export const useUgcTracking = () => {
  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture(eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
      });
    }
    console.log(`[UGC Track] ${eventName}`, properties);
  }, []);

  // Assessment events
  const trackAssessSubmitted = useCallback((data: {
    assessment_id: string;
    phq9_score: number;
    gad7_score: number;
    meq4_score?: number;
    ceq7_score?: number;
    mood_delta?: number;
  }) => {
    trackEvent('assess_submitted', data);
  }, [trackEvent]);

  const trackAssessViewed = useCallback(() => {
    trackEvent('assess_viewed');
  }, [trackEvent]);

  // Symbol/canvas events
  const trackSymbolDrawn = useCallback((data: {
    has_symmetry?: boolean;
    has_grid?: boolean;
    duration_seconds?: number;
  }) => {
    trackEvent('symbol_drawn', data);
  }, [trackEvent]);

  const trackSymbolSubmitted = useCallback((data: {
    submission_id: string;
    source_method?: string;
    tags?: string[];
    has_description: boolean;
  }) => {
    trackEvent('symbol_submitted', data);
  }, [trackEvent]);

  // Self-vote attempt (important for understanding user behavior)
  const trackSelfVoteAttempted = useCallback((data: {
    symbol_id: string;
    vote_type: 'upvote' | 'downvote' | 'seen_it';
  }) => {
    trackEvent('self_vote_attempted', data);
  }, [trackEvent]);

  // Dashboard events
  const trackDashboardTabViewed = useCallback((tab: string) => {
    trackEvent('dashboard_tab_viewed', { tab });
  }, [trackEvent]);

  // Registry detail events
  const trackSymbolDetailViewed = useCallback((symbolId: string) => {
    trackEvent('symbol_detail_viewed', { symbol_id: symbolId });
  }, [trackEvent]);

  return {
    trackEvent,
    trackAssessSubmitted,
    trackAssessViewed,
    trackSymbolDrawn,
    trackSymbolSubmitted,
    trackSelfVoteAttempted,
    trackDashboardTabViewed,
    trackSymbolDetailViewed,
  };
};
