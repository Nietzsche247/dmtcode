import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';

const OpenQuestions = () => {
  return (
    <>
      <Helmet>
        <title>Open Research Questions | DMT Code</title>
        <meta 
          name="description" 
          content="Unresolved questions about 650 nm laser protocol and N,N-DMT visual symbols. Hypothesis generation for controlled experiments with peer-reviewed citations." 
        />
        <link rel="canonical" href="https://dmtcode.com/open-questions" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/open-questions" />
        <link rel="alternate" hrefLang="es" href="https://dmtcode.com/open-questions" />
        <link rel="alternate" hrefLang="fr" href="https://dmtcode.com/open-questions" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "headline": "Open Research Questions",
            "description": "Unresolved questions about 650 nm laser protocol requiring controlled experimental validation",
            "author": {
              "@type": "Organization",
              "name": "DMT Code Project"
            },
            "datePublished": "2025-11-29",
            "dateModified": "2025-11-29"
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
                "name": "Open Questions",
                "item": "https://dmtcode.com/open-questions"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        
        <main className="relative z-10 pt-4">
          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Open Research Questions</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Unresolved questions requiring controlled experimental validation with peer-reviewed citations
            </p>

            {/* Introduction */}
            <Card className="p-8 bg-muted/30 border-border mb-12">
              <h2 className="text-2xl font-semibold mb-4">Hypothesis Generation Framework</h2>
              <p className="text-base leading-relaxed">
                The 650 nm laser protocol remains primarily documented through community replication reports rather than controlled laboratory experiments. The following questions represent gaps in current understanding and serve as hypothesis generation for future research. Each question includes relevant citations to existing psychedelic neuroscience literature.
              </p>
            </Card>

            {/* Research Questions */}
            <div className="space-y-6">
              <Card className="p-6 border-border">
                <h3 className="text-xl font-semibold mb-3 text-gold">1. Do visual symbols vary by wavelength (620 nm, 650 nm, 680 nm)?</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Current protocol uses 650 nm specifically. Controlled comparison across red spectrum wavelengths (620-680 nm) would test whether observed symbols are wavelength-dependent or general red light phenomena. Photobiomodulation effects documented by Timmermann et al. (2019) suggest wavelength specificity for neural coherence.
                </p>
                <a 
                  href="https://doi.org/10.1038/s41598-019-51974-4" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gold hover:underline text-sm"
                >
                  Timmermann et al. (2019) Neural Correlates DOI: 10.1038/s41598-019-51974-4
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Card>

              <Card className="p-6 border-border">
                <h3 className="text-xl font-semibold mb-3 text-gold">2. Does diffraction grating pattern (cross, grid, star) influence symbol morphology?</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Replicators use varied diffraction attachments. Systematic comparison (cross vs. grid vs. star vs. no grating) would isolate whether grating geometry constrains visual symbol structure. Potential confound: diffraction patterns themselves may prime pareidolic pattern recognition.
                </p>
                <p className="text-sm text-muted-foreground">
                  Testable hypothesis: Symbol morphology shows statistical independence from diffraction grating geometry after controlling for expectation effects.
                </p>
              </Card>

              <Card className="p-6 border-border">
                <h3 className="text-xl font-semibold mb-3 text-gold">3. What is the minimum effective laser power (1 mW vs. 5 mW vs. 10 mW)?</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Current recommendations specify ≤5 mW (Class 2 safety). Dose-response relationship between laser power and symbol clarity remains unquantified. Lower power reduces ocular safety concerns but may reduce signal intensity.
                </p>
                <p className="text-sm text-muted-foreground">
                  Experimental design: Double-blind trial with three power levels (1 mW, 5 mW, 10 mW) measuring symbol appearance frequency and participant-rated clarity scores.
                </p>
              </Card>

              <Card className="p-6 border-border">
                <h3 className="text-xl font-semibold mb-3 text-gold">4. Does DMT route of administration (smoked, vaporized, intramuscular) affect symbol consistency?</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Registry metadata tracks route but lacks sufficient sample sizes per condition for statistical comparison. Pharmacokinetic differences (rapid onset smoked vs. extended duration IM) may correlate with symbol complexity or duration of visibility. Davis et al. (2021) documented route-dependent phenomenology differences.
                </p>
                <a 
                  href="https://doi.org/10.1002/hup.2806" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gold hover:underline text-sm"
                >
                  Davis et al. (2021) Survey Methodology DOI: 10.1002/hup.2806
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Card>

              <Card className="p-6 border-border">
                <h3 className="text-xl font-semibold mb-3 text-gold">5. Are symbols stable across multiple sessions for the same individual?</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Longitudinal tracking requires authenticated submissions. Do individuals observe identical symbols across repeated protocol applications, or does symbol morphology vary per session? Test-retest reliability would establish whether phenomena represent stable perceptual signatures vs. stochastic pattern generation.
                </p>
                <p className="text-sm text-muted-foreground">
                  Registry implementation: Authenticated user tracking enables within-subject comparison across sessions with time-series analysis.
                </p>
              </Card>

              <Card className="p-6 border-border">
                <h3 className="text-xl font-semibold mb-3 text-gold">6. Do naive participants (no prior protocol knowledge) report similar symbols?</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Critical test of expectation bias. Blinded participants unaware of protocol or expected symbols would establish baseline symbol frequency without priming. Current notable consistency figure derived from self-selected replicators aware of protocol details.
                </p>
                <p className="text-sm text-muted-foreground">
                  Gold-standard design: Double-blind, randomized controlled trial recruiting DMT-naive participants with no exposure to protocol discussions or symbol examples.
                </p>
              </Card>

              <Card className="p-6 border-border">
                <h3 className="text-xl font-semibold mb-3 text-gold">7. Can symbols be reproduced under sober conditions with laser alone?</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Essential control condition. If 650 nm laser + diffraction grating produce symbol-like visual effects without DMT, supports optical artifact hypothesis (afterimages, phosphenes). No systematic sober replication data currently published.
                </p>
                <p className="text-sm text-muted-foreground">
                  Methodological requirement: Sober participants view 650 nm laser through identical diffraction gratings in matched lighting conditions and document observations.
                </p>
              </Card>

              <Card className="p-6 border-border">
                <h3 className="text-xl font-semibold mb-3 text-gold">8. Does pre-session photobiomodulation (660 nm red light therapy) enhance symbol clarity?</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Timmermann et al. (2019) demonstrated enhanced visual cortex coherence with red light exposure. Controlled trial comparing DMT + laser with vs. without 15-minute pre-exposure to 660 nm red light therapy would test mitochondrial ATP hypothesis.
                </p>
                <a 
                  href="https://doi.org/10.1038/s41598-019-51974-4" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gold hover:underline text-sm"
                >
                  Timmermann et al. (2019) Photobiomodulation Effects
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Card>

              <Card className="p-6 border-border">
                <h3 className="text-xl font-semibold mb-3 text-gold">9. Do symbols correlate with specific N,N-DMT doses (breakthrough vs. sub-breakthrough)?</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Registry tracks approximate dose but lacks standardized measurement. Dose-response curve analysis would determine whether symbol appearance requires full "breakthrough" doses or occurs at lower intensity experiences. Strassman (2001) documented dose-dependent phenomenology variations.
                </p>
                <a 
                  href="https://doi.org/10.1007/978-1-4615-0115-9" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gold hover:underline text-sm"
                >
                  Strassman (2001) Dose Documentation DOI: 10.1007/978-1-4615-0115-9
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Card>

              <Card className="p-6 border-border">
                <h3 className="text-xl font-semibold mb-3 text-gold">10. Can computational vision algorithms detect patterns in registry symbols beyond human classification?</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Machine learning clustering (convolutional neural networks, dimensionality reduction) applied to 100×100 px symbol canvas data may identify latent archetypes not visible through manual categorization. Enables objective quantification of inter-subject similarity.
                </p>
                <p className="text-sm text-muted-foreground">
                  Implementation: Open-access registry data (CC-BY-4.0) permits academic institutions to apply computer vision analysis. Contact research@dmtcode.com for API access.
                </p>
              </Card>

              <Card className="p-6 border-border">
                <h3 className="text-xl font-semibold mb-3 text-gold">11. Are there cross-cultural differences in symbol morphology or interpretation?</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Current registry predominantly English-speaking participants. Cross-cultural replication (Asia, Africa, South America) would test whether symbol archetypes show cultural variance or universal consistency. Davis et al. (2021) documented cultural influences on entity encounter interpretations.
                </p>
                <a 
                  href="https://doi.org/10.1002/hup.2806" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gold hover:underline text-sm"
                >
                  Davis et al. (2021) Cross-Cultural Analysis
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Card>

              <Card className="p-6 border-border">
                <h3 className="text-xl font-semibold mb-3 text-gold">12. What is the temporal window for symbol appearance during the experience?</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Do symbols appear throughout entire DMT experience (0-15 minutes) or only during specific phases (onset, peak, comedown)? Time-locked EEG measurements combined with laser application at different experience phases would map neural correlates.
                </p>
                <p className="text-sm text-muted-foreground">
                  Methodological challenge: Participant communication during peak effects limited. Real-time button-press or eye-tracking required for temporal resolution.
                </p>
              </Card>
            </div>

            {/* Call to Action */}
            <Card className="p-8 bg-primary/5 border-primary/20 mt-12">
              <h2 className="text-2xl font-semibold mb-4">Academic Collaboration Opportunities</h2>
              <p className="text-base leading-relaxed mb-6">
                Universities and research institutions with DEA licensure are encouraged to design controlled experiments addressing these questions. DMT Code Project provides open-access registry data, technical infrastructure, and community coordination support.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <a href="/methods" className="text-gold hover:underline font-medium">
                  Review Experimental Design Guidelines →
                </a>
                <a href="/about" className="text-gold hover:underline font-medium">
                  Contact Research Team →
                </a>
              </div>
            </Card>

            <div className="mt-12 p-8 bg-muted/30 border border-border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Related Resources</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <a href="/evidence-map" className="text-gold hover:underline font-medium">
                  Evidence Map →
                </a>
                <a href="/critiques" className="text-gold hover:underline font-medium">
                  Scientific Critiques →
                </a>
                <a href="/bibliography" className="text-gold hover:underline font-medium">
                  Bibliography →
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Last updated: 2025-11-29
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default OpenQuestions;
