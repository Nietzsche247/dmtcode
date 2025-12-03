import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import EventDetailModal from "./EventDetailModal";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ShareButtons } from "@/components/ShareButtons";

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
              <h3 className="font-black text-foreground uppercase tracking-tight text-sm" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{event.title}</h3>
              <ShareButtons title={event.title} description={event.description || ''} className="ml-2" />
            </div>
            <span className="text-xs font-light text-muted-foreground" style={{ fontWeight: 300 }}>
              {new Date(event.event_date).toLocaleDateString()}
              {event.location && ` · ${event.location}`}
            </span>
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
        <div className="relative min-w-[2000px]" style={{ width: `${totalDays * 4}px`, height: '180px' }}>
          {/* Dark red horizontal bar - taller */}
          <div className="absolute w-full bg-[#C41E3A]" style={{ top: '40px', height: '100px' }} />

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

          {/* Event markers with inline labels */}
          {events.map((event) => {
            const eventDate = new Date(event.event_date);
            const position = daysSinceMin(eventDate);
            const leftPercent = (position / totalDays) * 100;
            const shortDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const truncatedTitle = event.title.length > 40 ? event.title.substring(0, 40) + '…' : event.title;

            return (
              <div
                key={event.id}
                className="absolute cursor-pointer hover:opacity-80 transition-opacity group"
                style={{ left: `${leftPercent}%`, top: '20px' }}
                onClick={() => setSelectedEvent(event)}
              >
                {/* Vertical tick */}
                <div className="w-0.5 h-24 bg-white/80" />
                {/* Inline label on bar - always visible */}
                <div 
                  className="absolute top-4 left-2 text-white whitespace-nowrap pointer-events-none"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  <div className="text-sm font-black uppercase tracking-tight" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{truncatedTitle}</div>
                  <div className="text-xs font-light" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 300 }}>{shortDate}{event.location && ` · ${event.location.substring(0, 20)}`}</div>
                </div>
              </div>
            );
          })}

          {/* Month/Year labels at bottom */}
          {Array.from({ length: Math.ceil(totalDays / 30) }).map((_, i) => {
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
                className="absolute text-xs text-muted-foreground"
                style={{ left: `${leftPercent}%`, top: '150px' }}
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
