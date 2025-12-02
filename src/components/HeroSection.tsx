import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import heroLaserWall from '@/assets/hero-laser-wall.jpg';

export const HeroSection = () => {
  const [isAnimated, setIsAnimated] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('dmtcode-hero-visited');
    if (!hasVisited) {
      setShowAnimation(true);
      localStorage.setItem('dmtcode-hero-visited', 'true');
      // After animation completes, mark as animated
      const timer = setTimeout(() => {
        setIsAnimated(true);
      }, 8000);
      return () => clearTimeout(timer);
    } else {
      setIsAnimated(true);
    }
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background image with laser line */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroLaserWall})`,
          backgroundPosition: 'center 45%',
        }}
        aria-hidden="true"
      >
        {/* Laser line reveal animation overlay */}
        {showAnimation && !isAnimated && (
          <div 
            className="absolute inset-0 bg-background animate-laser-reveal"
            style={{
              transformOrigin: 'right center',
            }}
          />
        )}
      </div>

      {/* Secondary faint laser line (30% opacity) */}
      <div 
        className="absolute left-0 right-0 h-[3px] opacity-30"
        style={{
          top: 'calc(45% + 80px)',
          background: 'linear-gradient(90deg, transparent 0%, hsl(0, 85%, 50%) 10%, hsl(0, 85%, 50%) 90%, transparent 100%)',
          filter: 'blur(1px)',
        }}
        aria-hidden="true"
      />

      {/* Grain texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* Vignette overlay (5%) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.15) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Dark overlay for text readability */}
      <div 
        className="absolute inset-0 bg-background/60 pointer-events-none"
        aria-hidden="true"
      />

      {/* Hero content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto space-y-8 py-20">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-helvetica font-bold tracking-tight glow-text leading-tight">
          DMT Code Visual Symbol Catalogue
        </h1>
        <p className="text-xl md:text-2xl text-gold font-semibold leading-relaxed max-w-4xl mx-auto font-helvetica">
          An open, community-maintained catalogue of discrete visual symbols reported during 650 nm laser exposure and N,N-DMT experiences.
        </p>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4 font-garamond">
          Research archive for Danny Goler's 650 nm coherent light protocol: 3,000+ documented observations with 87% inter-subject consistency in reported discrete visual symbols.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 glow-button bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" 
            onClick={() => scrollToSection('shop')}
            aria-label="View research equipment catalogue"
          >
            View Equipment Catalogue
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-6 border-primary/50 text-foreground hover:bg-primary/10 hover:border-primary" 
            onClick={() => scrollToSection('explainer')}
            aria-label="Learn more about the 650nm protocol"
          >
            Learn More
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <button 
        onClick={() => scrollToSection('explainer')} 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer bg-transparent border-none" 
        aria-label="Scroll to content"
      >
        <ChevronDown className="w-8 h-8 text-primary" aria-hidden="true" />
      </button>
    </section>
  );
};
