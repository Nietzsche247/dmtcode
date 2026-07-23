import type { Config, Context } from "@netlify/edge-functions";

const SITE = "https://dmtcode.com";
const SUPABASE_URL =
  Netlify.env.get("SUPABASE_URL") ?? Netlify.env.get("VITE_SUPABASE_URL") ?? "";
const SUPABASE_KEY =
  Netlify.env.get("SUPABASE_ANON_KEY") ??
  Netlify.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  "";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LICENSE = "https://creativecommons.org/licenses/by/4.0/";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function jsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
function clip(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "\u2026" : t;
}

async function getRow(
  table: string,
  id: string,
  filter: string,
  fields: string
): Promise<Record<string, unknown> | null> {
  const api =
    `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&${filter}&select=${fields}`;
  const res = await fetch(api, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows[0] ?? null;
}

function rowsToDl(pairs: Array<[string, unknown]>): string {
  const kept = pairs.filter(
    ([, v]) => v !== null && v !== undefined && String(v).trim() !== ""
  );
  if (!kept.length) return "";
  return (
    "<dl>" +
    kept
      .map(
        ([k, v]) =>
          `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`
      )
      .join("") +
    "</dl>"
  );
}

export default async (request: Request, context: Context) => {
  try {
    const url = new URL(request.url);
    const seg = url.pathname.split("/").filter(Boolean);
    const kind = seg[0];
    const id = seg[1] ?? "";

    // /prepare has no id segment; render from bundles table.
    if (kind === "prepare" && seg.length === 1) {
      return await renderPrepare(context);
    }
    if (kind === "evidence-map" && seg.length === 1) {
      return await renderEvidenceMap(context);
    }
    if (kind === "faq" && seg.length === 1) {
      return await renderFaq(context);
    }
    if (seg.length === 0) {
      return await renderStatic(context, "home");
    }
    if (seg.length === 1 && STATIC_PAGES[kind]) {
      return await renderStatic(context, kind);
    }

    if (!UUID_RE.test(id) || !SUPABASE_URL || !SUPABASE_KEY) {
      return context.next();
    }

    const shellRes = await context.next();
    let title = "";
    let metaDesc = "";
    let canonical = "";
    let ld: Record<string, unknown> | null = null;
    let body = "";
    let ogImage = "";
    let noindex = false;


    if (kind === "registry") {
      const f =
        "id,description,image_url,tags,dose_level,wavelength,surface_type," +
        "emotional_valence,recurrence,source_method,duration_seconds," +
        "upvotes,created_at,updated_at";
      const r = await getRow("symbol_submissions", id, "status=eq.approved", f);
      if (!r) return shellRes;

      const short = String(r.id).slice(0, 8);
      const tags = Array.isArray(r.tags) ? (r.tags as string[]) : [];
      const tagStr = tags.filter(Boolean).join(", ");
      const desc =
        (r.description && String(r.description).trim()) ||
        `A visual symbol reported during N,N-DMT experiences${
          tagStr ? `, tagged ${tagStr}` : ""
        }. Part of the open DMT Code catalogue (CC-BY-4.0).`;

      title = `Symbol ${short} | DMT Code Visual Registry`;
      metaDesc = clip(desc, 160);
      canonical = `${SITE}/registry/${r.id}`;
      ogImage = `${SITE}/card/${r.id}.png`;

      const pairs: Array<[string, unknown]> = [
        ["Dose level", r.dose_level],
        ["Wavelength", r.wavelength],
        ["Surface type", r.surface_type],
        ["Emotional valence", r.emotional_valence],
        ["Recurrence", r.recurrence],
        ["Source method", r.source_method],
        ["Duration (seconds)", r.duration_seconds],
      ];

      ld = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "@id": canonical,
        name: `DMT Code Symbol ${short}`,
        description: desc,
        image: r.image_url,
        url: canonical,
        dateCreated: r.created_at,
        dateModified: r.updated_at,
        keywords: tags,
        license: LICENSE,
        publisher: { "@id": `${SITE}#org` },
        creator: { "@id": `${SITE}#org` },
        isPartOf: {
          "@type": "Dataset",
          "@id": `${SITE}/registry#dataset`,
          name: "DMT Code Visual Symbol Registry",
          description:
            "Open, community maintained record of visual forms reported during N,N-DMT experiences and 650 nm laser exposure.",
          url: `${SITE}/registry`,
          identifier: "10.5281/zenodo.17816520",
          license: LICENSE,
          creator: { "@id": `${SITE}#org` },
        },
        additionalProperty: pairs
          .filter(([, v]) => v !== null && v !== undefined && String(v) !== "")
          .map(([k, v]) => ({
            "@type": "PropertyValue",
            name: k,
            value: String(v),
          })),
        interactionStatistic: {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/LikeAction",
          userInteractionCount: Number(r.upvotes ?? 0),
        },
      };

      body = `<article data-prerender="symbol">
  <h1>DMT Code Symbol ${esc(short)}</h1>
  ${r.image_url ? `<img src="${esc(String(r.image_url))}" alt="${esc(metaDesc)}" />` : ""}
  <p>${esc(desc)}</p>
  ${rowsToDl(pairs)}
  ${
    tags.length
      ? `<section><h2>Tags</h2><ul>${tags
          .filter(Boolean)
          .map((t) => `<li>${esc(t)}</li>`)
          .join("")}</ul></section>`
      : ""
  }
  <p>Independently confirmed by ${Number(
    r.upvotes ?? 0
  )} contributors. Part of the <a href="${SITE}/registry">DMT Code Visual Symbol Registry</a>, an open dataset (CC-BY-4.0) of visual phenomena reported during N,N-DMT experiences.</p>
</article>`;
    } else if (kind === "trials") {
      const f =
        "id,title,description,institution,principal_investigator,status," +
        "start_date,end_date,trial_registry_id,doi,url,record_type,created_at,updated_at";
      const r = await getRow("clinical_trials", id, "is_approved=is.true", f);
      if (!r) return shellRes;
      const isRegisteredTrial =
        r.record_type === "registered_trial" ||
        (typeof r.trial_registry_id === "string" &&
          /^NCT/i.test(r.trial_registry_id));
      noindex = !isRegisteredTrial;

      const desc =
        (r.description && String(r.description).trim()) ||
        `A clinical trial tracked by the DMT Code Clinical Trials Observatory${
          r.institution ? `, conducted at ${r.institution}` : ""
        }.`;

      title = `${String(r.title)} | DMT Code Clinical Trials`;
      metaDesc = clip(desc, 160);
      canonical = `${SITE}/trials/${r.id}`;

      const pairs: Array<[string, unknown]> = [
        ["Status", r.status],
        ["Institution", r.institution],
        ["Principal investigator", r.principal_investigator],
        ["Start date", r.start_date],
        ["End date", r.end_date],
        ["Registry ID", r.trial_registry_id],
        ["DOI", r.doi],
      ];

      const sameAs: string[] = [];
      if (r.url) sameAs.push(String(r.url));
      if (r.doi) sameAs.push(`https://doi.org/${String(r.doi)}`);

      ld = isRegisteredTrial
        ? {
            "@context": "https://schema.org",
            "@type": "MedicalStudy",
            "@id": canonical,
            name: r.title,
            description: desc,
            url: canonical,
            studySubject: { "@type": "Drug", name: "N,N-Dimethyltryptamine (DMT)" },
            status: r.status,
            startDate: r.start_date,
            endDate: r.end_date,
            identifier: r.trial_registry_id,
            sameAs,
            publisher: { "@id": `${SITE}#org` },
            sponsor: r.institution
              ? { "@type": "Organization", name: r.institution }
              : undefined,
            author: r.principal_investigator
              ? { "@type": "Person", name: r.principal_investigator }
              : undefined,
            isPartOf: {
              "@type": "Dataset",
              "@id": `${SITE}/trials#dataset`,
              name: "DMT Clinical Trials Observatory",
              description:
                "Open observatory of clinical trials involving N,N-DMT and related compounds, indexed from public trial registries.",
              url: `${SITE}/trials`,
              license: LICENSE,
              creator: { "@id": `${SITE}#org` },
            },
          }
        : {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "@id": canonical,
            name: r.title,
            description: desc,
            url: canonical,
            dateCreated: r.created_at,
            dateModified: r.updated_at,
            license: LICENSE,
            publisher: { "@id": `${SITE}#org` },
            creator: { "@id": `${SITE}#org` },
          };

      body = `<article data-prerender="trial">
  <h1>${esc(r.title)}</h1>
  <p>${esc(desc)}</p>
  ${rowsToDl(pairs)}
  ${
    r.url
      ? `<p><a href="${esc(r.url)}" rel="noopener">View trial record</a></p>`
      : ""
  }
  ${
    r.doi
      ? `<p>DOI: <a href="https://doi.org/${esc(r.doi)}" rel="noopener">${esc(r.doi)}</a></p>`
      : ""
  }
  <p>Tracked by the <a href="${SITE}/trials">DMT Code Clinical Trials Observatory</a>, an open record of DMT-related clinical research.</p>
</article>`;
    } else if (kind === "bibliography") {
      const f =
        "id,title,authors,journal,publication_date,doi,pmid,abstract,url," +
        "compounds,content_type,authority_type,stance_score,tags,summary," +
        "source_date,full_text,transcript,created_at,updated_at";
      const r = await getRow("bibliography", id, "is_approved=eq.true", f);
      if (!r) return shellRes;

      const desc =
        (r.summary && String(r.summary).trim()) ||
        (r.abstract && String(r.abstract).trim().slice(0, 280)) ||
        `A ${String(r.content_type || "reference")} indexed by the DMT Code research bibliography${
          r.authors ? `, by ${String(r.authors).slice(0, 80)}` : ""
        }.`;

      title = `${String(r.title)} | DMT Code Bibliography`;
      metaDesc = clip(desc, 160);
      canonical = `${SITE}/bibliography/${r.id}`;

      const sameAs: string[] = [];
      if (r.doi) sameAs.push(`https://doi.org/${String(r.doi)}`);
      if (r.pmid) sameAs.push(`https://pubmed.ncbi.nlm.nih.gov/${String(r.pmid)}/`);
      if (r.url) sameAs.push(String(r.url));

      const tags = Array.isArray(r.tags) ? (r.tags as string[]).filter(Boolean) : [];
      const compounds = Array.isArray(r.compounds)
        ? (r.compounds as string[]).filter(Boolean)
        : [];
      const stance = r.stance_score == null ? null : Number(r.stance_score);
      const isScholarly =
        String(r.content_type || "").toLowerCase().includes("paper") ||
        r.doi || r.pmid || r.journal;
      const bodyText =
        (r.full_text && String(r.full_text).trim()) ||
        (r.transcript && String(r.transcript).trim()) ||
        "";

      const additional: Array<Record<string, unknown>> = [];
      if (r.authority_type) additional.push({ "@type": "PropertyValue", name: "authority", value: String(r.authority_type) });
      if (stance !== null) additional.push({ "@type": "PropertyValue", name: "stanceScore", value: stance });
      if (compounds.length) additional.push({ "@type": "PropertyValue", name: "compounds", value: compounds.join(", ") });

      ld = {
        "@context": "https://schema.org",
        "@type": isScholarly ? "ScholarlyArticle" : "CreativeWork",
        "@id": canonical,
        name: r.title,
        headline: r.title,
        description: desc,
        url: canonical,
        author: r.authors ? { "@type": "Person", name: String(r.authors) } : undefined,
        datePublished: r.publication_date || r.source_date || undefined,
        dateModified: r.updated_at || undefined,
        identifier: r.doi ? `doi:${String(r.doi)}` : (r.pmid ? `pmid:${String(r.pmid)}` : undefined),
        sameAs: sameAs.length ? sameAs : undefined,
        keywords: [...tags, ...compounds],
        publisher: { "@id": `${SITE}#org` },
        license: LICENSE,
        isPartOf: {
          "@type": "Dataset",
          "@id": `${SITE}/bibliography#dataset`,
          name: "DMT Code Research Bibliography",
          description:
            "Stance scored research library covering N,N-DMT, 5-MeO-DMT, and related compounds.",
          url: `${SITE}/bibliography`,
          license: LICENSE,
          creator: { "@id": `${SITE}#org` },
        },
        additionalProperty: additional.length ? additional : undefined,
        text: bodyText || undefined,
      };

      const pairs: Array<[string, unknown]> = [
        ["Authors", r.authors],
        ["Journal", r.journal],
        ["Published", r.publication_date || r.source_date],
        ["DOI", r.doi],
        ["PMID", r.pmid],
        ["Content type", r.content_type],
        ["Authority", r.authority_type],
        ["Stance score", stance],
      ];

      body = `<article data-prerender="bibliography">
  <h1>${esc(r.title)}</h1>
  <p>${esc(desc)}</p>
  ${rowsToDl(pairs)}
  ${
    r.url
      ? `<p><a href="${esc(r.url)}" rel="noopener">View source</a></p>`
      : ""
  }
  ${
    r.doi
      ? `<p>DOI: <a href="https://doi.org/${esc(r.doi)}" rel="noopener">${esc(r.doi)}</a></p>`
      : ""
  }
  ${
    bodyText
      ? `<section><h2>Full text</h2><p>${esc(bodyText).slice(0, 4000)}</p></section>`
      : ""
  }
  <p>Indexed by the <a href="${SITE}/bibliography">DMT Code Research Bibliography</a>, an open, stance scored library (CC-BY-4.0).</p>
</article>`;
    } else {
      return shellRes;
    }

    const robotsMeta = noindex
      ? `<meta name="robots" content="noindex,follow" />`
      : "";





    const breadcrumbLd = kind === "registry"
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE },
            { "@type": "ListItem", position: 2, name: "Registry", item: `${SITE}/registry` },
            { "@type": "ListItem", position: 3, name: String(title).split(" | ")[0] || "Symbol", item: canonical },
          ],
        }
      : kind === "trials"
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE },
            { "@type": "ListItem", position: 2, name: "Trials", item: `${SITE}/trials` },
            { "@type": "ListItem", position: 3, name: String(title).split(" | ")[0] || "Trial", item: canonical },
          ],
        }
      : kind === "bibliography"
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE },
            { "@type": "ListItem", position: 2, name: "Bibliography", item: `${SITE}/bibliography` },
            { "@type": "ListItem", position: 3, name: String(title).split(" | ")[0] || "Entry", item: canonical },
          ],
        }
      : null;

    const head = [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(metaDesc)}" />`,
      `<link rel="canonical" href="${esc(canonical)}" />`,
      `<meta property="og:type" content="article" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(metaDesc)}" />`,
      `<meta property="og:url" content="${esc(canonical)}" />`,
      ogImage ? `<meta property="og:image" content="${esc(ogImage)}" />` : "",
      `<meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(metaDesc)}" />`,
      ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}" />` : "",
      robotsMeta,
      ld ? `<script type="application/ld+json">${jsonLd(ld)}</script>` : "",
      breadcrumbLd ? `<script type="application/ld+json">${jsonLd(breadcrumbLd)}</script>` : "",
    ]
      .filter(Boolean)
      .join("\n");

    let html = await shellRes.text();
    // Strip pre-existing per-page tags from the static shell so we do not
    // ship duplicates. Static <head> in index.html carries generic site tags;
    // the entity-specific versions below must replace them.
    html = html
      .replace(/<title>[\s\S]*?<\/title>/gi, "")
      .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
      .replace(/<meta[^>]+property=["']og:[a-z:]+["'][^>]*>\s*/gi, "")
      .replace(/<meta[^>]+name=["']twitter:[a-z:]+["'][^>]*>\s*/gi, "")
      .replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, "")
      .replace(/<meta[^>]+name=["']robots["'][^>]*>\s*/gi, "");
    html = html.replace(/<\/head>/i, `${head}\n</head>`);
    if (/<div id="root">\s*<\/div>/i.test(html)) {
      html = html.replace(
        /<div id="root">\s*<\/div>/i,
        `<div id="root">${body}</div>`
      );
    } else {
      html = html.replace(
        /<\/body>/i,
        `<noscript>${body}</noscript>\n</body>`
      );
    }

    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
        "netlify-cdn-cache-control":
          "public, s-maxage=3600, stale-while-revalidate=86400, durable",
      },
    });
  } catch (_e) {
    return context.next();
  }
};

