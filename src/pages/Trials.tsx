import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { SEO } from '@/components/SEO';
import { LocalizedBody } from '@/components/LocalizedBody';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import ListRow from '@/components/list/ListRow';
import { formatMonthYear } from '@/lib/formatDate';
import { trialState } from '@/lib/trialState';
import { recordTypeLabel, isRegisteredClinicalTrial } from '@/lib/trialRecordType';

interface Trial {
  id: string;
  title: string;
  description: string | null;
  institution: string | null;
  principal_investigator: string | null;
  status: string | null;
  confirmed_status: string | null;
  trial_type: string | null;
  record_type: string | null;
  relevance: string | null;
  phase: string | null;
  location: string | null;
  source: string | null;
  application_url: string | null;
  start_date: string | null;
  end_date: string | null;
  trial_registry_id: string | null;
  doi: string | null;
  url: string | null;
  compounds: string[] | null;
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
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [compoundFilter, setCompoundFilter] = useState<string | null>(null);
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

  const statuses = useMemo(() => uniq(trials.map((t) => t.status)), [trials]);
  const verifications = useMemo(
    () => uniq(trials.map((t) => t.confirmed_status)),
    [trials]
  );
  const types = useMemo(() => uniq(trials.map((t) => t.trial_type)), [trials]);
  const phases = useMemo(() => uniq(trials.map((t) => t.phase)), [trials]);
  const locations = useMemo(() => uniq(trials.map((t) => t.location)), [trials]);
  const institutions = useMemo(() => uniq(trials.map((t) => t.institution)), [trials]);
  const sources = useMemo(() => uniq(trials.map((t) => t.source)), [trials]);

