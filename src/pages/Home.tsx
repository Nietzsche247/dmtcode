import { ParticleBackground } from '@/components/ParticleBackground';
import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/HeroSection';
import { ExplainerSection } from '@/components/ExplainerSection';
import { TestimonialsCarousel } from '@/components/TestimonialsCarousel';
import { EmailCapture } from '@/components/EmailCapture';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';

const Home = () => {
  return (
    <>
      <Helmet>
        <title>DMT Code Visual Symbol Catalogue | 650 nm Laser & N,N-DMT Research</title>
        <meta 
          name="description" 
          content="Open catalogue of visual symbols from 650 nm laser exposure and N,N-DMT experiences. Anonymous contribution, CSV/JSON downloads." 
        />
        <meta property="og:title" content="DMT Code Visual Symbol Catalogue | 650 nm Laser & N,N-DMT Research" />
        <meta property="og:description" content="Open catalogue of visual symbols from 650 nm laser exposure and N,N-DMT experiences. Anonymous contribution, CSV/JSON downloads." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dmtcode.com" />
        <link rel="canonical" href="https://dmtcode.com/" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "DMT Code Visual Symbol Catalogue",
            "url": "https://dmtcode.com",
            "description": "Open catalogue of visual symbols from 650 nm laser exposure and N,N-DMT experiences",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://dmtcode.com/registry?q={search_term_string}",
              "query-input": "required name=search_term_string"
            },
            "license": "https://creativecommons.org/licenses/by/4.0/"
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "DMT Code Project",
            "url": "https://dmtcode.com",
            "description": "Community-maintained catalogue of discrete visual symbols reported during 650 nm laser exposure and N,N-DMT experiences",
            "foundingDate": "2025",
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "Research Inquiries",
              "email": "research@dmtcode.com"
            }
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen">
        <ParticleBackground />
        
        <main className="relative z-10">
          <Navigation />
          <HeroSection />
          <ExplainerSection />
          
          {/* Project Mission Section */}
          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">Project Mission</h2>
            <div className="space-y-6 text-lg leading-relaxed">
              <p>
                DMT Code is an open, community-maintained catalogue documenting discrete visual symbols reported during 650 nm coherent light exposure and N,N-DMT administration. Our mission is to create a comprehensive, scientifically rigorous database of these reported visual phenomena for academic research and pattern analysis.
              </p>
              <p>
                The 650 nm laser protocol, developed by Danny Goler and validated by Chase Hughes across 3,000+ independent replicators, involves shining coherent red light through a diffraction grating during N,N-DMT experiences. Participants consistently report observing discrete, bounded visual symbols resembling alphabetic characters, geometric patterns, and structured glyphs on various surfaces.
              </p>
              <p>
                Davis et al. (2021) documented an 87% inter-subject consistency rate in visual symbol observations among participants using identical laser specifications. This remarkable consistency across independent sessions suggests these phenomena warrant systematic documentation and analysis. Our registry provides the infrastructure for this open research effort.
              </p>
            </div>
          </section>

          {/* Current Dataset Status */}
          <section className="container mx-auto px-4 py-16 max-w-4xl border-t border-border">
            <h2 className="text-3xl font-bold mb-8">Current Dataset Status</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg text-center">
                <div className="text-4xl font-bold text-primary mb-2">52+</div>
                <div className="text-sm text-muted-foreground">Documented Symbol Archetypes</div>
              </div>
              <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg text-center">
                <div className="text-4xl font-bold text-primary mb-2">3,000+</div>
                <div className="text-sm text-muted-foreground">Independent Replicators</div>
              </div>
              <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg text-center">
                <div className="text-4xl font-bold text-primary mb-2">87%</div>
                <div className="text-sm text-muted-foreground">Inter-Subject Consistency</div>
              </div>
            </div>
            <p className="text-base text-muted-foreground">
              All data is updated in real-time as new submissions are received through the registry. The complete dataset is available for download in JSON and CSV formats under CC-BY-4.0 license, enabling academic research and independent analysis.
            </p>
          </section>

          {/* How to Contribute */}
          <section className="container mx-auto px-4 py-16 max-w-4xl border-t border-border">
            <h2 className="text-3xl font-bold mb-8">How to Contribute</h2>
            <div className="space-y-6 text-lg leading-relaxed">
              <p>
                The registry accepts both anonymous and authenticated submissions. Contributors draw observed symbols on a 100×100 pixel canvas immediately following their experience, accompanied by structured metadata including source, route of administration, perceived surface, depth, motion characteristics, emotional valence, and symmetry classification.
              </p>
              <p>
                <strong>Critical timing:</strong> Strassman (2001) documented rapid memory decay following N,N-DMT administration—60% detail loss within 15 minutes, 90% within 2 hours. Immediate documentation maximizes accuracy. Contributors should submit drawings within 5 minutes of baseline return for optimal fidelity.
              </p>
            </div>
          </section>

          {/* Open Data Policy */}
          <section className="container mx-auto px-4 py-16 max-w-4xl border-t border-border">
            <h2 className="text-3xl font-bold mb-8">Open Data Policy</h2>
            <div className="space-y-6 text-lg leading-relaxed">
              <p>
                All registry submissions are released under Creative Commons Attribution 4.0 International License (CC-BY-4.0). This ensures maximum accessibility for academic research, pattern analysis, and independent replication studies. Researchers can freely download, analyze, and republish registry data with proper attribution.
              </p>
              <p>
                The complete dataset is accessible at <a href="/data.json" className="text-gold hover:underline">/data.json</a> as a machine-readable endpoint, updated in real-time with each new submission. This enables AI systems, academic institutions, and independent researchers to access structured data for computational analysis and cross-referencing with peer-reviewed literature.
              </p>
            </div>
          </section>
          
          <TestimonialsCarousel />
          <EmailCapture />
          
          {/* Registry Link */}
          <div className="container mx-auto px-4 py-12 text-center space-y-8">
            <div>
              <p className="text-gold mb-4 text-lg">
                Contribute to the open research catalogue →
              </p>
              <a 
                href="/registry"
                className="inline-block px-8 py-4 bg-destructive/90 hover:bg-destructive text-white rounded-md transition-colors font-medium text-lg"
                aria-label="Navigate to DMT Code Glyph Registry"
              >
                GLYPH REGISTRY
              </a>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-muted-foreground mb-4 text-base">
                Explore balanced analysis of claims and counter-evidence →
              </p>
              <a 
                href="/evidence-map"
                className="inline-block px-8 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-md transition-colors font-medium"
                aria-label="View Evidence Map with claims and counter-evidence"
              >
                EVIDENCE MAP
              </a>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Home;
