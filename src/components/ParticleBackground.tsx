import { useEffect, useState } from 'react';
import { useModeStore } from '@/stores/modeStore';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  tx: number;
  ty: number;
}

export const ParticleBackground = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const { mode } = useModeStore();

  useEffect(() => {
    // Ambient particle field disabled globally — atlas aesthetic favors
    // still, editorial surfaces. Keep hook wiring intact for future use.
    setParticles([]);
  }, [mode]);

  // Never render ambient particles/glow — replaced by warm paper/void surfaces.
  return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-primary"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animation: `particle-float ${particle.duration}s linear ${particle.delay}s infinite`,
            '--tx': `${particle.tx}px`,
            '--ty': `${particle.ty}px`,
            filter: 'blur(1px)',
            opacity: 0.6,
          } as React.CSSProperties}
        />
      ))}
      
      {/* Ambient glow spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
    </div>
  );
};
