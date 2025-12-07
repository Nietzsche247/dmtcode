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
        <title>Visual Symbol Database - Documented DMT Patterns | DMT Code</title>
        <meta 
          name="description" 
          content="Browse and contribute to the open-source catalogue of visual symbols observed during 650nm laser and N,N-DMT experiences." 
        />
        <meta name="keywords" content="DMT glyphs, 650nm laser, visual symbols, N,N-DMT administration, psychedelic research, scientific catalogue, open data, CC-BY-4.0, null reports, baseline data" />
        <link rel="canonical" href="https://dmtcode.com/registry" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/registry" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Visual Symbol Database - Documented DMT Patterns | DMT Code" />
        <meta property="og:description" content="Browse and contribute to the open-source catalogue of visual symbols observed during 650nm laser and N,N-DMT experiences." />
        <meta property="og:url" content="https://dmtcode.com/registry" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://dmtcode.com/favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/registry" />
        <meta name="twitter:title" content="Visual Symbol Database - Documented DMT Patterns | DMT Code" />
        <meta name="twitter:description" content="Browse and contribute to the open-source catalogue of visual symbols observed during 650nm laser and N,N-DMT experiences." />
        <meta name="twitter:image" content="https://dmtcode.com/favicon.png" />
        <script type="application/ld+json">
          {JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Dataset",
              "name": "DMT Code Visual Symbol Registry",
              "description": "Open, community-maintained catalogue of discrete visual symbols reported during 650 nm laser exposure and N,N-DMT experiences",
              "url": "https://dmtcode.com/registry",
              "creator": {
                "@type": "Organization",
                "name": "DMT Code Project"
              },
              "license": "https://creativecommons.org/licenses/by/4.0/",
              "version": "2.0",
              "datePublished": "2025-01-01",
              "dateModified": "2025-11-28",
              "temporalCoverage": "2025/..",
              "keywords": ["DMT", "650nm laser", "visual symbols", "psychedelic research", "open data", "N,N-DMT"],
              "citation": [
                {
                  "@type": "ScholarlyArticle",
                  "name": "Survey of entity encounter experiences",
                  "author": "Davis et al.",
                  "datePublished": "2021",
                  "url": "https://doi.org/10.1002/hup.2806"
                }
              ],
              "distribution": [
                {
                  "@type": "DataDownload",
                  "encodingFormat": "application/json",
                  "contentUrl": "https://dmtcode.com/data.json",
                  "description": "Complete dataset in JSON format with 52 symbols, metadata, and citations"
                },
                {
                  "@type": "DataDownload",
                  "encodingFormat": "text/csv",
                  "contentUrl": "https://dmtcode.com/registry/export.csv",
                  "description": "CSV export of registry submissions"
                }
              ],
              "variableMeasured": [
                "visual symbol morphology",
                "perceived surface",
                "depth perception",
                "motion characteristics",
                "emotional valence",
                "symmetry classification"
              ]
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dmtcode.com/" },
                { "@type": "ListItem", "position": 2, "name": "Registry", "item": "https://dmtcode.com/registry" }
              ]
            }
          ])}
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
