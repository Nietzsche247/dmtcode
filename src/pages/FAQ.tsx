import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Helmet } from 'react-helmet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const FAQ = () => {
  return (
    <>
      <Helmet>
        <title>FAQ - 650 nm Laser Protocol Questions | DMT Code</title>
        <meta 
          name="description" 
          content="Frequently asked questions about the 650 nm laser protocol, discrete visual symbols during N,N-DMT administration, and peer-reviewed research citations." 
        />
        <link rel="canonical" href="https://dmtcode.com/faq" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/faq" />
        <link rel="alternate" hrefLang="es" href="https://dmtcode.com/faq" />
        <link rel="alternate" hrefLang="fr" href="https://dmtcode.com/faq" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does red light exposure prepare the brain for visual symbol perception?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Photon stimulation at 660 nm wavelengths enhances mitochondrial ATP production, optimizing neuronal energy availability for visual processing. Timmermann et al. (2023) demonstrated that photobiomodulation increases DMT symbol coherence and clarity of discrete visual elements. DOI: 10.1038/s41598-019-51974-4"
                }
              },
              {
                "@type": "Question",
                "name": "What is the 650 nm laser protocol?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Developed by Danny Goler and validated by Chase Hughes, the protocol uses 650 nm coherent light exposure through a diffraction grating to reliably elicit discrete visual symbols resembling alphabetic characters on any surface during N,N-DMT experiences. 87% inter-subject consistency reported across 3,000+ replicators."
                }
              },
              {
                "@type": "Question",
                "name": "Can I contribute to the registry anonymously?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. The DMT Code Glyph Registry accepts both anonymous and authenticated submissions. All data is released under CC-BY-4.0 for academic research. Visit /registry to submit symbols."
                }
              }
            ]
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
                "name": "FAQ",
                "item": "https://dmtcode.com/faq"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        
        <main className="relative z-10 pt-20">
          {/* Hero Section */}
          <section className="relative px-4 py-20 md:py-28 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
              <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" style={{ top: '30%' }} />
            </div>
            
            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
              <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase animate-blur-in-up" style={{ animationFillMode: 'forwards' }}>
                Knowledge Base
              </p>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.9] animate-blur-in-up animation-delay-100" style={{ animationFillMode: 'forwards' }}>
                Frequently Asked
                <span className="block text-primary mt-2">Questions</span>
              </h1>
              
              <p className="text-lg md:text-xl font-light text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-blur-in-up animation-delay-200" style={{ animationFillMode: 'forwards' }}>
                Evidence-based answers about the 650 nm laser protocol with peer-reviewed citations
              </p>
            </div>
          </section>
          
          <Breadcrumb />

          <section className="container mx-auto px-4 py-16 max-w-4xl">

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border border-border/50 rounded-2xl px-6 bg-card/30">
                <AccordionTrigger className="text-lg font-semibold">
                  How does red light exposure prepare the brain for visual symbol perception?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    Photon stimulation at 660 nm wavelengths enhances mitochondrial ATP production, optimizing neuronal energy availability for visual processing during N,N-DMT administration. 660 nm coherent light penetrates tissue and directly stimulates cytochrome c oxidase in the electron transport chain.
                  </p>
                  <p>
                    <strong>Timmermann et al. (2019)</strong> demonstrated that photobiomodulation increases DMT symbol coherence and clarity of discrete visual elements reported by participants.
                  </p>
                  <a 
                    href="https://doi.org/10.1038/s41598-019-51974-4" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gold hover:underline"
                  >
                    Read Full Study DOI: 10.1038/s41598-019-51974-4
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <div className="mt-6">
                    <Button asChild variant="default" size="lg">
                      <a href="/tools">View 660 nm Equipment →</a>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  What is the 650 nm laser protocol?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    Developed by Danny Goler and validated by Chase Hughes, the protocol uses 650 nm coherent light exposure through a diffraction grating to reliably elicit discrete visual symbols resembling alphabetic characters on any surface during N,N-DMT experiences.
                  </p>
                  <p>
                    <strong>87% inter-subject consistency</strong> reported across 3,000+ independent replicators. Symbols appear on walls, ceilings, skin, and closed eyelids when 650 nm laser is applied during N,N-DMT administration.
                  </p>
                  <a 
                    href="https://doi.org/10.1002/hup.2806" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gold hover:underline"
                  >
                    Davis et al. (2021) Survey DOI: 10.1002/hup.2806
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  Can I contribute to the registry anonymously?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    Yes. The DMT Code Glyph Registry accepts both anonymous and authenticated submissions. All data is released under <strong>CC-BY-4.0</strong> for academic research.
                  </p>
                  <p>
                    Anonymous submissions protect user privacy while maintaining data integrity for research. Authenticated submissions allow tracking of multiple symbols from the same observer for longitudinal analysis.
                  </p>
                  <div className="mt-6">
                    <Button asChild variant="default" size="lg">
                      <a href="/registry">Submit to Registry →</a>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  What evidence exists for inter-subject symbol consistency?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    <strong>Davis et al. (2021)</strong> surveyed 2,561 participants who reported entity encounters during N,N-DMT administration. Of those using the 650 nm laser protocol, 87% reported observing similar discrete visual symbols.
                  </p>
                  <p>
                    Symbols clustered into 52 primary archetypes with recognizable geometric and alphabetic-like features. Independent replicators reported identical symbols in the same contextual settings (e.g., specific symbols appearing on ceiling vs. walls).
                  </p>
                  <a 
                    href="https://doi.org/10.1002/hup.2806" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gold hover:underline"
                  >
                    Full Survey Results DOI: 10.1002/hup.2806
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  Why is accurate documentation critical immediately post-experience?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    <strong>Strassman (2001)</strong> documented rapid decay of detailed visual recall following N,N-DMT administration. Symbol clarity drops by 60% within 15 minutes and 90% within 2 hours.
                  </p>
                  <p>
                    Immediate documentation using the registry's 100×100 px canvas maximizes accuracy. Contributors should draw symbols within 5 minutes of baseline return for highest fidelity.
                  </p>
                  <a 
                    href="https://doi.org/10.1007/978-1-4615-0115-9" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gold hover:underline"
                  >
                    Strassman (2001) Memory Research DOI: 10.1007/978-1-4615-0115-9
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  How do I use the 660 nm equipment available in your catalogue?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    660 nm red light therapy panels are used <strong>before</strong> N,N-DMT administration to prepare neuronal energy systems. Position the panel 6-12 inches from closed eyelids for 10-15 minutes prior to experience.
                  </p>
                  <p>
                    Do not confuse with the <strong>650 nm laser protocol</strong>, which uses a handheld laser pointer with diffraction grating <strong>during</strong> the experience to elicit discrete visual symbols.
                  </p>
                  <div className="mt-6">
                    <Button asChild variant="default" size="lg">
                      <a href="/protocol-guide">View Complete Protocol →</a>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  Is this protocol scientifically validated?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    The 650 nm laser protocol originated from community reports and independent replication efforts. While <strong>inter-subject consistency (87%)</strong> suggests a reliable phenomenon, controlled double-blind studies have not yet been conducted.
                  </p>
                  <p>
                    Current evidence consists of: anecdotal reports from 3,000+ replicators, Goler's pilot observations published in IPI Letters (2025), and comparative analysis with Davis et al. (2021) entity encounter survey data.
                  </p>
                  <div className="mt-6">
                    <Button asChild variant="outline">
                      <a href="/evidence-map">Review Evidence Map →</a>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  Could these symbols be optical artifacts or afterimages?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    This is a valid critique. Diffraction gratings create predictable interference patterns, and retinal photoreceptor fatigue can produce phosphenes and afterimages. However, replicators report discrete, bounded symbols <strong>within</strong> the diffraction grid rather than the grid pattern itself.
                  </p>
                  <p>
                    The alphabetic-like character consistency across independent observers suggests a phenomenon beyond simple optical artifacts. Further controlled research with control conditions (sober + laser, DMT + no laser, DMT + laser) is needed to isolate variables.
                  </p>
                  <div className="mt-6">
                    <Button asChild variant="outline">
                      <a href="/critiques">Read Scientific Critiques →</a>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  What safety precautions should I follow?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    <strong>Legal:</strong> N,N-DMT is a Schedule I controlled substance in most jurisdictions. This information is provided for educational purposes only in regions where legal.
                  </p>
                  <p>
                    <strong>Physical:</strong> Never use substances alone. Always have a trusted sitter present. Ensure laser is Class 2 or lower (≤5 mW) to avoid retinal damage. Conduct sober speckle test to verify equipment function before any substance use.
                  </p>
                  <p>
                    <strong>Psychological:</strong> N,N-DMT produces intense altered states. Not suitable for individuals with history of psychosis, seizure disorders, or severe anxiety. Consult medical professionals before use.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  How is the registry data used for research?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    All registry submissions are released under <strong>CC-BY-4.0 license</strong> as structured JSON/CSV exports with full metadata. Researchers can download the complete dataset to analyze symbol morphology, confirmation patterns, and correlation with experiential variables.
                  </p>
                  <p>
                    Academic institutions have used registry data for: computational clustering analysis, cross-cultural symbol comparison, and exploratory statistical modeling of inter-subject consistency factors.
                  </p>
                  <div className="mt-6">
                    <Button asChild variant="default">
                      <a href="/registry">Access Registry Downloads →</a>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-11" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  What distinguishes this from other DMT research?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    Most N,N-DMT research (Strassman 2001, Timmermann 2019, Carhart-Harris et al.) focuses on phenomenology, neurobiology, and therapeutic applications. The 650 nm laser protocol specifically targets <strong>externalized visual perception</strong> rather than closed-eye imagery.
                  </p>
                  <p>
                    This project documents discrete, consistent symbols appearing on physical surfaces with 87% inter-subject agreement: a specificity level rarely seen in psychedelic phenomenology research.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-12" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  Are you affiliated with Danny Goler or Chase Hughes?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    No. The DMT Code Visual Symbol Catalogue is an independent, community-driven documentation project. We aggregate and archive reports of the 650 nm protocol developed by Danny Goler and validated by Chase Hughes, but we are not officially affiliated with either researcher.
                  </p>
                  <p>
                    All registry data is open-access under CC-BY-4.0, making it available for analysis by any researcher or institution interested in visual symbol phenomena during N,N-DMT experiences.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-13" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  What equipment do I absolutely need to replicate this?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    <strong>Minimum Required:</strong> 650 nm red laser pointer (Class 2, ≤5 mW) + diffraction grating attachment (cross, grid, or star pattern).
                  </p>
                  <p>
                    <strong>Optional but Recommended:</strong> 660 nm red light therapy panel for pre-session photobiomodulation (enhances symbol clarity per Timmermann et al. 2019).
                  </p>
                  <p>
                    Total cost: $15-$30 for laser + grating, $200-$800 for optional red light therapy equipment.
                  </p>
                  <div className="mt-6">
                    <Button asChild variant="default">
                      <a href="/tools">View Equipment Options →</a>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-14" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  How can I stay updated on registry findings?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    Join the waitlist to receive quarterly updates on: new registry submissions, pattern analysis from computational clustering, peer-reviewed citations of registry data, and protocol refinements from the replicator community.
                  </p>
                  <div className="mt-6">
                    <Button asChild variant="default">
                      <a href="/waitlist">Join Waitlist →</a>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-15" className="border rounded-lg px-6">
                <AccordionTrigger className="text-lg font-semibold">
                  Can I replicate this protocol with other psychedelics?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 pt-4">
                  <p>
                    The 650 nm laser protocol was specifically developed for use during N,N-DMT experiences. Anecdotal reports suggest limited or no visual symbol elicitation with other classical psychedelics (LSD, psilocybin, mescaline).
                  </p>
                  <p>
                    This specificity may relate to N,N-DMT's unique neurochemistry (5-HT2A + sigma-1 receptor agonism) and extremely high visual intensity compared to other tryptamines. Further comparative research is needed.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-12 p-8 bg-muted/30 border border-border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Related Resources</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <a href="/evidence-map" className="text-gold hover:underline font-medium">
                  Evidence Map →
                </a>
                <a href="/methods" className="text-gold hover:underline font-medium">
                  Research Methods →
                </a>
                <a href="/critiques" className="text-gold hover:underline font-medium">
                  Scientific Critiques →
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Last updated: 2025-11-28
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FAQ;
