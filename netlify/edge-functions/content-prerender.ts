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

// Site-wide social share image. This is a verbatim copy of the og:image already
// declared in index.html, which is the source of truth. Netlify edge functions run
// in Deno and cannot import from src/ or read index.html at request time. If the
// image in index.html changes, change this too, or prerendered pages will unfurl
// with a stale image.
const DEFAULT_OG_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/xpje0qbzg7e7wLYOGt4x2WGDXtR2/social-images/social-1763590629562-Webp.net-resizeimage-3.png";

const SITE_NAME = "DMT Code";

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
    if (kind === "theories" && seg.length === 1) {
      return await renderTheories(context);
    }
    if (kind === "retreats" && seg.length === 1) {
      return await renderRetreats(context);
    }
    if (kind === "articles" && seg.length === 1) {
      return await renderArticlesIndex(context);
    }
    if (kind === "articles" && seg.length === 2 && seg[1]) {
      return await renderArticleDetail(context, seg[1]);
    }
    if (kind === "theories" && seg.length === 2 && seg[1]) { return await renderTheoryDetail(context, seg[1]); }

    if (kind === "events" && seg.length === 2 && UUID_RE.test(id)) {
      return await renderEventDetail(context, id);
    }
    if (kind === "retreats" && seg.length === 2 && UUID_RE.test(id)) {
      return await renderRetreatDetail(context, id);
    }
    if (kind === "protocols" && seg.length === 2 && seg[1]) {
      return await renderProtocolDetail(context, seg[1]);
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
        "id,title,description,institution,principal_investigator,status,phase,confirmed_status," +
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
        ["Phase", r.phase],
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
            "@type": "MedicalTrial",
            "@id": canonical,
            name: r.title,
            phase: r.phase || undefined,
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
    r.confirmed_status && r.confirmed_status !== "Confirmed"
      ? `<p data-verification="${esc(String(r.confirmed_status))}"><strong>Verification status: ${esc(String(r.confirmed_status))}.</strong> This record has not been fully verified against a public trial registry entry. Treat it as unconfirmed until it is.</p>`
      : ""
  }
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

    const head = buildHead({
      title,
      description: metaDesc,
      canonical,
      ogType: "article",
      ogImage: kind === "registry" ? ogImage : undefined,
      ogImageWidth: kind === "registry" ? 1200 : undefined,
      ogImageHeight: kind === "registry" ? 630 : undefined,
      robots: noindex ? "noindex,follow" : undefined,
      jsonLd: [ld, breadcrumbLd],
    });

    const html = renderShell(await shellRes.text(), head, body);
    return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
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

  const head = buildHead({
    title,
    description: metaDesc,
    canonical,
    ogType: "website",
    jsonLd: [organizationLd, websiteLd, breadcrumbLd, datasetLd, faqLd, itemListLd, ...productLds],
  });

  const html = renderShell(await shellRes.text(), head, body);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

async function renderEvidenceMap(context: Context): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/evidence-map`;
  const title = "Is the DMT code real? Evidence Timeline and Analysis | DMT Code";
  const metaDesc = clip(
    "A balanced evidence timeline with peer reviewed citations and stance scored milestones from 1926 to 2025. Verifiability and falsifiability, laid out openly.",
    160,
  );

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

  const head = buildHead({
    title,
    description: metaDesc,
    canonical,
    ogType: "article",
    jsonLd: [organizationLd, websiteLd, breadcrumbLd, articleLd, datasetLd, faqLd],
  });

  const html = renderShell(await shellRes.text(), head, body);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
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


  const head = buildHead({
    title,
    description: metaDesc,
    canonical,
    ogType: "website",
    jsonLd: [organizationLd, websiteLd, breadcrumbLd, faqLd],
  });

  const html = renderShell(await shellRes.text(), head, body);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
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

// Verbatim copy of the terms array in src/data/glossaryTerms.ts, which is the source of truth.
// Netlify edge functions run in Deno and cannot import from src/.
const GLOSSARY_TERMS: Array<{ term: string; definition: string }> = [
  { term: "650 nm Laser Protocol", definition: "Experimental method using coherent light at 650 nanometer wavelength through a diffraction grating to elicit discrete visual symbols during N,N-DMT administration. Developed by Danny Goler, validated by Chase Hughes." },
  { term: "Alphabetic-like Symbol", definition: "Discrete visual element resembling written characters from alphabetic writing systems (e.g., katakana, Cyrillic, runic). Reported with notable inter-subject consistency during 650 nm laser exposure." },
  { term: "Coherent Light", definition: "Electromagnetic radiation with constant phase relationship between waves. Laser light is coherent, enabling precise diffraction patterns essential for symbol elicitation." },
  { term: "Confirmation Count", definition: "Number of independent observers reporting identical or highly similar symbols in the DMT Code Glyph Registry. Metric for assessing inter-subject replication reliability." },
  { term: "Diffraction Grating", definition: "Optical component with periodic structure that splits coherent light into distinct beams. Used in 650 nm protocol to project grid patterns that interact with N,N-DMT visual phenomena." },
  { term: "Discrete Visual Symbol", definition: "Distinct, bounded geometric or alphabetic-like element perceived as separate from surrounding visual field. Contrasts with continuous geometric patterns or ambient visual noise." },
  { term: "Geometric Archetype", definition: "Recurring symbol morphology reported across independent observers, described by shared features such as symmetry, line structure, and orientation." },
  { term: "Inter-subject Consistency", definition: "Degree to which independent observers report identical or highly similar phenomena under controlled conditions. 650 nm protocol shows notable consistency across independent replicators." },
  { term: "Motif Tag", definition: "Descriptive categorical label applied to registry symbols (e.g., 'spiral', 'bilateral', 'angular'). Facilitates pattern analysis and cross-reference between submissions." },
  { term: "N,N-Dimethyltryptamine (N,N-DMT)", definition: "Endogenous tryptamine compound and Schedule I controlled substance. Administered via smoking, vaporisation, or intramuscular injection. Produces intense visual phenomena lasting 5-20 minutes." },
  { term: "Perceived Surface", definition: "Physical or conceptual location where visual symbols appear during N,N-DMT experience (e.g., wall, ceiling, closed eyelids, hands). Surface type correlates with specific symbol archetypes." },
  { term: "Photobiomodulation", definition: "Therapeutic use of red or near-infrared light (660-850 nm) to enhance cellular energy production via mitochondrial cytochrome c oxidase stimulation. Any link to symbol clarity in the 650 nm protocol is an untested hypothesis and has not been demonstrated." },
  { term: "Registry Glyph", definition: "100×100 pixel black-and-white or red-and-gold symbol submitted to DMT Code Glyph Registry with structured metadata (source, dose, surface, depth, emotional valence, etc.)." },
  { term: "Route of Administration", definition: "Method of N,N-DMT delivery: smoked/vaporised (most common, rapid onset), intramuscular injection (slower onset, longer duration), or other experimental routes." },
  { term: "Symmetry Classification", definition: "Geometric property of registry symbols: bilateral (mirror symmetry), radial (rotational symmetry), perfect geometric (mathematical precision), or asymmetric." },
  { term: "Visual Cortex Coherence", definition: "Synchronized neural activity in primary and secondary visual processing regions. Timmermann et al. (2019) demonstrated enhanced coherence during N,N-DMT administration correlating with discrete symbol perception." },
  { term: "Anecdotal Evidence", definition: "First-person subjective reports not obtained through controlled experimental design. While valuable for hypothesis generation, anecdotal data lacks the rigor of double-blind randomized trials." },
  { term: "Blinded Experiment", definition: "Research methodology where participants (single-blind) or both participants and experimenters (double-blind) do not know which condition is being tested. Essential for controlling expectancy bias and placebo effects." },
  { term: "CC-BY-4.0 License", definition: "Creative Commons Attribution 4.0 International license. Permits redistribution and modification of registry data with proper attribution. All DMT Code registry submissions are released under this open-access license." },
  { term: "Control Condition", definition: "Experimental baseline for comparison (e.g., sober + laser, DMT + no laser). Required to isolate the causal effect of the 650 nm laser on visual symbol perception during N,N-DMT experiences." },
  { term: "Cross-Replication", definition: "Independent verification of reported phenomena by multiple observers under similar conditions. The notable inter-subject consistency rate represents partial cross-replication of symbol observations." },
  { term: "Dose-Response Relationship", definition: "Correlation between substance quantity administered and intensity of observed effects. Registry metadata tracks approximate DMT dose to assess potential dose-symbol clarity relationships." },
  { term: "Expectancy Bias", definition: "Psychological phenomenon where prior knowledge or beliefs influence subjective perception and reporting. A key critique of non-blinded visual symbol reports during N,N-DMT experiences." },
  { term: "JSON-LD Schema", definition: "Structured data markup format for embedding machine-readable metadata in web pages. DMT Code uses JSON-LD for Dataset, FAQPage, and Product schemas to enhance search engine discoverability." },
  { term: "Longitudinal Analysis", definition: "Research tracking the same participants across multiple sessions over time. Authenticated registry submissions enable longitudinal comparison of symbol reports from the same observer." },
  { term: "Null Hypothesis", definition: "Statistical assumption that no relationship exists between variables being tested. For the 650 nm protocol: 'Laser exposure during DMT has no effect on visual symbol perception beyond placebo.'" },
  { term: "Open-Access Data", definition: "Research data freely available for download, analysis, and redistribution without paywalls or institutional barriers. All registry submissions are open-access under CC-BY-4.0." },
  { term: "Pareidolia", definition: "Cognitive tendency to perceive meaningful patterns (faces, symbols) in random or ambiguous stimuli. Potential alternative explanation for alphabetic-like symbol observations during altered states." },
  { term: "Phosphene", definition: "Sensation of seeing light without light actually entering the eye, caused by mechanical or electrical stimulation of retinal photoreceptors. Potential optical artifact explanation for laser-elicited symbols." },
  { term: "Replication Crisis", definition: "Scientific recognition that many published findings cannot be independently reproduced. The 650 nm protocol relies on anecdotal replication reports rather than controlled laboratory replication." },
  { term: "Retinal Afterimage", definition: "Visual impression that persists after exposure to bright light ceases. Diffraction grating patterns could produce afterimages misinterpreted as discrete symbols during altered states." },
  { term: "Speckle Pattern", definition: "Random granular interference pattern produced when coherent light scatters from rough surfaces. Laser speckle may contribute to fine-scale visual texture during 650 nm protocol, potentially enhancing perceived symbol detail." },
  { term: "Entoptic Phenomenon", definition: "Visual effect originating within the eye itself rather than external light sources. Includes floaters, blood vessel shadows, and Haidinger's brushes. Coherent light exposure enhances visibility of normally subliminal entoptic structures." },
  { term: "Form Constant", definition: "Recurring geometric pattern (tunnels, spirals, honeycombs, lattices) observed across diverse altered states, generally attributed to primary visual cortex (V1) architecture. Distinguished from the discrete alphabetic-like symbols reported under the 650 nm laser protocol, which are described as bounded character-like elements rather than continuous geometric fields." },
];

// Verbatim copy of termSlug from src/data/glossaryTerms.ts (source of truth).
function termSlug(term: string): string {
  return String(term || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2018\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

const GLOSSARY_TERMSET_LD = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  "@id": "https://dmtcode.com/glossary#termset",
  "url": "https://dmtcode.com/glossary",
  "name": "DMT Code Glossary of Terms",
  "description": "Technical definitions for 650 nm laser protocol and visual symbol classification",
  "hasDefinedTerm": GLOSSARY_TERMS.map((t) => ({
    "@type": "DefinedTerm",
    "@id": `https://dmtcode.com/glossary#${termSlug(t.term)}`,
    "url": `https://dmtcode.com/glossary#${termSlug(t.term)}`,
    "name": t.term,
    "description": t.definition,
    "inDefinedTermSet": "https://dmtcode.com/glossary#termset",
  })),
};

