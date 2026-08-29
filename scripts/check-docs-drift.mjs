#!/usr/bin/env node
// Fails the build when the document catalogue disagrees with itself.
//
// Four things have to agree and previously did not:
//   1. src/data/documents.ts and its edge mirror netlify/lib/documents.ts
//   2. the manifest and the files actually sitting in public/downloads
//   3. every file in public/downloads and the manifest, in that direction too
//   4. the count published in public/llms.txt
//
// Check 3 is the one that matters most. The symbol set PDF, the single most
// searched document on the site, sat in public/downloads for weeks while
// neither /prepare nor its crawler body listed it, because nothing ever asked
// the directory what was in it. A manifest that is only checked against itself
// can be complete and wrong at the same time.

import { readFileSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SRC = 'src/data/documents.ts';
const MIRROR = 'netlify/lib/documents.ts';
const DIR = 'public/downloads';
const LLMS = 'public/llms.txt';

export function extractLiteral(path) {
  const text = readFileSync(path, 'utf8');
  const start = text.indexOf('export const DOCUMENTS');
  if (start === -1) throw new Error(`No DOCUMENTS export found in ${path}`);
  const open = text.indexOf('[', start);
  const close = text.indexOf('\n];', open);
  if (open === -1 || close === -1) throw new Error(`Malformed DOCUMENTS array in ${path}`);
  return text.slice(open, close + 2);
}

export function extractDocs(path) {
  // eslint-disable-next-line no-new-func
  return new Function(`return ${extractLiteral(path)};`)();
}

const problems = [];

const docs = extractDocs(SRC);
const mirror = extractDocs(MIRROR);

// 1. Mirror equality. Compared as normalized source text rather than field by
// field, so a comment or a reordered key in one copy and not the other is a
// failure too. The two arrays are meant to be a literal copy.
const norm = (s) => s.replace(/\s+/g, ' ').trim();
if (norm(extractLiteral(SRC)) !== norm(extractLiteral(MIRROR))) {
  problems.push(
    `${SRC} and ${MIRROR} differ. Edit ${SRC}, then copy the DOCUMENTS array verbatim into ${MIRROR}.`,
  );
}

// Shape.
const ids = new Set();
const manifestFiles = new Set();
for (const [i, d] of docs.entries()) {
  const at = `DOCUMENTS[${i}]`;
  for (const key of ['id', 'title', 'kind', 'summary', 'notThis', 'useWhen']) {
    if (typeof d[key] !== 'string' || !d[key].trim()) problems.push(`${at}: ${key} is missing`);
  }
  if (d.id && ids.has(d.id)) problems.push(`${at}: id ${d.id} is used twice`);
  if (d.id) ids.add(d.id);
  if (!Array.isArray(d.files) || d.files.length === 0) {
    problems.push(`${at} ${d.id}: files is missing or empty`);
    continue;
  }
  for (const [j, f] of d.files.entries()) {
    const fat = `${at}.files[${j}]`;
    if (!f || typeof f.file !== 'string' || !f.file.endsWith('.pdf')) {
      problems.push(`${fat}: file must be a .pdf name`);
      continue;
    }
    if (!['en', 'es', 'de'].includes(f.lang)) problems.push(`${fat} ${f.file}: lang must be en, es or de`);
    if (typeof f.label !== 'string' || !f.label.trim()) problems.push(`${fat} ${f.file}: label is missing`);
    if (manifestFiles.has(f.file)) problems.push(`${fat} ${f.file}: listed twice`);
    manifestFiles.add(f.file);
  }
}

// 2 and 3. The directory is the denominator, in both directions.
const onDisk = new Set(readdirSync(DIR).filter((n) => n.toLowerCase().endsWith('.pdf')));
for (const f of manifestFiles) {
  if (!onDisk.has(f)) problems.push(`${SRC} lists ${f}, which is not in ${DIR}. Ship it or take it out of the manifest.`);
}
for (const f of onDisk) {
  if (!manifestFiles.has(f)) {
    problems.push(
      `${DIR}/${f} is published but is in no manifest entry, so no page offers it and no count includes it. ` +
        `Add it to ${SRC} or remove the file.`,
    );
  }
}

// 4. The published count.
const llms = readFileSync(LLMS, 'utf8');
const WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty',
];
const n = manifestFiles.size;
const word = WORDS[n] ? WORDS[n][0].toUpperCase() + WORDS[n].slice(1) : String(n);
const expected = `<!-- pdf-count:start -->${word} PDF documents under /downloads/<!-- pdf-count:end -->`;
if (!llms.includes(expected)) {
  problems.push(`${LLMS} does not carry the current count. Expected the marked block to read:\n    ${expected}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (problems.length > 0) {
    console.error('Document catalogue problems:\n');
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`Document catalogue in sync: ${docs.length} documents, ${n} files.`);
}
