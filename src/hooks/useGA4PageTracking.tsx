import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const GA4_ID = "G-CWVKJBDG7L";

/**
 * Fires a GA4 page_view on every React Router navigation.
 * The initial gtag('config', ...) in index.html handles the first load;
 * this hook covers all subsequent SPA route changes.
 */
export const useGA4PageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    const path = location.pathname + location.search;
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
      send_to: GA4_ID,
    });
  }, [location.pathname, location.search]);
};
