import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';

/**
 * This page is a browser rendered view over the machine readable corpus.
 * It is not an API. It fetches /data.json with client side JavaScript and
 * renders HTML, so nothing other than a browser can consume it.
 *
 * The fields below mirror exactly what the corpus publishes for a symbol
 * record. The corpus omits a key when the value is unknown, so every field
 * other than id and url is optional here. Do not add a field to this
 * interface unless the corpus actually publishes it.
 */
interface CorpusSymbol {
  id: string;
  url: string;
  description?: string;
  tags?: string[];
  image_url?: string;
  visibility_status?: string;
  moderation_status?: string;
  evidence_status?: string;
  is_curated_example?: boolean;
  published_at?: string;
  review_due_at?: string;
  review_overdue?: boolean;
  recognized_count?: number;
  not_a_match_count?: number;
  upvote_count?: number;
  created_at?: string;
  updated_at?: string;
  record_class?: string;
  counts_toward_evidence?: boolean;
}

const CORPUS_PATH = '/data.json';
const CORPUS_URL = 'https://dmtcode.com/data.json';
const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 100;

const ApiSymbols = () => {
  const [searchParams] = useSearchParams();
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(CORPUS_PATH, { headers: { accept: 'application/json' } });
        if (!res.ok) {
          throw new Error(`the corpus responded with HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!Array.isArray(data?.symbols)) {
          throw new Error('the corpus response carried no symbols array');
        }

        let symbols = data.symbols as CorpusSymbol[];
        const applied: Record<string, string> = {};

        const tag = searchParams.get('tag');
        if (tag) {
          applied.tag = tag;
          const wanted = tag.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
          symbols = symbols.filter((s) =>
            (s.tags || []).some((t) => wanted.some((w) => t.toLowerCase().includes(w)))
          );
        }

        const moderationStatus = searchParams.get('moderation_status');
        if (moderationStatus) {
          applied.moderation_status = moderationStatus;
          symbols = symbols.filter(
            (s) => (s.moderation_status || '').toLowerCase() === moderationStatus.toLowerCase()
          );
        }

        const evidenceStatus = searchParams.get('evidence_status');
        if (evidenceStatus) {
          applied.evidence_status = evidenceStatus;
          symbols = symbols.filter(
            (s) => (s.evidence_status || '').toLowerCase() === evidenceStatus.toLowerCase()
          );
        }

        const recordClass = searchParams.get('record_class');
        if (recordClass) {
          applied.record_class = recordClass;
          symbols = symbols.filter(
            (s) => (s.record_class || '').toLowerCase() === recordClass.toLowerCase()
          );
        }

        const overdue = searchParams.get('overdue');
        if (overdue === 'true' || overdue === 'false') {
          applied.overdue = overdue;
          symbols = symbols.filter((s) => s.review_overdue === (overdue === 'true'));
        }

        const parsedLimit = parseInt(searchParams.get('limit') || '', 10);
        const limit =
          Number.isFinite(parsedLimit) && parsedLimit > 0
            ? Math.min(parsedLimit, MAX_LIMIT)
            : DEFAULT_LIMIT;
        const parsedOffset = parseInt(searchParams.get('offset') || '', 10);
        const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0;

        const totalMatching = symbols.length;
        const page = symbols.slice(offset, offset + limit);

        const next: Record<string, unknown> = {
          view: 'symbol_browser',
          note: 'This is a browser rendered view over the corpus, not an endpoint. It is assembled by client side JavaScript from https://dmtcode.com/data.json. Software should read that address directly.',
          corpus_source: CORPUS_URL,
          filters_applied: applied,
          total_matching: totalMatching,
          offset,
          limit,
          symbols: page,
        };
        if (typeof data.version === 'string') next.corpus_version = data.version;
        if (typeof data.dateModified === 'string') next.corpus_date_modified = data.dateModified;
        if (typeof data.license === 'string') next.license = data.license;
        if (typeof data.attribution === 'string') next.attribution = data.attribution;

        if (!cancelled) {
          setPayload(next);
          setLoading(false);
        }
      } catch (error) {
        // Report the failure honestly. Do not emit a total, a version or a
        // license here. None of them are known when the corpus could not be
        // read, and a zero total would read as a registry holding nothing.
        if (!cancelled) {
          setPayload({
            view: 'symbol_browser',
            status: 'corpus_unavailable',
            note: 'This page could not read the corpus, so it has nothing to display. This is a failure to retrieve data and it is not a finding of zero matching symbols. No total is shown, because no total is known. Retry shortly. If you need the corpus and its HTTP status, request https://dmtcode.com/data.json directly.',
            corpus_source: CORPUS_URL,
            reason: error instanceof Error ? error.message : 'unknown fetch failure',
          });
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <>
      <Helmet>
        <title>Symbol browser | DMT Code</title>
        <meta
          name="description"
          content="A browser rendered view over the DMT Code corpus, filterable by tag, moderation status, evidence status, record class and review state. The machine readable corpus itself is at /data.json."
        />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="min-h-screen bg-background p-4 font-mono text-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold mb-2 text-foreground">Symbol browser</h1>

          <p className="mb-6 text-xs leading-relaxed text-muted-foreground">
            This page is not an API. It is assembled in your browser by JavaScript and it renders
            HTML, so nothing other than a browser can read it. If you are writing software, request{' '}
            <a href="/data.json" className="underline text-foreground">
              https://dmtcode.com/data.json
            </a>{' '}
            instead. That address is generated from the database at request time, it carries its own
            filter parameters, and it returns an HTTP error status when the corpus cannot be served
            rather than an empty result.
          </p>

          <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
            <h2 className="font-semibold mb-2 text-foreground">Filters this page supports</h2>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>
                <code className="bg-muted px-1 rounded">?tag=helix,spiral</code> Match any of these
                tags. Comma separated, substring match.
              </li>
              <li>
                <code className="bg-muted px-1 rounded">?moderation_status=unreviewed</code> Exact
                match on the record's moderation status. Other values: reviewed, denied, reported.
              </li>
              <li>
                <code className="bg-muted px-1 rounded">?evidence_status=raw</code> Exact match on
                the record's evidence status. Other values: eligible, ineligible, candidate_match,
                reviewed_convergence, controlled_replication.
              </li>
              <li>
                <code className="bg-muted px-1 rounded">?record_class=community_observation</code>{' '}
                Exact match. The other value is curated_starter.
              </li>
              <li>
                <code className="bg-muted px-1 rounded">?overdue=true</code> Records the corpus marks
                as past their review due date. Accepts true or false.
              </li>
              <li>
                <code className="bg-muted px-1 rounded">?limit=50&offset=0</code> Pagination. The
                limit is capped at 500.
              </li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              A filter is listed here only if the corpus actually publishes the field it reads.
            </p>
          </div>

          <div className="mb-6 p-4 bg-muted/20 rounded-lg border border-border">
            <h2 className="font-semibold mb-2 text-foreground">Correction, 29 July 2026</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Until this date this page was titled Symbol API and it documented four filters that the
              published corpus does not support. The corpus does not publish a source field, a
              symmetry field or an orcid field on a symbol record, so those three filters could never
              have matched anything. No table in this database has ever held a consistency column at
              all, so the fourth implied a per symbol consistency score that this project does not
              measure and has never measured. All four have been removed rather than repaired. The
              page was also retitled, because it is a browser view and not an endpoint, and calling it
              an API told machine readers to consume something they cannot read. No database record
              was changed and no submission was affected.
            </p>
          </div>

          {loading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : (
            <pre className="bg-card border border-border rounded-lg p-4 overflow-x-auto text-foreground whitespace-pre-wrap break-words">
              {JSON.stringify(payload, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </>
  );
};

export default ApiSymbols;
