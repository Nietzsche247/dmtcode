import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AvatarGlyph } from '@/components/AvatarGlyph';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MemberProfile {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  avatar_seed: string | null;
  created_at: string;
  symbol_count: number | null;
  reputation_score: number | null;
}

interface MemberEmail {
  id: string;
  email: string | null;
  provider: string | null;
  email_confirmed: boolean;
  last_sign_in_at: string | null;
}

type MemberRow = MemberProfile & Partial<Omit<MemberEmail, 'id'>>;

const DAY_MS = 86400000;
const PAGE_SIZE = 50;
const ACTIVE_WINDOW_DAYS = 30;

const EM_DASH = '\u2014';

export const ageInDays = (createdAt: string, now: number = Date.now()): number =>
  Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / DAY_MS));

export function formatMembershipAge(createdAt: string, now: number = Date.now()): string {
  const days = ageInDays(createdAt, now);
  if (days < 1) return 'today';
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;

  const months = Math.floor(days / 30.4375);
  if (months < 12) {
    const remDays = Math.max(0, days - Math.round(months * 30.4375));
    return remDays > 0
      ? `${months} month${months === 1 ? '' : 's'}, ${remDays} day${remDays === 1 ? '' : 's'}`
      : `${months} month${months === 1 ? '' : 's'}`;
  }

  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0
    ? `${years} year${years === 1 ? '' : 's'}, ${remMonths} month${remMonths === 1 ? '' : 's'}`
    : `${years} year${years === 1 ? '' : 's'}`;
}

export type ActivityState = 'active' | 'dormant' | 'never' | 'unknown';

/**
 * Pure helper. `lookupAvailable === false` means the auth lookup did not resolve,
 * so we cannot know the state. Unknown is never bucketed as a default.
 */
export function activityState(
  lastSignInAt: string | null | undefined,
  lookupAvailable: boolean,
  now: number = Date.now(),
): ActivityState {
  if (!lookupAvailable) return 'unknown';
  if (lastSignInAt === null || lastSignInAt === undefined) return 'never';
  const t = new Date(lastSignInAt).getTime();
  if (Number.isNaN(t)) return 'unknown';
  return now - t <= ACTIVE_WINDOW_DAYS * DAY_MS ? 'active' : 'dormant';
}

const ACTIVITY_LABEL: Record<ActivityState, string> = {
  active: 'Active',
  dormant: 'Dormant',
  never: 'Never returned',
  unknown: EM_DASH,
};

export function formatRelative(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return 'never';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'never';
  const days = Math.max(0, Math.floor((now - then) / DAY_MS));
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30.4375);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

const formatJoined = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

