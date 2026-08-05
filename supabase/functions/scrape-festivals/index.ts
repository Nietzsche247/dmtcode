// SCRAPE_FESTIVALS_V1 — dmtcode.com festival watchlist scraper
// Polls curated festival sources weekly, extracts upcoming edition dates
// (JSON-LD Event first, text regex fallback), and inserts NEW editions into
// events with is_approved=false for moderation. Never writes approved rows.
import { createClient } from "npm:@supabase/supabase-js@2";

const MONTHS: Record<string, number> = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };
const MONTH_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const DASH = "(?:[-\\u2010-\\u2015\\u2022\\u00b7/]{1,3}|to|until|through|thru)";
const ORD = "(?:st|nd|rd|th)?";
const WD = "(?:\\s*(?:mon|tues?|wednes|thurs?|fri|satur|sun)day,?)?";

function m(name: string): number { return MONTHS[name.slice(0, 3).toLowerCase()]; }
function iso(y: number, mo: number, d: number): string | null {
  if (!y || !mo || !d || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

interface Found { start: string; end: string; confidence: string; }

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
  for (const n of nodes) {
    const t = ([] as unknown[]).concat(n?.["@type"] ?? []).map(String);
    if (!t.some((x) => /event|festival/i.test(x))) continue;
    if (!n.startDate) continue;
    const f = { start: String(n.startDate).slice(0, 10), end: String(n.endDate ?? n.startDate).slice(0, 10), confidence: "jsonld" };
    if (plausible(f)) cands.push(f);
  }
  cands.sort((a, b) => a.start.localeCompare(b.start));
  return cands[0] ?? null;
}

function fromText(html: string): Found | null {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&ndash;|&mdash;|&#8211;|&#8212;/g, " ")
    .replace(/\s+/g, " ");
  const cands: Found[] = [];
  // "3 - 9 August 2026" (day-first, same month)
  for (const x of text.matchAll(new RegExp(`(\\d{1,2})${ORD}\\s*${DASH}${WD}\\s*(\\d{1,2})${ORD}\\s+${MONTH_RE}\\.?\\s+(\\d{4})`, "gi"))) {
    const s = iso(+x[4], m(x[3]), +x[1]), e = iso(+x[4], m(x[3]), +x[2]);
    if (s && e) cands.push({ start: s, end: e, confidence: "regex" });
  }
  // "August 27 - 30, 2026" (month-first, same month)
  for (const x of text.matchAll(new RegExp(`${MONTH_RE}\\.?\\s+(\\d{1,2})${ORD}\\s*${DASH}${WD}\\s*(\\d{1,2})${ORD},?\\s*(\\d{4})`, "gi"))) {
    const s = iso(+x[4], m(x[1]), +x[2]), e = iso(+x[4], m(x[1]), +x[3]);
    if (s && e) cands.push({ start: s, end: e, confidence: "regex" });
  }
  // "27 December 2026 - 4 January 2027" (day-first, cross-month; first year optional)
  for (const x of text.matchAll(new RegExp(`(\\d{1,2})${ORD}\\s+${MONTH_RE}\\.?\\s*(\\d{4})?\\s*${DASH}${WD}\\s*(\\d{1,2})${ORD}\\s+${MONTH_RE}\\.?\\s+(\\d{4})`, "gi"))) {
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
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(w.source_url, {
        signal: ctrl.signal,
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; dmtcode-festival-scraper/1.0; +https://dmtcode.com)" },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const found = fromJsonLd(html) ?? fromText(html);

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
          result = `already_approved:${match.title}`;
        } else if (match && !match.is_approved) {
          if (match.event_date !== found.start || match.end_date !== found.end) {
            await supabase.from("events").update({
              event_date: found.start,
              end_date: found.end,
              scrape_confidence: found.confidence,
              last_scraped_at: new Date().toISOString(),
            }).eq("id", match.id);
            stats.updated++;
            result = `updated_dates:${found.start}`;
          } else {
            stats.skipped++;
            result = "unchanged";
          }
        } else {
          const y1 = found.start.slice(0, 4), y2 = found.end.slice(0, 4);
          const title = y1 === y2 ? `${w.festival_name} ${y1}` : `${w.festival_name} ${y1}/${y2.slice(2)}`;
          const { data: dupe } = await supabase.from("events").select("id").eq("title", title).maybeSingle();
          if (dupe) {
            stats.skipped++;
            result = "title_exists";
          } else {
            const { error: iErr } = await supabase.from("events").insert({
              title,
              description: `[Auto-discovered] Upcoming edition of ${w.festival_name} detected from ${w.source_url} (confidence: ${found.confidence}). Dates require editorial verification before approval; summary to be written at review. Relevance: ${w.relevance}.`,
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
            result = `inserted:${title} ${found.start}..${found.end}`;
          }
        }
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
