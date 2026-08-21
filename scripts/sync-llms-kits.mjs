#!/usr/bin/env node
// Regenerates the kit region of public/llms.txt from src/data/kits.ts.
// A static file cannot import the module, so the build writes it instead.
// Idempotent: running twice produces no diff.

import { readFileSync, writeFileSync } from 'node:fs';
import { extractKits } from './check-kits-drift.mjs';

const LLMS = 'public/llms.txt';
const START = '<!-- kits:start -->';
const END = '<!-- kits:end -->';

const SELLER_LINE =
  'All kits: 650 nm laser module and diffraction optics; observation documents are free PDF downloads. ' +
  'Sold and shipped by Meridian Optics Lab (the name on the card statement and parcel); ' +
  'support info@dmtcode.com. Free US shipping, processed within 2 business days, arrives in 7 to 10 business days. ' +
  'Unopened kits returnable within 30 days. Policies: /shipping, /returns, /store-terms, /store-contact. ' +
  'Full cards at /prepare, machine copy at /shop.json.';

const SHOP_JSON_LINE =
  '- /shop.json: the three research kits from src/data/kits.ts (slug, name, full_name, observers, price_usd, diy_parts_usd, availability, cart_url, image, url), seller Meridian Optics Lab, support_email. CC-BY-4.0.';

const PREPARE_PAGE_LINE =
  '- [Prepare](/prepare): Four laser diffraction research kits (Solo, Triad, Circle), screening notes, free protocol PDFs, and secure Shopify checkout.';

function observerPhrase(kit) {
  return kit.observers === '1' ? '1 observer' : `${kit.observers} observers`;
}

function buildBlock(kits) {
  const bullets = kits
    .map(
      (k) =>
        `- ${k.shortName} (${observerPhrase(k)}): ${k.price}. Sourcing the parts yourself \u2248 ${k.diyCost}. Cart: ${k.cart}`,
    )
    .join('\n');
  return `${START}\n## Kits\n\n${bullets}\n\n${SELLER_LINE}\n${END}`;
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

writeFileSync(LLMS, text);
console.log(`${LLMS} kit region synced (${kits.length} kits).`);
