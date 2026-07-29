import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ZENODO_DOI, ZENODO_URL, CITATION_APA } from '@/lib/constants';

const About = () => {
  return (
    <>
      <Helmet>
        <title>About the DMT Code project | DMT Code</title>
        <meta 
          name="description" 
          content="Why the DMT Code project exists, how it operates, and how to inspect or critique the record." 
        />
        <link rel="canonical" href="https://dmtcode.com/about" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/about" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="About the DMT Code project | DMT Code" />
        <meta property="og:description" content="Why the DMT Code project exists, how it operates, and how to inspect or critique the record." />
        <meta property="og:url" content="https://dmtcode.com/about" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://dmtcode.com/favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/about" />
        <meta name="twitter:title" content="About the DMT Code project | DMT Code" />
        <meta name="twitter:description" content="Why the DMT Code project exists, how it operates, and how to inspect or critique the record." />
        <meta name="twitter:image" content="https://dmtcode.com/favicon.png" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "headline": "About the DMT Code project",
            "description": "Why the DMT Code project exists, how it operates, and how to inspect or critique the record.",
            "author": {
              "@type": "Organization",
              "name": "DMT Code Project"
            },
            "datePublished": "2025-11-29",
            "dateModified": "2026-07-29"
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
                "name": "About",
                "item": "https://dmtcode.com/about"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background transition-theme">
        <Navigation />
        
        <main id="main-content" className="relative z-10 pt-20" role="main">
          {/* Hero Section */}
          <section className="relative px-4 py-20 md:py-28 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
              <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" style={{ top: '30%' }} />
            </div>
            
            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
              <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase animate-blur-in-up" style={{ animationFillMode: 'forwards' }}>
                Who runs this
              </p>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.9] animate-blur-in-up animation-delay-100" style={{ animationFillMode: 'forwards' }}>
                About the DMT Code
                <span className="block text-primary mt-2">project</span>
              </h1>
              
              <p className="text-lg md:text-xl font-light text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-blur-in-up animation-delay-200" style={{ animationFillMode: 'forwards' }}>
                Who runs this project, how it is funded, and what it will and will not claim
              </p>
            </div>
          </section>
          
          <Breadcrumb />

          <section className="container mx-auto px-4 py-16 max-w-4xl">

            {/* Zenodo DOI Section */}
            <Card className="p-8 bg-primary/5 border-primary/20 mb-8 transition-theme">
              <h2 className="text-2xl font-semibold mb-4">Dataset & Citation</h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                <a 
                  href={ZENODO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img 
                    src={`https://zenodo.org/badge/DOI/${ZENODO_DOI}.svg`}
                    alt="Zenodo DOI Badge"
                    className="h-5"
                  />
                </a>
                <span className="text-sm text-muted-foreground">CC-BY-4.0 Licensed</span>
              </div>
              <p className="text-sm font-mono text-muted-foreground bg-muted/50 p-3 rounded-lg mb-4">
                {CITATION_APA}
              </p>
              <a href="/dataset" className="text-primary hover:underline text-sm font-medium">
                View full dataset downloads and citation formats →
              </a>
            </Card>

            {/* Where this project stands */}
            <Card className="p-8 bg-card border-border mb-8 transition-theme">
              <h2 className="text-2xl font-semibold mb-4">Where this project stands</h2>
              <div className="space-y-4 text-base leading-relaxed">
                <p>
                  DMT Code is the open record of a claim, not an advocate for it. The observation
                  was described by Danny Goler in 2020 and published in 2025.
                </p>
                <p>
                  What did not exist was a place to accumulate the evidence in a form anyone could
                  inspect, including evidence that cuts against it. Every symbol is a dated,
                  permanent, licensed record. Stance scores exist for part of the bibliography and are still being filled in, so a source without one has not been assessed yet rather than judged neutral. Negative results
                  are published in the same place as positive ones, under the same license.
                </p>
                <p className="border-l-2 border-primary/60 pl-5">
                  We do not know whether the phenomenon is real. We built the instrument that could
                  find out.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold mb-3">On Danny Goler</h3>
                <p className="text-base leading-relaxed">
                  Danny Goler first described the observation this project studies, and he is credited as its originator throughout this site. He is aware of this project but holds no editorial role in it. What gets published here, including the critiques and null results, is decided independently, and the public dataset lets anyone check that policy against practice.
                </p>
              </div>
            </Card>

            {/* Mission Statement */}
            <Card className="p-8 bg-card border-border mb-8 transition-theme">
              <h2 className="text-2xl font-semibold mb-4">Mission Statement</h2>
              <p className="text-base leading-relaxed">
                DMT Code is an open community project collecting firsthand reports, null observations, competing theories, scientific research, events, trials, and open data related to the reported DMT-laser phenomenon. It exists so the claim can be examined rather than argued about. We are not trying to prove the phenomenon is real and we are not trying to prove it is not. We are trying to build a record complete enough and open enough that someone can eventually find out, and to keep every part of that record inspectable while they do.
              </p>
            </Card>

            {/* Core Values */}
            <Card className="p-8 bg-card border-border mb-8 transition-theme">
              <h2 className="text-2xl font-semibold mb-4">Core Values</h2>
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg transition-theme">
                  <h3 className="font-semibold mb-2">Two tracks, clearly labelled</h3>
                  <p className="text-sm text-muted-foreground">
                    Records use plain descriptive language such as discrete visual symbols, N,N-DMT administration and 650 nm laser exposure, so one report can be compared with another. Interpretation is welcome here, and it is kept on its own track and labelled as interpretation rather than mixed into the record. A folk reading and a testable hypothesis are both allowed to exist on this site. They are not allowed to be presented as the same kind of thing.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg transition-theme">
                  <h3 className="font-semibold mb-2">No Medical Claims</h3>
                  <p className="text-sm text-muted-foreground">
                    This project does not provide medical advice, therapeutic recommendations, or endorsements of N,N-DMT administration. All content for educational and research purposes only.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg transition-theme">
                  <h3 className="font-semibold mb-2">Harm-Reduction Focus</h3>
                  <p className="text-sm text-muted-foreground">
                    We emphasize safety considerations (ocular safety, psychological screening, legal compliance) and provide balanced analysis of risks. Vulnerable populations (personal/family history of psychosis) should avoid psychedelic substances.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg transition-theme">
                  <h3 className="font-semibold mb-2">Open Data Commitment</h3>
                  <p className="text-sm text-muted-foreground">
                    All registry submissions released under CC-BY-4.0 license. Full dataset accessible at /data.json for academic research, computational analysis, and independent verification. Transparency enables reproducibility.
                  </p>
                </div>
              </div>
            </Card>

            {/* Team Credentials */}
            <Card className="p-8 bg-card border-border mb-8 transition-theme">
              <h2 className="text-2xl font-semibold mb-4">Who runs this project</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">People</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    DMT Code is run by its founder with help from volunteers. An earlier version of this page said the team included MSc Neuroscience holders with published work in visual perception and psychopharmacology. Nothing on this site let a reader check that, so the claim has been removed. If a contributor holds a relevant credential and wants it published, it will be published with a name attached to it.
                  </p>
                  <h3 className="font-semibold text-lg mb-2">What this project does today</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    It runs the submission and publication system, the database behind it, and the open corpus at /data.json. It collects reports, null reports, critiques, theories, sources, events and trials, and it publishes them under a license that lets anyone take the whole record and check it independently.
                  </p>
                  <h3 className="font-semibold text-lg mb-2">What it does not do yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    It does not perform statistical analysis or computational pattern recognition. There is not yet enough independently submitted material for either to mean anything, and publishing an analysis of a handful of records would manufacture a result rather than find one. It has no moderation team either. Review is done by the project admin. An earlier version of this page listed peer-reviewed literature analysis and citation verification as a standing capability. Citations published on this site have failed verification before. Where that happened the citation was retracted in public on the page that carried it rather than quietly corrected, and the capability claim has now been removed from this page as well.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Affiliations</h3>
                  <p className="text-sm text-muted-foreground">
                    This project has no institutional affiliation and no advisory board. An earlier version of this page said it consulted informally with researchers cited in the bibliography. No such consultation is on record, so the claim has been removed rather than left standing. The researchers whose work is cited here have not endorsed this project and are not associated with it. The model is community-driven, in the spirit of open citizen science projects such as Zooniverse and iNaturalist.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Code of Conduct</h3>
                  <p className="text-sm text-muted-foreground">
                    All contributors commit to: (1) Neutral scientific framing, (2) Harm-reduction messaging, (3) Respect for dissenting perspectives, (4) Transparent data handling, (5) Legal compliance. Moderation is currently performed by the project admin rather than by a moderator team. Content that breaks these rules is hidden from public view rather than deleted, so the record of what was submitted stays intact.
                  </p>
                </div>
              </div>
            </Card>

            {/* Funding & Transparency */}
            <Card className="p-8 bg-card border-border mb-8 transition-theme">
              <h2 className="text-2xl font-semibold mb-4">Funding & Transparency</h2>
              <div className="space-y-4 text-base leading-relaxed">
                <p>
                  <strong>Revenue model:</strong> Affiliate commissions from the curated equipment catalogue at /prepare, together with direct sales through our own store, are intended to cover server costs, domain registration, and development time. No venture capital, no pharmaceutical sponsorships, no paywalled data. 100% of registry data remains freely accessible.
                </p>
                <p>
                  <strong>Conflicts of interest:</strong> We sell 650 nm laser kits and earn affiliate commissions on some third party products, so we have a commercial interest in the protocol this site documents. We do not sell DMT extraction services or consulting. Our /disclosure page names every affiliate relationship and explains what we do about the conflict.
                </p>
              </div>
            </Card>

            {/* Contact & Collaboration */}
            <Card className="p-8 bg-primary/5 border-primary/20 transition-theme">
              <h2 className="text-2xl font-semibold mb-4">Contact & Collaboration</h2>
              <p className="text-base leading-relaxed mb-4">
                We welcome collaboration with academic institutions, skeptical researchers, and harm-reduction organizations. If you're conducting controlled experiments on 650 nm laser protocol or analyzing registry data, we can provide technical support and dataset access.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li><strong>Academic inquiries:</strong> research@dmtcode.com (dataset access, replication design consultation). The machine readable corpus is at /data.json and needs no request.</li>
                <li><strong>Media/press:</strong> media@dmtcode.com (interviews, fact-checking, source attribution)</li>
                <li><strong>Moderation/reports:</strong> Report harmful content via registry interface or community@dmtcode.com</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-6">
                <strong>Note:</strong> We do not provide sourcing information for controlled substances, dosing guidance, or medical advice. All inquiries requesting such information will not receive responses. Consult licensed medical professionals for health-related questions.
              </p>
            </Card>

            <div className="mt-12 p-8 bg-muted/30 border border-border rounded-lg transition-theme">
              <h2 className="text-2xl font-semibold mb-4">Related Resources</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <a href="/dataset" className="text-primary hover:underline font-medium">
                  Dataset & DOI →
                </a>
                <a href="/critiques" className="text-primary hover:underline font-medium">
                  Scientific Critiques →
                </a>
                <a href="/methods" className="text-primary hover:underline font-medium">
                  Research Methods →
                </a>
                <a href="/bibliography" className="text-primary hover:underline font-medium">
                  Bibliography →
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Last updated: 2026-07-29
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default About;
