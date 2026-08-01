# DMTCode — Essence & Experience Audit Handoff

For the next agent (or Otis). The GEO/machine layer is audited and self-monitoring
(see `.github/workflows/geo-drift.yml`). This handoff covers the layer no automated
check can reach: **is the product complete, connected, functional, and true to what
the site is for — and does the member experience actually engage anyone?**

Method contract (unchanged from `docs/agent/OTIS_PROMPT.md`): graph → source →
production/DB, label every claim by the layer that proves it, verify before edit,
bounded Lovable prompts for fixes. Read `AGENTS.md` and the Lovable Project
Knowledge first.

---

## 0. The essence, stated once (your rubric for Track 3)

From `public/llms.txt` and Project Knowledge, the site's identity is exact:

> A research surface for a specific unproven claim: that unrelated people report
> the same discrete visual forms under 650nm laser exposure and N,N-DMT. Its value
> is that it does NOT overclaim. "We do not know yet whether the phenomenon is
> real" is the house position **and it is a feature.**

Everything in this audit is measured against that sentence. And name the structural
tension honestly: the Lovable project description also calls this an **"affiliate
storefront"** with product bundles. Research record and storefront coexist by
design — the audit question is never "should the shop exist" but **"does shop
framing ever leak into evidence surfaces, and does any surface trade precision for
persuasion?"**

---

## 1. How to use the graph for THIS audit

Fresh artifacts land nightly in `docs/agent/` (CI-refreshed; manifest freshness is
now trustworthy — it compares against origin). Three uses:

1. **Orphan hunting (Track 2).** `GRAPH_REPORT.md` → "Knowledge Gaps" lists ~1,000
   isolated nodes (≤1 connection). Most are schema noise; the signal is any
   isolated node whose `source_file` is a page or feature component. Load
   `graphify-graph.json` (`nodes` / `links` keys), filter nodes with
   `source_file` under `src/pages/` or `src/components/`, count their edges.
2. **Feature tracing (Tracks 4–5).** Component → hook → table paths ARE
   import-shaped, so the graph is reliable here (unlike the edge layer). To test a
   tool, first pull its subgraph and you have its full dependency list.
3. **Community review.** Communities with cohesion < 0.10 that mix unrelated
   concerns are candidates for the "doesn't hang together" feeling — evidence for
   Track 3, not a refactor mandate.

Blind spots still apply: `netlify.toml`, `_headers`, `_redirects`, robots/llms,
edge functions have no graph edges. And the graph proves *existence*, never
*function* — a fully-wired component can still be broken in the browser.

---

## 2. Seeded findings — measured 2026-08-01, live DB [P]

Do not re-derive these; start from them.

### Track 1 · Content completeness

| Gap | Measured | Severity |
|---|---|---|
| **Bibliography summaries** | **51 of 65 approved rows (78%) have NO summary** | High — the "research library" is mostly bare citations; also degrades /bibliography prerender + data.json quality |
| Symbol descriptions | 12 of 44 approved empty or <20 chars | Med — weakens registry pages, tag hubs, SEO titles |
| Glyph notes | 13 of 23 registry glyphs have no free-text notes | Low-med |
| Articles | 2 published, 0 missing deks | Healthy but tiny corpus |
| Guides | **1 published guide, total** | The "canonical answers" surface is 95% empty shelf |
| Theories / protocols / events / retreats | 0 missing summaries/taglines/details | Clean |

SQL for re-measuring is in §5. Fix path: bibliography summaries are operator
content work (possibly agent-drafted, operator-reviewed — flag for Aaron);
symbol descriptions belong to submitters — consider a gentle "add context"
prompt on /my-symbols rather than operator backfill.

### Auth & access — state as of e7c951c (read before Track 4/5 testing)

- **OAuth redirect fix is deployed.** `e7c951c "Fixed Google OAuth redirect"` on
  `main`: on non-Lovable origins (dmtcode.com), Google/Apple go directly through
  Supabase's own callback instead of the Lovable broker. The push auto-deployed
  via Netlify, and geo-drift run #3 health-checked production green minutes after.
  **What remains untested: the OAuth flow itself in a real browser on
  dmtcode.com.** That is a Track 4 item — exercise Google sign-in on production
  and confirm the session lands (first real member-flow test should double as
  this verification).
