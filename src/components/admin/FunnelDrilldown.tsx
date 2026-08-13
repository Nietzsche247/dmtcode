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
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
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
  /** Dashboard time window this drilldown was opened from, e.g. "Last 7 days". */
  windowLabel?: string;
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
  windowLabel,
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
        <DialogHeader className="space-y-3">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <li>Admin</li>
              <li aria-hidden="true">/</li>
              <li>Engagement</li>
              {windowLabel && (
                <>
                  <li aria-hidden="true">/</li>
                  <li>{windowLabel}</li>
                </>
              )}
              <li aria-hidden="true">/</li>
              <li className="text-foreground font-medium">{title}</li>
            </ol>
          </nav>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 text-left">
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>
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
                  const href = source.href?.(row) ?? null;
                  const secondary = source.secondary?.(row) ?? null;
                  const preview = source.preview?.(row) ?? [];
                  const linkClass =
                    'block rounded-md hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';
                  const body = (
                    <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-card p-2.5">
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm truncate">{source.primary(row)}</p>
                        {secondary && (
                          <p className="text-xs text-muted-foreground truncate">{secondary}</p>
                        )}
                      </div>
                      <span className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                        {fmtWhen(row.created_at)}
                        {(to || href) && <ExternalLink className="w-3 h-3" />}
                      </span>
                    </div>
                  );
                  const wrapped = to ? (
                    <Link to={to} target="_blank" rel="noreferrer" className={linkClass}>
                      {body}
                    </Link>
                  ) : href ? (
                    <a href={href} target="_blank" rel="noreferrer" className={linkClass}>
                      {body}
                    </a>
                  ) : (
                    body
                  );
                  return (
                    <HoverCard key={String(row.id ?? i)} openDelay={120} closeDelay={80}>
                      <HoverCardTrigger asChild>
                        <div>{wrapped}</div>
                      </HoverCardTrigger>
                      <HoverCardContent align="start" className="w-80 space-y-2">
                        <p className="text-sm font-medium break-words">{source.primary(row)}</p>
                        <dl className="space-y-1">
                          {preview.map((f) => (
                            <div key={f.label} className="flex justify-between gap-3 text-xs">
                              <dt className="text-muted-foreground shrink-0">{f.label}</dt>
                              <dd className="text-right break-words">{f.value}</dd>
                            </div>
                          ))}
                          <div className="flex justify-between gap-3 text-xs">
                            <dt className="text-muted-foreground shrink-0">recorded</dt>
                            <dd className="text-right">{fmtWhen(row.created_at) || 'unknown'}</dd>
                          </div>
                        </dl>
                        <p className="text-xs text-muted-foreground">
                          {to
                            ? `opens ${to}`
                            : href
                              ? `opens ${href}`
                              : 'no detail page exists for this record'}
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className="pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to {windowLabel ?? 'the dashboard'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FunnelDrilldown;