const METHODS_FAQ: Array<{ q: string; a: string }> = [
  {
    q: "How do you design a blinded experiment for the 650 nm laser protocol?",
    a: "Double-blind experimental design requires three critical components to eliminate expectation effects and observer bias: Sham laser device: Construct device with identical appearance, weight, and operation (button press, indicator LED) but no 650 nm coherent light output. Use blocked aperture or 520 nm green LED as control wavelength. Independent randomization: Third-party experimenter (not present during experience) randomizes real/sham assignment using sealed envelopes or electronic randomization. Maintains allocation concealment until data analysis. Blinded symbol recording: Both participant and symbol recorder remain unaware of real/sham condition. Post-experience drawing occurs before unblinding. Control for optical variables: wavelength (650 nm ± 5 nm), intensity (≤5 mW), diffraction grating line density (500-1000 lines/mm). Control for pharmacological variables: N,N-DMT dose (route-matched baseline dose), set/setting standardization. Timmermann et al. (2019) Neural correlates of the DMT experience assessed with multivariate EEG. DOI: 10.1038/s41598-019-51974-4",
  },
  {
    q: "What control conditions are necessary?",
    a: "Rigorous replication requires four experimental conditions to isolate laser effect from DMT effects, expectation, and optical artifacts: Condition 1: Sham laser + N,N-DMT. Controls for expectation effects. If symbols appear with sham device, suggests placebo/expectation mechanism. Condition 2: Real laser + placebo substance. Controls for optical artifacts. If symbols appear without DMT, suggests retinal phosphenes or afterimages. Condition 3: No laser + N,N-DMT. Baseline DMT visual phenomena without laser stimulus. Establishes whether symbols occur spontaneously. Condition 4: Diffraction grating alone (no laser) + N,N-DMT. Controls for grating visual effects. Tests whether coherent light (vs. ambient light through grating) is necessary. Each condition requires minimum 20 participants for 80% statistical power to detect medium effect size (Cohen's d = 0.5). Use validated symbol classification schema and blinded raters for drawing analysis.",
  },
  {
    q: "How do you quantify visual symbol consistency?",
    a: "Objective symbol classification requires: Pre-registered symbol taxonomy: Define categories before data collection (geometric shapes, alphabetic-like characters, abstract patterns) rather than assigning them post hoc. Blinded rater analysis: Two independent raters (unaware of experimental condition) classify drawings using a standardized rubric. Calculate inter-rater reliability (Cohen's κ ≥ 0.70 required). Computational similarity metrics: Use image similarity algorithms (SSIM, perceptual hashing) to quantify drawing-to-drawing consistency within conditions. Symbol frequency analysis: Track how often identical symbols appear across participants. High-consistency symbols (≥3 independent observers) warrant focused analysis.",
  },
  {
    q: "What statistical tests are appropriate?",
    a: "Primary outcome: Symbol appearance rate (binary: yes/no discrete bounded symbols). Chi-square test: Compare symbol appearance frequency across real laser vs. sham laser conditions. Logistic regression: Model symbol appearance probability with predictors (laser condition, DMT dose, prior experience, expectation). Bayesian analysis: Calculate Bayes factor (BF₁₀) comparing laser-effect hypothesis vs. null hypothesis. BF₁₀ > 3 considered moderate evidence, >10 strong evidence. Secondary outcomes: Symbol complexity (quantified via fractal dimension, perimeter-to-area ratio), inter-subject similarity (average pairwise SSIM scores), consistency with pre-registered symbol taxonomy.",
  },
  {
    q: "What equipment specifications are required?",
    a: "Standardized equipment ensures replicability: Laser: 650 nm ± 5 nm wavelength, ≤5 mW power output (Class IIIa safety rating), continuous wave (not pulsed), beam diameter 1-2 mm at aperture. Diffraction grating: 500-1000 lines/mm transmission grating, mounted 2-5 cm from laser aperture. Holographic gratings preferred for uniform diffraction pattern. Sham device: Identical external housing, blocked aperture or 520 nm green LED (produces visible dot but different wavelength), same weight/button operation. Measurement tools: Spectrometer to verify 650 nm output, power meter to confirm ≤5 mW, beam profiler for spatial characterization.",
  },
  {
    q: "How do you handle ethical considerations?",
    a: "Psychedelic research requires stringent ethical protocols: Institutional approval: IRB/ethics committee approval required before any human subjects research. Submit detailed protocol including risk mitigation, informed consent procedures, participant screening. Medical screening: Exclude participants with personal/family history of psychosis, cardiovascular conditions, medications contraindicated with DMT (MAOIs, SSRIs). Harm reduction: Trained medical personnel on-site, blood pressure/heart rate monitoring, integration support sessions post-experience. Data protection: Anonymous data collection, secure storage (HIPAA/GDPR compliant), no identifiable information linked to drawings or reports. Follow guidelines from Psychedelic Science Group, MAPS, and Beckley Foundation for conducting responsible psychedelic research. Prioritize participant safety over data collection.",
  },
];

