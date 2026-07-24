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

export default async (request: Request, context: Context) => {
  try {
    const ua = request.headers.get("user-agent") || "";
    if (!ua) return context.next();

    const url = new URL(request.url);
    const path = url.pathname;
    if (ASSET_EXT.test(path)) return context.next();

    const hit = detect(ua);
    if (!hit) return context.next();

    const referer = request.headers.get("referer");
    const body = JSON.stringify({
      path,
      bot_name: hit.name,
      bot_class: hit.klass,
      user_agent: ua.slice(0, 300),
      referer: referer ? referer.slice(0, 500) : null,
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
    }).catch(() => {});

    // Non-blocking: hand off to the runtime if available.
    const ctx = context as unknown as { waitUntil?: (p: Promise<unknown>) => void };
    if (typeof ctx.waitUntil === "function") {
      ctx.waitUntil(insert as Promise<unknown>);
    }
  } catch {
    // fail-open
  }
  return context.next();
};

export const config: Config = { path: "/*" };
