// Client-side mirror of the article JSON-LD emitted by
// netlify/edge-functions/content-prerender.ts (renderArticleDetail).
// Kept in sync by hand. If the prerender graph changes, change this too.

export const SITE = "https://dmtcode.com";
export const LICENSE = "https://creativecommons.org/licenses/by/4.0/";
export const DEFAULT_OG_IMAGE = `${SITE}/og-default.png`;

export type ArticleLdInput = {
  slug: string;
  title: string;
  dek: string;
  body_md: string;
  topic_tags: string[];
  compounds: string[];
  author: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  source_url?: string | null;
  source_outlet?: string | null;
  source_published_at?: string | null;
  related_trials: string[];
  related_bibliography: string[];
  related_symbols: string[];
  related_protocols: string[];
};

const clip = (s: string, n: number) =>
  s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}...`;

const mdToPlain = (md: string) =>
  md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export type ArticleLdResult = {
  graph: Record<string, unknown>;
  head: {
    title: string;
    description: string;
    canonical: string;
    ogType: string;
    ogImage: string;
  };
  emittedTypes: string[];
  notEmitted: Array<{ type: string; reason: string }>;
  warnings: string[];
  richResults: RichResultNote[];
};

export type RichResultNote = {
  feature: string;
  status: "eligible" | "partial" | "not eligible";
  basis: string;
};


export function buildArticleLd(input: ArticleLdInput): ArticleLdResult {
  const canonical = `${SITE}/articles/${input.slug}`;
  const dek = input.dek || "";
  const plainBody = mdToPlain(input.body_md || "");
  const tags = [...(input.topic_tags || []), ...(input.compounds || [])].filter(Boolean);
  const publishedAt = input.published_at || new Date().toISOString();
  const author = (input.author || "").trim();

  const organizationLd = {
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };

  const blogLd = {
    "@type": "Blog",
    "@id": `${SITE}/articles#blog`,
    name: "DMT Code Articles",
    url: `${SITE}/articles`,
    publisher: { "@id": `${SITE}#org` },
  };

  const citationCount =
    (input.related_trials?.length || 0) +
    (input.related_bibliography?.length || 0) +
    (input.related_symbols?.length || 0) +
    (input.related_protocols?.length || 0);

  const blogPostingLd: Record<string, unknown> = {
    "@type": "BlogPosting",
    "@id": canonical,
    headline: input.title,
    description: dek,
    articleBody: clip(plainBody, 600),
    datePublished: publishedAt,
    dateModified: input.updated_at || publishedAt,
    author:
      author && author !== "DMT Code Project"
        ? { "@type": "Person", name: author }
        : { "@id": `${SITE}#org` },
    publisher: { "@id": `${SITE}#org` },
    license: LICENSE,
    isAccessibleForFree: true,
    keywords: tags,
    mainEntityOfPage: canonical,
    image: DEFAULT_OG_IMAGE,
    isPartOf: { "@id": `${SITE}/articles#blog` },
    url: canonical,
  };
  if (citationCount) {
    blogPostingLd.citation = `${citationCount} linked record${citationCount === 1 ? "" : "s"} resolved at render time`;
  }

  const sourceUrl = (input.source_url || "").trim();
  const sourceOutlet =
    (input.source_outlet || "").trim() ||
    (sourceUrl ? sourceUrl.replace(/^https?:\/\/(www\.)?/i, "").split("/")[0] : "");
  if (sourceUrl) {
    const sourceWork: Record<string, unknown> = {
      "@type": "NewsArticle",
      headline: input.title,
      url: sourceUrl,
      publisher: { "@type": "Organization", name: sourceOutlet, url: `https://${sourceOutlet}` },
    };
    if (input.source_published_at) sourceWork.datePublished = input.source_published_at;
    blogPostingLd.isBasedOn = sourceWork;
    blogPostingLd.sdPublisher = { "@type": "Organization", name: sourceOutlet };
    blogPostingLd.sourceOrganization = {
      "@type": "Organization",
      name: sourceOutlet,
      url: `https://${sourceOutlet}`,
    };
  }


  const breadcrumbLd = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Articles", item: `${SITE}/articles` },
      { "@type": "ListItem", position: 3, name: input.title, item: canonical },
    ],
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [organizationLd, blogLd, blogPostingLd, breadcrumbLd],
  };

  const warnings: string[] = [];
  if (!input.title.trim()) warnings.push("headline is empty. BlogPosting will be invalid.");
  if (!dek.trim()) warnings.push("description is empty. Search snippets will be auto generated.");
  if (dek.length > 160)
    warnings.push(`description is ${dek.length} characters. Meta description is clipped at 160.`);
  if (input.title.length > 60)
    warnings.push(`title is ${input.title.length} characters. Over 60 tends to truncate in results.`);
  if (!tags.length) warnings.push("keywords is empty. No topic tags or compounds set.");
  if (!citationCount)
    warnings.push("no related trials, bibliography, symbols or protocols. citation will be omitted.");

  const notEmitted: Array<{ type: string; reason: string }> = [
    {
      type: "Product",
      reason: "Articles are not commerce pages. Product markup is emitted only on /prepare and /products.",
    },
    {
      type: "FAQPage",
      reason: "Google retired FAQ rich results in May 2026. Not emitted for articles.",
    },
    {
      type: "HowTo",
      reason: "Deprecated by Google in September 2023. Not emitted anywhere on this site.",
    },
    {
      type: "ScholarlyArticle",
      reason: "Reserved for bibliography rows with a resolving DOI or ISBN. An article is a BlogPosting.",
    },
  ];

  const hasTitle = Boolean(input.title.trim());
  const hasDek = Boolean(dek.trim());
  const richResults: RichResultNote[] = [
    {
      feature: "Article (headline, date, publisher)",
      status: hasTitle ? "eligible" : "not eligible",
      basis: hasTitle
        ? "BlogPosting is emitted with headline, datePublished, dateModified, author and publisher, which is the full set Google requires for the Article result."
        : "headline is empty, so the BlogPosting node fails Article validation.",
    },
    {
      feature: "Article image thumbnail",
      status: "partial",
      basis:
        "image resolves to the shared site OG image, not a unique 1200px asset for this piece. Google will accept it but is unlikely to promote a large thumbnail.",
    },
    {
      feature: "Breadcrumb trail in results",
      status: "eligible",
      basis:
        "BreadcrumbList is emitted with three absolute-URL ListItems: Home, Articles, this article.",
    },
    {
      feature: "Sitelinks search box",
      status: "not eligible",
      basis:
        "That feature reads a WebSite node with a SearchAction on the site root. Article pages do not emit WebSite.",
    },
    {
      feature: "Merchant and product results",
      status: "not eligible",
      basis:
        "No Product or Offer node. Commerce markup lives only on /prepare and /products.",
    },
    {
      feature: "FAQ and How-to results",
      status: "not eligible",
      basis:
        "Both features were retired by Google (HowTo in September 2023, FAQ for all sites in May 2026). No amount of markup restores them.",
    },
    {
      feature: "Scholarly and dataset surfaces",
      status: "not eligible",
      basis:
        "An article without a resolving DOI or ISBN is a community record, so ScholarlyArticle is deliberately withheld.",
    },
  ];
  if (!hasDek) {
    richResults.push({
      feature: "Snippet control",
      status: "partial",
      basis:
        "description is empty, so Google will synthesise the snippet from body text rather than your dek.",
    });
  }

  return {
    graph,
    head: {
      title: `${input.title} | DMT Code`,
      description: clip(dek, 160),
      canonical,
      ogType: "article",
      ogImage: DEFAULT_OG_IMAGE,
    },
    emittedTypes: ["Organization", "Blog", "BlogPosting", "BreadcrumbList"],
    notEmitted,
    warnings,
    richResults,
  };

}
