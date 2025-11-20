import { Card } from "@/components/ui/card";
import { Check, ExternalLink } from "lucide-react";
import { Helmet } from "react-helmet";

export const LaserGuide = () => {
  const genericLasers = [
    {
      brand: "HiLetgo",
      model: "650nm Red Laser Pointer",
      power: "5mW",
      price: "$12-15",
      link: "#",
      verified: true
    },
    {
      brand: "Quarton",
      model: "Red Laser Module",
      power: "5mW",
      price: "$18-25",
      link: "#",
      verified: true
    },
    {
      brand: "Generic",
      model: "650nm Laser + Grating",
      power: "<5mW",
      price: "$10-20",
      link: "#",
      verified: true
    }
  ];

  const faqs = [
    {
      question: "Do I need Code of Reality's laser?",
      answer: "No. Thousands of independent replicators worldwide report identical results using any 650 nm ≤5 mW red laser with a diffraction grating tip. The phenomenon depends on laser speckle interference amplified under DMT, not brand-specific features or proprietary modifications."
    },
    {
      question: "Is the phenomenon brand-dependent?",
      answer: "No evidence suggests brand dependency. The phenomenon appears to be purely physics-based, relying on coherent light interference patterns (laser speckle) that are amplified by DMT-enhanced visual processing. Any 650nm red laser at ≤5mW with proper diffraction grating produces identical results according to aggregated replicator reports (2024-2025)."
    },
    {
      question: "What makes your bundles different?",
      answer: "Our bundles offer convenience through pre-curated, one-click purchases with verified lasers plus comfort items like blackout masks and log books. We support instant checkout via Apple Pay, Google Pay, and Amazon Pay. Unlike project-affiliated sales, purchases here support an independent community archive focused on decentralized data collection and analysis."
    },
    {
      question: "Can I build my own kit?",
      answer: "Absolutely. Generic off-the-shelf lasers (650nm, ≤5mW) with screw-on diffraction caps work identically to pre-assembled options. Total cost is typically $10-30 with 5-15 minutes assembly time. Many researchers prefer this DIY approach for budget reasons or technical interest."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      
      <section className="w-full py-16 bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
            Laser Selection Guide: Generic vs. Pre-Assembled Options
          </h2>

          {/* Intro Paragraph */}
          <div className="prose prose-invert max-w-4xl mx-auto mb-12 text-center">
            <p className="text-lg leading-relaxed">
              Thousands of independent replicators worldwide report identical results using any 650 nm ≤5 mW red laser with a diffraction grating tip. No proprietary modifications to wavelength, coherence, or power are required (Goler, 2025 pilot study; aggregated replicator reports 2024–2025). The phenomenon depends on laser speckle interference amplified under DMT, not brand-specific features.
            </p>
          </div>

          {/* Section 1: Generic Lasers */}
          <Card className="p-8 mb-8 bg-card/50 backdrop-blur">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              1. Generic Off-the-Shelf Lasers (Recommended for DIY & Budget)
            </h3>
            <p className="text-muted-foreground mb-6">
              Any reputable 650 nm ≤5 mW pointer with a diffraction cap works identically. Popular replicator-verified models include:
            </p>

            {/* Comparison Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left py-3 px-4">Brand/Model</th>
                    <th className="text-left py-3 px-4">Power</th>
                    <th className="text-left py-3 px-4">Price</th>
                    <th className="text-left py-3 px-4">Verified</th>
                    <th className="text-left py-3 px-4">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {genericLasers.map((laser, index) => (
                    <tr key={index} className="border-b border-muted/20">
                      <td className="py-3 px-4">{laser.brand} - {laser.model}</td>
                      <td className="py-3 px-4">{laser.power}</td>
                      <td className="py-3 px-4 font-semibold">{laser.price}</td>
                      <td className="py-3 px-4">
                        {laser.verified && <Check className="w-5 h-5 text-green-500" />}
                      </td>
                      <td className="py-3 px-4">
                        <a href={laser.link} className="text-primary hover:underline inline-flex items-center gap-1">
                          View <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-muted/20 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Total cost:</strong> $10–$30 | <strong>Assembly:</strong> 5–15 minutes (screw-on grating)
              </p>
            </div>
          </Card>

          {/* Section 2: Code of Reality Kit */}
          <Card className="p-8 mb-8 bg-card/50 backdrop-blur">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              2. Code of Reality Pre-Assembled Kit (Convenience Option)
            </h3>
            <p className="text-muted-foreground mb-4">
              Standard 650 nm module + 3×AA battery holder with switch + pre-wired + heat-shrink + optional tripod mount.
            </p>
            <ul className="space-y-2 mb-4 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>No soldering required in current version</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Higher price point to fund project development and research</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Identical optical performance to generic versions per replicator consensus</span>
              </li>
            </ul>
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg italic">
              <p className="text-sm">
                "We are using this money to fuel the project and research" – Direct quote from{" "}
                <a 
                  href="https://codeofreality.com/laser-delivered-to-your-door" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  codeofreality.com/laser-delivered-to-your-door
                  <ExternalLink className="w-3 h-3" />
                </a>
                {" "}(accessed November 2025)
              </p>
            </div>
          </Card>

          {/* Section 3: Why Our Bundles */}
          <Card className="p-8 mb-8 bg-card/50 backdrop-blur border-primary/40">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              3. Why Our Bundles Are the Most Convenient Choice
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-lg">Pre-Curated Selection</h4>
                <p className="text-muted-foreground text-sm">
                  One-click bundles with verified lasers plus comfort items: blackout masks, log books, integration guides, and surface sampling kits.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-lg">Instant Checkout</h4>
                <p className="text-muted-foreground text-sm">
                  Apple Pay, Google Pay, and Amazon Pay integration. Fastest purchase path for researchers, first-timers, and gift-givers.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-lg">Independent Archive</h4>
                <p className="text-muted-foreground text-sm">
                  Unlike project-affiliated sales, purchases here support our independent community archive and decentralized data collection infrastructure.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 4: Citizen Science Vision */}
          <Card className="p-8 mb-8 bg-card/50 backdrop-blur">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              4. Citizen Science Vision: Building a Decentralized Glyph Database
            </h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Like Paul Stamets' <strong>Microdose.me app</strong> (Quantified Citizen platform, 14,000+ participants collecting microdosing data for correlation analysis – Stamets, 2022), this site serves as a <strong>decentralized repository</strong> for the DMT code phenomenon.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Logged-in users upload glyphs with surface, environment, and dose tags. Community upvoting legitimizes recurring patterns. Future analytics will reveal correlations—for example, whether specific symbols appear 4× more frequently on skin versus walls, or if certain geometric structures correlate with dose ranges.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The goal: build a <strong>Rosetta Stone-style decoding system</strong> for what may be objective, reproducible phenomena emerging at the intersection of psychedelics, coherent light physics, and human consciousness. This is <strong>tool-first citizen science</strong>—rigorous, transparent, and community-driven.
              </p>
            </div>
          </Card>

          {/* FAQ Section with Schema */}
          <Card className="p-8 bg-card/50 backdrop-blur">
            <h3 className="text-2xl font-bold mb-6 text-primary">Frequently Asked Questions</h3>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-muted/20 pb-6 last:border-0 last:pb-0">
                  <h4 className="font-semibold text-lg mb-2">{faq.question}</h4>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </>
  );
};
