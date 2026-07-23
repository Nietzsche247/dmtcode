
# P4 Co-Witness + Context Tags — Unified Plan

Verified current state before planning:
- `symbol_tags` (0 rows), `symbol_tag_votes` (0), `surface_tags` (0), `tag_votes` (0) — scaffolds are empty, safe to reshape without data loss.
- `symbol_submissions`: 6 rows, has `tags text[]` and `surface_type text` (submitter-authored).
- `symbol_votes` seen_it: 0 rows today. Co-witness derivation must handle the empty case gracefully.
- `registry_glyphs` is a separate reference corpus; the live user-submitted convergence layer is `symbol_submissions` + `symbol_votes` (per prior repointing pass).

Convergence-data safety rule for every step below: NO writes, triggers, or recomputes touch `symbol_votes`, `symbol_submissions.upvotes/downvotes`, or submission rows. Co-witness and context-tag features READ these tables only.

---

## a) Data model

### Decision on the tag scaffold (no data loss — all scaffolds are empty)
- **Adopt `symbol_tags` as the single community-tag table.** Drop the parallel `surface_tags` + `tag_votes` scaffold (both empty) in a later cleanup step, after the new system is live. Until then they stay untouched.
- **Target unification on `symbol_tags`:** enforce that community tags attach to `symbol_submissions` only. `glyph_id` becomes deprecated (kept nullable for now, unused); `symbol_id` becomes the required FK to `symbol_submissions.id`. This matches the live convergence surface.
- **Introduce a `kind` column on `symbol_tags`** (`enum tag_kind`: `context` | `general`) so the community-tag table can hold multiple tag types cleanly without a second parallel table. Default `general` for back-compat; the new Community Context UI writes `kind='context'`.
- **Vocabulary control:** new `tag_vocabulary` table (`term text PK`, `category text`, `status text` in {`canonical`,`candidate`,`rejected`}, `usage_count int`, `promoted_at timestamptz`). Free-text "other" writes a `candidate` row; a candidate graduates to `canonical` once it crosses a usage threshold (details in step plan).

### Bucket A (PRIMARY / SUBMITTER context) — stays on the submission row
- Reuse existing `symbol_submissions.surface_type text` for the single canonical submitter-context value.
- Add `symbol_submissions.context_note text` (nullable) for the submitter's short free-text elaboration.
- Ownership: only the submitter can set/update these (already enforced by existing submission RLS). Never editable by others.
- Rendered with an explicit "Submitter's context" label everywhere.

### Bucket B (COMMUNITY context) — lives in `symbol_tags` with `kind='context'`
- Row shape: `symbol_id`, `user_id` (author of the community context), `tag_name` (must resolve to a `tag_vocabulary.term`, or a candidate), `kind='context'`, `upvotes int` (already exists), `created_at`.
- Uniqueness: `(symbol_id, user_id, tag_name)` unique — one user can attach multiple different context tags to the same symbol but not duplicate the same term.
- Votes: `symbol_tag_votes` (already exists) drives `upvotes` via the existing `update_tag_upvotes` trigger — reused as-is.
- Ownership/RLS:
  - INSERT: authenticated users, `auth.uid() = user_id`, and the user must NOT be the submitter of the target symbol (submitter uses Bucket A).
  - UPDATE/DELETE: only the tag author (`auth.uid() = user_id`).
  - SELECT: public read.
- Attribution: every community tag renders with the tagger's avatar + handle, so Bucket B is visibly distinct from Bucket A.

### Co-witness (P4) tables — all new, all opt-in
1. `co_witness_prefs` (user_id PK, `visibility` enum `private` | `pairs_only` | `wall`, `allow_high_five bool`, `created_at`, `updated_at`). Default `private`. A user is only eligible to appear in co-witness surfaces if visibility is `pairs_only` or `wall`.
2. `co_witness_high_fives` (`id`, `from_user`, `to_user`, `symbol_id`, `created_at`, unique `(from_user, to_user, symbol_id)`). Non-reciprocal insert; a "mutual high-five" is computed as the existence of both directions. High-fives are their own signal and never write to `symbol_votes`.
3. `co_witness_recollections` (`id`, `user_id`, `symbol_id`, `context_term` (nullable, references `tag_vocabulary`), `body text` capped ~500 chars, `created_at`). This is the common-recollection wall entry. Posting requires the user to already hold a `seen_it` on `symbol_id` (enforced by a policy USING clause that reads `symbol_votes`). Read-only against `symbol_votes`.

