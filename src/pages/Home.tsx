import { useState, useEffect, useRef } from 'react';
import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/HeroSection';
import { ExplainerSection } from '@/components/ExplainerSection';
import { TestimonialsCarousel } from '@/components/TestimonialsCarousel';
import { EmailCapture } from '@/components/EmailCapture';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import { ArrowRight, Database, Users, Target, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AnimatedSection = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={`opacity-0 ${isVisible ? 'animate-blur-in-up' : ''} ${className}`}
      style={{ animationFillMode: 'forwards' }}
    >
      {children}
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>DMT Code Visual Symbol Catalogue | 650 nm Laser & N,N-DMT Research</title>
        <meta 
          name="description" 
          content="Open catalogue of visual symbols from 650 nm laser exposure and N,N-DMT experiences. Anonymous contribution, CSV/JSON downloads." 
        />
        <meta property="og:title" content="DMT Code Visual Symbol Catalogue | 650 nm Laser & N,N-DMT Research" />
        <meta property="og:description" content="Open catalogue of visual symbols from 650 nm laser exposure and N,N-DMT experiences." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dmtcode.com" />
        <link rel="canonical" href="https://dmtcode.com/" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "DMT Code Visual Symbol Catalogue",
            "url": "https://dmtcode.com",
            "description": "Open catalogue of visual symbols from 650 nm laser exposure and N,N-DMT experiences",
            "license": "https://creativecommons.org/licenses/by/4.0/"
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen">
        <main className="relative z-10">
          <Navigation />
          <HeroSection />
          <ExplainerSection />
          
          {/* Key Features Section */}
          <section className="container mx-auto px-4 py-24 max-w-6xl">
            <AnimatedSection className="text-center mb-16">
              <p className="text-primary text-sm font-medium tracking-wide uppercase mb-4">Why It Matters</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
                Open Science, Real Data
              </h2>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Target, title: '650 nm Protocol', desc: 'Coherent red light through diffraction grating during N,N-DMT elicits consistent visual symbols (Goler 2025)' },
                { icon: Users, title: '87% Consistency', desc: 'Independent observers report identical symbol morphology across sessions (Davis et al. 2021)' },
                { icon: Database, title: 'Open Registry', desc: 'Anonymous submissions, structured metadata, CSV/JSON downloads under CC-BY-4.0' },
                { icon: FileText, title: 'Neutral Science', desc: 'No medical claims; systematic documentation for academic research and pattern analysis' },
              ].map((item, i) => (
                <AnimatedSection key={i} className={`animation-delay-${(i + 1) * 100}`}>
                  <div className="p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-primary/30 transition-colors h-full">
                    <item.icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground font-light">{item.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </section>

          {/* Stats Section */}
          <section className="container mx-auto px-4 py-24 max-w-5xl border-t border-border/30">
            <AnimatedSection className="text-center mb-12">
              <p className="text-primary text-sm font-medium tracking-wide uppercase mb-4">Current Status</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Dataset Overview
              </h2>
              <p className="text-muted-foreground font-light max-w-2xl mx-auto">
                Real-time data updated with each new submission. Complete dataset available for download.
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                { value: '52+', label: 'Symbol Archetypes' },
                { value: '3,000+', label: 'Independent Replicators' },
                { value: '87%', label: 'Consistency Rate' },
              ].map((stat, i) => (
                <AnimatedSection key={i} className={`animation-delay-${(i + 1) * 100}`}>
                  <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="text-5xl md:text-6xl font-black text-primary mb-2">{stat.value}</div>
                    <div className="text-sm text-muted-foreground font-light">{stat.label}</div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </section>

          {/* Mission Section */}
          <section className="container mx-auto px-4 py-24 max-w-4xl border-t border-border/30">
            <AnimatedSection>
              <p className="text-primary text-sm font-medium tracking-wide uppercase mb-4">Our Mission</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-8">
                Systematic Documentation for Science
              </h2>
              <div className="space-y-6 text-lg text-muted-foreground font-light leading-relaxed">
                <p>
                  DMT Code is an open, community-maintained catalogue documenting discrete visual symbols reported during 650 nm coherent light exposure and N,N-DMT administration.
                </p>
                <p>
                  The protocol, developed by Danny Goler and validated by Chase Hughes across 3,000+ independent replicators, involves shining coherent red light through a diffraction grating during N,N-DMT experiences. Participants consistently report observing discrete, bounded visual symbols resembling alphabetic characters and geometric patterns.
                </p>
                <p>
                  Davis et al. (2021) documented an 87% inter-subject consistency rate. This remarkable consistency across independent sessions suggests these phenomena warrant systematic documentation and analysis.
                </p>
              </div>
            </AnimatedSection>
          </section>
          
          <TestimonialsCarousel />
          <EmailCapture />
          
          {/* CTA Section */}
          <section className="container mx-auto px-4 py-24 text-center">
            <AnimatedSection className="max-w-2xl mx-auto">
              <p className="text-primary text-sm font-medium tracking-wide uppercase mb-4">Get Involved</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Contribute to Open Research
              </h2>
              <p className="text-muted-foreground font-light mb-8">
                Submit your observations or explore the evidence. Null reports are equally valuable for establishing baseline data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="px-8 py-6 h-auto rounded-full btn-lickable border-beam group"
                  onClick={() => navigate('/registry#submit')}
                >
                  Submit Symbol
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-6 h-auto rounded-full btn-lickable"
                  onClick={() => navigate('/evidence-map')}
                >
                  View Evidence
                </Button>
              </div>
            </AnimatedSection>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Home;
