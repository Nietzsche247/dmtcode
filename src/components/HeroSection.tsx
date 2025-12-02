import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HeroSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger animations after mount
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Subtle animated background particles */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${15 + Math.random() * 20}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
        
        {/* Subtle laser beam lines */}
        <div 
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          style={{ top: '35%' }}
        />
        <div 
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"
          style={{ top: '65%' }}
        />
      </div>

      {/* Radial gradient overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background"
        aria-hidden="true"
      />

      {/* Hero content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto space-y-8 py-20">
        {/* Eyebrow text */}
        <div 
          className={`flex items-center justify-center gap-2 text-muted-foreground text-sm font-medium tracking-wide uppercase opacity-0 ${isLoaded ? 'animate-blur-in-up' : ''}`}
          style={{ animationFillMode: 'forwards' }}
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Community Research Archive</span>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>

        {/* Main headline - Ultra bold */}
        <h1 
          className={`text-5xl sm:text-6xl md:text-7xl lg:text-[100px] font-black tracking-tight leading-[0.95] text-foreground opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-100' : ''}`}
          style={{ animationFillMode: 'forwards' }}
        >
          DMT Code
          <span className="block text-primary">Visual Catalogue</span>
        </h1>

        {/* Light secondary text */}
        <p 
          className={`text-lg md:text-xl lg:text-2xl font-light text-muted-foreground max-w-3xl mx-auto leading-relaxed opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-200' : ''}`}
          style={{ animationFillMode: 'forwards' }}
        >
          An open, community-maintained catalogue of discrete visual symbols 
          reported during 650 nm laser exposure and N,N-DMT experiences.
        </p>

        {/* Stats row */}
        <div 
          className={`flex flex-wrap justify-center gap-8 md:gap-12 py-4 opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-300' : ''}`}
          style={{ animationFillMode: 'forwards' }}
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground">3,000+</div>
            <div className="text-sm text-muted-foreground font-light">Documented Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground">87%</div>
            <div className="text-sm text-muted-foreground font-light">Inter-Subject Consistency</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary">52+</div>
            <div className="text-sm text-muted-foreground font-light">Catalogued Symbols</div>
          </div>
        </div>

        {/* CTA buttons */}
        <div 
          className={`flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-400' : ''}`}
          style={{ animationFillMode: 'forwards' }}
        >
          {/* Primary CTA with border beam */}
          <Button 
            size="lg" 
            className="text-base md:text-lg px-8 py-6 h-auto rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold btn-lickable border-beam group"
            onClick={() => navigate('/registry')}
            aria-label="Browse the visual symbol registry"
          >
            Browse Registry
            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
          
          {/* Secondary CTA */}
          <Button 
            size="lg" 
            variant="secondary"
            className="text-base md:text-lg px-8 py-6 h-auto rounded-full bg-secondary/50 hover:bg-secondary text-foreground font-medium btn-lickable"
            onClick={() => scrollToSection('explainer')}
            aria-label="Learn about the research methodology"
          >
            How It Works
          </Button>
        </div>

        {/* Tertiary link */}
        <div 
          className={`pt-2 opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-500' : ''}`}
          style={{ animationFillMode: 'forwards' }}
        >
          <button 
            onClick={() => navigate('/tools')}
            className="text-sm text-muted-foreground hover:text-primary transition-colors font-light inline-flex items-center gap-1"
          >
            View research equipment
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Social proof marquee */}
      <div 
        className={`absolute bottom-24 left-0 right-0 overflow-hidden marquee-mask opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-600' : ''}`}
        style={{ animationFillMode: 'forwards' }}
      >
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, setIndex) => (
            <div key={setIndex} className="flex items-center gap-12 px-6">
              <span className="text-muted-foreground/40 text-sm font-light">Goler 2025 Protocol</span>
              <span className="text-primary/30">•</span>
              <span className="text-muted-foreground/40 text-sm font-light">Davis et al. 2021</span>
              <span className="text-primary/30">•</span>
              <span className="text-muted-foreground/40 text-sm font-light">Timmermann 2019</span>
              <span className="text-primary/30">•</span>
              <span className="text-muted-foreground/40 text-sm font-light">Strassman 2001</span>
              <span className="text-primary/30">•</span>
              <span className="text-muted-foreground/40 text-sm font-light">CC-BY-4.0 Licensed</span>
              <span className="text-primary/30">•</span>
              <span className="text-muted-foreground/40 text-sm font-light">Open Research Data</span>
              <span className="text-primary/30">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <button 
        onClick={() => scrollToSection('explainer')} 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer bg-transparent border-none opacity-50 hover:opacity-100 transition-opacity" 
        aria-label="Scroll to content"
      >
        <ChevronDown className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
      </button>
    </section>
  );
};