All three tables: RLS on, `authenticated` full CRUD scoped to `auth.uid() = user_id`, `service_role` all, public SELECT gated by `co_witness_prefs.visibility` for the counterparty.

---

## b) Deriving co-witness pairs without writing to convergence tables

A pair `(user_a, user_b, symbol_id)` is materialized on read via a SECURITY DEFINER view/RPC:

```text
FOR each symbol_id:
  co_witnesses := { u | exists row in symbol_votes where symbol_id=s and user_id=u and vote_type='seen_it' }
  eligible     := co_witnesses ∩ { u | co_witness_prefs.visibility in ('pairs_only','wall') }
  pairs        := unordered pairs from eligible
```

Implementation:
- `public.get_co_witnesses(_symbol_id uuid)` returns opted-in seen_it holders (join to `profiles` for handle/avatar_seed and to Bucket-A/B context).
- `public.get_my_co_witnesses(_user_id uuid)` returns, for each symbol the caller has seen_it, the set of other opted-in seen_it holders.
- Both functions ONLY `SELECT` from `symbol_votes` — never insert/update/delete/recompute. No triggers on `symbol_votes` are added.

This guarantees the co-witness bond is grounded in a real, honest recognition signal and cannot exist without one.

---

## c) UI surfaces + neutrality guardrails

### Symbol detail page (`/registry/:id`)
- New "Context" panel with two clearly labeled sections:
  - **Submitter's context** (Bucket A): the submission's `surface_type` chip + `context_note`, attributed to the submitter avatar. Read-only for everyone else.
  - **Community context** (Bucket B): chip list of `symbol_tags` where `kind='context'`, sorted by `upvotes`. Each chip shows the tagger's avatar. Upvote toggles via existing `symbol_tag_votes`. "Add the context you saw it in" opens the vocabulary picker (autocomplete on `tag_vocabulary` canonical terms; "Other..." captures a candidate). Only shown to authenticated non-submitters.
- New "Seen across these surfaces" strip: aggregates Bucket A + top-voted Bucket B terms into a small distribution. Purely descriptive, no belief language.
- New "Co-witnesses" module (only shown to viewers who themselves hold a `seen_it` on this symbol AND whose prefs are `pairs_only`/`wall`): "You and [avatar @handle] both recognized this. You on a wall, them on a cup." with an "I believe you" high-five button (reciprocal state shown when both sides have tapped). If viewer has no seen_it, module is hidden — no pressure to confirm.
  - Neutrality copy rules: never "the code is real", never "you were right"; use "you both recognized this symbol". Field-notes register, no em dashes.

### Common-recollection wall (`/wall` new route, linked from symbol page + profile)
- Feed of `co_witness_recollections`, filterable by symbol and by context term (Bucket B canonical vocab). Each card: avatar, handle, symbol thumbnail, context chip, short body.
- Only entries whose author has visibility `wall` appear here. `pairs_only` authors don't show up on the wall but can still appear in per-pair reveals.
- No open DMs, no reply threads in v1 — a single reciprocal "I believe you" gesture per (viewer, author, symbol) is the only interaction.

### Profile (`/profile`)
- New "Co-witness settings" card: visibility radio (private/pairs_only/wall), high-five toggle. Default private; explicit consent required to appear anywhere.
- New "Your co-witnesses" list (only if visibility != private): opted-in strangers you share a seen_it with, grouped by symbol, with each side's context shown.

### Submission wizard (existing `SubmissionWizard`)
- Add a required "Where did you see it?" step that writes Bucket A (`surface_type` + optional `context_note`). Uses the vocabulary picker.

Guardrails at every surface: strictly opt-in for co-witness; pseudonymous avatar+handle only; no PII fields anywhere; radical-neutrality copy; no belief badges; no push notifications in v1.

---

## d) Proposed context vocabulary (seed for `tag_vocabulary`, status='canonical')

Grouped by category. Free-text "Other" writes a `candidate` row.

```text
surface:   wall, ceiling, floor, window, mirror, door
object:    cup, mug, plate, book, page, screen, phone, keyboard
vehicle:   car interior, school bus, airplane cabin, train
body:      skin, closed eyelids, palm, arm
nature:    tree bark, leaf, water surface, cloud, sand, stone
architecture: tile, brick, carpet, curtain, fabric weave
lighting:  candlelight, sunlight, darkness, streetlight
other:     (free text -> candidate)
```

Category is stored on `tag_vocabulary` so the UI can group chips by category and the wall can filter by category as well as term.

