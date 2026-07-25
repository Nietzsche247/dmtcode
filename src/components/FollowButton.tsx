import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type FollowEntityType = 'article' | 'theory' | 'protocol' | 'retreat' | 'event';

interface FollowButtonProps {
  entityType: FollowEntityType;
  entityId: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}

export const FollowButton = ({ entityType, entityId, className, size = 'sm' }: FollowButtonProps) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user || !entityId) {
        setUserId(null);
        setReady(false);
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .maybeSingle();

      if (cancelled) return;
      setFollowing(!!data);
      setReady(true);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  if (!userId || !ready) return null;

  const toggle = async () => {
    const previous = following;
    setFollowing(!previous);

    if (previous) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('user_id', userId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);
      if (error) {
        setFollowing(previous);
        toast.error('Could not unfollow');
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ user_id: userId, entity_type: entityType, entity_id: entityId });
      if (error) {
        setFollowing(previous);
        toast.error('Could not follow');
      }
    }
  };

  return (
    <Button
      type="button"
      variant={following ? 'secondary' : 'outline'}
      size={size}
      className={className}
      onClick={toggle}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  );
};

export default FollowButton;