async function renderPrepare(context: Context): Promise<Response> {
  const shellRes = await context.next();
  if (!SUPABASE_URL || !SUPABASE_KEY) return shellRes;

  const [bundlesRes, itemsRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/bundles?is_published=eq.true&select=id,slug,name,tagline,kind,tier,people,price_cents,parts_sum_cents,wave,ships_status,is_best,sort_order&order=sort_order.asc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: "application/json",
        },
      },
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/bundle_items?select=id,bundle_id,component_name,qty,is_shared,is_digital,sort_order&order=sort_order.asc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: "application/json",
        },
      },
    ),
  ]);
  if (!bundlesRes.ok) return shellRes;
  const rows = (await bundlesRes.json()) as Array<Record<string, unknown>>;
  if (!rows.length) return shellRes;
  const items = itemsRes.ok
    ? ((await itemsRes.json()) as Array<Record<string, unknown>>)
    : [];
  const itemsFor = (bid: string) =>
    items.filter((i) => String(i.bundle_id) === bid);

  const canonical = `${SITE}/prepare`;
  const title =
    "Prepare. Kits and group bundles for careful practice. | DMT Code";
  const metaDesc = clip(
    "Instrument kits and group bundles for careful, well prepared practice. Honest ship windows, plain bills of materials, no surprises.",
    160,
  );
  const ogImage = `${SITE}/placeholder.svg`;

  const usd = (cents: unknown) =>
    `$${(Number(cents) / 100).toFixed(0)}`;

  const kits = rows.filter((r) => r.kind === "kit");
  const groups = rows.filter((r) => r.kind === "group");

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": canonical,
    name: "DMT Code Kits and Group Bundles",
    itemListElement: rows.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: String(r.name),
      url: `${canonical}#${r.slug}`,
    })),
  };

  const KIT_DESC: Record<string, string> = {
    "k1-observer": "Observer tier. Verified 650 nm laser plus matched OD eyewear for a single observer.",
    "k2-practitioner": "Practitioner tier. Full observation instrument, observation journal, and screening card.",
    "k3-instrument": "Instrument tier. The optical-geometry thesis in one shippable kit.",
    "k4-complete": "Complete tier. Full instrument, journal, screening, and reference material.",
  };
  const sanitize = (s: string) =>
    s.replace(/\u2014/g, ":").replace(/\u2013/g, "-").trim();

  const productLds = rows
    .filter((r) => r.kind === "kit")
    .map((r) => {
      const slug = String(r.slug);
      const fallback = sanitize(String(r.tagline ?? ""));
      const description =
        KIT_DESC[slug] || fallback || `DMT Code ${String(r.name)} kit.`;
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${canonical}#${r.slug}`,
        name: `DMT Code ${String(r.name)} Kit`,
        description,
        brand: { "@type": "Brand", name: "DMT Code" },
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: (Number(r.price_cents) / 100).toFixed(2),
          availability:
            r.ships_status === "now"
              ? "https://schema.org/InStock"
              : "https://schema.org/PreOrder",
          url: canonical,
        },
      };
    });

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}#website`,
    url: SITE,
    name: "DMT Code",
    publisher: { "@id": `${SITE}#org` },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Prepare", item: canonical },
    ],
  };

  const datasetLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${SITE}/registry#dataset`,
    name: "DMT Code Visual Symbol Registry",
    description:
      "Open, community maintained record of visual forms reported during N,N-DMT experiences and 650 nm laser exposure.",
    license: LICENSE,
    url: `${SITE}/registry`,
    identifier: "10.5281/zenodo.17816520",
    creator: { "@id": `${SITE}#org` },
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${SITE}/data.json`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${SITE}/shop.json`,
      },
    ],
    sameAs: ["https://doi.org/10.5281/zenodo.17816520"],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What do I need to prepare to observe the geometry?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A verified 650 nm laser and matched optical density filter. Kits range from the Observer (single instrument) to the Complete (full spine). See the kit ladder for bills of materials.",
        },
      },
      {
        "@type": "Question",
        name: "How do I prepare safely?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Adults 18 and older only. Raise MAOIs, SSRIs, cardiac history, and personal or family history of psychosis with a qualified prescriber before any consideration of practice. We publish no discontinuation windows.",
        },
      },
      {
        "@type": "Question",
        name: "Is the data real and verifiable?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The open registry at /registry and the unified corpus at /data.json are CC-BY-4.0. Every symbol shows contributor counts. Critique it.",
        },
      },
    ],
  };

  const kitBlocks = kits
    .map((r) => {
      const bom = itemsFor(String(r.id))
        .map((it) => `${esc(it.component_name)} x${Number(it.qty)}`)
        .join(", ");
      const diff = Number(r.price_cents) - Number(r.parts_sum_cents);
      const delta =
        diff >= 0
          ? `${usd(Math.abs(diff))} more than sourcing the parts yourself`
          : `${usd(Math.abs(diff))} less than sourcing the parts yourself`;
      const ships =
        r.ships_status === "now" ? "Ships now" : "Preorder";
      return `<li id="${esc(r.slug)}"><strong>${esc(r.name)}</strong> ${usd(r.price_cents)} (${esc(delta)}). ${esc(ships)}. Bill of materials: ${bom || "see product page"}.</li>`;
    })
    .join("");

  const groupBlocks = groups
    .map((r) => {
      const people = Number(r.people) || 1;
      const per = Math.round(Number(r.price_cents) / people);
      const bom = itemsFor(String(r.id))
        .map((it) => `${esc(it.component_name)} x${Number(it.qty)}`)
        .join(", ");
      const ships =
        r.ships_status === "now" ? "Ships now" : "Preorder";
      return `<li id="${esc(r.slug)}"><strong>${esc(r.name)}</strong> ${usd(r.price_cents)} for ${people} people (${usd(per)} per person). ${esc(ships)}. Includes: ${bom || "see product page"}.</li>`;
    })
    .join("");

  const body = `<article data-prerender="prepare">
  <h1>Careful preparation over careless purchase</h1>
  <p>${esc(metaDesc)}</p>
  <section>
    <h2>Before you go further</h2>
    <p>Adults 18 and older only. Raise the following with a qualified prescriber before any consideration of practice:</p>
    <ul>
      <li>MAOIs, current or recent</li>
      <li>SSRIs and related serotonergic medications</li>
      <li>Cardiac history</li>
      <li>Personal or family history of psychosis</li>
    </ul>
    <p>We publish no discontinuation windows. Timing decisions belong to a clinician who knows your history.</p>
  </section>
  <section>
    <h2>Kit ladder (one observer)</h2>
    <ul>${kitBlocks}</ul>
  </section>
  <section>
    <h2>Group ladder (two, three, or five together)</h2>
    <ul>${groupBlocks}</ul>
  </section>
  <section>
    <h2>Guarantee</h2>
    <ul>
      <li>Correct on arrival. Right wavelength, right optical density, verified before shipping.</li>
      <li>Complete. Nothing missing, nothing to order after.</li>
      <li>Replaced if wrong. No return shipping.</li>
      <li>Honest about timing. Every item shows its ship window before you pay.</li>
    </ul>
  </section>
  <section>
    <h2>The open data behind this</h2>
    <p>The convergence registry (<a href="${SITE}/registry">/registry</a>) and the machine-readable corpus (<a href="${SITE}/dataset">/dataset</a>, <a href="${SITE}/data.json">/data.json</a>) are CC-BY-4.0.</p>
  </section>
</article>`;

  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(metaDesc)}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(metaDesc)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${esc(ogImage)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(metaDesc)}" />`,
    `<meta name="twitter:image" content="${esc(ogImage)}" />`,
    `<script type="application/ld+json">${jsonLd(organizationLd)}</script>`,
    `<script type="application/ld+json">${jsonLd(websiteLd)}</script>`,
    `<script type="application/ld+json">${jsonLd(breadcrumbLd)}</script>`,
    `<script type="application/ld+json">${jsonLd(datasetLd)}</script>`,
    `<script type="application/ld+json">${jsonLd(faqLd)}</script>`,
    `<script type="application/ld+json">${jsonLd(itemListLd)}</script>`,
    ...productLds.map(
      (ld) => `<script type="application/ld+json">${jsonLd(ld)}</script>`,
    ),
  ].join("\n");

  let html = await shellRes.text();
  html = html
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+property=["']og:[a-z:]+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']twitter:[a-z:]+["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, "");
  html = html.replace(/<\/head>/i, `${head}\n</head>`);
  if (/<div id="root">\s*<\/div>/i.test(html)) {
    html = html.replace(
      /<div id="root">\s*<\/div>/i,
      `<div id="root">${body}</div>`,
    );
  } else {
    html = html.replace(/<\/body>/i, `<noscript>${body}</noscript>\n</body>`);
  }

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "netlify-cdn-cache-control":
        "public, s-maxage=3600, stale-while-revalidate=86400, durable",
    },
  });
}

