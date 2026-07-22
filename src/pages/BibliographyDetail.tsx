import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import type { BibliographyRow } from '@/components/bibliography/types';

type Row = BibliographyRow & { full_text: string | null; transcript: string | null };

const SITE = 'https://dmtcode.com';

const stanceChip = (row: Row) => {
  if (row.stance_unverified) return { label: 'Unverified', className: 'bg-muted text-muted-foreground' };
  if (row.stance_score == null) return null;
  if (row.stance_score >= 4) return { label: `Supportive (${row.stance_score > 0 ? '+' : ''}${row.stance_score})`, className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' };
  if (row.stance_score <= -4) return { label: `Skeptical (${row.stance_score})`, className: 'bg-rose-500/15 text-rose-500 border-rose-500/30' };
  return { label: `Balanced (${row.stance_score > 0 ? '+' : ''}${row.stance_score})`, className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' };
};

const displayDate = (row: Row) => row.source_date || (row.publication_date ? new Date(row.publication_date).getFullYear().toString() : null);

const BibliographyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('bibliography')
        .select('*')
        .eq('id', id)
        .eq('is_approved', true)
        .maybeSingle();
      if (cancelled) return;
      if (error) setError(error.message);
      else setRow(data as unknown as Row);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const stance = row ? stanceChip(row) : null;
  const date = row ? displayDate(row) : null;
  const href = row?.url || (row?.doi ? `https://doi.org/${row.doi}` : null);
  const canonical = row ? `${SITE}/bibliography/${row.id}` : `${SITE}/bibliography`;
  const bodyText = row?.full_text || row?.transcript || '';
  const bodyLabel = row?.full_text ? 'Full Text' : row?.transcript ? 'Transcript' : null;

  const ld = row ? {
    '@context': 'https://schema.org',
    '@type': row.content_type === 'Paper' || row.authority_type === 'Academic' ? 'ScholarlyArticle' : 'CreativeWork',
    '@id': canonical,
    name: row.title,
    headline: row.title,
    author: row.authors ? row.authors.split(/,|;/).map((n) => ({ '@type': 'Person', name: n.trim() })).filter((a) => a.name) : undefined,
    datePublished: row.source_date || row.publication_date || undefined,
    url: href || canonical,
    identifier: row.doi ? `https://doi.org/${row.doi}` : row.pmid || undefined,
    isPartOf: row.journal ? { '@type': 'Periodical', name: row.journal } : undefined,
    abstract: row.summary || row.abstract || undefined,
    keywords: row.tags || undefined,
    text: bodyText || undefined,
    additionalProperty: [
      row.stance_score != null && { '@type': 'PropertyValue', name: 'stanceScore', value: row.stance_score },
      row.authority_type && { '@type': 'PropertyValue', name: 'authority', value: row.authority_type },
      row.content_type && { '@type': 'PropertyValue', name: 'contentType', value: row.content_type },
    ].filter(Boolean),
  } : null;

  return (
    <>
      <Helmet>
        <title>{row ? `${row.title.slice(0, 70)} | DMT Code Research Library` : 'Research Library | DMT Code'}</title>
        <meta name="description" content={row?.summary?.slice(0, 160) || row?.abstract?.slice(0, 160) || 'Entry in the DMT Code research library.'} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={row?.title || 'Research Library'} />
        <meta property="og:description" content={row?.summary?.slice(0, 160) || 'Entry in the DMT Code research library.'} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary" />
        {ld && <script type="application/ld+json">{JSON.stringify(ld)}</script>}
      </Helmet>

      <div className="relative min-h-screen">
        <main id="main-content" className="relative z-10" role="main">
          <Navigation />

          <section className="max-w-3xl mx-auto px-4 py-12 space-y-6">
            <Link to="/bibliography" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="w-4 h-4" /> Back to Research Library
            </Link>

            {loading && <div className="text-center text-muted-foreground py-12">Loading entry...</div>}
            {error && <div className="text-center text-destructive py-12">Failed to load: {error}</div>}
            {!loading && !error && !row && <div className="text-center text-muted-foreground py-12">Entry not found.</div>}

            {row && (
              <article className="space-y-6">
                <header className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {row.content_type && <Badge variant="outline">{row.content_type}</Badge>}
                    {row.authority_type && <Badge variant="secondary">{row.authority_type}</Badge>}
                    {stance && (
                      <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${stance.className}`}>
                        {stance.label}
                      </span>
                    )}
                    {date && <span className="text-muted-foreground ml-auto">{date}</span>}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold leading-tight">{row.title}</h1>
                  {row.authors && <p className="text-muted-foreground">{row.authors}</p>}
                  {row.journal && <p className="text-sm italic text-muted-foreground">{row.journal}</p>}
                </header>

                {row.tags && row.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {row.tags.map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}

                {row.summary && (
                  <Card className="p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Summary</h2>
                    <p className="leading-relaxed">{row.summary}</p>
                  </Card>
                )}

                {bodyText && bodyLabel && (
                  <Card className="p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">{bodyLabel}</h2>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                      {bodyText}
                    </div>
                  </Card>
                )}

                {!bodyText && row.abstract && (
                  <Card className="p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Abstract</h2>
                    <p className="leading-relaxed">{row.abstract}</p>
                  </Card>
                )}

                <Card className="p-5 space-y-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Citation</h2>
                  {href && (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline break-all">
                      {href} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {row.doi && (
                    <div className="text-sm text-muted-foreground">
                      DOI: <a href={`https://doi.org/${row.doi}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{row.doi}</a>
                    </div>
                  )}
                  {row.pmid && (
                    <div className="text-sm text-muted-foreground">
                      PMID: <a href={`https://pubmed.ncbi.nlm.nih.gov/${row.pmid}/`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{row.pmid}</a>
                    </div>
                  )}
                </Card>
              </article>
            )}
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default BibliographyDetail;
