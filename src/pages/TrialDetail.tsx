import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';

interface Trial {
  id: string;
  title: string;
  description: string | null;
  institution: string | null;
  principal_investigator: string | null;
  status: string | null;
  confirmed_status: string | null;
  trial_type: string | null;
  location: string | null;
  source: string | null;
  application_url: string | null;
  eligibility: string | null;
  organizer_lead: string | null;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  trial_registry_id: string | null;
  doi: string | null;
  url: string | null;
  updated_at: string;
  created_at: string;
}

const fmt = (d: string | null) => (d ? format(new Date(d), 'yyyy-MM-dd') : '—');

const TrialDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [trial, setTrial] = useState<Trial | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinical_trials')
        .select('*')
        .eq('id', id)
        .eq('is_approved', true)
        .maybeSingle();
      if (error || !data) setNotFound(true);
      else setTrial(data as Trial);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        <main className="container mx-auto px-4 py-10">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="mt-4 h-4 w-1/3" />
          <Skeleton className="mt-8 h-40 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !trial) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl">Trial not found</h1>
          <p className="mt-3 text-muted-foreground">
            This trial may have been removed or is not yet approved.
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/trials">← Back to Clinical Trials</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const metaDesc = (trial.description || `Clinical trial: ${trial.title}`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
  const doiUrl = trial.doi ? `https://doi.org/${trial.doi}` : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalStudy',
        name: trial.title,
        description: trial.description || undefined,
        status: trial.status || undefined,
        startDate: trial.start_date || undefined,
        endDate: trial.end_date || undefined,
        sameAs: trial.url || undefined,
        identifier: trial.trial_registry_id || undefined,
        sponsor: trial.institution
          ? { '@type': 'Organization', name: trial.institution }
          : undefined,
        studyLocation: trial.institution
          ? { '@type': 'Organization', name: trial.institution }
          : undefined,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dmtcode.com/' },
          { '@type': 'ListItem', position: 2, name: 'Clinical Trials', item: 'https://dmtcode.com/trials' },
          { '@type': 'ListItem', position: 3, name: trial.title, item: `https://dmtcode.com/trials/${trial.id}` },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{trial.title} | DMT Code</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={`https://dmtcode.com/trials/${trial.id}`} />
        <meta property="og:title" content={trial.title} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:url" content={`https://dmtcode.com/trials/${trial.id}`} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={trial.title} />
        <meta name="twitter:description" content={metaDesc} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Navigation />
      <Breadcrumb />

      <main className="container mx-auto max-w-3xl px-4 pb-24 pt-6">
        <header className="mb-8 border-b border-border/60 pb-6">
          <p className="label-data mb-3 text-[11px] text-muted-foreground">
            CLINICAL TRIAL · {(trial.status || 'STATUS UNKNOWN').toUpperCase()}
          </p>
          <h1 className="font-display text-3xl leading-tight md:text-5xl">
            {trial.title}
          </h1>
        </header>

        <dl className="mb-10 grid grid-cols-1 gap-x-8 gap-y-4 border-b border-border/60 pb-8 sm:grid-cols-2">
          {[
            ['Status', trial.status],
            ['Institution', trial.institution],
            ['Principal investigator', trial.principal_investigator],
            ['Start date', fmt(trial.start_date)],
            ['End date', fmt(trial.end_date)],
            ['Registry ID', trial.trial_registry_id],
            ['DOI', trial.doi],
          ].map(([term, val]) => (
            <div key={term as string}>
              <dt className="label-data text-[10px] text-muted-foreground">{term}</dt>
              <dd className="mt-1 text-sm">{val || '—'}</dd>
            </div>
          ))}
        </dl>

        {trial.description && (
          <section className="mb-10">
            <h2 className="label-data mb-3 text-[11px] text-muted-foreground">DESCRIPTION</h2>
            <p className="whitespace-pre-line leading-relaxed">{trial.description}</p>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          {trial.url && (
            <Button asChild variant="outline">
              <a href={trial.url} target="_blank" rel="noopener noreferrer">
                View trial record <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
          {doiUrl && (
            <Button asChild variant="outline">
              <a href={doiUrl} target="_blank" rel="noopener noreferrer">
                DOI <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link to="/trials">← All trials</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TrialDetail;