- **The admin account is Google-only** (verified [P]: `has_password: false`,
  `providers: ["google"]`). Email/password login cannot work for it until a
  password is set. Do not "fix" this without Aaron; it may be intentional.
- **www is a non-issue** (verified [P]): `www.dmtcode.com` is a CNAME that 301s
  to the apex before any page loads, so the Supabase redirect allow-list does not
  need the www host.
- Test accounts for member flows: email signup is the clean path (avoids OAuth
  entirely); the OAuth path gets tested once, deliberately, as its own item.

### Track 5 · Engagement — the headline finding

**The member machinery is fully built and almost completely dormant:**

| Signal | Value |
|---|---|
| Profiles (signups) | **80** |
| saved_symbols | **0** |
| symbol_responses ("seen it" / responses) | **0** |
| co_witness_recollections | **0** |
| symbol_tags (community tagging) | **0** |
| voice_logs | 1 |
| assessments | 1 |
| user_stats rows | 1 |
| badges awarded | 5 (of 19 defined) |

Eighty people signed up and then did approximately nothing. That is either a
funnel problem (they can't find the tools), a value problem (no reason to
return), or a wiring problem (actions fail silently). **Distinguishing those
three is this audit's most valuable output.**

First wiring pass already done (2026-08-01, [P]) — use it, don't redo it:

- `auth.users` = 80 = `profiles` 80 → signup→profile creation works.
- INSERT policies exist and permit the dormant actions (`saved_symbols`,
  `symbol_responses`, `co_witness_recollections`, `user_stats`) → **dormancy is
  NOT RLS-blocked.** The writes are allowed; they simply never happen.
- Trigger inventory [P]: `award_submission_badges_trg` + `award_vote_badges_trg`
  (symbol_submissions/symbol_votes), `update_stats_on_submission` fires on
  **registry_glyphs only** — user_stats is keyed by `session_id` (text), not
  user_id, which explains 1 stats row vs 80 members: the streak/stats system
  tracks anonymous capture sessions, not member accounts. Decide whether that is
  intended before calling it a bug.
- Remaining wiring question for the browser pass: do the UI controls (SaveButton,
  SeenItButton, response panel) actually appear where members are, and do their
  calls succeed? Everything below them is proven permitted.

So the prior is now: **funnel or value, not permissions.** The browser pass
settles it.

---

## 3. The five tracks

### T1 — Content completeness
Method: SQL in §5 → for each gap, decide operator-backfill vs contributor-prompt
vs leave-and-label. Deliverable: gap table + one bounded Lovable prompt per fix
class. Never fabricate content to fill a hole — empty and labeled beats invented
(house precedent: `removed_2026_07_29`).

### T2 — Connectivity & orphans
Method: (a) graph orphan pass from §1; (b) **nav reachability**: extract link
targets from `Navigation.tsx`, `MegaMenu.tsx`, `Footer.tsx`, homepage sections;
diff against the route table in `App.tsx` and spa-guard's `VALID_FIRST_SEGMENT`.
Routes that render but are linked from nowhere = invisible features (likely
suspects to check: /capture, /co-witnesses, /analysis, /correlations,
/leaderboard, /Elizabeth_Baker). (c) dead-end pages: pages with no onward links
into the record. Deliverable: reachability matrix — every route × {in nav, in
footer, in sitemap, linked from content, orphaned}.

### T3 — Essence & mission alignment
Method: for every public page, three questions against §0: does it state
uncertainty where it touches evidence? does it keep the three status dimensions
separate (no collapsed "verified" badges)? does shop framing leak into research
surfaces? Check the seam pages hardest: /prepare (the shop), homepage (44-symbol
count vs 23-symbol export framing), /protocol-guide, product cross-links inside
research pages. Also voice: sober, cite-the-row, invite-critique — flag any page
that reads like marketing. Deliverable: per-page verdict list with quoted lines,
not vibes.

