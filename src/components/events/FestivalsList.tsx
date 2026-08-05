import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ExternalLink } from "lucide-react";

interface FestivalRow {
  id: string;
  title: string;
  description: string | null;
  details: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  organizer: string | null;
  url: string | null;
}

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", opts);
};

const formatRange = (start: string, end: string | null): string => {
  const s = new Date(start);
  if (isNaN(s.getTime())) return start;
  const base: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
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

const FestivalCard = ({ f, muted }: { f: FestivalRow; muted?: boolean }) => {
  const prose = [...paragraphs(f.description), ...paragraphs(f.details)];
  const subtitle = [f.location, f.organizer].filter(Boolean).join(" \u00b7 ");

  return (
    <Card className={`border border-border/50 rounded-2xl overflow-hidden ${muted ? "opacity-70" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            {formatRange(f.event_date, f.end_date)}
          </p>
          <Badge variant="secondary" className="text-xs shrink-0">festival</Badge>
        </div>
        <CardTitle className="text-lg leading-snug">
          <Link to={`/events/${f.id}`} className="hover:text-primary transition-colors">
            {f.title}
          </Link>
        </CardTitle>
        {subtitle && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{subtitle}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {prose.length > 0 && (
          <div className="space-y-2">
            {prose.map((p, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        )}
        {f.url && (
          <a
            href={f.url}
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

const FestivalsList = () => {
  const [festivals, setFestivals] = useState<FestivalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, description, details, event_date, end_date, location, organizer, url")
        .eq("is_approved", true)
        .eq("event_type", "festival")
        .order("event_date", { ascending: true });
      if (error) console.error("Error fetching festivals:", error);
      else setFestivals((data as FestivalRow[]) || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Skeleton className="w-full h-32" />;

  if (festivals.length === 0) {
    return <p className="text-sm text-muted-foreground">No festivals listed yet.</p>;
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = festivals.filter((f) => (f.end_date || f.event_date) >= today);
  const past = festivals.filter((f) => (f.end_date || f.event_date) < today).reverse();

  return (
    <div className="space-y-4">
      {upcoming.map((f) => (
        <FestivalCard key={f.id} f={f} />
      ))}
      {past.length > 0 && (
        <>
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground pt-2">
            Recent / past
          </p>
          {past.map((f) => (
            <FestivalCard key={f.id} f={f} muted />
          ))}
        </>
      )}
    </div>
  );
};

export default FestivalsList;
