import { Helmet } from 'react-helmet';
import { SEO } from '@/components/SEO';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { PageHero } from '@/components/PageHero';
import { Card } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

import { KITS, type Kit } from '@/data/kits';


const usd = (n: number) => `$${n.toLocaleString('en-US')}`;

function KitCard({ kit }: { kit: Kit }) {
  const trackClick = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'bundle_cta_click', {
        kit: kit.id,
        price: kit.priceNumber,
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
        {usd(kit.priceNumber)}
      </div>
      <div className="text-xs text-muted-foreground mt-1 tabular-nums">
        Sourcing the parts yourself: ≈ {usd(kit.diyCostNumber)}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        The difference covers a tested module, matched optics, printed materials and support.
      </div>

      <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
        {kit.description}
      </p>

      <div className="mt-4 text-xs text-muted-foreground">
        Arrives in 7 to 10 business days, processed within 2. Free US shipping. 18+, for research use.
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Plain packaging. Label and card statement read Meridian Optics Lab. No prices on the packing slip.
      </div>
      {kit.id === 'circle' && (
        <div className="mt-1 text-xs text-muted-foreground">
          Buying for a group? Every observer must be an adult who has read the <a href="/downloads/DMTCode_Screening_Card_v1.pdf" className="underline hover:text-foreground">screening card</a>. A group session protocol is in progress.
        </div>
      )}
      <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Class 3R laser, under 5 mW. Do not stare into beam.
      </div>

      <div className="mt-auto pt-6">
        <a
          href={kit.cart}
          target="_self"
          onClick={trackClick}
          className="inline-flex items-center justify-center w-full h-11 rounded-lg bg-primary text-primary-foreground font-black text-sm hover:opacity-90 transition-opacity"
        >
          Buy. Secure Shopify checkout
        </a>
      </div>

    </Card>
  );
}

const Prepare = () => {
  return (
    <>
      <SEO uiKey="prepare" path="/prepare" />

      <div className="relative min-h-screen">
        <main className="relative z-10">
          <Navigation />
          <Breadcrumb />

          <PageHero
            eyebrow="Prepare"
            title="Careful preparation"
            titleAccent="over careless purchase"
            subtitle="Three laser diffraction research kits: one observer, two to three, or six. Every kit ships with optical components, diffraction optics, and printed observation materials. Checkout runs on secure Shopify."
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
                    Class 3R laser, under 5 mW: do not stare into the beam, do not aim it at
                    anyone, and treat every reflective surface in the room as part of the beam
                    path.
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
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Every kit is built around the canonical 650 nm red baseline. Larger kits add comparative wavelengths so structured sessions can test whether observed patterns change with the light itself. The registry records wavelength on every submission.
              </p>
              <div className="mt-4 max-w-2xl">
                <p className="text-sm text-muted-foreground">
                  Field materials and protocols, free download, no account needed:
                </p>
                <ul className="mt-3 space-y-3">
                  <li className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Screening Card</span>
                    <a href="/downloads/DMTCode_Screening_Card_v1.pdf" download className="rounded-full border border-border/60 px-3 py-1 text-xs hover:text-foreground">EN</a>
                    <a href="/downloads/DMTCode_Tarjeta_de_Cribado_v1_ES.pdf" download className="rounded-full border border-border/60 px-3 py-1 text-xs hover:text-foreground">ES</a>
                    <a href="/downloads/DMTCode_Screening_Karte_v1_DE.pdf" download className="rounded-full border border-border/60 px-3 py-1 text-xs hover:text-foreground">DE</a>
                  </li>
                  <li className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Field Sheet</span>
                    <a href="/downloads/DMTCode_Observation_Field_Sheet_v1.pdf" download className="rounded-full border border-border/60 px-3 py-1 text-xs hover:text-foreground">EN</a>
                    <a href="/downloads/DMTCode_Hoja_de_Campo_v1_ES.pdf" download className="rounded-full border border-border/60 px-3 py-1 text-xs hover:text-foreground">ES</a>
                    <a href="/downloads/DMTCode_Feldblatt_v1_DE.pdf" download className="rounded-full border border-border/60 px-3 py-1 text-xs hover:text-foreground">DE</a>
                  </li>
                  <li className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sober Baseline Protocol</span>
                    <a href="/downloads/DMTCode_Sober_Baseline_Protocol_v1.pdf" download className="rounded-full border border-border/60 px-3 py-1 text-xs hover:text-foreground">EN</a>
                    <a href="/downloads/DMTCode_Protocolo_Base_Sobria_v1_ES.pdf" download className="rounded-full border border-border/60 px-3 py-1 text-xs hover:text-foreground">ES</a>
                    <a href="/downloads/DMTCode_Basisprotokoll_Nuechtern_v1_DE.pdf" download className="rounded-full border border-border/60 px-3 py-1 text-xs hover:text-foreground">DE</a>
                  </li>
                  <li className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">AVP Passthrough Protocol</span>
                    <a href="/downloads/DMTCode_AVP_Passthrough_Protocol_v1.pdf" download className="rounded-full border border-border/60 px-3 py-1 text-xs hover:text-foreground">EN</a>
                    <a href="/downloads/DMTCode_Protocolo_AVP_Passthrough_v1_ES.pdf" download className="rounded-full border border-border/60 px-3 py-1 text-xs hover:text-foreground">ES</a>
                    <a href="/downloads/DMTCode_AVP_Passthrough_Protokoll_v1_DE.pdf" download className="rounded-full border border-border/60 px-3 py-1 text-xs hover:text-foreground">DE</a>
                  </li>
                </ul>
              </div>
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
            <a href="/returns" className="underline hover:text-foreground">
              Returns and refunds
            </a>
            ,{" "}
            <a href="/store-terms" className="underline hover:text-foreground">
              Terms of service
            </a>
            ,{" "}
            <a href="/shipping" className="underline hover:text-foreground">
              Shipping
            </a>
            , and{" "}
            <a href="/store-contact" className="underline hover:text-foreground">
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
