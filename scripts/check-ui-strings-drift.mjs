#!/usr/bin/env node
// Fails the build when netlify/lib/ui-strings.ts and src/i18n/ui-strings.ts
// disagree. Edge functions cannot import from src/, so the index-page copy
// dictionary is mirrored by hand. Same approach as check-kits-drift.mjs.

import { readFileSync } from 'node:fs';

const SRC = 'netlify/lib/ui-strings.ts';
const MIRROR = 'src/i18n/ui-strings.ts';

function extractStrings(path) {
  const text = readFileSync(path, 'utf8');
  const start = text.indexOf('export const UI_STRINGS');
  if (start === -1) throw new Error(`No UI_STRINGS export found in ${path}`);
  const open = text.indexOf('{', text.indexOf('=', start));
  const close = text.indexOf('\n};', open);
  if (open === -1 || close === -1) throw new Error(`Malformed UI_STRINGS object in ${path}`);
  const literal = text.slice(open, close + 2);
  // eslint-disable-next-line no-new-func
  return new Function(`return ${literal}`)();
}

function diff(a, b) {
  const problems = [];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!(key in a)) { problems.push(`${key}: missing in ${SRC}`); continue; }
    if (!(key in b)) { problems.push(`${key}: missing in ${MIRROR}`); continue; }
    for (const loc of ['en', 'es', 'de']) {
      const left = a[key][loc];
      const right = b[key][loc];
      if (JSON.stringify(left) !== JSON.stringify(right)) {
        problems.push(
          `${key}.${loc}\n    ${SRC}: ${JSON.stringify(left)}\n    ${MIRROR}: ${JSON.stringify(right)}`
        );
      }
    }
  }
  return problems;
}

const problems = diff(extractStrings(SRC), extractStrings(MIRROR));

if (problems.length > 0) {
  console.error(`UI string drift between ${SRC} and ${MIRROR}:\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(`\nEdit ${SRC} first, then copy the UI_STRINGS object into ${MIRROR}.`);
  process.exit(1);
}

console.log('UI strings in sync.');
