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
              In 2020, researcher Danny Goler documented that shining a 650 nm red laser through a diffraction grating during N,N-DMT administration produces a replicable phenomenon: observers consistently report discrete visual symbols resembling alphabetic characters appearing on various surfaces.
            </p>
            
            <p className="text-lg leading-relaxed">
              This protocol has been replicated by thousands of individuals worldwide, with many reporting similar character-like symbols and geometric sequences. Chase Hughes and other researchers have documented these visual elements, noting inter-subject consistency in reported observations across independent sessions.
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
                href="https://www.youtube.com/watch?v=example" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                Watch Danny Goler's Original Video
                <ExternalLink className="w-4 h-4" />
              </a>
              <a 
                href="https://example.com/gallimore-critique" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                Read Gallimore's Analysis
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
