import { Separator } from '@/components/ui/separator';
import { ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="relative py-12 px-4 bg-background border-t border-border">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary">DMT Code</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The community-driven platform for documenting and understanding the DMT laser phenomenon, where to buy the exact laser Danny Goler uses for the DMT code experiment, and how thousands are safely exploring Reality's source code.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
                  Protocol PDF Download
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Community Codex
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Safety Guidelines
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
                  Research References
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Affiliate Disclosure
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator />

        <div className="bg-secondary/30 border border-primary/30 rounded-lg p-6 space-y-3">
          <p className="text-sm font-semibold text-primary">Important Legal Disclaimer</p>
          <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p>
              <strong>Age Restriction:</strong> This site and its contents are intended for adults 18 years and older only.
            </p>
            <p>
              <strong>Not Medical Advice:</strong> The information on this site is for educational and research purposes only. This is not medical advice, and we do not recommend, endorse, or encourage the use of any controlled substances. DMT (N,N-Dimethyltryptamine) is a Schedule I controlled substance in many jurisdictions.
            </p>
            <p>
              <strong>Legal Compliance:</strong> It is your responsibility to understand and comply with all local, state, and federal laws regarding controlled substances. Where to buy DMT laser equipment legally for research purposes should be researched according to your local regulations.
            </p>
            <p>
              <strong>No Scientific Validation:</strong> The DMT code phenomenon described on this site represents subjective experiences reported by individuals and has not been scientifically validated through peer-reviewed research. Alternative explanations exist for these visual phenomena.
            </p>
            <p>
              <strong>Harm Reduction:</strong> If you choose to explore altered states of consciousness, please prioritize safety, legality, and informed consent. Always test substances, never use alone, and be in a safe environment with trusted individuals.
            </p>
            <p>
              <strong>Affiliate Disclosure:</strong> This site contains affiliate links. We may earn a commission when you purchase through these links, at no additional cost to you. This helps support our community documentation efforts.
            </p>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 DMT Code. All rights reserved.</p>
          <p className="mt-2">Built for the curious explorers seeking to understand Reality's source code.</p>
        </div>
      </div>
    </footer>
  );
};
