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
// Voice is the one asset the page has described wrongly in both directions: it
// once said voice notes sit in a public store, and a later edit said they were
// published with the symbol. Neither was true. RegistrySubmissionForm uploads
// to the private voice-logs bucket under the owner's own user id, playback goes
// through createSignedUrl, and data-json.ts never selects voice_note_url. A page
// that overstates exposure is as wrong as one that understates it.
check('privacy: voice described as private', /never included in the open export/.test(privacy) && /Voice notes are not\./.test(privacy));
check('privacy: no claim that voice sits in a public store', !/[Vv]oice notes are (currently in the same public store|held in a public store)/.test(privacy));

// A bibliography row dated in the future reads, to an agent, as DMT Code citing
// research that has not happened. Most of them are ordinary: a journal assigns an
// issue date months after the paper is readable online. The rule is not that the
// date must be in the past, it is that a future date has to say which kind it is.
const futureDated = data.items.filter((i) => i.id.startsWith('bib_') && i.source_date && i.source_date.slice(0, 10) > new Date().toISOString().slice(0, 10));
const unexplained = futureDated.filter((i) => !i.publication_status);
check('every future dated bibliography row declares a publication status', unexplained.length === 0, unexplained.map((i) => `${i.source_date.slice(0, 10)} ${i.title.slice(0, 40)}`).join(' | '));
const STATUSES = new Set(['published', 'online_ahead_of_print', 'forthcoming', 'preprint']);
const badStatus = data.items.filter((i) => i.publication_status && !STATUSES.has(i.publication_status));
check('publication_status uses the declared vocabulary', badStatus.length === 0, badStatus.map((i) => i.publication_status).join(', '));
// online_ahead_of_print asserts the work is readable now, so it needs the date it became readable.
const missingOnline = data.items.filter((i) => i.publication_status === 'online_ahead_of_print' && !i.online_publication_date);
check('online ahead of print rows carry the online date', missingOnline.length === 0, missingOnline.map((i) => i.title.slice(0, 40)).join(' | '));

// 7. Null reports show live counts.
check('null reports page carries live counts', /Null reports: <strong>\d+<\/strong>/.test(nulls));

// 8. Locale surfaces must not contradict English.
//
// The site stores one translated body per static page per locale, written when
// the English was last translated. Editing the English does not touch those
// rows, so a rewritten page keeps serving its old translation until a
// translation run catches up. For pages that make a classification, safety or
// rights claim the prerender gates the translation on a source hash and falls
// back to English on a mismatch. These checks assert the gate is doing its job:
// the retired English claim must not survive in any language.
const RETIRED_CLAIMS = [
  { path: '/trials', strings: ['Observatorio de Ensayos Clínicos', 'Klinische Studien Observatorium', 'seguimiento de los ensayos clínicos'], why: 'frames every record as a clinical trial' },
  // /events is checked below instead of here. The retired claim was that every
  // listing is moderator reviewed. The current copy still says submitted events
  // are reviewed before publication, which is true, and then states the scraper
  // exception. Banning the review phrase would fail on correct copy, so the
  // invariant is the exception clause, not the absence of the review clause.
  { path: '/privacy', strings: ['24 de julio', '24. Juli'], why: 'superseded effective date' },
  { path: '/methods', strings: ['Utilice una apertura bloqueada', 'Verwenden Sie eine blockierte Blende'], why: 'blocked-aperture sham' },
];
for (const { path, strings, why } of RETIRED_CLAIMS) {
  for (const loc of ['es', 'de']) {
    const html = await get(`/${loc}${path}`);
    const hit = strings.find((s) => html.includes(s));
    check(`/${loc}${path} free of retired claim (${why})`, !hit, hit || '');
  }
}

// /events in every language has to carry the scraper exception, because the page
// also says submitted events are reviewed before publication and it renders rows
// that no editor has verified. One without the other is the contradiction the
// audit found.
for (const loc of ['en', 'es', 'de']) {
  const html = await get(loc === 'en' ? '/events' : `/${loc}/events`);
  const exception = /auto-discovered|auto-descubiert|candidato|automatisch entdeckt|Kandidat/i.test(html);
  check(`${loc} /events states the auto-discovered exception`, exception);
}

