-- Create admin_notifications table for tracking alerts
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  symbol_id UUID,
  message TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view notifications
CREATE POLICY "Only admins can view notifications"
ON public.admin_notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can mark as read
CREATE POLICY "Only admins can update notifications"
ON public.admin_notifications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_is_read ON public.admin_notifications(is_read);