const METHODS_FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://dmtcode.com/methods#faq",
  "mainEntity": METHODS_FAQ.map((f) => ({
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
      "Where this project stands: DMT Code is the open record of a claim, not an advocate for it. The observation was described by Danny Goler in 2020 and published in 2025. What did not exist was a place to accumulate the evidence in a form anyone could inspect, including evidence that cuts against it. Every symbol is a dated, permanent, licensed record. Every source carries a stance score. Negative results are published in the same place as positive ones, under the same license. We do not know whether the phenomenon is real. We built the instrument that could find out.",
      "On Danny Goler: Danny Goler first described the observation this project studies, and he is credited as its originator throughout this site. He is aware of this project but holds no editorial role in it. What gets published here, including the critiques and null results, is decided independently, and the public dataset lets anyone check that policy against practice.",
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
      "Publishing the strongest versions of the critiques against this project is deliberate policy. If a claim cannot survive its best opponents, it does not deserve to survive. Three serious critical positions are stated below in their strongest form, credited to the people who defend them.",
      "1) Laser speckle (Andrew Gallimore): the diffracted 650 nm beam produces speckle, a physically real, structured optical pattern. DMT amplifies pattern recognition, so shared structure across observers may reflect shared optics rather than any external code. Prediction: changing the diffraction grating should change the reported forms.",
      "2) Cymatics (Andres Gomez Emilsson): non-linear standing-wave dynamics in visual cortex under DMT could generate structured, apparently discrete forms without any external code at all. Prediction: similar forms should appear given sufficient visual noise, with or without a laser.",
      "3) Cultural priming (skeptics): code and glyph imagery is culturally saturated (The Matrix, hieroglyphs, digital rain), and expectancy shapes ambiguous perception. Prediction: naive observers who are not told what to expect should report different content from observers who have read the literature.",
      "These predictions are testable, and the registry exists to accumulate the data that could distinguish them. Credit to Danny Goler as the originator of the reported observation. The critiques above are why we track null results in the same place as confirmations.",
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
      "A null report is a record from someone who ran the observation carefully and saw nothing structured, or nothing that matched anything already in the catalogue. It is the negative counterpart to a confirmation.",
      "We publish null reports for a simple reason: a dataset that cannot record failure cannot be trusted about success. Null results are the credibility asset of this project, not an embarrassment to it. They are the reason a confirmation count means what it says.",
      "If the count on this page is zero or near zero, that is an honest empty state and we are saying so plainly. No null reports have been fabricated. If you observed nothing, or nothing that matched, please submit that outcome so the record reflects both sides of the ledger.",
    ],
    links: [
      { href: "/registry", label: "Registry" },
      { href: "/methods", label: "Methods" },
    ],
    breadcrumbName: "Null reports",
  },
  events: {
    title: "Research Timeline and Events | DMT Code",
    description: "Community reported research events, workshops, and DMT related clinical trial milestones. A scholarly reference timeline aggregated from public sources.",
    heading: "Research Timeline and Events",
    paragraphs: [
      "This page aggregates community reported events and publicly available clinical trial data into one scholarly reference timeline. Inclusion does not constitute endorsement.",
      "Events and trials are sourced from the community and from public registries, and are reviewed by moderators before publication. A listing is not an endorsement. Verify legal status, medical screening and staff credentials directly with any organizer or retreat center before you book.",
    ],
    links: [
      { href: "/trials", label: "Clinical trials observatory" },
      { href: "/evidence-map", label: "Evidence timeline (1926 to present)" },
      { href: "/bibliography", label: "Research bibliography" },
    ],
    breadcrumbName: "Events",
  },
  glossary: {
    title: "Glossary of key terms | DMT Code",
    description: "Definitions of the academic and technical terms used across the DMT Code project.",
    heading: "Glossary",
    paragraphs: [
      "This glossary defines terms used across the DMT Code project, including the 650 nm laser protocol, discrete visual symbol, inter-subject consistency, form constant, entoptic phenomenon, expectancy bias, pareidolia and phosphene.",
      "Definitions are kept short and factual so cross references between pages resolve to the same meaning.",
    ],
    breadcrumbName: "Glossary",
    bodyExtraHtml: `<section><h2>Definitions</h2>${GLOSSARY_TERMS.map((t) => `<div id="${termSlug(t.term)}"><h3>${esc(t.term)}</h3><p>${esc(t.definition)}</p></div>`).join("")}</section>`,
    extraJsonLd: [GLOSSARY_TERMSET_LD],
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
    bodyExtraHtml: `<section><h2>Common questions</h2>${METHODS_FAQ.map((f) => `<div><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join("")}</section>`,
    extraJsonLd: [METHODS_FAQ_LD],
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
    description: "Neutral overview of the reported 650 nm laser observation protocol, first described by Danny Goler in 2020: equipment, safety, and how observations are recorded.",
    heading: "650 nm Laser Protocol Guide",
    paragraphs: [
      PROTOCOL_GUIDE_LEDE,
      "This is a neutral summary of the 650 nm laser observation protocol as reported by contributors. It documents equipment, room conditions, and observation posture. It is not medical or legal advice.",
      "Adults 18 and older only. Raise MAOIs, SSRIs, cardiac history, and personal or family history of psychosis with a qualified prescriber before any consideration of practice.",
    ],
    links: [
      { href: "/prepare", label: "Prepare" },
      { href: "/methods", label: "Methods" },
    ],
    breadcrumbName: "Protocol guide",
    bodyExtraHtml: `<section><h2>Common questions</h2>${PROTOCOL_GUIDE_FAQ.map((f) => `<div><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join("")}</section>`,
    extraJsonLd: [PROTOCOL_GUIDE_FAQ_LD],
  },
};

async function renderStatic(context: Context, key: string): Promise<Response> {
  const page = STATIC_PAGES[key];
  const shellRes = await context.next();
  if (!page) return shellRes;

  const path = key === "home" ? "" : `/${key}`;
  const canonical = `${SITE}${path || "/"}`;

  let recentList = "";
  const extraLd: unknown[] = [...(page.extraJsonLd ?? [])];

  if (key === "events" && SUPABASE_URL && SUPABASE_KEY) {
    try {
      const headers = {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      };
      const todayIso = new Date().toISOString().slice(0, 10);
      const [upRes, pastRes, reRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/events?is_approved=eq.true&event_date=gte.${todayIso}&select=id,title,description,event_date,location,event_type&order=event_date.asc&limit=12`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/events?is_approved=eq.true&event_date=lt.${todayIso}&select=id,title,description,event_date,location,event_type&order=event_date.desc&limit=12`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/retreats?is_approved=eq.true&select=id,name,description,location,country,website_url&order=created_at.desc&limit=12`, { headers }),
      ]);
      const ups = upRes.ok ? await upRes.json() as Array<Record<string, string>> : [];
      const pasts = pastRes.ok ? await pastRes.json() as Array<Record<string, string>> : [];
      const rets = reRes.ok ? await reRes.json() as Array<Record<string, string>> : [];
      const renderEv = (r: Record<string, string>) => `<li><time datetime="${esc(r.event_date)}">${esc(String(r.event_date || "").slice(0,10))}</time>: <a href="/events/${esc(r.id)}">${esc(clip(String(r.title || ""), 140))}</a>${r.location ? ` (${esc(String(r.location))})` : ""}${r.description ? `<p>${esc(clip(String(r.description), 240))}</p>` : ""}</li>`;
      const renderRe = (r: Record<string, string>) => `<li><a href="/retreats/${esc(r.id)}">${esc(clip(String(r.name || ""), 140))}</a>${r.location || r.country ? ` (${esc([r.location, r.country].filter(Boolean).join(", "))})` : ""}${r.description ? `<p>${esc(clip(String(r.description), 240))}</p>` : ""}</li>`;
      const sections: string[] = [];
      if (ups.length) sections.push(`<section><h2>Upcoming events</h2><ul>${ups.map(renderEv).join("")}</ul></section>`);
      if (pasts.length) sections.push(`<section><h2>Past events</h2><ul>${pasts.map(renderEv).join("")}</ul></section>`);
      if (rets.length) sections.push(`<section><h2>Retreats</h2><ul>${rets.map(renderRe).join("")}</ul></section>`);
      if (!sections.length) sections.push(`<section><h2>No approved events or retreats yet</h2><p>Nothing has been approved for this timeline yet. Submissions are reviewed before publication.</p></section>`);
      recentList = sections.join("\n") + `\n<p><em>Scholarly reference only. Inclusion does not constitute endorsement.</em></p>`;
      const listItems = [
        ...ups.map((r, i) => ({ "@type": "Event", position: i + 1, name: String(r.title || ""), startDate: r.event_date || undefined, location: r.location || undefined, url: `${SITE}/events/${r.id}` })),
        ...pasts.map((r, i) => ({ "@type": "Event", position: ups.length + i + 1, name: String(r.title || ""), startDate: r.event_date || undefined, location: r.location || undefined, url: `${SITE}/events/${r.id}` })),
        ...rets.map((r, i) => ({ "@type": "LodgingBusiness", position: ups.length + pasts.length + i + 1, name: String(r.name || ""), location: [r.location, r.country].filter(Boolean).join(", ") || undefined, url: `${SITE}/retreats/${r.id}` })),
      ];
      if (listItems.length) {
        extraLd.push({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "DMT Code Research Timeline",
          itemListElement: listItems,
        });
      }
    } catch { /* ignore */ }
  } else if (key === "home" && SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/articles?is_published=eq.true&select=slug,title,dek&order=published_at.desc&limit=1`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Accept: "application/json",
          },
        },
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<Record<string, unknown>>;
        const a = rows[0];
        if (a && a.slug && a.title) {
          const slug = String(a.slug);
          const title = String(a.title);
          const dek = String(a.dek || "");
          recentList = `<section><h2>Latest article</h2><p><a href="/articles/${esc(slug)}">${esc(title)}</a>. ${esc(clip(dek, 240))}</p><p><a href="/articles">Read all articles</a></p></section>`;
        }
      }
    } catch { /* ignore */ }
  } else if (page.index && SUPABASE_URL && SUPABASE_KEY) {
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
  ${page.bodyExtraHtml ?? ""}
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

  const head = buildHead({
    title: page.title,
    description: page.description,
    canonical,
    ogType: "website",
    jsonLd: [organizationLd, websiteLd, breadcrumbLd, ...extraLd],
  });

  const html = renderShell(await shellRes.text(), head, body);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
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
    "/events",
    "/events/*",
    "/retreats",
    "/retreats/*",
    "/theories",
    "/theories/*",
    "/protocols/*",
    "/articles",
    "/articles/*",
  ],
};







