import { useCallback } from 'react';

declare global {
  interface Window {
    posthog?: any;
  }
}

export type CanvasTool = 'pen' | 'eraser';

export const useCanvasTracking = () => {
  const trackToolSelected = useCallback((tool: CanvasTool, size?: number) => {
    if (window.posthog) {
      window.posthog.capture('canvas_tool_selected', {
        tool,
        size,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const trackSymmetryToggled = useCallback((enabled: boolean) => {
    if (window.posthog) {
      window.posthog.capture('symmetry_toggled', {
        state: enabled ? 'on' : 'off',
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const trackGridToggled = useCallback((enabled: boolean) => {
    if (window.posthog) {
      window.posthog.capture('grid_toggled', {
        state: enabled ? 'on' : 'off',
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const trackDrawingSaved = useCallback((hasSymmetry: boolean, hasGrid: boolean) => {
    if (window.posthog) {
      window.posthog.capture('drawing_saved', {
        symmetry_enabled: hasSymmetry,
        grid_enabled: hasGrid,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  return {
    trackToolSelected,
    trackSymmetryToggled,
    trackGridToggled,
    trackDrawingSaved,
  };
};