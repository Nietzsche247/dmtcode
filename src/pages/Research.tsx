import { useEffect, useState } from 'react';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Navigation } from '@/components/Navigation';
import { ResearchSection } from '@/components/ResearchSection';

import { ScienceRoom } from '@/components/research/ScienceRoom';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Helmet } from 'react-helmet';
import { SEO } from '@/components/SEO';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Citation {
  title: string;
  authors: string | null;
  publication_date: string | null;
  doi: string | null;
  url: string | null;
}

const Research = () => {
  const [citations, setCitations] = useState<Citation[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('bibliography')
        .select('title, authors, publication_date, doi, url')
        .eq('is_approved', true)
        .order('featured', { ascending: false, nullsFirst: false })
        .order('publication_date', { ascending: false, nullsFirst: false })
        .limit(10);
      setCitations((data as Citation[]) ?? []);
    })();
  }, []);

  const dateModified = citations.length
    ? (citations.map((c) => c.publication_date).filter(Boolean).sort().pop() || new Date().toISOString().slice(0, 10))
    : new Date().toISOString().slice(0, 10);

  const citationLd = citations.map((c) => ({
    '@type': 'ScholarlyArticle',
    name: c.title,
    author: c.authors ?? undefined,
    datePublished: c.publication_date ?? undefined,
    url: c.url ?? (c.doi ? `https://doi.org/${c.doi}` : undefined),
  }));

  return (
    <>
      <SEO uiKey="research" path="/research" />
      <Helmet>
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dmtcode.com/' },
              { '@type': 'ListItem', position: 2, name: 'Research', item: 'https://dmtcode.com/research' },
            ],
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ScholarlyArticle',
            headline: 'The Science Room: what has actually been measured',
            description:
              'Direct tests, mechanistic science, DMT science, methodology and open projects, drawn from the stance scored research library and the typed trials table.',
            author: { '@type': 'Organization', name: 'DMT Code Project' },
            datePublished: '2025-01-01',
            dateModified,
            license: 'https://creativecommons.org/licenses/by/4.0/',
            citation: citationLd,
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen">
        <ParticleBackground />

        <main id="main-content" className="relative z-10" role="main">
          <Navigation />
          <Breadcrumb />
          <div className="pt-4">
            <div className="container mx-auto px-4 max-w-4xl space-y-5">
              <p className="label-data text-xs text-primary">THE SCIENCE ROOM</p>
              <h1 className="font-display text-4xl md:text-5xl tracking-tight">
                What has actually been measured
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                The{' '}
                <Link to="/theories" className="text-primary hover:underline">
                  Theory Board
                </Link>{' '}
                is a library of proposals. This page is the other half of it: the
                measurements, the published work, and the methods that would
                settle the question. A theory sitting on this site is not
                evidence, and nothing here is a finding until it has survived a
                blinded test.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
                Every record listed below comes from the research library or the
                typed trials table, both of which anyone can download. Where a
                section holds no records yet, it says so rather than filling the
                space.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <a
                  href="/trials"
                  className="label-data inline-flex items-center gap-2 rounded border border-border/60 px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  &rarr; CLINICAL TRIALS OBSERVATORY
                </a>
                <a
                  href="/bibliography"
                  className="label-data inline-flex items-center gap-2 rounded border border-border/60 px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  &rarr; RESEARCH LIBRARY
                </a>
              </div>
            </div>
            <ScienceRoom />
            <ResearchSection />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Research;