// ---------- Theories, Events, Retreats prerender ----------

type HeadOpts = {
  title: string;
  description?: string;
  canonical: string;
  ogType?: "website" | "article";
  ogImage?: string;
  // Width and height are emitted only when BOTH are known. Never guess them.
  ogImageWidth?: number;
  ogImageHeight?: number;
  robots?: string;
  jsonLd?: unknown[];
};

function buildHead(o: HeadOpts): string {
  const desc = (o.description || "").trim();
  const img = (o.ogImage || "").trim() || DEFAULT_OG_IMAGE;
  const dims =
    o.ogImageWidth && o.ogImageHeight
      ? [
          `<meta property="og:image:width" content="${o.ogImageWidth}" />`,
          `<meta property="og:image:height" content="${o.ogImageHeight}" />`,
        ]
      : [];
  return [
    `<title>${esc(o.title)}</title>`,
    desc ? `<meta name="description" content="${esc(desc)}" />` : "",
    `<link rel="canonical" href="${esc(o.canonical)}" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:type" content="${o.ogType || "website"}" />`,
    `<meta property="og:title" content="${esc(o.title)}" />`,
    desc ? `<meta property="og:description" content="${esc(desc)}" />` : "",
    `<meta property="og:url" content="${esc(o.canonical)}" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    ...dims,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(o.title)}" />`,
    desc ? `<meta name="twitter:description" content="${esc(desc)}" />` : "",
    `<meta name="twitter:image" content="${esc(img)}" />`,
    `<meta name="robots" content="${esc(o.robots || "index, follow")}" />`,
    ...(o.jsonLd || [])
      .filter(Boolean)
      .map((ld) => `<script type="application/ld+json">${jsonLd(ld)}</script>`),
  ]
    .filter(Boolean)
    .join("\n");
}

function renderShell(
  html: string,
  head: string,
  body: string,
): string {
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+property=["']og:[a-z:]+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']twitter:[a-z:]+["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']robots["'][^>]*>\s*/gi, "");
  out = out.replace(/<\/head>/i, `${head}\n</head>`);
  if (/<div id="root">\s*<\/div>/i.test(out)) {
    out = out.replace(/<div id="root">\s*<\/div>/i, `<div id="root">${body}</div>`);
  } else {
    out = out.replace(/<\/body>/i, `<noscript>${body}</noscript>\n</body>`);
  }
  return out;
}

const PRERENDER_RESP_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "public, max-age=0, must-revalidate",
  "netlify-cdn-cache-control":
    "public, s-maxage=3600, stale-while-revalidate=86400, durable",
};

async function sbGetRows(
  table: string,
  query: string,
): Promise<Array<Record<string, unknown>>> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) return [];
  return (await res.json()) as Array<Record<string, unknown>>;
}

function originLabel(origin: unknown): string {
  const s = String(origin || "").toLowerCase();
  if (s === "curated" || s === "public_record" || s === "record") {
    return "From the public record";
  }
  if (s === "community") return "Community";
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Community";
}

function paragraphsFromText(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("");
}

async function renderTheories(context: Context): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/theories`;
  const title = "Open theories: what could the DMT code be? | DMT Code";
  const metaDesc = clip(
    "Attributed explanatory theories for the reported DMT code phenomenon. Curated from the public record and moderated community submissions. Theories are not evidence.",
    160,
  );

  const rows = await sbGetRows(
    "theories",
    "is_approved=eq.true&select=id,title,summary,content,proponent,source_title,source_url,source_type,origin,tags,upvotes,created_at&order=upvotes.desc",
  );

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
      { "@type": "ListItem", position: 2, name: "Theories", item: canonical },
    ],
  };
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${canonical}#list`,
    name: "Open theories on the DMT code",
    itemListElement: rows.map((r, i) => {
      const item: Record<string, unknown> = {
        "@type": "CreativeWork",
        name: r.title,
        url: `${SITE}/theories/${theorySlug(String(r.title || ""))}`,
        text: r.summary || "",
      };
      if (r.proponent) {
        item.author = { "@type": "Person", name: String(r.proponent) };
      }
      return { "@type": "ListItem", position: i + 1, item };
    }),
    license: LICENSE,
  };

  const theoryBlocks = rows
    .map((r) => {
      const tags = Array.isArray(r.tags) ? (r.tags as string[]).filter(Boolean) : [];
      const summaryHtml = r.summary
        ? paragraphsFromText(String(r.summary))
        : "";
      const contentHtml = r.content
        ? `<section><h3>Full argument</h3>${paragraphsFromText(String(r.content))}</section>`
        : "";
      const proponentLine = r.proponent
        ? `<p><strong>Proponent:</strong> ${esc(String(r.proponent))}</p>`
        : "";
      const sourceLine = r.source_url
        ? `<p><strong>Source:</strong> <a href="${esc(String(r.source_url))}" rel="noopener">${esc(String(r.source_title || r.source_url))}</a>${r.source_type ? ` (${esc(String(r.source_type))})` : ""}</p>`
        : (r.source_title ? `<p><strong>Source:</strong> ${esc(String(r.source_title))}${r.source_type ? ` (${esc(String(r.source_type))})` : ""}</p>` : "");
      const tagBlock = tags.length
        ? `<p><strong>Tags:</strong> ${tags.map((t) => esc(t)).join(", ")}</p>`
        : "";
      return `<article>
  <h2>${esc(String(r.title || "Untitled theory"))}</h2>
  <p><em>${esc(originLabel(r.origin))}</em></p>
  ${proponentLine}
  ${summaryHtml}
  ${contentHtml}
  ${sourceLine}
  ${tagBlock}
</article>`;
    })
    .join("\n");

  const body = `<article data-prerender="theories">
  <h1>Open theories</h1>
  <section>
    <p>Theories are not evidence. They are explanations that people have offered for what could account for the reported DMT code phenomenon. Read them as candidate hypotheses to be tested, not as findings.</p>
    <p>Entries here are either curated from the public record (published, attributed positions) or submitted by the community and reviewed before appearing. Votes on this page are never seeded or fabricated; every count reflects real reader activity.</p>
  </section>
  <section>
    <h2>Theories</h2>
    ${theoryBlocks || "<p>No approved theories are currently indexed.</p>"}
  </section>
  <section>
    <h2>Related</h2>
    <ul>
      <li><a href="${SITE}/registry">Visual symbol registry</a></li>
      <li><a href="${SITE}/bibliography">Research bibliography</a></li>
      <li><a href="${SITE}/evidence-map">Evidence map</a></li>
      <li><a href="${SITE}/data.json">Machine readable corpus</a></li>
    </ul>
  </section>
</article>`;

  const head = buildHead({
    title,
    description: metaDesc,
    canonical,
    ogType: "website",
    jsonLd: [organizationLd, websiteLd, breadcrumbLd, itemListLd],
  });

  const html = renderShell(await shellRes.text(), head, body);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

