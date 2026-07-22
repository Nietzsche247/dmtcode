import { useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';

const EvidenceMap = () => {
  useEffect(() => {
    // Load TimelineJS CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.knightlab.com/libs/timeline3/latest/css/timeline.css';
    document.head.appendChild(link);

    // Load TimelineJS script
    const script = document.createElement('script');
    script.src = 'https://cdn.knightlab.com/libs/timeline3/latest/js/timeline.js';
    script.async = true;
    script.onload = () => {
      // Initialize timeline after script loads
      if (window.TL && window.TL.Timeline) {
        new window.TL.Timeline('timeline-embed', '/timeline.json', {
          initial_zoom: 5,
          start_at_end: false,
          hash_bookmark: true,
          scale_factor: 2,
          timenav_height: 200,
          marker_height_min: 30,
          marker_width_min: 100,
          default_bg_color: { r: 0, g: 0, b: 0 },
          font: 'bitter-raleway'
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Is the DMT code real? Evidence Timeline & Analysis | DMT Code</title>
        <meta 
          name="description" 
          content="Is the DMT code real? A balanced, both-sides evidence timeline with peer-reviewed citations, competing hypotheses, and stance-scored milestones from 1926 to 2025." 
        />
        <link rel="canonical" href="https://dmtcode.com/evidence-map" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ScholarlyArticle",
            "headline": "Evidence Timeline - 100 Years of DMT Visual Phenomena Research",
            "description": "Comprehensive timeline documenting research from Klüver's 1926 form constants to Goler's 2025 laser protocol pilot study",
            "author": [
              {
                "@type": "Person",
                "name": "Danny Goler",
                "affiliation": "Independent Researcher"
              }
            ],
            "citation": [
              {
                "@type": "ScholarlyArticle",
                "name": "First pilot study of the 650 nm laser paradigm for eliciting discrete visual symbols during N,N-dimethyltryptamine (DMT) administration",
                "author": "Goler D.",
                "datePublished": "2025",
                "identifier": {
                  "@type": "PropertyValue",
                  "propertyID": "DOI",
                  "value": "10.59973/ipil.158"
                },
                "url": "https://doi.org/10.59973/ipil.158"
              },
              {
                "@type": "ScholarlyArticle",
                "name": "Preprint [2021] DOI pending",
                "author": "Davis A.",
                "datePublished": "2021",
                "description": "Survey of entity encounter experiences"
              },
              {
                "@type": "ScholarlyArticle",
                "name": "DMT models the near-death experience",
                "author": "Timmermann C. et al.",
                "datePublished": "2019",
                "identifier": {
                  "@type": "PropertyValue",
                  "propertyID": "DOI",
                  "value": "10.1038/s41598-019-51974-4"
                },
                "url": "https://doi.org/10.1038/s41598-019-51974-4"
              }
            ],
            "datePublished": "2025-11-30",
            "dateModified": "2025-11-30"
          })}
        </script>
        <link rel="canonical" href="https://dmtcode.com/evidence-map" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/evidence-map" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Is the DMT code real? Evidence Timeline & Analysis | DMT Code" />
        <meta property="og:description" content="A balanced, both-sides evidence timeline with peer-reviewed citations and stance-scored milestones from 1926 to 2025." />
        <meta property="og:url" content="https://dmtcode.com/evidence-map" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://storage.googleapis.com/gpt-engineer-file-uploads/xpje0qbzg7e7wLYOGt4x2WGDXtR2/social-images/social-1763590629562-Webp.net-resizeimage-3.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/evidence-map" />
        <meta name="twitter:title" content="Is the DMT code real? Evidence Timeline & Analysis | DMT Code" />
        <meta name="twitter:description" content="A balanced, both-sides evidence timeline with peer-reviewed citations and stance-scored milestones from 1926 to 2025." />
        <meta name="twitter:image" content="https://storage.googleapis.com/gpt-engineer-file-uploads/xpje0qbzg7e7wLYOGt4x2WGDXtR2/social-images/social-1763590629562-Webp.net-resizeimage-3.png" />
        
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
                "name": "Evidence Timeline",
                "item": "https://dmtcode.com/evidence-map"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        
        <main id="main-content" className="relative z-10 pt-4" role="main">
          <section className="container mx-auto px-4 py-12 max-w-7xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Is the DMT code real?
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                A balanced, both-sides answer: 100 years of evidence, from Klüver's form constants (1926) to the 650 nm laser protocol (2025). Explore 30 stance-scored milestones with clickable DOIs and peer-reviewed citations.
              </p>
              <div className="mt-6">
                <a
                  href="/trials"
                  className="label-data inline-flex items-center gap-2 rounded border border-border/60 px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  → EXPLORE CLINICAL TRIALS OBSERVATORY
                </a>
              </div>
            </div>

            {/* Timeline Container */}
            <div 
              id="timeline-embed" 
              style={{ 
                width: '100%', 
                height: '700px',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'hsl(var(--background))'
              }}
            />

            {/* Context Note */}
            <div className="mt-12 p-6 bg-muted/30 border border-border rounded-lg">
              <h2 className="text-xl font-semibold mb-3 text-foreground">How to Use This Timeline</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Click any event</strong> to read full details and access DOI links</li>
                <li>• <strong>Drag the timeline</strong> to explore different periods</li>
                <li>• <strong>Zoom controls</strong> at bottom adjust detail level</li>
                <li>• <strong>Gold links</strong> connect to peer-reviewed publications</li>
              </ul>
            </div>

            {/* Related Resources */}
            <div className="mt-8 p-6 bg-muted/30 border border-border rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Related Resources</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <a href="/bibliography" className="text-gold hover:underline font-medium">
                  Bibliography →
                </a>
                <a href="/critiques" className="text-gold hover:underline font-medium">
                  Scientific Critiques →
                </a>
                <a href="/methods" className="text-gold hover:underline font-medium">
                  Methodology →
                </a>
                <a href="/null-reports" className="text-gold hover:underline font-medium">
                  Null Reports →
                </a>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

// Extend Window type for TimelineJS
declare global {
  interface Window {
    TL: {
      Timeline: new (containerId: string, dataSource: string, options?: any) => void;
    };
  }
}

export default EvidenceMap;