  const compoundCounts = useMemo(() => {
    const counts = new Map<string, number>();
    trials.forEach((t) => {
      (t.compounds || []).forEach((c) => {
        if (!c) return;
        counts.set(c, (counts.get(c) || 0) + 1);
      });
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [trials]);

  const recruitingCount = useMemo(
    () => trials.filter((t) => t.status === 'recruiting').length,
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
      if (verificationFilter !== 'all' && t.confirmed_status !== verificationFilter) return false;
      if (typeFilter !== 'all' && t.trial_type !== typeFilter) return false;
      if (phaseFilter !== 'all' && t.phase !== phaseFilter) return false;
      if (locationFilter !== 'all' && t.location !== locationFilter) return false;
      if (institutionFilter !== 'all' && t.institution !== institutionFilter) return false;
      if (sourceFilter !== 'all' && t.source !== sourceFilter) return false;
      if (compoundFilter && !(t.compounds || []).includes(compoundFilter)) return false;
      if (term) {
        const hay = [t.title, t.institution || ''].join(' ').toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    const byChosen = (a: Trial, b: Trial) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      const av = new Date(a.start_date || a.created_at).getTime();
      const bv = new Date(b.start_date || b.created_at).getTime();
      return sort === 'newest' ? bv - av : av - bv;
    };
    // Suspended and terminated sink to the bottom; never removed, never
    // filtered out by default. Everything else stays in chronological order.
    const sunk = rows.filter((t) => trialState(t.status).sinksToBottom).sort(byChosen);
    const afloat = rows.filter((t) => !trialState(t.status).sinksToBottom).sort(byChosen);
    // Registered clinical trials lead. Typed community records follow, in the same order, then the sunk rows.
    const reg = afloat.filter((t) => isRegisteredClinicalTrial(t.record_type));
    const other = afloat.filter((t) => !isRegisteredClinicalTrial(t.record_type));
    return [...reg, ...other, ...sunk];
  }, [trials, q, statusFilter, verificationFilter, typeFilter, phaseFilter, locationFilter, institutionFilter, sourceFilter, compoundFilter, sort]);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, verificationFilter, typeFilter, phaseFilter, locationFilter, institutionFilter, sourceFilter, compoundFilter, sort]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const clearFilters = () => {
    setQ('');
    setStatusFilter('all');
    setVerificationFilter('all');
    setTypeFilter('all');
    setPhaseFilter('all');
    setLocationFilter('all');
    setInstitutionFilter('all');
    setSourceFilter('all');
    setCompoundFilter(null);
    setSort('newest');
  };


  const total = trials.length;
  const registeredCount = useMemo(() => trials.filter((t) => isRegisteredClinicalTrial(t.record_type)).length, [trials]);
  const description = `Live registry of ${registeredCount} registered DMT and psychedelic clinical trials, plus ${total - registeredCount} typed community experiments, pilot reports and claims.`;

  return (
    <div className="min-h-screen bg-background">
      <SEO uiKey="trials" path="/trials" />
      <Helmet>
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Trials, Studies and Experiments | DMT Code" />
        <meta name="twitter:description" content={description} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Dataset',
                name: 'DMT Code Trials and Experiments Observatory',
                description,
                url: 'https://dmtcode.com/trials',
                license: 'https://creativecommons.org/licenses/by/4.0/',
                isAccessibleForFree: true,
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dmtcode.com/' },
                  { '@type': 'ListItem', position: 2, name: 'Trials', item: 'https://dmtcode.com/trials' },
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
          <LocalizedBody pageId="trials">
            <h1 className="font-display text-4xl md:text-6xl tracking-tight">
              Trials, Studies and Experiments
            </h1>
          </LocalizedBody>
          <p className="label-data mt-4 text-xs text-muted-foreground">
            {loading
              ? 'LOADING TRIALS…'
              : [
                  `${registeredCount} REGISTERED TRIALS`,
                  total - registeredCount > 0 ? `${total - registeredCount} EXPERIMENTS AND REPORTS` : null,
                  recruitingCount > 0 ? `${recruitingCount} RECRUITING` : null,
                  latestUpdated ? `UPDATED ${format(new Date(latestUpdated), 'yyyy-MM-dd')}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
          </p>

          <p className="mt-4 max-w-2xl text-muted-foreground">
            An open atlas of psychedelic clinical trials: DMT, 5-MeO-DMT, ayahuasca, psilocybin, ketamine, MDMA, LSD, ibogaine.
            Filter by status, type, location or institution to explore the current research frontier.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Every record carries a type. Registered clinical trials link to their registry entry and are the only records that count as clinical evidence here. Community experiments, pilot reports, platform projects, media claims and rumours are listed beside them, typed and labelled, because they are part of the story.
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
          <Select value={verificationFilter} onValueChange={setVerificationFilter}>
            <SelectTrigger><SelectValue placeholder="Verification" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All verifications</SelectItem>
              {verifications.map((s) => (
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
          <Select value={phaseFilter} onValueChange={setPhaseFilter}>
            <SelectTrigger><SelectValue placeholder="Phase" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All phases</SelectItem>
              {phases.map((s) => (
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

        {compoundCounts.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {compoundCounts.map(([c, count]) => (
              <Badge
                key={c}
                variant={compoundFilter === c ? 'default' : 'outline'}
                className="cursor-pointer select-none"
                onClick={() => setCompoundFilter(compoundFilter === c ? null : c)}
              >
                {c} ({count})
              </Badge>
            ))}
            {compoundFilter && (
              <Button variant="ghost" size="sm" onClick={() => setCompoundFilter(null)}>
                Clear compound filter
              </Button>
            )}
          </div>
        )}

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
            <ul>
              {visible.map((t) => {
                const stateInfo = trialState(t.status);
                const showVerification =
                  t.confirmed_status && t.confirmed_status !== 'Confirmed';
                // Country is the LAST comma separated segment of location.
                const loc = (t.location || '').trim();
                const parts = loc.split(',').map((p) => p.trim()).filter(Boolean);
                const country = parts.length > 1 ? parts[parts.length - 1] : loc || null;
                const action =
                  t.status === 'recruiting' && t.application_url
                    ? { label: 'How to apply', href: t.application_url, external: true }
                    : t.status === 'recruiting' && t.url
                      ? { label: 'Recruitment details', href: t.url, external: true }
                      : t.status === 'enrolling by invitation' && t.url
                        ? { label: 'Study record (enrols by invitation)', href: t.url, external: true }
                        : undefined;
                return (
                  <li key={t.id}>
                    <ListRow
                      gutterPrimary={stateInfo.state}
                      gutterTone={stateInfo.tone}
                      gutterSecondary={t.start_date ? formatMonthYear(t.start_date) : undefined}
                      pill={recordTypeLabel(t.record_type)}
                      meta={[t.phase, country, showVerification ? t.confirmed_status : null]}
                      title={t.title}
                      href={`/trials/${t.id}`}
                      owner={t.institution || undefined}
                      body={t.description || undefined}
                      tags={t.compounds || undefined}
                      dimmed={stateInfo.state === 'CLOSED'}
                      action={action}
                    />
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
