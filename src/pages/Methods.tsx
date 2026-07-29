import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { ExternalLink } from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';

const FAQ_ENTRIES = [
  {
    q: "How do you design a blinded experiment for the 650 nm laser protocol?",
    a: "Double-blind experimental design requires three critical components to eliminate expectation effects and observer bias: Sham laser device: Construct device with identical appearance, weight, and operation (button press, indicator LED) but no 650 nm coherent light output. Use a blocked aperture or another control that is not distinguishable by appearance, see the control device requirements below. Independent randomization: Third-party experimenter (not present during experience) randomizes real/sham assignment using sealed envelopes or electronic randomization. Maintains allocation concealment until data analysis. Blinded symbol recording: Both participant and symbol recorder remain unaware of real/sham condition. Post-experience drawing occurs before unblinding. Control for optical variables: wavelength (650 nm ± 5 nm), intensity (fixed in advance and recorded, see equipment specifications below), diffraction grating line density (500-1000 lines/mm). Control for pharmacological variables: N,N-DMT dose (route-matched baseline dose), set/setting standardization. Timmermann et al. (2019) Neural correlates of the DMT experience assessed with multivariate EEG. DOI: 10.1038/s41598-019-51974-4"
  },
  {
    q: "What control conditions are necessary?",
    a: "Rigorous replication requires four experimental conditions to isolate laser effect from DMT effects, expectation, and optical artifacts: Condition 1: Sham laser + N,N-DMT. Controls for expectation effects. If symbols appear with sham device, suggests placebo/expectation mechanism. Condition 2: Real laser + placebo substance. Controls for optical artifacts. If symbols appear without DMT, suggests retinal phosphenes or afterimages. Condition 3: No laser + N,N-DMT. Baseline DMT visual phenomena without laser stimulus. Establishes whether symbols occur spontaneously. Condition 4: Diffraction grating alone (no laser) + N,N-DMT. Controls for grating visual effects. Tests whether coherent light (vs. ambient light through grating) is necessary. Sample size cannot be given as a single number until the primary outcome is fixed. The primary outcome declared below is binary, whether a participant reports a discrete bounded symbol, and a binary outcome is sized from the two rates being compared, not from Cohen's d. As a worked illustration at 5 percent significance and 80 percent power, two sided: comparing 20 percent against 50 percent needs about 38 participants per condition, comparing 30 percent against 50 percent needs about 93, and comparing 20 percent against 35 percent needs about 137. If a continuous outcome is used instead, a medium effect of Cohen's d equal to 0.5 needs about 64 per condition. An earlier version of this page said 20 per condition. That was wrong. Twenty per condition against d equal to 0.5 delivers roughly 34 percent power, meaning the study would more likely than not miss a real effect even if one existed. The expected rates must be declared in advance and the calculation published before recruitment begins. Use a validated symbol classification schema and blinded raters for drawing analysis."
  },
  {
    q: "How do you quantify visual symbol consistency?",
    a: "Objective symbol classification requires: Pre-registered symbol taxonomy: Define categories before data collection (geometric shapes, alphabetic-like characters, abstract patterns) rather than assigning them post hoc. Blinded rater analysis: Two independent raters (unaware of experimental condition) classify drawings using a standardized rubric. Calculate inter-rater reliability (Cohen's κ ≥ 0.70 required). Computational similarity metrics: Image similarity algorithms such as SSIM and perceptual hashing can support classification but are not sufficient on their own. Symbol frequency analysis: Track how often identical symbols appear across participants. High-consistency symbols (≥3 independent observers) warrant focused analysis. SSIM and perceptual hashing are sensitive to rotation, scale, position, stroke thickness, mirroring and drawing skill. Two drawings of the same remembered form will often score as different, and two unrelated scribbles can score as similar. A credible matching pipeline needs standardised preprocessing, a predeclared list of permitted transformations, feature based similarity rather than pixel similarity alone, blinded human raters, negative control drawings from people who were never exposed, a matching threshold fixed in advance, inter rater reliability, and a chance match baseline computed from those negative controls."
  },
  {
    q: "What statistical tests are appropriate?",
    a: "Primary outcome: Symbol appearance rate (binary: yes/no discrete bounded symbols). Chi-square test: Compare symbol appearance frequency across real laser vs. sham laser conditions. Logistic regression: Model symbol appearance probability with predictors (laser condition, DMT dose, prior experience, expectation). Bayesian analysis: Calculate Bayes factor (BF₁₀) comparing laser-effect hypothesis vs. null hypothesis. BF₁₀ > 3 considered moderate evidence, >10 strong evidence. Secondary outcomes: Symbol complexity (quantified via fractal dimension, perimeter-to-area ratio), inter-subject similarity (average pairwise SSIM scores), consistency with pre-registered symbol taxonomy."
  },
  {
    q: "What equipment specifications are required?",
    a: "Standardized equipment ensures replicability: Laser: 650 nm plus or minus 5 nm, continuous wave, beam diameter 1 to 2 mm at aperture. Power and safety class are deliberately left open. The published report we have been able to verify describes a collimated 650 nm laser but does not state output power or safety class in the publicly accessible record, so any specific figure here would be invented rather than sourced. A replication should use the lowest output that produces a usable diffraction pattern at the intended viewing distance, that figure should be set by a qualified laser safety officer, recorded in the protocol, and verified with a calibrated power meter. For context, consumer pointers sold as Class 2 are limited to 1 mW, while Class 3R, labelled Class IIIa under older United States classification, spans 1 to 5 mW. Those are materially different exposure classes and they are not interchangeable. Diffraction grating: 500-1000 lines/mm transmission grating, mounted 2-5 cm from laser aperture. Holographic gratings preferred for uniform diffraction pattern. Control device: a credible optical control has to match everything the participant can perceive. Same housing, weight, button, indicator, apparent colour, apparent brightness, projected geometry, surface coverage and viewing distance. What it manipulates has to be something the participant cannot perceive directly, such as coherence, speckle structure or diffraction order. A 520 nm green LED fails this test, because green is visibly not red and the participant is unblinded the moment the device is switched on. Measurement tools: spectrometer to verify output wavelength, calibrated power meter to verify output power against the figure set in the protocol, beam profiler for spatial characterisation, and a photometer to confirm the control device matches the active device on apparent brightness."
  },
  {
    q: "How do you handle ethical considerations?",
    a: "Psychedelic research requires stringent ethical protocols: Institutional approval: IRB/ethics committee approval required before any human subjects research. Submit detailed protocol including risk mitigation, informed consent procedures, participant screening. Medical screening: Exclude participants with personal/family history of psychosis, cardiovascular conditions, medications contraindicated with DMT (MAOIs, SSRIs). Harm reduction: Trained medical personnel on-site, blood pressure/heart rate monitoring, integration support sessions post-experience. Data protection: Anonymous data collection, secure storage (HIPAA/GDPR compliant), no identifiable information linked to drawings or reports. Follow guidelines from Psychedelic Science Group, MAPS, and Beckley Foundation for conducting responsible psychedelic research. Prioritize participant safety over data collection."
  }
];

