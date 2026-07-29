import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  EVIDENCE_LABEL,
  byDate,
  formatEntryDate,
  loadTimeline,
  sourceLink,
  TimelineFile,
} from '@/lib/timeline';

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-border/40 last:border-b-0">
    <div className="label-data text-xs text-muted-foreground sm:w-40 shrink-0 pt-1">{label}</div>
    <div className="text-sm text-foreground">{children}</div>
  </div>
);

const TimelineEntry = () => {
  const { id } = useParams();
  const [file, setFile] = useState<TimelineFile | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadTimeline()
      .then((j) => { if (alive) setFile(j); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  const sorted = useMemo(() => [...(file?.entries ?? [])].sort(byDate), [file]);
  const index = sorted.findIndex((e) => e.id === id);
  const entry = index >= 0 ? sorted[index] : null;
  const prev = index > 0 ? sorted[index - 1] : null;
  const next = index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null;
  const href = entry ? sourceLink(entry.source) : null;

  const jsonLd =
    entry && (entry.source.doi || entry.source.isbn)
      ? {
          '@context': 'https://schema.org',
          '@type': entry.evidence_class === 'book' ? 'Book' : 'ScholarlyArticle',
          name: entry.source.title,
          ...(entry.source.authors
            ? { author: entry.source.authors.map((a) => ({ '@type': 'Person', name: a })) }
            : {}),
          ...(entry.source.container ? { isPartOf: entry.source.container } : {}),
          ...(entry.source.year ? { datePublished: String(entry.source.year) } : {}),
          ...(entry.source.doi
            ? {
                identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: entry.source.doi },
                url: `https://doi.org/${entry.source.doi}`,
              }
            : {}),
          ...(entry.source.isbn ? { isbn: entry.source.isbn } : {}),
        }
      : null;

  return (
    <>
      <Helmet>
        <title>{entry ? `${entry.headline} | DMT Code chronology` : 'Chronology record | DMT Code'}</title>
        {entry && <meta name="description" content={entry.summary.slice(0, 300)} />}
        {entry && <link rel="canonical" href={`https://dmtcode.com/timeline/${entry.id}`} />}
        {entry && <meta property="og:title" content={entry.headline} />}
        {entry && <meta property="og:description" content={entry.summary.slice(0, 300)} />}
        {entry && <meta property="og:url" content={`https://dmtcode.com/timeline/${entry.id}`} />}
        {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />

        <main id="main-content" className="relative z-10 pt-4" role="main">
          <section className="container mx-auto px-4 py-12 max-w-3xl">
            <Link to="/timeline" className="text-sm text-gold hover:underline">Back to the chronology</Link>

            {failed && (
              <p className="mt-8 text-sm text-muted-foreground">
                The chronology data did not load. Reload the page, or read it directly at{' '}
                <a href="/timeline.json" className="text-gold hover:underline">/timeline.json</a>.
              </p>
            )}

            {!file && !failed && <p className="mt-8 text-sm text-muted-foreground">Loading the record.</p>}

            {file && !entry && (
              <div className="mt-8">
                <h1 className="text-3xl font-bold text-foreground mb-3">No record with that address</h1>
                <p className="text-sm text-muted-foreground">
                  Nothing in the chronology has the identifier {id}. Record addresses never change once published, so this is either a typo or a link to something that was never here.
                </p>
              </div>
            )}

            {entry && (
              <>
                <div className="mt-6 flex flex-wrap items-center gap-3 mb-3">
                  <span className="label-data text-xs text-muted-foreground">{formatEntryDate(entry.date)}</span>
                  <span className="text-xs rounded border border-border/60 px-2 py-0.5 text-muted-foreground">
                    {EVIDENCE_LABEL[entry.evidence_class] ?? entry.evidence_class}
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{entry.headline}</h1>

                <p className="text-base text-muted-foreground mb-6">{entry.summary}</p>

                {file.evidence_classes?.[entry.evidence_class] && (
                  <p className="text-xs text-muted-foreground mb-8">
                    {EVIDENCE_LABEL[entry.evidence_class] ?? entry.evidence_class}. {file.evidence_classes[entry.evidence_class]}
                  </p>
                )}

                <div className="border border-border rounded-lg p-5 bg-muted/20 mb-8">
                  <h2 className="text-lg font-semibold text-foreground mb-3">The source</h2>

                  {entry.source.title && <Row label="TITLE">{entry.source.title}</Row>}
                  {entry.source.authors && entry.source.authors.length > 0 && (
                    <Row label="AUTHORS">{entry.source.authors.join(', ')}</Row>
                  )}
                  {entry.source.container && <Row label="PUBLISHED IN">{entry.source.container}</Row>}
                  {entry.source.volume && <Row label="VOLUME">{entry.source.volume}</Row>}
                  {entry.source.pages && <Row label="PAGES">{entry.source.pages}</Row>}
                  {entry.source.publisher && <Row label="PUBLISHER">{entry.source.publisher}</Row>}
                  {entry.source.year && <Row label="YEAR">{entry.source.year}</Row>}
                  {entry.source.doi && (
                    <Row label="DOI">
                      <a
                        href={`https://doi.org/${entry.source.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:underline break-all"
                      >
                        {entry.source.doi}
                      </a>
                    </Row>
                  )}
                  {entry.source.isbn && <Row label="ISBN">{entry.source.isbn}</Row>}
                  {entry.source.url && !entry.source.doi && (
                    <Row label="LINK">
                      <a
                        href={entry.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:underline break-all"
                      >
                        {entry.source.url}
                      </a>
                    </Row>
                  )}
                  {entry.source.citation && <Row label="CITATION">{entry.source.citation}</Row>}
                  {entry.source.note && <Row label="NOTE">{entry.source.note}</Row>}

                  {href && (
                    <div className="mt-4">
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="label-data inline-flex items-center gap-2 rounded border border-border/60 px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                      >
                        READ THE SOURCE
                      </a>
                    </div>
                  )}
                </div>

                {entry.people && entry.people.length > 0 && (
                  <div className="mb-6">
                    <p className="label-data text-xs text-muted-foreground mb-2">PEOPLE</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.people.map((p) => (
                        <Link
                          key={p.sort + p.name}
                          to={`/timeline?sort=person&q=${encodeURIComponent(p.name)}`}
                          className="text-xs rounded border border-border/60 px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/40"
                        >
                          {p.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {entry.place && (
                  <div className="mb-6">
                    <p className="label-data text-xs text-muted-foreground mb-2">PLACE</p>
                    <Link
                      to={`/timeline?sort=place&q=${encodeURIComponent(entry.place.label)}`}
                      className="text-xs rounded border border-border/60 px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/40"
                    >
                      {entry.place.label}
                    </Link>
                  </div>
                )}

                <div className="mb-10">
                  <p className="label-data text-xs text-muted-foreground mb-2">TAGS</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map((t) => (
                      <Link
                        key={t}
                        to={`/timeline?tag=${encodeURIComponent(t)}`}
                        className="text-xs rounded border border-border/60 px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/40"
                      >
                        {t}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap justify-between gap-4 border-t border-border pt-6">
                  {prev ? (
                    <Link to={`/timeline/${prev.id}`} className="text-sm text-gold hover:underline">
                      Earlier: {prev.headline}
                    </Link>
                  ) : <span />}
                  {next && (
                    <Link to={`/timeline/${next.id}`} className="text-sm text-gold hover:underline">
                      Later: {next.headline}
                    </Link>
                  )}
                </div>
              </>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default TimelineEntry;