// 9. Shopify. The store is the one surface whose copy is written by hand rather
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

// 9. Locale parity across every prerendered static page, en / es / de.
//
// English is the source. /es and /de mirror it, and a page there is in one of
// two states. Either it carries a translation from content_translations, or it
// falls back to the English source, which the prerender leaves marked with
// <!--tsrc:static:ID-->. Falling back is correct behaviour and passes here: a
// page with no translation row is not a page that disagrees with itself.
//
// What must never happen is a locale stating a different fact from English: a
// different effective date, a different count, or a laser class or power
// figure English does not make. That is what a stale translation looks like
// from the outside, and it is what these checks detect. The marker tells the
// two apart, so every failure below is a translation that is present and
// wrong, never a translation that is merely absent.
const STATIC_LOCALE_PAGES = [
  ['home', '/'], ['registry', '/registry'], ['trials', '/trials'], ['bibliography', '/bibliography'],
  ['dataset', '/dataset'], ['about', '/about'], ['critiques', '/critiques'], ['events', '/events'],
  ['glossary', '/glossary'], ['methods', '/methods'], ['research', '/research'], ['protocols', '/protocols'],
  ['forecasts', '/forecasts'], ['privacy', '/privacy'], ['terms', '/terms'], ['shipping', '/shipping'],
  ['returns', '/returns'], ['disclosure', '/disclosure'], ['capture', '/capture'], ['join', '/join'],
  ['timeline', '/timeline'], ['faq', '/faq'], ['prepare', '/prepare'], ['evidence-map', '/evidence-map'],
  ['articles', '/articles'],
];
const LOCALES = ['en', 'es', 'de'];
const localePath = (loc, p) => (loc === 'en' ? p : `/${loc}${p === '/' ? '/' : p}`);

