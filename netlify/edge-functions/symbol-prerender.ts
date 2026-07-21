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

interface Sym {
  id: string;
  description: string | null;
  image_url: string;
  tags: string[] | null;
  dose_level: string | null;
  wavelength: string | null;
  surface_type: string | null;
  emotional_valence: string | null;
  recurrence: string | null;
  source_method: string | null;
  duration_seconds: number | null;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
}

export default async (request: Request, context: Context) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/")[2] ?? "";
    if (!UUID_RE.test(id) || !SUPABASE_URL || !SUPABASE_KEY) {
      return context.next();
    }

    const fields =
      "id,description,image_url,tags,dose_level,wavelength,surface_type," +
      "emotional_valence,recurrence,source_method,duration_seconds," +
      "upvotes,downvotes,created_at,updated_at";
    const api =
      `${SUPABASE_URL}/rest/v1/symbol_submissions` +
      `?id=eq.${id}&status=eq.approved&select=${fields}`;

    const [apiRes, shellRes] = await Promise.all([
      fetch(api, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: "application/json",
        },
      }),
      context.next(),
    ]);

    if (!apiRes.ok) return shellRes;
    const rows = (await apiRes.json()) as Sym[];
    const sym = rows[0];
    if (!sym) return shellRes;

    const short = sym.id.slice(0, 8);
    const title = `Symbol ${short} — DMT Code Visual Registry`;
    const tagStr = (sym.tags ?? []).filter(Boolean).join(", ");
    const descBase =
      (sym.description && sym.description.trim()) ||
      `A visual symbol reported during N,N-DMT experiences${
        tagStr ? `, tagged ${tagStr}` : ""
      }. Part of the open DMT Code catalogue (CC-BY-4.0).`;
    const metaDesc = descBase.replace(/\s+/g, " ").slice(0, 160);
    const canonical = `${SITE}/registry/${sym.id}`;

    const props: Array<{ name: string; value: string }> = [];
    const add = (name: string, v: string | number | null) => {
      if (v !== null && v !== undefined && String(v).trim() !== "")
        props.push({ name, value: String(v) });
    };
    add("Dose level", sym.dose_level);
    add("Wavelength", sym.wavelength);
    add("Surface type", sym.surface_type);
    add("Emotional valence", sym.emotional_valence);
    add("Recurrence", sym.recurrence);
    add("Source method", sym.source_method);
    add("Duration (seconds)", sym.duration_seconds);

    const ld = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": canonical,
      name: `DMT Code Symbol ${short}`,
      description: descBase,
      image: sym.image_url,
      url: canonical,
      dateCreated: sym.created_at,
      dateModified: sym.updated_at,
      keywords: sym.tags ?? [],
      license: "https://creativecommons.org/licenses/by/4.0/",
      isPartOf: {
        "@type": "Dataset",
        name: "DMT Code Visual Symbol Registry",
        url: `${SITE}/registry`,
        license: "https://creativecommons.org/licenses/by/4.0/",
      },
      additionalProperty: props.map((p) => ({
        "@type": "PropertyValue",
        name: p.name,
        value: p.value,
      })),
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: sym.upvotes ?? 0,
      },
    };

    const head = [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(metaDesc)}" />`,
      `<link rel="canonical" href="${esc(canonical)}" />`,
      `<meta property="og:type" content="article" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(metaDesc)}" />`,
      `<meta property="og:url" content="${esc(canonical)}" />`,
      `<meta property="og:image" content="${esc(sym.image_url)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(metaDesc)}" />`,
      `<meta name="twitter:image" content="${esc(sym.image_url)}" />`,
      `<script type="application/ld+json">${jsonLd(ld)}</script>`,
    ].join("\n");

    const metaRows = props
      .map(
        (p) =>
          `<div><dt>${esc(p.name)}</dt><dd>${esc(p.value)}</dd></div>`
      )
      .join("");
    const tagsHtml = (sym.tags ?? [])
      .filter(Boolean)
      .map((t) => `<li>${esc(t)}</li>`)
      .join("");

    const body = `<article data-prerender="symbol">
  <h1>DMT Code Symbol ${esc(short)}</h1>
  <img src="${esc(sym.image_url)}" alt="${esc(metaDesc)}" />
  <p>${esc(descBase)}</p>
  ${metaRows ? `<dl>${metaRows}</dl>` : ""}
  ${tagsHtml ? `<section><h2>Tags</h2><ul>${tagsHtml}</ul></section>` : ""}
  <p>Community validation: ${sym.upvotes ?? 0} confirmations. Part of the
  <a href="${SITE}/registry">DMT Code Visual Symbol Registry</a>, an open dataset
  (CC-BY-4.0) of visual phenomena reported during N,N-DMT experiences.</p>
</article>`;

    let html = await shellRes.text();
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

export const config: Config = { path: "/registry/*" };
