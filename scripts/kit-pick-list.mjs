#!/usr/bin/env node
/**
 * Prints the Arbor Scientific order lines for one kit, straight from the
 * `contents` array in src/data/kits.ts.
 *
 * This exists because the supplier order was the last list still composed by
 * hand. Everything else a customer sees, the /prepare cards, the product pages,
 * shop.json and llms.txt, is generated from src/data/kits.ts, but the order
 * actually placed with Arbor was retyped from the blurb each time. That is
 * exactly how the published contents and the shipped contents drifted apart
 * after the first orders went out. Reading the order off the same array the
 * customer reads closes that gap: if the pick list is wrong, the website is
 * wrong in the same way and in the same place, and one fix corrects both.
 *
 * Usage:
 *   node scripts/kit-pick-list.mjs Solo
 *   node scripts/kit-pick-list.mjs Circle --qty 3
 *   node scripts/kit-pick-list.mjs --all
 *   node scripts/kit-pick-list.mjs Solo --json
 *
 * Exits 0 on success, 1 on an unknown kit name.
 */
import { extractKits } from './check-kits-drift.mjs';

const SRC = 'src/data/kits.ts';

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const all = argv.includes('--all');
const qtyIdx = argv.indexOf('--qty');
const multiplier = qtyIdx === -1 ? 1 : Number(argv[qtyIdx + 1]);
// When --qty is present its value is the next argv slot, which must not be
// mistaken for the kit name. With no --qty there is no value slot to skip.
const qtyValueIdx = qtyIdx === -1 ? -1 : qtyIdx + 1;
const wanted = argv.filter((a, i) => !a.startsWith('--') && i !== qtyValueIdx)[0];

if (!Number.isInteger(multiplier) || multiplier < 1) {
  console.error(`--qty must be a positive integer, got ${argv[qtyIdx + 1]}`);
  process.exit(1);
}

const kits = extractKits(SRC);

if (!all && !wanted) {
  console.error('Usage: node scripts/kit-pick-list.mjs <shortName|id> [--qty N] [--json]');
  console.error(`Kits: ${kits.map((k) => k.shortName).join(', ')}, or --all`);
  process.exit(1);
}

const selected = all
  ? kits
  : kits.filter(
      (k) =>
        k.shortName.toLowerCase() === wanted.toLowerCase() ||
        k.id.toLowerCase() === wanted.toLowerCase(),
    );

if (selected.length === 0) {
  console.error(`No kit named "${wanted}". Known kits: ${kits.map((k) => k.shortName).join(', ')}.`);
  process.exit(1);
}

if (asJson) {
  console.log(
    JSON.stringify(
      selected.map((k) => ({
        kit: k.shortName,
        kit_sku: k.sku,
        units: multiplier,
        source: SRC,
        line_items: k.contents.map((c) => ({
          part_number: c.sku,
          name: c.name,
          qty: c.qty * multiplier,
          ...(c.note ? { note: c.note } : {}),
          ...(c.vendor_url ? { vendor_url: c.vendor_url } : {}),
        })),
      })),
      null,
      2,
    ),
  );
  process.exit(0);
}

const pad = (s, n) => String(s).padEnd(n);

for (const kit of selected) {
  const units = multiplier === 1 ? '1 kit' : `${multiplier} kits`;
  console.log('');
  console.log(`${kit.shortName} (${kit.sku}) supplier order, ${units}`);
  console.log(`Source: ${SRC}. Vendor: Arbor Scientific.`);
  console.log('');
  console.log(`  ${pad('PART', 10)} ${pad('QTY', 5)} ITEM`);
  console.log(`  ${'-'.repeat(10)} ${'-'.repeat(5)} ${'-'.repeat(52)}`);
  for (const item of kit.contents) {
    const note = item.note ? ` (${item.note})` : '';
    console.log(`  ${pad(item.sku, 10)} ${pad(item.qty * multiplier, 5)} ${item.name}${note}`);
  }
  const lines = kit.contents.length;
  const pieces = kit.contents.reduce((n, c) => n + c.qty * multiplier, 0);
  console.log('');
  console.log(`  ${lines} order lines, ${pieces} vendor units total.`);
  console.log(`  Kit list price ${kit.price}. Parts at Arbor list ${kit.diyCost} per kit.`);
}
console.log('');