async function renderEventDetail(context: Context, id: string): Promise<Response> {
  const shellRes = await context.next();
  const rows = await sbGetRows(
    "events",
    `id=eq.${id}&is_approved=is.true&select=id,title,description,details,event_date,event_type,location,organizer,url`,
  );
  const r = rows[0];
  if (!r) return shellRes;

  const canonical = `${SITE}/events/${id}`;
  const shortDesc = String(r.description || "").trim();
  const detailsText = String(r.details || r.description || "").trim();
  const title = `${String(r.title)} | DMT Code Events`;
  const metaDesc = clip(shortDesc || `${String(r.title)} listed on the DMT Code events timeline.`, 160);

  const readableDate = r.event_date
    ? new Date(String(r.event_date)).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "";

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Events", item: `${SITE}/events` },
      { "@type": "ListItem", position: 3, name: String(r.title), item: canonical },
    ],
  };
  const eventLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": canonical,
    name: r.title,
    startDate: r.event_date,
    description: shortDesc || undefined,
    url: r.url || canonical,
  };
  if (r.location) {
    eventLd.location = { "@type": "Place", name: String(r.location) };
  }
  if (r.organizer) {
    eventLd.organizer = {
      "@type": "Organization",
      name: String(r.organizer),
      ...(r.url ? { url: String(r.url) } : {}),
    };
  }

  const body = `<article data-prerender="event">
  <h1>${esc(String(r.title))}</h1>
  <p><strong>${esc(readableDate)}</strong>${r.event_type ? ` &middot; ${esc(String(r.event_type))}` : ""}</p>
  ${r.location ? `<p>Location: ${esc(String(r.location))}</p>` : ""}
  ${r.organizer ? `<p>Organizer: ${esc(String(r.organizer))}</p>` : ""}
  ${detailsText ? paragraphsFromText(detailsText) : "<p>No further details provided.</p>"}
  ${r.url ? `<p><a href="${esc(String(r.url))}" rel="noopener">Official site</a></p>` : ""}
  <p><a href="${SITE}/events">Back to the events timeline</a></p>
</article>`;

  const head = buildHead({
    title,
    description: metaDesc,
    canonical,
    ogType: "article",
    jsonLd: [organizationLd, breadcrumbLd, eventLd],
  });

  const html = renderShell(await shellRes.text(), head, body);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

async function renderRetreatDetail(context: Context, id: string): Promise<Response> {
  const shellRes = await context.next();
  const rows = await sbGetRows(
    "retreats",
    `id=eq.${id}&is_approved=is.true&select=id,name,description,details,location,country,image_url,website_url,contact_email,tags`,
  );
  const r = rows[0];
  if (!r) return shellRes;

  const canonical = `${SITE}/retreats/${id}`;
  const shortDesc = String(r.description || "").trim();
  const detailsText = String(r.details || r.description || "").trim();
  const title = `${String(r.name)} | DMT Code Retreats`;
  const metaDesc = clip(shortDesc || `${String(r.name)} listed on the DMT Code retreats index.`, 160);
  const tags = Array.isArray(r.tags) ? (r.tags as string[]).filter(Boolean) : [];
  const locationLine = [r.location, r.country].filter(Boolean).map(String).join(", ");

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Retreat centers", item: `${SITE}/retreats` },
      { "@type": "ListItem", position: 3, name: String(r.name), item: canonical },
    ],
  };
  const lodgingLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": canonical,
    name: r.name,
    description: shortDesc || undefined,
    url: r.website_url || canonical,
    address: {
      "@type": "PostalAddress",
      addressLocality: r.location ? String(r.location) : undefined,
      addressCountry: r.country ? String(r.country) : undefined,
    },
  };
  if (r.image_url) lodgingLd.image = String(r.image_url);
  if (r.contact_email) lodgingLd.email = String(r.contact_email);
  if (tags.length) lodgingLd.keywords = tags;

  const body = `<article data-prerender="retreat">
  <h1>${esc(String(r.name))}</h1>
  ${locationLine ? `<p>Location: ${esc(locationLine)}</p>` : ""}
  ${tags.length ? `<p>Tags: ${tags.map((t) => esc(t)).join(", ")}</p>` : ""}
  ${r.image_url ? `<img src="${esc(String(r.image_url))}" alt="${esc(String(r.name))} retreat center" />` : ""}
  ${detailsText ? paragraphsFromText(detailsText) : "<p>No further details provided.</p>"}
  ${r.website_url ? `<p><a href="${esc(String(r.website_url))}" rel="noopener">Visit website</a></p>` : ""}
  ${r.contact_email ? `<p>Contact: <a href="mailto:${esc(String(r.contact_email))}">${esc(String(r.contact_email))}</a></p>` : ""}
  <p><a href="${SITE}/retreats">Back to retreat centers</a></p>
</article>`;

  const head = buildHead({
    title,
    description: metaDesc,
    canonical,
    ogType: "article",
    ogImage: r.image_url ? String(r.image_url) : undefined,
    jsonLd: [organizationLd, breadcrumbLd, lodgingLd],
  });

  const html = renderShell(await shellRes.text(), head, body);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

async function renderRetreats(context: Context): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/retreats`;
  const title = "Retreat centers | DMT Code";
  const metaDesc =
    "Psychedelic retreat centers that operate openly and publish who they are and where. A listing is not an endorsement. Verify legal status and medical screening directly with each center.";

  const rows = await sbGetRows(
    "retreats",
    "is_approved=is.true&select=id,name,description,details,location,country,image_url,website_url,contact_email,tags&order=name.asc",
  );

  const para1 =
    "Centers that operate openly and publish who they are, where they operate, and under what legal framework. This list is short on purpose. Centers we could not confirm are currently operating are not shown.";
  const para2 =
    "A listing here is not an endorsement. Psychedelic retreats carry real medical and psychological risk, and the legal position varies by country and changes. Verify current legal status, medical screening practice, staff credentials and emergency procedures directly with the center before you book.";

  const blocks = rows
    .map((r) => {
      const name = String(r.name || "").trim();
      const id = String(r.id || "");
      const loc = [r.location, r.country].filter(Boolean).map(String).join(", ");
      const description = String(r.description || "").trim();
      const details = String(r.details || "").trim();
      const website = r.website_url ? String(r.website_url) : "";
      return `<article>
  <h2><a href="${SITE}/retreats/${esc(id)}">${esc(name)}</a></h2>
  ${loc ? `<p>${esc(loc)}</p>` : ""}
  ${description ? `<p>${esc(description)}</p>` : ""}
  ${details ? paragraphsFromText(details) : ""}
  ${website ? `<p><a href="${esc(website)}" rel="noopener">${esc(website)}</a></p>` : ""}
