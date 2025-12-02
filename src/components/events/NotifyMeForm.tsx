import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";
import { toast } from "sonner";

interface NotifyMeFormProps {
  entityType: 'event' | 'trial' | 'retreat';
  entityName: string;
  entityDate?: string;
}

const NotifyMeForm = ({ entityType, entityName, entityDate }: NotifyMeFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    // Track GA4 event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'notify_me_signup', {
        entity_type: entityType,
        entity_name: entityName,
        event_category: 'engagement'
      });
    }

    // Simulate API call (replace with actual endpoint)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("You'll be notified about updates!");
    setEmail("");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Get Notified</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Receive updates about {entityName} {entityDate && `on ${new Date(entityDate).toLocaleDateString()}`}
      </p>
      <div className="space-y-2">
        <Label htmlFor="notify-email" className="text-xs">Email Address</Label>
        <Input
          id="notify-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />
      </div>
      <Button type="submit" size="sm" className="w-full" disabled={loading}>
        {loading ? "Submitting..." : "Notify Me"}
      </Button>
    </form>
  );
};

export default NotifyMeForm;
