import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Global listener: whenever the signed-in member earns a new badge
 * (inserted into user_badges), show a brief, tasteful acknowledgment.
 * Uses the existing sonner toast infrastructure. No confetti, no praise.
 */
export const BadgeToastListener = () => {
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      channel = supabase
        .channel(`user_badges:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_badges',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            const badgeName = (payload.new as { badge_name?: string })?.badge_name;
            if (!badgeName) return;
            const { data: badge } = await supabase
              .from('badges')
              .select('name, description, icon')
              .eq('name', badgeName)
              .maybeSingle();
            const label = badgeName
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase());
            toast.success(`${badge?.icon ?? '✶'}  ${label}`, {
              description: badge?.description ?? 'A new badge was recorded on your profile.',
              duration: 6000,
            });
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return null;
};
