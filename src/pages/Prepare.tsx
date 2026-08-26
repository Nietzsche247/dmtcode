import { Helmet } from 'react-helmet';
import { SEO } from '@/components/SEO';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { PageHero } from '@/components/PageHero';
import { Card } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

import { KITS, type Kit } from '@/data/kits';
import { useLocale } from '@/i18n/LocaleProvider';

const PREPARE_BUY_COPY = {
  en: {
    eyebrow: "Before you buy",
    shipping: {
      title: "Shipping",
      body: "Free within the United States. Orders are processed within 2 business days and arrive within 7 to 10 business days. You get a tracking email the moment it ships. Kits ship from Arbor Scientific in Arbor packaging with no prices on the packing slip.",
    },
    outside: {
      title: "Outside the US",
      body: "Checkout offers shipping to Canada, the UK, most EU countries, Switzerland, Norway, Australia, New Zealand, Japan, Singapore, Hong Kong, South Korea, Malaysia, Israel and the UAE. The carrier rate (USPS or DHL Express) is shown at checkout before you pay. Customs duties and import taxes are the buyer's responsibility.",
    },
    returns: {
      title: "Returns",
      body: "Unopened kits can be returned within 30 days of delivery. Opened laser modules are not returnable, since these are precision optical instruments that cannot be recalibrated or resold once the seal is broken. Return shipping is paid by the buyer. Approved refunds go back to the original payment method within 10 business days of receipt.",
    },
    damaged: {
      title: "Damaged or defective",
      body: "If a kit arrives damaged or a component is defective, email info@dmtcode.com within 7 days of delivery with photos of the item and packaging. We replace the affected component or the full kit at no cost.",
    },
    sellerPrefix: "Seller of record: Meridian Optics Lab, Tucson, Arizona. Checkout runs on Shopify.",
    sellerQuestions: "Questions: info@dmtcode.com, answered within 2 business days.",
    sellerPolicies: "Full policies",
    cardLine: "30-day returns on unopened kits. Free US shipping.",
    geoShips: "You appear to be in {country}. Shipping there is calculated at checkout (USPS or DHL Express) and shown before you pay.",
    geoNoShip: "You appear to be in {country}. We do not ship there yet. Email info@dmtcode.com and we will tell you when that changes.",
  },
  es: {
    eyebrow: "Antes de comprar",
    shipping: {
      title: "Envío",
      body: "Envío gratuito dentro de Estados Unidos. Los pedidos se procesan en 2 días hábiles y llegan en 7 a 10 días hábiles. Recibirá un correo con el número de seguimiento en cuanto salga el paquete. Los kits se envían desde Arbor Scientific en embalaje de Arbor, sin precios en el albarán.",
    },
    outside: {
      title: "Fuera de Estados Unidos",
      body: "El pago ofrece envío a Canadá, Reino Unido, la mayoría de los países de la UE, Suiza, Noruega, Australia, Nueva Zelanda, Japón, Singapur, Hong Kong, Corea del Sur, Malasia, Israel y Emiratos Árabes Unidos. La tarifa del transportista (USPS o DHL Express) se muestra antes de pagar. Los aranceles y los impuestos de importación corren a cargo del comprador.",
    },
    returns: {
      title: "Devoluciones",
      body: "Los kits sin abrir pueden devolverse en un plazo de 30 días desde la entrega. Los módulos láser abiertos no admiten devolución, ya que son instrumentos ópticos de precisión que no pueden recalibrarse ni revenderse una vez roto el precinto. El envío de la devolución lo paga el comprador. Los reembolsos aprobados se abonan al método de pago original en un plazo de 10 días hábiles desde la recepción.",
    },
    damaged: {
      title: "Dañado o defectuoso",
      body: "Si el kit llega dañado o algún componente es defectuoso, escriba a info@dmtcode.com en los 7 días siguientes a la entrega con fotos del artículo y del embalaje. Sustituimos el componente afectado o el kit completo sin coste.",
    },
    sellerPrefix: "Vendedor: Meridian Optics Lab, Tucson, Arizona. El pago se realiza en Shopify.",
    sellerQuestions: "Consultas: info@dmtcode.com, respuesta en 2 días hábiles.",
    sellerPolicies: "Políticas completas",
    cardLine: "Devoluciones en 30 días para kits sin abrir. Envío gratuito en EE. UU.",
    geoShips: "Parece que está en {country}. El envío hasta allí se calcula al pagar (USPS o DHL Express) y se muestra antes del pago.",
    geoNoShip: "Parece que está en {country}. Todavía no enviamos allí. Escriba a info@dmtcode.com y le avisaremos cuando cambie.",
  },
  de: {
    eyebrow: "Vor dem Kauf",
    shipping: {
      title: "Versand",
      body: "Kostenloser Versand innerhalb der USA. Bestellungen werden innerhalb von 2 Werktagen bearbeitet und kommen innerhalb von 7 bis 10 Werktagen an. Sobald das Paket unterwegs ist, erhalten Sie eine E-Mail mit der Sendungsverfolgung. Die Kits werden von Arbor Scientific in Arbor-Verpackung verschickt, ohne Preise auf dem Lieferschein.",
    },
    outside: {
      title: "Außerhalb der USA",
      body: "Beim Bezahlen wird Versand nach Kanada, Großbritannien, in die meisten EU-Länder, in die Schweiz, nach Norwegen, Australien, Neuseeland, Japan, Singapur, Hongkong, Südkorea, Malaysia, Israel und in die Vereinigten Arabischen Emirate angeboten. Der Tarif des Versanddienstleisters (USPS oder DHL Express) wird vor der Zahlung angezeigt. Zölle und Einfuhrsteuern trägt der Käufer.",
    },
    returns: {
      title: "Rückgabe",
      body: "Ungeöffnete Kits können innerhalb von 30 Tagen nach Lieferung zurückgegeben werden. Geöffnete Lasermodule sind von der Rückgabe ausgeschlossen, da es sich um optische Präzisionsinstrumente handelt, die nach dem Brechen des Siegels weder neu kalibriert noch weiterverkauft werden können. Die Rücksendekosten trägt der Käufer. Genehmigte Erstattungen gehen innerhalb von 10 Werktagen nach Eingang an die ursprüngliche Zahlungsmethode zurück.",
    },
    damaged: {
      title: "Beschädigt oder defekt",
      body: "Kommt ein Kit beschädigt an oder ist ein Bauteil defekt, schreiben Sie innerhalb von 7 Tagen nach Lieferung an info@dmtcode.com und fügen Sie Fotos des Artikels und der Verpackung bei. Wir ersetzen das betroffene Bauteil oder das komplette Kit kostenlos.",
    },
    sellerPrefix: "Verkäufer: Meridian Optics Lab, Tucson, Arizona. Die Zahlung läuft über Shopify.",
    sellerQuestions: "Fragen: info@dmtcode.com, Antwort innerhalb von 2 Werktagen.",
    sellerPolicies: "Alle Richtlinien",
    cardLine: "30 Tage Rückgaberecht für ungeöffnete Kits. Kostenloser Versand in den USA.",
    geoShips: "Sie scheinen sich in {country} zu befinden. Der Versand dorthin wird beim Bezahlen berechnet (USPS oder DHL Express) und vor der Zahlung angezeigt.",
    geoNoShip: "Sie scheinen sich in {country} zu befinden. Dorthin versenden wir noch nicht. Schreiben Sie an info@dmtcode.com, wir melden uns, sobald sich das ändert.",
  },
} as const;

