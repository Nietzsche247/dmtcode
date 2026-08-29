#!/usr/bin/env node
// Regenerates the kit region and the live count regions of public/llms.txt
// from src/data/kits.ts, the database, and the real file list. A static file
// cannot import the module or query the database at serve time, so the build
// writes it instead. Idempotent: running twice produces no diff.
//
// Generated regions are delimited by HTML comment markers in llms.txt:
//   <!-- kits:start --> ... <!-- kits:end -->
//   <!-- corpus-counts:start --> ... <!-- corpus-counts:end -->
//   <!-- pdf-count:start --> ... <!-- pdf-count:end -->
// Hardcoded counts outside these markers are forbidden: if a number cannot be
// generated reliably at build time, the sentence is written without a number.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { extractKits } from './check-kits-drift.mjs';

const LLMS = 'public/llms.txt';
const DOWNLOADS_DIR = 'public/downloads';
const START = '<!-- kits:start -->';
const END = '<!-- kits:end -->';
const CORPUS_START = '<!-- corpus-counts:start -->';
const CORPUS_END = '<!-- corpus-counts:end -->';
const PDF_START = '<!-- pdf-count:start -->';
const PDF_END = '<!-- pdf-count:end -->';

function loadEnv() {
  const env = { ...process.env };
  try {
    for (const line of readFileSync('.env', 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch { /* no .env, rely on process.env */ }
  return env;
}

// Exact row count from PostgREST via a HEAD request with Prefer: count=exact.
// Returns null when the database cannot be reached or the count is unreadable.
async function pgCount(base, key, table, filter) {
  try {
    const res = await fetch(`${base}/rest/v1/${table}?select=id&${filter}`, {
      method: 'HEAD',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'count=exact',
        'Range-Unit': 'items',
        Range: '0-0',
      },
    });
    const cr = res.headers.get('content-range') || '';
    const m = cr.match(/\/(\d+)\s*$/);
    return m ? parseInt(m[1], 10) : null;
  } catch {
    return null;
  }
}

const WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function intToWords(n) {
  if (n < 20) return WORDS[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${WORDS[n % 10]}` : '');
  if (n < 1000) {
    const rest = n % 100;
    return `${WORDS[Math.floor(n / 100)]} hundred${rest ? ` ${intToWords(rest)}` : ''}`;
  }
  return String(n);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function observerPhrase(kit) {
  return kit.observers === '1' ? '1 observer' : `${kit.observers} observers`;
}

// Kit names carry their wavelengths (e.g. "Triad (650 and 405 nm, ...)"), so
// the numbers are read from the catalogue rather than restated here.
function kitWavelengths(kit) {
  const nums = [...new Set(kit.name.match(/\b\d{3}\b/g) || [])];
  if (nums.length === 0) return null;
  if (nums.length === 1) return `${nums[0]} nm`;
  if (nums.length === 2) return `${nums[0]} and ${nums[1]} nm`;
  return `${nums.slice(0, -1).join(', ')} and ${nums[nums.length - 1]} nm`;
}

function buildSellerLine(kits) {
  const perKit = kits
    .map((k) => `${k.shortName} at ${kitWavelengths(k)}`)
    .join('; ');
  return (
    `Wavelengths by kit: ${perKit}. ` +
    'Every kit includes diffraction optics and a semicircle acrylic piece that stretches the laser dot into a short bright horizontal line, a few centimetres long at typical bench distances, not a line across the wall; line length depends on the piece and on its distance from the laser, and moving the optic away from the laser lengthens the line while moving it closer shortens it; observation documents are free PDF downloads. ' +
    'Sold and shipped by Meridian Optics Lab (the name on the card statement and parcel); ' +
    'support info@dmtcode.com. Free US shipping, processed within 2 business days, arrives in 7 to 10 business days. ' +
    'Unopened kits returnable within 30 days. Policies: /shipping, /returns, /store-terms, /store-contact. ' +
    'Full cards at /prepare, machine copy at /shop.json.'
  );
}

const SHOP_JSON_LINE =
  '- /shop.json: the four research kits from src/data/kits.ts (slug, name, full_name, observers, price_usd, diy_parts_usd, availability, cart_url, image, url, emitters with per emitter vendor rated output and class), seller Meridian Optics Lab, support_email. CC-BY-4.0.';

const PREPARE_PAGE_LINE =
  '- [Prepare](/prepare): Four laser diffraction research kits (Solo, Dual, Triad, Circle), shipping and returns terms, screening notes, free protocol PDFs, and secure Shopify checkout.';

function buildBlock(kits) {
  const bullets = kits
    .map(
      (k) =>
        `- ${k.shortName} (${observerPhrase(k)}): ${k.price}. Sourcing the parts yourself ≈ ${k.diyCost}. Cart: ${k.cart}`,
    )
    .join('\n');
  return `${START}\n## Kits\n\n${bullets}\n\n${buildSellerLine(kits)}\n${END}`;
}

function replaceRegion(text, start, end, content) {
  if (!text.includes(start) || !text.includes(end)) {
    throw new Error(`Missing marker region ${start} in ${LLMS}`);
  }
  const before = text.slice(0, text.indexOf(start) + start.length);
  const after = text.slice(text.indexOf(end));
  return before + content + after;
}

const kits = extractKits('src/data/kits.ts');
const block = buildBlock(kits);

let text = readFileSync(LLMS, 'utf8');

// 1. kit region
if (text.includes(START) && text.includes(END)) {
  const before = text.slice(0, text.indexOf(START));
  const after = text.slice(text.indexOf(END) + END.length);
  text = before + block + after;
} else {
  const anchor = text.indexOf('## Free protocol documents');
  if (anchor === -1) {
    throw new Error(`Cannot find insertion anchor "## Free protocol documents" in ${LLMS}`);
  }
  text = text.slice(0, anchor) + block + '\n\n' + text.slice(anchor);
}

// 2. /shop.json endpoint description
text = text.replace(/^- \/shop\.json:.*$/m, SHOP_JSON_LINE);

// 3. /prepare page line
text = text.replace(/^- \[Prepare\]\(\/prepare\):.*$/m, PREPARE_PAGE_LINE);

// 4. corpus full-text counts, measured from the database at build time.
// Matches the has_full_text predicate in netlify/edge-functions/data-json.ts
// (is_approved and a non-empty full_text). When the database is unreachable
// the sentence is written without numbers rather than with stale ones.
const env = loadEnv();
const base = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
let corpusSentence =
  'A subset of the approved records carries full text';
if (base && key) {
  const [approved, withText] = await Promise.all([
    pgCount(base, key, 'bibliography', 'is_approved=eq.true'),
    pgCount(base, key, 'bibliography', 'is_approved=eq.true&full_text=not.is.null&full_text=neq.'),
  ]);
  if (approved !== null && withText !== null) {
    corpusSentence = `${withText} of ${approved} approved records currently carry full text`;
  } else {
    console.warn('llms.txt: corpus counts unavailable, writing sentence without numbers.');
  }
} else {
  console.warn('llms.txt: no Supabase credentials at build time, writing corpus sentence without numbers.');
}
text = replaceRegion(text, CORPUS_START, CORPUS_END, corpusSentence);

// 5. PDF document count, measured from the real file list at build time.
let pdfSentence;
try {
  const pdfCount = readdirSync(DOWNLOADS_DIR).filter((f) => f.toLowerCase().endsWith('.pdf')).length;
  pdfSentence = `${capitalize(intToWords(pdfCount))} PDF documents under /downloads/`;
} catch {
  pdfSentence = 'PDF documents under /downloads/';
  console.warn('llms.txt: could not list downloads directory, writing PDF sentence without a number.');
}
text = replaceRegion(text, PDF_START, PDF_END, pdfSentence);

writeFileSync(LLMS, text);
console.log(`${LLMS} synced (${kits.length} kits, corpus and PDF counts refreshed).`);
