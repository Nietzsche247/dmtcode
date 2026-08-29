#!/usr/bin/env node
// Fails the build when src/data/kits.ts and netlify/lib/kits.ts disagree.
// Edge functions cannot import from src/, so the catalogue is mirrored by hand.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SRC = 'src/data/kits.ts';
const MIRROR = 'netlify/lib/kits.ts';

export function extractKits(path) {
  const text = readFileSync(path, 'utf8');
  const start = text.indexOf('export const KITS');
  if (start === -1) throw new Error(`No KITS export found in ${path}`);
  const open = text.indexOf('[', start);
  const close = text.indexOf('\n];', open);
  if (open === -1 || close === -1) throw new Error(`Malformed KITS array in ${path}`);
  const literal = text.slice(open, close + 2);
  // Some files reference a const declared before the KITS array (e.g. AVAIL).
  // Include those const declarations so the isolated array literal can evaluate.
  const before = text.slice(0, start);
  const constDecls = [];
  // Strings (AVAIL) and single-line object literals (the per emitter vendor
  // ratings, e.g. `const P2_7500: Emitter = { ... };`). The TypeScript type
  // annotation is stripped so the declaration evaluates as plain JavaScript.
  const constRegex = /^const\s+\w+(?:\s*:\s*\w+)?\s*=\s*(?:['"`].*?['"`]|\{.*\});$/gm;
  let match;
  while ((match = constRegex.exec(before)) !== null) {
    constDecls.push(match[0].replace(/^const\s+(\w+)\s*:\s*\w+\s*=/, 'const $1 ='));
  }
  const body = constDecls.length > 0 ? `${constDecls.join('\n')}\nreturn ${literal};` : `return ${literal};`;
  // eslint-disable-next-line no-new-func
  return new Function(body)();
}

function diff(a, b) {
  const problems = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    const left = a[i];
    const right = b[i];
    if (!left) { problems.push(`[${i}] missing in ${SRC}`); continue; }
    if (!right) { problems.push(`[${i}] missing in ${MIRROR}`); continue; }
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    for (const key of keys) {
      if (JSON.stringify(left[key]) !== JSON.stringify(right[key])) {
        problems.push(
          `[${i}].${key}\n    ${SRC}: ${JSON.stringify(left[key])}\n    ${MIRROR}: ${JSON.stringify(right[key])}`
        );
      }
    }
  }
  return problems;
}

// On Windows `file://${process.argv[1]}` never matches import.meta.url, because
// argv[1] is a backslash path and import.meta.url is file:///C:/... . That made
// this gate a silent no-op locally while it still ran in CI on Linux.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const kits = extractKits(SRC);
  const problems = diff(kits, extractKits(MIRROR));

  if (problems.length > 0) {
    console.error(`Kit catalogue drift between ${SRC} and ${MIRROR}:\n`);
    for (const p of problems) console.error(`  ${p}`);
    console.error(`\nEdit ${SRC} first, then copy the KITS array into ${MIRROR}.`);
    process.exit(1);
  }

  const LLMS = 'public/llms.txt';
  const llms = readFileSync(LLMS, 'utf8');
  const stale = [];
  for (const kit of kits) {
    if (!llms.includes(kit.price)) stale.push(`${kit.shortName}: price ${kit.price} missing`);
    if (!llms.includes(kit.cart)) stale.push(`${kit.shortName}: cart permalink missing`);
  }

  if (stale.length > 0) {
    console.error(`${LLMS} is stale, run node scripts/sync-llms-kits.mjs\n`);
    for (const s of stale) console.error(`  ${s}`);
    process.exit(1);
  }

  console.log('Kit catalogue in sync.');
}
