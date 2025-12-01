import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitResponse {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetIn: number;
  ip?: string;
}

export const useRateLimit = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitResponse | null>(null);

  const checkRateLimit = async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('rate-limit-check', {
        method: 'GET'
      });

      if (error) {
        console.error('Rate limit check failed:', error);
        // Fail open - allow submission if check fails
        return true;
      }

      const limitData = data as RateLimitResponse;
      setRateLimitInfo(limitData);

      if (!limitData.allowed) {
        const minutes = Math.ceil(limitData.resetIn / 60);
        throw new Error(
          `Rate limit exceeded. You can submit ${limitData.limit} symbols per minute. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`
        );
      }

      return limitData.allowed;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      // Fail open for network errors
      return true;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkRateLimit,
    isChecking,
    rateLimitInfo
  };
};
