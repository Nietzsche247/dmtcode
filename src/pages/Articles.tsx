import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  topic_tags: string[];
  published_at: string | null;
  source_url: string | null;
  source_outlet: string | null;
};

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const formatDate = (iso: string | null) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

export default function Articles() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, slug, title, dek, topic_tags, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (!error && data) setArticles(data as ArticleRow[]);
      setLoading(false);
    })();
  }, []);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    articles.forEach((a) => a.topic_tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [articles]);

  const filtered = useMemo(() => {
    if (tagFilter === "all") return articles;
    return articles.filter((a) => a.topic_tags?.includes(tagFilter));
  }, [articles, tagFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Articles | DMT Code</title>
        <meta
          name="description"
          content="Long-form answers grounded in this site's own records, with every claim linked to the trial, paper, or symbol it rests on."
        />
        <link rel="canonical" href="https://dmtcode.com/articles" />
        <meta property="og:title" content="Articles | DMT Code" />
        <meta property="og:url" content="https://dmtcode.com/articles" />
        <meta property="og:type" content="website" />
      </Helmet>

      <Navigation />

      <main className="pt-20 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb />

          <header className="mb-8 mt-2">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Articles</h1>
            <p className="text-lg text-foreground/90 max-w-3xl">
              Long-form answers grounded in this site's own records. Every claim links back to the
              trial, paper, or symbol it rests on. These pieces are written by the project, not
              generated, and stay plain about what is reported and what is still open.
            </p>
          </header>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                size="sm"
                variant={tagFilter === "all" ? "default" : "outline"}
                onClick={() => setTagFilter("all")}
              >
                All topics
              </Button>
              {allTags.map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={tagFilter === t ? "default" : "outline"}
                  onClick={() => setTagFilter(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
          )}

          {loading ? (
            <p className="text-muted-foreground py-10">Loading articles.</p>
          ) : filtered.length === 0 ? (
            <div className="border border-border rounded-md p-8 text-center space-y-3">
              <p className="text-foreground/90">
                No articles are published yet. The first pieces are being written and will land here.
              </p>
              <p className="text-sm text-muted-foreground">
                In the meantime, browse the{" "}
                <Link to="/registry" className="underline hover:text-foreground">
                  visual symbol registry
                </Link>{" "}
                or the{" "}
                <Link to="/trials" className="underline hover:text-foreground">
                  clinical trials observatory
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filtered.map((a) => (
                <Card key={a.id}>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      <Link to={`/articles/${a.slug}`} className="hover:underline">
                        {a.title}
                      </Link>
                    </CardTitle>
                    {a.published_at && (
                      <p className="text-xs text-muted-foreground">{formatDate(a.published_at)}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-foreground/90">{a.dek}</p>
                    {a.topic_tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {a.topic_tags.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
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
