import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { PageHero } from '@/components/PageHero';
import { Card } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

type Kit = {
  id: 'solo' | 'triad' | 'circle';
  name: string;
  price: number;
  parts: number;
  image: string | null;
  cart: string;
  description: string;
};

const KITS: Kit[] = [
  {
    id: 'solo',
    name: '650 nm Laser Diffraction Research Kit — Solo (1 Observer)',
    price: 289,
    parts: 219,
    image: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/kit-solo.jpg',
    cart: 'https://dmtcode-p4szt.myshopify.com/cart/54376696709430:1',
    description:
      'Optical research kit for one observer: a 650 nm laser module, diffraction optics, and printed observation materials for educational study of laser diffraction patterns.',
  },
  {
    id: 'triad',
    name: 'Multi-Wavelength Laser Diffraction Research Kit — Triad (2–3 Observers)',
    price: 649,
    parts: 516,
    image: null,
    cart: 'https://dmtcode-p4szt.myshopify.com/cart/54376697692470:1',
    description:
      'Optical research kit for two to three observers: multi-wavelength laser modules including 650 nm, diffraction optics, and printed observation materials for educational study of laser diffraction patterns.',
  },
  {
    id: 'circle',
    name: 'Multi-Wavelength Laser Diffraction Research Kit — Circle (6 Observers)',
    price: 1090,
    parts: 883,
    image: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/kit-circle.jpg',
    cart: 'https://dmtcode-p4szt.myshopify.com/cart/54376698446134:1',
    description:
      'Optical research kit for six observers: multi-wavelength laser modules including 650 nm, diffraction optics, and printed observation materials for educational study of laser diffraction patterns.',
  },
];

const usd = (n: number) => `$${n.toLocaleString('en-US')}`;

