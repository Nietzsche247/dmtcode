import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RoleState {
  loading: boolean;
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
  isModerator: boolean;
}

export const useRoles = (): RoleState => {
  const [state, setState] = useState<RoleState>({
    loading: true,
    userId: null,
    email: null,
    isAdmin: false,
    isModerator: false,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user) {
        if (!cancelled) {
          setState({ loading: false, userId: null, email: null, isAdmin: false, isModerator: false });
        }
        return;
      }
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (cancelled) return;
      const list = (roles ?? []).map((r) => r.role as string);
      setState({
        loading: false,
        userId: user.id,
        email: user.email ?? null,
        isAdmin: list.includes('admin'),
        isModerator: list.includes('moderator'),
      });
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return state;
};
