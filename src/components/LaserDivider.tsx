import { useModeStore } from '@/stores/modeStore';

interface LaserDividerProps {
  className?: string;
}

export const LaserDivider = ({ className = '' }: LaserDividerProps) => {
  const { mode } = useModeStore();
  
  // Only show in Research Mode
  if (mode !== 'research') return null;
  
  return (
    <div className={`relative py-8 ${className}`}>
      {/* Main laser line */}
      <div className="relative h-[2px] mx-auto max-w-4xl">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/30 blur-sm" />
        {/* Core line */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent" />
        {/* Bright center */}
        <div className="absolute left-1/2 -translate-x-1/2 w-32 h-full bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.6)]" />
      </div>
      
      {/* Subtle reflection */}
      <div className="absolute bottom-6 left-0 right-0 h-[1px] mx-auto max-w-4xl opacity-20">
        <div className="h-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>
    </div>
  );
};