</article>`;
    })
    .join("\n");

  const body = `<article data-prerender="retreats">
  <h1>Retreat centers</h1>
  <section>
    <p>${esc(para1)}</p>
    <p>${esc(para2)}</p>
  </section>
  ${rows.length ? `<section><h2>Centers</h2>${blocks}</section>` : ""}
</article>`;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Retreat centers", item: canonical },
    ],
  };

  const jsonLdArr: unknown[] = [breadcrumbLd];
  if (rows.length) {
    const itemListLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${canonical}#list`,
      name: "Retreat centers",
      numberOfItems: rows.length,
      itemListElement: rows.map((r, i) => {
        const detailUrl = `${SITE}/retreats/${String(r.id)}`;
        const tags = Array.isArray(r.tags) ? (r.tags as string[]).filter(Boolean) : [];
        const item: Record<string, unknown> = {
          "@type": "LodgingBusiness",
          "@id": detailUrl,
          name: r.name,
          url: r.website_url || detailUrl,
          address: {
            "@type": "PostalAddress",
            ...(r.location ? { addressLocality: String(r.location) } : {}),
            ...(r.country ? { addressCountry: String(r.country) } : {}),
          },
        };
        if (r.description) item.description = String(r.description);
        if (r.image_url) item.image = String(r.image_url);
        if (r.contact_email) item.email = String(r.contact_email);
        if (tags.length) item.keywords = tags;
        return { "@type": "ListItem", position: i + 1, item };
      }),
    };
    jsonLdArr.push(itemListLd);
  }

  const head = buildHead({
    title,
    description: metaDesc,
    canonical,
    ogType: "website",
    jsonLd: jsonLdArr,
  });

  const html = renderShell(await shellRes.text(), head, body);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

// ---------- Protocol detail prerender ----------

function humanizeKey(key: string): string {
  const s = key.replace(/[_-]+/g, " ").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function renderJsonNode(node: unknown, depth: number): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string") {
    const t = node.trim();
    return t ? `<p>${esc(t)}</p>` : "";
  }
  if (typeof node === "number" || typeof node === "boolean") {
    return `<p>${esc(String(node))}</p>`;
  }
  if (Array.isArray(node)) {
    if (!node.length) return "";
    const allPrim = node.every(
      (v) => v === null || ["string", "number", "boolean"].includes(typeof v),
    );
    if (allPrim) {
      return `<ul>${node
        .map((v) => `<li>${esc(String(v ?? "")).trim()}</li>`)
        .filter((li) => li !== "<li></li>")
        .join("")}</ul>`;
    }
    return node.map((v) => renderJsonNode(v, depth)).join("");
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const entries = Object.entries(obj).filter(
      ([, v]) => v !== null && v !== undefined && !(typeof v === "string" && v.trim() === ""),
    );
    if (!entries.length) return "";
    const hTag = `h${Math.min(6, Math.max(3, depth + 2))}`;
    return entries
      .map(([k, v]) => {
        const label = humanizeKey(k);
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          return `<p><strong>${esc(label)}:</strong> ${esc(String(v))}</p>`;
        }
        return `<section><${hTag}>${esc(label)}</${hTag}>${renderJsonNode(v, depth + 1)}</section>`;
      })
      .join("");
  }
  return "";
}

async function renderProtocolDetail(context: Context, slug: string): Promise<Response> {
  const shellRes = await context.next();
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!cleanSlug) return shellRes;

  const rows = await sbGetRows(
    "protocols",
    `slug=eq.${cleanSlug}&is_published=is.true&select=slug,title,compound,status,tagline,content_jsonb,updated_at`,
  );
  const r = rows[0];
  if (!r) return shellRes;

  const canonical = `${SITE}/protocols/${cleanSlug}`;
  const title = `${String(r.title)} protocol | DMT Code`;
  const tagline = String(r.tagline || "").trim();
  const metaDesc = clip(
    tagline || `${String(r.title)} protocol documentation indexed by DMT Code. Reference material, not medical advice.`,
    160,
  );

  const contentHtml = r.content_jsonb ? renderJsonNode(r.content_jsonb, 0) : "";

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Protocols", item: `${SITE}/protocols` },
      { "@type": "ListItem", position: 3, name: String(r.title), item: canonical },
    ],
  };
  const medicalLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "@id": canonical,
    name: String(r.title),
    url: canonical,
    description: metaDesc,
    about: r.compound ? { "@type": "Drug", name: String(r.compound) } : undefined,
    dateModified: r.updated_at ? String(r.updated_at) : undefined,
    inLanguage: "en",
    isPartOf: { "@id": `${SITE}#website` },
    publisher: { "@id": `${SITE}#org` },
    license: LICENSE,
  };

  const body = `<article data-prerender="protocol">
  <h1>${esc(String(r.title))} protocol</h1>
  ${r.compound ? `<p><strong>Compound:</strong> ${esc(String(r.compound))}</p>` : ""}
  ${r.status ? `<p><strong>Status:</strong> ${esc(String(r.status))}</p>` : ""}
  ${tagline ? `<p>${esc(tagline)}</p>` : ""}
  ${contentHtml || "<p>Protocol documentation is being prepared.</p>"}
  <p><em>Reference material only. Nothing on this page is medical advice or a personal recommendation.</em></p>
  <p><a href="${SITE}/protocols">Back to the protocol catalogue</a></p>
</article>`;

  const head = buildHead({
    title,
    description: metaDesc,
    canonical,
    ogType: "article",
    jsonLd: [organizationLd, breadcrumbLd, medicalLd],
  });

  const html = renderShell(await shellRes.text(), head, body);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

