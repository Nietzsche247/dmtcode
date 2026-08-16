import type { ReactNode } from 'react';
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

import { KITS } from '@/data/kits';

// Featured kits. Prices and availability come from the shared catalogue.
const INSTRUMENTS = KITS.map((kit) => ({
  slug: kit.id,
  id: kit.id,
  href: '/prepare',
  name: kit.shortName,
  spec: `650 NM · ${kit.observers.toUpperCase()} OBSERVER${kit.observers === '1' ? '' : 'S'}`,
  price: kit.price,
  image: kit.image,
  availability: kit.availability,
}));

// Scroll reveal without JavaScript gating: the element is visible by default and
// the animation only decorates its arrival. Nothing can be left stranded at
// opacity 0 when an intersection never fires or motion is reduced.
const AnimatedSection = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div
    className={`motion-safe:animate-blur-in-up ${className}`}
    style={{ animationFillMode: 'both' }}
  >
    {children}
  </div>
);

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
          
          {/* Key Takeaways summary. Full argument lives on /methods. */}
          <section className="container mx-auto px-4 py-16 max-w-3xl border-t border-border/30">
            <AnimatedSection>
              <p className="label-data text-xs text-primary mb-4">THE RESEARCH</p>
              <h2
                className="text-3xl md:text-4xl text-foreground mb-5"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
              >
                Key takeaways
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed" style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
                The 650 nm protocol passes coherent red light through a diffraction grating during
                N,N-DMT administration, and observers report discrete visual symbols during that
                exposure. Most reporters already know the protocol, so convergence is not
                established: it needs records sealed before the observer sees the catalogue. Every
                submission carries structured metadata and the corpus is published under CC-BY-4.0.
                We make no medical claims and we publish the counter-arguments alongside the
                symbols.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm">
                <Link to="/methods" className="text-primary hover:underline inline-flex items-center gap-1">
                  Read more on Methods <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/critiques" className="text-primary hover:underline inline-flex items-center gap-1">
                  Read the critiques <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>
          </section>

          {/* Live counters */}
          <section className="container mx-auto px-4 py-16 max-w-5xl border-t border-border/20">
            <AnimatedSection className="mb-8">
              <p className="label-data text-xs text-primary mb-4">CURRENT STATUS</p>
              <h2
                className="text-3xl md:text-4xl text-foreground mb-3"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
              >
                Dataset overview
              </h2>
              <p className="text-base text-muted-foreground" style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
                Live counts from the open record.{' '}
                <Link to="/dataset" className="text-primary hover:underline">
                  Read more on Dataset
                </Link>
              </p>
            </AnimatedSection>

            <AnimatedSection>
              <CommunityStats />
            </AnimatedSection>
          </section>
          
          {/* Recent Contributions Section */}
          <RecentContributions />

          {/* Mission summary. Full statement lives on /about. */}
          <section className="container mx-auto px-4 py-16 max-w-3xl border-t border-border/30">
            <AnimatedSection>
              <p className="label-data text-xs text-primary mb-4">OUR MISSION</p>
              <h2
                className="text-3xl md:text-4xl text-foreground mb-5"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
              >
                Structured documentation for science
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed" style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
                DMT Code collects discrete visual symbols reported during 650 nm coherent light
                exposure and N,N-DMT administration. Danny Goler developed the protocol and
                published a pilot account of it in IPI Letters in 2025. Individual reports of
                similar forms prompted this project, but they are not yet evidence of convergence.
                Separating a real shared structure from a shared expectation is the whole task.
              </p>
              <div className="mt-6 text-sm">
                <Link to="/about" className="text-primary hover:underline inline-flex items-center gap-1">
                  Read more About the project <ArrowRight className="w-4 h-4" />
                </Link>
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
                Three kits, one to six observers. Full details, screening notes and checkout on the Prepare page.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {INSTRUMENTS.map((kit) => (
                  <article
                    key={kit.slug}
                    className="rounded-2xl border border-border/60 overflow-hidden bg-card/40 hover:border-primary/50 transition-colors"
                  >
                    <div className="aspect-video bg-muted/20 overflow-hidden">
                      {kit.image ? (
                        <img
                          src={kit.image}
                          alt={`${kit.name} kit contents`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                          <span className="text-xs uppercase tracking-widest text-muted-foreground">
                            Kit image pending
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-serif text-2xl text-foreground">{kit.name}</h3>
                      <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-2">
                        {kit.spec}
                      </div>
                      <div className="text-2xl font-black tracking-tight tabular-nums mt-4">
                        {kit.price}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {kit.availability}
                      </p>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full mt-6 rounded-lg border-primary/50 hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <Link
                          to={kit.href}
                          onClick={() => {
                            if (typeof window !== 'undefined' && (window as any).gtag) {
                              (window as any).gtag('event', 'home_kit_card_click', {
                                kit: kit.id,
                              });
                            }
                          }}
                        >
                          See kit and buy
                        </Link>
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
