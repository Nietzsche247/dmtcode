import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ThumbsUp, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: string;
  note_text: string;
  author_id: string;
  upvotes: number;
  created_at: string;
}

interface CommunityNotesProps {
  entityType: 'event' | 'trial' | 'retreat';
  entityId: string;
}

const CommunityNotes = ({ entityType, entityId }: CommunityNotesProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchNotes();
  }, [entityId]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("community_notes")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("upvotes", { ascending: false });

    if (error) {
      console.error("Error fetching notes:", error);
    } else {
      setNotes(data || []);
    }
  };

  const handleSubmitNote = async () => {
    if (!user) {
      toast.error("Please log in to add notes");
      return;
    }

    if (!newNote.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    const { error } = await supabase.from("community_notes").insert({
      entity_type: entityType,
      entity_id: entityId,
      note_text: newNote,
      author_id: user.id,
    });

    if (error) {
      toast.error("Failed to submit note");
      console.error(error);
    } else {
      // Track GA4 event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'note_submission', {
          entity_type: entityType,
          entity_id: entityId,
          event_category: 'engagement'
        });
      }
      toast.success("Note submitted for moderation");
      setNewNote("");
      setShowForm(false);
      fetchNotes();
    }
  };

  const handleUpvote = async (noteId: string) => {
    if (!user) {
      toast.error("Please log in to vote");
      return;
    }

    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const { error } = await supabase
      .from("community_notes")
      .update({ upvotes: note.upvotes + 1 })
      .eq("id", noteId);

    if (error) {
      console.error("Error upvoting:", error);
    } else {
      // Track GA4 event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'note_upvote', {
          note_id: noteId,
          event_category: 'engagement'
        });
      }
      fetchNotes();
    }
  };

  return (
    <div className="border-t pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Community Notes ({notes.length})
        </h3>
        {user && !showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            Add Note
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Wikipedia-style community moderation. Notes are reviewed before publication.
      </p>

      {showForm && (
        <div className="space-y-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add context, corrections, or additional information..."
            rows={3}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmitNote}>
              Submit for Review
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id} className="p-3">
            <p className="text-sm mb-2">{note.note_text}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button
                onClick={() => handleUpvote(note.id)}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ThumbsUp className="w-3 h-3" />
                {note.upvotes}
              </button>
              <span>{new Date(note.created_at).toLocaleDateString()}</span>
            </div>
          </Card>
        ))}

        {notes.length === 0 && (
          <p className="text-sm text-center text-muted-foreground py-4">
            No community notes yet. Be the first to add context!
          </p>
        )}
      </div>
    </div>
  );
};

export default CommunityNotes;
