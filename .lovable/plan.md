# Locale mirrors: human-visible fixes (diagnosis + smallest bounded changes)

Diagnosis only below, each with the smallest bounded change. Page-body translation is out of scope.

## 1. Where runtime title / meta description come from

There is **no shared SEO hook**. Three mechanisms coexist:

- **`react-helmet` (not `react-helmet-async`)**, `package.json:63`, imported per page. Example: `src/pages/Theories.tsx:2, 242-253` hardcodes English `<title>Open Theories about the DMT Code | DMT Code</title>`, description, canonical `https://dmtcode.com/theories`, og:*. Same pattern in `src/pages/Prepare.tsx:1, 89-96`, `src/pages/FAQ.tsx:4, 136-153`, and ~50 more pages (`rg -l Helmet src/pages` = most of the directory). These are locale-blind, hardcoded English literals — this is exactly why the prerendered Spanish title is overwritten on hydration.
- **`src/hooks/useDynamicMeta.tsx`** — a research/explorer mode dictionary for 6 keys only (home, tools, bibliography, registry, events, bundles). Consumed by `src/pages/Home.tsx` only. No locale awareness.
- No direct `document.title =` writes in page code (only `useGA4PageTracking` reads it).

Smallest bounded change: add one shared component `src/components/SEO.tsx` that wraps `Helmet`, takes a `uiKey`, reads `useLocale()`, pulls title/description from the shared string module (item 2), and self-references canonical/og:url via `localePath(locale, path)`. Then swap the Helmet block on the locale-mirrored index pages only (theories, faq, prepare, registry, articles, guides, timeline, evidence-map, trials, bibliography, retreats, protocols, home) to `<SEO uiKey="theories" path="/theories" />`. English output must stay byte-identical to today where a key already matches, so the change is invisible for `en`.

## 2. The prerender locale dictionary and whether it can be shared

- It already lives in a shared module: **`netlify/lib/ui-strings.ts`** (608 lines), imported at `netlify/edge-functions/content-prerender.ts:2`.
- Shape: `UI_STRINGS: Record<string, Record<"en"|"es"|"de", { title: string; description: string }>>`, plus `uiCopy(key, locale, vars?)` at `ui-strings.ts:594-608` with English fallback and `{var}` interpolation. 26 keys today: home, theories, articles, guides, retreats, faq, timeline, people, prepare, protocols, registry, trials, bibliography, dataset, about, critiques, events, glossary, methods, research, forecasts, privacy, terms, disclosure, capture, join.
- Call sites: `content-prerender.ts:736, 894, 1121, 1135, 1504, 2319, 2600, 2985, 3582, 4029, 4379`.

The edge function cannot import from `src/`, and the SPA cannot import from `netlify/lib/`. So use the **kits mirror pattern**: `src/data/kits.ts` is the source of truth, `netlify/lib/kits.ts` is the hand-copied mirror, and `scripts/check-kits-drift.mjs` (wired as `prebuild` in `package.json:8`) parses both files and fails the build on any field mismatch.

Bounded change: create `src/i18n/ui-strings.ts` as the SPA-side mirror of `UI_STRINGS` + `uiCopy` (identical content, TS instead of Deno import style), and add `scripts/check-ui-strings-drift.mjs` chained into the existing `prebuild` script. Direction of authority to be declared in a header comment, matching kits ("edit the src file first, then copy").

## 3. Why the breadcrumb shows "Home / Es / Prepare"

- `src/components/Breadcrumb.tsx:5-6`: `const pathnames = location.pathname.split('/').filter(Boolean)`. There is no hook — crumbs are derived inline from the raw pathname, so on `/es/prepare` the first segment `es` becomes a crumb. `es` is absent from `breadcrumbNameMap` (lines 8-48) so the fallback title-caser at lines 66-69 renders it as "Es". The Home crumb at line 54 is hardcoded `to="/"`, which drops a Spanish visitor back to English.

Bounded change, one file:
- Import `useLocale, localePath` from `@/i18n/LocaleProvider`; drop a leading segment when it is the active non-`en` locale before mapping.
- Build each crumb `to` with `localePath(locale, ...)`, and make the Home crumb `to={localePath(locale, '/')}`.

## 4. Language switcher placement

- Header: `src/components/Navigation.tsx`. Desktop cluster at lines 145-171 (ModeToggle / ThemeToggle / CartDrawer / auth). Mobile: toggle cluster at 174-186 and the open panel at 190+.
- Footer: `src/components/Footer.tsx`, bottom utility row at lines 186-228 (CC-BY, data.json, Privacy, Terms, ...).

Bounded change: one new `src/components/LanguageSwitcher.tsx` rendering exactly three plain `<a href>` anchors (not `Link`, not buttons) — EN / ES / DE — each pointing at the current `location.pathname` re-prefixed via `localePath`, with `hreflang="en|es|de"`, `aria-current="true"` on the active one, and a labelled `<nav aria-label="Language">`. Mount it in three places: the desktop header cluster, the top of the mobile menu panel, and the footer utility row.

## 5. `useLocale()` availability and header/footer links needing `localePath`

- `LocaleProvider` wraps `AppRoutes` for all three trees in `src/App.tsx:43-45, 51-53, 59-61`, and `Navigation`/`Footer` render inside pages inside `AppRoutes`, so `useLocale()` is available in both. `src/i18n/LocaleProvider.tsx:11-14` already exports `localePath`.
- Header links that would strand a Spanish visitor in English:
  - `Navigation.tsx:80-83` `handleNavigation(path)` → bare `navigate(path)`, used by the logo (line 137), the mobile Home button (line 194), and every mobile menu item built from `researchItems` (93-103), `explorerItems` (105-110), `resourceItems` (113-121).
  - `Navigation.tsx:87-90` `goToAuth()` → `/auth?returnTo=...`.
  - `Navigation.tsx:76` sign-out `navigate('/')`.
  - `MegaMenu.tsx:76` (the generic desktop item `Link to`), `MegaMenu.tsx:99` `isActive` comparison against `location.pathname`, and `MegaMenu.tsx:135` `to="/about"`.
- Footer links: every `Link to` in `Footer.tsx` — lines 39, 44, 49, 54, 59, 64, 69, 74, 79, 86, 91, 96, 101, 106, 111, 116, 121, 126, 137, 142, 147, 152, 181, 204, 207, 210, 213, 216. External anchors (Zenodo/DOI line 20 and 220, CC line 190, `/data.json` line 199) stay unprefixed.

Bounded change: route header and footer internal navigation through one `localePath(locale, path)` call — a single `to()` helper in `Footer.tsx`, the same inside `handleNavigation`/`goToAuth` in `Navigation.tsx`, and the item mapper plus `isActive` in `MegaMenu.tsx`. No other site links touched.

## Suggested build order (each independently shippable)

1. Breadcrumb locale strip (1 file).
2. Language switcher component + 3 mount points.
3. Header/footer `localePath` pass.
4. `src/i18n/ui-strings.ts` mirror + drift check, then the `SEO` component swap on locale-mirrored index pages.
