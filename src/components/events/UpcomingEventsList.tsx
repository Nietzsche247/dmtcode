import { useEffect, useState } from "react";
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
          <div key={event.id} className="text-sm border-b border-border pb-2 last:border-0">
            <div className="font-semibold text-foreground truncate">{event.title}</div>
            <div className="text-xs text-muted-foreground">
              {shortDate}
              {event.location && ` • ${event.location}`}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UpcomingEventsList;
