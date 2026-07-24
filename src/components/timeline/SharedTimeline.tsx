import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export interface TimelineItem {
  id: string;
  date: string; // ISO date
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string; // hex or css var
  onClick?: () => void;
  href?: string;
  meta?: ReactNode;
}

interface SharedTimelineProps {
  items: TimelineItem[];
  emptyLabel?: string;
  accentClassName?: string; // tailwind bg-* for rail
}

/**
 * SharedTimeline: responsive vertical timeline.
 * Renders identically on mobile and desktop (no horizontal overflow).
 * Uses semantic tokens for full light + dark theme contrast.
 */
export default function SharedTimeline({
  items,
  emptyLabel = "Nothing to show yet.",
  accentClassName = "bg-primary",
}: SharedTimelineProps) {
  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {emptyLabel}
      </p>
    );
  }

  const sorted = [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <ol className="relative border-s border-border ps-6 space-y-4">
      {sorted.map((item) => {
        const d = new Date(item.date);
        const dateLabel = isNaN(d.getTime())
          ? item.date
          : d.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
        const Wrapper: any = item.href ? "a" : "div";
        const wrapperProps: Record<string, unknown> = item.href
          ? { href: item.href }
          : {};
        return (
          <li key={item.id} className="relative">
            <span
              className={`absolute -start-[31px] top-3 h-3 w-3 rounded-full ring-2 ring-background ${accentClassName}`}
              style={
                item.badgeColor ? { backgroundColor: item.badgeColor } : undefined
              }
              aria-hidden="true"
            />
            <Card
              className="p-4 hover:border-primary/60 transition-colors cursor-pointer bg-card text-card-foreground"
              onClick={item.onClick}
            >
              <Wrapper {...wrapperProps} className="block">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <time
                    dateTime={item.date}
                    className="text-xs font-mono uppercase tracking-wider text-muted-foreground"
                  >
                    {dateLabel}
                  </time>
                  {item.badge && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full border border-border text-foreground/80"
                      style={
                        item.badgeColor
                          ? {
                              backgroundColor: `${item.badgeColor}22`,
                              borderColor: `${item.badgeColor}66`,
                            }
                          : undefined
                      }
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <h3 className="mt-1 text-base font-semibold text-foreground leading-snug">
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.subtitle}
                  </p>
                )}
                {item.meta && <div className="mt-2">{item.meta}</div>}
              </Wrapper>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
