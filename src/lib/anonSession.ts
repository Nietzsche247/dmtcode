// Anonymous device identifier for logged out contributions.
// Never returns an empty string. Falls back to an in-memory value when
// localStorage throws (private browsing, blocked site data).

const STORAGE_KEY = 'dmtcode_session_id';

let memorySessionId: string | null = null;

const generateId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to the manual generator
  }
  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};

export const getSessionId = (): string => {
  if (memorySessionId) return memorySessionId;

  let stored: string | null = null;
  try {
    stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
  } catch {
    stored = null;
  }

  if (stored && stored.length > 0) {
    memorySessionId = stored;
    return memorySessionId;
  }

  const fresh = generateId();
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, fresh);
    }
  } catch {
    // Storage unavailable: keep the value for this page load only.
  }

  memorySessionId = fresh;
  return memorySessionId;
};