async function renderEvidenceMap(context: Context): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/evidence-map`;
  const title = "Is the DMT code real? Evidence Timeline and Analysis | DMT Code";
  const metaDesc = clip(
    "A balanced evidence timeline with peer reviewed citations and stance scored milestones from 1926 to 2025. Verifiability and falsifiability, laid out openly.",
    160,
  );
  const ogImage = `${SITE}/placeholder.svg`;

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}#website`,
    url: SITE,
    name: "DMT Code",
    publisher: { "@id": `${SITE}#org` },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Evidence", item: canonical },
    ],
  };
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": canonical,
    headline: "Is the DMT code real? Evidence Timeline and Analysis",
    description: metaDesc,
    url: canonical,
    license: LICENSE,
    publisher: { "@id": `${SITE}#org` },
    author: { "@id": `${SITE}#org` },
  };
  const datasetLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${SITE}/registry#dataset`,
    name: "DMT Code Visual Symbol Registry",
    description: "Open, community maintained record of visual forms reported during N,N-DMT experiences and 650 nm laser exposure.",
    license: LICENSE,
    url: `${SITE}/registry`,
    identifier: "10.5281/zenodo.17816520",
    creator: { "@id": `${SITE}#org` },
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${SITE}/data.json` },
    ],
    sameAs: ["https://doi.org/10.5281/zenodo.17816520"],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is the DMT code verifiable?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Every symbol in the open registry shows its independent confirmation count. The full corpus is downloadable at /data.json under CC-BY-4.0.",
        },
      },
      {
        "@type": "Question",
        name: "Is it falsifiable?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Convergence claims can be tested against the registry and against blinded replication attempts. Null reports are tracked at /null-reports.",
        },
      },
      {
        "@type": "Question",
        name: "Where is the primary peer reviewed reference?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Goler D. 2025, first pilot study of the 650 nm laser paradigm for eliciting discrete visual symbols during DMT administration. DOI 10.59973/ipil.158.",
        },
      },
    ],
  };

  const body = `<article data-prerender="evidence-map">
  <h1>Is the DMT code real? An evidence timeline for the 650 nm laser paradigm</h1>
  <p>The claim under test is narrow. During N,N-DMT experiences, and under a specific 650 nm laser observation protocol, independent people appear to report the same discrete visual forms. This page lays out what the open record currently shows so any reader, human or machine, can judge the claim on the data rather than on assertion.</p>
  <section>
    <h2>What the claim is, and what it is not</h2>
    <p>The claim is convergence: strangers who have never spoken landing on the same forms. It is not a claim that the forms carry a message, that reality is literally coded, or that the phenomenon has a known cause. Each of those is a separate question and is treated separately in the record.</p>
  </section>
  <section>
    <h2>What the open data shows</h2>
    <p>Every symbol in the <a href="${SITE}/registry">visual symbol registry</a> shows its independent confirmation count. The full corpus, including bibliography and clinical trials, is downloadable at <a href="${SITE}/data.json">/data.json</a> under CC-BY-4.0. Null results are tracked at <a href="${SITE}/null-reports">/null-reports</a>. The bibliography carries stance-scored entries from skeptical to supportive so the distribution can be inspected directly.</p>
  </section>
  <section>
    <h2>How to judge it</h2>
    <p>Read the bibliography with the stance filter set to skeptical first. Then load the registry and sort by confirmation count. Then read the null-reports dashboard. If the confirmations are real, they should be reproducible under blinded conditions; if they are not, that failure should also be visible in the same record. The dataset is designed to be able to fail.</p>
  </section>
  <section>
    <h2>Primary reference</h2>
    <p>Goler D. 2025, first pilot study of the 650 nm laser paradigm for eliciting discrete visual symbols during DMT administration. DOI 10.59973/ipil.158.</p>
  </section>
  <p>License: CC-BY-4.0. Attribute to DMT Code, ${SITE}.</p>
