// Throwaway. Forces the static table through translate-content for es and de.
// Reads TRANSLATE_SHARED_SECRET out of the existing backfill scripts and never
// prints it. Prints only counts.
import { readFileSync, existsSync } from 'node:fs';

const CANDIDATES = [
  'C:/North_Star_Projects/DMTCode.com&Future/claude/dmtcode_i18n_backfill_v2_loop.ps1',
  'C:/North_Star_Projects/DMTCode.com&Future/claude/dmtcode_i18n_backfill_v2b_parallel.ps1',
  'C:/North_Star_Projects/DMTCode.com&Future/claude/dmtcode_i18n_backfill.ps1',
];

let secret = null;
let sourceFile = null;
for (const f of CANDIDATES) {
  if (!existsSync(f)) continue;
  const text = readFileSync(f, 'utf8');
  const m =
    text.match(/\$secret\s*=\s*['"]([^'"\r\n]{8,})['"]/i) ||
    text.match(/X-Translate-Secret'?\s*=\s*['"]([^'"\r\n]{8,})['"]/i) ||
    text.match(/TRANSLATE_SHARED_SECRET\s*=\s*['"]([^'"\r\n]{8,})['"]/i);
  if (m) {
    secret = m[1];
    sourceFile = f;
    break;
  }
}

if (!secret) {
  console.log('NO SECRET FOUND in any candidate script. Checked:');
  for (const f of CANDIDATES) console.log(`  ${existsSync(f) ? 'exists' : 'missing'}  ${f}`);
  process.exit(1);
}
console.log(`secret loaded from ${sourceFile.split('/').pop()}, length ${secret.length}`);

const FN = 'https://bbmhrgpsyiahefnxqwfg.supabase.co/functions/v1/translate-content';
const MAX_PASSES = 12;

for (const locale of ['es', 'de']) {
  console.log(`\n=== locale ${locale} ===`);
  for (let pass = 1; pass <= MAX_PASSES; pass++) {
    let res, body;
    try {
      res = await fetch(`${FN}?table=static&locale=${locale}`, {
        method: 'POST',
        headers: { 'X-Translate-Secret': secret },
      });
      body = await res.text();
    } catch (e) {
      console.log(`  pass ${pass}: NETWORK ERROR ${e.message}`);
      break;
    }
    if (!res.ok) {
      console.log(`  pass ${pass}: HTTP ${res.status} ${body.slice(0, 200)}`);
      break;
    }
    let j;
    try {
      j = JSON.parse(body);
    } catch {
      console.log(`  pass ${pass}: non-JSON ${body.slice(0, 200)}`);
      break;
    }
    console.log(
      `  pass ${pass}: checked=${j.checked} translated=${j.translated} skipped=${j.skipped} errors=${j.errors} pending=${j.pending}`
    );
    if (j.errors && j.errors > 0 && j.errorSample) console.log(`    errorSample: ${JSON.stringify(j.errorSample).slice(0, 300)}`);
    if (!j.pending) {
      console.log(`  ${locale} converged after ${pass} pass(es)`);
      break;
    }
    if (pass === MAX_PASSES) console.log(`  ${locale} STILL PENDING after ${MAX_PASSES} passes`);
  }
}
console.log('\ndone');
