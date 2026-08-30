#!/usr/bin/env node
// Hydration parity. machine-truth-parity.mjs asks for pages the way a crawler
// does and checks the edge-prerendered HTML. It never runs the React app, so a
// component can render the pre-migration meaning back over correct prerendered
// HTML and every check still passes. That is not hypothetical: on 2026-08-30 the
// prerender said "appear to recur across people who have never met" while
// ConvergenceHero.tsx still said "recur", and 523 checks were green.
//
// This script reads each evidence-critical route twice, once as raw HTML and
// once from the DOM after React has hydrated, and fails when the two disagree
// about a fact, or when either states something the record does not support.
//
// It is a factual-parity test, not a snapshot test. Markup differences are
// expected and ignored; only extracted meaning is compared.
//
// Usage: node scripts/hydration-parity.mjs [baseUrl]
// Requires playwright-core and a local Chrome or Edge. No browser download.

import { chromium } from 'playwright-core';

const BASE = (process.argv[2] || 'https://dmtcode.com').replace(/\/$/, '');

let pass = 0;
const failures = [];
const check = (label, ok, detail = '') => {
  if (ok) { pass++; console.log(`PASS ${label}${detail ? ` :: ${detail}` : ''}`); }
  else { failures.push(`${label}${detail ? ` :: ${detail}` : ''}`); console.log(`FAIL ${label}${detail ? ` :: ${detail}` : ''}`); }
};

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

// Phrase matching compares meaning, not punctuation. The prerender writes
// "Framework by: Donald Hoffman" as a definition list and React writes
// "Framework by Donald Hoffman" as a sentence. Same fact, so a colon must not
// fail the run. Anything beyond punctuation and case still counts as drift.
const flat = (s) => (s || '').replace(/[:;,]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const has = (text, phrase) => flat(text).includes(flat(phrase));
const stripTags = (html) =>
  norm(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  );

function ldTypes(jsonTexts) {
  const types = new Set();
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (typeof node['@type'] === 'string') types.add(node['@type']);
    if (Array.isArray(node['@type'])) node['@type'].forEach((t) => types.add(String(t)));
    Object.values(node).forEach(walk);
  };
  for (const t of jsonTexts) {
    try { walk(JSON.parse(t)); } catch { /* a malformed block is reported by the SEO checks, not here */ }
  }
  return types;
}

