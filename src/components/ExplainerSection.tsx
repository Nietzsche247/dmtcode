import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export const ExplainerSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="explainer" 
      ref={sectionRef}
      className="relative py-24 px-4"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className={`text-center mb-16 opacity-0 ${isVisible ? 'animate-blur-in-up' : ''}`} style={{ animationFillMode: 'forwards' }}>
          <p className="text-primary text-sm font-medium tracking-wide uppercase mb-4">Understanding the Protocol</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
            Key Takeaways
          </h2>
        </div>
        
        <Card 
          className={`p-8 md:p-12 bg-card/50 backdrop-blur-sm border-border/50 opacity-0 ${isVisible ? 'animate-blur-in-up animation-delay-200' : ''}`}
          style={{ animationFillMode: 'forwards' }}
        >
          <div className="prose prose-invert max-w-none space-y-6">
            <p className="text-lg leading-relaxed font-light text-muted-foreground">
              In 2020, researcher <span className="text-foreground font-medium">Danny Goler</span> reported a novel phenomenon. He found that shining a <span className="text-foreground font-medium">650 nm red laser</span> through a diffraction grating during N,N-DMT administration produces discrete visual symbols resembling alphabetic characters on any surface. Over <span className="text-foreground font-medium">an independent replicator community</span> have since replicated this protocol, with <span className="text-foreground font-medium">notable convergence consistent symbol observations</span> (<a href="https://doi.org/10.1002/hup.2806" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">Davis et al., 2021</a>).
            </p>
            
            <p className="text-lg leading-relaxed font-light text-muted-foreground">
              The 650 nm wavelength, when projected through a diffraction grating (cross, grid, or star pattern), creates a structured visual field that interacts with endogenous N,N-DMT-induced visual processing. Observers report seeing discrete, bounded symbols that appear to float within or overlay the diffraction grid pattern. These symbols exhibit remarkable inter-subject consistency: independent participants report identical geometric and alphabetic-like elements in the same contextual settings.
            </p>

            <p className="text-lg leading-relaxed font-light text-muted-foreground">
              <span className="text-foreground font-medium">Chase Hughes</span> validated Goler's protocol through structured replication studies. He documented that symbols maintain structural coherence across observers who have never communicated with each other. Participants independently draw nearly identical symbols when asked to recreate their observations immediately after the experience (Goler 2025, IPI Letters).
            </p>

            <p className="text-lg leading-relaxed font-light text-muted-foreground">
              <span className="text-foreground font-medium">Neurophysiological basis:</span> <a href="https://doi.org/10.1038/s41598-019-51974-4" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">Timmermann et al. (2019)</a> demonstrated that N,N-DMT administration produces enhanced coherence in visual cortex regions via EEG analysis. When combined with 660 nm photobiomodulation, mitochondrial ATP production in neurons increases, potentially optimizing visual processing for discrete symbol perception.
            </p>

            <p className="text-lg leading-relaxed font-light text-muted-foreground">
              The DMT Code Glyph Registry collects these recurring visual elements in a structured, machine-readable format. <span className="text-foreground font-medium">Memory decay matters:</span> <a href="https://doi.org/10.1007/978-1-4615-0115-9" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">Strassman (2001)</a> found that detailed visual recall drops by 60% within 15 minutes and 90% within 2 hours. Drawing symbols immediately using the registry canvas improves data accuracy.
            </p>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 my-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div className="space-y-3">
                  <p className="font-semibold text-foreground">Important Safety & Context Information</p>
                  <ul className="space-y-2 text-muted-foreground font-light text-base">
                    <li>• Always conduct the sober speckle test first to verify you can see diffraction patterns before any substance use</li>
                    <li>• DMT is a Schedule I controlled substance in many jurisdictions; know your local laws</li>
                    <li>• This phenomenon is not yet scientifically validated and remains in the realm of subjective experiences</li>
                    <li>• Some researchers have offered alternative explanations for these visual phenomena</li>
                    <li>• This site provides tools for those who choose to explore this protocol responsibly and legally where permitted</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-4">
              <a 
                href="/protocol-guide" 
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Read Complete Protocol Guide
                <ExternalLink className="w-4 h-4" />
              </a>
              <a 
                href="/bibliography" 
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
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
