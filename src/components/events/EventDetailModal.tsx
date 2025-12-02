import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, ExternalLink } from "lucide-react";
import CommunityNotes from "./CommunityNotes";
import NotifyMeForm from "./NotifyMeForm";
import ICalExport from "./ICalExport";
import SocialShare from "./SocialShare";

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

interface EventDetailModalProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EventDetailModal = ({ event, open, onOpenChange }: EventDetailModalProps) => {
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(event.event_date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}
            {event.organizer && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{event.organizer}</span>
              </div>
            )}
          </div>

          <Badge variant="secondary" className="capitalize">
            {event.event_type}
          </Badge>

          {event.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
          )}

          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Event Website <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <div className="border-t pt-4 space-y-3">
            <SocialShare
              title={event.title}
              description={event.description || undefined}
              entityType="event"
            />
            <ICalExport
              title={event.title}
              description={event.description || undefined}
              startDate={event.event_date}
              location={event.location || undefined}
              url={event.url || undefined}
            />
            <NotifyMeForm
              entityType="event"
              entityName={event.title}
              entityDate={event.event_date}
            />
          </div>

          <CommunityNotes entityType="event" entityId={event.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;
