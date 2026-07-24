import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronUp, ExternalLink, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Theory = {
  id: string;
  title: string;
  summary: string;
  upvotes: number;
  origin: "curated" | "community";
  proponent: string | null;
  source_title: string | null;
  source_url: string | null;
  user_id: string | null;
};

export const TheoriesDashboard = () => {
  const [theories, setTheories] = useState<Theory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("theories")
        .select("id,title,summary,upvotes,origin,proponent,source_title,source_url,user_id")
        .eq("is_approved", true)
        .order("upvotes", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(4);
      setTheories((data ?? []) as Theory[]);
      setLoaded(true);
    })();
  }, []);

  return (
    <section id="theories" className="py-20 px-4 bg-secondary/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Open theories</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            Curated from the public record and from community submissions. Votes are real and never seeded.
          </p>
        </div>

        {loaded && theories.length === 0 ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              The theory board is being restocked with attributed entries from the public record.
            </p>
            <Button asChild variant="outline">
              <Link to="/theories" className="gap-2">
                Explore all open theories <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {theories.map((t) => {
                const proponentLine = t.proponent ? `Proposed by ${t.proponent}` : null;
                return (
                  <Card key={t.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={t.origin === "curated" ? "default" : "secondary"} className="text-[10px]">
                              {t.origin === "curated" ? "From the public record" : "Community"}
                            </Badge>
                          </div>
                          <CardTitle className="text-base">{t.title}</CardTitle>
                          {proponentLine && (
                            <p className="text-xs text-muted-foreground">{proponentLine}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <ChevronUp className="h-3 w-3" />
                          {t.upvotes > 0 ? t.upvotes : ""}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="line-clamp-3">{t.summary}</CardDescription>
                      {t.source_title && t.source_url && (
                        <a
                          href={t.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                        >
                          Source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="text-center">
              <Button asChild>
                <Link to="/theories" className="gap-2">
                  Explore all open theories <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