</article>`;

  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(metaDesc)}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(metaDesc)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${esc(ogImage)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(metaDesc)}" />`,
    `<meta name="twitter:image" content="${esc(ogImage)}" />`,
    `<script type="application/ld+json">${jsonLd(organizationLd)}</script>`,
    `<script type="application/ld+json">${jsonLd(websiteLd)}</script>`,
    `<script type="application/ld+json">${jsonLd(breadcrumbLd)}</script>`,
    `<script type="application/ld+json">${jsonLd(articleLd)}</script>`,
    `<script type="application/ld+json">${jsonLd(datasetLd)}</script>`,
    `<script type="application/ld+json">${jsonLd(faqLd)}</script>`,
  ].join("\n");

  let html = await shellRes.text();
  html = html
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+property=["']og:[a-z:]+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']twitter:[a-z:]+["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, "");
  html = html.replace(/<\/head>/i, `${head}\n</head>`);
  if (/<div id="root">\s*<\/div>/i.test(html)) {
    html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root">${body}</div>`);
  } else {
    html = html.replace(/<\/body>/i, `<noscript>${body}</noscript>\n</body>`);
  }

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "netlify-cdn-cache-control": "public, s-maxage=3600, stale-while-revalidate=86400, durable",
    },
  });
}

const FAQ_GROUPS: Array<{ heading: string; items: Array<{ q: string; a: string }> }> = [
  {
    heading: "The project",
    items: [
      {
        q: 'What is the "DMT code"?',
        a: "People who take N,N-DMT often report seeing structured visual forms, grids, glyphs, geometric symbols, and a smaller group describes something that reads almost like written characters. The DMT Code project collects those reports in one place so the overlaps can actually be measured instead of argued about. We are not claiming the forms are a message. We are asking a narrower question: do independent people, who have never spoken, keep drawing the same shapes?",
      },
      {
        q: "Is the code real? Are you saying reality is made of code?",
        a: "No. We hold that question open on purpose. Our job is to gather the observations, keep the method honest, and publish everything so anyone can judge for themselves. If the overlaps turn out to be coincidence or shared cultural imagery, the data should show that too. A result that cannot fail is not worth much, so we built this to be able to fail.",
      },
      {
        q: "Is this a religion, or are you telling people what to believe?",
        a: "Neither. Nobody here is asking you to believe anything. Plenty of people who take this seriously think it will turn out to be pattern-matching or shared imagery, and that is a fine place to stand. We care about the observations and the method. What you conclude from them is yours.",
      },
      {
        q: "What will I actually see? Does everyone see the same thing?",
        a: "We cannot promise you will see anything in particular, and honesty matters more than hype. Reports vary a lot. Some people describe grids or geometric forms, some describe symbols, and some see nothing they would call structured. The registry exists to find where those experiences genuinely overlap and where they do not, not to tell you what to expect.",
      },
      {
        q: "Who is behind this and why should I trust it?",
        a: "Trust the method, not us. The reason to take this seriously is that it is open, it is falsifiable, and the confirmations are public, not that anyone here says so. We keep a neutral position, we never seed or fake a count, and we publish the parts that would let you prove us wrong.",
      },
    ],
  },
  {
    heading: "Safety and law",
    items: [
      {
        q: "How do I do this safely?",
        a: "Start with the screening card. Before you consider anything, talk with a qualified prescriber about MAOIs, SSRIs and related medications, any cardiac history, and any personal or family history of psychosis. We deliberately do not publish medication timing windows. The sources disagree and getting it wrong can be dangerous, so that decision belongs with a clinician who knows your history. This is for adults 18 and older.",
      },
      {
        q: "Is this legal?",
        a: "The equipment we discuss is ordinary optical gear. We do not sell, source, or explain how to obtain any controlled substance, and nothing here is legal advice. Laws differ by country and state and they change. For your own situation, check your local law or a qualified professional.",
      },
      {
        q: "Is the laser safe for my eyes?",
        a: "A laser is not a toy. The kits include the right optical density and eyewear for how the protocol uses the light, and everything should be used exactly as described and kept away from children. If you are unsure how to handle optical equipment safely, do not improvise with it.",
      },
    ],
  },
  {
    heading: "The method and the data",
    items: [
      {
        q: "How do you stop people from just copying each other's answers?",
        a: "That is the whole design problem, and it is why the flagship is a blinded comparison. Wherever we can, people record what they saw before they see the existing catalogue, so a match means two strangers landed on the same form independently rather than one person nodding along to another. Convergence only counts when it is earned that way.",
      },
      {
        q: "What actually counts as a match?",
        a: "A symbol is not called a match because it looks vaguely similar. People compare specific forms, and a confirmation is recorded when someone recognizes a form they saw independently. Every symbol shows how many people have recognized it, so you can weigh each one yourself.",
      },
      {
        q: "Can I see the raw data?",
        a: "Yes, all of it. The registry is public, the machine-readable corpus is at /dataset and /data.json, and it is all CC-BY-4.0, free to read, quote, and check. Every symbol shows how many people have recognized it. If something looks off, we would rather you find it.",
      },
      {
        q: "Can I add a symbol I saw myself?",
        a: "Yes. The registry is built from contributions. You can submit what you saw, add context to symbols others have logged, and take part in the comparison. That is how the dataset grows, and it is free to do.",
      },
      {
        q: "Can I download the whole dataset?",
        a: "Yes. The full corpus is at /data.json and /dataset under CC-BY-4.0, with an archived, citable version by DOI. Read it, quote it, run your own analysis, and tell us if we got something wrong.",
      },
    ],
  },
  {
    heading: "Taking part and kits",
    items: [
      {
        q: "What do I need to get started?",
        a: "Everything is laid out on the prepare page, from a single-instrument Observer kit up to a full Complete kit. The core is a verified 650nm laser and the right optical density, plus an observation journal and a screening card. You can also source every part yourself. We show the do-it-yourself total next to each kit so you know exactly what you are paying for.",
      },
      {
        q: "Why a 650nm laser?",
        a: "It is the specific red wavelength the observation protocol is built around, paired with the right optical density so it is used the same way each time. Consistent equipment is what lets one person's observation be compared against another's instead of guessing at the differences.",
      },
      {
        q: "Do I have to use DMT to take part?",
        a: "No. A lot of the work here is observation and comparison. You can browse the registry, add context to symbols other people have logged, and help judge where the forms actually converge without taking anything. The dataset gets stronger every time someone compares carefully.",
      },
      {
        q: "Do I have to buy a kit to take part?",
        a: "No. A kit gets you the equipment to run a careful observation of your own, but you can browse, contribute, and help judge convergence without spending anything. The kits make doing it well easier; they do not gate the project.",
      },
      {
        q: "Can my friends and I do this together?",
        a: "Yes, and it is often better that way. The group bundles on the prepare page share the costly instruments across two, three, or five people, so the per-person cost drops as the circle grows. Three and five also include a facilitator guide and a group agreements card, because doing this with other people asks for a little more structure.",
      },
      {
        q: "What are your shipping and refund terms?",
        a: "Every item shows its ship window before you pay, and if a date slips you hear it from us first. Preorder items are not charged until there is a confirmed source and date. If a component arrives not as described, we replace it and cover it.",
      },
    ],
  },
];

