import { useCallback, useRef, useState } from "react";

interface PinchZoomState {
  zoom: number;
  isPinching: boolean;
}

interface PinchZoomConfig {
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  initialZoom?: number;
}

interface PinchZoomHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

interface UsePinchZoomReturn extends PinchZoomState {
  handlers: PinchZoomHandlers;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetZoom: () => void;
}

export function usePinchZoom(config: PinchZoomConfig = {}): UsePinchZoomReturn {
  const {
    minZoom = 0.8,
    maxZoom = 3,
    zoomStep = 0.25,
    initialZoom = 1
  } = config;

  const [zoom, setZoom] = useState(initialZoom);
  const [isPinching, setIsPinching] = useState(false);
  
  // Track initial pinch distance
  const initialPinchDistance = useRef<number | null>(null);
  const initialZoomRef = useRef(zoom);

  // Calculate distance between two touch points
  const getDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsPinching(true);
      initialPinchDistance.current = getDistance(e.touches);
      initialZoomRef.current = zoom;
    }
  }, [zoom]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPinching || e.touches.length !== 2 || initialPinchDistance.current === null) return;
    
    e.preventDefault();
    const currentDistance = getDistance(e.touches);
    const scale = currentDistance / initialPinchDistance.current;
    const newZoom = Math.min(maxZoom, Math.max(minZoom, initialZoomRef.current * scale));
    setZoom(newZoom);
  }, [isPinching, minZoom, maxZoom]);

  const onTouchEnd = useCallback(() => {
    if (isPinching) {
      setIsPinching(false);
      initialPinchDistance.current = null;
    }
  }, [isPinching]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(maxZoom, prev + zoomStep));
  }, [maxZoom, zoomStep]);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(minZoom, prev - zoomStep));
  }, [minZoom, zoomStep]);

  const handleResetZoom = useCallback(() => {
    setZoom(initialZoom);
  }, [initialZoom]);

  return {
    zoom,
    isPinching,
    setZoom,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    },
    handleZoomIn,
    handleZoomOut,
    handleResetZoom
  };
}
