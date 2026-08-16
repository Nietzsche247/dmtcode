import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { recordAuditEvent, recordAuditEvents } from '@/lib/auditEvents';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvatarGlyph } from '@/components/AvatarGlyph';
import { toast } from 'sonner';
import { Check, X, Eye, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';

declare global {
  interface Window {
    posthog?: any;
  }
}

/**
 * One row per moderation decision so contributor-activity and streak charts
 * have real data. activity_date and created_at take their column defaults.
 * Awaited by every caller: a silent failure is what left this table empty.
 */
async function recordReviewActivity(userId: string | null): Promise<void> {
  if (!userId) return;
  const { error } = await supabase
    .from('review_activity')
    .insert([{ user_id: userId, source: 'reviewed' }]);
  if (error) {
    console.error('review_activity insert failed:', error.message);
    toast.error(`Review activity was not recorded: ${error.message}`);
  }
}

type Profile = { id: string; handle: string | null; avatar_seed: string | null };

type SymbolSubmission = Tables<'symbol_submissions'> & {
  profile?: Profile | null;
};

// Two independent dimensions, never merged.
//   moderation_status -> review state   (unreviewed | reviewed | denied | reported)
//   visibility_status -> public surface (public | hidden | private)
// The legacy `status` column is authoritative for PUBLIC VISIBILITY only and is
// maintained by a database trigger. The admin UI never writes it.
type ReviewFilter = 'all' | 'overdue' | 'unreviewed' | 'reviewed' | 'denied';
type VisibilityFilter = 'all' | 'public' | 'hidden';
// Corpus classification is a third independent dimension. "observer" is the
// evidence-bearing corpus, "curated" is operator illustration, "both" is the
// whole table. Filtering to one of them is what makes the bulk toggle safe:
// the operator can see exactly which class they are about to move.
type CorpusFilter = 'observer' | 'curated' | 'both';

const WINDOW_MS = 72 * 60 * 60 * 1000;
const PAGE_SIZE = 20;

const shortId = (id: string) => id.slice(0, 8);

const submitterLabel = (row: { user_id: string | null; profile?: Profile | null }) => {
  // Rows with no user_id predate account-gated submission. They are not
  // anonymous by choice, they were captured before logins existed.
  if (!row.user_id) return 'Prior to Account Creation';
  return row.profile?.handle?.trim() || `observer ${shortId(row.user_id)}`;
};

const submitterSeed = (row: { user_id: string | null; profile?: Profile | null }) =>
  row.profile?.avatar_seed || row.user_id || 'anon';

const timeLeftLabel = (createdAt: string) => {
  const remaining = new Date(createdAt).getTime() + WINDOW_MS - Date.now();
  if (remaining <= 0) return 'review window closed';
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  if (hours >= 1) return `${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
  const minutes = Math.max(1, Math.floor(remaining / (60 * 1000)));
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} left`;
};

const reviewLabel = (s: string | null) => {
  switch (s) {
    case 'reviewed': return 'reviewed';
    case 'denied': return 'rejected';
    case 'reported': return 'reported';
    default: return 'unreviewed';
  }
};

const reviewVariant = (s: string | null): 'default' | 'destructive' | 'secondary' => {
  switch (s) {
    case 'reviewed': return 'default';
    case 'denied':
    case 'reported': return 'destructive';
    default: return 'secondary';
  }
};

const visibilityLabel = (s: string | null) => {
  switch (s) {
    case 'public': return 'visible';
    case 'hidden': return 'hidden';
    default: return 'not published';
  }
};

export const SymbolSubmissionModeration = () => {
  const [submissions, setSubmissions] = useState<SymbolSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  // Default to the whole corpus. Defaulting to "unreviewed" made every row
  // vanish from the queue the moment it was reviewed, which reads as data loss.
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [submitterFilter, setSubmitterFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [corpusFilter, setCorpusFilter] = useState<CorpusFilter>('observer');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [submitters, setSubmitters] = useState<Profile[]>([]);
  const [anonCount, setAnonCount] = useState(0);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectingBulk, setRejectingBulk] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<SymbolSubmission | null>(null);

  // All counts are over the currently selected corpus. Curated operator
  // examples are excluded unless the operator explicitly switches to them.
  const [stats, setStats] = useState({ unreviewed: 0, reviewed: 0, denied: 0, overdue: 0, hidden: 0 });

  // Table-wide split between operator illustrations and observer records.
  const [corpusCounts, setCorpusCounts] = useState({ curated: 0, observer: 0 });

  // Bulk reclassification of is_curated_example. This flag decides whether a
  // row counts as evidence, so the change is always confirmed against explicit
  // before/after figures rather than applied straight from a button press.
  const [curatedModalOpen, setCuratedModalOpen] = useState(false);
  const [curatedTarget, setCuratedTarget] = useState<boolean>(false);

  useEffect(() => {
    window.posthog?.capture('admin_page_viewed');
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
  }, []);

  const loadStats = useCallback(async () => {
    const cutoff72 = new Date(Date.now() - WINDOW_MS).toISOString();

    // The checkbox ADDS curated examples to the corpus. It used to swap the
    // corpus, which hid every observer row whenever it was ticked and hid
    // every curated row whenever it was not.
    const base = () => {
      const q = supabase
        .from('symbol_submissions')
        .select('id', { count: 'exact', head: true });
      if (corpusFilter === 'observer') return q.eq('is_curated_example', false);
      if (corpusFilter === 'curated') return q.eq('is_curated_example', true);
      return q;
    };

    const [unreviewed, reviewed, denied, overdue, hidden, curated, observer] = await Promise.all([
      base().eq('moderation_status', 'unreviewed'),
      base().eq('moderation_status', 'reviewed'),
      base().eq('moderation_status', 'denied'),
      base().eq('moderation_status', 'unreviewed').lt('created_at', cutoff72),
      base().eq('visibility_status', 'hidden'),
      // Corpus classification counts are always table-wide, never filtered by
      // the view. They are what the before/after figures on the bulk
      // reclassification dialog are measured against.
      supabase
        .from('symbol_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('is_curated_example', true),
      supabase
        .from('symbol_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('is_curated_example', false),
    ]);

    const firstError = [unreviewed, reviewed, denied, overdue, hidden, curated, observer].find(
      (r) => r.error,
    )?.error;
    if (firstError) {
      toast.error(`Could not read the moderation counts: ${firstError.message}`);
      return;
    }

    setStats({
      unreviewed: unreviewed.count || 0,
      reviewed: reviewed.count || 0,
      denied: denied.count || 0,
      overdue: overdue.count || 0,
      hidden: hidden.count || 0,
    });
    setCorpusCounts({ curated: curated.count || 0, observer: observer.count || 0 });
  }, [corpusFilter]);

  // Submitter list for the filter. Built from the same corpus the list shows.
  const loadSubmitters = useCallback(async () => {
    let submitterQuery = supabase
      .from('symbol_submissions')
      .select('user_id')
      .limit(2000);
    if (corpusFilter === 'observer') submitterQuery = submitterQuery.eq('is_curated_example', false);
    else if (corpusFilter === 'curated') submitterQuery = submitterQuery.eq('is_curated_example', true);
    const { data, error } = await submitterQuery;

    if (error) {
      toast.error(`Could not load the submitter list: ${error.message}`);
      return;
    }

    const ids = [...new Set((data ?? []).map((r) => r.user_id).filter(Boolean))] as string[];
    setAnonCount((data ?? []).filter((r) => !r.user_id).length);

    if (!ids.length) {
      setSubmitters([]);
      return;
    }

    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, handle, avatar_seed')
      .in('id', ids);

    if (pErr) {
      toast.error(`Could not load submitter aliases: ${pErr.message}`);
    }

    const byId = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));
    setSubmitters(
      ids
        .map((id) => byId.get(id) ?? { id, handle: null, avatar_seed: null })
        .sort((a, b) => (a.handle || a.id).localeCompare(b.handle || b.id)),
    );
  }, [corpusFilter]);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setSelectedIds(new Set());

    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('symbol_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (corpusFilter === 'observer') query = query.eq('is_curated_example', false);
    else if (corpusFilter === 'curated') query = query.eq('is_curated_example', true);

    if (reviewFilter === 'overdue') {
      const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();
      query = query.eq('moderation_status', 'unreviewed').lt('created_at', cutoff);
    } else if (reviewFilter !== 'all') {
      query = query.eq('moderation_status', reviewFilter);
    }

    if (visibilityFilter === 'public') query = query.eq('visibility_status', 'public');
    else if (visibilityFilter === 'hidden') query = query.eq('visibility_status', 'hidden');

    if (submitterFilter === 'anonymous') query = query.is('user_id', null);
    else if (submitterFilter !== 'all') query = query.eq('user_id', submitterFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().replace(/[,()]/g, ' ');
      query = query.or(`description.ilike.%${q}%,context_note.ilike.%${q}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      toast.error(`Could not load submissions: ${error.message}`);
      console.error(error);
      setLoading(false);
      return;
    }

    setTotalCount(count || 0);

    const userIds = [...new Set((data ?? []).map((s) => s.user_id).filter(Boolean))] as string[];
    let profileMap = new Map<string, Profile>();
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, handle, avatar_seed')
        .in('id', userIds);
      profileMap = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));
    }

    setSubmissions(
      (data ?? []).map((s) => ({ ...s, profile: s.user_id ? profileMap.get(s.user_id) ?? null : null })),
    );
    setLoading(false);
  }, [currentPage, corpusFilter, reviewFilter, visibilityFilter, submitterFilter, searchQuery]);

  useEffect(() => {
    loadSubmissions();
    loadStats();
    loadSubmitters();

    const channel = supabase
      .channel('symbol-submission-moderation')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'symbol_submissions' }, () => {
        loadSubmissions();
        loadStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSubmissions, loadStats, loadSubmitters]);

  // Every moderation write goes through here. PostgREST returns 200 with an
  // empty array when RLS filters the rows out, so a zero-row result is a
  // FAILURE, not a success. Never toast success on a write that changed nothing.
  const writeModeration = async (
    ids: string[],
    patch: Record<string, unknown>,
    verb: string,
  ): Promise<boolean> => {
    const { data, error } = await supabase
      .from('symbol_submissions')
      .update(patch)
      .in('id', ids)
      .select('id, moderation_status, visibility_status, is_curated_example');

    if (error) {
      toast.error(`Could not ${verb}: ${error.message}`);
      return false;
    }

    const changed = data ?? [];
    if (changed.length === 0) {
      toast.error(
        `Could not ${verb}. The database accepted the request but changed zero rows, which means the write was blocked by a permission rule. Nothing was saved.`,
      );
      return false;
    }
    if (changed.length < ids.length) {
      toast.error(
        `Only ${changed.length} of ${ids.length} rows were saved. The rest were blocked by a permission rule.`,
      );
      return false;
    }

    // Confirm the row really carries the new state before reporting success.
    const expected = patch.moderation_status as string | undefined;
    if (expected && changed.some((r) => r.moderation_status !== expected)) {
      toast.error(`The write returned rows that do not carry the new review state. Nothing is confirmed.`);
      return false;
    }

    return true;
  };

  const handleApprove = async (id: string) => {
    const ok = await writeModeration(
      [id],
      {
        moderation_status: 'reviewed',
        moderated_by: currentUserId,
        moderated_at: new Date().toISOString(),
      },
      'mark this symbol reviewed',
    );
    if (!ok) return;

    await recordAuditEvent({
      event_name: 'symbol_moderation_decision',
      subject_type: 'symbol_submission',
      subject_id: id,
      properties: {
        decision: 'reviewed',
        bulk: false,
        // Pre-account rows carry no submitter. Recorded so the trail can
        // separate legacy captures from account-gated ones later.
        submitter_present: Boolean(submissions.find((s) => s.id === id)?.user_id),
      },
    });
    await recordReviewActivity(currentUserId);
    toast.success('Marked reviewed');
    supabase.functions.invoke('notify-admin', { body: { submissionId: id, action: 'approved' } }).catch(console.error);
    loadSubmissions();
    loadStats();
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) {
      toast.error('No submissions selected');
      return;
    }
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    const ok = await writeModeration(
      ids,
      {
        moderation_status: 'reviewed',
        moderated_by: currentUserId,
        moderated_at: new Date().toISOString(),
      },
      'mark these symbols reviewed',
    );
    setBulkLoading(false);
    if (!ok) return;

    await recordAuditEvents(ids, {
      event_name: 'symbol_moderation_decision',
      subject_type: 'symbol_submission',
      properties: { decision: 'reviewed', bulk: true, batch_size: ids.length },
    });
    await recordReviewActivity(currentUserId);
    toast.success(`${ids.length} marked reviewed`);
    setSelectedIds(new Set());
    loadSubmissions();
    loadStats();
  };

  const openRejectModal = (id: string) => {
    setRejectingId(id);
    setRejectingBulk(false);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const openBulkRejectModal = () => {
    if (selectedIds.size === 0) {
      toast.error('No submissions selected');
      return;
    }
    setRejectingBulk(true);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (rejectionReason.trim().length < 10) {
      toast.error('The reason must be at least 10 characters');
      return;
    }

    const ids = rejectingBulk ? Array.from(selectedIds) : rejectingId ? [rejectingId] : [];
    if (!ids.length) return;

    setBulkLoading(true);
    const ok = await writeModeration(
      ids,
      {
        moderation_status: 'denied',
        visibility_status: 'hidden',
        rejection_reason: rejectionReason.trim(),
        moderated_by: currentUserId,
        moderated_at: new Date().toISOString(),
      },
      ids.length > 1 ? 'reject these symbols' : 'reject this symbol',
    );
    setBulkLoading(false);

    if (ok) {
      await recordAuditEvents(ids, {
        event_name: 'symbol_moderation_decision',
        subject_type: 'symbol_submission',
        properties: {
          decision: 'denied',
          visibility_after: 'hidden',
          rejection_reason: rejectionReason.trim(),
          bulk: rejectingBulk,
          batch_size: ids.length,
        },
      });
      await recordReviewActivity(currentUserId);
      toast.success(ids.length > 1 ? `${ids.length} rejected and hidden` : 'Rejected and hidden');
      if (!rejectingBulk) {
        supabase.functions
          .invoke('notify-admin', { body: { submissionId: ids[0], action: 'rejected', reason: rejectionReason.trim() } })
          .catch(console.error);
      }
      setSelectedIds(new Set());
      setRejectModalOpen(false);
      setRejectingId(null);
    }

    loadSubmissions();
    loadStats();
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === submissions.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(submissions.map((s) => s.id)));
  };

  // Only rows that would actually change are written. Selecting a mix of
  // curated and observer rows and asking for "mark as observer" must touch the
  // curated ones only, otherwise the reported count overstates the change.
  const selectedRows = useMemo(
    () => submissions.filter((s) => selectedIds.has(s.id)),
    [submissions, selectedIds],
  );
  const curatedSelectedRows = useMemo(
    () => selectedRows.filter((s) => s.is_curated_example),
    [selectedRows],
  );
  const pendingCuratedRows = useMemo(
    () => selectedRows.filter((s) => Boolean(s.is_curated_example) !== curatedTarget),
    [selectedRows, curatedTarget],
  );

  const openCuratedModal = (target: boolean) => {
    if (selectedIds.size === 0) {
      toast.error('No submissions selected');
      return;
    }
    setCuratedTarget(target);
    setCuratedModalOpen(true);
  };

  const handleCuratedReclassify = async () => {
    const ids = pendingCuratedRows.map((s) => s.id);
    if (ids.length === 0) {
      toast.error('Every selected row already carries that classification. Nothing to change.');
      return;
    }
    setBulkLoading(true);
    const ok = await writeModeration(
      ids,
      { is_curated_example: curatedTarget },
      curatedTarget
        ? 'mark these symbols as curated examples'
        : 'mark these symbols as observer records',
    );
    setBulkLoading(false);
    if (!ok) return;

    await recordAuditEvents(ids, {
      event_name: 'symbol_corpus_reclassification',
      subject_type: 'symbol_submission',
      properties: {
        is_curated_example: curatedTarget,
        bulk: true,
        batch_size: ids.length,
        curated_before: corpusCounts.curated,
        curated_after: curatedTarget
          ? corpusCounts.curated + ids.length
          : corpusCounts.curated - ids.length,
      },
    });
    toast.success(
      curatedTarget
        ? `${ids.length} moved to curated examples and excluded from evidence counts`
        : `${ids.length} moved to observer records and included in evidence counts`,
    );
    setCuratedModalOpen(false);
    setSelectedIds(new Set());
    loadSubmissions();
    loadStats();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const submitterOptions = useMemo(() => submitters, [submitters]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Symbol Submissions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          One list, every submitter. Review state and visibility are separate dimensions: a
          symbol can be visible to the public and unreviewed at the same time. Counts cover
          {corpusFilter === 'observer'
            ? ' observer submissions only, the rows that count as evidence.'
            : corpusFilter === 'curated'
              ? ' curated operator examples only, which are excluded from every evidence count.'
              : ' observer submissions and curated operator examples together.'}
        </p>
      </div>


      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-orange-500">{stats.overdue}</div>
          <div className="text-sm text-muted-foreground">Overdue (72h)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-yellow-500">{stats.unreviewed}</div>
          <div className="text-sm text-muted-foreground">Unreviewed</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-green-500">{stats.reviewed}</div>
          <div className="text-sm text-muted-foreground">Reviewed</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-destructive">{stats.denied}</div>
          <div className="text-sm text-muted-foreground">Rejected</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-muted-foreground">{stats.hidden}</div>
          <div className="text-sm text-muted-foreground">Hidden from public</div>
        </Card>
      </div>

      <Card className="p-4 space-y-4">
        <Tabs
          value={reviewFilter}
          onValueChange={(v) => {
            setReviewFilter(v as ReviewFilter);
            setCurrentPage(1);
          }}
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overdue">
              Overdue (72h)
              {stats.overdue > 0 && <Badge variant="secondary" className="ml-2">{stats.overdue}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="unreviewed">
              Unreviewed
              {stats.unreviewed > 0 && <Badge variant="secondary" className="ml-2">{stats.unreviewed}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="reviewed">
              Reviewed
              {stats.reviewed > 0 && <Badge variant="secondary" className="ml-2">{stats.reviewed}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="denied">
              Rejected
              {stats.denied > 0 && <Badge variant="secondary" className="ml-2">{stats.denied}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-2">
                {stats.unreviewed + stats.reviewed + stats.denied}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>


        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Visibility</span>
            <Select
              value={visibilityFilter}
              onValueChange={(v) => {
                setVisibilityFilter(v as VisibilityFilter);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="public">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Submitter</span>
            <Select
              value={submitterFilter}
              onValueChange={(v) => {
                setSubmitterFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50 max-h-72">
                <SelectItem value="all">Everyone</SelectItem>
                {anonCount > 0 && <SelectItem value="anonymous">Prior to Account Creation</SelectItem>}
                {submitterOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <AvatarGlyph seed={p.avatar_seed || p.id} handle={p.handle ?? undefined} size={18} />
                      {p.handle?.trim() || `observer ${shortId(p.id)}`}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search description or context note..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>

        {/* Corpus classification quick filter. Narrowing to one class before a
            bulk toggle is what stops a mixed selection being reclassified. */}
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Corpus</span>
          {([
            { key: 'observer' as const, label: 'Observer records', count: corpusCounts.observer },
            { key: 'curated' as const, label: 'Curated examples', count: corpusCounts.curated },
            { key: 'both' as const, label: 'Both', count: corpusCounts.observer + corpusCounts.curated },
          ]).map((opt) => (
            <Button
              key={opt.key}
              size="sm"
              variant={corpusFilter === opt.key ? 'default' : 'outline'}
              onClick={() => {
                setCorpusFilter(opt.key);
                setSubmitterFilter('all');
                setSelectedIds(new Set());
                setCurrentPage(1);
              }}
            >
              {opt.label}
              <Badge variant="secondary" className="ml-2">{opt.count}</Badge>
            </Button>
          ))}
          {corpusFilter === 'both' && (
            <span className="text-xs text-muted-foreground">
              This view mixes both classes. Narrow to one before a bulk reclassification.
            </span>
          )}
        </div>

      </Card>

      {selectedIds.size > 0 && (
        <Card className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm">
              {selectedIds.size} selected
              {curatedSelectedRows.length > 0 && (
                <span className="text-muted-foreground">
                  {' '}
                  ({curatedSelectedRows.length} curated,{' '}
                  {selectedIds.size - curatedSelectedRows.length} observer)
                </span>
              )}
            </span>
            <Button size="sm" onClick={handleBulkApprove} disabled={bulkLoading}>
              {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              Mark reviewed
            </Button>
            <Button size="sm" variant="destructive" onClick={openBulkRejectModal} disabled={bulkLoading}>
              <X className="w-4 h-4 mr-1" />
              Reject and hide
            </Button>
          </div>

          <div className="border-t pt-3">
            <p className="text-sm text-muted-foreground">
              All submissions count toward every total; provenance is preserved by the
              submitter's account, not a corpus flag.
            </p>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : submissions.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground space-y-3">
          <p>
            No submissions match the current filters. Rows are never deleted by a review
            decision: a reviewed symbol moves to the Reviewed tab, a rejected one to Rejected.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setReviewFilter('all');
              setVisibilityFilter('all');
              setSubmitterFilter('all');
              setCorpusFilter('both');
              setSearchQuery('');
              setCurrentPage(1);
            }}
          >
            Show every submission
          </Button>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              checked={selectedIds.size === submissions.length && submissions.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              Select all on this page ({submissions.length} of {totalCount})
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {submissions.map((s) => {
              // Submitted tag arrays can repeat a term, so dedupe before keying.
              const tags = [...new Set(((s.tags ?? []) as string[]).filter(Boolean))];
              return (
                <Card key={s.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} />
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <AvatarGlyph
                        seed={submitterSeed(s)}
                        handle={submitterLabel(s)}
                        size={28}
                      />
                      <span className="text-sm truncate">{submitterLabel(s)}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setViewingSubmission(s);
                        setViewModalOpen(true);
                      }}
                      aria-label="View full submission"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="bg-muted rounded-md overflow-hidden aspect-square flex items-center justify-center">
                    <img
                      src={s.image_url}
                      alt={s.description || 'Submitted symbol'}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={reviewVariant(s.moderation_status)}>{reviewLabel(s.moderation_status)}</Badge>
                    <Badge variant="outline">{visibilityLabel(s.visibility_status)}</Badge>
                    {s.is_curated_example && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Curated example
                      </Badge>
                    )}
                    {s.moderation_status === 'unreviewed' && (
                      <Badge variant="outline" className="text-muted-foreground">
                        {timeLeftLabel(s.created_at)}
                      </Badge>
                    )}
                  </div>

                  {s.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{s.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {tags.length > 0 ? (
                      tags.map((t) => (
                        <Badge key={t} variant="secondary" className="font-normal">
                          {t}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">no keywords recorded</span>
                    )}
                  </div>

                  {s.rejection_reason && (
                    <p className="text-xs text-destructive">Reason on file: {s.rejection_reason}</p>
                  )}

                  <div className="flex gap-2 mt-auto pt-1">
                    <Button size="sm" className="flex-1" onClick={() => handleApprove(s.id)}>
                      <Check className="w-4 h-4 mr-1" />
                      Mark reviewed
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => openRejectModal(s.id)}>
                      <X className="w-4 h-4 mr-1" />
                      Reject and hide
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground border-t border-border pt-2">
                    Submitted {format(new Date(s.created_at), 'd MMMM yyyy, HH:mm')} UTC
                  </div>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={curatedModalOpen} onOpenChange={setCuratedModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {curatedTarget ? 'Mark as curated examples' : 'Mark as observer records'}
            </DialogTitle>
            <DialogDescription>
              All submissions count toward every total; provenance is preserved by the
              submitter's account, not a corpus flag.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div>
              <p>
                {pendingCuratedRows.length} of {selectedIds.size} selected{' '}
                {pendingCuratedRows.length === 1 ? 'row' : 'rows'} will change.
              </p>
              {selectedIds.size - pendingCuratedRows.length > 0 && (
                <p className="text-muted-foreground">
                  {selectedIds.size - pendingCuratedRows.length} already carry this
                  classification and will be left untouched.
                </p>
              )}
            </div>

            <div className="rounded-md border divide-y">
              <div className="grid grid-cols-3 px-3 py-2 text-xs uppercase text-muted-foreground">
                <span>Corpus</span>
                <span className="text-right">Before</span>
                <span className="text-right">After</span>
              </div>
              <div className="grid grid-cols-3 px-3 py-2">
                <span>Observer records</span>
                <span className="text-right tabular-nums">{corpusCounts.observer}</span>
                <span className="text-right tabular-nums font-medium">
                  {curatedTarget
                    ? corpusCounts.observer - pendingCuratedRows.length
                    : corpusCounts.observer + pendingCuratedRows.length}
                </span>
              </div>
              <div className="grid grid-cols-3 px-3 py-2">
                <span>Curated examples</span>
                <span className="text-right tabular-nums">{corpusCounts.curated}</span>
                <span className="text-right tabular-nums font-medium">
                  {curatedTarget
                    ? corpusCounts.curated + pendingCuratedRows.length
                    : corpusCounts.curated - pendingCuratedRows.length}
                </span>
              </div>
            </div>

            {pendingCuratedRows.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-md border p-3 space-y-1">
                {pendingCuratedRows.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-muted-foreground">{shortId(s.id)}</span>
                    <span className="truncate">{submitterLabel(s)}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-muted-foreground">
              This changes what the row counts as, not whether it is public and not whether it
              has been reviewed. Review state and visibility are unaffected.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCuratedModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCuratedReclassify}
              disabled={bulkLoading || pendingCuratedRows.length === 0}
            >
              {bulkLoading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Change {pendingCuratedRows.length}{' '}
              {pendingCuratedRows.length === 1 ? 'row' : 'rows'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject and hide</DialogTitle>
            <DialogDescription>
              This sets the review state to rejected and removes the symbol from public view. The
              reason is stored on the row.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Why is this being rejected? At least 10 characters."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={bulkLoading}>
              {bulkLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject and hide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submission detail</DialogTitle>
            <DialogDescription>
              {viewingSubmission ? `Row ${shortId(viewingSubmission.id)}` : ''}
            </DialogDescription>
          </DialogHeader>
          {viewingSubmission && (
            <div className="space-y-4">
              <div className="bg-muted rounded-md p-4 flex justify-center">
                <img
                  src={viewingSubmission.image_url}
                  alt={viewingSubmission.description || 'Submitted symbol'}
                  className="max-h-[50vh] object-contain"
                />
              </div>
              <div className="flex items-center gap-2">
                <AvatarGlyph
                  seed={submitterSeed(viewingSubmission)}
                  handle={submitterLabel(viewingSubmission)}
                  size={28}
                />
                <span className="text-sm">{submitterLabel(viewingSubmission)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Review state</div>
                  <div>{reviewLabel(viewingSubmission.moderation_status)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Visibility</div>
                  <div>{visibilityLabel(viewingSubmission.visibility_status)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Surface</div>
                  <div>{viewingSubmission.surface_type || 'not recorded'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Source</div>
                  <div>{viewingSubmission.source_method || 'not recorded'}</div>
                </div>
              </div>
              {viewingSubmission.description && (
                <p className="text-sm text-muted-foreground">{viewingSubmission.description}</p>
              )}

              {/* Translation is an aid to the reviewer, never a version of the record.
                  The original above is untouched and always visible. Nothing is stored. */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      translating ||
                      (!viewingSubmission.description && !viewingSubmission.context_note)
                    }
                    onClick={async () => {
                      setTranslating(true);
                      setTranslationError(null);
                      setTranslation(null);
                      setTranslationHidden(false);
                      const { data, error } = await supabase.functions.invoke(
                        'admin-translate-submission',
                        { body: { submissionId: viewingSubmission.id } },
                      );
                      setTranslating(false);
                      if (error) {
                        setTranslationError(error.message);
                        return;
                      }
                      if (data?.error) {
                        setTranslationError(String(data.error));
                        return;
                      }
                      setTranslation(data as TranslationResult);
                    }}
                  >
                    {translating && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    Show English translation
                  </Button>
                  {translation && !translationHidden && (
                    <Button size="sm" variant="ghost" onClick={() => setTranslationHidden(true)}>
                      Hide translation
                    </Button>
                  )}
                  {translation && translationHidden && (
                    <Button size="sm" variant="ghost" onClick={() => setTranslationHidden(false)}>
                      Show translation
                    </Button>
                  )}
                </div>

                {translationError && (
                  <p className="text-xs text-muted-foreground break-words">{translationError}</p>
                )}

                {translation && !translationHidden && (
                  translation.nothing_to_translate ? (
                    <p className="text-xs text-muted-foreground">
                      No text on this submission to translate.
                    </p>
                  ) : (
                    <div className="rounded-md border border-border p-3 space-y-2 max-h-[40vh] overflow-y-auto">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Machine translation, for review only. The record is the submitter's
                          original text above.
                        </span>
                        {translation.detected_language && (
                          <span>detected: {languageLabel(translation.detected_language)}</span>
                        )}
                      </div>
                      {translation.description_en && (
                        <p className="text-sm break-words whitespace-pre-wrap">
                          {translation.description_en}
                        </p>
                      )}
                      {translation.context_note_en && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Context note</div>
                          <p className="text-sm break-words whitespace-pre-wrap">
                            {translation.context_note_en}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[...new Set(((viewingSubmission.tags ?? []) as string[]).filter(Boolean))].map((t) => (
                  <Badge key={t} variant="secondary" className="font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-muted-foreground border-t border-border pt-2">
                Submitted {format(new Date(viewingSubmission.created_at), 'd MMMM yyyy, HH:mm')} UTC
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
