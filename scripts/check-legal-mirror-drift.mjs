#!/usr/bin/env node
// Fails the build when src/data/legal.ts and netlify/lib/legal.ts differ below
// line 1. Edge functions cannot import from src/, so the country legal frames
// are mirrored by hand. Same approach as check-kits-drift.mjs.

import { readFileSync } from 'node:fs';

const SRC = 'netlify/lib/legal.ts';
const MIRROR = 'src/data/legal.ts';

const body = (p) => readFileSync(p, 'utf8').split('\n').slice(1).join('\n');
const a = body(SRC);
const b = body(MIRROR);

if (a !== b) {
  const la = a.split('\n');
  const lb = b.split('\n');
  const n = Math.max(la.length, lb.length);
  for (let i = 0; i < n; i++) {
    if (la[i] !== lb[i]) {
      console.error(`Legal frame drift between ${SRC} and ${MIRROR} at line ${i + 2}:`);
      console.error(`    ${SRC}: ${JSON.stringify(la[i])}`);
      console.error(`    ${MIRROR}: ${JSON.stringify(lb[i])}`);
      break;
    }
  }
  console.error(`\nEdit ${SRC} first, then copy everything below line 1 into ${MIRROR}.`);
  process.exit(1);
}

console.log('Legal frames in sync.');
