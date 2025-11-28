import { ParticleBackground } from '@/components/ParticleBackground';
import { Navigation } from '@/components/Navigation';
import { ResearchSection } from '@/components/ResearchSection';
import { TheoriesSection } from '@/components/TheoriesSection';
import { CommunityGlyphCodex } from '@/components/CommunityGlyphCodex';
import { TheoriesDashboard } from '@/components/TheoriesDashboard';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';

const Research = () => {
  return (
    <>
      <Helmet>
        <title>Research | DMT Code Visual Symbol Catalogue</title>
        <meta 
          name="description" 
          content="Peer-reviewed research on 650 nm laser protocol and N,N-DMT visual phenomena. Davis 2021, Timmermann 2019, Goler 2025, and 20+ scientific papers." 
        />
        <link rel="canonical" href="https://dmtcode.com/research" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/research" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ScholarlyArticle",
            "headline": "DMT Code Scientific Research Repository",
            "description": "Peer-reviewed research on N,N-DMT phenomenology, visual symbols, and 650nm laser protocol",
            "author": {
              "@type": "Organization",
              "name": "DMT Code Project"
            },
            "datePublished": "2025-01-01",
            "dateModified": "2025-11-28",
            "license": "https://creativecommons.org/licenses/by/4.0/",
            "citation": [
              {
                "@type": "ScholarlyArticle",
                "name": "Survey of entity encounter experiences",
                "author": "Davis et al.",
                "datePublished": "2021",
                "url": "https://doi.org/10.1002/hup.2806"
              },
              {
                "@type": "ScholarlyArticle",
                "name": "Neural correlates of the DMT experience",
                "author": "Timmermann et al.",
                "datePublished": "2019",
                "url": "https://doi.org/10.1038/s41598-019-51974-4"
              },
              {
                "@type": "Book",
                "name": "DMT: The Spirit Molecule",
                "author": "Strassman",
                "datePublished": "2001",
                "url": "https://doi.org/10.1007/978-1-4615-0115-9"
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
            <ResearchSection />
            <TheoriesSection />
            <TheoriesDashboard />
            <CommunityGlyphCodex />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Research;
