// The single date formatter for every list row on the site.
// Plain hyphens only, never en or em dashes.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

/** "5 January 2026" */
export function formatDay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Jan 2026" */
export function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * "Sep 11-13, 2026" same month
 * "Oct 28 - Nov 2, 2026" across months
 * "Oct 8, 2026" when no end
 */
export function formatRange(startIso: string, endIso: string | null): string {
  const start = new Date(startIso);
  if (isNaN(start.getTime())) return startIso;
  if (!endIso) {
    return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
  }
  const end = new Date(endIso);
  if (isNaN(end.getTime())) {
    return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
  }
  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()} - ${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
}

/** "Oct 2026 (approx.)" when precise is false, "Oct 2026" when true */
export function formatApprox(iso: string, precise: boolean): string {
  const base = formatMonthYear(iso);
  return precise ? base : `${base} (approx.)`;
}
