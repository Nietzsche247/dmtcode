Lovable Prompting Bible for dmtcode.com
Overview
This document is the central filter for all Lovable/Claude Opus 4.5 prompts, ensuring expert-level edits (backend/admin first), visual polish (Meng To 2025 style), and zero AI artifacts (no TL;DR/em-dashes/lists). It incorporates Supabase Edge Functions for serverless tasks and self-updates every 10 prompts via integrated web search. Prefix all requests: "Per Bible: [request]". Target: Scholarly, human tone (active voice, paragraphs); mobile-first; multi-reward (SEO + a11y + analytics in every build).
Tech Stack Lock (Always Include)

Frontend: Next.js App Router, Tailwind CSS, Shadcn/UI components, Iconify Solar icons, Google Fonts (Inter Black/Light 300 for Meng To, Founders Grotesk Bold/Light Italic for scholarly).
Backend: Supabase DB/auth/RLS/Storage/Edge Functions, Prisma queries/migrations, PostHog analytics, cron-job.org for scheduling.
Colors: Dark mode #0f172a/#FFFFFF, red accent #C41E3A.
Preserve: All functionality (registry, events, store, submissions, data.json)—no regressions.

Expanded Auto-Update Protocol (Section 1.1)
Triggers after every 10th prompt or manual command ("Per Bible: Run Auto-Update Now"). Uses Lovable's web_search/x_keyword_search for queries; revises Bible in-place.

Trigger Conditions:
Automatic: Post-prompt #10, #20, etc. (track via session counter in Supabase or local state).
Manual: Explicit "Per Bible: Run Auto-Update Now".
Threshold: Only if material changes (e.g., >5% workflow impact); ignore minor bugs.

Query Phase (10–20 Seconds):
Primary (web_search): "Claude Opus 4.5 updates [current month/year] Lovable integration site:anthropic.com OR site:lovable.dev" (num_results=10). Focus: Features (e.g., endless chat), pricing, integrations.
Secondary (x_keyword_search): "Claude Opus 4.5 Lovable tips OR best practices since: [date - 30 days]" (limit=10, mode=Latest). Focus: Community (r/lovable, X threads).
Fallback: "Anthropic Claude Opus 4.5 release notes" or "Lovable changelog v2.1.3+".
Validation: Cross-check 3+ sources (e.g., anthropic.com vs. TechCrunch).

Analysis and Revision Phase (20–30 Seconds):
Extract: Key items (e.g., "Opus 4.5 endless chat: Update Do's for iterative sessions").
Categorize: Do's/Don'ts (new features), Best Practices (tools), Backend (RLS fixes).
Rules: Material only; append changelog (e.g., "v1.1: Added endless chat, Dec 3, 2025"); scholarly tone; no AI artifacts.
Output: Revised .md with diffs (New: [update]); flag for your review.

Integration and Logging Phase (5 Seconds):
Embed: Save to /docs/bible.md (Supabase Storage); link in /admin dashboard.
Logging: PostHog event "bible_update" (properties: version, changes_count, sources).
Notification: Supabase Edge Function emails: "Bible v[version] updated—[summary]" (via functions/send-notification).

Testing and Rollout:
Validate: Test prompt "Per Bible: Add sample event to /events" (no regressions).
Cap: Once/day; reset counter post-update.
Edge Cases: No changes → log "Stable—no revisions."


Example Trigger: "Per Bible: Execute Auto-Update Protocol." Output: Revised Bible + confirmation.
Do's (Essential Practices for 95%+ One-Try Success)

