import { useEffect, useCallback } from 'react';

declare global {
  interface Window {
    posthog?: any;
  }
}

interface ProductTrackingData {
  product_id?: string;
  product_title?: string;
  product_price?: number | string;
  product_category?: string;
  bundle_id?: string;
  bundle_name?: string;
}

export const usePostHogTracking = () => {
  const trackProductView = useCallback((data: ProductTrackingData) => {
    if (window.posthog) {
      window.posthog.capture('product_viewed', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const trackAddToCart = useCallback((data: ProductTrackingData & { quantity?: number }) => {
    if (window.posthog) {
      window.posthog.capture('added_to_cart', {
        ...data,
        quantity: data.quantity || 1,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const trackBundleUpsellShown = useCallback((data: { bundle_id: string; bundle_name: string; context: string }) => {
    if (window.posthog) {
      window.posthog.capture('bundle_upsell_shown', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const trackCheckoutStart = useCallback((data: { cart_value: number; item_count: number }) => {
    if (window.posthog) {
      window.posthog.capture('checkout_started', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const trackPageView = useCallback((pageName: string, additionalData?: Record<string, any>) => {
    if (window.posthog) {
      window.posthog.capture('$pageview', {
        page_name: pageName,
        ...additionalData,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  return {
    trackProductView,
    trackAddToCart,
    trackBundleUpsellShown,
    trackCheckoutStart,
    trackPageView,
  };
};

// Hook for automatic page view tracking
export const usePageTracking = (pageName: string, additionalData?: Record<string, any>) => {
  useEffect(() => {
    if (window.posthog) {
      window.posthog.capture('$pageview', {
        page_name: pageName,
        ...additionalData,
        timestamp: new Date().toISOString(),
      });
    }
  }, [pageName]);
};
