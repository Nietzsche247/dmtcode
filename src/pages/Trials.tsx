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
import TrialSubmissionModal from '@/components/events/TrialSubmissionModal';
import { AlertTriangle, Plus } from 'lucide-react';

interface Trial {
  id: string;
  title: string;
  description: string | null;
  institution: string | null;
  principal_investigator: string | null;
  organizer_lead: string | null;
  trial_type: string | null;
  status: string | null;
  confirmed_status: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  eligibility: string | null;
  trial_registry_id: string | null;
  doi: string | null;
  url: string | null;
  application_url: string | null;
  source: string | null;
  notes: string | null;
  updated_at: string;
  created_at: string;
}

const PAGE_SIZE = 30;

const TYPE_COLOURS: Record<string, string> = {
  'Formal Clinical Trial': 'bg-[hsl(var(--gold)/0.15)] text-foreground border-[hsl(var(--gold)/0.4)]',
  'Citizen-Science Experiment': 'bg-blue-500/10 text-foreground border-blue-500/40',
  'Retreat-Based Experiment': 'bg-emerald-500/10 text-foreground border-emerald-500/40',
  'Podcast-Mentioned': 'bg-purple-500/10 text-foreground border-purple-500/40',
};

const CONFIRMED_COLOURS: Record<string, string> = {
  Confirmed: 'text-emerald-600 dark:text-emerald-400',
  Partially: 'text-amber-600 dark:text-amber-400',
  Rumored: 'text-red-600 dark:text-red-400',
};

