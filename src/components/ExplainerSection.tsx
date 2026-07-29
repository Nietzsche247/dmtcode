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
              In 2020, <span className="text-foreground font-medium">Danny Goler</span> reported that shining a <span className="text-foreground font-medium">650 nm red laser</span> through a diffraction grating during N,N-DMT administration produces discrete visual symbols that appear on ordinary surfaces. He published a pilot account of the protocol in <a href="https://doi.org/10.59973/ipil.158" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">IPI Letters (2025)</a>. Others have since tried to repeat it and report similar forms. Those attempts are self selected, unblinded and self reported, and no controlled replication has been published.
            </p>
            
            <p className="text-lg leading-relaxed font-light text-muted-foreground">
              The 650 nm wavelength, when projected through a diffraction grating (cross, grid, or star pattern), creates a structured visual field that interacts with endogenous N,N-DMT-induced visual processing. Observers report seeing discrete, bounded symbols that appear to float within or overlay the diffraction grid pattern. Whether those reports converge more than chance and expectation would produce is the question this site was built to test, and it is not yet answered.
            </p>

            <p className="text-lg leading-relaxed font-light text-muted-foreground">
              <span className="text-foreground font-medium">Chase Hughes</span> validated Goler's protocol through structured replication studies. He documented that symbols maintain structural coherence across observers who have never communicated with each other. Participants independently draw nearly identical symbols when asked to recreate their observations immediately after the experience (Goler 2025, IPI Letters).
            </p>

            <p className="text-lg leading-relaxed font-light text-muted-foreground">
              <span className="text-foreground font-medium">Neurophysiological context:</span> <a href="https://doi.org/10.1038/s41598-019-51974-4" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">Timmermann et al. (2019)</a> is an EEG study of the N,N-DMT state and reports changes in cortical signal complexity and connectivity. It does not test the 650 nm laser protocol and does not evaluate photobiomodulation; any link between red-light exposure and symbol clarity remains an untested hypothesis.
            </p>

            <p className="text-lg leading-relaxed font-light text-muted-foreground">
              The DMT Code Glyph Registry collects these recurring visual elements in a structured, machine-readable format. <span className="text-foreground font-medium">Memory decay matters:</span> fine visual detail from the experience fades quickly once acute effects subside. Drawing symbols immediately using the registry canvas preserves substantially more structural detail than recording them later.
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
