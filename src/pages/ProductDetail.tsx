import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { KITS, type Kit } from '@/data/kits';
import { useLocale, localePath } from '@/i18n/LocaleProvider';
import { uiCopy } from '@/i18n/ui-strings';
import NotFound from './NotFound';

const SITE = 'https://dmtcode.com';

// The drill-down page for one kit. Everything on it comes from src/data/kits.ts,
// which is the same array /prepare, shop.json, llms.txt and the prerenderer read.
// The contents table and the per emitter safety table are rendered from that
// data rather than retyped, so the page cannot state a bill of materials that
// disagrees with the catalogue.

function Gallery({ kit }: { kit: Kit }) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const photos = kit.photos;
  if (photos.length === 0) return null;

  // Roving tabindex: one stop in the tab order for the whole strip, arrow keys
  // move between thumbnails, Home and End jump to the ends.
  const move = (next: number) => {
    const i = (next + photos.length) % photos.length;
    setActive(i);
    tabRefs.current[i]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(active + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(active - 1); }
    else if (e.key === 'Home') { e.preventDefault(); move(0); }
    else if (e.key === 'End') { e.preventDefault(); move(photos.length - 1); }
  };

  return (
    <div>
      <div
        id={`kit-photo-${kit.id}`}
        role="tabpanel"
        aria-label={`${kit.shortName} kit, image ${active + 1} of ${photos.length}`}
        className="aspect-square rounded-2xl overflow-hidden border border-border/60 bg-muted/20"
      >
        <img
          src={photos[active].url}
          alt={photos[active].alt}
          width={2048}
          height={2048}
          loading={active === 0 ? 'eager' : 'lazy'}
          className="w-full h-full object-contain"
        />
      </div>

      {photos.length > 1 && (
        <div
          role="tablist"
          aria-label={`${kit.shortName} kit photographs`}
          onKeyDown={onKeyDown}
          className="grid grid-cols-5 gap-2 mt-3"
        >
          {photos.map((photo, i) => (
            <button
              key={photo.url}
              ref={(el) => { tabRefs.current[i] = el; }}
              type="button"
              role="tab"
              id={`kit-thumb-${kit.id}-${i}`}
              aria-selected={i === active}
              aria-controls={`kit-photo-${kit.id}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={`aspect-square rounded-lg overflow-hidden border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                i === active ? 'border-primary' : 'border-border/60 hover:border-primary/50'
              }`}
            >
              <img
                src={photo.url}
                alt={photo.alt}
                width={2048}
                height={2048}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        {photos.length} photographs. Components are photographed individually as they ship.
      </p>
    </div>
  );
}

function ContentsTable({ kit }: { kit: Kit }) {
  return (
    <div className="mt-10">
      <h2 className="font-serif text-2xl">What is in the box</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Every part shipped with this kit, with the Arbor Scientific part number and the
        quantity. This is the list the supplier order is placed from.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <caption className="sr-only">{kit.shortName} kit bill of materials</caption>
          <thead>
            <tr className="border-b border-border/60 text-left font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-normal">Part</th>
              <th scope="col" className="py-2 pr-4 font-normal">Item</th>
              <th scope="col" className="py-2 text-right font-normal">Qty</th>
            </tr>
          </thead>
          <tbody>
            {kit.contents.map((item) => (
              <tr key={item.sku} className="border-b border-border/30 align-top">
                <th scope="row" className="py-3 pr-4 font-mono text-xs whitespace-nowrap font-normal text-muted-foreground">
                  {item.vendor_url ? (
                    <a href={item.vendor_url} rel="noopener" className="underline hover:text-foreground">
                      {item.sku}
                    </a>
                  ) : (
                    item.sku
                  )}
                </th>
                <td className="py-3 pr-4 text-foreground">
                  {item.name}
                  {item.note && (
                    <span className="block text-xs text-muted-foreground">{item.note}</span>
                  )}
                </td>
                <td className="py-3 text-right tabular-nums text-muted-foreground">{item.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// One row per light source. A kit with more than one emitter has no single
// laser class, so this never collapses into one blanket line. Class
// designations are standard identifiers and are printed exactly as the vendor
// states them, in every locale.
function EmitterTable({ kit }: { kit: Kit }) {
  return (
    <div className="mt-10">
      <h2 className="font-serif text-2xl">Laser safety, per emitter</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {kit.emitters.length > 1
          ? 'This kit has more than one light source, so it has no single laser class. Each source is rated separately below.'
          : 'Vendor rating for the single light source in this kit.'}
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <caption className="sr-only">{kit.shortName} kit vendor laser ratings per emitter</caption>
          <thead>
            <tr className="border-b border-border/60 text-left font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-normal">Emitter</th>
              <th scope="col" className="py-2 pr-4 font-normal">Wavelength</th>
              <th scope="col" className="py-2 pr-4 font-normal">Vendor rated output</th>
              <th scope="col" className="py-2 font-normal">Vendor class</th>
            </tr>
          </thead>
          <tbody>
            {kit.emitters.map((e) => (
              <tr key={e.sku} className="border-b border-border/30 align-top">
                <th scope="row" className="py-3 pr-4 text-left font-normal text-foreground">
                  {e.name}
                  <span className="block font-mono text-xs text-muted-foreground">{e.sku}</span>
                </th>
                <td className="py-3 pr-4 tabular-nums text-muted-foreground whitespace-nowrap">{e.wavelength_nm} nm</td>
                <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">{e.vendor_output}</td>
                <td className="py-3 font-mono text-xs text-foreground whitespace-nowrap" translate="no">
                  {e.vendor_class}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Do not stare into the beam, do not aim it at anyone, and treat every reflective surface
        in the room as part of the beam path. Not for children 12 and under.
      </p>
    </div>
  );
}

const ProductDetail = () => {
  const { handle = '' } = useParams();
  const locale = useLocale();
  const kit = KITS.find((k) => k.handle === handle);

  if (!kit) return <NotFound />;

  const path = `/products/${kit.handle}`;
  const canonical = `${SITE}${localePath(locale, path)}`;
  const copy = uiCopy(`product-${kit.id}`, locale);

  const trackClick = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'bundle_cta_click', {
        kit: kit.id,
        price: kit.priceNumber,
      });
    }
  };

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SITE}${path}#product`,
    name: kit.name,
    description: kit.description,
    sku: kit.sku,
    url: `${SITE}${path}`,
    image: kit.photos.map((p) => p.url),
    brand: { '@type': 'Brand', name: 'Meridian Optics Lab' },
    offers: {
      '@type': 'Offer',
      url: kit.cart,
      price: kit.priceNumber,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Meridian Optics Lab' },
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Prepare', item: `${SITE}/prepare` },
      { '@type': 'ListItem', position: 3, name: kit.name, item: `${SITE}${path}` },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{copy.title}</title>
        <meta name="description" content={copy.description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={copy.title} />
        <meta property="og:description" content={copy.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="product" />
        {kit.photos[0] && <meta property="og:image" content={kit.photos[0].url} />}
        <script type="application/ld+json">{JSON.stringify(productLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <Navigation />
      <Breadcrumb titleOverride={kit.name} />

      <main className="container mx-auto px-4 pb-24 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <Gallery kit={kit} />

          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">{kit.name}</h1>

            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-3">
              {kit.shortName} &middot; {kit.observers === '1' ? '1 observer' : `${kit.observers} observers`}
              {' '}&middot; {kit.emitters.length === 1 ? '1 light source' : `${kit.emitters.length} light sources`}
            </div>

            <div className="text-3xl font-black tracking-tight tabular-nums mt-5">{kit.price}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Parts at Arbor list: {kit.diyCost}. The difference covers sourcing, one shipment and support.
            </div>

            <p className="text-sm text-muted-foreground mt-6 leading-relaxed">{kit.description}</p>

            <div className="mt-6 space-y-1 text-xs text-muted-foreground">
              <p>{kit.availability} Processed within 2 business days.</p>
              <p>
                Ships from Arbor Scientific. Expect Arbor branding on the box, tape and packing
                slip. No prices on the packing slip. Meridian Optics Lab is the seller of record.
              </p>
            </div>

            <div className="mt-8">
              <a
                href={kit.cart}
                target="_self"
                onClick={trackClick}
                className="inline-flex items-center justify-center w-full h-12 rounded-lg bg-primary text-primary-foreground font-black text-base hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Buy now. Secure Shopify checkout
              </a>
              <div className="mt-2 text-xs text-muted-foreground">
                Your card statement will read MERIDIAN OPTICS LAB.
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                <a href={localePath(locale, '/prepare')} className="underline hover:text-foreground">
                  Back to all four kits
                </a>
                {' '}&middot;{' '}
                <a href={localePath(locale, '/returns')} className="underline hover:text-foreground">
                  Shipping and returns
                </a>
              </div>
            </div>
          </div>
        </div>

        <ContentsTable kit={kit} />
        <EmitterTable kit={kit} />

        <div className="mt-10 text-xs text-muted-foreground leading-relaxed max-w-3xl">
          <p>
            For educational and research use by adults 18 and older. Observation documents are
            free PDF downloads at{' '}
            <a href={localePath(locale, '/prepare')} className="underline hover:text-foreground">/prepare</a>.
            The machine readable catalogue is at{' '}
            <a href="/shop.json" className="underline hover:text-foreground">/shop.json</a>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
