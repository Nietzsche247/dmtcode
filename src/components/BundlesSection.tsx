import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, TrendingUp, Package } from 'lucide-react';

const bundles = [
  {
    name: "Starter Bundle",
    price: "$29",
    description: "Everything you need to begin the DMT code experiment safely and effectively",
    features: [
      "650nm 5mW red laser pointer",
      "Diffraction grating cross tip",
      "Printed protocol card with step-by-step instructions",
      "Safety guidelines",
      "Worldwide shipping in 24-48h",
    ],
    cta: "Get Starter Bundle",
    popular: false,
  },
  {
    name: "Pro Bundle",
    price: "$69",
    description: "The complete experimental setup for serious replicators and documentation",
    features: [
      "100mW adjustable red laser (650nm)",
      "5 diffraction lenses (cross, grid, star, radial, spiral)",
      "Premium blackout eye mask",
      "Microdose vape pen (placeholder link)",
      "Detailed protocol handbook PDF",
      "Access to private Discord community",
      "Worldwide shipping in 24-48h",
    ],
    cta: "Get Pro Bundle",
    popular: true,
  },
  {
    name: "Holiday Gift Bundle",
    price: "$99",
    description: "The ultimate gift for the consciousness explorer in your life",
    features: [
      "Everything in Pro Bundle",
      "Custom engraved 'See the Code' metal case",
      "Premium gift wrapping",
      'Bonus PDF: "First 100 Verified Glyphs"',
      "Exclusive community codex early access",
      "Priority support",
      "Worldwide shipping in 24-48h",
    ],
    cta: "Get Gift Bundle",
    popular: false,
    badge: "Limited Edition",
  },
];

export const BundlesSection = () => {
  return (
    <section id="bundles" className="relative py-20 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold glow-text">
            Choose Your Discovery Bundle
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Ships worldwide in 24-48 hours – Apple Pay, Google Pay, and Amazon Pay available for instant checkout
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-primary">
            <TrendingUp className="w-4 h-4" />
            <span>1,847 bundles sold this month</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {bundles.map((bundle) => (
            <Card
              key={bundle.name}
              className={`relative p-8 bg-card border transition-all hover:scale-105 ${
                bundle.popular 
                  ? 'border-primary shadow-lg shadow-primary/20 glow-border' 
                  : 'border-border'
              }`}
            >
              {bundle.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="px-4 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                </div>
              )}

              {bundle.badge && (
                <div className="absolute -top-4 right-4">
                  <div className="px-4 py-1 bg-secondary text-foreground text-sm font-semibold rounded-full border border-primary/50">
                    {bundle.badge}
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <h3 className="text-2xl font-bold">{bundle.name}</h3>
                  </div>
                  <p className="text-3xl font-bold text-primary">{bundle.price}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {bundle.description}
                  </p>
                </div>

                <ul className="space-y-3">
                  {bundle.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  size="lg" 
                  className={`w-full ${
                    bundle.popular 
                      ? 'glow-button bg-primary hover:bg-primary/90' 
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {bundle.cta} – Checkout in 8 Seconds
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secure checkout with Apple Pay, Google Pay, or Amazon Pay
                </p>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center pt-8">
          <p className="text-sm text-muted-foreground">
            All bundles include instant access to the complete DMT code protocol and safety guidelines
          </p>
        </div>
      </div>
    </section>
  );
};
