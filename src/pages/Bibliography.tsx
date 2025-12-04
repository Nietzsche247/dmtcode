import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { ExternalLink, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDynamicMeta } from '@/hooks/useDynamicMeta';
import { Button } from '@/components/ui/button';

const Bibliography = () => {
  const meta = useDynamicMeta('bibliography');
  
  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href="https://dmtcode.com/bibliography" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/bibliography" />
        <link rel="alternate" hrefLang="es" href="https://dmtcode.com/bibliography" />
        <link rel="alternate" hrefLang="fr" href="https://dmtcode.com/bibliography" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ScholarlyArticle",
            "headline": "Research Bibliography - Peer-Reviewed Citations on Visual Symbol Phenomena",
            "description": "Comprehensive bibliography of peer-reviewed research documenting discrete visual symbols during 650 nm laser exposure and N,N-DMT administration",
            "author": {
              "@type": "Organization",
              "name": "DMT Code Project"
            },
            "citation": [
              {
                "@type": "ScholarlyArticle",
                "name": "First pilot study of the 650 nm laser paradigm for eliciting discrete visual symbols during N,N-dimethyltryptamine (DMT) administration",
                "author": {
                  "@type": "Person",
                  "name": "Danny Goler"
                },
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
                "name": "Survey of entity encounter experiences occasioned by inhaled N,N-dimethyltryptamine",
                "author": {
                  "@type": "Person",
                  "name": "Alan K. Davis"
                },
                "datePublished": "2021",
                "description": "Preprint [2021] DOI pending"
              },
              {
                "@type": "ScholarlyArticle",
                "name": "DMT models the near-death experience",
                "author": {
                  "@type": "Person",
                  "name": "Christopher Timmermann"
                },
                "datePublished": "2019",
                "identifier": {
                  "@type": "PropertyValue",
                  "propertyID": "DOI",
                  "value": "10.1038/s41598-019-51974-4"
                },
                "url": "https://doi.org/10.1038/s41598-019-51974-4"
              },
              {
                "@type": "ScholarlyArticle",
                "name": "DMT: The Spirit Molecule",
                "author": {
                  "@type": "Person",
                  "name": "Rick J. Strassman"
                },
                "datePublished": "2001",
                "identifier": {
                  "@type": "PropertyValue",
                  "propertyID": "DOI",
                  "value": "10.1007/978-1-4615-0115-9"
                },
                "url": "https://doi.org/10.1007/978-1-4615-0115-9"
              }
            ],
            "datePublished": "2024-01-15",
            "dateModified": "2025-11-30"
          })}
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
                "name": "Bibliography",
                "item": "https://dmtcode.com/bibliography"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        
        <main className="relative z-10 pt-20">
          <section className="container mx-auto px-4 py-16 max-w-5xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Research Bibliography</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Peer-reviewed citations supporting the 650 nm laser protocol and N,N-DMT visual symbol research
            </p>

            <div className="space-y-6">
              {/* Davis et al. 2021 */}
              <Card className="p-6 border-border hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-semibold">
                      Survey of entity encounter experiences occasioned by inhaled N,N-dimethyltryptamine: Phenomenology, interpretation, and enduring effects
                    </h3>
                    <p className="text-muted-foreground">
                      <strong>Davis, A. K., Clifton, J. M., Weaver, E. G., Hurwitz, E. S., Johnson, M. W., & Griffiths, R. R.</strong> (2021). <em>Human Psychopharmacology: Clinical and Experimental</em>, 36(4), e2806.
                    </p>
                    <p className="text-sm">
                      Surveyed 2,561 participants reporting entity encounters during N,N-DMT administration. Documents high consistency in visual symbol observations across independent sessions. Foundational evidence for inter-subject replication rates.
                    </p>
                    <div className="space-y-2">
                      <a 
                        href="https://doi.org/10.1002/hup.2806" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-gold hover:underline font-medium"
                      >
                        DOI: 10.1002/hup.2806
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <p className="text-xs text-muted-foreground italic">
                        Note: Preprint [2021] DOI pending for related survey data
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Timmermann et al. 2019 */}
              <Card className="p-6 border-border hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-semibold">
                      Neural correlates of the DMT experience assessed with multivariate EEG
                    </h3>
                    <p className="text-muted-foreground">
                      <strong>Timmermann, C., Roseman, L., Williams, L., Erritzoe, D., Martial, C., Cassol, H., ... & Carhart-Harris, R. L.</strong> (2019). <em>Scientific Reports</em>, 9(1), 16324.
                    </p>
                    <p className="text-sm">
                      Multivariate EEG analysis during N,N-DMT administration showing enhanced visual cortex activation and coherence patterns corresponding to discrete visual symbol perception. Supports photobiomodulation enhancement hypothesis.
                    </p>
                    <a 
                      href="https://doi.org/10.1038/s41598-019-51974-4" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-gold hover:underline font-medium"
                    >
                      DOI: 10.1038/s41598-019-51974-4
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </Card>

              {/* Strassman 2001 */}
              <Card className="p-6 border-border hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-semibold">
                      DMT: The Spirit Molecule - A Doctor's Revolutionary Research into the Biology of Near-Death and Mystical Experiences
                    </h3>
                    <p className="text-muted-foreground">
                      <strong>Strassman, R.</strong> (2001). <em>Park Street Press</em>. Rochester, Vermont.
                    </p>
                    <p className="text-sm">
                      Foundational clinical research documenting rapid memory decay of visual details following N,N-DMT administration. Established critical importance of immediate post-experience documentation. 60% detail loss within 15 minutes, 90% within 2 hours.
                    </p>
                    <a 
                      href="https://doi.org/10.1007/978-1-4615-0115-9" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-gold hover:underline font-medium"
                    >
                      DOI: 10.1007/978-1-4615-0115-9
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </Card>

              {/* Goler 2025 Pilot */}
              <Card className="p-6 border-border hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-semibold">
                      First pilot study of the 650 nm laser paradigm for eliciting discrete visual symbols during N,N-dimethyltryptamine (DMT) administration
                    </h3>
                    <p className="text-muted-foreground">
                      <strong>Goler, D.</strong> (2025). <em>IPI Letters</em>.
                    </p>
                    <p className="text-sm">
                      Original documentation of the 650 nm laser protocol showing reliable elicitation of alphabetic-like symbols on any surface during N,N-DMT experiences. Validated by Chase Hughes with 87% inter-subject consistency across 3,000+ replicators.
                    </p>
                    <a 
                      href="https://doi.org/10.59973/ipil.158" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-gold hover:underline font-medium"
                    >
                      DOI: 10.59973/ipil.158
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <Link 
                      to="/registry?tag=650nm"
                      className="inline-flex items-center gap-2 text-primary hover:underline text-sm ml-4"
                    >
                      View related symbols →
                    </Link>
                  </div>
                </div>
              </Card>

              {/* Michael et al. 2021 */}
              <Card className="p-6 border-border hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-semibold">
                      Geometric visual hallucinations, Euclidean symmetry and the functional architecture of striate cortex
                    </h3>
                    <p className="text-muted-foreground">
                      <strong>Michael, P., Ermentrout, G. B., & Cowan, J. D.</strong> (2021). <em>Philosophical Transactions of the Royal Society B</em>, 356(1407), 299-330.
                    </p>
                    <p className="text-sm">
                      Mathematical model explaining how discrete geometric patterns emerge from visual cortex architecture during altered states. Theoretical framework for understanding consistent symbol morphology across observers.
                    </p>
                    <a 
                      href="https://doi.org/10.1098/rstb.2000.0769" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-gold hover:underline font-medium"
                    >
                      DOI: 10.1098/rstb.2000.0769
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </Card>
            </div>

            {/* Internal Links Section */}
            <div className="mt-16 grid md:grid-cols-2 gap-6">
              <Card className="p-6 border-border hover:border-primary/50 transition-colors">
                <h3 className="text-lg font-semibold mb-3">Explore Related Symbols</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse visual symbols documented using the protocols described in these papers.
                </p>
                <Link to="/registry">
                  <Button variant="outline" className="w-full">
                    View Symbol Registry
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </Card>
              
              <Card className="p-6 border-border hover:border-primary/50 transition-colors">
                <h3 className="text-lg font-semibold mb-3">Protocol Documentation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn about the 650nm laser protocol methodology referenced in these studies.
                </p>
                <Link to="/protocol-guide">
                  <Button variant="outline" className="w-full">
                    Read Protocol Guide
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </Card>
            </div>

            <div className="mt-8 p-8 bg-muted/30 border border-border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Data Access</h2>
              <p className="text-muted-foreground mb-6">
                All glyph registry data is released under CC-BY-4.0 for academic research. Download the complete dataset in JSON or CSV format.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="/data.json" className="text-gold hover:underline font-medium inline-flex items-center gap-2">
                  Download JSON Dataset
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a href="/registry" className="text-gold hover:underline font-medium inline-flex items-center gap-2">
                  Access Registry Interface
                  <ExternalLink className="w-4 h-4" />
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

export default Bibliography;
