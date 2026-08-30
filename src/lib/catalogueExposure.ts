// Did this visitor open the symbol catalogue before recording an observation?
//
// This exists because of a gap the corpus could not close on its own. Every
// published symbol reads prior_exposure as not_stated, and priming is the
// strongest ordinary explanation for convergence, so a record that cannot say
// whether its author had already seen the catalogue cannot be weighed on the
// one question the whole project turns on. The submission wizard has asked
// since 2026-08-26, but it asks a person to remember, and the single largest
// stream of visitors to this site arrives by searching for the symbol PDF by
// name. They see the catalogue first and then, sometimes, submit.
//
// So the site records what it can actually observe: this browser opened the
// catalogue. It is a hint, not a verdict. Two rules follow from that and both
// matter more than the feature does.
//
// 1. It pre-fills the answer and SAYS it pre-filled it, in the form, with the
//    reason. A field quietly decided on someone's behalf is worse than a field
//    left blank, because it looks like testimony and is not.
// 2. The contributor can change it to naive and the site keeps their answer.
//    They know what they read; the browser only knows what it served.
//
// Stored per browser. Cleared storage, a different device or a private window
// all mean the hint is absent, which is the correct default: absent, not false.

const KEY = "dmtcode.catalogue_seen_at";
export const CATALOGUE_QUERY_FLAG = "seen";
export const CATALOGUE_QUERY_VALUE = "catalogue";

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Call when someone opens the symbol catalogue PDF or the document index. */
export function markCatalogueSeen(): void {
  const s = safeStorage();
  if (!s) return;
  try {
    if (!s.getItem(KEY)) s.setItem(KEY, new Date().toISOString());
  } catch {
    /* a browser that refuses to store simply leaves the hint absent */
  }
}

/** ISO timestamp of the first time this browser opened the catalogue, or null. */
export function catalogueSeenAt(): string | null {
  const s = safeStorage();
  if (!s) return null;
  try {
    return s.getItem(KEY);
  } catch {
    return null;
  }
}

/**
 * True when this visit has evidence of catalogue exposure: either a link that
 * carried the flag, or a previous visit that opened it in this browser.
 */
export function hasSeenCatalogue(search?: string): boolean {
  const q = search ?? (typeof window !== "undefined" ? window.location.search : "");
  try {
    if (new URLSearchParams(q).get(CATALOGUE_QUERY_FLAG) === CATALOGUE_QUERY_VALUE) return true;
  } catch {
    /* ignore a malformed query string */
  }
  return catalogueSeenAt() !== null;
}

/** The link a catalogue reader should follow to record what they saw. */
export const RECORD_AFTER_CATALOGUE_PATH =
  `/submit-symbol?${CATALOGUE_QUERY_FLAG}=${CATALOGUE_QUERY_VALUE}`;
