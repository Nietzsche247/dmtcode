import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Paper {
  id: string;
  title: string;
  authors: string | null;
  journal: string | null;
  publication_date: string | null;
  doi: string | null;
  url: string | null;
  summary: string | null;
}

export const ResearchSection = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data }, { count }] = await Promise.all([
        supabase
          .from("bibliography")
          .select("id, title, authors, journal, publication_date, doi, url, summary")
          .eq("is_approved", true)
          .order("featured", { ascending: false, nullsFirst: false })
          .order("publication_date", { ascending: false, nullsFirst: false })
          .limit(10),
        supabase
          .from("bibliography")
          .select("id", { count: "exact", head: true })
          .eq("is_approved", true),
      ]);
      setPapers((data as Paper[]) ?? []);
      setTotalCount(count ?? null);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <section id="research" className="relative py-20 px-4 bg-muted/20">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold glow-text">
            Scientific Research and References
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A live selection from the stance scored research library, ordered by recency. Each entry links to its full record.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading library...</p>
        ) : papers.length === 0 ? (
          <p className="text-center text-muted-foreground">No approved entries yet.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {papers.map((paper) => {
              const year = paper.publication_date
                ? new Date(paper.publication_date).getFullYear()
                : null;
              return (
                <AccordionItem key={paper.id} value={paper.id}>
                  <AccordionTrigger className="text-left">
                    <div className="space-y-1">
                      <div className="font-semibold">{paper.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {paper.authors ?? "Unknown authors"}
                        {year ? ` (${year})` : ""}
                        {paper.journal ? ` \u00b7 ${paper.journal}` : ""}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {paper.summary && (
                        <p className="text-muted-foreground">{paper.summary}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <Link
                          to={`/bibliography/${paper.id}`}
                          className="text-primary hover:underline"
                        >
                          View full record
                        </Link>
                        {paper.doi && (
                          <a
                            href={paper.url ?? `https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            DOI: {paper.doi}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {!paper.doi && paper.url && (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            Source
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        <div className="text-center pt-8">
          <Link
            to="/bibliography"
            className="text-primary hover:underline text-sm"
          >
            Browse the full stance scored library
            {totalCount !== null ? ` (${totalCount} entries)` : ""}
          </Link>
        </div>
      </div>
    </section>
  );
};
