import { Card } from '@/components/ui/card';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export const ExplainerSection = () => {
  return (
    <section id="explainer" className="relative py-20 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
          What Is the DMT Code Experiment?
        </h2>
        
        <Card className="p-8 md:p-12 bg-card border-border glow-border">
          <div className="prose prose-invert max-w-none space-y-6">
            <p className="text-lg leading-relaxed">
              In 2020, researcher Danny Goler discovered that shining a specific 650nm red laser through a diffraction grating while under the influence of DMT produces an unprecedented phenomenon: observers consistently report seeing animated, symbol-like glyphs and geometric patterns that appear to be the "source code" of reality itself.
            </p>
            
            <p className="text-lg leading-relaxed">
              This protocol has since been replicated by thousands of individuals worldwide, with many reporting similar katakana-like characters, moving geometric sequences, and what appears to be a consistent visual "language" emerging across independent observations. Chase Hughes and other researchers have documented these patterns, noting remarkable consistency in what experiencers describe.
            </p>

            <div className="bg-secondary/30 border border-primary/30 rounded-lg p-6 my-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div className="space-y-3 text-base">
                  <p className="font-semibold text-primary">Important Safety & Context Information:</p>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Always conduct the sober speckle test first to verify you can see diffraction patterns before any substance use</li>
                    <li>DMT is a Schedule I controlled substance in many jurisdictions - know your local laws</li>
                    <li>This phenomenon is not yet scientifically validated and remains in the realm of subjective experience</li>
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
