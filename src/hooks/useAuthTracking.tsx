import { useCallback } from 'react';

declare global {
  interface Window {
    posthog?: any;
  }
}

export type AuthProvider = 'google' | 'github' | 'email';

export const useAuthTracking = () => {
  const trackSignup = useCallback((provider: AuthProvider) => {
    if (window.posthog) {
      window.posthog.capture('user_signup', {
        provider,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const trackLogin = useCallback((provider: AuthProvider) => {
    if (window.posthog) {
      window.posthog.capture('user_login', {
        provider,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const trackLogout = useCallback(() => {
    if (window.posthog) {
      window.posthog.capture('user_logout', {
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  return {
    trackSignup,
    trackLogin,
    trackLogout,
  };
};