import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  symbol_id: string;
  message: string;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('admin_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          toast.success('New Admin Alert!', {
            description: newNotif.type === 'first_non_red' 
              ? '🚨 First non-red wavelength submitted!' 
              : '⚪ New null report submitted',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">Loading notifications...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-primary/5 border-2 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gold" />
            <div>
              <h3 className="font-semibold">Admin Notifications</h3>
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              Mark All Read
            </Button>
          )}
        </div>
      </Card>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No notifications yet
          </Card>
        ) : (
          notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 transition-colors ${
                !notif.is_read ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {notif.type === 'first_non_red' ? (
                      <AlertCircle className="w-5 h-5 text-gold" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={notif.type === 'first_non_red' ? 'default' : 'outline'}>
                        {notif.type === 'first_non_red' ? '🚨 First Non-Red' : '⚪ Null Report'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-line">{notif.message}</p>
                    {notif.metadata && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {notif.metadata.wavelength && (
                          <Badge variant="outline" className="text-xs">
                            {notif.metadata.wavelength}
                          </Badge>
                        )}
                        {notif.metadata.surface && (
                          <Badge variant="outline" className="text-xs">
                            {notif.metadata.surface}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {!notif.is_read && (
                  <Button
                    onClick={() => markAsRead(notif.id)}
                    variant="ghost"
                    size="sm"
                  >
                    Mark Read
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
