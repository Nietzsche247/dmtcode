import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StreakState {
  streak: number;
  freezeActive: boolean;
  lastActivity: string | null;
  reviewedToday: boolean;
  loading: boolean;
}

export const useReviewStreak = (userId?: string | null) => {
  const [state, setState] = useState<StreakState>({
    streak: 0,
    freezeActive: false,
    lastActivity: null,
    reviewedToday: false,
    loading: true,
  });

  const load = useCallback(async () => {
    if (!userId) {
      setState({ streak: 0, freezeActive: false, lastActivity: null, reviewedToday: false, loading: false });
      return;
    }
    const { data, error } = await (supabase as any).rpc('get_review_streak', { _user_id: userId });
    if (error || !data || data.length === 0) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const row = data[0];
    const today = new Date().toISOString().slice(0, 10);
    setState({
      streak: row.streak ?? 0,
      freezeActive: !!row.freeze_active,
      lastActivity: row.last_activity ?? null,
      reviewedToday: row.last_activity === today,
      loading: false,
    });
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener('review-activity-logged', handler);
    return () => window.removeEventListener('review-activity-logged', handler);
  }, [load]);

  return { ...state, refresh: load };
};