const FAQ_ITEMS: Array<{ q: string; a: string }> = FAQ_GROUPS.flatMap((g) => g.items);

async function renderFaq(context: Context): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/faq`;
  const title = "Questions about the DMT Code project and preparing to observe | DMT Code";
  const metaDesc = clip(
    "Answers to common questions about the DMT Code project: what it is, how to prepare safely, why the data is open, and how convergence is measured.",
    160,
  );
  const ogImage = `${SITE}/placeholder.svg`;

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}#website`,
    url: SITE,
    name: "DMT Code",
    publisher: { "@id": `${SITE}#org` },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "FAQ", item: canonical },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": canonical,
    mainEntity: FAQ_ITEMS.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  const body = `<article data-prerender="faq">
  <h1>Questions about the DMT Code project and preparing to observe</h1>
  ${FAQ_GROUPS.map(
    (g) => `<section><h2>${esc(g.heading)}</h2>
    ${g.items.map((it) => `<section><h3>${esc(it.q)}</h3><p>${esc(it.a)}</p></section>`).join("\n    ")}
  </section>`,
  ).join("\n  ")}
  <p>See the open data at <a href="${SITE}/registry">/registry</a>, <a href="${SITE}/dataset">/dataset</a>, and <a href="${SITE}/data.json">/data.json</a>. CC-BY-4.0.</p>
</article>`;


  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(metaDesc)}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(metaDesc)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${esc(ogImage)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(metaDesc)}" />`,
    `<meta name="twitter:image" content="${esc(ogImage)}" />`,
    `<script type="application/ld+json">${jsonLd(organizationLd)}</script>`,
    `<script type="application/ld+json">${jsonLd(websiteLd)}</script>`,
    `<script type="application/ld+json">${jsonLd(breadcrumbLd)}</script>`,
    `<script type="application/ld+json">${jsonLd(faqLd)}</script>`,
  ].join("\n");

  let html = await shellRes.text();
  html = html
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+property=["']og:[a-z:]+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']twitter:[a-z:]+["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, "");
  html = html.replace(/<\/head>/i, `${head}\n</head>`);
  if (/<div id="root">\s*<\/div>/i.test(html)) {
    html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root">${body}</div>`);
  } else {
    html = html.replace(/<\/body>/i, `<noscript>${body}</noscript>\n</body>`);
  }

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "netlify-cdn-cache-control": "public, s-maxage=3600, stale-while-revalidate=86400, durable",
    },
  });
}

