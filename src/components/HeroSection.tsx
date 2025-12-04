import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HeroSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-32 overflow-hidden">
      {/* Unicorn Studio remix background - subtle laser beams/noodles */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Floating particles */}
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${15 + Math.random() * 20}s linear infinite`,
              animationDelay: `${Math.random() * 8}s`,
            }}
          />
        ))}
        
        {/* Noodle beam lines connecting to circles */}
        <div 
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          style={{ top: '25%' }}
        />
        <div 
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"
          style={{ top: '45%' }}
        />
        <div 
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/15 to-transparent"
          style={{ top: '75%' }}
        />
        
        {/* Sonar circle details */}
        <div 
          className="absolute w-64 h-64 rounded-full border border-primary/10"
          style={{ right: '-5%', top: '20%', animation: 'sonar-pulse 4s ease-out infinite' }}
        />
        <div 
          className="absolute w-48 h-48 rounded-full border border-primary/5"
          style={{ left: '-3%', bottom: '30%', animation: 'sonar-pulse 5s ease-out infinite 1s' }}
        />
      </div>

      {/* Radial gradient overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-background via-background/98 to-background"
        aria-hidden="true"
      />

      {/* Hero content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto space-y-8 py-24">
        {/* Eyebrow text - Montserrat Light Italic */}
        <div 
          className={`flex items-center justify-center gap-3 opacity-0 ${isLoaded ? 'animate-blur-in-up' : ''}`}
          style={{ animationFillMode: 'forwards' }}
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-montserrat font-light italic text-muted-foreground text-lg md:text-xl tracking-wide">Open-source glyph research archive</span>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>

        {/* Main headline - Montserrat Bold, uppercase */}
        <h1 
          className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[96px] font-bold uppercase tracking-[0.02em] leading-[0.9] text-foreground opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-100' : ''}`}
          style={{ animationFillMode: 'forwards', fontFamily: "'Montserrat', system-ui, sans-serif" }}
        >
          DMT Code
          <span className="block text-primary mt-2">Visual Catalogue</span>
        </h1>

        {/* Subheadline - Inter Light 300, muted, airy flow */}
        <p 
          className={`text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-200' : ''}`}
          style={{ animationFillMode: 'forwards', fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 300 }}
        >
          Documenting visual symbols from 3,000+ sessions using the 650 nm laser protocol.
          Community-curated. Peer-reviewed metadata. CC-BY-4.0 licensed.
        </p>

        {/* Stats row */}
        <div 
          className={`flex flex-wrap justify-center gap-10 md:gap-16 py-8 opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-300' : ''}`}
          style={{ animationFillMode: 'forwards' }}
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground uppercase" style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}>3,000+</div>
            <div className="text-xs text-muted-foreground font-normal tracking-wider uppercase mt-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground uppercase" style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}>87%</div>
            <div className="text-xs text-muted-foreground font-normal tracking-wider uppercase mt-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Consistency</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary uppercase" style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}>52+</div>
            <div className="text-xs text-muted-foreground font-normal tracking-wider uppercase mt-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Symbols</div>
          </div>
        </div>

        {/* CTA buttons */}
        <div 
          className={`flex flex-col sm:flex-row gap-5 justify-center items-center pt-4 opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-400' : ''}`}
          style={{ animationFillMode: 'forwards' }}
        >
          {/* Primary CTA - Pill with border beam */}
          <Button 
            size="lg" 
            className="text-base md:text-lg px-10 py-7 h-auto rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold btn-lickable border-beam group"
            onClick={() => navigate('/registry')}
            aria-label="Browse the visual symbol registry"
          >
            Browse Registry
            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
          
          {/* Secondary CTA - Outlined red */}
          <Button 
            size="lg" 
            variant="outline"
            className="text-base md:text-lg px-10 py-7 h-auto rounded-full border-primary/50 hover:border-primary hover:bg-primary/5 text-foreground font-medium btn-lickable"
            onClick={() => scrollToSection('explainer')}
            aria-label="Learn about the research methodology"
          >
            Learn More
          </Button>
        </div>

        {/* Tertiary link */}
        <div 
          className={`pt-6 opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-500' : ''}`}
          style={{ animationFillMode: 'forwards' }}
        >
          <button 
            onClick={() => navigate('/tools')}
            className="text-sm text-muted-foreground hover:text-primary transition-colors font-light inline-flex items-center gap-2 group"
          >
            View equipment catalogue
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Social proof marquee - infinite loop with alpha mask */}
      <div 
        className={`absolute bottom-28 left-0 right-0 overflow-hidden marquee-mask opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-600' : ''}`}
        style={{ animationFillMode: 'forwards' }}
      >
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(4)].map((_, setIndex) => (
            <div key={setIndex} className="flex items-center gap-12 px-6">
              <span className="text-muted-foreground/60 text-sm" style={{ fontWeight: 300 }}>Goler 2025</span>
              <span className="text-primary/40">◆</span>
              <span className="text-muted-foreground/60 text-sm" style={{ fontWeight: 300 }}>Gallimore</span>
              <span className="text-primary/40">◆</span>
              <span className="text-muted-foreground/60 text-sm" style={{ fontWeight: 300 }}>Timmermann 2019</span>
              <span className="text-primary/40">◆</span>
              <span className="text-muted-foreground/60 text-sm" style={{ fontWeight: 300 }}>Davis et al. 2021</span>
              <span className="text-primary/40">◆</span>
              <span className="text-muted-foreground/60 text-sm" style={{ fontWeight: 300 }}>Strassman 2001</span>
              <span className="text-primary/40">◆</span>
              <span className="text-muted-foreground/60 text-sm" style={{ fontWeight: 300 }}>CC-BY-4.0</span>
              <span className="text-primary/40">◆</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <button 
        onClick={() => scrollToSection('explainer')} 
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer bg-transparent border-none opacity-40 hover:opacity-80 transition-opacity" 
        aria-label="Scroll to content"
      >
        <ChevronDown className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
      </button>
    </section>
  );
};
