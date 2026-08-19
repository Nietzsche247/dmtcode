import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|python|curl|wget|scrapy|lighthouse|pingdom|monitor|preview|fetch/i;

serve(async (req) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const slug = (parts[parts.length - 1] || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const fallback = "https://dmtcode.com/retreats";
  if (!slug || slug === "go") {
    return Response.redirect(fallback, 302);
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: row } = await supabase
    .from("referral_slugs")
    .select("slug,target_url,affiliate_param,active")
    .eq("slug", slug)
    .maybeSingle();
  if (!row || !row.active) {
    return Response.redirect(fallback, 302);
  }
  const ua = req.headers.get("user-agent") ?? "";
  const referrer = req.headers.get("referer") ?? "";
  const isBot = BOT_RE.test(ua);
  // Log is best-effort; never block the redirect
  try {
    await supabase.from("referral_clicks").insert({
      slug: row.slug,
      user_agent: ua.slice(0, 500),
      referrer: referrer.slice(0, 500),
      is_bot: isBot,
    });
  } catch (_) { /* ignore */ }
  let dest = row.target_url;
  if (row.affiliate_param) {
    dest += (dest.includes("?") ? "&" : "?") + row.affiliate_param;
  }
  return new Response(null, {
    status: 302,
    headers: { Location: dest, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
});
