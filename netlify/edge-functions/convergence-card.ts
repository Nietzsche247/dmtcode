import type { Config, Context } from "@netlify/edge-functions";
import { renderConvergenceCard } from "../../src/lib/convergenceCard.ts";
import { Resvg, initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";

const SUPABASE_URL =
  Netlify.env.get("SUPABASE_URL") ?? Netlify.env.get("VITE_SUPABASE_URL") ?? "";
const SUPABASE_KEY =
  Netlify.env.get("SUPABASE_ANON_KEY") ??
  Netlify.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  "";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let wasmReady: Promise<void> | null = null;
async function ensureWasm() {
  if (!wasmReady) {
    wasmReady = (async () => {
      const wasm = await fetch(
        "https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm",
      ).then((r) => r.arrayBuffer());
      await initWasm(wasm);
    })();
  }
  return wasmReady;
}

const FONT_URLS = {
  fraunces:
    "https://fonts.gstatic.com/s/fraunces/v31/6NUh8FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnbB-gzTKgYFmMlBWk.woff2",
  hanken:
    "https://fonts.gstatic.com/s/hankengrotesk/v8/ktkm0-EoXAqOA3AiuKvNvNUnkGvUwv0FZQ.woff2",
  plexMono:
    "https://fonts.gstatic.com/s/ibmplexmono/v19/-F63fjptAgt5VM-kVkqdyU8n5igg1l9kn-s.woff2",
};

let fontBuffersPromise: Promise<Uint8Array[]> | null = null;
async function loadFontBuffers(): Promise<Uint8Array[]> {
  if (!fontBuffersPromise) {
    fontBuffersPromise = (async () => {
      const results = await Promise.all(
        Object.values(FONT_URLS).map(async (u) => {
          try {
            const r = await fetch(u);
            if (!r.ok) return null;
            return new Uint8Array(await r.arrayBuffer());
          } catch {
            return null;
          }
        }),
      );
      return results.filter((b): b is Uint8Array => b !== null);
    })();
  }
  return fontBuffersPromise;
}




async function sbGet(path: string): Promise<unknown> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  return res.json();
}

async function sbCount(path: string): Promise<number> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return 0;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  if (!res.ok) return 0;
  const cr = res.headers.get("content-range") ?? "";
  const total = cr.split("/")[1];
  return total ? parseInt(total, 10) || 0 : 0;
}

async function buildCardSvg(symbolId: string): Promise<string | null> {
  const rows = (await sbGet(
    `symbol_submissions?id=eq.${symbolId}&status=eq.approved&select=id,svg_data,vector_json,image_url,upvotes,user_id`,
  )) as Array<Record<string, unknown>> | null;
  const symbol = rows?.[0];
  if (!symbol) return null;

  const [seenIt, tags, profileRows] = await Promise.all([
    sbCount(`symbol_votes?symbol_id=eq.${symbolId}&vote_type=eq.seen_it&select=id`),
    sbGet(
      `symbol_tags?symbol_id=eq.${symbolId}&kind=eq.context&order=upvotes.desc&limit=3&select=tag_name`,
    ) as Promise<Array<Record<string, unknown>> | null>,
    sbGet(
      `profiles?id=eq.${symbol.user_id}&select=handle,display_name,avatar_url`,
    ) as Promise<Array<Record<string, unknown>> | null>,
  ]);

  const leadingTags = (tags ?? [])
    .map((t) => (t.tag_name as string) ?? "")
    .filter(Boolean);
  const profile = profileRows?.[0];
  const submitterHandle =
    (profile?.handle as string) ?? (profile?.display_name as string) ?? null;

  return renderConvergenceCard({
    symbolId,
    svgData: (symbol.svg_data as string) ?? null,
    vectorJson: symbol.vector_json ?? null,
    imageUrl: (symbol.image_url as string) ?? null,
    seenItCount: seenIt,
    upvotes: (symbol.upvotes as number) ?? 0,
    leadingTags,
    submitter: profile
      ? {
          handle: submitterHandle,
          avatarUrl: (profile.avatar_url as string) ?? null,
        }
      : null,
  });
}


export default async (request: Request, _context: Context) => {
  const url = new URL(request.url);
  const m = url.pathname.match(/^\/card\/([^/.]+)\.(svg|png)$/i);
  if (!m) return new Response("Not found", { status: 404 });
  const symbolId = m[1];
  const ext = m[2].toLowerCase();
  if (!UUID_RE.test(symbolId)) {
    return new Response("Invalid id", { status: 400 });
  }

  try {
    const svg = await buildCardSvg(symbolId);
    if (!svg) return new Response("Not found", { status: 404 });

    if (ext === "svg") {
      return new Response(svg, {
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "public, max-age=300, s-maxage=900",
        },
      });
    }

    await ensureWasm();
    const fontBuffers = await loadFontBuffers();
    const resvg = new Resvg(svg, {
      background: "#F0EADA",
      fitTo: { mode: "width", value: 1200 },
      font: {
        loadSystemFonts: false,
        fontBuffers,
        defaultFontFamily: "Hanken Grotesk",
      },
    });
    const png = resvg.render().asPng();
    return new Response(png, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=300, s-maxage=900",
      },
    });
  } catch (e) {
    return new Response(`card error: ${(e as Error).message}`, { status: 500 });
  }
};

export const config: Config = {
  path: "/card/*",
};
