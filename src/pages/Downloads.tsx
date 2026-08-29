import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SEO } from '@/components/SEO';
import { DOCUMENTS, docCountWord, DOC_PATH } from '@/data/documents';

// The document index. Before this page existed, /downloads was a 404 while
// /llms.txt told machines that the documents lived "under /downloads/", and the
// search query that brings the most readers to the site, "dmt laser code
// symbols pdf", landed people directly on a 1.7 MB PDF: no navigation, no
// explanation of what the catalogue is and is not, and no way to record an
// observation. The crawler copy of this page is renderDownloads in
// netlify/edge-functions/content-prerender.ts and is checked against this one
// by scripts/machine-truth-parity.mjs.

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 } as const;
const sans = { fontFamily: "'Hanken Grotesk', system-ui, sans-serif" } as const;

const SITE = 'https://dmtcode.com';

const Downloads = () => (
  <>
    <SEO uiKey="downloads" path="/downloads" />
    <Helmet>
      <meta name="robots" content="index, follow" />
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
            { '@type': 'ListItem', position: 2, name: 'Documents', item: `${SITE}/downloads` },
          ],
        })}
      </script>
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'DMT Code protocol documents',
          url: `${SITE}/downloads`,
          license: 'https://creativecommons.org/licenses/by/4.0/',
          isAccessibleForFree: true,
          hasPart: DOCUMENTS.map((d) => ({
            '@type': 'DigitalDocument',
            name: d.title,
            description: d.summary,
            url: `${SITE}${DOC_PATH(d.files[0].file)}`,
            encodingFormat: 'application/pdf',
            license: 'https://creativecommons.org/licenses/by/4.0/',
            isAccessibleForFree: true,
            inLanguage: d.files.map((f) => f.lang),
          })),
        })}
      </script>
    </Helmet>

    <div className="relative min-h-screen bg-background">
      <Navigation />
      <main id="main-content" className="relative z-10 pt-20" role="main">
        <Breadcrumb />

        <section className="container mx-auto px-4 max-w-3xl pt-4 space-y-5">
          <p className="label-data text-xs text-primary">DOCUMENTS</p>
          <h1 className="text-4xl md:text-5xl text-foreground" style={serif}>
            Everything you need to run a session, free
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed" style={sans}>
            {docCountWord()} PDF files, {DOCUMENTS.length} documents, each one in
            English, Spanish and German where a translation exists. No account,
            no email, no kit. Licensed CC BY 4.0, which means you can print them,
            hand them out, translate them and publish what you find.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed" style={sans}>
            You do not need to buy anything to take part. The{' '}
            <Link to="/protocol-guide" className="text-primary hover:underline">
              protocol guide
            </Link>{' '}
            describes how to build the rig from parts you can source yourself,
            and{' '}
            <Link to="/prepare" className="text-primary hover:underline">
              /prepare
            </Link>{' '}
            sells an assembled version for people who would rather not.
          </p>
        </section>

        <section className="container mx-auto px-4 max-w-3xl py-10 space-y-8">
          {DOCUMENTS.map((d) => (
            <article
              key={d.id}
              id={d.id}
              className="rounded-lg border border-border bg-card/40 p-5 space-y-3"
            >
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <h2 className="text-2xl text-foreground" style={serif}>
                  {d.title}
                </h2>
                <span className="label-data text-xs text-muted-foreground">
                  {d.kind.toUpperCase()}
                </span>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed" style={sans}>
                {d.summary}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed" style={sans}>
                <span className="text-foreground">What it is not.</span> {d.notThis}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed" style={sans}>
                <span className="text-foreground">When to use it.</span> {d.useWhen}
              </p>
              <ul className="flex flex-wrap gap-3 pt-1">
                {d.files.map((f) => (
                  <li key={f.file}>
                    <a
                      href={DOC_PATH(f.file)}
                      download
                      className="inline-block rounded border border-primary/40 px-3 py-1.5 text-sm text-primary hover:bg-primary/10"
                    >
                      {f.label} PDF
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="container mx-auto px-4 max-w-3xl pb-14 space-y-4">
          <h2 className="text-2xl text-foreground" style={serif}>
            Read the catalogue after you record, not before
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed" style={sans}>
            The symbol set is the one document with an order attached to it. If
            you have seen something and have not written it down yet, write it
            down first. A description made before you look at what other people
            drew is worth more than the same description made after, and the
            registry keeps the two apart.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed" style={sans}>
            <Link to="/capture" className="text-primary hover:underline">
              Record what you saw
            </Link>
            , then come back and open the catalogue. If you have already read it,
            say so on the form. Nothing is thrown away for having been read
            first, it is only counted differently.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed" style={sans}>
            The underlying records are open too: the browseable{' '}
            <Link to="/registry" className="text-primary hover:underline">
              registry
            </Link>
            , the{' '}
            <Link to="/dataset" className="text-primary hover:underline">
              dataset page
            </Link>{' '}
            and the machine readable corpus at{' '}
            <a href="/data.json" className="text-primary hover:underline">
              /data.json
            </a>
            , all CC BY 4.0.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  </>
);

export default Downloads;