// Month names in all three languages, mapped to a month number, so a date can
// be compared as a value rather than as a string. "28 August 2026",
// "28 de agosto de 2026" and "28. August 2026" are the same fact.
const MONTH_NO = new Map();
const addMonths = (names) => names.forEach((n, i) => MONTH_NO.set(n, i + 1));
addMonths(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']);
addMonths(['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']);
addMonths(['januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember']);
MONTH_NO.set('marz', 3);
MONTH_NO.set('setiembre', 9);

const datesIn = (text) => {
  const out = new Set();
  const push = (d, mon, y) => {
    const n = MONTH_NO.get(String(mon).toLowerCase());
    if (n) out.add(`${y}-${String(n).padStart(2, '0')}-${String(Number(d)).padStart(2, '0')}`);
  };
  const W = '[A-Za-zÄÖÜäöüßÁÉÍÓÚáéíóú]+';
  for (const m of text.matchAll(new RegExp(`\\b(\\d{1,2})\\s+(${W})\\s+(\\d{4})\\b`, 'g'))) push(m[1], m[2], m[3]);
  for (const m of text.matchAll(new RegExp(`\\b(\\d{1,2})\\s+de\\s+(${W})\\s+de\\s+(\\d{4})\\b`, 'gi'))) push(m[1], m[2], m[3]);
  for (const m of text.matchAll(new RegExp(`\\b(\\d{1,2})\\.\\s*(${W})\\s+(\\d{4})\\b`, 'g'))) push(m[1], m[2], m[3]);
  for (const m of text.matchAll(new RegExp(`\\b(${W})\\s+(\\d{1,2}),\\s*(\\d{4})\\b`, 'g'))) push(m[2], m[1], m[3]);
  return out;
};

// The live counts the prerender injects are the only numbers wrapped in
// <strong>, which is what makes them separable from prose that happens to
// contain a number.
const countsIn = (html) => new Set(
  [...html.matchAll(/<strong>\s*(\d[\d,]*)\s*<\/strong>/g)].map((m) => m[1].replace(/,/g, '')),
);

// A laser class is a standard designation. "Class 2" and "Class 3R" are the
// names of the ratings, not English words, and translating one produces a
// rating that does not exist. English pages name Class 3R deliberately, in
// prose that explains how it differs from the Class 2 in Goler's paper, so the
// designation itself is not the fault. A translated designation is.
const TRANSLATED_CLASS = { es: /clase\s*3\s*r/i, de: /klasse\s*3\s*r/i };

// The error that has shipped before is one power figure or one class attached
// to a whole kit, dropping the per emitter detail and the ray box exception.
// English says "vendor rated 5 mW, FDA Class IIIa, also written Class 3R; the
// ray box in the Triad and Circle is under 1 mW". A translation that collapses
// that to "the kit modules are under 5 mW" states something kits.ts does not.
const KIT_WIDE_POWER = [
  /\b(?:kit modules?|the kits?|every kit|all kits)\b[^.]{0,160}?\bunder 5 ?mW\b/i,
  /\bm[oó]dulos del kit\b[^.]{0,160}?\b(?:por debajo de|menos de|inferior(?:es)? a|bajo)\s*5\s?mW\b/i,
  /\bkit-?module\b[^.]{0,160}?\bunter\s*5\s?mW\b/i,
];

// Approval before publication is the wording the privacy policy carried before
// 28 August 2026. A symbol is published immediately and reviewed inside 72
// hours; saying it is published after approval misdescribes what happens to a
// contributor's record.
const APPROVAL_FIRST = [
  /becomes public once it is approved/i,
  /se (?:hace|vuelve) p[úu]blic[oa][^.]{0,60}?(?:una vez|cuando|tras)[^.]{0,40}?aprobad/i,
  /wird[^.]{0,60}?(?:erst )?nach (?:der )?(?:Genehmigung|Freigabe|Pr[üu]fung)[^.]{0,40}?ver[öo]ffentlicht/i,
];

// The three locale mirrors of a page are compared against each other, so they
// have to be rendered from the same moment. Netlify caches per full URL for an
// hour, so without a per-run nonce one locale can answer from a cached render
// made before an event was scraped while another renders fresh, and the diff
// reports a drift that does not exist. A request-collapsing header does not
// help: the cached copy is already stored. A nonce forces all three to origin.
const RUN_NONCE = `pv${Date.now().toString(36)}`;
const bust = (p) => p + (p.includes('?') ? '&' : '?') + RUN_NONCE + '=1';

// fresh=true gives the call its own nonce. The run nonce is stable so the main
// sweep reads one consistent snapshot, but a confirmation read has to defeat the
// copy the sweep just put in the cache, or it re-reads the same bytes and
// reproduces the very mismatch it is meant to test.
let freshSeq = 0;
const getLocale = async (p, fresh = false) => {
  const url = fresh ? p + (p.includes('?') ? '&' : '?') + `pvr${Date.now().toString(36)}${freshSeq++}=1` : bust(p);
  // The nonce sends every read to the origin, so a sweep is a few hundred cold
  // renders and the occasional socket drop is expected. One retry, because a
  // harness that reports a network blip as drift teaches people to ignore it.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(SITE + url, { headers: { 'user-agent': UA, 'cache-control': 'no-cache' } });
      if (!r.ok) return null;
      return await r.text();
    } catch (e) {
      if (attempt === 1) return null;
      await new Promise((res) => setTimeout(res, 750));
    }
  }
  return null;
};

const localeDocs = {};
let localeDown = '';
for (const [id, path] of STATIC_LOCALE_PAGES) {
  if (localeDown) break;
  for (const loc of LOCALES) {
    const html = await getLocale(localePath(loc, path));
    if (html === null) { localeDown = `${SITE}${localePath(loc, path)} did not serve`; break; }
    const article = (html.match(/<article data-prerender="[^"]*"[\s\S]*?<\/article>/) || [''])[0];
    localeDocs[`${id}|${loc}`] = {
      html,
      article,
      text: article.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' '),
      lang: (html.match(/<html[^>]*\blang="([^"]*)"/) || [, ''])[1],
      englishFallback: html.includes(`<!--tsrc:static:${id}-->`),
    };
  }
}