const Trials = () => {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [confirmedFilter, setConfirmedFilter] = useState<string>('all');
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

  const types = useMemo(() => {
    const s = new Set<string>();
    trials.forEach((t) => t.trial_type && s.add(t.trial_type));
    return Array.from(s).sort();
  }, [trials]);

  const locations = useMemo(() => {
    const s = new Set<string>();
    trials.forEach((t) => {
      const loc = t.location || t.institution;
      if (loc) s.add(loc);
    });
    return Array.from(s).sort();
  }, [trials]);

  const confirmedLevels = useMemo(() => {
    const s = new Set<string>();
    trials.forEach((t) => t.confirmed_status && s.add(t.confirmed_status));
    return Array.from(s).sort();
  }, [trials]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let rows = trials.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (typeFilter !== 'all' && t.trial_type !== typeFilter) return false;
      if (confirmedFilter !== 'all' && t.confirmed_status !== confirmedFilter) return false;
      if (locationFilter !== 'all') {
        const loc = t.location || t.institution || '';
        if (loc !== locationFilter) return false;
      }
      if (term) {
        const hay = [
          t.title,
          t.description || '',
          t.principal_investigator || '',
          t.organizer_lead || '',
          t.institution || '',
          t.location || '',
          t.source || '',
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
  }, [trials, q, statusFilter, typeFilter, locationFilter, confirmedFilter, sort]);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, typeFilter, locationFilter, confirmedFilter, sort]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const clearFilters = () => {
    setQ('');
    setStatusFilter('all');
    setTypeFilter('all');
    setLocationFilter('all');
    setConfirmedFilter('all');
    setSort('newest');
  };

  const total = trials.length;
  const description = `Live registry of ${total} DMT trials, laser Code of Reality experiments, retreats, and citizen-science projects.`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Trials & Experiments — DMT Laser Observatory | DMT Code</title>
        <meta name="description" content={description} />
        <link rel="canonical" href="https://dmtcode.com/trials" />
        <meta property="og:title" content="Trials & Experiments — DMT Laser Observatory" />
        <meta property="og:description" content={description} />
        <meta property="og:url" content="https://dmtcode.com/trials" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Trials & Experiments — DMT Laser Observatory" />
        <meta name="twitter:description" content={description} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Dataset',
                name: 'DMT Trials & Experiments Observatory',
                description,
                url: 'https://dmtcode.com/trials',
                license: 'https://creativecommons.org/licenses/by/4.0/',
                isAccessibleForFree: true,
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dmtcode.com/' },
                  { '@type': 'ListItem', position: 2, name: 'Trials & Experiments', item: 'https://dmtcode.com/trials' },
                ],
              },
            ],
          })}
        </script>
      </Helmet>

      <Navigation />
      <Breadcrumb />

      <main className="container mx-auto px-4 pb-24 pt-6">
        <header className="mb-6 border-b border-border/60 pb-8">
          <h1 className="font-display text-4xl md:text-6xl tracking-tight">
            Trials &amp; Experiments
          </h1>
          <p className="label-data mt-4 text-xs text-muted-foreground">
            {loading
              ? 'LOADING…'
              : `${total} ENTRIES TRACKED · FORMAL TRIALS · CITIZEN-SCIENCE · RETREATS · PODCAST-MENTIONED`}
          </p>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            An open atlas of formal DMT clinical trials alongside the citizen-science,
            retreat-based, and podcast-mentioned experiments surrounding the 650&nbsp;nm
            laser "Code of Reality" phenomenon. Historical and current entries, filterable
            by type, status, location, and confirmation level.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => setSubmitOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Suggest a trial or experiment
            </Button>
          </div>
        </header>

        {/* Disclaimer */}
        <div className="mb-8 flex gap-3 rounded border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-muted-foreground">
            <strong className="text-foreground">Editorial disclaimer.</strong>{' '}
            Most current 650&nbsp;nm laser "Code of Reality" experiments are{' '}
            <em>not</em> IRB-approved clinical trials. Citizen-science, retreat-based,
            and podcast-mentioned entries are documented here for transparency and
            historical record only. Confirmation levels (Confirmed / Partially / Rumored)
            reflect the state of public evidence, not medical or legal endorsement.
          </div>
        </div>

        <section className="mb-6 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          <Input
            placeholder="Search title, organizer, source…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="lg:col-span-2"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {types.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={confirmedFilter} onValueChange={setConfirmedFilter}>
            <SelectTrigger><SelectValue placeholder="Confirmed?" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any confirmation</SelectItem>
              {confirmedLevels.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section className="mb-8 grid gap-3 md:grid-cols-2">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((i) => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest start date</SelectItem>
              <SelectItem value="oldest">Oldest start date</SelectItem>
              <SelectItem value="title">Title A–Z</SelectItem>
            </SelectContent>
          </Select>
        </section>

        <div className="mb-6 flex items-center justify-between">
          <p className="label-data text-xs text-muted-foreground">
            {loading ? '' : `${filtered.length} RESULTS`}
          </p>
          <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
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
                const typeClass =
                  TYPE_COLOURS[t.trial_type || ''] ||
                  'bg-muted text-foreground border-border';
                const confClass =
                  CONFIRMED_COLOURS[t.confirmed_status || ''] || 'text-muted-foreground';
                return (
                  <li key={t.id}>
                    <Link
                      to={`/trials/${t.id}`}
                      className="block rounded border border-border/60 bg-card p-5 transition-colors hover:border-foreground/40"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-wide ${typeClass}`}
                        >
                          {t.trial_type || 'Trial'}
                        </span>
                        {t.confirmed_status && (
                          <span className={`text-[10px] uppercase tracking-wide ${confClass}`}>
                            ● {t.confirmed_status}
                          </span>
                        )}
                      </div>
                      <h2 className="font-display text-xl leading-snug">{t.title}</h2>
                      <p className="label-data mt-2 text-[11px] text-muted-foreground">
                        {[
                          t.status || 'STATUS UNKNOWN',
                          t.organizer_lead || t.institution,
                          t.location && t.location !== t.institution ? t.location : null,
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

      <TrialSubmissionModal open={submitOpen} onOpenChange={setSubmitOpen} />

      <Footer />
    </div>
  );
};

export default Trials;
