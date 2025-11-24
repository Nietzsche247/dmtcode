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
        <title>DMT Code - Unlock Reality's Source Code with the 650nm Laser Experiment</title>
        <meta 
          name="description" 
          content="dmtcode.com is the #1 community resource and store for Danny Goler's 650nm red laser DMT experiment. Buy verified lasers & bundles, upload/vote on glyphs with surface tagging, access 20+ peer-reviewed papers, and view real-time probability dashboard." 
        />
        <meta property="og:title" content="DMT Code - The Complete 650nm Laser Protocol" />
        <meta property="og:description" content="The exact 650nm red laser protocol discovered by Danny Goler and validated by Chase Hughes." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dmtcode.com" />
        <link rel="canonical" href="https://dmtcode.com/" />
        <meta property="og:title" content="DMT Code - The Complete 650nm Laser Protocol" />
        <meta property="og:description" content="The exact 650nm red laser protocol discovered by Danny Goler and validated by Chase Hughes." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dmtcode.com" />
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