type BuyLocale = keyof typeof PREPARE_BUY_COPY;
function buyCopy(locale: string) {
  return PREPARE_BUY_COPY[(locale as BuyLocale)] ?? PREPARE_BUY_COPY.en;
}

function regionName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}


const usd = (n: number) => `$${n.toLocaleString('en-US')}`;

function KitCard({ kit }: { kit: Kit }) {
  const locale = useLocale();
  const copy = buyCopy(locale);
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
            alt={`${kit.shortName} kit`}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <h3 className="font-serif text-2xl md:text-3xl leading-tight">{kit.name}</h3>

      <div className="mt-4 text-3xl font-black tracking-tight tabular-nums">
        {usd(kit.priceNumber)}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        Parts at Arbor list: {kit.diyCost}. The difference covers sourcing, one shipment and support.
      </div>

      <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
        {kit.description}
      </p>

      <div className="mt-4 text-xs text-muted-foreground">
        Arrives in 7 to 10 business days, processed within 2. Free US shipping. 18+, for research use.
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Ships from Arbor Scientific. Expect Arbor branding on the box, tape and packing slip. No prices on the packing slip. Meridian Optics Lab is the seller of record.
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
        <div className="mt-2 text-xs text-muted-foreground">
          {copy.cardLine}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Your card statement will read MERIDIAN OPTICS LAB.
        </div>

      </div>

    </Card>
  );
}

