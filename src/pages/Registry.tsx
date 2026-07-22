import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { RegistryHero } from '@/components/registry/RegistryHero';
import { RegistryRationale } from '@/components/registry/RegistryRationale';
import { RegistryStatistics } from '@/components/registry/RegistryStatistics';
import { LayeredSubmissionForm } from '@/components/registry/LayeredSubmissionForm';
import { RegistryBrowser } from '@/components/registry/RegistryBrowser';
import { RegistryDownloads } from '@/components/registry/RegistryDownloads';
import { RegistryResources } from '@/components/registry/RegistryResources';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';

const Registry = () => {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>DMT Code Visual Symbol Registry — Open Catalogue (CC-BY-4.0)</title>
        <meta name="description" content="Browse the open, community-validated catalogue of visual symbols reported during N,N-DMT experiences. Structured metadata, community confirmations, and free CC-BY-4.0 data." />
        <meta name="keywords" content="DMT glyphs, 650nm laser, visual symbols, N,N-DMT administration, psychedelic research, scientific catalogue, open data, CC-BY-4.0, null reports, baseline data" />
        <link rel="canonical" href="https://dmtcode.com/registry" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/registry" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="DMT Code Visual Symbol Registry — Open Catalogue (CC-BY-4.0)" />
        <meta property="og:description" content="Browse the open, community-validated catalogue of visual symbols reported during N,N-DMT experiences. Structured metadata, community confirmations, and free CC-BY-4.0 data." />
        <meta property="og:url" content="https://dmtcode.com/registry" />
        <meta property="og:image" content="https://storage.googleapis.com/gpt-engineer-file-uploads/xpje0qbzg7e7wLYOGt4x2WGDXtR2/social-images/social-1763590629562-Webp.net-resizeimage-3.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/registry" />
        <meta name="twitter:title" content="DMT Code Visual Symbol Registry — Open Catalogue (CC-BY-4.0)" />
        <meta name="twitter:description" content="Browse the open, community-validated catalogue of visual symbols reported during N,N-DMT experiences. Structured metadata, community confirmations, and free CC-BY-4.0 data." />
        <meta name="twitter:image" content="https://storage.googleapis.com/gpt-engineer-file-uploads/xpje0qbzg7e7wLYOGt4x2WGDXtR2/social-images/social-1763590629562-Webp.net-resizeimage-3.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Dataset",
                "@id": "https://dmtcode.com/registry",
                "name": "DMT Code Visual Symbol Registry",
                "description": "Open, community-maintained catalogue of discrete visual symbols reported during 650 nm laser exposure and N,N-DMT experiences.",
                "url": "https://dmtcode.com/registry",
                "license": "https://creativecommons.org/licenses/by/4.0/",
                "creator": { "@type": "Organization", "name": "DMT Code" },
                "isAccessibleForFree": true,
                "keywords": ["DMT", "N,N-DMT", "visual symbols", "psychedelic phenomenology", "650 nm", "entoptic"],
                "distribution": [
                  { "@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": "https://dmtcode.com/data.json" }
                ]
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dmtcode.com/" },
                  { "@type": "ListItem", "position": 2, "name": "Registry", "item": "https://dmtcode.com/registry" }
                ]
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        
        <main id="main-content" className="relative z-10 pt-20" role="main">
          <div className="block md:hidden">
            <Breadcrumb />
          </div>
          <RegistryHero />
          <RegistryRationale />
          <RegistryStatistics />
          
          {/* Voice Logger Callout */}
          <section className="container mx-auto px-4 py-8 max-w-4xl">
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
                    Use our Voice Logger to capture your thoughts immediately after your session while memories are fresh. 
                    Your recording will be transcribed and analyzed.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/log')} 
                  className="whitespace-nowrap flex-shrink-0 gap-2"
                  size="lg"
                >
                  <Mic className="h-4 w-4" />
                  Start Voice Recording
                </Button>
              </div>
            </div>
          </section>

          <LayeredSubmissionForm />
          <RegistryBrowser />
          <RegistryDownloads />
          <RegistryResources />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Registry;
