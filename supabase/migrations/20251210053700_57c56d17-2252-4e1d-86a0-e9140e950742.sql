-- Add IP address and user agent columns to api_access_log
ALTER TABLE public.api_access_log
ADD COLUMN ip_address TEXT,
ADD COLUMN user_agent TEXT;