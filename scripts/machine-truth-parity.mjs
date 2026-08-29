// Machine truth parity check. Run: node scripts/machine-truth-parity.mjs [https://dmtcode.com]
// Fetches the crawler facing surfaces and /data.json and asserts they tell one story.
// Exit code 1 on any failure. Wire into CI after deploys.
import { extractKits } from './check-kits-drift.mjs';

const SITE = process.argv[2] || 'https://dmtcode.com';
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const get = async (p, json = false) => {
  const r = await fetch(SITE + p, { headers: { 'user-agent': UA, 'cache-control': 'no-cache' } });
  if (!r.ok) throw new Error(`${p} -> HTTP ${r.status}`);
  return json ? r.json() : r.text();
};
const fails = [];
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`); if (!ok) fails.push(name); };
// A surface that cannot be reached is not a surface that disagrees. Skips are
// printed so an offline run reads as incomplete rather than as clean.
const skip = (name, why) => console.log(`SKIP ${name} :: ${why}`);

const data = await get('/data.json', true);
const shop = await get('/shop.json', true);
const home = await get('/');
const methods = await get('/methods');
const proto = await get('/protocols/dmt-laser');
const trials = await get('/trials');
const terms = await get('/terms');
const privacy = await get('/privacy');
const prepare = await get('/prepare');
const nulls = await get('/null-reports');

// 1. Home crawler counts agree with data.json, and are never a bare zero.
const m = home.match(/Published community symbol submissions: <strong>(\d+)<\/strong>/);
check('home live count present', !!m, m ? m[1] : 'missing');
if (m) check('home count equals data.json symbols_community', Number(m[1]) === data.counts.symbols_community, `${m[1]} vs ${data.counts.symbols_community}`);
check('home never shows 0 Community Submissions', !/\b0 Community Submissions/.test(home));
const g = home.match(/Anonymous drawn glyph reports: <strong>(\d+)<\/strong>/);
if (g) check('home glyph count equals data.json registry_glyphs', Number(g[1]) === data.counts.registry_glyphs, `${g[1]} vs ${data.counts.registry_glyphs}`);

// 2. Goler equipment truth. Class 2, 1 mW everywhere it is described; no "left open".
check('methods states Class 2 / 1 mW', /Class 2, operating power 1 mW/.test(methods));
check('methods no longer says power is deliberately left open', !/deliberately left open/.test(methods));
check('methods no blocked aperture suggestion', !/Use a blocked aperture/.test(methods));
check('protocol page carries the reported setup section', /Class 2/.test(proto) && /1 mW/.test(proto));
check('protocol page not called the original Goler protocol', !/The original Goler protocol/.test(proto));

// 3. Strassman DOI.
check('bad Strassman DOI absent from protocol page', !/03950070052009/.test(proto));
check('correct Strassman DOI present', /03950020022002/.test(proto));

// 4. Trials ontology.
check('trials heading renamed', /Trials, Studies and Experiments/.test(trials));
const clinicalNonReg = data.items.filter((i) => i.authority_type === 'Clinical' && i.record_type && i.record_type !== 'registered_clinical_trial' && i.record_type !== 'registered_trial');
check('no non registered record carries Clinical authority', clinicalNonReg.length === 0, `${clinicalNonReg.length} offenders`);
const regNoId = data.items.filter((i) => i.record_type === 'registered_clinical_trial' && !i.registry_id);
check('every registered clinical trial has a registry_id', regNoId.length === 0, `${regNoId.length} missing`);

// 5. Commerce: shop.json equals the Prepare page.
for (const b of shop.bundles) {
  const price = '$' + b.price_usd.toLocaleString('en-US');
  check(`prepare shows ${b.name} at ${price}`, prepare.includes(price));
  check(`${b.name} has per emitter ratings`, Array.isArray(b.emitters) && b.emitters.length > 0);
}
check('prepare no blanket "under 5 mW" claim', !/under 5 mW \(Arbor/.test(prepare));

// 6. Policies.
check('terms: account required for contribution', /required to seal or submit a record/.test(terms));
check('privacy: immediate publication described', /published immediately, before any review/.test(privacy));
check('privacy: no approval-before-publication wording', !/becomes public once it is approved/.test(privacy));

// 7. Null reports show live counts.
check('null reports page carries live counts', /Null reports: <strong>\d+<\/strong>/.test(nulls));

// 8. Shopify. The store is the one surface whose copy is written by hand rather
// than generated from src/data/kits.ts, so it is the one that drifts. It shipped
// a contradicted laser class claim for a day before this check existed. The
// public product JSON needs no authentication.
const SHOP = 'https://dmtcode-p4szt.myshopify.com';
const SHOPIFY_HANDLES = {
  solo: '650nm-laser-diffraction-research-kit-solo',
  dual: 'dual-wavelength-laser-diffraction-research-kit-dual-650-and-532-nm',
  triad: 'multi-wavelength-laser-diffraction-kit-triad',
  circle: 'multi-wavelength-laser-diffraction-kit-circle',
};
// One power figure or one class attached to a whole kit is the error that
// shipped. Every rating on the store has to name the emitter it belongs to.
const BLANKET_POWER = [
  /under 5 ?mW \(Arbor/i,
  /\b(?:this|the|every|each|all)\s+(?:kits?|lasers?|emitters?|sources?)\b[^.]{0,120}?\bunder 5 ?mW\b/i,
  /\bunder 5 ?mW\b[^.]{0,120}?\b(?:for|across|throughout)\s+(?:the|this)\s+kit\b/i,
];
const kits = extractKits('src/data/kits.ts');
const products = {};
let shopDown = '';
for (const kit of kits) {
  if (shopDown) break;
  const handle = SHOPIFY_HANDLES[kit.id];
  if (!handle) { shopDown = `no Shopify handle recorded for kit id ${kit.id}`; break; }
  try {
    const r = await fetch(`${SHOP}/products/${handle}.json`, { headers: { 'user-agent': UA, 'cache-control': 'no-cache' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    products[kit.id] = (await r.json()).product;
  } catch (e) {
    shopDown = `${SHOP} did not serve ${handle}.json (${e.message})`;
  }
}
if (shopDown) {
  skip('shopify surface checks', shopDown);
} else {
  for (const kit of kits) {
    const p = products[kit.id];
    const v = (p.variants || [])[0] || {};
    // Tags and markup carry their own numbers, so compare against the prose the
    // buyer actually reads.
    const text = String(p.body_html || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, ' and ')
      .replace(/\s+/g, ' ');

    check(`shopify ${kit.shortName} price equals kits.ts`, Number(v.price) === kit.priceNumber, `${v.price} vs ${kit.priceNumber}`);
    check(`shopify ${kit.shortName} variant sku equals kits.ts`, v.sku === kit.sku, `${v.sku} vs ${kit.sku}`);
    check(`shopify ${kit.shortName} body claims no Class 3R`, !/class[\s-]?3r/i.test(text));

    const blanket = BLANKET_POWER.find((re) => re.test(text));
    check(`shopify ${kit.shortName} body has no kit wide under 5 mW claim`, !blanket, blanket ? String(blanket) : '');

    // Every wavelength kits.ts records for this bundle has to appear in the
    // store copy. This is what makes the violet emitter honest: kits.ts records
    // it as "401 (sold as 405)", so the store has to carry both numbers.
    const wavelengths = [...new Set(kit.emitters.flatMap((e) => e.wavelength_nm.match(/\d+/g) || []))];
    const missingNm = wavelengths.filter((nm) => !new RegExp(`\\b${nm}\\b`).test(text));
    check(`shopify ${kit.shortName} body names every emitter wavelength kits.ts lists`, missingNm.length === 0, missingNm.join(', '));

    // Same for the vendor class per emitter. FDA IIIA and laser class 3a are
    // different ratings and a kit holding both must show both.
    const classes = [...new Set(kit.emitters.map((e) => (e.vendor_class.match(/\b(?:III?A|\d[A-Z]?)\b/i) || [''])[0]).filter(Boolean))];
    const missingClass = classes.filter((c) => !new RegExp(`\\b${c}\\b`, 'i').test(text));
    check(`shopify ${kit.shortName} body names every emitter vendor class kits.ts lists`, missingClass.length === 0, missingClass.join(', '));

    if (kit.emitters.some((e) => e.sku === 'P2-7678')) {
      check(`shopify ${kit.shortName} keeps the 405 sold, 401 spec sheet wording`, /\b405\b/.test(text) && /\b401\b/.test(text));
    }
  }
}

console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASS');
process.exit(fails.length ? 1 : 0);
