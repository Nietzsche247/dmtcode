#!/usr/bin/env node
/**
 * Drift check: WITHDRAWN_ARTICLE_SLUGS in netlify/edge-functions/content-prerender.ts
 * must match the set of articles that are archived or unpublished in Supabase.
 *
 * Why the list is hardcoded at all: content-prerender authenticates with
 * SUPABASE_ANON_KEY, and the only anon-readable policy on `articles` is
 * `is_published = true`. A withdrawn row is therefore invisible to that key at
 * request time, so the function cannot look it up. Widening RLS to expose the
 * slug would also expose body_md. Ten strings plus this check is the cheaper
 * trade.
 *
 * Effect of drift: a newly archived article answers 404 instead of 410, so
 * Googlebot keeps retrying it for months instead of dropping it.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/check-withdrawn-articles-drift.mjs
 *
 * Exits 0 when in sync, 1 when it drifts, 2 when it cannot check.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "netlify/edge-functions/content-prerender.ts";

function parseHardcoded() {
  const src = readFileSync(join(root, SOURCE), "utf8");
  const m = src.match(
    /const WITHDRAWN_ARTICLE_SLUGS = new Set<string>\(\[([\s\S]*?)\]\);/,
  );
  if (!m) {
    console.error(`Could not find WITHDRAWN_ARTICLE_SLUGS in ${SOURCE}.`);
    process.exit(2);
  }
  return new Set(
    [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1].toLowerCase()),
  );
}

async function fetchWithdrawn() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) {
    console.error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. " +
        "The anon key cannot see unpublished rows, so it cannot run this check.",
    );
    process.exit(2);
  }
  const res = await fetch(
    `${url}/rest/v1/articles?select=slug,is_published,archived_at`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) {
    console.error(`Supabase returned ${res.status}: ${await res.text()}`);
    process.exit(2);
  }
  const rows = await res.json();
  if (!rows.some((r) => r.is_published === false || r.archived_at)) {
    // A service-role read should see unpublished rows. Seeing none at all is
    // more likely a wrong key than a site with zero withdrawn articles.
    console.warn(
      "Warning: no unpublished or archived rows returned. " +
        "Confirm this is the service-role key, not the anon key.",
    );
  }
  return new Set(
    rows
      .filter((r) => r.is_published === false || r.archived_at)
      .map((r) => String(r.slug).toLowerCase()),
  );
}

const hardcoded = parseHardcoded();
const live = await fetchWithdrawn();

const missing = [...live].filter((s) => !hardcoded.has(s)).sort();
const stale = [...hardcoded].filter((s) => !live.has(s)).sort();

if (!missing.length && !stale.length) {
  console.log(
    `WITHDRAWN_ARTICLE_SLUGS in sync: ${hardcoded.size} withdrawn article(s).`,
  );
  process.exit(0);
}

console.error("WITHDRAWN_ARTICLE_SLUGS has drifted.\n");
if (missing.length) {
  console.error(
    `Withdrawn in the database but missing from the list (these answer 404 and should answer 410):`,
  );
  for (const s of missing) console.error(`  + "${s}",`);
  console.error("");
}
if (stale.length) {
  console.error(
    `In the list but published again in the database (these answer 410 and should answer 200):`,
  );
  for (const s of stale) console.error(`  - "${s}"`);
  console.error("");
}
console.error(`Update the list in ${SOURCE} and re-run.`);
process.exit(1);
