import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import SharedTimeline, { TimelineItem } from "@/components/timeline/SharedTimeline";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
  location: string | null;
  organizer: string | null;
  url: string | null;
}

interface Props {
  filter?: "upcoming" | "past" | "all";
  muted?: boolean;
  emptyLabel?: string;
}

const EventsTimeline = ({ filter = "all", muted = false, emptyLabel }: Props) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      let query = supabase.from("events").select("*").eq("is_approved", true);
      if (filter === "upcoming") {
        query = query.gte("event_date", today).order("event_date", { ascending: true });
      } else if (filter === "past") {
        query = query.lt("event_date", today).order("event_date", { ascending: false });
      } else {
        query = query.order("event_date", { ascending: false });
      }
      const { data, error } = await query;
      if (error) console.error("Error fetching events:", error);
      else setEvents(data || []);
      setLoading(false);
    })();
  }, [filter]);

  if (loading) return <Skeleton className="w-full h-32" />;

  const items: TimelineItem[] = events.map((e) => ({
    id: e.id,
    date: e.event_date,
    title: e.title,
    subtitle: [e.location, e.organizer].filter(Boolean).join(" · ") || undefined,
    badge: e.event_type,
    onClick: () => navigate(`/events/${e.id}`),
  }));

  return (
    <div className={muted ? "opacity-70" : ""}>
      <SharedTimeline
        items={items}
        emptyLabel={emptyLabel || "No events yet. Submit one to get started."}
        accentClassName={muted ? "bg-muted-foreground" : "bg-primary"}
      />
    </div>
  );
};

export default EventsTimeline;
