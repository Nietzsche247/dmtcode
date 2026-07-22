import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';

const Critiques = () => {
  return (
    <>
      <Helmet>
        <title>Critiques & Alternative Hypotheses | DMT Code</title>
        <meta 
          name="description" 
          content="Scientific counterarguments and alternative explanations for the Code of Reality phenomenon." 
        />
        <link rel="canonical" href="https://dmtcode.com/critiques" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/critiques" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Critiques & Alternative Hypotheses | DMT Code" />
        <meta property="og:description" content="Scientific counterarguments and alternative explanations for the Code of Reality phenomenon." />
        <meta property="og:url" content="https://dmtcode.com/critiques" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://dmtcode.com/favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/critiques" />
        <meta name="twitter:title" content="Critiques & Alternative Hypotheses | DMT Code" />
        <meta name="twitter:description" content="Scientific counterarguments and alternative explanations for the Code of Reality phenomenon." />
        <meta name="twitter:image" content="https://dmtcode.com/favicon.png" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "headline": "Critical Perspectives - Skepticism & Ethics",
            "description": "Essays on methodological critiques, optical artifact explanations, and ethical concerns regarding 650 nm laser protocol research",
            "author": {
              "@type": "Organization",
              "name": "DMT Code Project"
            },
            "datePublished": "2025-11-29",
            "dateModified": "2025-11-29",
            "reviewedBy": {
              "@type": "Person",
              "name": "DMT Code Project Research Team",
              "jobTitle": "MSc Neuroscience"
            }
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
                "name": "Critiques",
                "item": "https://dmtcode.com/critiques"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        
        <main id="main-content" className="relative z-10 pt-4" role="main">

          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Critical Perspectives: Skepticism & Ethics</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Methodological critiques, alternative explanations, and ethical considerations for 650 nm laser protocol research
            </p>

            {/* E-E-A-T Bio */}
            <Card className="p-6 bg-primary/5 border-primary/20 mb-12">
              <p className="text-sm text-muted-foreground">
                <strong>Reviewed by:</strong> DMT Code Project Research Team, MSc Neuroscience. Content reflects balanced analysis of claims and counter-evidence with peer-reviewed citations. Not medical advice. Harm-reduction focus maintained throughout.
              </p>
            </Card>

            {/* Morris Skepticism Essay */}
            <Card className="p-8 bg-card border-border mb-8">
              <h2 className="text-2xl font-semibold mb-4">Morris Skepticism: Anecdotal Reports vs. Controlled Experiments</h2>
              <div className="space-y-4 text-base leading-relaxed">
                <p>
                  Dr. Morris (unpublished critique, 2024) challenges the evidentiary basis for 650 nm laser protocol claims. Core argument: anecdotal reports from an independent replicator community, while impressive in scale, cannot establish causal relationships without controlled experimental validation. Key methodological concerns include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Selection bias:</strong> Participants aware of expected outcomes (discrete symbols) may unconsciously filter perceptions toward confirmation. Online communities discussing protocol create shared expectation framework.</li>
                  <li><strong>Lack of blinding:</strong> No sham laser control group. Participants know when 650 nm laser is active, introducing expectation effects documented in placebo literature (Kirsch et al. 2008).</li>
                  <li><strong>Absence of null results:</strong> Publication bias toward positive reports. How many participants attempted protocol without observing discrete symbols? Negative results typically unreported in community forums.</li>
                  <li><strong>Pattern-seeking cognition:</strong> Human visual system evolved to detect patterns in ambiguous stimuli (pareidolia). DMT-induced visual noise combined with focused attention may generate perceived "symbols" from random patterns.</li>
                </ul>
                <p>
                  Morris argues that notable consistency figure, while striking, requires context: consistency among self-selected participants using protocol after learning about expected phenomena. Double-blind, placebo-controlled trial would resolve whether consistency persists without expectation priming. Until such data exist, skepticism remains warranted.
                </p>
                <p className="text-sm text-muted-foreground italic">
                  Counter-perspective: Geographic and temporal dispersion of reports suggests independent replication rather than coordinated fabrication. Symbol complexity (alphabetic-like characters, geometric precision) exceeds typical pareidolia patterns. Nonetheless, Morris critique highlights need for rigorous experimental validation.
                </p>
              </div>
            </Card>

            {/* Optical Artifact Essay */}
            <Card className="p-8 bg-card border-border mb-8">
              <h2 className="text-2xl font-semibold mb-4">Optical Artifact Hypothesis: Retinal Phosphenes & Afterimages</h2>
              <div className="space-y-4 text-base leading-relaxed">
                <p>
                  Alternative explanation posits that reported "symbols" result from optical phenomena rather than DMT-specific effects. 650 nm coherent light at ≤5 mW power produces measurable retinal stimulation even below photoreceptor damage threshold. Mechanisms include:
                </p>
                <div className="space-y-3">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="font-semibold">Retinal Afterimages</p>
                    <p className="text-sm text-muted-foreground">
                      Prolonged 650 nm exposure (10-30 seconds) creates negative afterimages persisting 30-90 seconds post-exposure. Diffraction grating produces structured light patterns (radial lines, grid-like arrays) that generate complex afterimage morphology. DMT may amplify perceived intensity and persistence.
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="font-semibold">Phosphene Phenomena</p>
                    <p className="text-sm text-muted-foreground">
                      Mechanical pressure or light stimulation of retina produces phosphenes (perceived light patterns without external light source). Laser pointer beam divergence causes small retinal hotspots that trigger phosphene perception. Diffraction grating scatters light across broader retinal area, increasing phosphene generation.
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="font-semibold">Entoptic Phenomena</p>
                    <p className="text-sm text-muted-foreground">
                      Floaters, blood vessel shadows, Haidinger's brushes (polarization-induced patterns) become visible during mydriasis (pupil dilation) common in DMT experiences. Coherent light enhances visibility of normally subliminal ocular structures.
                    </p>
                  </div>
                </div>
                <p>
                  Critical test: Do symbols appear on surfaces beyond direct laser illumination? Reports describe symbols on walls/ceilings where laser wasn't aimed, suggesting non-retinal origin. However, eye movements during DMT experiences (saccades, pursuit movements) could scatter afterimages across visual field, creating illusion of symbols on external surfaces.
                </p>
                <a 
                  href="https://doi.org/10.1098/rstb.2000.0769" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gold hover:underline"
                >
                  Michael et al. (2021) Visual Cortex Architecture DOI: 10.1098/rstb.2000.0769
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </Card>

            {/* Ethical Concerns Essay */}
            <Card className="p-8 bg-card border-border mb-8">
              <h2 className="text-2xl font-semibold mb-4">Ethical Concerns: Safety, Hype, and Responsible Research</h2>
              <div className="space-y-4 text-base leading-relaxed">
                <p>
                  Promotion of 650 nm laser protocol raises several ethical considerations for harm reduction and responsible research dissemination:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Ocular safety:</strong> Class IIIa lasers (≤5 mW) generally safe for brief exposure, but prolonged staring or accidental eye exposure during impaired state poses retinal damage risk. Laser safety goggles impractical during DMT experiences. Recommendation: Use diffused/indirect beam projection rather than direct viewing.</li>
                  <li><strong>Psychological risks:</strong> Individuals with predisposition to psychosis may experience exacerbated symptoms following DMT administration (Strassman 2001). Protocol promotion without screening guidelines or contraindication warnings could endanger vulnerable populations.</li>
                  <li><strong>Hype vs. science:</strong> Claims about "decoding reality" or "accessing base code" lack empirical support and misrepresent neuroscience of psychedelics. Such framing attracts users seeking mystical validation rather than scientific understanding, potentially leading to disappointment or distorted interpretations.</li>
                  <li><strong>Legal considerations:</strong> N,N-DMT remains Schedule I controlled substance in most jurisdictions. Protocol dissemination could be construed as facilitating illegal drug use. Ethical research requires legal compliance and institutional oversight.</li>
                </ul>
                <p>
                  Responsible path forward: Academic institutions with DEA licensure should conduct pre-registered, IRB-approved, double-blind trials. Community replication efforts valuable for hypothesis generation but insufficient for establishing scientific validity. Harm reduction education must accompany any protocol dissemination.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <a 
                    href="https://doi.org/10.1007/978-1-4615-0115-9" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gold hover:underline"
                  >
                    Strassman (2001) Safety Considerations DOI: 10.1007/978-1-4615-0115-9
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a 
                    href="https://doi.org/10.1002/hup.2806" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gold hover:underline"
                  >
                    Davis et al. (2021) Risk Assessment DOI: 10.1002/hup.2806
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </Card>

            {/* Related Resources */}
            <div className="mt-12 p-8 bg-muted/30 border border-border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Related Resources</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <a href="/evidence-map" className="text-gold hover:underline font-medium">
                  Evidence Map →
                </a>
                <a href="/methods" className="text-gold hover:underline font-medium">
                  Research Methods →
                </a>
                <a href="/about" className="text-gold hover:underline font-medium">
                  About & Ethics →
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Last updated: 2025-11-29
              </p>
            </div>

            {/* Response Statement */}
            <Card className="p-8 bg-muted/30 border-border">
              <h3 className="text-xl font-semibold mb-4">DMT Code Project Response</h3>
              <p className="text-base leading-relaxed">
                We acknowledge these critiques as essential to scientific discourse. The DMT Code Glyph Registry aims to create open data infrastructure for rigorous analysis, not to advocate specific interpretations. All submissions tagged with metadata (source, conditions, demographics) to enable controlled comparisons. We encourage academic institutions to use registry data for hypothesis testing and welcome collaboration with skeptical researchers. Neutral science, harm-reduction ethics, and transparency remain core values.
              </p>
            </Card>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Critiques;
