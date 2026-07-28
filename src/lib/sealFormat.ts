// Renders e.g. "14:32 UTC on 28 July 2026"
export const formatSealedAt = (iso: string): string => {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const day = d.getUTCDate();
  const month = d.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
  return `${hh}:${mm} UTC on ${day} ${month} ${d.getUTCFullYear()}`;
};
