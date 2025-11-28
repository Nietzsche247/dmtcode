import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
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
          content="Frequently asked questions about the 650 nm laser protocol, N,N-DMT visual symbols, and research citations. Evidence-based answers with peer-reviewed references." 
        />
        <link rel="canonical" href="https://dmtcode.com/faq" />
        
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
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        
        <main className="relative z-10 pt-20">
          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Frequently Asked Questions</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Evidence-based answers about the 650 nm laser protocol with peer-reviewed citations
            </p>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border rounded-lg px-6">
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
            </Accordion>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FAQ;
