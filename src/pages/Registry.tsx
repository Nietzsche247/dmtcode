import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { RegistryHero } from '@/components/registry/RegistryHero';
import { RegistryRationale } from '@/components/registry/RegistryRationale';
import { RegistryStatistics } from '@/components/registry/RegistryStatistics';
import { RegistrySubmissionForm } from '@/components/registry/RegistrySubmissionForm';
import { RegistryBrowser } from '@/components/registry/RegistryBrowser';
import { RegistryResources } from '@/components/registry/RegistryResources';

const Registry = () => {
  return (
    <>
      <Helmet>
        <title>DMT Code Glyph Registry - Scientific Visual Symbol Catalogue</title>
        <meta 
          name="description" 
          content="An open, community-maintained catalogue of discrete 100 × 100 px visual symbols reported during 650 nm laser exposure and N,N-DMT experiences. Open data for academic research." 
        />
        <meta name="keywords" content="DMT glyphs, 650nm laser, visual symbols, N,N-DMT administration, psychedelic research, scientific catalogue, open data, CC-BY-4.0" />
        <link rel="canonical" href="https://dmtcode.com/registry" />
        <meta property="og:title" content="DMT Code Glyph Registry - Scientific Visual Symbol Catalogue" />
        <meta property="og:description" content="An open, community-maintained catalogue of discrete 100 × 100 px visual symbols reported during 650 nm laser exposure and N,N-DMT experiences." />
        <meta property="og:url" content="https://dmtcode.com/registry" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            "name": "DMT Code Glyph Registry",
            "description": "An open, community-maintained catalogue of discrete 100 × 100 px visual symbols reported during 650 nm laser exposure and N,N-DMT experiences.",
            "url": "https://dmtcode.com/registry",
            "creator": {
              "@type": "Organization",
              "name": "DMT Code Project"
            },
            "license": "https://creativecommons.org/licenses/by/4.0/",
            "temporalCoverage": "2025/..",
            "keywords": "DMT, 650nm laser, visual symbols, psychedelic research, open data",
            "distribution": [
              {
                "@type": "DataDownload",
                "encodingFormat": "application/json",
                "contentUrl": "https://dmtcode.com/registry/export.json"
              },
              {
                "@type": "DataDownload",
                "encodingFormat": "text/csv",
                "contentUrl": "https://dmtcode.com/registry/export.csv"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        
        <main className="relative z-10 pt-20">
          <RegistryHero />
          <RegistryRationale />
          <RegistryStatistics />
          <RegistrySubmissionForm />
          <RegistryBrowser />
          <RegistryResources />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Registry;
