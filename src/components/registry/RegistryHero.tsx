import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus, Eye } from 'lucide-react';

export const RegistryHero = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToSubmit = () => {
    document.getElementById('submit')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToNullReport = () => {
    window.location.href = '/registry?null=true#submit';
  };

  const scrollToBrowse = () => {
    document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="container mx-auto px-4 py-24 md:py-32 text-center">
      {/* Eyebrow */}
      <p 
        className={`text-primary text-sm font-medium tracking-wide uppercase mb-6 opacity-0 ${isLoaded ? 'animate-blur-in-up' : ''}`}
        style={{ animationFillMode: 'forwards' }}
      >
        Community Research Archive
      </p>

      {/* Main headline */}
      <h1 
        className={`text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-100' : ''}`}
        style={{ animationFillMode: 'forwards' }}
      >
        DMT Code
        <span className="block text-primary">Glyph Registry</span>
      </h1>
      
      {/* Description */}
      <p 
        className={`text-lg md:text-xl text-muted-foreground font-light max-w-3xl mx-auto mb-12 leading-relaxed opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-200' : ''}`}
        style={{ animationFillMode: 'forwards' }}
      >
        An open, community-maintained catalogue of discrete 100 × 100 px visual symbols reported during 650 nm laser exposure and N,N-DMT experiences.
      </p>

      {/* CTA buttons */}
      <div 
        className={`flex flex-col sm:flex-row gap-4 justify-center opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-300' : ''}`}
        style={{ animationFillMode: 'forwards' }}
      >
        <Button 
          onClick={scrollToSubmit}
          size="lg"
          className="text-base px-8 py-6 h-auto rounded-full btn-lickable border-beam group"
        >
          <Plus className="w-5 h-5 mr-2" />
          Submit a Symbol
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
        <Button 
          onClick={scrollToNullReport}
          variant="secondary"
          size="lg"
          className="text-base px-8 py-6 h-auto rounded-full bg-secondary/50 hover:bg-secondary btn-lickable"
        >
          <Eye className="w-5 h-5 mr-2" />
          I Saw Nothing
        </Button>
        <Button 
          onClick={scrollToBrowse}
          variant="outline"
          size="lg"
          className="text-base px-8 py-6 h-auto rounded-full btn-lickable"
        >
          Browse the Registry
        </Button>
      </div>
      
      {/* Helper text */}
      <p 
        className={`text-sm text-muted-foreground mt-8 max-w-2xl mx-auto opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-400' : ''}`}
        style={{ animationFillMode: 'forwards' }}
      >
        Null reports establish valuable baseline data for comparison
      </p>
    </section>
  );
};
