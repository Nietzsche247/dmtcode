import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';

export const LAST_CHECKED = '2026-08-23';

const formatChecked = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCDate()} ${d.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' })} ${d.getUTCFullYear()}`;
};

const PAGE_TITLE =
  'The Discovery (2026): release date, where to watch, and what the film claims';
const PAGE_DESCRIPTION =
  'The Discovery is an independent documentary about the DMT laser observation first reported by Danny Goler. Premiere window, ticket status, and what is and is not confirmed.';

const WATCH_ROWS: [string, string][] = [
  ['Premiere', 'Los Angeles area, late October to early November 2026'],
  ['Exact date and venue', 'Not announced'],
  ['Format', 'A single ticketed screening event, with a live discussion'],
  ['Tickets', "Presale open on the film's own site"],
  ['Wider release', 'None announced'],
  ['Streaming', 'No distributor and no streaming platform has been announced'],
];

const INTERNAL_LINKS: [string, string][] = [
  ['See what people have actually reported', '/registry'],
  ['Read what the evidence does and does not support', '/evidence-map'],
  ['Understand the observation setup', '/protocol-guide'],
  [
    'Know what equipment a 650 nm observation involves, and the eyewear class it needs',
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
  director: {
    '@type': 'Person',
    name: 'Aaron Vanden',
  },
  disambiguatingDescription:
    'An independent documentary about the 650 nm laser observation reported during N,N-DMT experiences. Not to be confused with the unrelated 2017 Netflix feature The Discovery, directed by Charlie McDowell.',
  subjectOf: {
    '@type': 'Event',
    name: 'The Discovery premiere screening',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: 'Los Angeles area',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Los Angeles',
        addressRegion: 'CA',
        addressCountry: 'US',
      },
    },
  },
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
  return (
    <>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <link rel="canonical" href="https://dmtcode.com/the-discovery" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url" content="https://dmtcode.com/the-discovery" />
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
              The Discovery is an independent documentary about the visual forms some people
              report seeing when a 650 nm laser is used during an N,N-DMT experience. This page
              tracks what is confirmed about the film and what is not. It is not affiliated with
              the production.
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

            <p className="text-base leading-relaxed mb-6">
              If you are trying to work out whether you can watch it at home this year, the honest
              answer today is that no one has said so. One screening has been announced and nothing
              beyond it. We will update this page when that changes, and the date on it is the date
              we last checked.
            </p>

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

            <h2 className="text-2xl md:text-3xl font-semibold mb-4">Who made it</h2>
            <p className="text-base leading-relaxed mb-12">
              The film is directed by Aaron Vanden and was funded independently, including a public
              crowdfunding campaign. Danny Goler is its subject rather than its director.
            </p>

            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              What the film is about, and what that has to do with this site
            </h2>
            <p className="text-base leading-relaxed mb-4">
              The observation at the centre of the film was first reported by Danny Goler in August
              2020: that under a 650 nm laser, some people report seeing discrete, repeating visual
              forms during an N,N-DMT experience. A pilot study was published in IPI Letters in
              2025 (DOI 10.59973/ipil.158).
            </p>
            <p className="text-base leading-relaxed mb-4">
              What did not exist was a place to accumulate the evidence in a form anyone could
              inspect, including evidence that cuts against it. That is what this site is. Every
              reported symbol is a dated, permanent, openly licensed record. Every source carries a
              stance score. Negative results are published in the same place as positive ones,
              under the same licence.
            </p>
            <p className="text-base leading-relaxed mb-8">
              We do not know whether the phenomenon is real. We built the instrument that could
              find out.
            </p>
            <p className="text-base leading-relaxed mb-8">
              The reported symbol set is also available as a citable PDF:{' '}
              <a
                href="/downloads/dmt-laser-code-symbols.pdf"
                className="text-gold hover:underline font-medium"
              >
                DMT Laser Code Symbols (PDF)
              </a>
              .
            </p>

            <h3 className="text-xl font-semibold mb-4">Attribution</h3>
            <Card className="p-6 bg-muted/30 border-border mb-12">
              <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                <li>
                  First reported by. Danny Goler made the observation, and the written protocol
                  grew out of it.
                </li>
                <li>
                  No part in. He is not a founder of this site, holds no editorial role, and has no
                  part in the store.
                </li>
                <li>
                  Endorses nothing. He has not reviewed or approved any page, kit or claim here.
                </li>
              </ol>
              <p className="text-sm text-muted-foreground mt-4">
                The same three facts appear on{' '}
                <Link to="/people/danny-goler" className="text-gold hover:underline">
                  /people/danny-goler
                </Link>
                . This site is not affiliated with the film, its production, or its distribution.
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
                      <Link to={href} className="text-gold hover:underline font-medium">
                        {href}
                      </Link>
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>

            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              What we will update, and when
            </h2>
            <p className="text-base leading-relaxed mb-6">
              This page is a running record, not an announcement. It changes when one of these
              changes: the exact premiere date, the venue, a distribution or streaming deal, a
              festival selection, or a second screening.
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
