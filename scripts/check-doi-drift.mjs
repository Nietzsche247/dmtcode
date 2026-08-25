#!/usr/bin/env node
// Fails the build when a Zenodo DOI or a dataset version label drifts.
//
// The site renders twice. React (src/) is what a browser executes.
// netlify/edge-functions/content-prerender.ts is what crawlers and AI
// assistants receive. A DOI or version string changed in one and not the other
// means the site tells a human one thing and a crawler another.
//
// Rule: a living pointer ("here is our dataset, go cite it") uses the CONCEPT
// DOI, which always resolves to the newest version. A VERSION DOI is only
// correct where it names one specific deposit or file.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Every Zenodo DOI the codebase is allowed to mention. A DOI not listed here
// fails the build on purpose: a new deposit must be registered consciously.
const DOIS = {
  '17816519': { kind: 'concept', what: 'dataset series concept DOI' },
  '17816520': { kind: 'version', what: 'dataset v1.0, Dec 2025 stub' },
  '21987511': { kind: 'version', what: 'dataset v4.1' },
  '22101521': { kind: 'concept', what: 'report series concept DOI' },
  '22101522': { kind: 'version', what: 'report Volume 1' },
};

// Where a VERSION DOI is legitimately allowed. Everywhere else must use a
// concept DOI. Add an entry only with a reason.
const VERSION_ALLOWLIST = [
  { doi: '22101522', file: 'src/pages/Registry.tsx', why: 'Report block identifier, names one published deposit' },
  { doi: '22101522', file: 'netlify/edge-functions/content-prerender.ts', why: 'REGISTRY_REPORT_LD identifier, mirrors Registry.tsx' },
  { doi: '22101522', file: 'src/components/registry/RegistryBrowser.tsx', why: 'download block, names the Volume 1 file' },
  { doi: '22101522', file: 'public/llms.txt', why: 'names the Volume 1 PDF at a specific path' },
  { doi: '21987511', file: 'src/lib/constants.ts', commentOnly: true, why: 'comment only, explains why the version DOI is not used' },
  { doi: '17816520', file: 'netlify/edge-functions/content-prerender.ts', why: 'version history list item, names the superseded v1.0 deposit' },
];

const ROOTS = ['src', 'public', 'netlify'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'build']);
const TEXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|txt|html|md|xml)$/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (TEXT.test(entry)) out.push(full);
  }
  return out;
}

function read(path) {
  try { return readFileSync(path, 'utf8'); } catch { return null; }
}

const problems = [];
const notes = [];

// --- Check 1: every Zenodo DOI mention is registered and correctly placed ---
const files = ROOTS.flatMap((r) => { try { return walk(r); } catch { return []; } });
const seen = new Map();

for (const file of files) {
  const text = read(file);
  if (!text) continue;
  const re = /zenodo\.(\d+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const id = m[1];
    const line = text.slice(0, m.index).split('\n').length;
    const meta = DOIS[id];
    if (!meta) {
      problems.push(
        `Unregistered Zenodo DOI zenodo.${id}\n    at ${file}:${line}\n` +
        `    Add it to the DOIS register in scripts/check-doi-drift.mjs and say whether it is a concept or a version DOI.`
      );
      continue;
    }
    seen.set(id, (seen.get(id) || 0) + 1);
    if (meta.kind === 'version') {
      const normalised = file.split('\\').join('/');
      const entry = VERSION_ALLOWLIST.find((a) => a.doi === id && a.file === normalised);
      let allowed = Boolean(entry);
      if (entry && entry.commentOnly) {
        const lineText = text.split('\n')[line - 1] || '';
        const trimmed = lineText.trimStart();
        allowed = trimmed.startsWith('//') || trimmed.startsWith('*');
        if (!allowed) {
          problems.push(
            `VERSION DOI zenodo.${id} is allowlisted in ${normalised} for COMMENTS ONLY, but this occurrence is live code.\n    at ${file}:${line}\n    ${lineText.trim()}`
          );
          continue;
        }
      }
      if (!allowed) {
        problems.push(
          `VERSION DOI used as a living pointer: zenodo.${id} (${meta.what})\n    at ${file}:${line}\n` +
          `    Living pointers must use a concept DOI. Dataset: 10.5281/zenodo.17816519. Report series: 10.5281/zenodo.22101521.\n` +
          `    If this one genuinely names a single deposit, add it to VERSION_ALLOWLIST with a reason.`
        );
      }
    }
  }
}

