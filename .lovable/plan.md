# Kit catalogue: single source of truth for agent surfaces

## 1. Findings (verified)

**renderPrepare inline array** — `netlify/edge-functions/content-prerender.ts`
- `const KITS = [...]` at lines **739-777** (solo 739-750, triad 751-761, circle 762-776), fields: `id, sku, name, price, parts, image, cart, description`.
- Readers of it:
  - `productLds` lines **798-820** (`k.id`, `k.name`, `k.description`, `k.sku`, `k.price`, `k.image`)
  - `itemListLd` lines **822-832** (`k.name`, `k.id`)
  - `kitBlocks` lines **860-...** (`k.id`, `k.name`, `k.image`, `k.price`, `k.parts`, `k.description`, `k.cart`)
  - `${kitBlocks}` is injected at line **891**.
- The "Field materials and protocols, free download" section (lines **893-908**) and the FAQ data (`~1506-1530`) / `renderFaq` are not touched by this change.

**Module** — `netlify/lib/kits.ts` / `src/data/kits.ts` carry `id, name, shortName, observers, price, priceNumber, cart, image, diyCost, diyCostNumber, availability, description`. No `sku`. `shop-json.ts` line 2 already does `import { KITS } from "../lib/kits.ts";`, so the same import works in `content-prerender.ts`.

**SKU decision:** add an optional `sku` field to both kits.ts files rather than a local map in renderPrepare. Reason: the SKU is catalogue data, one more thing an agent surface may need, and the existing `check-kits-drift.mjs` key-by-key diff covers it for free. A local map in the edge function would be a second place to edit.

**Name punctuation consequence:** the module names use typographic dashes (`— Solo`, `2–3 Observers`); the inline copy uses ASCII (`- Solo`, `2-3 Observers`). Switching to the module makes the prerendered HTML/JSON-LD names match the React page exactly. Kit names Solo/Triad/Circle, prices and cart URLs are unchanged.

**llms.txt** — `public/llms.txt`, 147 lines. No kit lines exist. `/shop.json` description is line **55** (old Supabase shape "kind, tier, people, ... items[]"). `/prepare` page line is **88**. "## Machine endpoints" heading line **52**, list ends line **71**; "## Free protocol documents" starts line **73**. Marker block goes **between line 71 and 73** (after the endpoint list, before "## Free protocol documents"), which is exactly your suggestion. The "## Free protocol documents" section (73-77+) stays untouched — the generator only rewrites text strictly between the markers, and updates line 55 in place.

**geo-drift.yml** — `prod-checks` job lines **55-122**; python heredoc starts line 61; `fetch(path)` helper is lines **65-73**, UA hardcoded `"geo-drift-audit"`. `repo-drift` job starts line **124**, first step `actions/checkout@v4`, no node setup (ubuntu-latest ships node 20, so plain `node scripts/check-kits-drift.mjs` works — confirmed, no setup-node needed).

**Other hardcodes (Q4)** — outside `public/downloads`, `public/agent`, `docs`:
- Only `src/data/kits.ts` and `netlify/lib/kits.ts` carry `$289 / $649 / $1,090` and `Solo (1 Observer)`; plus the inline copy at `content-prerender.ts:743`. No other file hardcodes a kit price.
- `observer-kit` survives in three legacy-Shopify places: `src/hooks/useBundleAvailability.tsx:7`, `src/components/CartDrawer.tsx:29`, `src/components/ShopSection.tsx:10`, and `public/_redirects:1` (`/products/observer-kit -> /prepare 301`). None render a price. Out of scope here, but they are why the CI "absent" assertion must be scoped to the four live URLs (/, /prepare, /faq, /llms.txt), not to the repo.
- No `$109` / `$159` / `$349` anywhere in src/netlify/public.

## 2. Proposed change (smallest)

**A. `src/data/kits.ts` + `netlify/lib/kits.ts`** — add `sku?: string` to the `Kit` type and `sku: 'KIT-SOLO-650' | 'KIT-TRIAD-MW' | 'KIT-CIRCLE-MW'` to the three entries, identically in both files.

**B. `netlify/edge-functions/content-prerender.ts`** — add `import { KITS } from "../lib/kits.ts";` at the top; delete the inline array (739-777); in `renderPrepare` map the module fields at the three read sites: `k.priceNumber` for price, `k.diyCostNumber` for parts, `k.sku`, `k.name`, `k.image`, `k.cart`, `k.description`, `k.id`. No other line in the function changes.

**C. `scripts/sync-llms-kits.mjs`** (new, dependency-free Node) — reuses the `extractKits()` reader from `check-kits-drift.mjs` (exported from that file, imported here, so there is one extractor). It rewrites only the region between `<!-- kits:start -->` and `<!-- kits:end -->` in `public/llms.txt` with:

```text
## Kits

- Solo — 1 observer — $289 — sourcing the parts yourself ≈ $219 — cart: <permalink>
- Triad — 2 to 3 observers — $649 — ≈ $516 — cart: <permalink>
- Circle — 6 observers — $1,090 — ≈ $883 — cart: <permalink>

Sold and shipped by Meridian Optics Lab; support info@dmtcode.com; free US shipping; arrives in 7 to 10 business days.
```

and replaces the `/shop.json` line (55) with the new field list: `slug, name, full_name, observers, price_usd, diy_parts_usd, availability, cart_url, image, url`. If the markers are absent the script inserts them after the "## Machine endpoints" list, before "## Free protocol documents". Idempotent: re-running produces no diff.

**D. `scripts/check-kits-drift.mjs`** — export `extractKits`, and add a third assertion: `public/llms.txt` must contain every kit's `price` string and `cart` permalink; otherwise exit 1 with "llms.txt is stale, run node scripts/sync-llms-kits.mjs".

**E. `package.json`** — `"prebuild": "node scripts/check-kits-drift.mjs && node scripts/sync-llms-kits.mjs"`. (Order per your spec; the generator writes the fresh file for the build, the checker guards the committed one.)

**F. `.github/workflows/geo-drift.yml`**
- `prod-checks`: change the helper to `def fetch(path, ua="geo-drift-audit")` and pass `"Mozilla/5.0 (compatible; Googlebot/2.1)"` where needed. Add:
  - fetch `/prepare` (Googlebot UA) and `/llms.txt`; for each of `$289`, `$649`, `$1,090` and the three cart permalinks (`...cart/54376696709430:1`, `54376697692470:1`, `54376698446134:1`) assert presence in **both** — 12 checks.
  - fetch `/`, `/prepare`, `/faq` (Googlebot UA) and `/llms.txt`; assert none contains `$109`, `$159`, `$349`, `observer-kit` — 4 checks.
- `repo-drift`: add a step after checkout, `run: node scripts/check-kits-drift.mjs` (ubuntu-latest has node preinstalled; no setup-node), so a mirror or llms.txt drift fails CI as well as the build.

## Not touched
`public/downloads/*`, the "## Free protocol documents" block, the renderPrepare downloads section, the FAQ data / `renderFaq`, `src/pages/FAQ.tsx`, any migration, the three cart permalinks, prices, kit names, kit contents claims.

## Human step after merge
Netlify deploy from `main` for the new prerender output and the regenerated `/llms.txt`.
