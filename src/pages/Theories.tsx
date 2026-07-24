import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { ChevronUp, ExternalLink, Plus } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Theory = {
  id: string;
  user_id: string | null;
  title: string;
  summary: string;
  content: string;
  upvotes: number;
  origin: "curated" | "community";
  proponent: string | null;
  source_title: string | null;
  source_url: string | null;
  source_type: string | null;
  tags: string[] | null;
  created_at: string;
};

const theorySchema = z.object({
  title: z.string().trim().min(10).max(200),
  summary: z.string().trim().min(20).max(500),
  content: z.string().trim().min(50).max(5000),
  proponent: z.string().trim().max(200).optional().or(z.literal("")),
  source_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  source_type: z.string().optional().or(z.literal("")),
});

const SOURCE_TYPES = [
  "book",
  "academic",
  "essay",
  "podcast",
  "interview",
  "video",
  "forum",
  "community",
];

export default function TheoriesPage() {
  const navigate = useNavigate();
  const [theories, setTheories] = useState<Theory[]>([]);
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [originFilter, setOriginFilter] = useState<"all" | "curated" | "community">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    proponent: "",
    source_url: "",
    source_type: "",
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    setIsAuthenticated(!!user);

    const { data, error } = await supabase
      .from("theories")
      .select("*")
      .eq("is_approved", true)
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }
    const rows = (data ?? []) as Theory[];
    setTheories(rows);

    const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[];
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, handle")
        .in("id", userIds);
      const map: Record<string, string> = {};
      profs?.forEach((p: any) => {
        map[p.id] = p.handle;
      });
      setHandles(map);
    }

    if (user) {
      const { data: votesData } = await supabase
        .from("theory_votes")
        .select("theory_id")
        .eq("user_id", user.id);
      const votes: Record<string, boolean> = {};
      votesData?.forEach((v: any) => {
        votes[v.theory_id] = true;
      });
      setUserVotes(votes);
    }
  };

  const allTags = useMemo(() => {
    const s = new Set<string>();
    theories.forEach((t) => t.tags?.forEach((tag) => s.add(tag)));
    return Array.from(s).sort();
  }, [theories]);

  const filtered = useMemo(() => {
    return theories.filter((t) => {
      if (originFilter !== "all" && t.origin !== originFilter) return false;
      if (tagFilter !== "all" && !(t.tags ?? []).includes(tagFilter)) return false;
      return true;
    });
  }, [theories, originFilter, tagFilter]);

  const handleVote = async (theoryId: string) => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    try {
      const hasVoted = userVotes[theoryId];
      if (hasVoted) {
        await supabase
          .from("theory_votes")
          .delete()
          .eq("theory_id", theoryId)
          .eq("user_id", user.id);
      } else {
        await supabase.from("theory_votes").insert({ theory_id: theoryId, user_id: user.id });
      }
      setUserVotes((prev) => ({ ...prev, [theoryId]: !hasVoted }));
      // small delay so trigger recount lands
      setTimeout(load, 300);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    try {
      theorySchema.parse(form);
    } catch (err) {
      if (err instanceof z.ZodError) toast.error(err.issues[0].message);
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;
      const payload: any = {
        user_id: user.id,
        title: form.title,
        summary: form.summary,
        content: form.content,
        origin: "community",
      };
      if (form.proponent) payload.proponent = form.proponent;
      if (form.source_url) {
        payload.source_url = form.source_url;
        payload.source_title = form.source_url;
      }
      if (form.source_type) payload.source_type = form.source_type;

      const { error } = await supabase.from("theories").insert(payload);
      if (error) throw error;
      toast.success("Theory submitted for moderation.");
      setForm({ title: "", summary: "", content: "", proponent: "", source_url: "", source_type: "" });
      setIsSubmitOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://dmtcode.com/" },
      { "@type": "ListItem", position: 2, name: "Open Theories", item: "https://dmtcode.com/theories" },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Open Theories about the DMT Code | DMT Code</title>
        <meta
          name="description"
          content="Attributed explanatory theories for the DMT laser code phenomenon, from simulation readings to skeptical accounts, with real community voting."
        />
        <link rel="canonical" href="https://dmtcode.com/theories" />
        <meta property="og:title" content="Open Theories about the DMT Code" />
        <meta property="og:url" content="https://dmtcode.com/theories" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      <Navigation />

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <header className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Open theories</h1>
            <p className="text-lg text-foreground/90 max-w-3xl mx-auto">
              Anyone can put a theory on the table. This page holds the explanatory frameworks
              people actually argue for, from published researchers to podcast guests to
              anonymous forum posters. A theory is not evidence. The registry holds the data,
              the research library holds the studies, and this page holds the ideas that try
              to explain them.
            </p>
            <p className="text-sm text-muted-foreground max-w-3xl mx-auto mt-4">
              Curated entries are collected from the public record and attributed to their
              proponents. Community entries are submitted by signed-in explorers and moderated
              before appearing. Agreement counts are real votes from real accounts, never
              seeded. If replicated blinded experiments one day capture consistent results,
              some of these readings will gain supporting evidence and others will lose it.
              Like archaeology, new context can make an old idea newly serious.
            </p>
          </header>

          <div className="flex flex-wrap items-center gap-2 justify-between mb-6">
            <div className="flex flex-wrap gap-2">
              {([
                ["all", "All"],
                ["curated", "From the public record"],
                ["community", "Community"],
              ] as const).map(([val, label]) => (
                <Button
                  key={val}
                  size="sm"
                  variant={originFilter === val ? "default" : "outline"}
                  onClick={() => setOriginFilter(val)}
                >
                  {label}
                </Button>
              ))}
              {allTags.length > 0 && (
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="h-9 w-[180px]">
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tags</SelectItem>
                    {allTags.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Submit a theory
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit a theory</DialogTitle>
                  <DialogDescription>
                    Community submissions are moderated before appearing publicly.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      id="summary"
                      rows={3}
                      value={form.summary}
                      onChange={(e) => setForm({ ...form, summary: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Full explanation</Label>
                    <Textarea
                      id="content"
                      rows={7}
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proponent">Whose theory is this?</Label>
                    <Input
                      id="proponent"
                      placeholder="Yours? A podcast guest? Name them."
                      value={form.proponent}
                      onChange={(e) => setForm({ ...form, proponent: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="source_url">Source link</Label>
                      <Input
                        id="source_url"
                        placeholder="https://"
                        value={form.source_url}
                        onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="source_type">Source type</Label>
                      <Select
                        value={form.source_type}
                        onValueChange={(v) => setForm({ ...form, source_type: v })}
                      >
                        <SelectTrigger id="source_type">
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCE_TYPES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsSubmitOpen(false)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              The theory board is being restocked with attributed entries from the public record.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((t) => {
                const isOpen = !!expanded[t.id];
                const proponentLine = t.proponent
                  ? `Proposed by ${t.proponent}`
                  : t.user_id && handles[t.user_id]
                  ? `Community submission by @${handles[t.user_id]}`
                  : null;
                return (
                  <Card key={t.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={t.origin === "curated" ? "default" : "secondary"}>
                              {t.origin === "curated" ? "From the public record" : "Community"}
                            </Badge>
                            {t.tags?.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <CardTitle className="text-lg">{t.title}</CardTitle>
                          {proponentLine && (
                            <p className="text-xs text-muted-foreground">{proponentLine}</p>
                          )}
                        </div>
                        <Button
                          variant={userVotes[t.id] ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleVote(t.id)}
                          className="flex-shrink-0 gap-1"
                          aria-label="Agree"
                        >
                          <ChevronUp className="h-4 w-4" />
                          Agree
                          {t.upvotes > 0 && <span className="ml-1">{t.upvotes}</span>}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <CardDescription>{t.summary}</CardDescription>
                      {t.source_title && (
                        <p className="text-xs">
                          {t.source_url ? (
                            <a
                              href={t.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              Source: {t.source_title}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">Source: {t.source_title}</span>
                          )}
                        </p>
                      )}
                      <Collapsible open={isOpen} onOpenChange={(o) => setExpanded((s) => ({ ...s, [t.id]: o }))}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="px-0 h-auto text-xs">
                            {isOpen ? "Hide full theory" : "Read full theory"}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 text-sm whitespace-pre-wrap text-foreground/90">
                          {t.content}
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <p className="text-center mt-10 text-xs text-muted-foreground">
            Looking for the data instead? Visit the <Link to="/registry" className="underline">Symbol Registry</Link> or the <Link to="/bibliography" className="underline">Bibliography</Link>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
