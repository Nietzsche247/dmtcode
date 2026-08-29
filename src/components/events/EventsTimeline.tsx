import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import SharedTimeline, { TimelineItem } from "@/components/timeline/SharedTimeline";
import { verificationLabel, stripAutoPrefix } from "@/lib/eventVerification";

interface Event {
  id: string;
  title: string;
  description: string | null;
  details: string | null;
  event_date: string;
  end_date: string | null;
  event_type: string;
  location: string | null;
  organizer: string | null;
  url: string | null;
  verification_status: string | null;
  relevance_type: string | null;
}

interface Props {
  filter?: "upcoming" | "past" | "all";
  muted?: boolean;
  emptyLabel?: string;
  types?: string[];
  excludeTypes?: string[];
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
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${fmt(start, { month: "short", day: "numeric" })} \u2013 ${fmt(end, base)}`;
  }
  if (s.getFullYear() === e.getFullYear()) {
    return `${fmt(start, { month: "short", day: "numeric" })} \u2013 ${fmt(end, base)}`;
  }
  return `${fmt(start, base)} \u2013 ${fmt(end, base)}`;
};

const EventsTimeline = ({ filter = "all", muted = false, emptyLabel, types, excludeTypes }: Props) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const typesKey = (types ?? []).slice().sort().join("|");
  const excludeKey = (excludeTypes ?? []).slice().sort().join("|");

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      let query = supabase.from("events").select("*").eq("is_approved", true);
      if (types && types.length > 0) {
        query = query.in("event_type", types);
      }
      if (excludeTypes && excludeTypes.length > 0) {
        query = query.not("event_type", "in", `(${excludeTypes.join(",")})`);
      }
      if (filter === "upcoming") {
        query = query.gte("event_date", today).order("event_date", { ascending: true });
      } else if (filter === "past") {
        query = query.lt("event_date", today).order("event_date", { ascending: false });
      } else {
        query = query.order("event_date", { ascending: false });
      }
      const { data, error } = await query;
      if (error) console.error("Error fetching events:", error);
      else setEvents((data as unknown as Event[]) || []);
      setLoading(false);
    })();
  }, [filter, typesKey, excludeKey]);


  if (loading) return <Skeleton className="w-full h-32" />;

  const items: TimelineItem[] = events.map((e) => ({
    id: e.id,
    date: e.event_date,
    dateLabel: formatRange(e.event_date, e.end_date),
    title: e.title,
    subtitle: [e.location, e.organizer].filter(Boolean).join(" \u00b7 ") || undefined,
    body: [stripAutoPrefix(e.description), e.details].filter(Boolean).join("\n\n") || undefined,
    badge: [e.event_type, verificationLabel(e.verification_status)].filter(Boolean).join(" \u00b7 "),
    onClick: () => navigate(`/events/${e.id}`),
  }));

  const emptyText = emptyLabel || "No events yet. Submit one to get started.";
  const accent = muted ? "bg-muted-foreground" : "bg-primary";

  return (
    <div className={muted ? "opacity-70" : ""}>
      {filter === "upcoming" ? (
        <SharedTimeline
          items={items}
          sortDirection="asc"
          emptyLabel={emptyText}
          accentClassName={accent}
        />
      ) : (
        <SharedTimeline
          items={items}
          sortDirection="desc"
          emptyLabel={emptyText}
          accentClassName={accent}
        />
      )}
    </div>
  );
};

export default EventsTimeline;