type StaticPage = {
  title: string;
  description: string;
  heading: string;
  paragraphs: string[];
  links?: Array<{ href: string; label: string }>;
  breadcrumbName: string;
  index?: { table: string; filter: string; select: string; titleField: string; linkPrefix: string; label: string };
  bodyExtraHtml?: string;
  extraJsonLd?: unknown[];
};

const PROTOCOL_GUIDE_LEDE =
  "The DMT code refers to a reported observation, first described by Danny Goler in August 2020, that people under the influence of N,N-DMT who look at a 650nm red laser beam diffracted through a grating report seeing similar code-like visual forms. The reported forms include rapidly moving character-like glyphs, stable geometric structures that persist when looked away from and back, and shapes that appear to extend indefinitely into depth. A pilot study was published in IPI Letters in January 2025 (DOI 10.59973/ipil.158). No controlled study has been conducted. Whether the similarity across observers is genuine, and if genuine what causes it, is unresolved. Four explanations are actively defended, and they make different predictions that can be tested.";

const PROTOCOL_GUIDE_FAQ: Array<{ q: string; a: string }> = [
  {
    q: "What is the DMT code?",
    a: PROTOCOL_GUIDE_LEDE,
  },
  {
    q: "What equipment does the reported protocol use?",
    a: "Three ordinary optical components: a 650nm red laser module, a transmission diffraction grating that spreads the beam into a speckle and interference field, and a diffusing or refracting element such as an acrylic tank or lens. None are specific to this claim. DMT Code publishes no substances, sourcing, doses, or medication discontinuation windows. The beam should never be viewed directly.",
  },
  {
    q: "Why 650nm specifically?",
    a: "This is genuinely open. The claim-side answer is that 650nm is special. The skeptic-side answer is that 650nm is simply what inexpensive red laser modules emit, so the wavelength may be an artifact of availability rather than a property of the phenomenon. No published work isolates wavelength as a variable. Running the same protocol at 532nm green and 405nm violet would be the cheapest decisive test, and nobody has published it.",
  },
  {
    q: "Is the DMT code real?",
    a: "Unresolved, and this site holds the question open on purpose. Four explanations are actively defended: 1) Reality-code or simulation (Danny Goler): the forms are structure in reality itself, made visible. 2) Laser speckle (Andrew Gallimore): speckle is a physically real, structured optical artifact, and DMT amplifies pattern recognition applied to it. 3) Cymatics (Andres Gomez Emilsson): non-linear wave dynamics in visual cortex under DMT generate standing patterns. 4) Cultural priming (skeptics): Matrix-style code imagery plus expectancy shapes ambiguous input. They make different testable predictions. None has been tested against the others under controlled conditions.",
  },
  {
    q: "Has anyone replicated it?",
    a: "Anecdotal replication reports are numerous. Independent, controlled, blinded replication has not been published. Consistency percentages circulating in this space generally trace back to the original source rather than independent verification, and should be treated as unverified unless a published method accompanies them.",
  },
  {
    q: "Where does the actual data live?",
    a: "The symbol registry at /registry, the stance-scored research library at /bibliography, DMT-related clinical trials at /trials, the evidence map at /evidence-map, and negative results at /null-reports. The machine-readable corpus is at /data.json. All CC-BY-4.0.",
  },
];

const PROTOCOL_GUIDE_FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://dmtcode.com/protocol-guide#faq",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "dateModified": "2026-07-23",
  "citation": {
    "@type": "ScholarlyArticle",
    "name": "Pilot Study: The Code of Reality Protocol",
    "author": { "@type": "Person", "name": "Danny Goler" },
    "datePublished": "2025-01",
    "identifier": "10.59973/ipil.158",
    "sameAs": "https://doi.org/10.59973/ipil.158",
  },
  "mainEntity": PROTOCOL_GUIDE_FAQ.map((f) => ({
    "@type": "Question",
    "name": f.q,
    "acceptedAnswer": { "@type": "Answer", "text": f.a },
  })),
};

