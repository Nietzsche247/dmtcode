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
          content="Open catalogue of visual symbols reported during 650 nm laser exposure and N,N-DMT experiences. Anonymous contribution, full dataset downloads, and research resources available." 
        />
        <meta property="og:title" content="DMT Code Visual Symbol Catalogue | 650 nm Laser Research" />
        <meta property="og:description" content="Open catalogue of visual symbols reported during 650 nm laser exposure and N,N-DMT experiences." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dmtcode.com" />
        <link rel="canonical" href="https://dmtcode.com/" />
      </Helmet>

      <div className="relative min-h-screen">
        <ParticleBackground />
        
        <main className="relative z-10">
          <Navigation />
          <HeroSection />
          <ExplainerSection />
          <TestimonialsCarousel />
          <EmailCapture />
          
          {/* Registry Link */}
          <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-gold mb-4">
              Contribute to the open research catalogue →
            </p>
            <a 
              href="/registry"
              className="inline-block px-6 py-3 bg-destructive/90 hover:bg-destructive text-white rounded-md transition-colors font-medium"
              aria-label="Navigate to DMT Code Glyph Registry"
            >
              GLYPH REGISTRY
            </a>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Home;
