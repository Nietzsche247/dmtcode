import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface ListRowProps {
  gutterPrimary: string; // "OPEN" or "SEP 11-13"
  gutterSecondary?: string; // "Mar 2026" or "2026"
  gutterTone?: "accent" | "muted" | "warn";
  meta: (string | null | undefined)[]; // filtered, joined with a middot
  pill?: string; // the type label
  title: string;
  href: string; // internal route
  owner?: string;
  body?: string;
  tags?: string[];
  action?: { label: string; href: string; external?: boolean };
  dimmed?: boolean; // cancelled, suspended, past
}

const toneClass: Record<NonNullable<ListRowProps["gutterTone"]>, string> = {
  accent: "text-primary",
  muted: "text-muted-foreground",
  warn: "text-destructive",
};

const ListRow = ({
  gutterPrimary,
  gutterSecondary,
  gutterTone = "muted",
  meta,
  pill,
  title,
  href,
  owner,
  body,
  tags,
  action,
  dimmed = false,
}: ListRowProps) => {
  const metaLine = meta.filter((m): m is string => !!m).join(" · ");
  const shownTags = (tags ?? []).slice(0, 3);
  const extraTags = (tags ?? []).length - shownTags.length;

  return (
    <div className="border-b border-border/60 py-5 sm:grid sm:grid-cols-[7rem_1fr] sm:gap-4">
      {/* Gutter: always full contrast, even when dimmed */}
      <div className="mb-2 sm:mb-0">
        <p
          className={cn(
            "label-data text-xs font-semibold uppercase tracking-wider",
            toneClass[gutterTone]
          )}
        >
          {gutterPrimary}
        </p>
        {gutterSecondary && (
          <p className="label-data mt-1 text-[11px] text-muted-foreground">
            {gutterSecondary}
          </p>
        )}
      </div>

      {/* Content */}
      <div className={cn("min-w-0", dimmed && "opacity-50")}>
        {(pill || metaLine) && (
          <p className="label-data truncate text-[11px] text-muted-foreground">
            {pill && (
              <span className="mr-2 rounded-full border border-border/60 px-2 py-0.5 text-[9px] uppercase">
                {pill}
              </span>
            )}
            {metaLine}
          </p>
        )}
        <h2 className="mt-1 font-display text-xl leading-snug">
          <Link to={href} className="hover:underline">
            {title}
          </Link>
        </h2>
        {owner && (
          <p className="mt-1 text-sm text-muted-foreground">{owner}</p>
        )}
        {body && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {body}
          </p>
        )}
        {(shownTags.length > 0 || action) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {shownTags.map((t) => (
              <span
                key={t}
                className="label-data rounded-full border border-border/60 bg-muted px-2 py-0.5 text-[9px] uppercase text-muted-foreground"
              >
                {t}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="label-data text-[9px] text-muted-foreground">
                +{extraTags}
              </span>
            )}
            {action && (
              <a
                href={action.href}
                {...(action.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="ml-1 text-sm font-medium text-primary hover:underline"
              >
                {action.label}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListRow;
