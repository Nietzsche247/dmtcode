import { useEffect, useState } from 'react';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Navigation } from '@/components/Navigation';
import { ResearchSection } from '@/components/ResearchSection';

import { TheoriesDashboard } from '@/components/TheoriesDashboard';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Helmet } from 'react-helmet';
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

  const dateModified = new Date().toISOString().slice(0, 10);

  const citationLd = citations.map((c) => ({
    '@type': 'ScholarlyArticle',
    name: c.title,
    author: c.authors ?? undefined,
    datePublished: c.publication_date ?? undefined,
    url: c.url ?? (c.doi ? `https://doi.org/${c.doi}` : undefined),
  }));

  return (
    <>
      <Helmet>
        <title>Published Research and Literature | DMT Code</title>
        <meta
          name="description"
          content="Academic papers, studies, and publications related to the DMT laser code phenomenon."
        />
        <link rel="canonical" href="https://dmtcode.com/research" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/research" />
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
            headline: 'DMT Code Scientific Research Repository',
            description:
              'Live selection from the stance scored research library on N,N-DMT phenomenology, visual symbols, and the 650 nm laser protocol.',
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
            <div className="container mx-auto px-4">
              <a
                href="/trials"
                className="label-data inline-flex items-center gap-2 rounded border border-border/60 px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                &rarr; CLINICAL TRIALS OBSERVATORY
              </a>
            </div>
            <ResearchSection />
            <TheoriesDashboard />

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Research;
