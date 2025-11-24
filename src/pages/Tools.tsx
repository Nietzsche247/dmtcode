import { ParticleBackground } from '@/components/ParticleBackground';
import { Navigation } from '@/components/Navigation';
import { LaserGuide } from '@/components/LaserGuide';
import { ShopSection } from '@/components/ShopSection';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';

const Tools = () => {
  return (
    <>
      <Helmet>
        <title>DMT Tools - 650nm Lasers, Vaporizers & Journey Equipment</title>
        <meta 
          name="description" 
          content="Buy verified 650nm red laser pointers and DMT vaporization equipment. Compare generic options vs. pre-assembled kits. Fast Apple Pay, Google Pay, Amazon Pay checkout. Ships worldwide." 
        />
        <link rel="canonical" href="https://dmtcode.com/tools" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "DMT Code Verified Equipment",
            "description": "650nm laser pointers and DMT journey tools",
            "dateModified": new Date().toISOString().split('T')[0]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen">
        <ParticleBackground />
        
        <main className="relative z-10">
          <Navigation />
          <div className="pt-24">
            <LaserGuide />
            <ShopSection />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Tools;
