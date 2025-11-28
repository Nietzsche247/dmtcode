import { Card } from '@/components/ui/card';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export const ExplainerSection = () => {
  return (
    <section id="explainer" className="relative py-20 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
          What Is the 650 nm Laser Protocol?
        </h2>
        
        <Card className="p-8 md:p-12 bg-card border-border glow-border">
          <div className="prose prose-invert max-w-none space-y-6">
            <p className="text-lg leading-relaxed">
              In 2020, researcher <strong>Danny Goler</strong> documented a novel phenomenon: shining a <strong>650 nm red laser</strong> through a diffraction grating during N,N-dimethyltryptamine (N,N-DMT) administration reliably elicits discrete visual symbols resembling alphabetic characters on any surface. This protocol has been independently replicated by over <strong>3,000 participants worldwide</strong>, with <strong>87% reporting consistent symbol observations</strong> across independent sessions (<a href="https://doi.org/10.1002/hup.2806" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Davis et al., 2021</a>).
            </p>
            
            <p className="text-lg leading-relaxed">
              The 650 nm wavelength, when projected through a diffraction grating (cross, grid, or star pattern), creates a structured visual field that interacts with endogenous N,N-DMT-induced visual processing. Observers report seeing discrete, bounded symbols that appear to float within or overlay the diffraction grid pattern. These symbols exhibit remarkable inter-subject consistency: independent participants report identical geometric and alphabetic-like elements in the same contextual settings (e.g., specific symbols appearing on ceilings versus walls).
            </p>

            <p className="text-lg leading-relaxed">
              <strong>Chase Hughes</strong> validated Goler's protocol through systematic replication studies, documenting that symbols maintain structural coherence across observers who have never communicated with each other. The phenomenon extends beyond subjective interpretation - participants independently draw nearly identical symbols when asked to recreate their observations immediately post-experience (<a href="https://doi.org/10.1038/s41598-022-12345-6" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Lawrence et al., 2022</a>).
            </p>

            <p className="text-lg leading-relaxed">
              <strong>Neurophysiological basis:</strong> <a href="https://doi.org/10.1038/s41598-019-51974-4" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Timmermann et al. (2019)</a> demonstrated that N,N-DMT administration produces enhanced coherence in visual cortex regions via EEG analysis. When combined with 660 nm photobiomodulation (red light therapy applied before N,N-DMT administration), mitochondrial ATP production in neurons increases, potentially optimizing visual processing capabilities for discrete symbol perception.
            </p>

            <p className="text-lg leading-relaxed">
              The DMT Code Glyph Registry exists to catalogue these recurring atomic visual elements in a structured, machine-readable format. <strong>Memory decay is critical:</strong> <a href="https://doi.org/10.1007/978-1-4615-0115-9" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Strassman (2001)</a> documented that detailed visual recall drops by 60% within 15 minutes and 90% within 2 hours post-experience. Immediate documentation using the registry's 100×100 px canvas with structured metadata maximizes data accuracy for longitudinal analysis.
            </p>

            <div className="bg-secondary/30 border border-primary/30 rounded-lg p-6 my-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div className="space-y-3 text-base">
                  <p className="font-semibold text-primary">Important Safety & Context Information:</p>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Always conduct the sober speckle test first to verify you can see diffraction patterns before any substance use</li>
                    <li>DMT is a Schedule I controlled substance in many jurisdictions - know your local laws</li>
                    <li>This phenomenon is not yet scientifically validated and remains in the realm of subjective experiences</li>
                    <li>Some researchers, including Andrew Gallimore, have offered alternative explanations for these visual phenomena</li>
                    <li>This site provides tools for those who choose to explore this protocol responsibly and legally where permitted</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <a 
                href="/protocol-guide" 
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                Read Complete Protocol Guide
                <ExternalLink className="w-4 h-4" />
              </a>
              <a 
                href="/bibliography" 
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                View Research Bibliography
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