const STATIC_PAGES: Record<string, StaticPage> = {
  home: {
    title: "DMT Code | 650nm Laser Visual Symbol Research",
    description: "Open, community maintained record of visual forms reported during N,N-DMT experiences and 650 nm laser exposure. Peer reviewed research, live clinical trials, and machine readable data under CC-BY-4.0.",
    heading: "DMT Code",
    paragraphs: [
      "The open record of a reported observation: first described by Danny Goler in 2020, published as a pilot study in 2025, and unresolved. We keep the evidence, including the evidence against.",
      "DMT Code is a research surface for a narrow claim: that independent people report the same discrete visual forms during N,N-DMT experiences and under a specific 650 nm laser observation protocol. The site is built so anyone, human or machine, can inspect the raw evidence and judge for themselves.",
      "The registry is public. Every symbol shows its independent confirmation count. The bibliography is stance scored. Null results are tracked in the open. The full corpus is downloadable under CC-BY-4.0.",
    ],
    links: [
      { href: "/registry", label: "Visual symbol registry" },
      { href: "/prepare", label: "Prepare to observe" },
      { href: "/evidence-map", label: "Evidence and analysis" },
      { href: "/faq", label: "Questions and answers" },
    ],
    breadcrumbName: "Home",
  },
  registry: {
    title: "Visual Symbol Registry | DMT Code",
    description: "Open, community maintained catalogue of visual forms reported during N,N-DMT experiences and 650 nm laser exposure. Every symbol shows its independent confirmation count.",
    heading: "Visual Symbol Registry",
    paragraphs: [
      "The registry catalogues discrete visual forms that observers have reported. Each entry records the form, contextual metadata, and the number of independent people who have recognized it. Convergence is measured, not asserted.",
      "Anyone can contribute. Anyone can download the full dataset. The corpus is CC-BY-4.0.",
    ],
    links: [
      { href: "/submit-symbol", label: "Submit a symbol" },
      { href: "/data.json", label: "Machine readable corpus" },
      { href: "/dataset", label: "Dataset index" },
    ],
    breadcrumbName: "Registry",
    index: { table: "symbol_submissions", filter: "status=eq.approved", select: "id,description,created_at", titleField: "description", linkPrefix: "/registry", label: "Recent symbols" },
  },
  trials: {
    title: "Clinical Trials Observatory | DMT Code",
    description: "Observatory of DMT related clinical trials with status, sponsor, phase, and application links. Updated from public trial registries.",
    heading: "Clinical Trials Observatory",
    paragraphs: [
      "The observatory tracks clinical trials that involve N,N-DMT and related compounds. Each record links to the underlying trial registry entry so the primary source is one click away.",
      "Filter by status, indication, and sponsor. Machine readable trial records are included in the unified corpus at /data.json.",
    ],
    links: [
      { href: "/data.json", label: "Machine readable corpus" },
      { href: "/bibliography", label: "Related research library" },
    ],
    breadcrumbName: "Trials",
    index: { table: "clinical_trials", filter: "is_approved=is.true", select: "id,title,updated_at", titleField: "title", linkPrefix: "/trials", label: "Tracked trials" },
  },
  bibliography: {
    title: "Research Bibliography | DMT Code",
    description: "Stance scored research library covering N,N-DMT, 5-MeO-DMT, and related compounds. Filter by content type, authority, stance, tag, and year.",
    heading: "Research Bibliography",
    paragraphs: [
      "The bibliography is a stance scored index of peer reviewed papers, books, essays, and media. Each entry carries an authority type and a signed stance score so the distribution can be inspected directly.",
      "The library is designed to be balanced. Skeptical, neutral, and supportive sources are all indexed. Use the stance filter to read the case against before the case for.",
    ],
    links: [
      { href: "/data.json", label: "Machine readable corpus" },
      { href: "/evidence-map", label: "Evidence analysis" },
    ],
    breadcrumbName: "Bibliography",
    index: { table: "bibliography", filter: "is_approved=eq.true", select: "id,title,updated_at", titleField: "title", linkPrefix: "/bibliography", label: "Recent entries" },
  },
  dataset: {
    title: "Machine Readable Dataset | DMT Code",
    description: "The unified DMT Code corpus. Bibliography, clinical trials, and approved symbols in one JSON document under CC-BY-4.0. Filterable by facet.",
    heading: "Machine Readable Dataset",
    paragraphs: [
      "The unified corpus is available at /data.json. It merges every bibliography row, every tracked clinical trial, and every approved symbol into one document with a shared facet set: content_type, compounds, topic, authority_type, stance_score, people, status, and source_date.",
      "License is CC-BY-4.0. Attribute to DMT Code, https://dmtcode.com. An archived, citable version is available by DOI.",
    ],
    links: [
      { href: "/data.json", label: "/data.json (unified corpus)" },
      { href: "/shop.json", label: "/shop.json (kits and bundles)" },
      { href: "/sitemap.xml", label: "/sitemap.xml" },
    ],
    breadcrumbName: "Dataset",
  },
  about: {
    title: "About the DMT Code project | DMT Code",
    description: "Why the DMT Code project exists, how it operates, and how to inspect or critique the record.",
    heading: "About the DMT Code project",
    paragraphs: [
      "DMT Code was built to test a narrow question with an open record: do independent people report the same discrete visual forms during N,N-DMT experiences and under a specific 650 nm laser observation protocol.",
      "The project is neutral by design. Confirmations are earned by independent recognition, not solicited. The full dataset is public, licensed CC-BY-4.0, and archived with a DOI so external researchers can audit or replicate it.",
    ],
    links: [
      { href: "/methods", label: "Methods" },
      { href: "/critiques", label: "Critiques" },
      { href: "/dataset", label: "Dataset" },
    ],
    breadcrumbName: "About",
  },
  critiques: {
    title: "Critiques and limitations | DMT Code",
    description: "Known limitations of the DMT Code method and dataset. Selection effects, cultural priors, and reasons the convergence signal may not survive scrutiny.",
    heading: "Critiques and limitations",
    paragraphs: [
      "This page catalogues the strongest arguments against the DMT Code claim, including selection bias in who contributes, shared cultural imagery, suggestion effects, and the difficulty of blinding a self report.",
      "Every critique here is linked to the record so a reader can test the claim rather than take a position on it.",
    ],
    links: [
      { href: "/null-reports", label: "Null reports dashboard" },
      { href: "/methods", label: "Methods" },
    ],
    breadcrumbName: "Critiques",
  },
  "null-reports": {
    title: "Null reports dashboard | DMT Code",
    description: "Public dashboard of negative and null replication results submitted to the DMT Code project.",
    heading: "Null reports",
    paragraphs: [
      "Null results are tracked in the open. A dataset that only publishes positive confirmations cannot be judged; this page exists so failed replications are visible in the same record as the successes.",
      "Anyone can submit a null report. Reports are indexed alongside symbols so a reader can weigh confirmation counts against non-recognition counts.",
    ],
    links: [
      { href: "/registry", label: "Registry" },
      { href: "/methods", label: "Methods" },
    ],
    breadcrumbName: "Null reports",
  },
  glossary: {
    title: "Glossary of key terms | DMT Code",
    description: "Definitions of the academic and technical terms used across the DMT Code project.",
    heading: "Glossary",
    paragraphs: [
      "This glossary defines terms used across the DMT Code project, including N,N-DMT, 5-MeO-DMT, 650 nm, optical density, stance score, authority type, and convergence.",
      "Definitions are kept short and factual so cross references between pages resolve to the same meaning.",
    ],
    breadcrumbName: "Glossary",
  },
  methods: {
    title: "Methods and protocol design | DMT Code",
    description: "The observation protocol, blinding approach, and data validation methods used by the DMT Code project.",
    heading: "Methods",
    paragraphs: [
      "The observation protocol is built around a verified 650 nm laser and matched optical density. Where possible, contributors record what they saw before viewing the existing catalogue, so a match is earned by independent recognition rather than by suggestion.",
      "Confirmation counts are public per symbol. The full corpus is downloadable so external analysts can inspect the methodology and re-run their own aggregations.",
    ],
    links: [
      { href: "/protocol-guide", label: "Protocol guide" },
      { href: "/dataset", label: "Dataset" },
    ],
    breadcrumbName: "Methods",
  },
  "open-questions": {
    title: "Open research questions | DMT Code",
    description: "Unresolved research questions tracked by the DMT Code project.",
    heading: "Open questions",
    paragraphs: [
      "This page tracks unresolved research questions that the current dataset cannot yet answer, including dose response, wavelength specificity, and cross cultural convergence.",
      "Each question links to the relevant subset of the corpus so researchers can pick one up and work on it.",
    ],
    breadcrumbName: "Open questions",
  },
  research: {
    title: "Active research projects | DMT Code",
    description: "Ongoing research projects, collaborations, and findings related to the DMT Code paradigm.",
    heading: "Active research",
    paragraphs: [
      "The research page tracks projects that use the DMT Code registry or the 650 nm laser observation protocol as an input, along with published findings.",
      "External researchers who want to use the corpus or contribute a study can do so under CC-BY-4.0 with attribution.",
    ],
    links: [
      { href: "/bibliography", label: "Research bibliography" },
      { href: "/dataset", label: "Dataset" },
    ],
    breadcrumbName: "Research",
  },
  protocols: {
    title: "Protocol catalogue | DMT Code",
    description: "Catalogue of psychedelic and 650 nm laser protocols indexed by the DMT Code project.",
    heading: "Protocols",
    paragraphs: [
      "The protocol catalogue indexes documented psychedelic and 650 nm laser observation protocols, including dosing ranges, equipment specifications, and safety notes where available.",
      "Protocols are indexed for reference. Nothing on this page is a personal recommendation.",
    ],
    links: [
      { href: "/prepare", label: "Prepare to observe" },
      { href: "/protocol-guide", label: "Protocol guide" },
    ],
    breadcrumbName: "Protocols",
  },
  forecasts: {
    title: "Research and technology forecasts | DMT Code",
    description: "Uncertainty-bounded forecasts for DMT research milestones and adjacent technology.",
    heading: "Forecasts",
    paragraphs: [
      "This page publishes uncertainty-bounded forecasts for research milestones adjacent to the DMT Code project. Probabilities are expressed with an interval, not a point estimate.",
      "Forecast rationales are versioned so a reader can inspect why an estimate has moved.",
    ],
    breadcrumbName: "Forecasts",
  },
  "protocol-guide": {
    title: "650 nm Laser Protocol Guide | DMT Code",
    description: "Neutral overview of the 650 nm laser observation protocol used across DMT Code contributions. Equipment, safety, and how observations are recorded.",
    heading: "650 nm Laser Protocol Guide",
    paragraphs: [
      "This is a neutral summary of the 650 nm laser observation protocol as reported by contributors. It documents equipment, room conditions, and observation posture. It is not medical or legal advice.",
      "Adults 18 and older only. Raise MAOIs, SSRIs, cardiac history, and personal or family history of psychosis with a qualified prescriber before any consideration of practice.",
    ],
    links: [
      { href: "/prepare", label: "Prepare" },
      { href: "/methods", label: "Methods" },
    ],
    breadcrumbName: "Protocol guide",
  },
};

