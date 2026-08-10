import { useState, useEffect, useRef } from 'react';
import { Navigation } from '@/components/Navigation';
import { ConvergenceHero } from '@/components/home/ConvergenceHero';
import { ExplainerSection } from '@/components/ExplainerSection';
import { EmailCapture } from '@/components/EmailCapture';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import { ArrowRight, Database, Users, Target, FileText, AlertTriangle, Mic } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useModeStore } from '@/stores/modeStore';
import { useDynamicMeta } from '@/hooks/useDynamicMeta';
import { RecentContributions } from '@/components/registry/RecentContributions';
import { CommunityStats } from '@/components/registry/CommunityStats';
import { MissionFraming } from '@/components/home/MissionFraming';
import { GetInvolvedDoors } from '@/components/home/GetInvolvedDoors';
import { LatestArticle } from '@/components/home/LatestArticle';

// Featured kits. Images are real Shopify CDN assets; purchase lives on /prepare.
const INSTRUMENTS = [
  {
    slug: 'k1-observer',
    name: 'Observer',
    spec: '650 nm · 1 observer · Ships now',
    price: '$109',
    image:
      'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/kit-observer.jpg?v=1786330859',
  },
  {
    slug: 'k2-practitioner',
    name: 'Practitioner',
    spec: '650 nm · 1 observer · Ships now',
    price: '$159',
    image:
      'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/kit-practitioner.jpg?v=1786330859',
  },
  {
    slug: 'k4-complete',
    name: 'Complete',
    spec: '650 nm · 1 observer · Preorder',
    price: '$349',
    image:
      'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/kit-complete.jpg?v=1786330859',
  },
];

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
        <meta property="og:image" content="https://storage.googleapis.com/gpt-engineer-file-uploads/xpje0qbzg7e7wLYOGt4x2WGDXtR2/social-images/social-1763590629562-Webp.net-resizeimage-3.png" />
        <meta property="og:site_name" content="DMT Code" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content="https://storage.googleapis.com/gpt-engineer-file-uploads/xpje0qbzg7e7wLYOGt4x2WGDXtR2/social-images/social-1763590629562-Webp.net-resizeimage-3.png" />
        
        <link rel="canonical" href="https://dmtcode.com/" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "DMT Code Project",
            "alternateName": "DMT Code",
            "url": "https://dmtcode.com",
            "logo": "https://dmtcode.com/favicon.png",
            "description": "Open-science research initiative documenting visual symbols from 650 nm laser exposure and N,N-DMT experiences",
            "foundingDate": "2025",
            "sameAs": [
              "https://github.com/dmtcode"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "research inquiries",
              "url": "https://dmtcode.com/about"
            },
            "knowsAbout": [
              "DMT research",
              "650nm laser protocols",
              "Visual symbol documentation",
              "Psychedelic science",
              "Open data research"
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "DMT Code Visual Symbol Catalogue",
            "url": "https://dmtcode.com",
            "description": "Open catalogue of visual symbols from 650 nm laser exposure and N,N-DMT experiences",
            "publisher": {
              "@type": "Organization",
              "name": "DMT Code Project"
            },
            "license": "https://creativecommons.org/licenses/by/4.0/"
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen">
        <main id="main-content" className="relative z-10" role="main">
          <Navigation />
          <ConvergenceHero />

          <MissionFraming />
          <GetInvolvedDoors variant="top" />

          {/* Voice Logger Callout */}
          <section className="container mx-auto px-4 py-8 max-w-4xl">
            <AnimatedSection>
              <div 
                className="p-4 md:p-6 rounded-lg border border-primary bg-primary/10"
                role="complementary"
                aria-label="Voice Logger recommendation"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative flex-shrink-0 p-3 rounded-full bg-primary/20">
                    <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                    <Mic className="relative h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      Record Your Experience First
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Use the Voice Logger to capture your thoughts right after your session, while the memory is fresh. You need an account, because the recording stays yours. 
                      The audio is sent for automatic transcription, and the transcript is then scanned for a fixed list of keywords and grouped under theme names. That grouping is a word match on the text. It is not an interpretation of what you experienced.
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('/log')} 
                    className="whitespace-nowrap flex-shrink-0 gap-2 btn-lickable"
                    size="lg"
                  >
                    <Mic className="h-4 w-4" />
                    Start Voice Recording
                  </Button>
                </div>
              </div>
            </AnimatedSection>
          </section>

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
                    <span>The 650 nm protocol passes coherent red light through a diffraction grating during N,N-DMT administration. Observers report seeing discrete visual symbols during that exposure. Whether the light produces them, or whether they would be reported without it, is the open question this project exists to settle.</span>
                  </li>
                  <li className="flex gap-4">
                    <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <span>Reports of recurring symbol forms come from self selected observers who are usually aware of the protocol beforehand. Establishing whether the convergence is real requires records sealed before the observer sees the catalogue, which is what the capture route collects.</span>
                  </li>
                  <li className="flex gap-4">
                    <Database className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <span>Submitting to the registry requires an account, and each submission carries structured metadata. The registry pages export records as CSV or JSON, and the full corpus is published at /data.json under a CC-BY-4.0 license.</span>
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
                  DMT Code collects discrete visual symbols reported during 650 nm coherent light exposure and N,N-DMT administration. Anyone with an account can contribute. Symbols publish immediately and an administrator has 72 hours to review and deny. Events, retreats, clinical trial records and theories are reviewed before they appear.
                </p>
                <p>
                  Danny Goler developed this protocol and published a pilot account of it in IPI Letters in 2025. Participants shine coherent red light through a diffraction grating during the experience and report observing discrete, bounded visual symbols that resemble alphabetic characters and geometric patterns.
                </p>
                <p>
                  Individual reports of similar forms are what prompted this project. They are not yet evidence of convergence, because almost everyone who reports one has already read about the protocol. Separating a real shared structure from a shared expectation is the whole task, and it is why this site publishes null reports and competing explanations alongside the symbols.
                </p>
              </div>
            </AnimatedSection>
          </section>

          {/* Instruments Section */}
          <section className="container mx-auto px-4 py-32 max-w-6xl border-t border-border/30">
            <AnimatedSection>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-3">
                Instruments for careful observation
              </h2>
              <p className="text-muted-foreground mb-12">
                Every kit ships with its full bill of materials published.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {INSTRUMENTS.map((kit) => (
                  <article
                    key={kit.slug}
                    className="rounded-2xl border border-border/60 overflow-hidden bg-card/40 hover:border-primary/50 transition-colors"
                  >
                    <div className="aspect-video bg-muted/20 overflow-hidden">
                      <img
                        src={kit.image}
                        alt={`${kit.name} kit contents`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="font-serif text-2xl text-foreground">{kit.name}</h3>
                      <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-2">
                        {kit.spec}
                      </div>
                      <div className="text-2xl font-black tracking-tight tabular-nums mt-4">
                        {kit.price}
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full mt-6 rounded-lg border-primary/50 hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <Link to={`/prepare#${kit.slug}`}>View bill of materials</Link>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </AnimatedSection>
          </section>

          <LatestArticle />
          <EmailCapture source="homepage" />
          
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

          <GetInvolvedDoors variant="bottom" />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Home;
