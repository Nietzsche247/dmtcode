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

const Registry = () => {
  return (
    <>
      <Helmet>
        <title>Glyph Registry | DMT Code Visual Symbol Catalogue</title>
        <meta 
          name="description" 
          content="Open catalogue of visual symbols from 650 nm laser exposure and N,N-DMT experiences. Anonymous contribution, CSV/JSON downloads." 
        />
        <meta name="keywords" content="DMT glyphs, 650nm laser, visual symbols, N,N-DMT administration, psychedelic research, scientific catalogue, open data, CC-BY-4.0, null reports, baseline data" />
        <link rel="canonical" href="https://dmtcode.com/registry" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/registry" />
        <link rel="alternate" hrefLang="es" href="https://dmtcode.com/registry" />
        <link rel="alternate" hrefLang="fr" href="https://dmtcode.com/registry" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Glyph Registry | DMT Code Visual Symbol Catalogue" />
        <meta property="og:description" content="Open catalogue of visual symbols from 650 nm laser exposure and N,N-DMT experiences. Anonymous contribution, CSV/JSON downloads." />
        <meta property="og:url" content="https://dmtcode.com/registry" />
        <meta property="og:type" content="website" />
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
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What visual symbols are documented in the registry?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The registry catalogues discrete 100×100px visual symbols reported during 650nm laser exposure and N,N-DMT experiences. Symbols include alphabetic-like characters, geometric patterns, and structured glyphs with 87% inter-subject consistency. Davis et al. (2021) DOI:10.1002/hup.2806"
                  }
                },
                {
                  "@type": "Question",
                  "name": "How do I contribute symbols to the registry?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Use the canvas drawing tool to recreate symbols on 100×100px white background. Add structured metadata including source (650nm laser or DMT), route of administration, perceived surface, depth, motion, and emotional valence. Submissions can be anonymous or authenticated. All data released under CC-BY-4.0."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How can I download the complete dataset?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Full dataset available at /data.json (machine-readable JSON format) and /registry/export.csv (CSV format). Updated in real-time with each submission. Released under CC-BY-4.0 license for academic research and independent analysis."
                  }
                }
              ]
            }
          ])}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        
        <main className="relative z-10 pt-20">
          <div className="block md:hidden">
            <Breadcrumb />
          </div>
          <RegistryHero />
          <RegistryRationale />
          <RegistryStatistics />
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
