import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { SEO } from '@/components/SEO';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { EmailCapture } from '@/components/EmailCapture';
import { GolerAttribution } from '@/components/GolerAttribution';
import { KIT_MIN_PRICE } from '@/data/kits';
import { useLocale, localePath } from '@/i18n/LocaleProvider';

export const LAST_CHECKED = '2026-10-20';

const formatChecked = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCDate()} ${d.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' })} ${d.getUTCFullYear()}`;
};

const PAGE_TITLE =
  'The Discovery';
const PAGE_DESCRIPTION =
  'The Discovery is a documentary film. Release window late October to November 2026, exact date to be announced. Where to watch, and what this site keeps on the open record.';

const WATCH_ROWS: [string, string][] = [
  ['Release window', 'Late October to November 2026'],
  ['Exact date', 'To be announced'],
  ['Where to watch', 'Not yet announced'],
  ['Streaming', 'Nothing announced'],
];

const INTERNAL_LINKS: [string, string][] = [
  ['See what people have actually reported', '/registry'],
  ['Read what the evidence does and does not support', '/evidence-map'],
  ['Understand the observation setup', '/protocol-guide'],
  [
    'Know what equipment a 650 nm observation involves',
    '/prepare',
  ],
  ['Read the published literature, with stance scores', '/bibliography'],
  ['Read the strongest arguments against', '/critiques'],
];

const MOVIE_LD = {
  '@context': 'https://schema.org',
  '@type': 'Movie',
  name: 'The Discovery',
  url: 'https://dmtcode.com/the-discovery',
  sameAs: 'https://thediscoveryfilm.com',
  disambiguatingDescription:
    'Not to be confused with the unrelated 2017 Netflix feature The Discovery.',

};

const BREADCRUMB_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dmtcode.com/' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'The Discovery',
      item: 'https://dmtcode.com/the-discovery',
    },
  ],
};

const TheDiscovery = () => {
  const locale = useLocale();
  return (
    <>
      <SEO uiKey="the-discovery" path="/the-discovery" />
      <Helmet>
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <script type="application/ld+json">{JSON.stringify(MOVIE_LD)}</script>
        <script type="application/ld+json">{JSON.stringify(BREADCRUMB_LD)}</script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />

        <main id="main-content" className="relative z-10 pt-4" role="main">
          <section className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">The Discovery</h1>
            <p className="text-lg text-muted-foreground mb-12">
              The Discovery is a documentary film. This page tracks the release window, where it can be watched once that is announced, and how it relates to the open record kept on this site. The page is not affiliated with the film, its production or its distribution.
            </p>

            <h2 className="text-2xl md:text-3xl font-semibold mb-6">When can you watch it</h2>
            <Card className="p-0 overflow-hidden bg-card border-border mb-8">
              <dl className="divide-y divide-border">
                {WATCH_ROWS.map(([term, value]) => (
                  <div
                    key={term}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 px-5 py-4"
                  >
                    <dt className="text-sm font-medium text-muted-foreground">{term}</dt>
                    <dd className="sm:col-span-2 text-base">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card className="p-6 bg-card border-border mb-8">
              <h2 className="text-xl font-semibold mb-4">Get the release date</h2>
              <EmailCapture variant="inline" source="the-discovery" />
              <p className="text-xs text-muted-foreground mt-3">One email when the date is confirmed. Reply to be removed.</p>
            </Card>

            <p className="mb-12">
              <a
                href="https://thediscoveryfilm.com"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-2 text-gold hover:underline font-medium"
              >
                Official site: thediscoveryfilm.com
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </p>

            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              Is it the film on Netflix?
            </h2>
            <p className="text-base leading-relaxed mb-12">
              No, and this is a common mix-up worth clearing up. There is a 2017 Netflix feature
              also called The Discovery, directed by Charlie McDowell and starring Rooney Mara,
              Jason Segel and Robert Redford. It is a fiction film about a scientist who proves an
              afterlife exists. It has nothing to do with DMT, lasers, or this documentary.
              Searches for "the discovery netflix" almost always land on that one.
            </p>

            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              What this has to do with this site
            </h2>
            <p className="text-base leading-relaxed mb-4">
              This site keeps an open record that anyone can inspect. Reported symbols are dated, openly licensed records. Some bibliography sources carry stance scores; unscored sources are not neutral. Null results are published alongside positive reports under the same licence.
            </p>
            <p className="text-base leading-relaxed mb-8">
              We do not know whether the phenomenon is real.
            </p>
            <p className="text-base leading-relaxed mb-8">
              The reported symbol set is also available as a citable PDF:{' '}
              <a
                href={localePath(locale, '/downloads/dmt-laser-code-symbols.pdf')}
                className="text-gold hover:underline font-medium"
              >
                DMT Laser Code Symbols (PDF)
              </a>
              .
            </p>

            <h3 className="text-xl font-semibold mb-4">Attribution</h3>
            <Card className="p-6 bg-muted/30 border-border mb-12">
              <GolerAttribution />
              <p className="text-sm text-muted-foreground mt-4">
                This site is not affiliated with the film, its production, or its distribution.
              </p>
            </Card>

            <h2 className="text-2xl md:text-3xl font-semibold mb-6">If the film brings you here</h2>
            <Card className="p-0 overflow-hidden bg-card border-border mb-12">
              <dl className="divide-y divide-border">
                {INTERNAL_LINKS.map(([label, href]) => (
                  <div
                    key={href}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 px-5 py-4"
                  >
                    <dt className="sm:col-span-2 text-base">{label}</dt>
                    <dd className="text-sm">
                      <Link to={localePath(locale, href)} className="text-gold hover:underline font-medium">
                        {href}
                      </Link>
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>

            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-semibold mb-4">Preparing to observe</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
                <Link to={localePath(locale, '/prepare')} className="text-primary hover:underline">Kits from ${KIT_MIN_PRICE.toLocaleString('en-US')}, sold by Meridian Optics Lab</Link>
                <Link to={localePath(locale, '/protocol-guide')} className="text-primary hover:underline">The observation protocol</Link>
              </div>
            </section>

            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              What we will update, and when
            </h2>
            <p className="text-base leading-relaxed mb-6">
              This page is a running record, not an announcement. It changes when one of these
              changes: the exact release date, where to watch, or streaming availability.
            </p>
            <p className="text-sm text-muted-foreground">
              Last checked {formatChecked(LAST_CHECKED)}
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default TheDiscovery;
