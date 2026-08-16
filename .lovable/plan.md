# Homepage "Instruments" section vs the real /prepare catalogue

## 1. What renders the homepage section

`src/pages/Home.tsx`. The section is inline in that file (heading "Instruments for careful observation" at line 276, the "Every kit ships with its full bill of materials published." line at 279, cards at 282-315).

Data source: a hardcoded module-level array `INSTRUMENTS` at the top of `src/pages/Home.tsx` (lines 20-50). Observer $109, Practitioner $159, Complete $349, each with `href: '/products/<handle>'` and a Shopify CDN image URL. Nothing fetches shop-json, Shopify, or Supabase for this section. A second stale copy of the same $109-$1,090 claim lives in `src/hooks/useDynamicMeta.tsx` line 68 (homepage meta description, including "Every bill of materials is published").

## 2. What renders /prepare

`src/pages/Prepare.tsx`, also a hardcoded module-level array `KITS` (lines 19-51): Solo $289 / Triad $649 / Circle $1,090, each with a `cart` Shopify permalink (`https://dmtcode-p4szt.myshopify.com/cart/<variantId>:1`), a `parts` count, and an image. No API call. The card CTA is a plain anchor to `kit.cart`, firing `gtag('event','bundle_cta_click')`.

## 3. /products/:slug routing

The route exists: `src/AppRoutes.tsx` line 313, `path="products/:handle"` to lazy `ProductDetail`, and `spa-guard.ts` whitelists `products`. So it is not a router fallthrough. `src/pages/ProductDetail.tsx` resolves the handle against Shopify Storefront plus the legacy `bundles` records and renders `NotFound` when neither resolves. The three legacy handles (`observer-kit`, `practitioner-kit`, `complete-kit`) no longer resolve after the /bundles retirement, so the page itself returns the 404 body. Confirming which of the two lookups is empty is a one-query check before the fix; the fix below does not depend on it.

## 4. Smallest change

Two files, one of them optional.

**`src/pages/Home.tsx`** (the only required edit)
- Replace the `INSTRUMENTS` array with the three real kits, mirroring `Prepare.tsx` values exactly: Solo / 1 observer / $289, Triad / 2 to 3 observers / $649, Circle / 6 observers / $1,090. Short display names ("Solo", "Triad", "Circle") with the observer count in the existing spec line, so the card layout is unchanged.
- Swap `href: '/products/...'` for the same Shopify cart permalinks used on /prepare, rendered as a plain `<a>` (target `_self`, `rel="noopener"`) labelled "Buy — secure Shopify checkout", matching the /prepare CTA. Keep a secondary text link to `/prepare` for full specs. This drops the dead `/products/*` links entirely. If you would rather not put checkout links on the homepage, the alternative is a single link per card to `/prepare` and no cart URL duplication; say which you prefer.
- Fire the same `gtag('event','bundle_cta_click', { kit, price })` on click so homepage conversions land in the existing funnel rather than going untracked.
- Add the availability line used on /prepare ("Ships in 7 to 10 business days. Free US shipping included. 18+, for research use.") under the price.
- Delete the "Every kit ships with its full bill of materials published." line. /prepare publishes only a part count (`parts: 219 / 516 / 883`), not an itemised BOM, so the claim is unsupported. Replace with a factual line referencing the published part counts, or nothing.
- Images: Solo and Circle have real Shopify CDN images in `KITS`; Triad has `image: null`. The card grid needs a neutral fallback for Triad rather than the old `kit-practitioner.jpg` asset.

**`src/hooks/useDynamicMeta.tsx`** (recommended, same defect)
- Line 68: correct the homepage meta description price range to $289 to $1,090 and remove the "Every bill of materials is published" sentence, for the same reason.

Not touched: `src/pages/Prepare.tsx`, `netlify/edge-functions/content-prerender.ts`, `public/llms.txt`, `public/downloads/*`, `AppRoutes.tsx`, `ProductDetail.tsx`.

Open question: leave `/products/:handle` in place (it still serves live Shopify handles) or 301 it to /prepare. Out of scope for this fix unless you want it included.

Deploy note: this ships through the Netlify `main` build, not Lovable Publish.
