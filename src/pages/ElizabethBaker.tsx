import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';

const ElizabethBaker = () => {
  return (
    <>
      <Helmet>
        <title>Elizabeth Baker | DMT Code</title>
        <meta 
          name="description" 
          content="Elizabeth Baker - Prognosis and message." 
        />
        <link rel="canonical" href="https://dmtcode.com/Elizabeth_Baker" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/Elizabeth_Baker" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Elizabeth Baker | DMT Code" />
        <meta property="og:description" content="Elizabeth Baker - Prognosis and message." />
        <meta property="og:url" content="https://dmtcode.com/Elizabeth_Baker" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://dmtcode.com/favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/Elizabeth_Baker" />
        <meta name="twitter:title" content="Elizabeth Baker | DMT Code" />
        <meta name="twitter:description" content="Elizabeth Baker - Prognosis and message." />
        <meta name="twitter:image" content="https://dmtcode.com/favicon.png" />
        
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
                "name": "Elizabeth Baker",
                "item": "https://dmtcode.com/Elizabeth_Baker"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        
        <main id="main-content" className="relative z-10 pt-4" role="main">
          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Elizabeth Baker</h1>
            <p className="text-lg text-muted-foreground mb-12">
              {/* Subtitle placeholder - will be replaced with your content */}
            </p>

            {/* Prognosis Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">Prognosis</h2>
              <div className="p-6 bg-muted/30 border border-border rounded-lg">
                <p className="text-base">
                  {/* Prognosis content placeholder - will be replaced with your content */}
                </p>
              </div>
            </div>

            {/* Message Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">Message</h2>
              <div className="p-6 bg-muted/30 border border-border rounded-lg space-y-4">
                <p className="text-base">
                  {/* Message content placeholder - will be replaced with your content */}
                </p>
              </div>
            </div>

            {/* Additional content sections can be added here */}
            <div className="mt-12 p-8 bg-muted/30 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">
                {/* Footer note placeholder */}
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ElizabethBaker;
