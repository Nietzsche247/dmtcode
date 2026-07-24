import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
}

const UpcomingEventsList = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    const today = new Date().toISOString();
    const { data, error } = await supabase
      .from("events")
      .select("id, title, event_date, location")
      .eq("is_approved", true)
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(10);

    if (!error && data) {
      setEvents(data);
    }
  };

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No upcoming events</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const date = new Date(event.event_date);
        const shortDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            className="block text-sm border-b border-border pb-2 last:border-0 rounded-sm px-1 -mx-1 hover:bg-accent/50 transition-colors"
          >
            <div className="font-semibold text-foreground truncate">{event.title}</div>
            <div className="text-xs text-muted-foreground">
              {shortDate}
              {event.location && ` • ${event.location}`}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default UpcomingEventsList;
