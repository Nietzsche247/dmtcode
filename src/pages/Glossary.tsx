import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Helmet } from 'react-helmet';
import { SEO } from '@/components/SEO';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { terms, termSlug } from '@/data/glossaryTerms';

const Glossary = () => {
  const termSetLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": "https://dmtcode.com/glossary#termset",
    "url": "https://dmtcode.com/glossary",
    "name": "DMT Code Glossary of Terms",
    "description": "Technical definitions for 650 nm laser protocol and visual symbol classification",
    "hasDefinedTerm": terms.map((item) => ({
      "@type": "DefinedTerm",
      "@id": `https://dmtcode.com/glossary#${termSlug(item.term)}`,
      "url": `https://dmtcode.com/glossary#${termSlug(item.term)}`,
      "name": item.term,
      "description": item.definition,
      "inDefinedTermSet": "https://dmtcode.com/glossary#termset"
    }))
  };

  return (
    <>
      <SEO uiKey="glossary" path="/glossary" />
      <Helmet>
        <title>Terminology & Definitions | DMT Code</title>
        <meta 
          name="description" 
          content="Scientific glossary of terms used in Code of Reality research and psychedelic phenomenology." 
        />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Terminology & Definitions | DMT Code" />
        <meta property="og:description" content="Scientific glossary of terms used in Code of Reality research and psychedelic phenomenology." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://dmtcode.com/favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/glossary" />
        <meta name="twitter:title" content="Terminology & Definitions | DMT Code" />
        <meta name="twitter:description" content="Scientific glossary of terms used in Code of Reality research and psychedelic phenomenology." />
        <meta name="twitter:image" content="https://dmtcode.com/favicon.png" />

        <script type="application/ld+json">
          {JSON.stringify(termSetLd)}
        </script>
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
                "name": "Glossary",
                "item": "https://dmtcode.com/glossary"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        
        <main id="main-content" className="relative z-10 pt-4" role="main">
          <section className="container mx-auto px-4 py-16 max-w-5xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Glossary of Terms</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Technical definitions for 650 nm laser protocol and visual symbol classification
            </p>

            <div className="grid gap-6">
              {terms.map((item) => {
                const slug = termSlug(item.term);
                return (
                  <Card key={item.term} id={slug} className="p-6 border-border hover:border-primary/50 transition-colors scroll-mt-24">
                    <h3 className="text-xl font-semibold text-gold mb-3">
                      <a href={`#${slug}`}>{item.term}</a>
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">{item.definition}</p>
                  </Card>
                );
              })}
            </div>

            <div className="mt-16 p-8 bg-muted/30 border border-border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Contribute to Definitions</h2>
              <p className="text-muted-foreground mb-6">
                This glossary evolves as community understanding of visual symbol phenomena expands. Submit corrections or new term proposals via the registry feedback system.
              </p>
              <Link to="/registry" className="text-gold hover:underline font-medium">
                Access Registry →
              </Link>
            </div>

            <div className="mt-8 p-8 bg-muted/30 border border-border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Related Resources</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Link to="/faq" className="text-gold hover:underline font-medium">
                  FAQ →
                </Link>
                <Link to="/protocol-guide" className="text-gold hover:underline font-medium">
                  Protocol Guide →
                </Link>
                <Link to="/bibliography" className="text-gold hover:underline font-medium">
                  Bibliography →
                </Link>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Glossary;
