import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { articleFigureSchema } from "@/lib/articleFigureSchema";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import { useThemeStore } from "@/stores/themeStore";
import { cn } from "@/lib/utils";
import { FollowButton } from "@/components/FollowButton";
import { useContentTranslations, overlay } from "@/hooks/useContentTranslations";
import { useLocale, localePath } from "@/i18n/LocaleProvider";


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
  source_url: string | null;
  source_outlet: string | null;
  source_published_at: string | null;
  related_trials: string[];
  related_bibliography: string[];
  related_symbols: string[];
  related_protocols: string[];
};

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
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
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const [article, setArticle] = useState<Article | null>(null);
  const locale = useLocale();
  // articles are keyed by slug in content_translations.
  const translations = useContentTranslations("articles", article?.slug);
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
          (async () => {
            const { data } = await supabase
              .from("clinical_trials")
              .select("id, title")
              .in("id", a.related_trials);
            setTrials(
              (data ?? []).map((r: any) => ({ href: `/trials/${r.id}`, label: r.title })),
            );
          })(),
        );
      }
      if (a.related_bibliography?.length) {
        jobs.push(
          (async () => {
            const { data } = await supabase
              .from("bibliography")
              .select("id, title")
              .in("id", a.related_bibliography);
            setPapers(
              (data ?? []).map((r: any) => ({ href: `/bibliography/${r.id}`, label: r.title })),
            );
          })(),
        );
      }
      if (a.related_symbols?.length) {
        jobs.push(
          (async () => {
            const { data } = await supabase
              .from("symbol_submissions")
              .select("id")
              .in("id", a.related_symbols);
            setSymbols(
              (data ?? []).map((r: any) => ({
                href: `/registry/${r.id}`,
                label: `Symbol ${String(r.id).slice(0, 8)}`,
              })),
            );
          })(),
        );
      }
      if (a.related_protocols?.length) {
        jobs.push(
          (async () => {
            // Fetch all published protocols and filter client side to avoid
            // PostgREST text in-list quoting issues; the table is small.
            const { data } = await supabase
              .from("protocols")
              .select("slug, title")
              .eq("is_published", true);
            const bySlug = new Map((data ?? []).map((r: any) => [r.slug, r]));
            setProtocols(
              (a.related_protocols as string[])
                .map((s) => bySlug.get(s))
                .filter(Boolean)
                .map((r: any) => ({ href: `/protocols/${r.slug}`, label: r.title })),
            );
          })(),
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

  const shown = (overlay(article, translations, ["title", "dek", "body_md"]) ??
    article) as Article;

  const canonicalUrl = `https://dmtcode.com${localePath(locale, `/articles/${article.slug}`)}`;

  const showUpdated =
    !!article.published_at &&
    new Date(article.updated_at).getTime() - new Date(article.published_at).getTime() > 86_400_000;

  const hasRelated =
    trials.length + papers.length + symbols.length + protocols.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${shown.title} | DMT Code`}</title>
        <meta name="description" content={shown.dek} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={shown.title} />
        <meta property="og:description" content={shown.dek} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
      </Helmet>

      <Navigation />

      <main className="pt-20 pb-20 px-4">
        <article className="max-w-3xl mx-auto">
          <Breadcrumb titleOverride={shown.title} />

          <header className="mt-4 mb-8 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">{shown.title}</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">{shown.dek}</p>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
              <span>{article.author}</span>
              {article.published_at && <span>Published {formatDate(article.published_at)}</span>}
              {showUpdated && <span>Updated {formatDate(article.updated_at)}</span>}
              {article.reviewed_by && <span>Reviewed by {article.reviewed_by}</span>}
            </div>
            {article.source_url && (
              <div className="border border-border rounded-md p-3 text-sm">
                <span className="text-muted-foreground">Sourced from </span>
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-medium underline hover:text-foreground"
                >
                  {article.source_outlet || hostOf(article.source_url)}
                </a>
                {article.source_published_at && (
                  <span className="text-muted-foreground">
                    , published {formatDate(article.source_published_at)}
                  </span>
                )}
                <span className="text-muted-foreground">
                  . Cite the original publication, not this page, for the reporting itself.
                </span>
              </div>
            )}
            <FollowButton entityType="article" entityId={article.id} />

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

          <div className={cn("prose max-w-none prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline", resolvedTheme === 'dark' && "prose-invert")}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, [rehypeSanitize, articleFigureSchema]]}
              components={{
                h1: ({ node, ...props }) => <h2 {...props} />,
              }}
            >
              {shown.body_md}
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
