import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, BellRing, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TrialNotifyButtonProps {
  trialId: string;
  trialTitle: string;
}

const TrialNotifyButton = ({ trialId, trialTitle }: TrialNotifyButtonProps) => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("trial_watchlist")
        .insert({
          trial_id: trialId,
          email: email,
          user_id: user?.id || null,
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already subscribed",
            description: "You're already watching this trial",
          });
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        toast({
          title: "Subscribed!",
          description: `You'll be notified about updates to "${trialTitle.substring(0, 50)}..."`,
        });
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Subscribe error:", error);
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Check className="h-4 w-4" />
        Watching
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="h-4 w-4" />
          Notify Me
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <form onSubmit={handleSubscribe} className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              Get trial updates
            </h4>
            <p className="text-xs text-muted-foreground">
              We'll notify you when this trial's status changes.
            </p>
          </div>
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
};

export default TrialNotifyButton;
