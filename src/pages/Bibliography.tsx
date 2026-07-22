import { useEffect, useMemo, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { FilterGuide } from '@/components/bibliography/FilterGuide';
import { BibliographyCard } from '@/components/bibliography/BibliographyCard';
import { BibliographyFilters } from '@/components/bibliography/BibliographyFilters';
import { emptyFilters, type BibliographyRow, type FilterState } from '@/components/bibliography/types';

const sortByDateDesc = (a: BibliographyRow, b: BibliographyRow) => {
  const av = a.source_date || a.publication_date || '';
  const bv = b.source_date || b.publication_date || '';
  return bv.localeCompare(av);
};

const yearOf = (r: BibliographyRow): string | null => {
  if (r.source_date) {
    const m = r.source_date.match(/\d{4}/);
    if (m) return m[0];
  }
  if (r.publication_date) return new Date(r.publication_date).getFullYear().toString();
  return null;
};

const matchesFilters = (r: BibliographyRow, f: FilterState): boolean => {
  if (f.contentType !== 'all' && r.content_type !== f.contentType) return false;
  if (f.authorityType !== 'all' && r.authority_type !== f.authorityType) return false;
  if (f.tag !== 'all' && !(r.tags || []).includes(f.tag)) return false;
  if (f.year !== 'all' && yearOf(r) !== f.year) return false;
  if (f.stance !== 'all') {
    if (f.stance === 'unverified' && !r.stance_unverified) return false;
    if (f.stance === 'supportive' && !(r.stance_score != null && r.stance_score >= 4)) return false;
    if (f.stance === 'skeptical' && !(r.stance_score != null && r.stance_score <= -4)) return false;
    if (f.stance === 'balanced' && !(r.stance_score != null && r.stance_score >= -3 && r.stance_score <= 3)) return false;
  }
  if (f.search.trim()) {
    const q = f.search.toLowerCase();
    const hay = `${r.title} ${r.authors ?? ''} ${r.journal ?? ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
};

const Bibliography = () => {
  const [rows, setRows] = useState<BibliographyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bibliography')
        .select('*')
        .eq('is_approved', true)
        .limit(2000);
      if (cancelled) return;
      if (error) setError(error.message);
      else setRows((data || []) as unknown as BibliographyRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const featured = useMemo(() => rows.filter((r) => r.featured).sort(sortByDateDesc), [rows]);
  const library = useMemo(() => rows.filter((r) => !r.featured).sort(sortByDateDesc), [rows]);

  const filteredLibrary = useMemo(() => library.filter((r) => matchesFilters(r, filters)), [library, filters]);

  const contentTypes = useMemo(() => Array.from(new Set(rows.map((r) => r.content_type).filter(Boolean) as string[])).sort(), [rows]);
  const authorityTypes = useMemo(() => Array.from(new Set(rows.map((r) => r.authority_type).filter(Boolean) as string[])).sort(), [rows]);
  const tags = useMemo(() => Array.from(new Set(rows.flatMap((r) => r.tags || []))).sort(), [rows]);
  const years = useMemo(() => Array.from(new Set(rows.map(yearOf).filter(Boolean) as string[])).sort((a, b) => b.localeCompare(a)), [rows]);

  const listJsonLd = useMemo(() => {
    if (!featured.length) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'DMT Code Research Library',
      description: 'Curated research library on the DMT Code of Reality phenomenon.',
      url: 'https://dmtcode.com/bibliography',
      license: 'https://creativecommons.org/licenses/by/4.0/',
      hasPart: {
        '@type': 'ItemList',
        itemListElement: featured.map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': r.content_type === 'Paper' || r.authority_type === 'Academic' ? 'ScholarlyArticle' : 'Article',
            '@id': `https://dmtcode.com/bibliography/${r.id}`,
            name: r.title,
            headline: r.title,
            url: r.url || (r.doi ? `https://doi.org/${r.doi}` : `https://dmtcode.com/bibliography/${r.id}`),
            author: r.authors || undefined,
            datePublished: r.source_date || r.publication_date || undefined,
            identifier: r.doi || r.pmid || undefined,
            additionalProperty: [
              r.stance_score != null && { '@type': 'PropertyValue', name: 'stanceScore', value: r.stance_score },
              r.authority_type && { '@type': 'PropertyValue', name: 'authority', value: r.authority_type },
            ].filter(Boolean),
          },
        })),
      },
    };
  }, [featured]);

  return (
    <>
      <Helmet>
        <title>Research Library | DMT Code</title>
        <meta name="description" content="Unified research library covering the Code of Reality phenomenon: peer reviewed papers, curated public sources, and skeptical responses." />
        <link rel="canonical" href="https://dmtcode.com/bibliography" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Research Library | DMT Code" />
        <meta property="og:description" content="Unified research library covering the Code of Reality phenomenon: peer reviewed papers, curated public sources, and skeptical responses." />
        <meta property="og:url" content="https://dmtcode.com/bibliography" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        {listJsonLd && <script type="application/ld+json">{JSON.stringify(listJsonLd)}</script>}
      </Helmet>

      <div className="relative min-h-screen">
        <main id="main-content" className="relative z-10" role="main">
          <Navigation />

          <section className="max-w-6xl mx-auto px-4 py-16 space-y-10">
            <header className="text-center space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold">Research Library</h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                One unified index of the sources behind the Code of Reality phenomenon. Peer reviewed
                papers, primary data releases, podcasts, and skeptical commentary.
              </p>
            </header>

            <FilterGuide />

            {loading && <div className="text-center text-muted-foreground py-12">Loading research library...</div>}
            {error && <div className="text-center text-destructive py-12">Failed to load: {error}</div>}

            {!loading && !error && (
              <>
                {featured.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <h2 className="text-2xl font-semibold">Research Timeline</h2>
                      <span className="text-sm text-muted-foreground">{featured.length} featured</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {featured.map((r) => <BibliographyCard key={r.id} row={r} />)}
                    </div>
                  </section>
                )}

                <section className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-2xl font-semibold">Full Library</h2>
                    <span className="text-sm text-muted-foreground">{filteredLibrary.length} of {library.length}</span>
                  </div>

                  <BibliographyFilters
                    value={filters}
                    onChange={setFilters}
                    contentTypes={contentTypes}
                    authorityTypes={authorityTypes}
                    tags={tags}
                    years={years}
                  />

                  {filteredLibrary.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">No entries match the current filters.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredLibrary.map((r) => <BibliographyCard key={r.id} row={r} />)}
                    </div>
                  )}
                </section>
              </>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Bibliography;