async function renderStatic(context: Context, key: string): Promise<Response> {
  const page = STATIC_PAGES[key];
  const shellRes = await context.next();
  if (!page) return shellRes;

  const path = key === "home" ? "" : `/${key}`;
  const canonical = `${SITE}${path || "/"}`;

  let recentList = "";
  if (page.index && SUPABASE_URL && SUPABASE_KEY) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${page.index.table}?${page.index.filter}&select=${page.index.select}&order=created_at.desc&limit=8`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const rows = (await res.json()) as Array<Record<string, unknown>>;
        if (rows.length) {
          const items = rows
            .map((r) => {
              const t = String(r[page.index!.titleField] ?? "").trim() || String(r.id).slice(0, 8);
              return `<li><a href="${page.index!.linkPrefix}/${esc(r.id)}">${esc(clip(t, 120))}</a></li>`;
            })
            .join("");
          recentList = `<section><h2>${esc(page.index.label)}</h2><ul>${items}</ul></section>`;
        }
      }
    } catch { /* ignore */ }
  }

  const linksBlock = page.links && page.links.length
    ? `<section><h2>Related</h2><ul>${page.links
        .map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`)
        .join("")}</ul></section>`
    : "";

  const body = `<article data-prerender="${esc(key)}">
  <h1>${esc(page.heading)}</h1>
  ${page.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n  ")}
  ${recentList}
  ${linksBlock}
</article>`;

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}#website`,
    url: SITE,
    name: "DMT Code",
    publisher: { "@id": `${SITE}#org` },
  };
  const breadcrumbLd = key === "home"
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: page.breadcrumbName, item: canonical },
        ],
      };

  const head = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<script type="application/ld+json">${jsonLd(organizationLd)}</script>`,
    `<script type="application/ld+json">${jsonLd(websiteLd)}</script>`,
    breadcrumbLd ? `<script type="application/ld+json">${jsonLd(breadcrumbLd)}</script>` : "",
  ].filter(Boolean).join("\n");

  let html = await shellRes.text();
  html = html
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+property=["']og:[a-z:]+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']twitter:[a-z:]+["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, "");
  html = html.replace(/<\/head>/i, `${head}\n</head>`);
  if (/<div id="root">\s*<\/div>/i.test(html)) {
    html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root">${body}</div>`);
  } else {
    html = html.replace(/<\/body>/i, `<noscript>${body}</noscript>\n</body>`);
  }

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "netlify-cdn-cache-control": "public, s-maxage=3600, stale-while-revalidate=86400, durable",
    },
  });
}

export const config: Config = {
  path: [
    "/",
    "/registry",
    "/registry/*",
    "/trials",
    "/trials/*",
    "/bibliography",
    "/bibliography/*",
    "/dataset",
    "/about",
    "/critiques",
    "/null-reports",
    "/glossary",
    "/methods",
    "/open-questions",
    "/research",
    "/protocols",
    "/forecasts",
    "/protocol-guide",
    "/prepare",
    "/evidence-map",
    "/faq",
  ],
};






