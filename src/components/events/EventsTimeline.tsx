import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import EventDetailModal from "./EventDetailModal";
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

const EventsTimeline = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: false });
      if (error) {
        console.error("Error fetching events:", error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Skeleton className="w-full h-32" />;

  const items: TimelineItem[] = events.map((e) => ({
    id: e.id,
    date: e.event_date,
    title: e.title,
    subtitle: [e.location, e.organizer].filter(Boolean).join(" · ") || undefined,
    badge: e.event_type,
    onClick: () => setSelectedEvent(e),
  }));

  return (
    <>
      <SharedTimeline
        items={items}
        emptyLabel="No events yet. Submit one to get started."
        accentClassName="bg-primary"
      />
      <EventDetailModal
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      />
    </>
  );
};

export default EventsTimeline;
