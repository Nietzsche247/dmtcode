# Single source of truth for the three kits

## 1. Diagnosis: where kit data lives today

Live catalogue (Solo $289 / Triad $649 / Circle $1,090) is duplicated in three places, and stale legacy catalogue data survives in four more.

Current live-kit duplicates:
- `src/pages/Prepare.tsx:19-50` — `KITS` array: names, prices, parts figures, images, Shopify cart permalinks, descriptions.
- `src/pages/Home.tsx:20-50` — `INSTRUMENTS` array: slug, name, spec line, price string, image.
- `src/hooks/useDynamicMeta.tsx:67-73` — `bundles` entry, "$289 to $1,090" written by hand.

Stale legacy references found by the requested string search:
- `src/hooks/useDynamicMeta.tsx:32` — `tools` entry still says "Kits and group bundles from $109 to $1,090. Bills of materials are published in full."
- `src/hooks/useBundleAvailability.tsx:6-13` — `bundleShopifyHandles` maps `k1-observer`, `k2-practitioner`, `k3-instrument`, `k4-complete` to dead Shopify handles.
- `src/components/ShopSection.tsx:10` — `FEATURED_HANDLE_ORDER` lists `complete-kit`, `practitioner-kit`, `observer-kit`.
- `src/components/CartDrawer.tsx:29-32` — legacy handle-to-tier map (`observer-kit`, `practitioner-kit`, `complete-kit`).
- `public/_redirects:1-3` — already 301s the three legacy product handles to `/prepare` (correct, leave as is).

Supabase `bundles` / `bundle_items` table is read by: `netlify/edge-functions/shop-json.ts:26-35`, `src/pages/ProductDetail.tsx:145,151`, `src/components/EmailCapture.tsx:28,49`, `src/components/admin/ConversionFunnel.tsx:168`, `src/components/admin/KitSignups.tsx:34`. Only `shop-json.ts` publishes that stale data to the public web, which is why `/shop.json` still advertises Observer $109 and Practitioner $159.

## 2. Diagnosis: edge functions, mirroring, and drift checking

- A Netlify edge function cannot import from `src/`. Deno resolves relative specifiers with explicit `.ts` extensions and no Vite `@/` alias, and the `src/` tree is not part of the edge bundle. The existing working precedent is `netlify/edge-functions/content-prerender.ts:2`, which imports `../lib/ui-strings.ts`. So `netlify/lib/kits.ts` is a safe, proven location for a mirrored copy imported as `../lib/kits.ts`.
- Vitest is not configured: `package.json` scripts are only `dev`, `build`, `build:dev`, `lint`, `preview`; there is no vitest dependency and no `test` block in `vite.config.ts`; `scripts/` contains only `route_parity.py`.
- `netlify.toml` has no `[build] command` — only `publish = "dist"`, so Netlify runs the default `npm run build`.
- Smallest drift check that therefore actually gates a deploy: a dependency-free Node script `scripts/check-kits-drift.mjs` that reads both files and compares the normalized kit payload, wired as `"prebuild": "node scripts/check-kits-drift.mjs"` in `package.json`. npm runs `prebuild` automatically before `build`, so it gates local builds and the Netlify build with no new dependency and no test runner.

## 3. Diagnosis: are the three legacy modules live?

- `src/hooks/useBundleAvailability.tsx` — **USED**. Imported by `src/pages/ProductDetail.tsx:14` (`bundleShopifyHandles`), which is routed at `/products/:handle`. Do not delete; out of scope here.
- `src/components/CartDrawer.tsx` — **USED**. Imported and rendered by `src/components/Navigation.tsx:4,148,174`, so it is on every page. Do not delete.
- `src/components/ShopSection.tsx` — **UNUSED on any live route**. Its only importer is `src/pages/Index.tsx:11,96`, and `src/pages/Index.tsx` is imported by nothing; `src/AppRoutes.tsx:96` renders `Home` at the index route. Deleting either file would build clean, but that is a separate cleanup and is not part of this change.

## 4. The change

Create one typed catalogue module, mirror it for Deno, and make every current hardcode read from it. No visual change, no price change, no name change, no new permalinks.

Files created:
1. `src/data/kits.ts` — exports `KITS` with `{ id, name, observers, price, priceNumber, cart, image, diyCost, diyCostNumber, availability, description }` for solo/triad/circle, plus a derived `KIT_PRICE_RANGE` string. Values copied verbatim from the current `Prepare.tsx` `KITS` array and `Home.tsx` `INSTRUMENTS` spec/price strings.
2. `netlify/lib/kits.ts` — byte-equivalent mirror of the kit payload, Deno-safe (no imports, no aliases), for edge-function use.
3. `scripts/check-kits-drift.mjs` — compares the two files' kit payloads and exits non-zero on any difference.

Files modified:
4. `src/pages/Prepare.tsx` — delete the local `KITS` array and the local `Kit` type, import both from `src/data/kits.ts`. Rendering untouched.
5. `src/pages/Home.tsx` — delete the local `INSTRUMENTS` array, derive the same three cards from the imported `KITS` (spec line built from `observers`, `href` fixed to `/prepare`). Rendering and analytics untouched.
6. `src/hooks/useDynamicMeta.tsx` — derive the price range in the `bundles` and `tools` descriptions from `KIT_PRICE_RANGE` instead of the hardcoded "$289 to $1,090" and "$109 to $1,090", and drop the stale bill-of-materials sentence from `tools`.
7. `netlify/edge-functions/shop-json.ts` — stop querying Supabase `bundles`/`bundle_items`; emit the three kits from `../lib/kits.ts` in the same JSON envelope shape (license, source, generated_at, bundles array with slug/name/price_usd/url).
8. `package.json` — add `"prebuild": "node scripts/check-kits-drift.mjs"`.

Nothing else is touched. Specifically unchanged: `public/downloads/*`, `public/llms.txt`, `netlify/edge-functions/content-prerender.ts`, `src/pages/FAQ.tsx`, all Supabase migrations, the three Shopify cart permalinks, prices, and kit names.

## Verification after implementation

- `rg -n '\$289|\$649|\$1,090' src` returns hits only in `src/data/kits.ts`.
- `rg -n '\$109' src` returns zero matches.
- Build passes with `prebuild` running; deliberately editing one price in `src/data/kits.ts` makes `npm run build` fail.
- `/prepare` and `/` render byte-identically to today.

## Needs a human step

Netlify must redeploy for the new `/shop.json` output to go live; the stale Supabase-backed JSON persists on the CDN until then (it carries a 1-hour `s-maxage`).
