// SCRAPE_FESTIVALS_V2 — dmtcode.com festival watchlist scraper
// Polls curated festival sources weekly, extracts upcoming edition dates
// (JSON-LD Event first, text regex fallback, then a headless-render fallback
// through the Jina Reader proxy for JS-built SPA sites). Inserts NEW editions
// into events with is_approved=false for moderation. Never writes approved rows.
import { createClient } from "npm:@supabase/supabase-js@2";

const MONTH_MAP: Record<string, number> = {
  january:1, february:2, march:3, april:4, may:5, june:6, july:7, august:8, september:9, october:10, november:11, december:12,
  jan:1, feb:2, mar:3, apr:4, jun:6, jul:7, aug:8, sep:9, sept:9, oct:10, nov:11, dec:12,
  janvier:1, "février":2, fevrier:2, mars:3, avril:4, mai:5, juin:6, juillet:7, "août":8, aout:8, septembre:9, octobre:10, novembre:11, "décembre":12, decembre:12,
  januar:1, februar:2, "märz":3, maerz:3, juni:6, juli:7, oktober:10, dezember:12,
  janeiro:1, fevereiro:2, "março":3, marco:3, abril:4, maio:5, junho:6, julho:7, agosto:8, setembro:9, outubro:10, novembro:11, dezembro:12,
  enero:1, febrero:2, marzo:3, mayo:5, junio:6, julio:7, septiembre:9, octubre:10, noviembre:11, diciembre:12,
};
const MONTH_RE = "(" + Object.keys(MONTH_MAP).sort((a, b) => b.length - a.length).join("|") + ")";
const DASH = "(?:[-\\u2010-\\u2015\\u2022\\u00b7/]{1,3}|to|until|through|thru|au|bis|até|ate|hasta|al|a)";
const ORD = "(?:st|nd|rd|th)?";
const WD = "(?:\\s*(?:mon|tues?|wednes|thurs?|fri|satur|sun)day,?)?";
const DE = "(?:de\\s+|of\\s+)?";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Upgrade-Insecure-Requests": "1",
};

