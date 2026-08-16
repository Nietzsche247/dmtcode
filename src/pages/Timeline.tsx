import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { SEO } from '@/components/SEO';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  EVIDENCE_LABEL,
  EVIDENCE_ORDER,
  byDate,
  formatEntryDate,
  loadTimeline,
  searchText,
  sourceLink,
  TimelineEntryRecord,
  TimelineFile,
} from '@/lib/timeline';

type Group = { key: string; label: string; note?: string; entries: TimelineEntryRecord[] };

const SORTS: { key: string; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'person', label: 'Person' },
  { key: 'place', label: 'Place' },
  { key: 'kind', label: 'Kind of evidence' },
];

const chip =
  'text-xs rounded border px-2 py-1 transition-colors cursor-pointer select-none';
const chipOff = 'border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40';
const chipOn = 'border-gold text-gold';

const EntryCard = ({ e }: { e: TimelineEntryRecord }) => {
  const href = sourceLink(e.source);
  return (
    <li className="border border-border rounded-lg p-5 bg-muted/20 transition-colors hover:border-foreground/30">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <span className="label-data text-xs text-muted-foreground">{formatEntryDate(e.date)}</span>
        <span className="text-xs rounded border border-border/60 px-2 py-0.5 text-muted-foreground">
          {EVIDENCE_LABEL[e.evidence_class] ?? e.evidence_class}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        <Link to={`/timeline/${e.id}`} className="hover:text-gold">{e.headline}</Link>
      </h3>
      {e.people && e.people.length > 0 && (
        <p className="text-sm text-muted-foreground mb-1">{e.people.map((p) => p.name).join(', ')}</p>
      )}
      {e.place && <p className="text-sm text-muted-foreground mb-1">{e.place.label}</p>}
      <p className="text-sm text-muted-foreground mb-3">{e.summary}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {e.tags.map((t) => (
          <Link
            key={t}
            to={`/timeline?tag=${encodeURIComponent(t)}`}
            className="text-xs rounded border border-border/60 px-2 py-0.5 text-muted-foreground hover:text-foreground hover:border-foreground/40"
          >
            {t}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link to={`/timeline/${e.id}`} className="text-gold hover:underline">Open the full record</Link>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
            Read the source
          </a>
        )}
      </div>
    </li>
  );
};

const Timeline = () => {
  const [file, setFile] = useState<TimelineFile | null>(null);
  const [failed, setFailed] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    let alive = true;
    loadTimeline()
      .then((j) => { if (alive) setFile(j); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  const sort = params.get('sort') ?? 'date';
  const dir = params.get('dir') === 'desc' ? 'desc' : 'asc';
  const q = params.get('q') ?? '';
  const activeTags = params.getAll('tag');
  const activeKinds = params.getAll('kind');
  const tagKey = activeTags.join('|');
  const kindKey = activeKinds.join('|');

  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    mutate(next);
    setParams(next, { replace: true });
  };

  const toggleIn = (name: string, value: string) =>
    update((p) => {
      const current = p.getAll(name);
      p.delete(name);
      const kept = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      kept.forEach((v) => p.append(name, v));
    });

  const entries = useMemo(() => file?.entries ?? [], [file]);

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    entries.forEach((e) => e.tags.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [entries]);

  const kindCounts = useMemo(() => {
    const m = new Map<string, number>();
    entries.forEach((e) => m.set(e.evidence_class, (m.get(e.evidence_class) ?? 0) + 1));
    return EVIDENCE_ORDER.filter((k) => m.has(k)).map((k) => [k, m.get(k) as number] as [string, number]);
  }, [entries]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const tagSet = tagKey ? tagKey.split('|') : [];
    const kindSet = kindKey ? kindKey.split('|') : [];
    return entries.filter((e) => {
      if (kindSet.length && !kindSet.includes(e.evidence_class)) return false;
      if (tagSet.length && !e.tags.some((t) => tagSet.includes(t))) return false;
      if (needle && !searchText(e).includes(needle)) return false;
      return true;
    });
  }, [entries, q, tagKey, kindKey]);

  const groups = useMemo<Group[]>(() => {
    const sorted = [...filtered].sort(byDate);
    const ordered = dir === 'desc' ? [...sorted].reverse() : sorted;

    if (sort === 'person') {
      const m = new Map<string, { label: string; entries: TimelineEntryRecord[] }>();
      const unnamed: TimelineEntryRecord[] = [];
      ordered.forEach((e) => {
        if (!e.people || e.people.length === 0) { unnamed.push(e); return; }
        e.people.forEach((p) => {
          const k = `${p.sort}|${p.name}`;
          if (!m.has(k)) m.set(k, { label: p.name, entries: [] });
          m.get(k)!.entries.push(e);
        });
      });
      const out: Group[] = [...m.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => ({ key: k, label: v.label, entries: v.entries }));
      if (unnamed.length) {
        out.push({
          key: 'no-person',
          label: 'No individual named in the source',
          note: 'These records are not attributed to a named person.',
          entries: unnamed,
        });
      }
      return out;
    }

    if (sort === 'place') {
      const m = new Map<string, TimelineEntryRecord[]>();
      const nowhere: TimelineEntryRecord[] = [];
      ordered.forEach((e) => {
        if (!e.place) { nowhere.push(e); return; }
        if (!m.has(e.place.label)) m.set(e.place.label, []);
        m.get(e.place.label)!.push(e);
      });
      const out: Group[] = [...m.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => ({ key: k, label: k, entries: v }));
      if (nowhere.length) {
        out.push({
          key: 'no-place',
          label: 'Place not stated in the source',
          note: 'A location is recorded only when the source states one.',
          entries: nowhere,
        });
      }
      return out;
    }

    if (sort === 'kind') {
      return EVIDENCE_ORDER
        .map((k) => ({
          key: k,
          label: EVIDENCE_LABEL[k] ?? k,
          note: file?.evidence_classes?.[k],
          entries: ordered.filter((e) => e.evidence_class === k),
        }))
        .filter((g) => g.entries.length > 0);
    }

    return [{ key: 'all', label: '', entries: ordered }];
  }, [filtered, sort, dir, file]);

  const visibleTags = showAllTags ? tagCounts : tagCounts.slice(0, 18);
  const anyFilter = Boolean(q) || activeTags.length > 0 || activeKinds.length > 0;

  return (
    <>
      {seo.key === 'timeline' ? (
        <SEO uiKey="timeline" path="/timeline" vars={seo.vars} />
      ) : (
        <SEO uiKey="timeline-empty" path="/timeline" />
      )}
      <Helmet>
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />

        <main id="main-content" className="relative z-10 pt-4" role="main">
          <section className="container mx-auto px-4 py-12 max-w-5xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              {file ? file.title.headline : 'A chronology of research into DMT visual phenomena'}
            </h1>

            {file && <p className="text-lg text-muted-foreground mb-4">{file.title.text}</p>}

            {file && (
              <p className="text-xs text-muted-foreground mb-8">
                Citations verified on {file.provenance.verified_on} against {file.provenance.verified_against}. {file.provenance.rule}
              </p>
            )}

            {failed && (
              <p className="text-sm text-muted-foreground">
                The chronology data did not load. Reload the page, or read it directly at{' '}
                <a href="/timeline.json" className="text-gold hover:underline">/timeline.json</a>.
              </p>
            )}

            {!file && !failed && <p className="text-sm text-muted-foreground">Loading the chronology.</p>}

            {file && (
              <>
                <div className="border border-border rounded-lg p-5 bg-muted/20 mb-8 space-y-5">
                  <div>
                    <p className="label-data text-xs text-muted-foreground mb-2">SORT BY</p>
                    <div className="flex flex-wrap gap-2">
                      {SORTS.map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => update((p) => p.set('sort', s.key))}
                          className={`${chip} ${sort === s.key ? chipOn : chipOff}`}
                        >
                          {s.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => update((p) => p.set('dir', dir === 'asc' ? 'desc' : 'asc'))}
                        className={`${chip} ${chipOff}`}
                      >
                        {dir === 'asc' ? 'Oldest first' : 'Newest first'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="label-data text-xs text-muted-foreground mb-2">KIND OF EVIDENCE</p>
                    <div className="flex flex-wrap gap-2">
                      {kindCounts.map(([k, n]) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => toggleIn('kind', k)}
                          className={`${chip} ${activeKinds.includes(k) ? chipOn : chipOff}`}
                        >
                          {EVIDENCE_LABEL[k] ?? k} {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="label-data text-xs text-muted-foreground mb-2">TAGS</p>
                    <div className="flex flex-wrap gap-2">
                      {visibleTags.map(([t, n]) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleIn('tag', t)}
                          className={`${chip} ${activeTags.includes(t) ? chipOn : chipOff}`}
                        >
                          {t} {n}
                        </button>
                      ))}
                      {tagCounts.length > 18 && (
                        <button
                          type="button"
                          onClick={() => setShowAllTags(!showAllTags)}
                          className={`${chip} ${chipOff}`}
                        >
                          {showAllTags ? 'Fewer tags' : `All ${tagCounts.length} tags`}
                        </button>
                      )}
                    </div>
                    {activeTags.length > 1 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Showing records carrying any of the selected tags.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="label-data text-xs text-muted-foreground mb-2">SEARCH</p>
                    <input
                      type="text"
                      value={q}
                      onChange={(ev) =>
                        update((p) => {
                          const v = ev.target.value;
                          if (v) p.set('q', v); else p.delete('q');
                        })
                      }
                      placeholder="Author, journal, place, phrase"
                      className="w-full rounded border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {filtered.length} of {entries.length} records.
                    </p>
                    {anyFilter && (
                      <button
                        type="button"
                        onClick={() => setParams(new URLSearchParams(sort !== 'date' ? { sort } : {}), { replace: true })}
                        className="text-sm text-gold hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>

                {filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nothing in the chronology matches that combination yet.
                  </p>
                )}

                <div className="space-y-10">
                  {groups.map((g) => (
                    <div key={g.key}>
                      {g.label && (
                        <div className="mb-3">
                          <h2 className="text-xl font-semibold text-foreground">{g.label}</h2>
                          {g.note && <p className="text-sm text-muted-foreground mt-1">{g.note}</p>}
                        </div>
                      )}
                      <ul className="space-y-4">
                        {g.entries.map((e) => (
                          <EntryCard key={`${g.key}-${e.id}`} e={e} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-12 p-6 bg-muted/30 border border-border rounded-lg">
                  <h2 className="text-xl font-semibold mb-3 text-foreground">Adding a paper</h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    The data behind this page is a single public file. A new paper is one object appended to its entries array. The shape is defined by a JSON Schema, which states which fields each kind of source requires and refuses a record that carries an identifier nobody has resolved.
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <a href="/timeline.json" className="text-gold hover:underline">The data</a>
                    <a href="/timeline.schema.json" className="text-gold hover:underline">The schema</a>
                    <Link to="/evidence-map" className="text-gold hover:underline">The same records on a visual timeline</Link>
                    <Link to="/bibliography" className="text-gold hover:underline">Bibliography</Link>
                    <Link to="/null-reports" className="text-gold hover:underline">Null reports</Link>
                  </div>
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

export default Timeline;
