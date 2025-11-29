import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Breadcrumb } from '@/components/Breadcrumb';

const About = () => {
  return (
    <>
      <Helmet>
        <title>About - Team & Ethics | DMT Code</title>
        <meta 
          name="description" 
          content="Team credentials and ethical framework for DMT Code Visual Symbol Catalogue. Neutral science, harm-reduction focus, and open data commitment." 
        />
        <link rel="canonical" href="https://dmtcode.com/about" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/about" />
        <link rel="alternate" hrefLang="es" href="https://dmtcode.com/about" />
        <link rel="alternate" hrefLang="fr" href="https://dmtcode.com/about" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "headline": "About DMT Code Project - Team & Ethics",
            "description": "Team credentials and ethical framework for DMT Code Visual Symbol Catalogue",
            "author": {
              "@type": "Organization",
              "name": "DMT Code Project"
            },
            "datePublished": "2025-11-27",
            "dateModified": "2025-11-27"
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

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        
        <main className="relative z-10 pt-4">

          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">About DMT Code Project</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Team credentials, ethical framework, and commitment to neutral science
            </p>

            {/* Mission Statement */}
            <Card className="p-8 bg-card border-border mb-8">
              <h2 className="text-2xl font-semibold mb-4">Mission Statement</h2>
              <p className="text-base leading-relaxed">
                DMT Code is an open, community-maintained catalogue documenting discrete visual symbols reported during 650 nm coherent light exposure and N,N-DMT administration. Our mission is to create a comprehensive, scientifically rigorous database of these reported phenomena for academic research, pattern analysis, and independent replication studies. We prioritize neutral terminology, harm-reduction ethics, and transparency in all operations.
              </p>
            </Card>

            {/* Core Values */}
            <Card className="p-8 bg-card border-border mb-8">
              <h2 className="text-2xl font-semibold mb-4">Core Values</h2>
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2">Neutral Science</h3>
                  <p className="text-sm text-muted-foreground">
                    We use strictly academic terminology ("discrete visual symbols," "N,N-DMT administration," "650 nm laser exposure") and avoid mystical framing. Data speaks for itself without interpretive overlay.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2">No Medical Claims</h3>
                  <p className="text-sm text-muted-foreground">
                    This project does not provide medical advice, therapeutic recommendations, or endorsements of N,N-DMT administration. All content for educational and research purposes only.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2">Harm-Reduction Focus</h3>
                  <p className="text-sm text-muted-foreground">
                    We emphasize safety considerations (ocular safety, psychological screening, legal compliance) and provide balanced analysis of risks. Vulnerable populations (personal/family history of psychosis) should avoid psychedelic substances.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2">Open Data Commitment</h3>
                  <p className="text-sm text-muted-foreground">
                    All registry submissions released under CC-BY-4.0 license. Full dataset accessible at /data.json for academic research, computational analysis, and independent verification. Transparency enables reproducibility.
                  </p>
                </div>
              </div>
            </Card>

            {/* Team Credentials */}
            <Card className="p-8 bg-card border-border mb-8">
              <h2 className="text-2xl font-semibold mb-4">Team Credentials</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Research Team</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    DMT Code Project maintained by volunteers with backgrounds in neuroscience, data science, and psychedelic research. Team includes MSc Neuroscience holders with published work in visual perception and psychopharmacology.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Peer-reviewed literature analysis and citation verification</li>
                    <li>Database architecture and real-time data infrastructure (Supabase, PostgreSQL)</li>
                    <li>Statistical analysis and computational pattern recognition</li>
                    <li>Community moderation and ethical oversight</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Advisory Network</h3>
                  <p className="text-sm text-muted-foreground">
                    Informal consultation with researchers cited in bibliography (Davis, Timmermann, Lawrence) for methodological guidance. No formal institutional affiliation. Independent, community-driven project model inspired by citizen science initiatives (Zooniverse, iNaturalist, Paul Stamets' Microdose.me).
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Code of Conduct</h3>
                  <p className="text-sm text-muted-foreground">
                    All team members commit to: (1) Neutral scientific framing, (2) Harm-reduction messaging, (3) Respect for dissenting perspectives, (4) Transparent data handling, (5) Legal compliance. Community moderators enforce respectful discourse and remove harmful content (dosing advice, unsupported medical claims, harassment).
                  </p>
                </div>
              </div>
            </Card>

            {/* Funding & Transparency */}
            <Card className="p-8 bg-card border-border mb-8">
              <h2 className="text-2xl font-semibold mb-4">Funding & Transparency</h2>
              <div className="space-y-4 text-base leading-relaxed">
                <p>
                  <strong>Revenue model:</strong> Affiliate commissions from curated equipment catalogue (/tools) fund server costs, domain registration, and development time. No venture capital, no pharmaceutical sponsorships, no paywalled data. 100% of registry data remains freely accessible.
                </p>
                <p>
                  <strong>Conflicts of interest:</strong> None. Team members do not sell laser devices, DMT extraction services, or consulting. Affiliate products (red light therapy mats, biohacking equipment) chosen for research relevance, not profit maximization.
                </p>
                <p>
                  <strong>Financial reports:</strong> Annual summary of hosting costs, affiliate revenue, and project expenses published each January. Community accountability ensures mission alignment over commercial incentives.
                </p>
              </div>
            </Card>

            {/* Contact & Collaboration */}
            <Card className="p-8 bg-primary/5 border-primary/20">
              <h2 className="text-2xl font-semibold mb-4">Contact & Collaboration</h2>
              <p className="text-base leading-relaxed mb-4">
                We welcome collaboration with academic institutions, skeptical researchers, and harm-reduction organizations. If you're conducting controlled experiments on 650 nm laser protocol or analyzing registry data, we can provide technical support and dataset access.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li><strong>Academic inquiries:</strong> research@dmtcode.com (dataset access, API documentation, replication design consultation)</li>
                <li><strong>Media/press:</strong> media@dmtcode.com (interviews, fact-checking, source attribution)</li>
                <li><strong>Moderation/reports:</strong> Report harmful content via registry interface or community@dmtcode.com</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-6">
                <strong>Note:</strong> We do not provide sourcing information for controlled substances, dosing guidance, or medical advice. All inquiries requesting such information will not receive responses. Consult licensed medical professionals for health-related questions.
              </p>
            </Card>

            <div className="mt-12 p-8 bg-muted/30 border border-border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Related Resources</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <a href="/critiques" className="text-gold hover:underline font-medium">
                  Scientific Critiques →
                </a>
                <a href="/methods" className="text-gold hover:underline font-medium">
                  Research Methods →
                </a>
                <a href="/bibliography" className="text-gold hover:underline font-medium">
                  Bibliography →
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Last updated: 2025-11-28
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
