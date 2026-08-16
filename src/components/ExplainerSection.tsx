import { AlertTriangle, ExternalLink } from 'lucide-react';

// Summary only. The full protocol write-up lives on /protocol-guide and the
// source claims are tracked on /bibliography. The safety block stays here.
export const ExplainerSection = () => {
  return (
    <section id="explainer" className="relative py-10 px-4 border-t border-border/30">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="motion-safe:animate-blur-in-up" style={{ animationFillMode: 'both' }}>
          <p className="label-data text-xs text-primary mb-4">UNDERSTANDING THE PROTOCOL</p>
          <h2
            className="text-3xl md:text-4xl text-foreground"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
          >
            What the protocol claims
          </h2>
        </div>

        <div
          className="motion-safe:animate-blur-in-up space-y-5"
          style={{ animationFillMode: 'both' }}
        >
          <p
            className="text-base md:text-lg leading-relaxed text-muted-foreground"
            style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
          >
            In 2020, <span className="text-foreground font-medium">Danny Goler</span> reported that
            shining a <span className="text-foreground font-medium">650 nm red laser</span> through
            a diffraction grating during N,N-DMT administration produces discrete visual symbols on
            ordinary surfaces, and published a pilot account in{' '}
            <a
              href="https://doi.org/10.59973/ipil.158"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              IPI Letters (2025)
            </a>
            . Later attempts are self selected, unblinded and self reported, and no controlled
            replication has been published. Claims that the protocol has been independently
            validated circulate widely and we have found no readable source for any of them, so the
            bibliography lists that claim as unverified. Fine visual detail fades fast, which is why
            the registry canvas asks you to draw immediately rather than later.
          </p>

          <div className="bg-primary/5 border border-primary/20 rounded-sm p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-1" aria-hidden="true" />
              <div className="space-y-3">
                <p className="font-semibold text-foreground">Important safety and context information</p>
                <ul className="space-y-2 text-muted-foreground font-light text-sm md:text-base">
                  <li>Always conduct the sober speckle test first to verify you can see diffraction patterns before any substance use</li>
                  <li>DMT is a Schedule I controlled substance in many jurisdictions; know your local laws</li>
                  <li>This phenomenon is not yet scientifically validated and remains in the realm of subjective experiences</li>
                  <li>Some researchers have offered alternative explanations for these visual phenomena</li>
                  <li>This site provides tools for those who choose to explore this protocol responsibly and legally where permitted</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm">
            <a
              href="/protocol-guide"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Read more in the Protocol Guide
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href="/bibliography"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Read more in the Bibliography
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
