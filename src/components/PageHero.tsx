import { useState, useEffect } from 'react';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  titleAccent?: string;
  subtitle: string;
  children?: React.ReactNode;
}

export const PageHero = ({ eyebrow, title, titleAccent, subtitle, children }: PageHeroProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative px-4 py-20 md:py-28 overflow-hidden">
      {/* Subtle background effects */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div 
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"
          style={{ top: '20%' }}
        />
        <div 
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/5 to-transparent"
          style={{ top: '80%' }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6">
        {/* Eyebrow */}
        <p 
          className={`text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase opacity-0 ${isLoaded ? 'animate-blur-in-up' : ''}`}
          style={{ animationFillMode: 'forwards' }}
        >
          {eyebrow}
        </p>

        {/* Title */}
        <h1 
          className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.9] opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-100' : ''}`}
          style={{ animationFillMode: 'forwards' }}
        >
          {title}
          {titleAccent && (
            <span className="block text-primary mt-2">{titleAccent}</span>
          )}
        </h1>

        {/* Subtitle */}
        <p 
          className={`text-lg md:text-xl font-light text-muted-foreground max-w-3xl mx-auto leading-relaxed opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-200' : ''}`}
          style={{ animationFillMode: 'forwards' }}
        >
          {subtitle}
        </p>

        {/* Children (CTAs, etc.) */}
        {children && (
          <div 
            className={`pt-6 opacity-0 ${isLoaded ? 'animate-blur-in-up animation-delay-300' : ''}`}
            style={{ animationFillMode: 'forwards' }}
          >
            {children}
          </div>
        )}
      </div>
    </section>
  );
};
