import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';

const EvidenceMap = () => {
  return (
    <>
      <Helmet>
        <title>Evidence Map - Claims & Counter-Evidence | DMT Code</title>
        <meta 
          name="description" 
          content="Balanced analysis of claims and counter-evidence for 650 nm laser protocol and N,N-DMT visual symbols. Pro/con table with peer-reviewed citations." 
        />
        <link rel="canonical" href="https://dmtcode.com/evidence-map" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/evidence-map" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "headline": "Evidence Map - Claims & Counter-Evidence Analysis",
            "description": "Balanced analysis of claims and counter-evidence for 650 nm laser protocol and N,N-DMT visual symbols",
            "author": {
              "@type": "Organization",
              "name": "DMT Code Project"
            },
            "datePublished": "2025-11-27",
            "dateModified": "2025-11-27"
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        
        <main className="relative z-10 pt-20">
          <div className="block md:hidden">
            <Breadcrumb />
          </div>

          <section className="container mx-auto px-4 py-16 max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Evidence Map: Claims & Counter-Evidence</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Balanced analysis of reported phenomena, methodological critiques, and alternative explanations with peer-reviewed citations
            </p>

            {/* Summary Overview */}
            <Card className="p-8 bg-muted/30 border-border mb-12">
              <h2 className="text-2xl font-semibold mb-6">Research Landscape Overview</h2>
              <div className="space-y-4 text-base leading-relaxed">
                <p>
                  The 650 nm laser protocol developed by Danny Goler (2025) reports discrete visual symbols during N,N-DMT administration with 87% inter-subject consistency across 3,000+ replicators. This phenomenon intersects multiple research domains: psychopharmacology (Timmermann 2019), neuroscience of geometric hallucinations (Michael et al. 2021), and phenomenology of psychedelic experiences (Davis et al. 2021).
                </p>
                <p>
                  Critical perspectives include optical artifact hypotheses (retinal afterimages, phosphene phenomena), methodological concerns about blinding and expectation effects, and simulation hypothesis interpretations. This evidence map presents claims and counter-evidence with equal weight.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Primary claim:</strong> 650 nm coherent light exposure during N,N-DMT experiences elicits consistent, reproducible visual symbols</li>
                  <li><strong>Key critique:</strong> Lack of double-blind, placebo-controlled experimental validation</li>
                  <li><strong>Alternative explanation:</strong> Optical artifacts (retinal phosphenes, afterimages) combined with pattern-seeking cognition</li>
                  <li><strong>Methodological gap:</strong> No control experiments with non-psychoactive substances or sham laser devices</li>
                </ul>
              </div>
            </Card>

            {/* Evidence Table */}
            <div className="overflow-x-auto mb-12">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary/10 border-b-2 border-primary">
                    <th className="text-left p-4 font-semibold">Claim</th>
                    <th className="text-left p-4 font-semibold">Supporting Evidence</th>
                    <th className="text-left p-4 font-semibold">Counter-Evidence / Critique</th>
                    <th className="text-left p-4 font-semibold">Citation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="p-4 align-top">
                      <strong>Goler Protocol Reproducibility</strong>
                      <p className="text-sm text-muted-foreground mt-1">
                        650 nm laser + diffraction grating elicits consistent visual symbols during N,N-DMT experiences
                      </p>
                    </td>
                    <td className="p-4 align-top text-sm">
                      87% inter-subject consistency across 3,000+ replicators. Independent reports describe identical symbol morphology (alphabetic-like characters, geometric patterns).
                    </td>
                    <td className="p-4 align-top text-sm">
                      No peer-reviewed, double-blind trials published. Consistency could result from shared expectations, online discussion groups priming observations, or optical artifacts common to all participants.
                    </td>
                    <td className="p-4 align-top text-sm">
                      <a href="https://dmtcode.com/research" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline inline-flex items-center gap-1">
                        Goler 2025 <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>

                  <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="p-4 align-top">
                      <strong>Morris Skepticism</strong>
                      <p className="text-sm text-muted-foreground mt-1">
                        Critique of reproducibility claims and lack of controlled experimental design
                      </p>
                    </td>
                    <td className="p-4 align-top text-sm">
                      Morris (unpublished observations) notes absence of control groups, placebo conditions, or blinded experimenters. Argues anecdotal reports cannot establish causal relationship between laser and symbol appearance.
                    </td>
                    <td className="p-4 align-top text-sm">
                      Goler/Hughes dataset shows consistent reports across geographically dispersed, independent observers with no prior contact. Pattern complexity exceeds simple retinal phosphenes.
                    </td>
                    <td className="p-4 align-top text-sm">
                      <span className="text-muted-foreground">Morris critique (unpublished)</span>
                    </td>
                  </tr>

                  <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="p-4 align-top">
                      <strong>Optical Artifact Hypothesis</strong>
                      <p className="text-sm text-muted-foreground mt-1">
                        Symbols are retinal afterimages, phosphenes, or diffraction grating visual effects
                      </p>
                    </td>
                    <td className="p-4 align-top text-sm">
                      650 nm coherent light exposure can produce retinal afterimages and phosphene phenomena. Diffraction gratings create predictable visual patterns. These effects occur without psychoactive substances.
                    </td>
                    <td className="p-4 align-top text-sm">
                      Participants report symbols appearing on diverse surfaces (walls, ceilings, skin, closed eyelids) beyond retinal field. Symbol complexity and alphabetic-like structures exceed typical phosphene morphology. Persistence differs from afterimage timescales.
                    </td>
                    <td className="p-4 align-top text-sm">
                      <a href="https://doi.org/10.1098/rstb.2000.0769" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline inline-flex items-center gap-1">
                        Michael et al. 2021 <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>

                  <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="p-4 align-top">
                      <strong>Simulation Hypothesis</strong>
                      <p className="text-sm text-muted-foreground mt-1">
                        Visual symbols represent "base code" of simulated reality revealed during altered consciousness
                      </p>
                    </td>
                    <td className="p-4 align-top text-sm">
                      Alphabetic-like character morphology suggests information encoding. Consistent appearance across observers implies non-subjective origin. Participants describe symbols as "alien writing" or "reality substrate."
                    </td>
                    <td className="p-4 align-top text-sm">
                      Simulation hypothesis lacks testable predictions or falsifiable framework. Pattern recognition in ambiguous stimuli is well-documented cognitive phenomenon (pareidolia). No mechanism proposed for how DMT would "reveal" computational substrate.
                    </td>
                    <td className="p-4 align-top text-sm">
                      <span className="text-muted-foreground">Speculative interpretation</span>
                    </td>
                  </tr>

                  <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="p-4 align-top">
                      <strong>Visual Cortex Form Constants</strong>
                      <p className="text-sm text-muted-foreground mt-1">
                        Geometric hallucinations arise from V1 cortex architecture during altered states
                      </p>
                    </td>
                    <td className="p-4 align-top text-sm">
                      Michael et al. (2021) mathematical model explains how V1 cortex generates tunnels, spirals, honeycombs during psychedelic states. Form constants show cross-cultural consistency. Neuroanatomical basis well-established.
                    </td>
                    <td className="p-4 align-top text-sm">
                      Goler protocol symbols differ from classical form constants (tunnels, spirals). Alphabetic-like characters not predicted by V1 architecture models. Laser-dependent appearance suggests external stimulus interaction beyond endogenous cortical patterns.
                    </td>
                    <td className="p-4 align-top text-sm">
                      <a href="https://doi.org/10.1098/rstb.2000.0769" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline inline-flex items-center gap-1">
                        Michael et al. 2021 <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Call to Action */}
            <Card className="p-8 bg-primary/5 border-primary/20">
              <h3 className="text-2xl font-semibold mb-4">Experimental Next Steps</h3>
              <p className="text-muted-foreground mb-6">
                Rigorous experimental designs could resolve key uncertainties: double-blind trials with sham laser devices, control experiments with non-psychoactive substances, analysis of symbol morphology vs. classical form constants, replication with diverse light wavelengths.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild variant="default" size="lg">
                  <a href="/methods">View Research Methods →</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="/critiques">Read Full Critiques →</a>
                </Button>
              </div>
            </Card>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default EvidenceMap;
