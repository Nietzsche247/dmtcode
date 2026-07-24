import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronUp, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const theorySchema = z.object({
  title: z.string().trim().min(10, "Title must be at least 10 characters").max(200, "Title must be less than 200 characters"),
  summary: z.string().trim().min(20, "Summary must be at least 20 characters").max(500, "Summary must be less than 500 characters"),
  content: z.string().trim().min(50, "Content must be at least 50 characters").max(5000, "Content must be less than 5000 characters")
});

const DEFAULT_THEORIES = [
  {
    id: "default-1",
    title: "Simulation Source Code Theory",
    summary: "The glyphs represent fundamental code or instructions underlying simulated reality, made visible through DMT's unique interaction with consciousness and coherent light.",
    probability_percentage: 64,
    upvotes: 0,
  },
  {
    id: "default-2",
    title: "Cross-Dimensional Communication Patterns",
    summary: "Patterns constitute a communication system used by non-human intelligences existing in dimensions beyond our normal perception.",
    probability_percentage: 52,
    upvotes: 0,
  },
  {
    id: "default-3",
    title: "Enhanced Laser Speckle + Neurovisual Amplification",
    summary: "DMT amplifies normal laser speckle interference patterns through heightened visual cortex sensitivity and pattern recognition.",
    probability_percentage: 19,
    upvotes: 0,
  },
  {
    id: "default-4",
    title: "Ancient or Human-Independent Script",
    summary: "Symbols represent an archaic or universal writing system predating or independent of human language development.",
    probability_percentage: 41,
    upvotes: 0,
  },
  {
    id: "default-5",
    title: "Quantum Consciousness Interface",
    summary: "The phenomenon reveals quantum-level processes in consciousness, with coherent light acting as a probe or interface.",
    probability_percentage: 37,
    upvotes: 0,
  },
  {
    id: "default-6",
    title: "Collective Unconscious Archetypes",
    summary: "Patterns emerge from Jung's collective unconscious, representing archetypal symbols shared across human consciousness.",
    probability_percentage: 28,
    upvotes: 0,
  },
];

export const TheoriesDashboard = () => {
  const navigate = useNavigate();
  const [theories, setTheories] = useState(DEFAULT_THEORIES);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newTheory, setNewTheory] = useState({
    title: "",
    summary: "",
    content: "",
  });

  useEffect(() => {
    checkAuth();
    loadTheories();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const loadTheories = async () => {
    const { data, error } = await supabase
      .from('theories')
      .select('*')
      .eq('is_approved', true)
      .order('upvotes', { ascending: false });

    if (error) {
      console.error("Error loading theories:", error);
      return;
    }

    if (data && data.length > 0) {
      setTheories([...DEFAULT_THEORIES, ...data]);
    }

    // Check user votes
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: votesData } = await supabase
        .from('theory_votes')
        .select('theory_id')
        .eq('user_id', user.id);

      const votes: Record<string, boolean> = {};
      votesData?.forEach(v => {
        votes[v.theory_id] = true;
      });
      setUserVotes(votes);
    }
  };

  const handleVote = async (theoryId: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to vote on theories");
      navigate("/auth");
      return;
    }

    if (theoryId.startsWith("default-")) {
      toast.info("These are example theories. Submit your own to start voting!");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const hasVoted = userVotes[theoryId];

      if (hasVoted) {
        await supabase
          .from('theory_votes')
          .delete()
          .eq('theory_id', theoryId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('theory_votes')
          .insert({ theory_id: theoryId, user_id: user.id });
      }

      setUserVotes(prev => ({
        ...prev,
        [theoryId]: !hasVoted
      }));
      loadTheories();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSubmitTheory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please login to submit theories");
      navigate("/auth");
      return;
    }

    // Validate input with zod
    try {
      theorySchema.parse(newTheory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('theories')
        .insert({
          user_id: user.id,
          title: newTheory.title,
          summary: newTheory.summary,
          content: newTheory.content,
        });

      if (error) throw error;

      toast.success("Theory submitted for moderation!");
      setNewTheory({ title: "", summary: "", content: "" });
      setIsSubmitOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="theories" className="py-20 px-4 bg-secondary/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Probability & Theories Dashboard
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Community proposed explanatory frameworks for the DMT code phenomenon.
          </p>
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto mt-3 italic">
            Starting hypotheses, listed for structure. Community voting begins from zero and is never seeded.
          </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {theories.map((theory) => (
            <Card key={theory.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{theory.title}</CardTitle>
                    {theory.probability_percentage && (
                      <div className="space-y-2">
                        <Progress value={theory.probability_percentage} className="h-2" />
                        <span className="text-sm font-semibold text-primary">
                          {theory.probability_percentage}% probability estimate
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant={userVotes[theory.id] ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleVote(theory.id)}
                    className="flex-shrink-0"
                  >
                    <ChevronUp className="h-4 w-4 mr-1" />
                    {theory.upvotes + (userVotes[theory.id] ? 1 : 0)}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{theory.summary}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Submit New Theory
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit New Theory</DialogTitle>
                <DialogDescription>
                  Propose a new explanatory framework for the DMT code phenomenon. Submissions are moderated before appearing publicly.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmitTheory} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theory-title">Theory Title *</Label>
                  <Input
                    id="theory-title"
                    value={newTheory.title}
                    onChange={(e) => setNewTheory(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Retinal Persistence Amplification Theory"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theory-summary">Summary (1-2 sentences) *</Label>
                  <Textarea
                    id="theory-summary"
                    value={newTheory.summary}
                    onChange={(e) => setNewTheory(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder="Brief description of the theory..."
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theory-content">Full Explanation *</Label>
                  <Textarea
                    id="theory-content"
                    value={newTheory.content}
                    onChange={(e) => setNewTheory(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Detailed explanation, supporting evidence, predictions..."
                    rows={8}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSubmitOpen(false)}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Theory"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
};