### T4 — Do all tools work
Inventory (from graph + routes): drawing canvas + submission wizard (/submit-symbol),
capture flow (/capture), voice recorder + transcription (/log), assessments
PHQ9/GAD7/CEQ7/MEQ4 (/assess) + PDF export + therapist share, what-if simulator
(/forecasts), iCal export, social share, seen-it button, tag manager, similar
button, co-witness invites, TTS (ReadToMe), convergence card PNG (/card/:id.png),
RSS, downloads on /dataset.
Method per tool: graph-trace its table → exercise it in the browser (Playwright
against production or the Lovable preview for anon flows; a throwaway member
account for auth flows — signup is open email auth) → **verify the write landed
via `query_database`** (Lovable's word and the UI toast both don't count) → check
the edge artifacts it should produce. Deliverable: tool × {renders, acts, persists,
round-trips} matrix. Anything failing silently is a Track 5 suspect.

### T5 — Member experience & engagement
Method: walk the member journey end to end as a new user: signup → what does the
dashboard show a person with zero content? → submit a symbol → does anything
acknowledge it, show moderation state, invite the next action? → return next day:
is there any reason to? Cross-check each engagement mechanism (badges, streaks,
high-fives, follows, saved symbols, responses) for: does the trigger fire [DB],
does the UI surface it [browser], does anything *invite* it [UX]. The 80-vs-0
numbers say at least one link in that chain is broken for every mechanism.
Deliverable: funnel diagnosis — for each mechanism: wired? / surfaced? / invited?
— plus the three cheapest fixes ranked by expected engagement effect.

---

## 4. Rules of engagement

- Evidence layers on every claim: [G]raph / [S]ource / [P]roduction-DB / [B]rowser.
- The graph proves existence, not function. The UI proves function, not persistence.
  Only the DB proves persistence. A tool "works" when all three agree.
- All fixes through Lovable, bounded, with [VERIFY] blocks. Content backfill
  (bibliography summaries) needs Aaron's sign-off on approach before bulk work.
- Member-flow testing: create ONE throwaway account, label it obviously
  (display_name "audit-test — not a member"), and list it in the report for
  deletion. Never touch real member rows. Never write to the never-anon-readable
  tables except through the product's own UI.
- Engagement recommendations must respect the epistemic contract — no dark
  patterns, no fake urgency, no inflated counts. Engagement here means: make the
  next honest action visible and worth taking.
- The nightly geo-drift workflow guards the machine layer; don't re-audit it.

## 5. Re-measurement SQL (Track 1 / Track 5)

```sql
-- content gaps
select
 (select count(*) from bibliography where is_approved and (summary is null or length(trim(summary))=0)) as bib_no_summary,
 (select count(*) from symbol_submissions where status='approved' and (description is null or length(trim(description)) < 20)) as sym_thin_desc,
 (select count(*) from registry_glyphs where free_text_notes is null or length(trim(free_text_notes))=0) as glyphs_no_notes,
 (select count(*) from guides where is_published) as guides_pub;
-- engagement pulse
select
 (select count(*) from profiles) as members,
 (select count(*) from saved_symbols) as saves,
 (select count(*) from symbol_responses) as responses,
 (select count(*) from co_witness_recollections) as cowitness,
 (select count(*) from symbol_tags) as community_tags,
 (select count(*) from voice_logs) as voice_logs,
 (select count(*) from assessments) as assessments,
 (select count(*) from user_badges) as badges_awarded,
 (select count(*) from user_stats) as stats_rows;
```

## 6. Suggested order

1. **T5 wiring check first** (is the dormancy a bug?) — cheapest high-value answer:
   trace badge/stats/response triggers, exercise one submit + one response with the
   test account, verify rows land.
2. **T2 reachability matrix** — if tools are unreachable, T5's funnel explanation
   writes itself.
3. **T4 tool matrix** — full pass.
4. **T1 content gaps** — bibliography summaries plan to Aaron.
5. **T3 essence pass** — last, so it can cite everything found above.

Report drift/gaps/diagnosis before editing anything. One report per track,
evidence-labeled, with a ranked fix list and Lovable-ready prompts.