// --- Check 2: the Report block must agree across React and the prerender ---
const REACT_REPORT = 'src/pages/Registry.tsx';
const PRERENDER = 'netlify/edge-functions/content-prerender.ts';
const REPORT_FIELDS = ['identifier', 'alternateName', 'datePublished', 'version'];

function sliceBlock(text, startMarker) {
  const i = text.indexOf(startMarker);
  if (i === -1) return null;
  return text.slice(i, i + 1600);
}

function field(block, name) {
  const m = block.match(new RegExp('[\'"]?' + name + '[\'"]?\\s*:\\s*[\'"]([^\'"]+)[\'"]'));
  return m ? m[1] : null;
}

const reactText = read(REACT_REPORT);
const preText = read(PRERENDER);

if (!reactText || !preText) {
  problems.push(`Cannot read ${REACT_REPORT} or ${PRERENDER}.`);
} else {
  const reactBlock = sliceBlock(reactText, '"@type": "Report"');
  const preBlock = sliceBlock(preText, 'REGISTRY_REPORT_LD = {');
  if (!reactBlock) {
    problems.push(`No Report JSON-LD block found in ${REACT_REPORT}. If it moved, update the probe in scripts/check-doi-drift.mjs.`);
  } else if (!preBlock) {
    problems.push(`No REGISTRY_REPORT_LD found in ${PRERENDER}. If it was renamed, update the probe in scripts/check-doi-drift.mjs.`);
  } else {
    for (const f of REPORT_FIELDS) {
      const a = field(reactBlock, f);
      const b = field(preBlock, f);
      if (a === null || b === null) {
        problems.push(`Report block field "${f}" not found in ${a === null ? REACT_REPORT : PRERENDER}.`);
      } else if (a !== b) {
        problems.push(
          `Report block drift on "${f}"\n    ${REACT_REPORT}: ${a}\n    ${PRERENDER}: ${b}\n` +
          `    These two blocks must match field for field. Crawlers see the prerender, browsers see React.`
        );
      }
    }
  }
}

// --- Check 3: the dataset version label must agree in all four places ---
const constants = read('src/lib/constants.ts');
let truth = null;
if (!constants) {
  problems.push('Cannot read src/lib/constants.ts.');
} else {
  const m = constants.match(/ZENODO_VERSION\s*=\s*['"]([^'"]+)['"]/);
  if (!m) problems.push('ZENODO_VERSION not found in src/lib/constants.ts. Update the probe if it was renamed.');
  else truth = m[1];
}

if (truth) {
  const probes = [
    { file: 'src/lib/constants.ts', re: /DMT Code Open Dataset v([0-9.]+)/, label: 'citation template' },
    { file: 'src/pages/Dataset.tsx', re: /v([0-9.]+)\s*\(\d+\s+\w+\s+\d{4}\)/, label: 'version history entry' },
    { file: PRERENDER, re: /Current release: DMT Code Open Dataset v([0-9.]+)/, label: 'current release sentence' },
    { file: PRERENDER, re: /<li>v([0-9.]+),/, label: 'version history list item' },
  ];
  for (const p of probes) {
    const text = read(p.file);
    if (!text) { problems.push(`Cannot read ${p.file}.`); continue; }
    const m = text.match(p.re);
    if (!m) {
      problems.push(
        `Version probe "${p.label}" not found in ${p.file}.\n` +
        `    If you reworded that copy on purpose, update the probe in scripts/check-doi-drift.mjs.\n` +
        `    A missing probe is treated as a failure so a reworded line cannot drift silently.`
      );
    } else if (m[1] !== truth) {
      problems.push(
        `Dataset version drift in ${p.file} (${p.label})\n    found v${m[1]}, ZENODO_VERSION says v${truth}`
      );
    }
  }
}

// --- Report ---
if (problems.length > 0) {
  console.error('DOI and version drift:\n');
  for (const p of problems) console.error(`  ${p}\n`);
  console.error('Rule: living pointer gets the concept DOI, fixed citation gets the version DOI.');
  console.error('Background: claude/DMTCODE_DOI_DRIFT_CHECKLIST.md in the DMTCode.com&Future repo.');
  process.exit(1);
}

const summary = [...seen.entries()]
  .map(([id, n]) => `zenodo.${id} x${n} (${DOIS[id].kind})`)
  .join(', ');
console.log(`DOI register in sync: ${summary || 'no DOI references found'}.`);
for (const n of notes) console.log(`  note: ${n}`);
