import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Badge } from "@/components/ui/badge";

type Article = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  body_md: string;
  topic_tags: string[];
  author: string;
  reviewed_by: string | null;
  published_at: string | null;
  updated_at: string;
  related_trials: string[];
  related_bibliography: string[];
  related_symbols: string[];
  related_protocols: string[];
};

type LinkItem = { href: string; label: string };

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

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trials, setTrials] = useState<LinkItem[]>([]);
  const [papers, setPapers] = useState<LinkItem[]>([]);
  const [symbols, setSymbols] = useState<LinkItem[]>([]);
  const [protocols, setProtocols] = useState<LinkItem[]>([]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const a = data as Article;
      setArticle(a);

      const jobs: Promise<void>[] = [];
      if (a.related_trials?.length) {
        jobs.push(
          supabase
            .from("clinical_trials")
            .select("id, title")
            .in("id", a.related_trials)
            .then(({ data }) => {
              setTrials(
                (data ?? []).map((r: any) => ({ href: `/trials/${r.id}`, label: r.title })),
              );
            }),
        );
      }
      if (a.related_bibliography?.length) {
        jobs.push(
          supabase
            .from("bibliography")
            .select("id, title")
            .in("id", a.related_bibliography)
            .then(({ data }) => {
              setPapers(
                (data ?? []).map((r: any) => ({ href: `/bibliography/${r.id}`, label: r.title })),
              );
            }),
        );
      }
      if (a.related_symbols?.length) {
        jobs.push(
          supabase
            .from("symbol_submissions")
            .select("id")
            .in("id", a.related_symbols)
            .then(({ data }) => {
              setSymbols(
                (data ?? []).map((r: any) => ({
                  href: `/registry/${r.id}`,
                  label: `Symbol ${String(r.id).slice(0, 8)}`,
                })),
              );
            }),
        );
      }
      if (a.related_protocols?.length) {
        jobs.push(
          supabase
            .from("protocols")
            .select("slug, name")
            .in("slug", a.related_protocols)
            .then(({ data }) => {
              setProtocols(
                (data ?? []).map((r: any) => ({ href: `/protocols/${r.slug}`, label: r.name })),
              );
            }),
        );
      }
      await Promise.all(jobs);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-20 px-4 max-w-4xl mx-auto">
          <p className="text-muted-foreground">Loading article.</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Article not found | DMT Code</title>
          <meta name="robots" content="noindex,follow" />
        </Helmet>
        <Navigation />
        <main className="pt-20 pb-20 px-4 max-w-3xl mx-auto">
          <Breadcrumb />
          <h1 className="text-3xl font-bold mt-4 mb-4">Article not found</h1>
          <p className="text-foreground/90">
            This article does not exist or is not published. Return to the{" "}
            <Link to="/articles" className="underline hover:text-foreground">
              articles index
            </Link>
            .
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const showUpdated =
    !!article.published_at &&
    new Date(article.updated_at).getTime() - new Date(article.published_at).getTime() > 86_400_000;

  const hasRelated =
    trials.length + papers.length + symbols.length + protocols.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${article.title} | DMT Code`}</title>
        <meta name="description" content={article.dek} />
        <link rel="canonical" href={`https://dmtcode.com/articles/${article.slug}`} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.dek} />
        <meta property="og:url" content={`https://dmtcode.com/articles/${article.slug}`} />
        <meta property="og:type" content="article" />
      </Helmet>

      <Navigation />

      <main className="pt-20 pb-20 px-4">
        <article className="max-w-3xl mx-auto">
          <Breadcrumb />

          <header className="mt-4 mb-8 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">{article.title}</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">{article.dek}</p>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
              <span>{article.author}</span>
              {article.published_at && <span>Published {formatDate(article.published_at)}</span>}
              {showUpdated && <span>Updated {formatDate(article.updated_at)}</span>}
              {article.reviewed_by && <span>Reviewed by {article.reviewed_by}</span>}
            </div>
            {article.topic_tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {article.topic_tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          <div className="prose prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => <h2 {...props} />,
              }}
            >
              {article.body_md}
            </ReactMarkdown>
          </div>

          {hasRelated && (
            <section className="mt-12 border-t border-border pt-8">
              <h2 className="text-2xl font-bold mb-4">What this is based on</h2>
              <div className="space-y-6">
                {trials.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Clinical trials
                    </h3>
                    <ul className="space-y-1">
                      {trials.map((t) => (
                        <li key={t.href}>
                          <Link to={t.href} className="text-primary hover:underline">
                            {t.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {papers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Research papers
                    </h3>
                    <ul className="space-y-1">
                      {papers.map((p) => (
                        <li key={p.href}>
                          <Link to={p.href} className="text-primary hover:underline">
                            {p.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {symbols.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Symbols
                    </h3>
                    <ul className="space-y-1">
                      {symbols.map((s) => (
                        <li key={s.href}>
                          <Link to={s.href} className="text-primary hover:underline">
                            {s.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {protocols.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Protocols
                    </h3>
                    <ul className="space-y-1">
                      {protocols.map((p) => (
                        <li key={p.href}>
                          <Link to={p.href} className="text-primary hover:underline">
                            {p.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}
