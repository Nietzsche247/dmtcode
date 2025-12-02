import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

export const HeroSection = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Laser grid background effect */}
      <div className="absolute inset-0 opacity-20" aria-hidden="true">
        <div className="absolute inset-0" style={{
        backgroundImage: `
            linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
          `,
        backgroundSize: '60px 60px',
        animation: 'grid-pulse 4s ease-in-out infinite'
      }} />
      </div>

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