Context Lock: Open with tech stack lock (above).
Backend/Admin First: "Backend: Prisma migration for [table] (schema: [fields]); RLS: public read, owner write, admin full; Supabase Edge Function at functions/[name] for [task, e.g., email on submit]; cron-job.org weekly [scraper]; /admin/[resource] queue with Shadcn data-table, approve/deny/edit, PostHog tracking."
Structured Checklists: "Success criteria – every bullet true: [5–10 items, e.g., 'Route /events 200 with data; Lighthouse 95+']."
Visual/Interactive: "Meng To 2025: Inter Black headline, Light 300 subtext, beam CTA (1px #C41E3A glow, scale 1.05); fade/slide-in (both fill-mode, no opacity 0); Iconify Solar; mobile 44px targets."
Scholarly Tone: "Active voice, paragraphs, no AI artifacts (TL;DR, em-dashes, arrows/boosters like 'leverage'); specific/human (e.g., 'Document 3k+ glyphs')."
Tools/Addons: "Shadcn/UI components; PostHog events ('user_action'); Google Fonts; WAVE a11y (4.5:1 contrast, ARIA-live); test RLS circular policies."
Chain Iterations: "Phase 1: Backend; Phase 2: Visuals; validate each."
Self-Update: Every 10th: "Per Bible: Execute Auto-Update Protocol."

Don'ts (Pitfalls to Avoid)

Vague Specs: No "better"—use metrics (e.g., "180px timeline height").
Skip Backend: Always detail Prisma/Supabase (e.g., "Avoid circular RLS").
Overload: 1 feature/prompt (200–400 words).
Ignore Preservation: Always "No loss—preserve registry/events/store/data.json."
AI Artifacts: No TL;DR/em-dashes/lists—human paragraphs.
External Tools: Stick to Lovable kit (no Midjourney; Shadcn/PostHog/Supabase).
No Validation: Always criteria + "<Preview Latest>" (40% error risk otherwise).

Best Practices for dmtcode.com Edits/Upgrades

Template:
Context Lock.
"Implement [request]. Backend: [Prisma/RLS/Edge/cron]. Admin: /admin/[resource] queue."
"Visual: Meng To—Inter Black/Light, beam CTA; mobile Lighthouse 95+."
Nice-to-Haves: "SEO meta (title/description/OG:image); PostHog events; WAVE a11y; GA4; error boundaries; pagination; test no regressions."
"Success criteria: [list]. <Preview Latest>"

Backend/Admin:
DB/RLS: "Prisma upsert; RLS public read/owner write/admin full—test circular."
Admin: "/admin/[resource]: Shadcn table with approve/deny, search, Edge emails."
Integrations: "Supabase auth; PostHog ('submit_glyph'); cron ClinicalTrials.gov scraper (insert Prisma)."
Scalability: "Pagination 10/page; error boundaries fallback; 1k mock test."

Nice-to-Haves (Auto-Include):
SEO/Analytics: "Dynamic meta/OG; PostHog/GA4 events; schema for events/products."
A11y/Perf: "WAVE (alt/ARIA); Lighthouse 95+ (lazy/preload)."
Flows: "PWA manifest; touch 44px; subtle animations."
Monetization: "Affiliate wraps; trust badges."
Testing: "Cross-browser; console clean."

Length/Iteration: 200–400 words; phase complex. dmtcode.com: "Scholarly: Active voice, paragraphs, no AI lists/em-dashes/boosters."

Supabase Edge Functions (Backend Tool)

Use for: Webhooks, emails, crons, Stripe, moderation, scrapers.
Include: "Supabase Edge at functions/[name]; Deno runtime + service_role; /admin/functions logs/retry."
Example: await supabase.functions.invoke('send-notification', { body: { type: 'new_glyph' } }).
Never: Vercel actions—Edge is faster/cheaper/native.

Version History: v1.0 (Dec 3, 2025). Auto-update after 10 prompts.

Upload Instructions for Lovable
From the screenshot (Lovable Projects dashboard):

Click "Create new project" (bottom-right button) → name it "dmtcode-bible" or similar.
In the new project: Click the "+" (add file) in the file explorer (left sidebar, below "Explore").
Select "Upload files" from the dropdown → choose your dmtcode-bible.md from your device.
Or Paste in Chat: If no upload, paste the full .md content into the chat with "Create bible.md from this content" – Lovable will generate the file.