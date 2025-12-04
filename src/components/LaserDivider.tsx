import { useModeStore } from '@/stores/modeStore';

interface LaserDividerProps {
  className?: string;
  forceShow?: boolean;
}

export const LaserDivider = ({ className = '', forceShow = false }: LaserDividerProps) => {
  const { mode } = useModeStore();
  
  // Only show in Research Mode unless forceShow is true
  if (!forceShow && mode !== 'research') return null;
  
  return (
    <div className={`relative py-8 ${className}`} role="separator" aria-hidden="true">
      {/* Main laser line with animation */}
      <div className="relative h-[2px] mx-auto max-w-4xl overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/30 blur-sm" />
        {/* Core line */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent" />
        {/* Bright center with pulse */}
        <div className="absolute left-1/2 -translate-x-1/2 w-32 h-full bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.6)] animate-pulse" style={{ animationDuration: '3s' }} />
        {/* Scanning beam effect */}
        <div 
          className="absolute top-0 w-16 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
          style={{
            animation: 'scan 4s ease-in-out infinite',
          }}
        />
      </div>
      
      {/* Subtle reflection */}
      <div className="absolute bottom-6 left-0 right-0 h-[1px] mx-auto max-w-4xl opacity-20">
        <div className="h-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { left: -10%; }
          50% { left: 100%; }
        }
      `}</style>
    </div>
  );
};
