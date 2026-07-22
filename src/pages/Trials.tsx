import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface Trial {
  id: string;
  title: string;
  description: string | null;
  institution: string | null;
  principal_investigator: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  trial_registry_id: string | null;
  doi: string | null;
  url: string | null;
  updated_at: string;
  created_at: string;
}

const PAGE_SIZE = 30;

const Trials = () => {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinical_trials')
        .select('*')
        .eq('is_approved', true);
      if (error) setError(error.message);
      else setTrials((data ?? []) as Trial[]);
      setLoading(false);
    })();
  }, []);

  const statuses = useMemo(() => {
    const s = new Set<string>();
    trials.forEach((t) => t.status && s.add(t.status));
    return Array.from(s).sort();
  }, [trials]);

  const institutions = useMemo(() => {
    const s = new Set<string>();
    trials.forEach((t) => t.institution && s.add(t.institution));
    return Array.from(s).sort();
  }, [trials]);

  const recruitingCount = useMemo(
    () =>
      trials.filter((t) =>
        (t.status || '').toLowerCase().includes('recruit')
      ).length,
    [trials]
  );

  const latestUpdated = useMemo(() => {
    if (!trials.length) return null;
    return trials.reduce((max, t) =>
      new Date(t.updated_at) > new Date(max.updated_at) ? t : max
    ).updated_at;
  }, [trials]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let rows = trials.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (institutionFilter !== 'all' && t.institution !== institutionFilter)
        return false;
      if (term) {
        const hay = [
          t.title,
          t.description || '',
          t.principal_investigator || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      const av = a.start_date ? new Date(a.start_date).getTime() : 0;
      const bv = b.start_date ? new Date(b.start_date).getTime() : 0;
      return sort === 'newest' ? bv - av : av - bv;
    });
    return rows;
  }, [trials, q, statusFilter, institutionFilter, sort]);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, institutionFilter, sort]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const clearFilters = () => {
    setQ('');
    setStatusFilter('all');
    setInstitutionFilter('all');
    setSort('newest');
  };

  const total = trials.length;
  const description = `Live registry of ${total} DMT and psychedelic clinical trials tracked across institutions worldwide.`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Clinical Trials — DMT Research Observatory | DMT Code</title>
        <meta name="description" content={description} />
        <link rel="canonical" href="https://dmtcode.com/trials" />
        <meta property="og:title" content="Clinical Trials — DMT Research Observatory" />
        <meta property="og:description" content={description} />
        <meta property="og:url" content="https://dmtcode.com/trials" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Clinical Trials — DMT Research Observatory" />
        <meta name="twitter:description" content={description} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Dataset',
                name: 'DMT Clinical Trials Observatory',
                description,
                url: 'https://dmtcode.com/trials',
                license: 'https://creativecommons.org/licenses/by/4.0/',
                isAccessibleForFree: true,
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dmtcode.com/' },
                  { '@type': 'ListItem', position: 2, name: 'Clinical Trials', item: 'https://dmtcode.com/trials' },
                ],
              },
            ],
          })}
        </script>
      </Helmet>

      <Navigation />
      <Breadcrumb />

      <main className="container mx-auto px-4 pb-24 pt-6">
        <header className="mb-10 border-b border-border/60 pb-8">
          <h1 className="font-display text-4xl md:text-6xl tracking-tight">
            Clinical Trials
          </h1>
          <p className="label-data mt-4 text-xs text-muted-foreground">
            {loading
              ? 'LOADING TRIALS…'
              : `${total} TRIALS TRACKED · ${recruitingCount} RECRUITING${
                  latestUpdated
                    ? ` · UPDATED ${format(new Date(latestUpdated), 'yyyy-MM-dd')}`
                    : ''
                }`}
          </p>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            An open atlas of active and historical DMT-related clinical trials.
            Filter by status or institution to explore the current research frontier.
          </p>
        </header>

        <section className="mb-8 grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Search title, description, PI…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="md:col-span-2"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
            <SelectTrigger><SelectValue placeholder="Institution" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All institutions</SelectItem>
              {institutions.map((i) => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <div className="mb-6 flex items-center justify-between">
          <p className="label-data text-xs text-muted-foreground">
            {loading ? '' : `${filtered.length} RESULTS`}
          </p>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest start date</SelectItem>
              <SelectItem value="oldest">Oldest start date</SelectItem>
              <SelectItem value="title">Title A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded border border-destructive/40 bg-destructive/5 p-6">
            <p className="font-medium">Couldn't load trials.</p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded border border-border/60 p-8 text-center">
            <p className="mb-4">No trials match these filters.</p>
            <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
          </div>
        ) : (
          <>
            <ul className="grid gap-4">
              {visible.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/trials/${t.id}`}
                    className="block rounded border border-border/60 bg-card p-5 transition-colors hover:border-foreground/40"
                  >
                    <h2 className="font-display text-xl leading-snug">{t.title}</h2>
                    <p className="label-data mt-2 text-[11px] text-muted-foreground">
                      {[
                        t.status || 'STATUS UNKNOWN',
                        t.institution,
                        t.start_date ? `START ${format(new Date(t.start_date), 'yyyy-MM-dd')}` : null,
                        t.trial_registry_id,
                      ]
                        .filter(Boolean)
                        .join(' · ')
                        .toUpperCase()}
                    </p>
                    {t.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                        {t.description}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                  Load more ({filtered.length - visible.length} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Trials;
