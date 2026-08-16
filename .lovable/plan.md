# Translation engine + people pages: diagnosis

Measured today against the live database and the repo. No code changed.

## 1. Protocols: hypothesis is mostly refuted

Measurements:

- `protocols` has 9 rows total, all `is_published = true` (not 27). The "27" is 9 records x 3 fields; the "6" is 2 records (`ketamine`, `psilocybin`) x 3 fields, present in both locales. So 7 protocols are untranslated, per locale.
- Largest published `content_jsonb`: `ketamine-spravato`, 6,716 chars, 10 top-level string leaves. Next: `dmt-laser` 5,445 / 8 leaves. The rest are 1.5k-3.1k with 6-7 leaves. Nothing here is large enough to burn a 100 s budget on its own at normal gateway latency.

Code reality (`supabase/functions/translate-content/index.ts`):

- Line 131 and line 138: the `TIME_BUDGET_MS` check runs **after every field**, including after each `json` field. It does not only run at the end. So the stated cause ("budget only checked after the whole field") is wrong at field granularity; it is true only *inside* one `content_jsonb` (translateJson, lines 69-74, walks leaves sequentially with no budget check between leaves, each leaf allowed 45 s at line 49 - worst case 10 x 45 s = 450 s on one field).
- Line 142: `if (batch.length) await upsert(batch)` runs once per (table, locale), **after the whole row loop**, and it is also reached on the `pending` path. So a clean budget stop does write. Zero rows landing means the invocation never reached line 142: the runtime killed it, or every `translate()` call threw.
- Lines 130 and 137: `catch { stats.errors++ }` swallows the error text. A gateway 429 or a 45 s abort is indistinguishable from success-with-nothing-to-do in the response body.
- `supabase--edge_function_logs` for `translate-content` returns **no logs at all**. Either the function is not currently deployed (it was edited on 2026-08-16 and never redeployed) or the invocations are not reaching it. This must be confirmed before any code change - it may be the entire cause of the four no-op runs.

Smallest bounded fix (one file, `translate-content/index.ts`):

1. Move the upsert inside the row loop: flush `batch` after **each row** (and keep the final flush). Partial progress then survives any kill.
2. Add the budget check inside `translateJson`'s object/array walk, or simply check between leaves at the call site by passing a deadline, so one big `content_jsonb` cannot run 450 s.
3. Lower the per-call abort from 45 s to 20 s and record the caught error message in `stats` (last 3 errors, truncated) so the response says why.
4. Do **not** split `content_jsonb` into `content_jsonb.<key>` fields. `overlay()` in `netlify/edge-functions/content-prerender.ts` (lines 183-205) reassembles a jsonb field by `JSON.parse` of one stored string keyed by the exact column name; per-key fields would silently not apply, and `renderProtocolDetail` (line 3147) calls `overlay` generically. Reassembly is not trivial and is out of scope. Keep one field, flush per row.

## 2. /people/danny-goler content source

- SPA: `src/pages/PersonDannyGoler.tsx` (prose hardcoded in JSX, lines 83-201) and `src/pages/People.tsx` (index, lines 39-52).
- Prerender: `netlify/edge-functions/content-prerender.ts`, `renderPersonDannyGoler` body at lines 4300-4340 and `renderPeopleIndex` at 4343+, with the prose duplicated as an HTML literal.

There is no `people` table, so the nightly engine cannot touch it: `translate-content` reads Postgres rows only. Translating these pages requires a static mirror, exactly the `kits` / `ui-strings` pattern: one shared module holding en/es/de copy, mirrored between `src/` and `netlify/lib/`, with a drift-check script chained into `prebuild`. That is a separate build, not a config change.

## 3. CONFIG reorder

Safe. `CONFIG` (lines 16-33) is consumed only by the ordered loop at line 118; nothing keys off index or position, and `?table=` filters by name. Reordering to theories, guides, articles, protocols, events, retreats, bibliography, clinical_trials only changes who gets the budget first - which is the intent, since `clinical_trials` (544 rows) currently starves everything after it. No stored state, no migration.

## 4. translation_runs table

Nothing reads the stats object today: the only reference to `translate-content` outside the function itself is two generated graph reports. The JSON response goes to whoever curled it and is then lost.

Proposed additive migration:

```
create table public.translation_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  table_name text,          -- null = full sweep
  locale text,              -- null = all locales
  checked int not null default 0,
  translated int not null default 0,
  skipped int not null default 0,
  errors int not null default 0,
  pending boolean not null default false,
  note text
);
grant select on public.translation_runs to authenticated;
grant all on public.translation_runs to service_role;
alter table public.translation_runs enable row level security;
create policy "Admins read translation runs" on public.translation_runs
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
```

No anon grant, no public insert policy: the function writes with the service role, which bypasses RLS. One insert at the end of the handler, in both the success and the `catch` path, with `note` carrying the fatal message or the first few swallowed errors.

## Order of work, when approved

1. Confirm deploy state / why there are no logs.
2. `translate-content`: per-row flush, budget inside the jsonb walk, 20 s abort, error text in stats, CONFIG reorder.
3. `translation_runs` migration + insert.
4. People-page static locale mirror (separate build).
