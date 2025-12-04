import { useModeStore } from '@/stores/modeStore';

export const GrainOverlay = () => {
  const { mode } = useModeStore();
  
  // Only show grain overlay in Explorer mode
  if (mode === 'research') {
    return null;
  }

  return (
    <div 
      className="grain-overlay"
      aria-hidden="true"
    />
  );
};