const Methods = () => {
  return (
    <>
      <Helmet>
        <title>Experimental Methods | DMT Code</title>
        <meta 
          name="description" 
          content="Detailed methodologies for controlled observation and documentation of the 650nm laser DMT phenomenon." 
        />
        <link rel="canonical" href="https://dmtcode.com/methods" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/methods" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Experimental Methods | DMT Code" />
        <meta property="og:description" content="Detailed methodologies for controlled observation and documentation of the 650nm laser DMT phenomenon." />
        <meta property="og:url" content="https://dmtcode.com/methods" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://dmtcode.com/favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/methods" />
        <meta name="twitter:title" content="Experimental Methods | DMT Code" />
        <meta name="twitter:description" content="Detailed methodologies for controlled observation and documentation of the 650nm laser DMT phenomenon." />
        <meta name="twitter:image" content="https://dmtcode.com/favicon.png" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": FAQ_ENTRIES.map((f) => ({
              "@type": "Question",
              "name": f.q,
              "acceptedAnswer": { "@type": "Answer", "text": f.a }
            }))
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
                "name": "Methods",
                "item": "https://dmtcode.com/methods"
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
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Research Methods: Replication Design</h1>
            <p className="text-lg text-muted-foreground mb-12">
              FAQ on experimental design for replicating the 650 nm laser protocol with rigorous controls and blinding procedures
            </p>

            <div className="border rounded-lg p-6 bg-muted/30 mb-12">
              <h2 className="text-xl font-semibold mb-3">Draft research framework. Not the original protocol, and not yet validated.</h2>
              <p className="text-base text-muted-foreground">
                This page describes a controlled study design that has not been run, has not been reviewed by an ethics board, and has not been validated. It is not a description of the originally reported protocol, and it is not instructions for personal use. Laser exposure and psychedelic exposure both carry real risk. Any replication needs qualified laser safety review and institutional ethics approval before it involves a human being.
              </p>
            </div>


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
                    <li><strong>Sham laser device:</strong> Construct device with identical appearance, weight, and operation (button press, indicator LED) but no 650 nm coherent light output. Use a blocked aperture or another control that is not distinguishable by appearance, see the control device requirements below.</li>
                    <li><strong>Independent randomization:</strong> Third-party experimenter (not present during experience) randomizes real/sham assignment using sealed envelopes or electronic randomization. Maintains allocation concealment until data analysis.</li>
                    <li><strong>Blinded symbol recording:</strong> Both participant and symbol recorder remain unaware of real/sham condition. Post-experience drawing occurs before unblinding.</li>
                  </ol>
                  <p>
                    Control for optical variables: wavelength (650 nm ± 5 nm), intensity (fixed in advance and recorded, see equipment specifications below), diffraction grating line density (500-1000 lines/mm). Control for pharmacological variables: N,N-DMT dose (route-matched baseline dose), set/setting standardization.
                  </p>
                  <a 
                    href="https://doi.org/10.1038/s41598-019-51974-4" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gold hover:underline"
                  >
                    Timmermann et al. (2019) Neural correlates of the DMT experience assessed with multivariate EEG. DOI: 10.1038/s41598-019-51974-4
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
                    Sample size cannot be given as a single number until the primary outcome is fixed. The primary outcome declared below is binary, whether a participant reports a discrete bounded symbol, and a binary outcome is sized from the two rates being compared, not from Cohen's d. As a worked illustration at 5 percent significance and 80 percent power, two sided: comparing 20 percent against 50 percent needs about 38 participants per condition, comparing 30 percent against 50 percent needs about 93, and comparing 20 percent against 35 percent needs about 137. If a continuous outcome is used instead, a medium effect of Cohen's d equal to 0.5 needs about 64 per condition. An earlier version of this page said 20 per condition. That was wrong. Twenty per condition against d equal to 0.5 delivers roughly 34 percent power, meaning the study would more likely than not miss a real effect even if one existed. The expected rates must be declared in advance and the calculation published before recruitment begins. Use a validated symbol classification schema and blinded raters for drawing analysis.
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
                    <li><strong>Pre-registered symbol taxonomy:</strong> Define categories before data collection (geometric shapes, alphabetic-like characters, abstract patterns) rather than assigning them post hoc.</li>
                    <li><strong>Blinded rater analysis:</strong> Two independent raters (unaware of experimental condition) classify drawings using a standardized rubric. Calculate inter-rater reliability (Cohen's κ ≥ 0.70 required).</li>
                    <li><strong>Computational similarity metrics:</strong> Image similarity algorithms such as SSIM and perceptual hashing can support classification but are not sufficient on their own.</li>
                    <li><strong>Symbol frequency analysis:</strong> Track how often identical symbols appear across participants. High-consistency symbols (≥3 independent observers) warrant focused analysis.</li>
                  </ul>
                  <p>
                    SSIM and perceptual hashing are sensitive to rotation, scale, position, stroke thickness, mirroring and drawing skill. Two drawings of the same remembered form will often score as different, and two unrelated scribbles can score as similar. A credible matching pipeline needs standardised preprocessing, a predeclared list of permitted transformations, feature based similarity rather than pixel similarity alone, blinded human raters, negative control drawings from people who were never exposed, a matching threshold fixed in advance, inter rater reliability, and a chance match baseline computed from those negative controls.
                  </p>
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
                    <li><strong>Laser:</strong> 650 nm plus or minus 5 nm, continuous wave, beam diameter 1 to 2 mm at aperture. Power and safety class are deliberately left open. The published report we have been able to verify describes a collimated 650 nm laser but does not state output power or safety class in the publicly accessible record, so any specific figure here would be invented rather than sourced. A replication should use the lowest output that produces a usable diffraction pattern at the intended viewing distance, that figure should be set by a qualified laser safety officer, recorded in the protocol, and verified with a calibrated power meter. For context, consumer pointers sold as Class 2 are limited to 1 mW, while Class 3R, labelled Class IIIa under older United States classification, spans 1 to 5 mW. Those are materially different exposure classes and they are not interchangeable.</li>
                    <li><strong>Diffraction grating:</strong> 500-1000 lines/mm transmission grating, mounted 2-5 cm from laser aperture. Holographic gratings preferred for uniform diffraction pattern.</li>
                    <li><strong>Control device:</strong> a credible optical control has to match everything the participant can perceive. Same housing, weight, button, indicator, apparent colour, apparent brightness, projected geometry, surface coverage and viewing distance. What it manipulates has to be something the participant cannot perceive directly, such as coherence, speckle structure or diffraction order. A 520 nm green LED fails this test, because green is visibly not red and the participant is unblinded the moment the device is switched on.</li>
                    <li><strong>Measurement tools:</strong> spectrometer to verify output wavelength, calibrated power meter to verify output power against the figure set in the protocol, beam profiler for spatial characterisation, and a photometer to confirm the control device matches the active device on apparent brightness.</li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    DMT Code sells some of the optical components described on this page. That is a commercial interest and it is worth weighing when reading this section. Nothing here requires buying from us, the components are generic and widely available, and no purchase is needed to submit an observation.{' '}
                    <a href="/prepare" className="text-gold hover:underline">Equipment notes</a>
                  </p>
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

            {/* Related Resources */}
            <div className="mt-12 p-8 bg-muted/30 border border-border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Related Resources</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <a href="/evidence-map" className="text-gold hover:underline font-medium">
                  Evidence Map →
                </a>
                <a href="/critiques" className="text-gold hover:underline font-medium">
                  Scientific Critiques →
                </a>
                <a href="/protocol-guide" className="text-gold hover:underline font-medium">
                  Protocol Guide →
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

export default Methods;
