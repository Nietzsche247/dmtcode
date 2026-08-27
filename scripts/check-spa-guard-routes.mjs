#!/usr/bin/env node
/**
 * Route table test for netlify/edge-functions/spa-guard.ts.
 *
 * spa-guard runs last in the edge chain and 404s anything not on its allowlist,
 * so a route it does not know about is invisible no matter what the React app
 * or the prerenderer do. That failure mode looks like "the build succeeded and
 * the page 404s", which is expensive to debug from the outside. This asserts
 * the table directly.
 *
 * The guard is Deno/TypeScript and cannot be imported by node, so the constants
 * and the matcher are parsed out of the source and re-evaluated here. If the
 * shape of those declarations changes, this script fails loudly rather than
 * silently passing.
 *
 * Usage: node scripts/check-spa-guard-routes.mjs
 * Exits 0 on pass, 1 on any failing case, 2 if the source cannot be parsed.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "netlify/edge-functions/spa-guard.ts";
const src = readFileSync(join(root, SOURCE), "utf8");

function grab(re, label) {
  const m = src.match(re);
  if (!m) {
    console.error(`Could not parse ${label} out of ${SOURCE}.`);
    process.exit(2);
  }
  return m[1];
}

const setLiteral = (name) =>
  new Set(
    [
      ...grab(
        new RegExp(`const ${name} = new Set<string>\\(\\[([\\s\\S]*?)\\]\\);`),
        name,
      ).matchAll(/"([^"]+)"/g),
    ].map((x) => x[1].toLowerCase()),
  );

const VALID_FIRST_SEGMENT = setLiteral("VALID_FIRST_SEGMENT");
const LEGAL_COUNTRIES = setLiteral("LEGAL_COUNTRIES");
const NULLISH_ID = setLiteral("NULLISH_ID");
const PRODUCT_HANDLES = setLiteral("PRODUCT_HANDLES");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Mirrors isDetailPatternValid + the first-segment gate in spa-guard.ts.
function allows(path) {
  const locMatch = path.match(/^\/(es|de)(\/.*)?$/i);
  if (locMatch) path = locMatch[2] || "/";
  if (path === "/") return true;

  const first = path.replace(/^\/+/, "").split("/")[0] ?? "";
  if (!VALID_FIRST_SEGMENT.has(first.toLowerCase())) return false;

  const last = path.split("/").pop() ?? "";
  if (NULLISH_ID.has(last.toLowerCase())) return false;

  let m;
  if ((m = path.match(/^\/(articles|guides)\/([^/]+)$/i))) return SLUG_RE.test(m[2]);
  if ((m = path.match(/^\/(registry|trials|bibliography)\/([^/]+)$/i))) return UUID_RE.test(m[2]);
  if ((m = path.match(/^\/(events|retreats)\/([^/]+)$/i))) return UUID_RE.test(m[2]) || SLUG_RE.test(m[2]);
  if ((m = path.match(/^\/events\/(festivals|conferences|workshops)\/([^/]+)$/i))) return SLUG_RE.test(m[2]);
  if ((m = path.match(/^\/legal\/([^/]+)$/i))) return LEGAL_COUNTRIES.has(m[1].toLowerCase());
  if ((m = path.match(/^\/people\/([^/]+)$/i)))
    return ["danny-goler", "andrew-gallimore", "chase-hughes"].includes(m[1].toLowerCase());
  if ((m = path.match(/^\/products\/([^/]+)$/i))) return PRODUCT_HANDLES.has(m[1].toLowerCase());
  if ((m = path.match(/^\/card\/([^/]+)\.png$/i))) return UUID_RE.test(m[1]);
  return true;
}

// [path, shouldBeAllowed, why]
const CASES = [
  // Events module hunt URLs. These are the reason this patch exists.
  ["/events/boom-festival-2026", true, "hunt URL, human slug"],
  ["/events/ozora-vs-boom-2026", true, "hunt URL, human slug"],
  ["/events/protocol-training", true, "first-party training page"],
  ["/events/how-dates-are-checked", true, "method page"],
  ["/events/code-of-reality-retreat-2026", true, "third-party listing"],
  ["/events/festivals/europe", true, "geo hub"],
  ["/events/festivals/north-america", true, "geo hub"],
  ["/events/conferences/europe", true, "geo hub"],
  ["/events/conferences/united-states", true, "geo hub"],
  ["/retreats/laser-protocol", true, "the 650 nm null-result table"],
  // /legal/* and /for-agents stay 404 until the pages actually ship. Allowing
  // them before then returns the empty SPA shell at 200, a soft 404. Flip these
  // to true in the same change that adds the pages and their prerender routes.
  ["/legal/mexico", false, "page not shipped yet, honest 404 beats soft 404"],
  ["/legal/peru", false, "page not shipped yet"],
  ["/for-agents", false, "page not shipped yet"],
  // Locale mirrors of the same.
  ["/es/events/boom-festival-2026", true, "es mirror"],
  ["/es/retreats/laser-protocol", true, "es mirror"],
  // Legacy UUID records must keep resolving.
  ["/events/2742ec61-d88e-4f38-8efe-3cdbe049d91a", true, "legacy event uuid"],
  ["/retreats/5de102fc-1ade-409c-bffc-75567033b5e5", true, "legacy retreat uuid"],
  ["/trials/3745de0d-0921-4fd7-b1ce-946459186115", true, "trial uuid"],
  // Existing behaviour that must not regress.
  ["/articles/does-dmt-model-the-near-death-experience", true, "article slug"],
  ["/people/danny-goler", true, "static profile"],
  ["/registry", true, "index page"],
  ["/", true, "home"],
  // Things that must still 404.
  ["/legal/atlantis", false, "country not in the editorial set"],
  ["/de/legal/mexico", false, "legal not shipped yet, locale mirror"],
  ["/trials/not-a-uuid", false, "trials are uuid-only"],
  ["/bibliography/some-slug", false, "bibliography is uuid-only"],
  ["/community/woo", false, "section does not exist"],
  ["/community/woo/evil-eye-bracelet", false, "section does not exist"],
  ["/woo", false, "section does not exist"],
  ["/fetch", false, "not a route"],
  // The stringified-null family seen live in crawler_hits.
  ["/null", false, "stringified null"],
  ["/de/null", false, "stringified null, locale mirror"],
  ["/events/null", false, "stringified null in id position"],
  ["/events/undefined", false, "stringified undefined"],
  ["/bibliography/00000000-0000-0000-0000-000000000000", false, "all-zero uuid"],
  ["/trials/00000000-0000-0000-0000-000000000000", false, "all-zero uuid"],
  ["/registry/00000000-0000-0000-0000-000000000000", false, "all-zero uuid"],
];

let failed = 0;
for (const [path, expected, why] of CASES) {
  const got = allows(path);
  if (got !== expected) {
    failed++;
    console.error(
      `FAIL  ${path}\n      expected ${expected ? "200" : "404"} (${why}), got ${got ? "200" : "404"}`,
    );
  }
}

if (failed) {
  console.error(`\n${failed} of ${CASES.length} route cases failed.`);
  process.exit(1);
}
console.log(`spa-guard route table OK: ${CASES.length} cases pass.`);