function KitCard({ kit }: { kit: Kit }) {
  const trackClick = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'bundle_cta_click', {
        kit: kit.id,
        price: kit.price,
      });
    }
  };

  return (
    <Card
      id={kit.id}
      className="flex flex-col p-6 md:p-8 rounded-2xl border border-border/60"
    >
      <div className="aspect-video rounded-lg overflow-hidden bg-muted/20 mb-6">
        {kit.image && (
          <img
            src={kit.image}
            alt={`${kit.name} contents`}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <h3 className="font-serif text-2xl md:text-3xl leading-tight">{kit.name}</h3>

      <div className="mt-4 text-3xl font-black tracking-tight tabular-nums">
        {usd(kit.price)}
      </div>
      <div className="text-xs text-muted-foreground mt-1 tabular-nums">
        Sourcing the parts yourself: ≈ {usd(kit.parts)}
      </div>

      <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
        {kit.description}
      </p>

      <div className="mt-4 text-xs text-muted-foreground">
        Ships in 7–10 business days. Free US shipping included. 18+, for research use.
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Plain packaging. Your card statement lists Meridian Optics Lab.
      </div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Class II laser — do not stare into beam.
      </div>

      <div className="mt-auto pt-6">
        <a
          href={kit.cart}
          target="_self"
          onClick={trackClick}
          className="inline-flex items-center justify-center w-full h-11 rounded-lg bg-primary text-primary-foreground font-black text-sm hover:opacity-90 transition-opacity"
        >
          Buy — secure Shopify checkout
        </a>
      </div>

    </Card>
  );
}

const Prepare = () => {
  return (
    <>
      <Helmet>
        <title>Prepare. Laser diffraction research kits.</title>
        <meta
          name="description"
          content="Three laser diffraction research kits for one, three, or six observers. 650 nm and multi-wavelength optical modules, diffraction optics, and printed observation materials."
        />
        <link rel="canonical" href="https://dmtcode.com/prepare" />
      </Helmet>

      <div className="relative min-h-screen">
        <main className="relative z-10">
          <Navigation />
          <Breadcrumb />

          <PageHero
            eyebrow="Prepare"
            title="Careful preparation"
            titleAccent="over careless purchase"
            subtitle="Three laser diffraction research kits: one observer, three observers, six observers. Every kit ships with optical components, diffraction optics, and printed observation materials. Checkout runs on secure Shopify."
          />

          {/* SAFETY */}
          <section className="max-w-4xl mx-auto px-4 -mt-6">
            <Card className="p-6 md:p-8 rounded-2xl border-destructive/40 bg-destructive/5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 mt-1 text-destructive shrink-0" />
                <div className="space-y-3">
                  <h2 className="font-serif text-2xl">Before you go further</h2>
                  <p className="text-sm">
                    This page is for adults 18 and older. Raise the following with a qualified
                    prescriber before any consideration of practice:
                  </p>
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    <li>MAOIs, current or recent</li>
                    <li>SSRIs and related serotonergic medications</li>
                    <li>Cardiac history</li>
                    <li>Personal or family history of psychosis</li>
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    We publish no discontinuation windows. Timing decisions belong to a clinician
                    who knows your history.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Class II laser. Do not stare into the beam, do not aim it at anyone, and treat
                    every reflective surface in the room as part of the beam path.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* KITS */}
          <section className="max-w-6xl mx-auto px-4 mt-20">
            <header className="mb-8">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Catalog
              </div>
              <h2 className="font-serif text-3xl md:text-4xl mt-2">
                Laser diffraction research kits
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Three configurations, sized by the number of observers. Each card prints what the
                same parts cost if you sourced them yourself.
              </p>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {KITS.map((k) => (
                <KitCard key={k.id} kit={k} />
              ))}
            </div>
          </section>

          {/* OPEN DATA */}
          <section className="max-w-4xl mx-auto px-4 mt-20">
            <Card className="p-6 md:p-8 rounded-2xl border-border/60">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                The open data behind this
              </div>
              <h2 className="font-serif text-2xl mt-2 mb-3">Verify us</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Everything on this page sits on top of an open, community maintained record. Browse
                the <a href="/registry" className="underline hover:text-foreground">convergence registry</a>, read the machine
                readable corpus at <a href="/dataset" className="underline hover:text-foreground">/dataset</a>, or fetch{' '}
                <a href="/data.json" className="underline hover:text-foreground">/data.json</a> directly. CC-BY-4.0.
                Common questions are answered at <a href="/faq" className="underline hover:text-foreground">/faq</a>.
              </p>
          </Card>
        </section>

        {/* STORE POLICIES */}
        <section className="max-w-4xl mx-auto px-4 mt-16">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Store policies
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Checkout runs on Shopify under Meridian Optics Lab. Full store policies:{" "}
            <a
              href="https://dmtcode-p4szt.myshopify.com/policies/refund-policy"
              target="_blank"
              rel="noopener"
              className="underline hover:text-foreground"
            >
              Returns and refunds
            </a>
            ,{" "}
            <a
              href="https://dmtcode-p4szt.myshopify.com/policies/terms-of-service"
              target="_blank"
              rel="noopener"
              className="underline hover:text-foreground"
            >
              Terms of service
            </a>
            ,{" "}
            <a
              href="https://dmtcode-p4szt.myshopify.com/policies/shipping-policy"
              target="_blank"
              rel="noopener"
              className="underline hover:text-foreground"
            >
              Shipping
            </a>
            , and{" "}
            <a
              href="https://dmtcode-p4szt.myshopify.com/policies/contact-information"
              target="_blank"
              rel="noopener"
              className="underline hover:text-foreground"
            >
              Contact
            </a>
            .
          </p>
        </section>

        {/* DISCLAIMER */}
        <section className="max-w-4xl mx-auto px-4 mt-16 mb-24">
            <p className="text-xs text-muted-foreground leading-relaxed">
              For educational and harm reduction purposes only. Does not encourage or condone use
              of any illegal substance. Not medical or legal advice. Not intended to diagnose,
              treat, cure, or prevent any disease. Consult a qualified healthcare provider. Must
              be 18 or older.
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Prepare;