// This function is duplicated verbatim in src/lib/theorySlug.ts
// and netlify/edge-functions/sitemap.ts. Netlify edge functions run in Deno and cannot
// import from src/. If you change this, change all three copies or theory URLs will
// silently diverge between the app, the prerender layer and the sitemap.
function theorySlug(title: string): string {
  return String(title || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2018\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

async function renderTheoryDetail(context: Context, rawSlug: string): Promise<Response> {
  const shellRes = await context.next();
  const slug = String(rawSlug || "").toLowerCase();

  const rows = await sbGetRows(
    "theories",
    "is_approved=eq.true&select=id,title,summary,content,proponent,source_title,source_url,source_type,origin,tags,upvotes,created_at,updated_at",
  );

  let match: Record<string, unknown> | null = null;
  const bySlug = rows.filter((r) => theorySlug(String(r.title || "")) === slug);
  if (bySlug.length === 1) {
    match = bySlug[0];
  } else if (bySlug.length > 1) {
    const sorted = [...bySlug].sort((a, b) => {
      const at = a.created_at ? Date.parse(String(a.created_at)) : 0;
      const bt = b.created_at ? Date.parse(String(b.created_at)) : 0;
      return at - bt;
    });
    match = sorted[0];
  } else {
    match = rows.find((r) => String(r.id) === slug) ?? null;
  }

  if (!match) {
    const notFoundHead = buildHead({
      title: "Theory not found | DMT Code",
      canonical: `${SITE}/theories`,
      robots: "noindex",
    });
    const notFoundBody = `<article data-prerender="theory-not-found">
  <h1>Theory not found</h1>
  <p>This theory is not currently indexed or the link is out of date.</p>
  <p><a href="${SITE}/theories">Back to Open theories</a></p>
</article>`;
    const html404 = renderShell(await shellRes.text(), notFoundHead, notFoundBody);
    return new Response(html404, { status: 404, headers: PRERENDER_RESP_HEADERS });
  }

  const canonicalSlug = theorySlug(String(match.title || ""));
  const canonical = `${SITE}/theories/${canonicalSlug}`;
  const title = `${String(match.title)} | DMT Code`;
  const metaDesc = match.summary ? clip(String(match.summary), 160) : "";
  const tags = Array.isArray(match.tags) ? (match.tags as string[]).filter(Boolean) : [];

  const summaryHtml = match.summary ? paragraphsFromText(String(match.summary)) : "";
  const contentHtml = match.content ? paragraphsFromText(String(match.content)) : "";
  const proponentLine = match.proponent
    ? `<p><strong>Proposed by:</strong> ${esc(String(match.proponent))}</p>`
    : "";
  const originLine = match.origin
    ? `<p><em>${esc(originLabel(match.origin))}</em></p>`
    : "";
  const sourceLine = match.source_url
    ? `<p><strong>Source:</strong> <a href="${esc(String(match.source_url))}" rel="noopener">${esc(String(match.source_title || match.source_url))}</a>${match.source_type ? ` (${esc(String(match.source_type))})` : ""}</p>`
    : (match.source_title ? `<p><strong>Source:</strong> ${esc(String(match.source_title))}${match.source_type ? ` (${esc(String(match.source_type))})` : ""}</p>` : "");
  const tagBlock = tags.length
    ? `<p><strong>Tags:</strong> ${tags.map((t) => esc(t)).join(", ")}</p>`
    : "";
  const agreeLine = (typeof match.upvotes === "number" && match.upvotes > 0)
    ? `<p><strong>Agree:</strong> ${match.upvotes}</p>`
    : "";

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Open theories", item: `${SITE}/theories` },
      { "@type": "ListItem", position: 3, name: String(match.title), item: canonical },
    ],
  };
  const creativeWorkLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": canonical,
    url: canonical,
    name: String(match.title),
    license: LICENSE,
  };
  if (match.summary) creativeWorkLd.abstract = String(match.summary);
  if (match.content) creativeWorkLd.text = String(match.content);
  if (match.proponent) creativeWorkLd.author = { "@type": "Person", name: String(match.proponent) };
  if (match.source_url) creativeWorkLd.isBasedOn = String(match.source_url);
  if (tags.length > 0) creativeWorkLd.keywords = tags.join(", ");

  const body = `<article data-prerender="theory">
  <nav><a href="${SITE}/theories">Open theories</a></nav>
  <h1>${esc(String(match.title))}</h1>
  ${originLine}
  ${proponentLine}
  ${agreeLine}
  ${summaryHtml}
  ${contentHtml}
  ${sourceLine}
  ${tagBlock}
  <p><a href="${SITE}/theories">Back to all theories</a></p>
</article>`;

  const head = buildHead({
    title,
    description: metaDesc,
    canonical,
    ogType: "article",
    jsonLd: [organizationLd, breadcrumbLd, creativeWorkLd],
  });

  const html = renderShell(await shellRes.text(), head, body);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

// ---------- Articles prerender ----------

// Minimal, safe markdown to HTML converter for prerendered article bodies.
// Every user-authored character is HTML-escaped first, so no raw HTML from the
// source can survive. Then a small set of block and inline patterns is turned
// back into tags. Supported: h2, h3, paragraphs, bold, italic, links,
// unordered lists, ordered lists, blockquotes, inline code, fenced code.
// Never emits a second <h1> because articles always render their title as h1.
function mdToHtml(src: string): string {
  const esc0 = (s: string) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  // Extract fenced code blocks first so their contents are not processed.
  const codeBlocks: string[] = [];
  let text = src.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, (_m, code: string) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre><code>${esc0(code.replace(/\n$/, ""))}</code></pre>`);
    return `\u0000CODE${idx}\u0000`;
  });

  text = esc0(text);

  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let inUL = false;
  let inOL = false;
  let inBQ = false;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };
  const closeUL = () => { if (inUL) { out.push("</ul>"); inUL = false; } };
  const closeOL = () => { if (inOL) { out.push("</ol>"); inOL = false; } };
  const closeBQ = () => { if (inBQ) { out.push("</blockquote>"); inBQ = false; } };

  function inline(s: string): string {
    let t = s;
    // Inline code first so its content is not further transformed.
    const codes: string[] = [];
    t = t.replace(/`([^`\n]+)`/g, (_m, c: string) => {
      const i = codes.length;
      codes.push(`<code>${c}</code>`);
      return `\u0001C${i}\u0001`;
    });
    // Links: [text](url). Only allow safe schemes: http, https, mailto, site-relative (/), anchors (#).
    // Anything else renders as plain label text with no anchor.
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
      const trimmed = href.trim();
      const safeHref = /^(https?:\/\/|mailto:|\/[^/]|\/$|#)/i.test(trimmed) || trimmed === "/";
      if (!safeHref) return label;
      const safe = trimmed.replace(/"/g, "&quot;");
      return `<a href="${safe}" rel="noopener">${label}</a>`;
    });
    t = t.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    t = t.replace(/\u0001C(\d+)\u0001/g, (_m, i: string) => codes[Number(i)]);
    return t;
  }

  for (const raw of lines) {
    const line = raw;

    // Restore fenced blocks placeholder as its own block.
    const fencedMatch = line.match(/^\u0000CODE(\d+)\u0000$/);
    if (fencedMatch) {
      flushPara(); closeUL(); closeOL(); closeBQ();
      out.push(codeBlocks[Number(fencedMatch[1])]);
      continue;
    }

    if (/^\s*$/.test(line)) {
      flushPara(); closeUL(); closeOL(); closeBQ();
      continue;
    }

    const h3 = line.match(/^###\s+(.*)$/);
    const h2 = line.match(/^##\s+(.*)$/);
    // A single # is downgraded to h2 to guarantee only one h1 per page.
    const h1down = line.match(/^#\s+(.*)$/);
    if (h3) { flushPara(); closeUL(); closeOL(); closeBQ(); out.push(`<h3>${inline(h3[1])}</h3>`); continue; }
    if (h2) { flushPara(); closeUL(); closeOL(); closeBQ(); out.push(`<h2>${inline(h2[1])}</h2>`); continue; }
    if (h1down) { flushPara(); closeUL(); closeOL(); closeBQ(); out.push(`<h2>${inline(h1down[1])}</h2>`); continue; }

    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    const bq = line.match(/^&gt;\s?(.*)$/);

    if (ul) {
      flushPara(); closeOL(); closeBQ();
      if (!inUL) { out.push("<ul>"); inUL = true; }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    if (ol) {
      flushPara(); closeUL(); closeBQ();
      if (!inOL) { out.push("<ol>"); inOL = true; }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    if (bq) {
      flushPara(); closeUL(); closeOL();
      if (!inBQ) { out.push("<blockquote>"); inBQ = true; }
      out.push(`<p>${inline(bq[1])}</p>`);
      continue;
    }

    closeUL(); closeOL(); closeBQ();
    para.push(line.trim());
  }
  flushPara(); closeUL(); closeOL(); closeBQ();

  return out.join("\n");
}

// Strip markdown to plain text for the JSON-LD articleBody field.
function mdToPlain(src: string): string {
  return String(src || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchInList(
  table: string,
  ids: string[],
  filter: string,
  select: string,
  key: "id" | "slug" = "id",
): Promise<Array<Record<string, unknown>>> {
  if (!ids || !ids.length) return [];
  const inList = ids.filter(Boolean).map((x) => `"${x}"`).join(",");
  if (!inList) return [];
  return await sbGetRows(
    table,
    `${key}=in.(${inList})&${filter}&select=${select}`,
  );
}

async function renderArticlesIndex(context: Context): Promise<Response> {
  const shellRes = await context.next();
  const canonical = `${SITE}/articles`;
  const title = "Articles | DMT Code";
  const metaDesc = clip(
    "Long form articles that answer specific questions using the DMT Code corpus. Every article names the trials, papers, symbols, and protocols it is built on.",
    160,
  );

  const rows = await sbGetRows(
    "articles",
    "is_published=eq.true&select=id,slug,title,dek,published_at,updated_at&order=published_at.desc",
  );

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Articles", item: canonical },
    ],
  };
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${canonical}#list`,
    name: "DMT Code Articles",
    numberOfItems: rows.length,
    itemListElement: rows.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "BlogPosting",
        url: `${SITE}/articles/${String(r.slug || "")}`,
        headline: String(r.title || ""),
        description: String(r.dek || ""),
        datePublished: r.published_at,
      },
    })),
    license: LICENSE,
  };

  const items = rows
    .map((r) => {
      const slug = String(r.slug || "");
      return `<li><a href="/articles/${esc(slug)}"><strong>${esc(String(r.title || ""))}</strong></a>${r.dek ? ` <span>${esc(String(r.dek))}</span>` : ""}</li>`;
    })
    .join("");

  const body = `<article data-prerender="articles-index">
  <h1>Articles</h1>
  <section>
    <p>Answer shaped articles built on named evidence in the DMT Code corpus. Each piece links every trial, paper, symbol, and protocol it rests on, so readers and language models can verify the source directly. Every article is published under CC-BY-4.0.</p>
  </section>
  <section>
    <h2>All articles</h2>
    ${items ? `<ul>${items}</ul>` : "<p>No articles have been published yet.</p>"}
  </section>
  <section>
    <h2>Machine access</h2>
    <ul>
      <li><a href="/articles.json">Full corpus JSON (CC-BY-4.0)</a></li>
      <li><a href="/articles/feed.xml">RSS feed</a></li>
    </ul>
  </section>
</article>`;

  const head = buildHead({
    title,
    description: metaDesc,
    canonical,
    ogType: "website",
    ogImage: DEFAULT_OG_IMAGE,
    jsonLd: [organizationLd, breadcrumbLd, itemListLd],
  });

  const html = renderShell(await shellRes.text(), head, body);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}

