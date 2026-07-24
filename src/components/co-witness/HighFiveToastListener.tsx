import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Listens for incoming co-witness high-fives to the signed-in user and
 * surfaces a quiet acknowledgment toast with a link back to the symbol.
 */
export const HighFiveToastListener = () => {
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      channel = supabase
        .channel(`cw_high_fives:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'co_witness_high_fives',
            filter: `to_user=eq.${user.id}`,
          },
          async (payload) => {
            const row = payload.new as { from_user?: string; symbol_id?: string };
            if (!row?.from_user || !row?.symbol_id) return;
            const { data: prof } = await (supabase as any)
              .from('profiles')
              .select('handle')
              .eq('id', row.from_user)
              .maybeSingle();
            const handle = prof?.handle || 'anon';
            toast(`@${handle} believes you.`, {
              description: 'Open the symbol they recognized.',
              duration: 8000,
              action: {
                label: 'View',
                onClick: () => {
                  window.location.href = `/registry/${row.symbol_id}`;
                },
              },
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
