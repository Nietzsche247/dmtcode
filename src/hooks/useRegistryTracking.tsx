declare global {
  interface Window {
    posthog?: any;
  }
}

export const useRegistryTracking = () => {
  const trackRegistryFiltered = (filters: Record<string, string | string[]>) => {
    window.posthog?.capture('registry_filtered', { filters });
  };

  const trackSymbolDetailViewed = (symbolId: string, source: 'submission' | 'registry') => {
    window.posthog?.capture('symbol_detail_viewed', { symbol_id: symbolId, source });
  };

  const trackRegistrySearched = (query: string, resultsCount: number) => {
    window.posthog?.capture('registry_searched', { query, results_count: resultsCount });
  };

  return {
    trackRegistryFiltered,
    trackSymbolDetailViewed,
    trackRegistrySearched,
  };
};
