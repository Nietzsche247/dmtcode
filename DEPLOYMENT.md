# Deployment

## Production hosting: Netlify

- Production hosting is **Netlify**, building from the `main` branch of this repo.
- `netlify.toml` and everything under `netlify/edge-functions/` are **LIVE and load-bearing**. They power the dynamic `/sitemap.xml` and the SSR/prerender layer for `/registry/*` and `/trials/*` that AI crawlers and Googlebot depend on.
- **Never remove `netlify.toml` or `netlify/edge-functions/`.** Removing them silently breaks crawlability and SEO with no visible frontend change.

## Editing: Lovable → GitHub → Netlify

- Lovable remains the editor. Lovable commits to this GitHub repo.
- The **Lovable "Publish" button no longer updates dmtcode.com**. Publishing to production happens via Netlify's build off `main`.
- To ship: merge to `main`; Netlify picks up the commit and rebuilds.

## Forecasts / Earth 2 layer — DO NOT DELETE

This repo contains a forecasts layer that reads from a **separate live Supabase project** (`nhpesihbzrxiherrqhfh`, referred to as "Earth 2"). That project is under active development by a different track and MUST NOT be treated as dead code.

Files that belong to this layer:

- `src/lib/forecasts-api.ts`
- `src/hooks/useCascadeEngine.ts`
- `src/components/forecasts/**`
- `supabase/functions/forecasts-proxy/` (reads Earth 2 via `EXTERNAL_SUPABASE_ANON_KEY`)
- `supabase/functions/forecasts-export/`

Rules:

- **Never delete, refactor, or "clean up" any file in this layer.**
- **Never remove `EXTERNAL_SUPABASE_ANON_KEY`** from project secrets.
- Any change that touches this layer (including "harmless" refactors, dependency bumps that affect it, or edits to the proxy allowlist) MUST be flagged explicitly and wait for approval before landing.

## Credential changes must update callers in the same change

Any change that adds a required credential (bearer secret, service-role key, admin role check, HMAC header, etc.) to an existing endpoint **MUST update every caller of that endpoint in the same change**. This includes `pg_cron` jobs, `supabase.functions.invoke()` call sites, and any external webhook sender.

**Browser-invoked functions must use role checks, never shared secrets.** A browser can never hold `CRON_SECRET` or the service-role key. If an endpoint is called from the frontend, gate it on a Supabase JWT plus a `has_role(..., 'admin')` (or equivalent) check. Reserve shared-secret bearers for machine-to-machine callers (pg_cron, external webhooks).