---

## e) Build sequence (small, independently verifiable, guardrail-checked)

Each step ends with an explicit **Convergence-safety check**: confirm no code path in the diff writes to `symbol_votes` or `symbol_submissions.upvotes/downvotes`.

1. **Vocabulary foundation.** Create `tag_vocabulary`, seed canonical terms above. RLS: public read; insert restricted to authenticated as `status='candidate'`; only admins promote to `canonical`. Verify by listing terms and inserting a candidate. Safety check: no touch of convergence tables.

2. **Bucket A upgrade.** Add `symbol_submissions.context_note`. Wire the submission wizard to write `surface_type` + `context_note` from the vocabulary picker. Backfill nothing. Existing 6 rows keep their current values (1 already has `surface_type`). Safety check: write only to columns not involved in vote math.

3. **Bucket B model.** Add `tag_kind` enum + `kind` column to `symbol_tags` (default `general`). Add uniqueness `(symbol_id, user_id, tag_name)`. Tighten RLS: `symbol_id` required for new inserts; author cannot be submitter; INSERT/UPDATE/DELETE scoped to `auth.uid()`. Keep existing `update_tag_upvotes` trigger. Safety check: trigger only mutates `symbol_tags.upvotes`.

4. **Bucket B UI on symbol page.** Render two labeled sections (Submitter's context vs Community context). Chip picker for authenticated non-submitters. Upvote via existing `symbol_tag_votes`. Safety check: reads `symbol_votes` only for eligibility gates, never writes.

5. **"Seen across these surfaces" strip.** Read-only aggregation of Bucket A + top-voted Bucket B for the symbol. Safety check: pure SELECT.

6. **Co-witness prefs + opt-in UI.** Create `co_witness_prefs`, add Profile settings card. Default private. Safety check: unrelated to `symbol_votes`.

7. **Co-witness derivation RPCs.** Add `get_co_witnesses(_symbol_id)` and `get_my_co_witnesses(_user_id)` (SECURITY DEFINER, READ-ONLY on `symbol_votes`, joined to prefs + profiles). Safety check: explicit `LANGUAGE sql STABLE`, no DML in body.

8. **Co-witness module on symbol page.** Show only if viewer holds a `seen_it` AND has non-private prefs. Copy uses each side's Bucket A context ("you on a wall, them on a cup"). Safety check: no vote writes on render.

9. **High-fives.** Create `co_witness_high_fives`. Button on co-witness module. Show reciprocal state. Safety check: writes only to `co_witness_high_fives`.

10. **Common-recollection wall.** Create `co_witness_recollections` (INSERT policy requires an existing `seen_it` for the author on the symbol — the policy's USING/CHECK clause reads `symbol_votes` but never writes). Build `/wall` with symbol + context filter. Safety check: policy is `SELECT` on symbol_votes only.

11. **Candidate → canonical promotion.** Admin-only surface (or scheduled job) that promotes `tag_vocabulary` candidates crossing a usage threshold (proposal: appears in `>= 5` distinct users' Bucket B entries or `>= 10` total). Safety check: mutates `tag_vocabulary` only.

12. **Cleanup.** After Bucket B is live and stable, deprecate `surface_tags` and `tag_votes` (still empty). Drop only after explicit approval. Safety check: both tables confirmed empty at cleanup time.

---

## f) Open questions

1. **Submitter cross-tagging:** should the submitter be allowed to add Bucket B community context tags to their OWN symbol (in addition to Bucket A), or are they locked to Bucket A only? I'd default to locked, to keep buckets clean.
2. **Multiple submitter contexts:** if the submitter saw the same symbol on more than one surface, do we keep `surface_type` singular (one canonical) or extend Bucket A to an array? Singular keeps the two buckets asymmetric and simple; array is more honest but muddier.
3. **Candidate promotion thresholds:** confirm the "≥5 distinct users OR ≥10 uses" rule, or set your own.
4. **Wall moderation:** v1 recollections are user-deletable and admin-removable; do you also want a lightweight report button, or defer?
5. **Co-witness eligibility for the reverse-auth first-time seen_it:** the RPC treats every `seen_it` row equally. Confirm that's desired (the reverse-auth flow inserts a real row, so it should qualify).
6. **`registry_glyphs`:** confirm the context-tag system stays scoped to `symbol_submissions` only (matches the convergence-source repointing). I'm assuming yes.
7. **Wall route name:** `/wall` vs `/recollections` vs `/co-witnesses` — preference?
