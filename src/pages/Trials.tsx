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
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
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

  const uniq = (vals: (string | null)[]) =>
    Array.from(new Set(vals.filter((v): v is string => !!v))).sort();

  const statuses = useMemo(
    () => uniq(trials.map((t) => t.confirmed_status || t.status)),
    [trials]
  );
  const types = useMemo(() => uniq(trials.map((t) => t.trial_type)), [trials]);
  const locations = useMemo(() => uniq(trials.map((t) => t.location)), [trials]);
  const institutions = useMemo(() => uniq(trials.map((t) => t.institution)), [trials]);
  const sources = useMemo(() => uniq(trials.map((t) => t.source)), [trials]);

  const recruitingCount = useMemo(
    () =>
      trials.filter((t) =>
        (t.confirmed_status || t.status || '').toLowerCase().includes('recruit')
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
      const effectiveStatus = t.confirmed_status || t.status;
      if (statusFilter !== 'all' && effectiveStatus !== statusFilter) return false;
      if (typeFilter !== 'all' && t.trial_type !== typeFilter) return false;
      if (locationFilter !== 'all' && t.location !== locationFilter) return false;
      if (institutionFilter !== 'all' && t.institution !== institutionFilter) return false;
      if (sourceFilter !== 'all' && t.source !== sourceFilter) return false;
      if (term) {
        const hay = [t.title, t.institution || '']
          .join(' ')
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      const av = new Date(a.start_date || a.created_at).getTime();
      const bv = new Date(b.start_date || b.created_at).getTime();
      return sort === 'newest' ? bv - av : av - bv;
    });
    return rows;
  }, [trials, q, statusFilter, typeFilter, locationFilter, institutionFilter, sourceFilter, sort]);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, typeFilter, locationFilter, institutionFilter, sourceFilter, sort]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const clearFilters = () => {
    setQ('');
    setStatusFilter('all');
    setTypeFilter('all');
    setLocationFilter('all');
    setInstitutionFilter('all');
    setSourceFilter('all');
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
            Filter by status, type, location or institution to explore the current research frontier.
          </p>
        </header>

        <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Input
            placeholder="Search title or institution"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="sm:col-span-2 lg:col-span-2"
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {types.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
            <SelectTrigger className="sm:col-span-2 lg:col-span-2"><SelectValue placeholder="Institution" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All institutions</SelectItem>
              {institutions.map((i) => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="label-data text-xs text-muted-foreground">
            {loading ? '' : `${filtered.length} RESULTS`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearFilters}>Reset</Button>
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="title">Title A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
              {visible.map((t) => {
                const eff = t.confirmed_status || t.status;
                return (
                  <li key={t.id}>
                    <div className="rounded border border-border/60 bg-card p-5 transition-colors hover:border-foreground/40">
                      <Link to={`/trials/${t.id}`} className="block">
                        <h2 className="font-display text-xl leading-snug">{t.title}</h2>
                        <p className="label-data mt-2 text-[11px] text-muted-foreground">
                          {[
                            eff || 'STATUS UNKNOWN',
                            t.trial_type,
                            t.location,
                            t.institution,
                            t.start_date ? `START ${format(new Date(t.start_date), 'yyyy-MM-dd')}` : null,
                            t.source,
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
                      {t.application_url && (
                        <div className="mt-3">
                          <a
                            href={t.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            Apply <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
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