const csvCell = (value: string | number | null) => {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

type SortKey = 'newest' | 'oldest' | 'longest' | 'symbols' | 'reputation' | 'recent' | 'dormant';
type FilterKey = 'all' | 'active' | 'dormant' | 'never' | 'contributors' | 'unconfirmed';

const EmailCell = ({ member }: { member: MemberRow }) => {
  if (!member.email) {
    return <span className="text-muted-foreground">{EM_DASH}</span>;
  }
  return (
    <div className="min-w-0">
      <a href={`mailto:${member.email}`} className="block truncate underline underline-offset-2">
        {member.email}
      </a>
      <span
        className={`block text-xs ${
          member.email_confirmed ? 'text-muted-foreground' : 'text-destructive'
        }`}
      >
        {member.provider ?? 'unknown'} · {member.email_confirmed ? 'confirmed' : 'unconfirmed'}
      </span>
    </div>
  );
};

const LastSeenCell = ({
  member,
  available,
  now,
}: {
  member: MemberRow;
  available: boolean;
  now: number;
}) => {
  if (!available) return <span className="text-muted-foreground">{EM_DASH}</span>;
  return (
    <div className="min-w-0">
      <span className="block">{formatRelative(member.last_sign_in_at, now)}</span>
      <span className="block text-xs text-muted-foreground">
        {member.last_sign_in_at ? formatJoined(member.last_sign_in_at) : EM_DASH}
      </span>
    </div>
  );
};

const StatusCell = ({ state, symbolCount }: { state: ActivityState; symbolCount: number }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {state === 'unknown' ? (
      <span className="text-muted-foreground">{EM_DASH}</span>
    ) : (
      <Badge
        variant={
          state === 'active' ? 'secondary' : state === 'never' ? 'destructive' : 'outline'
        }
        className={state === 'dormant' ? 'text-muted-foreground' : undefined}
      >
        {ACTIVITY_LABEL[state]}
      </Badge>
    )}
    {symbolCount > 0 && <Badge variant="outline">Contributor</Badge>}
  </div>
);

export const MembersDirectory = () => {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [page, setPage] = useState(0);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['admin-members'],
    queryFn: async (): Promise<MemberProfile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, handle, avatar_url, avatar_seed, created_at, symbol_count, reputation_score')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MemberProfile[];
    },
  });

  const emailQuery = useQuery({
    queryKey: ['admin-member-emails'],
    queryFn: async (): Promise<MemberEmail[]> => {
      const { data, error } = await supabase.functions.invoke('admin-member-emails');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.members ?? []) as MemberEmail[];
    },
    retry: false,
  });

  // The auth lookup is the source for last_sign_in_at and email_confirmed.
  // If it has not resolved, every derived figure is unavailable, not zero.
  const authAvailable = emailQuery.isSuccess && Array.isArray(emailQuery.data);

  const rows = useMemo<MemberRow[]>(() => {
    const profiles = data ?? [];
    const byId = new Map((emailQuery.data ?? []).map((e) => [e.id, e]));
    return profiles.map((p) => {
      const e = byId.get(p.id);
      return e
        ? {
            ...p,
            email: e.email,
            provider: e.provider,
            email_confirmed: e.email_confirmed,
            last_sign_in_at: e.last_sign_in_at,
          }
        : p;
    });
  }, [data, emailQuery.data]);
  const now = Date.now();

  const stateById = useMemo(() => {
    const m = new Map<string, ActivityState>();
    rows.forEach((r) => m.set(r.id, activityState(r.last_sign_in_at, authAvailable, now)));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, authAvailable]);

  const stats = useMemo(() => {
    const within = (d: number) =>
      rows.filter((r) => now - new Date(r.created_at).getTime() <= d * DAY_MS).length;
    const countState = (s: ActivityState) =>
      rows.filter((r) => stateById.get(r.id) === s).length;
    return {
      total: rows.length,
      new7: within(7),
      active: authAvailable ? countState('active') : null,
      dormant: authAvailable ? countState('dormant') + countState('never') : null,
      contributors: rows.filter((r) => (r.symbol_count ?? 0) > 0).length,
      unconfirmed: authAvailable
        ? rows.filter((r) => r.email !== undefined && r.email_confirmed === false).length
        : null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, stateById, authAvailable]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = q
      ? rows.filter(
          (r) =>
            (r.display_name ?? '').toLowerCase().includes(q) ||
            (r.handle ?? '').toLowerCase().includes(q) ||
            (r.email ?? '').toLowerCase().includes(q),
        )
      : rows.slice();

    if (filter === 'contributors') {
      base = base.filter((r) => (r.symbol_count ?? 0) > 0);
    } else if (filter === 'unconfirmed') {
      if (!authAvailable) return [];
      base = base.filter((r) => r.email !== undefined && r.email_confirmed === false);
    } else if (filter !== 'all') {
      if (!authAvailable) return [];
      base = base.filter((r) => stateById.get(r.id) === filter);
    }

    const byCreated = (a: MemberRow, b: MemberRow) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

    // Never-signed-in members sort last in both sign-in orderings.
    const signInTime = (r: MemberRow) => {
      const t = r.last_sign_in_at ? new Date(r.last_sign_in_at).getTime() : NaN;
      return Number.isNaN(t) ? null : t;
    };
    const bySignIn = (dir: 'recent' | 'dormant') => (a: MemberRow, b: MemberRow) => {
      const ta = signInTime(a);
      const tb = signInTime(b);
      if (ta === null && tb === null) return byCreated(a, b);
      if (ta === null) return 1;
      if (tb === null) return -1;
      return dir === 'recent' ? tb - ta : ta - tb;
    };

    switch (sort) {
      case 'oldest':
      case 'longest':
        return base.sort((a, b) => -byCreated(a, b));
      case 'symbols':
        return base.sort((a, b) => (b.symbol_count ?? 0) - (a.symbol_count ?? 0));
      case 'reputation':
        return base.sort((a, b) => (b.reputation_score ?? 0) - (a.reputation_score ?? 0));
      case 'recent':
        return base.sort(bySignIn('recent'));
      case 'dormant':
        return base.sort(bySignIn('dormant'));
      default:
        return base.sort(byCreated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, sort, filter, stateById, authAvailable]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const exportCsv = () => {
    const header =
      'display_name,handle,email,email_confirmed,last_sign_in_utc,activity_state,joined_utc,membership_age_days,symbol_count,reputation_score';
    const lines = filtered.map((r) => {
      const state = stateById.get(r.id) ?? 'unknown';
      return [
        csvCell(r.display_name),
        csvCell(r.handle),
        csvCell(r.email ?? ''),
        csvCell(r.email === undefined || r.email === null ? '' : String(r.email_confirmed ?? false)),
        csvCell(authAvailable && r.last_sign_in_at ? new Date(r.last_sign_in_at).toISOString() : ''),
        csvCell(state === 'unknown' ? '' : state),
        csvCell(new Date(r.created_at).toISOString()),
        csvCell(ageInDays(r.created_at, now)),
        csvCell(r.symbol_count ?? 0),
        csvCell(r.reputation_score ?? 0),
      ].join(',');
    });

    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dmtcode-members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-6 space-y-3">
        <p className="text-sm text-foreground">
          Could not load members: {(error as Error).message}
        </p>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isRefetching}>
          Retry
        </Button>
      </div>
    );
  }

  const tiles: { label: string; value: number | null }[] = [
    { label: 'Total members', value: stats.total },
    { label: 'New (7 days)', value: stats.new7 },
    { label: 'Active (30 days)', value: stats.active },
    { label: 'Dormant (30+ days)', value: stats.dormant },
    { label: 'Contributors', value: stats.contributors },
    { label: 'Unconfirmed email', value: stats.unconfirmed },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Members</h2>
        <p className="text-sm text-muted-foreground">
          Every registered account, newest first. Membership age is calculated live from the
          profile's creation date.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-4">
            <p className="text-2xl font-semibold tabular-nums">
              {tile.value === null ? EM_DASH : tile.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{tile.label}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search name, handle or email"
          aria-label="Search members"
          className="w-full sm:max-w-xs"
        />
        <Select
          value={sort}
          onValueChange={(v) => {
            setSort(v as SortKey);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-full sm:w-52" aria-label="Sort members">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="longest">Longest membership</SelectItem>
            <SelectItem value="recent" disabled={!authAvailable}>
              Recently active
            </SelectItem>
            <SelectItem value="dormant" disabled={!authAvailable}>
              Longest dormant
            </SelectItem>
            <SelectItem value="symbols">Most symbols</SelectItem>
            <SelectItem value="reputation">Highest reputation</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filter}
          onValueChange={(v) => {
            setFilter(v as FilterKey);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter members">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All members</SelectItem>
            <SelectItem value="active" disabled={!authAvailable}>
              Active
            </SelectItem>
            <SelectItem value="dormant" disabled={!authAvailable}>
              Dormant
            </SelectItem>
            <SelectItem value="never" disabled={!authAvailable}>
              Never returned
            </SelectItem>
            <SelectItem value="contributors">Contributors</SelectItem>
            <SelectItem value="unconfirmed" disabled={!authAvailable}>
              Unconfirmed email
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="w-full sm:w-auto sm:ml-auto"
        >
          Export CSV
        </Button>
      </div>

      {emailQuery.error && (
        <p className="text-sm text-muted-foreground">
          Email lookup unavailable: {(emailQuery.error as Error).message}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-8">No members match that search.</p>
      ) : (
        <>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {pageRows.map((m) => (
              <Card key={m.id} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <AvatarGlyph seed={m.avatar_seed || m.id} handle={m.handle || undefined} size={40} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.display_name || m.handle || 'Member'}</p>
                    {m.handle && <p className="text-xs text-muted-foreground truncate">@{m.handle}</p>}
                  </div>
                </div>
                <StatusCell
                  state={stateById.get(m.id) ?? 'unknown'}
                  symbolCount={m.symbol_count ?? 0}
                />
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="col-span-2 min-w-0">
                    <dt className="text-xs text-muted-foreground">Email</dt>
                    <dd className="min-w-0">
                      <EmailCell member={m} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Member since</dt>
                    <dd>{formatJoined(m.created_at)}</dd>
                  </div>

                  <div>
                    <dt className="text-xs text-muted-foreground">Membership age</dt>
                    <dd>
                      {formatMembershipAge(m.created_at, now)}
                      <span className="block text-xs text-muted-foreground">
                        {ageInDays(m.created_at, now)} days
                      </span>
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Last seen</dt>
                    <dd>
                      <LastSeenCell member={m} available={authAvailable} now={now} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Symbols</dt>
                    <dd className="tabular-nums">{m.symbol_count ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Reputation</dt>
                    <dd className="tabular-nums">{m.reputation_score ?? 0}</dd>
                  </div>
                </dl>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Member since</TableHead>

                  <TableHead>Membership age</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Symbols</TableHead>
                  <TableHead className="text-right">Reputation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <AvatarGlyph seed={m.avatar_seed || m.id} handle={m.handle || undefined} size={32} />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{m.display_name || m.handle || 'Member'}</p>
                          {m.handle && (
                            <p className="text-xs text-muted-foreground truncate">@{m.handle}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[16rem]">
                      <EmailCell member={m} />
                    </TableCell>
                    <TableCell>{formatJoined(m.created_at)}</TableCell>

                    <TableCell>
                      {formatMembershipAge(m.created_at, now)}
                      <span className="block text-xs text-muted-foreground">
                        {ageInDays(m.created_at, now)} days
                      </span>
                    </TableCell>
                    <TableCell>
                      <LastSeenCell member={m} available={authAvailable} now={now} />
                    </TableCell>
                    <TableCell>
                      <StatusCell
                        state={stateById.get(m.id) ?? 'unknown'}
                        symbolCount={m.symbol_count ?? 0}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{m.symbol_count ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.reputation_score ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {safePage * PAGE_SIZE + 1}–{safePage * PAGE_SIZE + pageRows.length} of{' '}
              {filtered.length}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
