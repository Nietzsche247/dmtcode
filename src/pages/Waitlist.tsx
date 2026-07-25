import { useLocation, useSearchParams } from 'react-router-dom';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Navigation } from '@/components/Navigation';
import { EmailCapture } from '@/components/EmailCapture';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Helmet } from 'react-helmet';

const Waitlist = () => {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  // Real route context only: utm_item is set by UnifiedProductDetail.tsx (sold
  // out notify) and by the Tools sold out CTA. utm_tier is set by
  // BundleDetail.tsx and BundleCard.tsx and carries the bundle id.
  const productSlug = searchParams.get('utm_item') || searchParams.get('utm_tier');
  const routeSource = pathname.replace(/^\/+|\/+$/g, '') || 'home';

  return (
    <>
      <Helmet>
        <title>Join DMT Code Waitlist - Early Access to Experiments & Community</title>
        <meta 
          name="description" 
          content="Join the DMT Code waitlist for early access to new experiments, verified equipment drops, and exclusive community updates. Be part of the Reality exploration movement." 
        />
        <link rel="canonical" href="https://dmtcode.com/waitlist" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/waitlist" />
        <meta name="robots" content="noindex, nofollow" />
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
          <Breadcrumb />
          <div className="pt-4">
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
            <EmailCapture source={routeSource} productSlug={productSlug} />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Waitlist;
