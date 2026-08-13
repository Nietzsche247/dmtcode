import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export interface DrilldownSource {
  /** Table to read from. */
  table: string;
  /** Heading shown above this group of rows. */
  label: string;
  /** Columns to select, comma separated. */
  select: string;
  /** Optional equality filter, e.g. { column: 'bundle_slug', value: 'solo-kit' }. */
  eq?: { column: string; value: string };
  /** Primary line of text for a row. */
  primary: (row: Record<string, unknown>) => string;
  /** Optional secondary line. */
  secondary?: (row: Record<string, unknown>) => string | null;
  /** Optional in-app link for the row. */
  to?: (row: Record<string, unknown>) => string | null;
  /** Optional external link (mailto:, https:) for the row. */
  href?: (row: Record<string, unknown>) => string | null;
  /** Optional detail fields shown in the hover preview. */
  preview?: (row: Record<string, unknown>) => { label: string; value: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  since: Date | null;
  sources: DrilldownSource[];
}

interface Group {
  label: string;
  table: string;
  rows: Record<string, unknown>[];
  error: string | null;
}

const fmtWhen = (v: unknown) =>
  typeof v === 'string' ? new Date(v).toLocaleString() : '';

export const FunnelDrilldown = ({
  open,
  onOpenChange,
  title,
  description,
  since,
  sources,
}: Props) => {
  const [groups, setGroups] = useState<Group[] | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setGroups(null);
    (async () => {
      const result = await Promise.all(
        sources.map(async (s): Promise<Group> => {
          let q = supabase
            .from(s.table as never)
            .select(s.select)
            .order('created_at', { ascending: false })
            .limit(200);
          if (since) q = q.gte('created_at', since.toISOString());
          if (s.eq) q = q.eq(s.eq.column, s.eq.value);
          const { data, error } = await q;
          return {
            label: s.label,
            table: s.table,
            rows: (data as unknown as Record<string, unknown>[]) ?? [],
            error: error ? error.message : null,
          };
        })
      );
      if (active) setGroups(result);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, since, JSON.stringify(sources.map((s) => [s.table, s.eq?.value]))]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {groups === null && (
          <p className="text-sm text-muted-foreground">Loading records.</p>
        )}

        {groups?.map((g, gi) => {
          const source = sources[gi];
          return (
            <section key={`${g.table}-${gi}`} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold">{g.label}</h3>
                {!g.error && (
                  <Badge variant="secondary" className="tabular-nums">
                    {g.rows.length}
                    {g.rows.length === 200 ? '+' : ''}
                  </Badge>
                )}
              </div>
              {g.error && (
                <p className="text-xs text-muted-foreground">
                  Not readable from this account: {g.error}
                </p>
              )}
              {!g.error && g.rows.length === 0 && (
                <p className="text-xs text-muted-foreground">No records in this window.</p>
              )}
              <div className="space-y-1">
                {g.rows.map((row, i) => {
                  const to = source.to?.(row) ?? null;
                  const secondary = source.secondary?.(row) ?? null;
                  const body = (
                    <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-card p-2.5">
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm truncate">{source.primary(row)}</p>
                        {secondary && (
                          <p className="text-xs text-muted-foreground truncate">{secondary}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {fmtWhen(row.created_at)}
                      </span>
                    </div>
                  );
                  return to ? (
                    <Link
                      key={String(row.id ?? i)}
                      to={to}
                      target="_blank"
                      rel="noreferrer"
                      className="block hover:opacity-80 transition-opacity"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div key={String(row.id ?? i)}>{body}</div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </DialogContent>
    </Dialog>
  );
};

export default FunnelDrilldown;
