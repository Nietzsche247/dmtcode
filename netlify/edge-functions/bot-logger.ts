import type { Config, Context } from "@netlify/edge-functions";

// Fail-open AI/search crawler logger. Humans are never logged.
// Writes to public.crawler_hits via the Supabase REST endpoint using the anon key.
// Any error is swallowed; the request is never blocked or modified.

const SUPABASE_URL = "https://bbmhrgpsyiahefnxqwfg.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWhyZ3BzeWlhaGVmbnhxd2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1Njc5ODcsImV4cCI6MjA3OTE0Mzk4N30.zPuWahf5g140hdR__asVINWBvYJaxZmVvDQTvIAjLww";

type BotClass = "training" | "answer" | "search";

const BOTS: Array<{ pattern: RegExp; name: string; klass: BotClass }> = [
  // Training crawlers
  { pattern: /GPTBot/i, name: "GPTBot", klass: "training" },
  { pattern: /ClaudeBot/i, name: "ClaudeBot", klass: "training" },
  { pattern: /CCBot/i, name: "CCBot", klass: "training" },
  { pattern: /Google-Extended/i, name: "Google-Extended", klass: "training" },
  { pattern: /Applebot-Extended/i, name: "Applebot-Extended", klass: "training" },
  { pattern: /meta-externalagent/i, name: "meta-externalagent", klass: "training" },
  { pattern: /Bytespider/i, name: "Bytespider", klass: "training" },
  { pattern: /Amazonbot/i, name: "Amazonbot", klass: "training" },
  // Answer-time bots (order matters: more specific first)
  { pattern: /ChatGPT-User/i, name: "ChatGPT-User", klass: "answer" },
  { pattern: /OAI-SearchBot/i, name: "OAI-SearchBot", klass: "answer" },
  { pattern: /Claude-User/i, name: "Claude-User", klass: "answer" },
  { pattern: /Claude-SearchBot/i, name: "Claude-SearchBot", klass: "answer" },
  { pattern: /Perplexity-User/i, name: "Perplexity-User", klass: "answer" },
  { pattern: /PerplexityBot/i, name: "PerplexityBot", klass: "answer" },
  // Search crawlers
  { pattern: /Googlebot/i, name: "Googlebot", klass: "search" },
  { pattern: /Bingbot/i, name: "Bingbot", klass: "search" },
  { pattern: /DuckDuckBot/i, name: "DuckDuckBot", klass: "search" },
];

const ASSET_EXT = /\.(js|mjs|css|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|map|txt|xml|json|mp4|webm|avif)$/i;

function detect(ua: string): { name: string; klass: BotClass } | null {
  for (const b of BOTS) {
    if (b.pattern.test(ua)) return { name: b.name, klass: b.klass };
  }
  return null;
}

function clientIp(request: Request): string | null {
  const direct = request.headers.get("x-nf-client-connection-ip");
  if (direct) return direct.trim().slice(0, 100);
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first.slice(0, 100);
  }
  return null;
}

export default async (request: Request, context: Context) => {
  let ua = "";
  let path = "";
  let hit: { name: string; klass: BotClass } | null = null;

  try {
    ua = request.headers.get("user-agent") || "";
    if (!ua) return context.next();

    const url = new URL(request.url);
    path = url.pathname;
    if (ASSET_EXT.test(path)) return context.next();

    hit = detect(ua);
  } catch {
    // fail-open
  }

  // Always deliver the page. The downstream response is awaited so the logged
  // status_code is the real value the bot received, not an assumption.
  const response = await context.next();
  if (!hit) return response;

  try {
    const referer = request.headers.get("referer");
    const body = JSON.stringify({
      path,
      bot_name: hit.name,
      bot_class: hit.klass,
      user_agent: ua.slice(0, 300),
      referer: referer ? referer.slice(0, 500) : null,
      status_code: response.status,
      ip_address: clientIp(request),
      // Always false for now. Reverse-DNS verification of crawler identity is
      // deliberately NOT implemented in this build, and nothing is blocked. We
      // are collecting a week of evidence (status, IP, forged user agents)
      // first, then deciding on verification.
      verified: false,
    });

    const insert = fetch(`${SUPABASE_URL}/rest/v1/crawler_hits`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        prefer: "return=minimal",
      },
      body,
    })
      .then(async (r) => {
        if (!r.ok) {
          console.error("crawler_hits insert failed", r.status, await r.text().catch(() => ""));
        }
      })
      .catch((e) => {
        console.error("crawler_hits insert error", e);
      });

    // Non-blocking: hand off to the runtime if available.
    const ctx = context as unknown as { waitUntil?: (p: Promise<unknown>) => void };
    if (typeof ctx.waitUntil === "function") {
      ctx.waitUntil(insert as Promise<unknown>);
    }
  } catch (e) {
    // Logging must never break page delivery.
    console.error("crawler_hits logging error", e);
  }

  return response;
};

export const config: Config = { path: "/*" };
