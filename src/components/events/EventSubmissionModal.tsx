import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EventSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EventSubmissionModal = ({ open, onOpenChange }: EventSubmissionModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("public");
  const [location, setLocation] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please log in to submit events");
      return;
    }

    if (!title || !eventDate) {
      toast.error("Title and date are required");
      return;
    }

    const { error } = await supabase.from("events").insert({
      title,
      description: description || null,
      event_date: eventDate,
      event_type: eventType,
      location: location || null,
      organizer: organizer || null,
      url: url || null,
      submitted_by: user.id,
    });

    if (error) {
      toast.error("Failed to submit event");
      console.error(error);
    } else {
      toast.success("Event submitted for moderation");
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventDate("");
    setEventType("public");
    setLocation("");
    setOrganizer("");
    setUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title*</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Psychedelic Science 2025"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the event..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eventDate">Date*</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="eventType">Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger id="eventType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="ceremony">Ceremony</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Denver, CO"
            />
          </div>

          <div>
            <Label htmlFor="organizer">Organizer</Label>
            <Input
              id="organizer"
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              placeholder="e.g., MAPS"
            />
          </div>

          <div>
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              Submit for Moderation
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventSubmissionModal;
