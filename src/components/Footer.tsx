import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { ExternalLink } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ZENODO_DOI, CITATION_APA } from '@/lib/constants';

export const Footer = () => {
  return (
    <footer className="relative py-16 px-4 bg-background border-t border-border/50 transition-theme">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-2">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-sm">
              Open catalogue of discrete visual symbols reported during 650 nm laser exposure and N,N-DMT experiences. Equipment resources and research references for independent replication.
            </p>
            {/* Zenodo DOI Badge */}
            <div className="pt-2">
              <a 
                href={`https://doi.org/${ZENODO_DOI}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                aria-label="View dataset on Zenodo"
              >
                <img 
                  src={`https://zenodo.org/badge/DOI/${ZENODO_DOI}.svg`} 
                  alt="Zenodo DOI Badge"
                  className="h-5"
                />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/articles" className="text-muted-foreground hover:text-primary transition-colors">
                  Articles
                </Link>
              </li>
              <li>
                <Link to="/guides" className="text-muted-foreground hover:text-primary transition-colors">
                  Guides
                </Link>
              </li>
              <li>
                <Link to="/capture" className="text-muted-foreground hover:text-primary transition-colors">
                  Capture
                </Link>
              </li>
              <li>
                <Link to="/registry" className="text-muted-foreground hover:text-primary transition-colors">
                  Glyph Registry
                </Link>
              </li>
              <li>
                <Link to="/dataset" className="text-muted-foreground hover:text-primary transition-colors">
                  Dataset & DOI
                </Link>
              </li>
              <li>
                <Link to="/prepare" className="text-muted-foreground hover:text-primary transition-colors">
                  Kits
                </Link>
              </li>
              <li>
                <Link to="/bibliography" className="text-muted-foreground hover:text-primary transition-colors">
                  Bibliography
                </Link>
              </li>
              <li>
                <Link to="/correlations" className="text-muted-foreground hover:text-primary transition-colors">
                  Correlations
                </Link>
              </li>
              <li>
                <Link to="/timeline" className="text-muted-foreground hover:text-primary transition-colors">
                  Chronology
                </Link>
              </li>


              <li>
                <Link to="/trials" className="text-muted-foreground hover:text-primary transition-colors">
                  Clinical trials
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-muted-foreground hover:text-primary transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/retreats" className="text-muted-foreground hover:text-primary transition-colors">
                  Retreat centers
                </Link>
              </li>
              <li>
                <Link to="/protocols" className="text-muted-foreground hover:text-primary transition-colors">
                  Protocols
                </Link>
              </li>
              <li>
                <Link to="/research" className="text-muted-foreground hover:text-primary transition-colors">
                  Research library
                </Link>
              </li>
              <li>
                <Link to="/protocol-guide" className="text-muted-foreground hover:text-primary transition-colors">
                  Protocol Guide
                </Link>
              </li>
              <li>
                <Link to="/co-witnesses" className="text-muted-foreground hover:text-primary transition-colors">
                  Co-witness wall
                </Link>
              </li>
              <li>
                <Link to="/theories" className="text-muted-foreground hover:text-primary transition-colors">
                  Open Theories
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">The project</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/critiques" className="text-muted-foreground hover:text-primary transition-colors">
                  Critiques
                </Link>
              </li>
              <li>
                <Link to="/methods" className="text-muted-foreground hover:text-primary transition-colors">
                  Methods
                </Link>
              </li>
              <li>
                <Link to="/null-reports" className="text-muted-foreground hover:text-primary transition-colors">
                  Null reports
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-border/30" />

        {/* Citation Block */}
        <div className="bg-card/30 border border-border/30 rounded-2xl p-6 space-y-3 transition-theme">
          <p className="text-sm font-semibold text-foreground">Cite This Dataset</p>
          <p className="text-xs text-muted-foreground font-mono leading-relaxed">
            {CITATION_APA}
          </p>
        </div>

        <div className="bg-card/30 border border-border/30 rounded-2xl p-6 space-y-4 transition-theme">
          <p className="text-sm font-semibold text-primary">Important Legal Disclaimer</p>
          <div className="text-xs text-muted-foreground font-light space-y-2 leading-relaxed">
            <p>
              <span className="text-foreground font-medium">Not Medical Advice:</span> The information on this site is for educational and research purposes only. DMT is a Schedule I controlled substance in many jurisdictions.
            </p>
            <p>
              <span className="text-foreground font-medium">No Scientific Validation:</span> The DMT code phenomenon described represents subjective experiences and has not been scientifically validated through peer-reviewed research.
            </p>
            <p>
              <span className="text-foreground font-medium">Affiliate Disclosure:</span> This site contains affiliate links. We may earn a commission when you purchase through these links.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} DMT Code Project. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a 
              href="https://creativecommons.org/licenses/by/4.0/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 whitespace-nowrap hover:text-primary transition-colors"
            >
              CC-BY-4.0
              <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="/data.json" 
              className="hover:text-primary transition-colors"
            >
              data.json
            </a>
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
            <Link to="/disclosure" className="hover:text-primary transition-colors">
              Disclosure
            </Link>
            <Link to="/shipping" className="hover:text-primary transition-colors">
              Shipping
            </Link>
            <Link to="/returns" className="hover:text-primary transition-colors">
              Returns
            </Link>
            <a 
              href={`https://doi.org/${ZENODO_DOI}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              DOI
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
