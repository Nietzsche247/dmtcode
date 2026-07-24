// This function is duplicated verbatim in netlify/edge-functions/content-prerender.ts
// and netlify/edge-functions/sitemap.ts. Netlify edge functions run in Deno and cannot
// import from src/. If you change this, change all three copies or theory URLs will
// silently diverge between the app, the prerender layer and the sitemap.
export function theorySlug(title: string): string {
  return String(title || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2018\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

type TheoryLike = { id?: string | null; title?: string | null; created_at?: string | null };

export function resolveTheoryBySlug<T extends TheoryLike>(rows: T[], slug: string): T | null {
  if (!slug) return null;
  const matches = rows.filter((r) => theorySlug(String(r.title || "")) === slug);
  if (matches.length > 0) {
    if (matches.length === 1) return matches[0];
    const sorted = [...matches].sort((a, b) => {
      const at = a.created_at ? Date.parse(a.created_at) : 0;
      const bt = b.created_at ? Date.parse(b.created_at) : 0;
      return at - bt;
    });
    return sorted[0];
  }
  const byId = rows.find((r) => r.id === slug);
  return byId ?? null;
}
