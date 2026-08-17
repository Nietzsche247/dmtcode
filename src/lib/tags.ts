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

// Display-only mapping from raw stored tag values to reader-facing labels.
// The stored tag value (used in URLs, queries and filters) is never touched;
// this only changes what text is rendered for a tag.
const TAG_LABELS: Record<string, string> = {
  priming_laser_exposed: 'Had seen laser imagery before',
  priming_none: 'No prior exposure',
  '650nm_laser': '650 nm laser',
  other: 'Other source',
};

const toSentenceCase = (tag: string): string => {
  const spaced = tag.replace(/_/g, ' ');
  if (!spaced) return spaced;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
};

export function tagLabel(tag: string): string {
  if (!tag) return tag;
  const key = tag.toLowerCase();
  if (key in TAG_LABELS) return TAG_LABELS[key];
  return toSentenceCase(tag);
}
