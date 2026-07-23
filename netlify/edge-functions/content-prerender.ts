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

      title = `Symbol ${short} \u2014 DMT Code Visual Registry`;
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
          name: "DMT Code Visual Symbol Registry",
          url: `${SITE}/registry`,
          license: LICENSE,
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
              name: "DMT Clinical Trials Observatory",
              url: `${SITE}/trials`,
              license: LICENSE,
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
            { "@type": "ListItem", position: 3, name: title.split(" \u2014 ")[0] || "Symbol", item: canonical },
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

  const productLds = rows
    .filter((r) => r.kind === "kit")
    .map((r) => ({
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${canonical}#${r.slug}`,
      name: `DMT Code ${String(r.name)} Kit`,
      description: String(r.tagline ?? ""),
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
    }));

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
  path: ["/registry/*", "/trials/*", "/prepare", "/evidence-map"],
};




