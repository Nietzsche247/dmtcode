import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AvatarGlyph } from '@/components/AvatarGlyph';
import { createElement } from 'react';

/**
 * Watches for the "showAvatarToast" flag set by the Auth page after a fresh
 * sign-in, then shows a one-time toast introducing the user's assigned avatar.
 * The real identity is never displayed.
 */
export const AvatarToastListener = () => {
  useEffect(() => {
    const flag = sessionStorage.getItem('showAvatarToast');
    if (!flag) return;
    sessionStorage.removeItem('showAvatarToast');

    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('handle, avatar_seed')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled || !profile) return;

      toast(
        createElement(
          'div',
          { className: 'flex items-center gap-3' },
          createElement(AvatarGlyph, { seed: profile.avatar_seed, handle: profile.handle, size: 44 }),
          createElement(
            'div',
            { className: 'flex flex-col' },
            createElement('span', { className: 'font-medium text-sm' }, `You are ${profile.handle}.`),
            createElement(
              'span',
              { className: 'text-xs text-muted-foreground' },
              'This is your avatar. Your real name stays private. From here, we look together.'
            )
          )
        ),
        { duration: 8000 }
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
};
