import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useThemeStore } from "@/stores/themeStore";
import { cn } from "@/lib/utils";
import { useContentTranslations, overlay } from "@/hooks/useContentTranslations";
import { useLocale, localePath } from "@/i18n/LocaleProvider";

type SourceEntry = {
  claim?: string;
  source_title?: string;
  source_author?: string;
  source_publication?: string;
  source_url?: string;
  doi?: string;
};

type RelatedPath = { label?: string; path?: string };

type Guide = {
  id: string;
  slug: string;
  question: string;
  short_answer: string;
  evidence_grade: string | null;
  evidence_grade_note: string | null;
  what_supports: unknown;
  what_weakens: unknown;
  what_is_unknown: unknown;
  what_would_change: unknown;
  safety_note: string | null;
  body_md: string | null;
  related_paths: unknown;
  last_reviewed: string | null;
};

const hasText = (v: unknown): v is string =>
  typeof v === "string" && v.trim() !== "";

const asEntries = (v: unknown): SourceEntry[] =>
  Array.isArray(v) ? (v.filter((x) => x && typeof x === "object") as SourceEntry[]) : [];

const asStrings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter(hasText) : [];

const asRelated = (v: unknown): RelatedPath[] =>
  Array.isArray(v)
    ? (v.filter((x) => x && typeof x === "object") as RelatedPath[]).filter(
        (r) => hasText(r.label) && hasText(r.path),
      )
    : [];

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

const truncateAtWord = (text: string, max = 155) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
};

function SourceLine({ entry }: { entry: SourceEntry }) {
  const parts = [entry.source_author, entry.source_title, entry.source_publication].filter(hasText);
  const line = parts.join(", ");
  const doi = hasText(entry.doi) ? entry.doi.trim() : "";

  if (!line && !doi) return null;

  return (
    <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
      {line &&
        (hasText(entry.source_url) ? (
          <p>
            <a
              href={entry.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {line}
            </a>
          </p>
        ) : (
          <p>{line}</p>
        ))}
      {doi && (
        <p>
          DOI{" "}
          <a
            href={`https://doi.org/${doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {doi}
          </a>
        </p>
      )}
    </div>
  );
}

function EvidenceList({ title, entries }: { title: string; entries: SourceEntry[] }) {
  const usable = entries.filter((e) => hasText(e.claim));
  if (usable.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <ul className="space-y-5">
        {usable.map((e, i) => (
          <li key={i} className="border-l-2 border-border pl-4">
            <p className="text-foreground/90">{e.claim}</p>
            <SourceLine entry={e} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlainList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <ul className="list-disc pl-5 space-y-2 text-foreground/90">
        {items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </section>
  );
}

export default function GuideDetail() {
  const { slug } = useParams<{ slug: string }>();
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const [guide, setGuide] = useState<Guide | null>(null);
  const locale = useLocale();
  // guides are keyed by slug in content_translations.
  const translations = useContentTranslations("guides", guide?.slug);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("guides")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
        setGuide(null);
      } else {
        setGuide(data as unknown as Guide);
        setNotFound(false);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-20 px-4 max-w-3xl mx-auto">
          <p className="text-muted-foreground">Loading guide.</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !guide) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Guide not found | DMT Code</title>
          <meta name="robots" content="noindex,follow" />
        </Helmet>
        <Navigation />
        <main className="pt-20 pb-20 px-4 max-w-3xl mx-auto">
          <Breadcrumb />
          <h1 className="text-3xl font-bold mt-4 mb-4">Guide not found</h1>
          <p className="text-foreground/90">
            This guide does not exist or is not published. Return to the{" "}
            <Link to="/guides" className="underline hover:text-foreground">
              guides index
            </Link>
            .
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const shown = (overlay(guide, translations, [
    "question",
    "short_answer",
    "evidence_grade_note",
    "safety_note",
    "body_md",
    "what_supports",
    "what_weakens",
    "what_is_unknown",
    "what_would_change",
  ]) ?? guide) as Guide;
  const canonicalUrl = `https://dmtcode.com${localePath(locale, `/guides/${guide.slug}`)}`;

  const supports = asEntries(shown.what_supports);
  const weakens = asEntries(shown.what_weakens);
  const unknowns = asStrings(shown.what_is_unknown);
  const changes = asStrings(shown.what_would_change);
  const related = asRelated(guide.related_paths);
  const description = truncateAtWord(shown.short_answer);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${shown.question} | DMT Code`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={shown.question} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
      </Helmet>

      <Navigation />

      <main className="pt-20 pb-20 px-4">
        <article className="max-w-3xl mx-auto">
          <Breadcrumb titleOverride={shown.question} />

          <header className="mt-4 mb-8 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">{shown.question}</h1>
            <p className="text-xl text-foreground leading-relaxed border-l-4 border-primary pl-4">
              {shown.short_answer}
            </p>
            {hasText(guide.evidence_grade) && (
              <div className="text-sm">
                <p>
                  <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                    Evidence grade
                  </span>{" "}
                  <span className="text-foreground">{guide.evidence_grade}</span>
                </p>
                {hasText(shown.evidence_grade_note) && (
                  <p className="text-muted-foreground mt-1">{shown.evidence_grade_note}</p>
                )}
              </div>
            )}
          </header>

          {hasText(shown.safety_note) && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-foreground/90">
              {shown.safety_note}
            </div>
          )}

          <EvidenceList title="What supports this" entries={supports} />
          <EvidenceList title="What weakens this" entries={weakens} />
          <PlainList title="What is still unknown" items={unknowns} />
          <PlainList title="What would change this answer" items={changes} />

          {hasText(shown.body_md) && (
            <div
              className={cn(
                "prose max-w-none mt-10 prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
                resolvedTheme === "dark" && "prose-invert",
              )}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => <h2 {...props} />,
                }}
              >
                {shown.body_md}
              </ReactMarkdown>
            </div>
          )}

          {related.length > 0 && (
            <section className="mt-12 border-t border-border pt-8">
              <h2 className="text-2xl font-bold mb-4">Related pages on this site</h2>
              <ul className="space-y-1">
                {related.map((r, i) => (
                  <li key={i}>
                    <Link to={r.path as string} className="text-primary hover:underline">
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {guide.last_reviewed && (
            <p className="mt-10 text-sm text-muted-foreground">
              Last reviewed {formatDate(guide.last_reviewed)}
            </p>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}
