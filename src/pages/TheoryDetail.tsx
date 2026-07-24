import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { theorySlug, resolveTheoryBySlug } from "@/lib/theorySlug";

type Theory = {
  id: string;
  user_id: string | null;
  title: string;
  summary: string | null;
  content: string | null;
  upvotes: number;
  origin: "curated" | "community" | null;
  proponent: string | null;
  source_title: string | null;
  source_url: string | null;
  source_type: string | null;
  tags: string[] | null;
  created_at: string;
};

function originLabel(origin: string | null): string {
  if (origin === "curated") return "From the public record";
  if (origin === "community") return "Community";
  return "";
}

function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function TheoryDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [theory, setTheory] = useState<Theory | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("theories")
        .select("*")
        .eq("is_approved", true);
      const rows = (data ?? []) as Theory[];
      const resolved = resolveTheoryBySlug(rows, slug);
      setTheory(resolved);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-20 px-4">
          <div className="max-w-3xl mx-auto text-muted-foreground">Loading theory…</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!theory) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Theory not found | DMT Code</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <Navigation />
        <main className="pt-24 pb-20 px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-3xl font-bold">Theory not found</h1>
            <p className="text-muted-foreground">
              This theory is not currently indexed or the link is out of date.
            </p>
            <Link to="/theories" className="underline text-primary">
              Back to Open theories
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const canonicalSlug = theorySlug(theory.title);
  const canonical = `https://dmtcode.com/theories/${canonicalSlug}`;
  const metaDesc = (theory.summary || "").replace(/\s+/g, " ").trim().slice(0, 160);
  const pageTitle = `${theory.title} | DMT Code`;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://dmtcode.com/" },
      { "@type": "ListItem", position: 2, name: "Open theories", item: "https://dmtcode.com/theories" },
      { "@type": "ListItem", position: 3, name: theory.title, item: canonical },
    ],
  };

  const creativeWorkLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": canonical,
    url: canonical,
    name: theory.title,
    license: "https://creativecommons.org/licenses/by/4.0/",
  };
  if (theory.summary) creativeWorkLd.abstract = theory.summary;
  if (theory.content) creativeWorkLd.text = theory.content;
  if (theory.proponent) creativeWorkLd.author = { "@type": "Person", name: theory.proponent };
  if (theory.source_url) creativeWorkLd.isBasedOn = theory.source_url;
  if (theory.tags && theory.tags.length > 0) creativeWorkLd.keywords = theory.tags.join(", ");

  const originText = originLabel(theory.origin);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        {metaDesc && <meta name="description" content={metaDesc} />}
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={theory.title} />
        {metaDesc && <meta property="og:description" content={metaDesc} />}
        <meta property="og:url" content={canonical} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
        <script type="application/ld+json">{JSON.stringify(creativeWorkLd)}</script>
      </Helmet>

      <Navigation />

      <main className="pt-24 pb-20 px-4">
        <article className="max-w-3xl mx-auto space-y-6">
          <nav className="text-sm text-muted-foreground">
            <Link to="/theories" className="underline">Open theories</Link>
          </nav>

          <header className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {originText && (
                <Badge variant={theory.origin === "curated" ? "default" : "secondary"}>
                  {originText}
                </Badge>
              )}
              {theory.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{theory.title}</h1>
            {theory.proponent && (
              <p className="text-sm text-muted-foreground">Proposed by {theory.proponent}</p>
            )}
            {theory.upvotes > 0 && (
              <p className="text-xs text-muted-foreground">Agree: {theory.upvotes}</p>
            )}
          </header>

          {theory.summary && (
            <section className="text-lg text-foreground/90 leading-relaxed">
              {paragraphs(theory.summary).map((p, i) => (
                <p key={i} className="mb-3">{p}</p>
              ))}
            </section>
          )}

          {theory.content && (
            <section className="prose prose-invert max-w-none text-foreground/90">
              {paragraphs(theory.content).map((p, i) => (
                <p key={i} className="mb-4 leading-relaxed whitespace-pre-wrap">{p}</p>
              ))}
            </section>
          )}

          {(theory.source_url || theory.source_title) && (
            <section className="border-t pt-6">
              <p className="text-sm">
                {theory.source_url ? (
                  <a
                    href={theory.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Source: {theory.source_title || theory.source_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">Source: {theory.source_title}</span>
                )}
                {theory.source_type && (
                  <span className="text-muted-foreground"> ({theory.source_type})</span>
                )}
              </p>
            </section>
          )}

          <div className="pt-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/theories">Back to all theories</Link>
            </Button>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
