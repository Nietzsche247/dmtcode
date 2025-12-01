import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import EventDetailModal from "./EventDetailModal";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [showScrollHint, setShowScrollHint] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!isMobile && events.length > 0) {
      setShowScrollHint(true);
      const timer = setTimeout(() => setShowScrollHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, events.length]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return <Skeleton className="w-full h-32" />;
  }

  if (isMobile) {
    // Mobile: Vertical list fallback
    return (
      <div className="space-y-4">
        {events.map((event) => (
          <Card
            key={event.id}
            className="p-4 cursor-pointer hover:border-[#C41E3A] transition-colors"
            onClick={() => setSelectedEvent(event)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-foreground">{event.title}</h3>
              <span className="text-xs text-muted-foreground">
                {new Date(event.event_date).toLocaleDateString()}
              </span>
            </div>
            {event.location && (
              <p className="text-sm text-muted-foreground">{event.location}</p>
            )}
          </Card>
        ))}
        {events.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No events yet. Be the first to submit one!
          </p>
        )}
        <EventDetailModal
          event={selectedEvent}
          open={!!selectedEvent}
          onOpenChange={(open) => !open && setSelectedEvent(null)}
        />
      </div>
    );
  }

  // Desktop: Horizontal scrolling timeline with today marker
  const today = new Date();
  const minDate = events.length > 0 
    ? new Date(Math.min(...events.map(e => new Date(e.event_date).getTime())))
    : new Date(today.getFullYear() - 1, 0, 1);
  const maxDate = events.length > 0
    ? new Date(Math.max(...events.map(e => new Date(e.event_date).getTime())))
    : new Date(today.getFullYear() + 1, 11, 31);

  const daysSinceMin = (date: Date) => 
    Math.floor((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  const totalDays = daysSinceMin(maxDate) + 30;
  const todayPosition = daysSinceMin(today);

  return (
    <div className="relative">
      {/* Scroll hint */}
      {showScrollHint && !isMobile && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/95 backdrop-blur border border-border rounded px-3 py-1.5 shadow-lg">
            <ChevronLeft className="w-4 h-4" />
            <span>scroll for more</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto pb-4" style={{ scrollBehavior: "smooth" }}>
        <div className="relative h-32 min-w-[2000px]" style={{ width: `${totalDays * 4}px` }}>
          {/* Dark red horizontal bar */}
          <div className="absolute top-12 w-full h-2 bg-[#C41E3A]" />

          {/* Today marker - 4px thick with soft glow */}
          <div 
            className="absolute top-0 h-full w-1 bg-[hsl(var(--gold))] z-10"
            style={{ 
              left: `${(todayPosition / totalDays) * 100}%`,
              boxShadow: '0 0 12px hsl(var(--gold) / 0.5)'
            }}
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-[hsl(var(--gold))] whitespace-nowrap">
              TODAY
            </span>
          </div>

          {/* Event ticks */}
          {events.map((event) => {
            const eventDate = new Date(event.event_date);
            const position = daysSinceMin(eventDate);
            const leftPercent = (position / totalDays) * 100;

            return (
              <div
                key={event.id}
                className="absolute top-8 cursor-pointer hover:opacity-80 transition-opacity group"
                style={{ left: `${leftPercent}%` }}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="w-0.5 h-8 bg-foreground" />
                <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded px-2 py-1 whitespace-nowrap shadow-lg z-20">
                  <p className="text-xs font-semibold">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {eventDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Month/Year labels - skip every 2nd on mobile to prevent overlap */}
          {Array.from({ length: Math.ceil(totalDays / 30) }).map((_, i) => {
            // On narrow screens, only show even-indexed months
            if (typeof window !== 'undefined' && window.innerWidth < 768 && i % 2 !== 0) {
              return null;
            }

            const labelDate = new Date(minDate);
            labelDate.setMonth(labelDate.getMonth() + i);
            const position = daysSinceMin(labelDate);
            const leftPercent = (position / totalDays) * 100;

            return (
              <div
                key={i}
                className="absolute top-16 text-xs text-muted-foreground"
                style={{ left: `${leftPercent}%` }}
              >
                {labelDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            );
          })}
        </div>
      </div>

      {events.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No events yet. Be the first to submit one!
        </p>
      )}

      <EventDetailModal
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      />
    </div>
  );
};

export default EventsTimeline;
