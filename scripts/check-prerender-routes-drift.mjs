// Asserts that every path routed to content-prerender in netlify.toml also
// appears in that function's in-source `export const config.path` array.
//
// Why this exists. Netlify honours a function's in-source config OVER the
// netlify.toml declarations for the same function. A path listed only in
// netlify.toml is therefore inert: the function never runs, spa-guard lets the
// request through, and the empty SPA shell is served at HTTP 200, which is a
// soft 404 and strictly worse than an honest 404 because nothing reports it.
//
// Observed 2026-09-21: /for-agents was added to netlify.toml alone. The page
// returned 200 with no <h1> and no data-prerender marker for hours, while
// /es/for-agents and /de/for-agents rendered correctly, because the locale
// mirrors happen to be in the in-source array. Nothing failed. Nothing logged.
//
// Run: node scripts/check-prerender-routes-drift.mjs
// Exit 0 on agreement, 1 on drift.

import { readFileSync } from "node:fs";

const TOML = "netlify.toml";
const FN = "netlify/edge-functions/content-prerender.ts";
const FN_NAME = "content-prerender";

function tomlPathsFor(fnName) {
  const src = readFileSync(TOML, "utf8");
  const out = [];
  const blocks = src.split("[[edge_functions]]").slice(1);
  for (const b of blocks) {
    const head = b.split("[[")[0];
    const p = head.match(/^\s*path\s*=\s*"([^"]+)"/m);
    const f = head.match(/^\s*function\s*=\s*"([^"]+)"/m);
    if (p && f && f[1] === fnName) out.push(p[1]);
  }
  return out;
}

function inSourcePaths() {
  const src = readFileSync(FN, "utf8");
  const i = src.indexOf("export const config");
  if (i === -1) throw new Error(`no 'export const config' in ${FN}`);
  const open = src.indexOf("path:", i);
  const lb = src.indexOf("[", open);
  const rb = src.indexOf("]", lb);
  if (lb === -1 || rb === -1) throw new Error(`could not read config.path array in ${FN}`);
  const arr = src.slice(lb + 1, rb);
  // Strip line comments first: a commented-out path must not count as declared.
  const body = arr.replace(/\/\/[^\n]*/g, "");
  return [...body.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

const toml = tomlPathsFor(FN_NAME);
const src = new Set(inSourcePaths());

const missing = toml.filter((p) => !src.has(p));

if (missing.length) {
  console.error(
    `content-prerender route drift: ${missing.length} path(s) are declared in ${TOML} ` +
      `but absent from the in-source config in ${FN}. Netlify honours the in-source ` +
      `config, so each of these serves the empty SPA shell at 200:`,
  );
  for (const p of missing) console.error(`  ${p}`);
  process.exit(1);
}

console.log(`content-prerender routes OK: ${toml.length} toml paths all present in-source`);