function m(name: string): number {
  const k = name.toLowerCase().replace(/\.$/, "");
  return MONTH_MAP[k] ?? 0;
}
function iso(y: number, mo: number, d: number): string | null {
  if (!y || !mo || !d || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

interface JsonLdExtras {
  image_url: string | null;
  event_status: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  ticket_price: number | null;
  ticket_currency: string | null;
  ticket_url: string | null;
  ticket_availability: string | null;
  lineup: string[] | null;
}

interface Found { start: string; end: string; confidence: string; extras?: JsonLdExtras | null; }

const stripSchema = (v: unknown): string | null => {
  if (typeof v !== "string" || !v.trim()) return null;
  return v.replace(/^https?:\/\/schema\.org\//i, "").trim() || null;
};
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const first = (v: unknown): any => (Array.isArray(v) ? v[0] : v);

const STATUS_MAP: Record<string, string> = {
  eventscheduled: "scheduled",
  eventcancelled: "cancelled",
  eventpostponed: "postponed",
  eventmovedonline: "moved_online",
};

function plausible(f: Found): boolean {
  const now = Date.now();
  const s = Date.parse(f.start), e = Date.parse(f.end);
  if (isNaN(s) || isNaN(e)) return false;
  if (e < s) return false;
  if (e - s > 22 * 86400000) return false;        // festivals don't run > ~3 weeks
  if (s < now - 45 * 86400000) return false;      // ignore past editions
  if (s > now + 3 * 365 * 86400000) return false; // ignore implausibly distant dates
  return true;
}

function fromJsonLd(html: string): Found | null {
  const scripts = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  const nodes: any[] = [];
  for (const sm of scripts) {
    try {
      const parsed = JSON.parse(sm[1].trim());
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const p of arr) { nodes.push(p); if (p && p["@graph"]) nodes.push(...p["@graph"]); }
    } catch { /* tolerate malformed blocks */ }
  }
  const cands: Found[] = [];
  // Key lookup is case-insensitive: musicfestivalwizard.com emits lowercase startdate/enddate.
  const pick = (n: any, key: string): unknown => {
    if (!n || typeof n !== "object") return undefined;
    const k = Object.keys(n).find((x) => x.toLowerCase() === key.toLowerCase());
    return k ? n[k] : undefined;
  };
  const extrasOf = (n: any): JsonLdExtras => {
    let image_url: string | null = null;
    try {
      const img = first(pick(n, "image"));
      if (typeof img === "string") image_url = img || null;
      else if (img && typeof img === "object") image_url = (pick(img, "url") as string) ?? null;
    } catch { /* null-safe */ }

    let event_status: string | null = null;
    try {
      const s = stripSchema(pick(n, "eventStatus"));
      event_status = s ? (STATUS_MAP[s.toLowerCase()] ?? null) : null;
    } catch { /* null-safe */ }

    let geo_lat: number | null = null, geo_lng: number | null = null;
    try {
      const loc = first(pick(n, "location"));
      const geo = loc && typeof loc === "object" ? first(pick(loc, "geo")) : null;
      if (geo && typeof geo === "object") {
        geo_lat = num(pick(geo, "latitude"));
        geo_lng = num(pick(geo, "longitude"));
      }
    } catch { /* null-safe */ }

    let ticket_price: number | null = null, ticket_currency: string | null = null;
    let ticket_url: string | null = null, ticket_availability: string | null = null;
    try {
      const off = first(pick(n, "offers"));
      if (off && typeof off === "object") {
        ticket_price = num(pick(off, "price"));
        const cur = pick(off, "priceCurrency");
        ticket_currency = typeof cur === "string" && cur ? cur : null;
        const u = pick(off, "url");
        ticket_url = typeof u === "string" && u ? u : null;
        ticket_availability = stripSchema(pick(off, "availability"));
      }
    } catch { /* null-safe */ }

    let lineup: string[] | null = null;
    try {
      const p = pick(n, "performer");
      const arr = p === undefined || p === null ? [] : (Array.isArray(p) ? p : [p]);
      const names = arr
        .map((x: any) => (typeof x === "string" ? x : (x && typeof x === "object" ? (pick(x, "name") as string) : null)))
        .filter((x: any) => typeof x === "string" && x.trim().length > 0);
      lineup = names.length ? names : null;
    } catch { /* null-safe */ }

    return { image_url, event_status, geo_lat, geo_lng, ticket_price, ticket_currency, ticket_url, ticket_availability, lineup };
  };

  for (const n of nodes) {
    const t = ([] as unknown[]).concat((pick(n, "@type") as unknown) ?? []).map(String);
    if (!t.some((x) => /event|festival/i.test(x))) continue;
    const startDate = pick(n, "startDate");
    const endDate = pick(n, "endDate");
    if (!startDate) continue;
    const f: Found = { start: String(startDate).slice(0, 10), end: String(endDate ?? startDate).slice(0, 10), confidence: "jsonld", extras: extrasOf(n) };
    if (plausible(f)) cands.push(f);
  }
  cands.sort((a, b) => a.start.localeCompare(b.start));
  return cands[0] ?? null;
}

function fromText(input: string): Found | null {
  const text = input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&ndash;|&mdash;|&#8211;|&#8212;/g, " ")
    .replace(/\s+/g, " ");
  const cands: Found[] = [];
  // "3 - 9 August 2026" / "27 au 30 août 2026" (day-first, same month)
  for (const x of text.matchAll(new RegExp(`(\\d{1,2})${ORD}\\s*${DASH}${WD}\\s*(\\d{1,2})${ORD}\\s+${DE}${MONTH_RE}\\.?\\s+(\\d{4})`, "gi"))) {
    const s = iso(+x[4], m(x[3]), +x[1]), e = iso(+x[4], m(x[3]), +x[2]);
    if (s && e) cands.push({ start: s, end: e, confidence: "regex" });
  }
  // "August 27 - 30, 2026" (month-first, same month)
  for (const x of text.matchAll(new RegExp(`${MONTH_RE}\\.?\\s+(\\d{1,2})${ORD}\\s*${DASH}${WD}\\s*(\\d{1,2})${ORD},?\\s*(\\d{4})`, "gi"))) {
    const s = iso(+x[4], m(x[1]), +x[2]), e = iso(+x[4], m(x[1]), +x[3]);
    if (s && e) cands.push({ start: s, end: e, confidence: "regex" });
  }
  // "27 December 2026 - 4 January 2027" (day-first, cross-month; first year optional)
  for (const x of text.matchAll(new RegExp(`(\\d{1,2})${ORD}\\s+${DE}${MONTH_RE}\\.?\\s*(\\d{4})?\\s*${DASH}${WD}\\s*(\\d{1,2})${ORD}\\s+${DE}${MONTH_RE}\\.?\\s+(\\d{4})`, "gi"))) {
    const y2 = +x[6]; const y1 = x[3] ? +x[3] : (m(x[2]) > m(x[5]) ? y2 - 1 : y2);
    const s = iso(y1, m(x[2]), +x[1]), e = iso(y2, m(x[5]), +x[4]);
    if (s && e) cands.push({ start: s, end: e, confidence: "regex" });
  }
  // "February 23 - March 2, 2026" (month-first, cross-month; first year optional)
  for (const x of text.matchAll(new RegExp(`${MONTH_RE}\\.?\\s+(\\d{1,2})${ORD},?\\s*(\\d{4})?\\s*${DASH}${WD}\\s*${MONTH_RE}\\.?\\s+(\\d{1,2})${ORD},?\\s*(\\d{4})`, "gi"))) {
    const y2 = +x[6]; const y1 = x[3] ? +x[3] : (m(x[1]) > m(x[4]) ? y2 - 1 : y2);
    const s = iso(y1, m(x[1]), +x[2]), e = iso(y2, m(x[4]), +x[5]);
    if (s && e) cands.push({ start: s, end: e, confidence: "regex" });
  }
  const ok = cands.filter(plausible).sort((a, b) => a.start.localeCompare(b.start));
  return ok[0] ?? null;
}

Deno.serve(async (_req) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const stats = { checked: 0, found: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 };
  const detail: { festival: string; result: string }[] = [];

  const { data: watchlist, error: wErr } = await supabase.from("festival_watchlist").select("*").eq("active", true);
  if (wErr) return new Response(JSON.stringify({ ok: false, error: wErr.message }), { status: 500, headers: { "Content-Type": "application/json" } });

  for (const w of watchlist ?? []) {
    stats.checked++;
    let result = "no_dates_found";
    let found: Found | null = null;
    let via = "direct";
    let fetchError = "";

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(w.source_url, { signal: ctrl.signal, redirect: "follow", headers: BROWSER_HEADERS });
      clearTimeout(timer);
      // 401/403/429 are bot-blocks, not real failures: fall through to the rendered path.
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      found = fromJsonLd(html) ?? fromText(html);
    } catch (e) {
      fetchError = (e as Error).message.slice(0, 100);
    }

    if (!found) {
      // Headless-render fallback for JS-built SPA sites and bot-blocked hosts, via the Jina Reader proxy.
      try {
        const ctrl2 = new AbortController();
        const timer2 = setTimeout(() => ctrl2.abort(), 25000);
        const res2 = await fetch(`https://r.jina.ai/${w.source_url}`, { signal: ctrl2.signal, redirect: "follow", headers: { Accept: "text/plain", "User-Agent": UA } });
        clearTimeout(timer2);
        if (res2.ok) {
          const body = await res2.text();
          const f2 = fromJsonLd(body) ?? fromText(body);
          if (f2) {
            found = { start: f2.start, end: f2.end, confidence: f2.confidence === "jsonld" ? "render-jsonld" : "render-regex", extras: f2.extras ?? null };
            via = "rendered";
            fetchError = "";
          }
        }
      } catch { /* rendering fallback is best-effort */ }
    }

    try {
      if (found) {
        stats.found++;
        const { data: existing } = await supabase
          .from("events")
          .select("id,title,event_date,end_date,is_approved")
          .eq("event_type", "festival")
          .ilike("title", `${w.festival_name.replace(/[%_]/g, "")}%`);
        const startMs = Date.parse(found.start);
        const match = (existing ?? []).find((e) => Math.abs(Date.parse(e.event_date) - startMs) <= 90 * 86400000);

        if (match && match.is_approved) {
          stats.skipped++;
          result = `already_approved:${match.title}|${via}`;
        } else if (match && !match.is_approved) {
          if (match.event_date !== found.start || match.end_date !== found.end) {
            await supabase.from("events").update({
              event_date: found.start,
              end_date: found.end,
              scrape_confidence: found.confidence,
              last_scraped_at: new Date().toISOString(),
            }).eq("id", match.id);
            stats.updated++;
            result = `updated_dates:${found.start}|${via}`;
          } else {
            stats.skipped++;
            result = `unchanged|${via}`;
          }
        } else {
          const y1 = found.start.slice(0, 4), y2 = found.end.slice(0, 4);
          const title = y1 === y2 ? `${w.festival_name} ${y1}` : `${w.festival_name} ${y1}/${y2.slice(2)}`;
          const { data: dupe } = await supabase.from("events").select("id").eq("title", title).maybeSingle();
          if (dupe) {
            stats.skipped++;
            result = `title_exists|${via}`;
          } else {
            const { error: iErr } = await supabase.from("events").insert({
              title,
              description: `[Auto-discovered] Upcoming edition of ${w.festival_name} detected from ${w.source_url} via ${via} fetch (confidence: ${found.confidence}). Dates require editorial verification before approval; summary to be written at review. Relevance: ${w.relevance}.`,
              event_date: found.start,
              end_date: found.end,
              event_type: "festival",
              location: w.region,
              organizer: w.festival_name,
              url: w.official_url ?? w.source_url,
              is_approved: false,
              scraped_from: w.source_url,
              scrape_confidence: found.confidence,
              last_scraped_at: new Date().toISOString(),
            });
            if (iErr) throw new Error(iErr.message);
            stats.inserted++;
            result = `inserted:${title} ${found.start}..${found.end}|${via}`;
          }
        }
      } else if (fetchError) {
        stats.errors++;
        result = `error:${fetchError}`;
      }
    } catch (e) {
      stats.errors++;
      result = `error:${(e as Error).message.slice(0, 120)}`;
    }

    await supabase.from("festival_watchlist").update({ last_checked_at: new Date().toISOString(), last_result: result }).eq("id", w.id);
    detail.push({ festival: w.festival_name, result });
  }

  await supabase.from("festival_scrape_log").insert({ ...stats, detail });
  return new Response(JSON.stringify({ ok: true, ...stats, detail }), { headers: { "Content-Type": "application/json" } });
});
