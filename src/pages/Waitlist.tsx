import { ParticleBackground } from '@/components/ParticleBackground';
import { Navigation } from '@/components/Navigation';
import { EmailCapture } from '@/components/EmailCapture';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';

const Waitlist = () => {
  return (
    <>
      <Helmet>
        <title>Join DMT Code Waitlist - Early Access to Experiments & Community</title>
        <meta 
          name="description" 
          content="Join the DMT Code waitlist for early access to new experiments, verified equipment drops, and exclusive community updates. Be part of the Reality exploration movement." 
        />
        <link rel="canonical" href="https://dmtcode.com/waitlist" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://dmtcode.com/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Waitlist",
                "item": "https://dmtcode.com/waitlist"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen">
        <ParticleBackground />
        
        <main className="relative z-10">
          <Navigation />
          <div className="pt-24">
            <section className="py-20 px-4">
              <div className="max-w-4xl mx-auto text-center space-y-8">
                <h1 className="text-4xl md:text-6xl font-bold glow-text">
                  Join the Movement
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Get early access to new experiments, verified equipment drops, and exclusive community updates. 
                  Be part of the growing community exploring Reality's source code.
                </p>
              </div>
            </section>
            <EmailCapture />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Waitlist;
