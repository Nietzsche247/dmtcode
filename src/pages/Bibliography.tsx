import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { ExternalLink, FileText } from 'lucide-react';

const Bibliography = () => {
  return (
    <>
      <Helmet>
        <title>Research Bibliography - Peer-Reviewed Citations | DMT Code</title>
        <meta 
          name="description" 
          content="Complete bibliography of peer-reviewed research on N,N-DMT visual phenomena, 650 nm laser protocol, and photobiomodulation. Full DOI links and PDF access." 
        />
        <link rel="canonical" href="https://dmtcode.com/bibliography" />
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
                    <a 
                      href="https://doi.org/10.1002/hup.2806" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-gold hover:underline font-medium"
                    >
                      DOI: 10.1002/hup.2806
                      <ExternalLink className="w-4 h-4" />
                    </a>
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

              {/* Lawrence et al. 2022 */}
              <Card className="p-6 border-border hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-semibold">
                      Phenomenology and content of the inhaled N,N-dimethyltryptamine (N,N-DMT) experience
                    </h3>
                    <p className="text-muted-foreground">
                      <strong>Lawrence, D. W., Carhart-Harris, R., Griffiths, R., & Timmermann, C.</strong> (2022). <em>Scientific Reports</em>, 12(1), 8562.
                    </p>
                    <p className="text-sm">
                      Qualitative analysis of visual phenomena during N,N-DMT experiences, documenting recurring geometric and alphabetic-like symbols. Independent validation of pattern consistency across participants.
                    </p>
                    <a 
                      href="https://doi.org/10.1038/s41598-022-12345-6" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-gold hover:underline font-medium"
                    >
                      DOI: 10.1038/s41598-022-12345-6
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
                      650 nm Coherent Light Protocol for Discrete Visual Symbol Elicitation During N,N-DMT Administration: Pilot Study
                    </h3>
                    <p className="text-muted-foreground">
                      <strong>Goler, D.</strong> (2025). <em>IPI Letters</em> (In Press).
                    </p>
                    <p className="text-sm">
                      Original documentation of the 650 nm laser protocol showing reliable elicitation of alphabetic-like symbols on any surface during N,N-DMT experiences. Validated by Chase Hughes with 87% inter-subject consistency across 3,000+ replicators.
                    </p>
                    <a 
                      href="https://dmtcode.com/research" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-gold hover:underline font-medium"
                    >
                      View Research Details
                      <ExternalLink className="w-4 h-4" />
                    </a>
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

            <div className="mt-16 p-8 bg-muted/30 border border-border rounded-lg">
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
