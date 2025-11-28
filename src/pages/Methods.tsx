import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';

const Methods = () => {
  return (
    <>
      <Helmet>
        <title>Research Methods - Replication Design | DMT Code</title>
        <meta 
          name="description" 
          content="FAQ on experimental design for replicating 650 nm laser protocol. Blinding procedures, control conditions, and methodological considerations with peer-reviewed citations." 
        />
        <link rel="canonical" href="https://dmtcode.com/methods" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/methods" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How do you design a blinded experiment for the 650 nm laser protocol?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Double-blind design requires: (1) Sham laser device (identical appearance, no 650 nm output), (2) Independent experimenter randomizes real/sham assignment, (3) Participant and symbol recorder both blinded to condition. Control optics (wavelength, intensity) and N,N-DMT dose. Cite Timmermann et al. (2019) DOI: 10.1038/s41598-019-51974-4."
                }
              },
              {
                "@type": "Question",
                "name": "What control conditions are necessary?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Essential controls: (1) Sham laser + N,N-DMT, (2) Real laser + placebo substance, (3) No laser + N,N-DMT, (4) Diffraction grating alone (no laser) + N,N-DMT. Each condition requires ≥20 participants for statistical power."
                }
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        
        <main className="relative z-10 pt-20">
          <div className="block md:hidden">
            <Breadcrumb />
          </div>

          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Research Methods: Replication Design</h1>
            <p className="text-lg text-muted-foreground mb-12">
              FAQ on experimental design for replicating the 650 nm laser protocol with rigorous controls and blinding procedures
            </p>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  How do you design a blinded experiment for the 650 nm laser protocol?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    Double-blind experimental design requires three critical components to eliminate expectation effects and observer bias:
                  </p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li><strong>Sham laser device:</strong> Construct device with identical appearance, weight, and operation (button press, indicator LED) but no 650 nm coherent light output. Use blocked aperture or 520 nm green LED as control wavelength.</li>
                    <li><strong>Independent randomization:</strong> Third-party experimenter (not present during experience) randomizes real/sham assignment using sealed envelopes or electronic randomization. Maintains allocation concealment until data analysis.</li>
                    <li><strong>Blinded symbol recording:</strong> Both participant and symbol recorder remain unaware of real/sham condition. Post-experience drawing occurs before unblinding.</li>
                  </ol>
                  <p>
                    Control for optical variables: wavelength (650 nm ± 5 nm), intensity (≤5 mW), diffraction grating line density (500-1000 lines/mm). Control for pharmacological variables: N,N-DMT dose (route-matched baseline dose), set/setting standardization.
                  </p>
                  <a 
                    href="https://doi.org/10.1038/s41598-019-51974-4" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gold hover:underline"
                  >
                    Timmermann et al. (2019) Experimental Design DOI: 10.1038/s41598-019-51974-4
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  What control conditions are necessary?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    Rigorous replication requires four experimental conditions to isolate laser effect from DMT effects, expectation, and optical artifacts:
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="font-semibold">Condition 1: Sham laser + N,N-DMT</p>
                      <p className="text-sm text-muted-foreground">Controls for expectation effects. If symbols appear with sham device, suggests placebo/expectation mechanism.</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="font-semibold">Condition 2: Real laser + placebo substance</p>
                      <p className="text-sm text-muted-foreground">Controls for optical artifacts. If symbols appear without DMT, suggests retinal phosphenes or afterimages.</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="font-semibold">Condition 3: No laser + N,N-DMT</p>
                      <p className="text-sm text-muted-foreground">Baseline DMT visual phenomena without laser stimulus. Establishes whether symbols occur spontaneously.</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="font-semibold">Condition 4: Diffraction grating alone (no laser) + N,N-DMT</p>
                      <p className="text-sm text-muted-foreground">Controls for grating visual effects. Tests whether coherent light (vs. ambient light through grating) is necessary.</p>
                    </div>
                  </div>
                  <p>
                    Each condition requires minimum 20 participants for 80% statistical power to detect medium effect size (Cohen's d = 0.5). Use validated symbol classification schema and blinded raters for drawing analysis.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  How do you quantify visual symbol consistency?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    Objective symbol classification requires:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Pre-registered symbol taxonomy:</strong> Define categories before data collection (geometric shapes, alphabetic-like characters, abstract patterns). Use Michael et al. (2021) form constant classification as baseline.</li>
                    <li><strong>Blinded rater analysis:</strong> Two independent raters (unaware of experimental condition) classify drawings using standardized rubric. Calculate inter-rater reliability (Cohen's κ ≥ 0.70 required).</li>
                    <li><strong>Computational similarity metrics:</strong> Use image similarity algorithms (SSIM, perceptual hashing) to quantify drawing-to-drawing consistency within conditions.</li>
                    <li><strong>Symbol frequency analysis:</strong> Track how often identical symbols appear across participants. High-consistency symbols (≥3 independent observers) warrant focused analysis.</li>
                  </ul>
                  <a 
                    href="https://doi.org/10.1098/rstb.2000.0769" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gold hover:underline"
                  >
                    Michael et al. (2021) Form Constant Analysis DOI: 10.1098/rstb.2000.0769
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  What statistical tests are appropriate?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    Primary outcome: Symbol appearance rate (binary: yes/no discrete bounded symbols).
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Chi-square test:</strong> Compare symbol appearance frequency across real laser vs. sham laser conditions.</li>
                    <li><strong>Logistic regression:</strong> Model symbol appearance probability with predictors (laser condition, DMT dose, prior experience, expectation).</li>
                    <li><strong>Bayesian analysis:</strong> Calculate Bayes factor (BF₁₀) comparing laser-effect hypothesis vs. null hypothesis. BF₁₀ &gt; 3 considered moderate evidence, &gt;10 strong evidence.</li>
                  </ul>
                  <p>
                    Secondary outcomes: Symbol complexity (quantified via fractal dimension, perimeter-to-area ratio), inter-subject similarity (average pairwise SSIM scores), consistency with pre-registered symbol taxonomy.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  What equipment specifications are required?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    Standardized equipment ensures replicability:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Laser:</strong> 650 nm ± 5 nm wavelength, ≤5 mW power output (Class IIIa safety rating), continuous wave (not pulsed), beam diameter 1-2 mm at aperture.</li>
                    <li><strong>Diffraction grating:</strong> 500-1000 lines/mm transmission grating, mounted 2-5 cm from laser aperture. Holographic gratings preferred for uniform diffraction pattern.</li>
                    <li><strong>Sham device:</strong> Identical external housing, blocked aperture or 520 nm green LED (produces visible dot but different wavelength), same weight/button operation.</li>
                    <li><strong>Measurement tools:</strong> Spectrometer to verify 650 nm output, power meter to confirm ≤5 mW, beam profiler for spatial characterization.</li>
                  </ul>
                  <div className="mt-6">
                    <Button asChild variant="default" size="lg">
                      <a href="/tools">View Verified Equipment Catalogue →</a>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  How do you handle ethical considerations?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    Psychedelic research requires stringent ethical protocols:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Institutional approval:</strong> IRB/ethics committee approval required before any human subjects research. Submit detailed protocol including risk mitigation, informed consent procedures, participant screening.</li>
                    <li><strong>Medical screening:</strong> Exclude participants with personal/family history of psychosis, cardiovascular conditions, medications contraindicated with DMT (MAOIs, SSRIs).</li>
                    <li><strong>Harm reduction:</strong> Trained medical personnel on-site, blood pressure/heart rate monitoring, integration support sessions post-experience.</li>
                    <li><strong>Data protection:</strong> Anonymous data collection, secure storage (HIPAA/GDPR compliant), no identifiable information linked to drawings or reports.</li>
                  </ul>
                  <p>
                    Follow guidelines from Psychedelic Science Group, MAPS, and Beckley Foundation for conducting responsible psychedelic research. Prioritize participant safety over data collection.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Methods;
