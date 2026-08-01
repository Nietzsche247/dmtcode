// Tag hubs (/registry/tag/:tag), tag-driven page titles and the sitemap all key on
// exact tag strings. "doorknob", "door-knob" and "Doorknob" would otherwise become
// three separate hubs, fragmenting the density signal. Normalizing at write time
// keeps the map converged on one spelling per concept.
//
// Underscores are preserved untouched: the context vocabulary (priming_none,
// closed_eyes, 650nm_laser) depends on them.
export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/^-+|-+$/g, '');
}
