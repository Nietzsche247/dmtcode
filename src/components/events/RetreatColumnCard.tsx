import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink } from "lucide-react";

export interface RetreatColumnRecord {
  id: string;
  name: string;
  description: string | null;
  details: string | null;
  location: string;
  country: string | null;
  website_url: string | null;
  tags: string[] | null;
  next_start_date: string | null;
  next_end_date: string | null;
}

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", opts);
};

const formatRange = (start: string, end: string | null): string => {
  const base: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
  const s = new Date(start);
  if (isNaN(s.getTime())) return start;
  if (!end) return fmt(start, base);
  const e = new Date(end);
  if (isNaN(e.getTime()) || e.getTime() === s.getTime()) return fmt(start, base);
  if (s.getFullYear() === e.getFullYear()) {
    return `${fmt(start, { month: "short", day: "numeric" })} \u2013 ${fmt(end, base)}`;
  }
  return `${fmt(start, base)} \u2013 ${fmt(end, base)}`;
};

const paragraphs = (text: string | null) =>
  (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

const RetreatColumnCard = ({ retreat }: { retreat: RetreatColumnRecord }) => {
  const prose = [
    ...paragraphs(retreat.description),
    ...paragraphs(retreat.details),
  ];

  return (
    <Card className="border border-border/50 rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg leading-snug">
          <Link to={`/retreats/${retreat.id}`} className="hover:text-primary transition-colors">
            {retreat.name}
          </Link>
        </CardTitle>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 shrink-0" />
          <span>
            {retreat.location}
            {retreat.country ? `, ${retreat.country}` : ""}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {retreat.tags && retreat.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {retreat.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {retreat.next_start_date && (
          <p className="text-sm font-medium text-foreground">
            Next retreat: {formatRange(retreat.next_start_date, retreat.next_end_date)}
          </p>
        )}

        {prose.length > 0 && (
          <div className="space-y-2">
            {prose.map((p, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        )}

        {retreat.website_url && (
          <a
            href={retreat.website_url}
            target="_blank"
            rel="noopener nofollow"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Visit website <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
};

export default RetreatColumnCard;