if (localeDown) {
  skip('locale parity checks', localeDown);
} else {
  const fallbackOnly = [];
  for (const [id, path] of STATIC_LOCALE_PAGES) {
    const en = localeDocs[`${id}|en`];

    for (const loc of LOCALES) {
      const d = localeDocs[`${id}|${loc}`];
      check(`lang attribute on ${loc} /${id} is ${loc}`, d.lang === loc, d.lang);
      check(`${loc} /${id} rendered a prerender body`, d.article.length > 0);
    }

    const translated = LOCALES.filter((loc) => loc !== 'en' && !localeDocs[`${id}|${loc}`].englishFallback);
    const fellBack = LOCALES.filter((loc) => loc !== 'en' && localeDocs[`${id}|${loc}`].englishFallback);
    if (fellBack.length) fallbackOnly.push(`${id}: ${fellBack.join(',')}`);

    // Dates. Every date English states has to be stated by the mirrors too, in
    // whatever form that language writes it.
    // List rows are excluded. Their blurbs are clipped to a fixed character
    // count, and the same sentence is longer in Spanish and German, so the cut
    // lands on a different word and a date inside the prose survives in one
    // language and is severed in another: /events showed "on October 21, 2026"
    // in English and "del 4 al 11 de octubre de 202" in Spanish, cut mid-year.
    // That is truncation, not drift. The date a row actually asserts is in its
    // time element, which every locale renders identically, and the counts check
    // below covers the injected numbers. What is compared here is the authored
    // body, where a differing date would be a real contradiction.
    const stripRows = (a) => a.replace(/<li[\s\S]*?<\/li>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const enDates = datesIn(stripRows(en.article));
    for (const loc of translated) {
      const got = datesIn(stripRows(localeDocs[`${id}|${loc}`].article));
      let missing = [...enDates].filter((x) => !got.has(x));
      // The list pages render a capped slice of a live table, so a row written
      // between the English fetch and the mirror fetch moves the boundary and
      // drops the last date from one of them. That is a race in this script,
      // not drift on the site. Confirm a mismatch against a fresh pair before
      // failing, and only report the dates that survive both reads.
      if (missing.length) {
        const [enFresh, locFresh] = await Promise.all([
          getLocale(localePath('en', path), true),
          getLocale(localePath(loc, path), true),
        ]);
        if (enFresh && locFresh) {
          const strip = (h) => stripRows((h.match(/<article data-prerender="[^"]*"[\s\S]*?<\/article>/) || [''])[0]);
          const gotFresh = datesIn(strip(locFresh));
          missing = [...datesIn(strip(enFresh))].filter((x) => !gotFresh.has(x));
        }
      }
      check(`${loc} /${id} states every date English states`, missing.length === 0, missing.join(', '));
    }

    // Counts. A number the prerender injects is the same number in every
    // language, so the sets have to be identical, not merely overlapping.
    const enCounts = countsIn(en.article);
    for (const loc of translated) {
      const got = countsIn(localeDocs[`${id}|${loc}`].article);
      const diff = [...new Set([...enCounts, ...got])].filter((x) => enCounts.has(x) !== got.has(x));
      check(`${loc} /${id} carries the same injected counts as English`, diff.length === 0, diff.join(', '));
    }

    // Laser class and power.
    for (const loc of LOCALES) {
      const d = localeDocs[`${id}|${loc}`];
      if (TRANSLATED_CLASS[loc]) {
        check(`${loc} /${id} does not translate the laser class designation`, !TRANSLATED_CLASS[loc].test(d.text));
      }
      const blanket = KIT_WIDE_POWER.find((re) => re.test(d.text));
      check(`${loc} /${id} makes no kit wide under 5 mW claim`, !blanket, blanket ? String(blanket) : '');
    }

    // Approval before publication, on the privacy policy, in every language.
    if (id === 'privacy') {
      for (const loc of LOCALES) {
        const d = localeDocs[`${id}|${loc}`];
        const hit = APPROVAL_FIRST.find((re) => re.test(d.text));
        check(`${loc} /privacy has no approval-before-publication wording`, !hit, hit ? String(hit) : '');
      }
    }

    // The two policy dates that were corrected on 28 August 2026 have to read
    // the same in all three languages.
    if (id === 'privacy' || id === 'terms') {
      for (const loc of LOCALES) {
        const got = datesIn(localeDocs[`${id}|${loc}`].text);
        check(`${loc} /${id} shows the 28 August 2026 effective date`, got.has('2026-08-28'), [...got].join(', '));
      }
    }
  }
  if (fallbackOnly.length) {
    console.log(`NOTE serving the English source, no translation applied :: ${fallbackOnly.join(' | ')}`);
  }
}

console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASS');
process.exit(fails.length ? 1 : 0);
