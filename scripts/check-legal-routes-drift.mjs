// Asserts that the country set spa-guard accepts under /legal is exactly the
// country set netlify/lib/legal.ts has pages for.
//
// Why this exists. The two lists live in different files and are edited for
// different reasons. If the guard knows a country the data file does not, the
// path returns the empty SPA shell at HTTP 200, a soft 404. If the data file
// has a country the guard does not know, the page exists and is unreachable,
// which is worse, because nothing in the build or the logs reports it.
//
// Run: node scripts/check-legal-routes-drift.mjs
// Exit 0 on agreement, 1 on drift.

import { readFileSync } from "node:fs";

const GUARD = "netlify/edge-functions/spa-guard.ts";
const DATA = "netlify/lib/legal.ts";

function guardCountries() {
  const src = readFileSync(GUARD, "utf8");
  const i = src.indexOf("const LEGAL_COUNTRIES");
  if (i === -1) throw new Error(`no LEGAL_COUNTRIES in ${GUARD}`);
  const lb = src.indexOf("[", i);
  const rb = src.indexOf("]", lb);
  if (lb === -1 || rb === -1) throw new Error(`could not read the LEGAL_COUNTRIES literal in ${GUARD}`);
  const body = src.slice(lb + 1, rb).replace(/\/\/[^\n]*/g, "");
  return [...body.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function dataCountries() {
  const src = readFileSync(DATA, "utf8");
  const i = src.indexOf("export const LEGAL_COUNTRIES");
  if (i === -1) throw new Error(`no exported LEGAL_COUNTRIES in ${DATA}`);
  const lb = src.indexOf("{", i);
  const rb = src.indexOf("};", lb);
  if (lb === -1 || rb === -1) throw new Error(`could not read the LEGAL_COUNTRIES record in ${DATA}`);
  const body = src.slice(lb + 1, rb).replace(/\/\/[^\n]*/g, "");
  // Keys are either bare identifiers or quoted when they contain a hyphen.
  return [...body.matchAll(/(?:^|\n)\s*(?:"([^"]+)"|([A-Za-z_][\w$]*))\s*:/g)].map(
    (m) => m[1] ?? m[2],
  );
}

const guard = guardCountries();
const data = dataCountries();

const inGuardOnly = guard.filter((c) => !data.includes(c));
const inDataOnly = data.filter((c) => !guard.includes(c));

if (inGuardOnly.length || inDataOnly.length) {
  console.error("legal country drift between the guard and the page data:");
  for (const c of inGuardOnly) {
    console.error(`  ${c}: accepted by ${GUARD} but has no page in ${DATA}. This path serves the SPA shell at 200.`);
  }
  for (const c of inDataOnly) {
    console.error(`  ${c}: has a page in ${DATA} but ${GUARD} 404s it. The page is unreachable.`);
  }
  process.exit(1);
}

// A country with no sources is a country with no page worth serving.
const src = readFileSync(DATA, "utf8");
const unsourced = data.filter((c) => {
  const i = src.indexOf(`slug: "${c}"`);
  if (i === -1) return true;
  const next = src.indexOf("verified:", i);
  return next === -1 || !src.slice(i, next).includes("sources:");
});
if (unsourced.length) {
  console.error(`legal pages missing a sources block: ${unsourced.join(", ")}`);
  process.exit(1);
}

// A country frame nobody can find is a country frame nobody reads.
const sitemap = readFileSync("netlify/edge-functions/sitemap.ts", "utf8");
const unlisted = ["/legal", ...data.map((c) => `/legal/${c}`)].filter(
  (p) => !sitemap.includes(`"${p}"`),
);
if (unlisted.length) {
  console.error(`legal paths missing from the sitemap: ${unlisted.join(", ")}`);
  process.exit(1);
}

console.log(
  `legal routes OK: ${data.length} countries, guard, page data and sitemap agree, all sourced`,
);