const Prepare = () => {
  const locale = useLocale();
  const copy = buyCopy(locale);
  const geo =
    typeof window !== 'undefined'
      ? ((window as any).__DMTCODE_GEO__ as { country?: string; ships?: boolean } | undefined)
      : undefined;
  const geoCountry =
    geo && typeof geo.country === 'string' && /^[A-Za-z]{2}$/.test(geo.country)
      ? geo.country.toUpperCase()
      : '';
  const showGeo = !!geoCountry && geoCountry !== 'US';
  const geoSentence = showGeo
    ? (geo?.ships ? copy.geoShips : copy.geoNoShip).replace(
        '{country}',
        regionName(geoCountry, locale),
      )
    : '';

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
            subtitle="Four laser diffraction research kits: one observer, one to two, two to three, or up to six. Every kit ships with optical components and diffraction optics; observation documents are free PDF downloads. Checkout runs on secure Shopify."
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
                Four configurations, sized by the number of observers and wavelengths. Each card prints what the same parts cost at Arbor Scientific list price.
              </p>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Every kit is built around the canonical 650 nm red baseline. Larger kits add comparative wavelengths so structured sessions can test whether observed patterns change with the light itself. The registry records wavelength on every submission.
              </p>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Making the line: the diffraction gratings split the beam into ordered points; a curved acrylic piece spreads it into a continuous line. Every kit includes one. Put the semicircle in the beam with its flat face toward the laser and move it closer to the laser for a longer line. Arbor&apos;s ray box guide (<a href="https://cdn.shopify.com/s/files/1/0030/6207/1369/files/P2-7680_Instructional_Guide_38e60437-4f8e-44a7-825f-112f77b20baa.pdf" className="underline hover:text-foreground">PDF</a>) and student handout (<a href="https://cdn.shopify.com/s/files/1/0030/6207/1369/files/P2-7680_Student_Handout.pdf" className="underline hover:text-foreground">PDF</a>) cover the optics set.
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

            <div data-block="shipping-returns" className="mb-10">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {copy.eyebrow}
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                {[copy.shipping, copy.outside, copy.returns, copy.damaged].map((item) => (
                  <Card key={item.title} className="p-5 rounded-2xl border border-border/60">
                    <h3 className="font-black text-sm">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {item.body}
                      {item === copy.outside && showGeo && (
                        <>
                          {' '}
                          <span data-geo={geoCountry} className="text-foreground">
                            {geoSentence}
                          </span>
                        </>
                      )}
                    </p>
                  </Card>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {copy.sellerPrefix}{' '}
                {copy.sellerQuestions.split('info@dmtcode.com')[0]}
                <a href="mailto:info@dmtcode.com" className="underline hover:text-foreground">info@dmtcode.com</a>
                {copy.sellerQuestions.split('info@dmtcode.com')[1]}{' '}
                <a href="/returns" className="underline hover:text-foreground">{copy.sellerPolicies}</a>
              </p>
            </div>


            <div className="grid md:grid-cols-2 gap-6 items-stretch">
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
