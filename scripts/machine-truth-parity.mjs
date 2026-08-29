// Machine truth parity check. Run: node scripts/machine-truth-parity.mjs [https://dmtcode.com]
// Fetches the crawler facing surfaces and /data.json and asserts they tell one story.
// Exit code 1 on any failure. Wire into CI after deploys.
const SITE = process.argv[2] || 'https://dmtcode.com';
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const get = async (p, json = false) => {
  const r = await fetch(SITE + p, { headers: { 'user-agent': UA, 'cache-control': 'no-cache' } });
  if (!r.ok) throw new Error(`${p} -> HTTP ${r.status}`);
  return json ? r.json() : r.text();
};
const fails = [];
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`); if (!ok) fails.push(name); };

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

console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASS');
process.exit(fails.length ? 1 : 0);
