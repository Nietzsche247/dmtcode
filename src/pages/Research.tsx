import { ParticleBackground } from '@/components/ParticleBackground';
import { Navigation } from '@/components/Navigation';
import { ResearchSection } from '@/components/ResearchSection';
import { TheoriesSection } from '@/components/TheoriesSection';
import { CommunityGlyphCodex } from '@/components/CommunityGlyphCodex';
import { TheoriesDashboard } from '@/components/TheoriesDashboard';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Helmet } from 'react-helmet';

const Research = () => {
  return (
    <>
      <Helmet>
        <title>Published Research & Literature | DMT Code</title>
        <meta 
          name="description" 
          content="Academic papers, studies, and publications related to the DMT laser code phenomenon." 
        />
        <link rel="canonical" href="https://dmtcode.com/research" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/research" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dmtcode.com/" },
              { "@type": "ListItem", "position": 2, "name": "Research", "item": "https://dmtcode.com/research" }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ScholarlyArticle",
            "headline": "DMT Code Scientific Research Repository",
            "description": "Peer-reviewed research on N,N-DMT phenomenology, visual symbols, and 650nm laser protocol",
            "author": { "@type": "Organization", "name": "DMT Code Project" },
            "datePublished": "2025-01-01",
            "dateModified": "2025-11-28",
            "license": "https://creativecommons.org/licenses/by/4.0/",
            "citation": [
              { "@type": "ScholarlyArticle", "name": "Survey of entity encounter experiences", "author": "Davis et al.", "datePublished": "2021", "url": "https://doi.org/10.1002/hup.2806" },
              { "@type": "ScholarlyArticle", "name": "Neural correlates of the DMT experience", "author": "Timmermann et al.", "datePublished": "2019", "url": "https://doi.org/10.1038/s41598-019-51974-4" },
              { "@type": "Book", "name": "DMT: The Spirit Molecule", "author": "Strassman", "datePublished": "2001", "url": "https://doi.org/10.1007/978-1-4615-0115-9" }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen">
        <ParticleBackground />
        
        <main id="main-content" className="relative z-10" role="main">
          <Navigation />
          <Breadcrumb />
          <div className="pt-4">
            <div className="container mx-auto px-4">
              <a
                href="/trials"
                className="label-data inline-flex items-center gap-2 rounded border border-border/60 px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                → CLINICAL TRIALS OBSERVATORY
              </a>
            </div>
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
