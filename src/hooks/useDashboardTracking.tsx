declare global {
  interface Window {
    posthog?: any;
  }
}

export const useDashboardTracking = () => {
  const trackDashboardViewed = () => {
    window.posthog?.capture('dashboard_viewed');
  };

  const trackTabSwitched = (tab: string) => {
    window.posthog?.capture('tab_switched', { tab });
  };

  const trackSymbolSaved = (symbolId: string) => {
    window.posthog?.capture('symbol_saved', { symbol_id: symbolId });
  };

  const trackSymbolUnsaved = (symbolId: string) => {
    window.posthog?.capture('symbol_unsaved', { symbol_id: symbolId });
  };

  const trackProfileUpdated = (field: string) => {
    window.posthog?.capture('profile_updated', { field });
  };

  return {
    trackDashboardViewed,
    trackTabSwitched,
    trackSymbolSaved,
    trackSymbolUnsaved,
    trackProfileUpdated,
  };
};