async function renderArticleDetail(context: Context, rawSlug: string): Promise<Response> {
  const shellRes = await context.next();
  const slug = String(rawSlug || "").toLowerCase();
  const rows = await sbGetRows(
    "articles",
    `slug=eq.${encodeURIComponent(slug)}&is_published=eq.true` +
      `&select=id,slug,title,dek,body_md,topic_tags,compounds,` +
      `related_trials,related_bibliography,related_symbols,related_protocols,` +
      `author,published_at,updated_at`,
  );
  const r = rows[0];
  if (!r) return shellRes;

  const canonical = `${SITE}/articles/${String(r.slug)}`;
  const title = `${String(r.title)} | DMT Code`;
  const dek = String(r.dek || "");
  const metaDesc = clip(dek, 160);

  const published = r.published_at ? new Date(String(r.published_at)) : null;
  const updated = r.updated_at ? new Date(String(r.updated_at)) : null;
  const showUpdated =
    published && updated && (updated.getTime() - published.getTime()) > 86400000;
  const pubReadable = published
    ? published.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";
  const updReadable = updated
    ? updated.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  // Resolve related records for the "based on" block and citation JSON-LD.
  const trialIds = ((r.related_trials as string[]) || []).filter(Boolean);
  const bibIds = ((r.related_bibliography as string[]) || []).filter(Boolean);
  const symIds = ((r.related_symbols as string[]) || []).filter(Boolean);
  const protoSlugs = ((r.related_protocols as string[]) || []).filter(Boolean);

  const [trialRows, bibRows, symRows, protoRows] = await Promise.all([
    fetchInList("clinical_trials", trialIds, "is_approved=is.true", "id,title"),
    fetchInList("bibliography", bibIds, "is_approved=eq.true", "id,title,doi"),
    fetchInList("symbol_submissions", symIds, "status=eq.approved", "id"),
    fetchInList("protocols", protoSlugs, "is_published=eq.true", "slug,title", "slug"),
  ]);

  const basedParts: string[] = [];
  if (trialRows.length) {
    basedParts.push(
      `<li><strong>Clinical trials:</strong><ul>${trialRows
        .map((t) => `<li><a href="/trials/${esc(String(t.id))}">${esc(String(t.title || ""))}</a></li>`)
        .join("")}</ul></li>`,
    );
  }
  if (bibRows.length) {
    basedParts.push(
      `<li><strong>Bibliography:</strong><ul>${bibRows
        .map((b) => `<li><a href="/bibliography/${esc(String(b.id))}">${esc(String(b.title || ""))}</a></li>`)
        .join("")}</ul></li>`,
    );
  }
  if (symRows.length) {
    basedParts.push(
      `<li><strong>Symbols:</strong><ul>${symRows
        .map((s) => {
          const id = String(s.id);
          return `<li><a href="/registry/${esc(id)}">Symbol ${esc(id.slice(0, 8))}</a></li>`;
        })
        .join("")}</ul></li>`,
    );
  }
  if (protoRows.length) {
    basedParts.push(
      `<li><strong>Protocols:</strong><ul>${protoRows
        .map((p) => `<li><a href="/protocols/${esc(String(p.slug))}">${esc(String(p.name || p.slug))}</a></li>`)
        .join("")}</ul></li>`,
    );
  }
  const basedOn = basedParts.length
    ? `<section><h2>What this is based on</h2><ul>${basedParts.join("")}</ul></section>`
    : "";

  const bodyHtml = mdToHtml(String(r.body_md || ""));
  const plainBody = mdToPlain(String(r.body_md || ""));

  const bylineBits: string[] = [];
  if (r.author) bylineBits.push(`By ${esc(String(r.author))}`);
  if (pubReadable) bylineBits.push(`Published ${esc(pubReadable)}`);
  if (showUpdated && updReadable) bylineBits.push(`Updated ${esc(updReadable)}`);
  const byline = bylineBits.length ? `<p><em>${bylineBits.join(" &middot; ")}</em></p>` : "";

  const body = `<article data-prerender="article">
  <h1>${esc(String(r.title))}</h1>
  ${dek ? `<p><strong>${esc(dek)}</strong></p>` : ""}
  ${byline}
  <div>${bodyHtml}</div>
  ${basedOn}
  <p><a href="/articles">Back to articles</a></p>
</article>`;

  const tags = [
    ...((r.topic_tags as string[]) || []),
    ...((r.compounds as string[]) || []),
  ].filter(Boolean);

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}#org`,
    name: "DMT Code",
    url: SITE,
    logo: `${SITE}/favicon.svg`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Articles", item: `${SITE}/articles` },
      { "@type": "ListItem", position: 3, name: String(r.title), item: canonical },
    ],
  };

  const citation: Array<Record<string, unknown>> = [];
  for (const t of trialRows) {
    citation.push({
      "@type": "MedicalStudy",
      name: String(t.title || ""),
      url: `${SITE}/trials/${String(t.id)}`,
    });
  }
  for (const b of bibRows) {
    const node: Record<string, unknown> = {
      "@type": "ScholarlyArticle",
      name: String(b.title || ""),
      url: `${SITE}/bibliography/${String(b.id)}`,
    };
    if (b.doi) {
      node.identifier = String(b.doi).startsWith("http")
        ? String(b.doi)
        : `https://doi.org/${String(b.doi)}`;
    }
    citation.push(node);
  }
  for (const s of symRows) {
    const id = String(s.id);
    citation.push({
      "@type": "CreativeWork",
      name: `Symbol ${id.slice(0, 8)}`,
      url: `${SITE}/registry/${id}`,
    });
  }
  for (const p of protoRows) {
    citation.push({
      "@type": "CreativeWork",
      name: String(p.name || p.slug),
      url: `${SITE}/protocols/${String(p.slug)}`,
    });
  }

  const blogPostingLd: Record<string, unknown> = {
    "@type": "BlogPosting",
    "@id": canonical,
    headline: String(r.title),
    description: dek,
    articleBody: plainBody,
    datePublished: r.published_at,
    dateModified: r.updated_at,
    author:
      r.author && String(r.author).trim() && String(r.author).trim() !== "DMT Code Project"
        ? { "@type": "Person", name: String(r.author) }
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
  if (citation.length) blogPostingLd.citation = citation;

  const blogLd = {
    "@type": "Blog",
    "@id": `${SITE}/articles#blog`,
    name: "DMT Code Articles",
    url: `${SITE}/articles`,
    publisher: { "@id": `${SITE}#org` },
  };

  const graphLd = {
    "@context": "https://schema.org",
    "@graph": [organizationLd, blogLd, blogPostingLd, breadcrumbLd],
  };

  const head = buildHead({
    title,
    description: metaDesc,
    canonical,
    ogType: "article",
    ogImage: DEFAULT_OG_IMAGE,
    jsonLd: [graphLd],
  });

  const html = renderShell(await shellRes.text(), head, body);
  return new Response(html, { status: 200, headers: PRERENDER_RESP_HEADERS });
}
