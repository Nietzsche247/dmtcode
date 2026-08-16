import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { SEO } from '@/components/SEO';
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type GuideRow = {
  slug: string;
  question: string;
  short_answer: string;
  evidence_grade: string | null;
  last_reviewed: string | null;
};

const formatDate = (value: string | null) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

const SUBLINE =
  "Direct answers to the questions people actually ask, each one graded by how strong the evidence behind it really is.";

export default function Guides() {
  const [guides, setGuides] = useState<GuideRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("guides")
        .select("slug, question, short_answer, evidence_grade, last_reviewed")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (!error && data) setGuides(data as GuideRow[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO uiKey="guides" path="/guides" />
      <Helmet>
        <meta property="og:type" content="website" />
      </Helmet>

      <Navigation />

      <main className="pt-20 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb />

          <header className="mb-8 mt-2">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Guides</h1>
            <p className="text-lg text-foreground/90 max-w-3xl">{SUBLINE}</p>
          </header>

          {loading ? (
            <p className="text-muted-foreground py-10">Loading guides.</p>
          ) : guides.length === 0 ? (
            <p className="text-foreground/90">No guides are published yet.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {guides.map((g) => (
                <Card key={g.slug}>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      <Link to={`/guides/${g.slug}`} className="hover:underline">
                        {g.question}
                      </Link>
                    </CardTitle>
                    {g.last_reviewed && (
                      <p className="text-xs text-muted-foreground">
                        Last reviewed {formatDate(g.last_reviewed)}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-foreground/90">{g.short_answer}</p>
                    {g.evidence_grade && g.evidence_grade.trim() !== "" && (
                      <Badge variant="outline" className="text-xs">
                        Evidence grade: {g.evidence_grade}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
