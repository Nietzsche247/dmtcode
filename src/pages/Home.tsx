import { useState, useEffect, useRef } from 'react';
import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/HeroSection';
import { ExplainerSection } from '@/components/ExplainerSection';
import { TestimonialsCarousel } from '@/components/TestimonialsCarousel';
import { EmailCapture } from '@/components/EmailCapture';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import { ArrowRight, Database, Users, Target, FileText, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModeStore } from '@/stores/modeStore';
import { useDynamicMeta } from '@/hooks/useDynamicMeta';
import { RecentContributions } from '@/components/registry/RecentContributions';
import { CommunityStats } from '@/components/registry/CommunityStats';

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
  const { mode } = useModeStore();
  const meta = useDynamicMeta('home');

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dmtcode.com" />
        <meta property="og:image" content="https://dmtcode.com/favicon.png" />
        <meta property="og:site_name" content="DMT Code" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content="https://dmtcode.com/favicon.png" />
        
        <link rel="canonical" href="https://dmtcode.com/" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "DMT Code Visual Symbol Catalogue",
            "url": "https://dmtcode.com",
            "description": "Open catalogue of visual symbols from 650 nm laser exposure and N,N-DMT experiences",
            "license": "https://creativecommons.org/licenses/by/4.0/",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://dmtcode.com/api/symbols?tag={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen">
        <main id="main-content" className="relative z-10" role="main">
          <Navigation />
          <HeroSection />
          <ExplainerSection />
          
          {/* Key Takeaways Section */}
          <section className="container mx-auto px-4 py-32 max-w-4xl">
            <AnimatedSection className="text-center mb-16">
              <p className="font-montserrat font-light italic text-muted-foreground text-lg tracking-wide mb-6">The Research</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.02em] text-foreground" style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}>
                Key Takeaways
              </h2>
            </AnimatedSection>

            <AnimatedSection className="animation-delay-200">
              <div className="p-8 md:p-12 rounded-3xl bg-card/50 border border-border/40">
                <ul className="space-y-6 text-lg text-muted-foreground font-normal leading-relaxed" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  <li className="flex gap-4">
                    <Target className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <span>The 650 nm protocol uses coherent red light through a diffraction grating during N,N-DMT administration to produce discrete visual symbols on any surface.</span>
                  </li>
                  <li className="flex gap-4">
                    <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <span>Davis et al. (2021) documented 87% inter-subject consistency: independent observers draw nearly identical symbols without prior communication.</span>
                  </li>
                  <li className="flex gap-4">
                    <Database className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <span>The registry accepts anonymous submissions with structured metadata. All data is downloadable as CSV or JSON under a CC-BY-4.0 license.</span>
                  </li>
                  <li className="flex gap-4">
                    <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <span>This project makes no medical claims. It exists solely to document reported phenomena for academic analysis.</span>
                  </li>
                  <li className="flex gap-4">
                    <AlertTriangle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <span>Critical perspectives are welcome. The /critiques page presents counter-arguments and alternative explanations for these observations.</span>
                  </li>
                </ul>
              </div>
            </AnimatedSection>
          </section>

          {/* Stats Section - Now uses live CommunityStats */}
          <section className="container mx-auto px-4 py-32 max-w-5xl border-t border-border/20">
            <AnimatedSection className="text-center mb-16">
              <p className="font-montserrat font-light italic text-muted-foreground text-lg tracking-wide mb-6">Current Status</p>
              <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-[0.02em] text-foreground mb-6" style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}>
                Dataset Overview
              </h2>
              <p className="text-muted-foreground font-normal max-w-2xl mx-auto text-lg" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                Live statistics from our growing dataset
              </p>
            </AnimatedSection>

            <AnimatedSection>
              <CommunityStats />
            </AnimatedSection>
          </section>
          
          {/* Recent Contributions Section */}
          <RecentContributions />

          {/* Mission Section */}
          <section className="container mx-auto px-4 py-32 max-w-4xl border-t border-border/30">
            <AnimatedSection>
              <p className="font-montserrat font-light italic text-muted-foreground text-lg tracking-wide mb-4">Our Mission</p>
              <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-[0.02em] text-foreground mb-8" style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}>
                Structured Documentation for Science
              </h2>
              <div className="space-y-6 text-lg text-muted-foreground font-normal leading-relaxed" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                <p>
                  DMT Code collects discrete visual symbols reported during 650 nm coherent light exposure and N,N-DMT administration. Anyone can contribute. All submissions are reviewed by moderators before publication.
                </p>
                <p>
                  Danny Goler developed this protocol and Chase Hughes validated it across 3,000+ independent sessions. Participants shine coherent red light through a diffraction grating during the experience and report observing discrete, bounded visual symbols that resemble alphabetic characters and geometric patterns.
                </p>
                <p>
                  Davis et al. (2021) documented an 87% inter-subject consistency rate. This consistency across independent sessions suggests these phenomena deserve careful documentation and analysis.
                </p>
              </div>
            </AnimatedSection>
          </section>
          
          {/* Testimonials - handles its own mode visibility */}
          <TestimonialsCarousel />
          <EmailCapture />
          
          {/* CTA Section */}
          <section className="container mx-auto px-4 py-32 text-center">
            <AnimatedSection className="max-w-3xl mx-auto">
              <p className="font-montserrat font-light italic text-muted-foreground text-lg tracking-wide mb-6">Get Involved</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.02em] text-foreground mb-8" style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}>
                Contribute to Open Research
              </h2>
              <p className="text-muted-foreground font-normal mb-12 text-lg max-w-xl mx-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                Submit your observations or explore the evidence. Null reports are equally valuable.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <Button 
                  size="lg" 
                  className="px-10 py-7 h-auto rounded-full btn-lickable border-beam group text-lg"
                  onClick={() => navigate('/registry#submit')}
                >
                  Submit Symbol
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-10 py-7 h-auto rounded-full btn-lickable border-primary/50 hover:border-primary text-lg"
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
