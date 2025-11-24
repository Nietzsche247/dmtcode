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
        <title>DMT Code Research - Peer-Reviewed Studies & Community Findings</title>
        <meta 
          name="description" 
          content="Comprehensive collection of peer-reviewed DMT research including Goler's 2025 Protocol in IPI Letters, Davis et al. entity surveys, Timmermann neural correlates, and 20+ scientific papers on DMT phenomenology." 
        />
        <link rel="canonical" href="https://dmtcode.com/research" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ScholarlyArticle",
            "headline": "DMT Code Scientific Research Repository",
            "description": "Peer-reviewed research on DMT phenomenology, entity encounters, and the 650nm laser protocol",
            "dateModified": new Date().toISOString().split('T')[0]
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