function rawLdBlocks(html) {
  const out = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

function rawH1(html) {
  const m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  return m ? stripTags(m[1]) : '';
}

// ---------------------------------------------------------------------------
// Routes. `forbidden` must appear in NEITHER view. `required` must appear in
// BOTH. `ldForbidden` must appear in neither view's structured data.
// ---------------------------------------------------------------------------
const MEDIA_CLAIM = '740a9b37-93e3-484a-a916-2aae4f5b6cb5';
const CROSS_SESSION = 'f1fb85d7-bb1e-4732-af03-ad29c15cb53a';
const REGISTERED_TRIAL = '7e41f12f-bafd-4d53-8202-2613a120c923';
const GOLER_BIB = '56c88785-8efd-49b3-9471-0df15676be9a';

const ROUTES = [
  {
    path: '/',
    label: 'homepage',
    forbidden: [
      'Some of them recur across people who have never met',
      'Community Validations',
      'Independent Contributors',
    ],
    required: ['appear to recur across people who have never met'],
  },
  {
    path: `/trials/${MEDIA_CLAIM}`,
    label: 'trial detail, media claim',
    forbidden: ['Principal investigator', 'View trial record', 'Clinical Trials Observatory'],
    forbiddenExact: ['CLINICAL TRIAL'],
    required: ['Media claim'],
    ldForbidden: ['MedicalStudy'],
  },
  {
    path: `/trials/${CROSS_SESSION}`,
    label: 'trial detail, reported replication',
    forbidden: ['Principal investigator', 'near-identical', 'Documented case of two independent'],
    forbiddenExact: ['CLINICAL TRIAL'],
    ldForbidden: ['MedicalStudy'],
  },
  {
    path: `/trials/${REGISTERED_TRIAL}`,
    label: 'trial detail, registered clinical trial keeps clinical rendering',
    required: ['Registered clinical trial'],
    ldRequired: ['MedicalStudy'],
  },
  {
    path: '/theories/the-interface-theory-of-perception',
    label: 'theory detail, borrowed framework',
    forbidden: ['Proposed by Donald Hoffman'],
    required: ['Framework by Donald Hoffman'],
  },
  {
    path: '/protocols/dmt-laser',
    label: 'protocol detail, research observation',
    forbidden: ['Protocol protocol', 'Clinical Overview', 'Clinical Setting Requirements'],
    ldForbidden: ['MedicalWebPage'],
  },
  {
    path: `/bibliography/${GOLER_BIB}`,
    label: 'bibliography detail, Goler pilot',
    forbidden: ['small documented sample', 'Replication Study'],
    required: ['more than 1,000 participants'],
  },
  {
    path: '/dataset',
    label: 'dataset',
    forbidden: ['Community validation counts', 'every approved symbol'],
  },
  {
    path: '/answers',
    label: 'answers truth sheet',
    forbidden: ['Every record now carries a relation_to_core_question field'],
  },
];

async function run() {
  let browser;
  const tried = [];
  for (const channel of ['chrome', 'msedge']) {
    try { browser = await chromium.launch({ channel, headless: true }); break; }
    catch (e) { tried.push(`${channel}: ${String(e.message).split('\n')[0]}`); }
  }
  if (!browser) {
    console.error('Could not launch a local browser. playwright-core needs Chrome or Edge installed.');
    tried.forEach((t) => console.error('  ' + t));
    process.exit(2);
  }

  const ctx = await browser.newContext({ userAgent: 'dmtcode-hydration-parity' });

  for (const route of ROUTES) {
    const url = BASE + route.path;

    // 1. Crawler view.
    let rawHtml = '';
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'dmtcode-hydration-parity' } });
      rawHtml = await res.text();
      check(`${route.label}: raw HTTP 200`, res.status === 200, `status ${res.status}`);
    } catch (e) {
      check(`${route.label}: raw fetch`, false, String(e.message));
      continue;
    }
    const rawText = stripTags(rawHtml);
    const rawLd = ldTypes(rawLdBlocks(rawHtml));

    // 2. Hydrated view.
    const page = await ctx.newPage();
    let hydText = '';
    let hydLd = new Set();
    let hydH1 = '';
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      try { await page.waitForLoadState('networkidle', { timeout: 20000 }); } catch { /* long-poll pages never idle */ }
      await page.waitForTimeout(1500);
      hydText = norm(await page.evaluate(() => document.body.innerText));
      hydH1 = norm(await page.evaluate(() => document.querySelector('h1')?.textContent || ''));
      const blocks = await page.evaluate(() =>
        Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => s.textContent || ''),
      );
      hydLd = ldTypes(blocks);
      check(`${route.label}: hydrated body rendered`, hydText.length > 200, `${hydText.length} chars`);
    } catch (e) {
      check(`${route.label}: hydrated load`, false, String(e.message));
      await page.close();
      continue;
    }
    await page.close();

    // 3. Facts that must hold in BOTH views.
    for (const phrase of route.forbidden || []) {
      const inRaw = has(rawText, phrase);
      const inHyd = has(hydText, phrase);
      check(
        `${route.label}: "${phrase}" absent from both views`,
        !inRaw && !inHyd,
        inRaw && inHyd ? 'present in both' : inRaw ? 'present in crawler HTML only' : inHyd ? 'present after hydration only' : '',
      );
    }
    for (const phrase of route.forbiddenExact || []) {
      const inRaw = rawText.includes(phrase);
      const inHyd = hydText.includes(phrase);
      check(
        `${route.label}: literal "${phrase}" absent from both views`,
        !inRaw && !inHyd,
        inRaw && inHyd ? 'present in both' : inRaw ? 'crawler HTML only' : inHyd ? 'after hydration only' : '',
      );
    }
    for (const phrase of route.required || []) {
      const inRaw = has(rawText, phrase);
      const inHyd = has(hydText, phrase);
      check(
        `${route.label}: "${phrase}" present in both views`,
        inRaw && inHyd,
        !inRaw && !inHyd ? 'missing from both' : !inRaw ? 'missing from crawler HTML' : 'lost on hydration',
      );
    }
    for (const t of route.ldForbidden || []) {
      check(
        `${route.label}: structured data does not claim ${t}`,
        !rawLd.has(t) && !hydLd.has(t),
        rawLd.has(t) && hydLd.has(t) ? 'both' : rawLd.has(t) ? 'crawler HTML only' : hydLd.has(t) ? 'hydrated only' : '',
      );
    }
    for (const t of route.ldRequired || []) {
      check(`${route.label}: structured data includes ${t}`, rawLd.has(t) || hydLd.has(t),
        `raw:${rawLd.has(t)} hydrated:${hydLd.has(t)}`);
    }

    // 4. The headline must mean the same thing in both views.
    const rH1 = rawH1(rawHtml);
    if (rH1 && hydH1) {
      const a = rH1.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      const b = hydH1.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      check(`${route.label}: h1 survives hydration`, a === b || a.includes(b) || b.includes(a), `raw "${rH1}" vs hydrated "${hydH1}"`);
    }
  }

  await browser.close();

  console.log(`\n${pass} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
}

run().catch((e) => { console.error(e); process.exit(2); });
