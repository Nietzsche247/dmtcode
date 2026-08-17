import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/i18n/LocaleProvider";

// Human-layer overlay for the /es/* and /de/* mirrors.
//
// content_translations is keyed (table_name, record_id, locale, field). The
// record_id is the uuid for theories/events, and the slug for articles, guides
// and protocols. English never queries: the source row IS the English copy.
//
// Field replacement semantics mirror overlay() in
// netlify/edge-functions/content-prerender.ts, so the SPA renders exactly what
// the prerender served.

export type TranslationMap = Record<string, string>;

async function fetchTranslations(
  table: string,
  recordIds: string[],
  locale: string,
): Promise<Record<string, TranslationMap>> {
  const { data, error } = await supabase
    .from("content_translations")
    .select("record_id, field, translated_text")
    .eq("table_name", table)
    .eq("locale", locale)
    .in("record_id", recordIds);

  if (error) {
    // A missing translation must never break the page: fall back to source.
    console.error("content_translations read failed", error);
    return {};
  }

  const out: Record<string, TranslationMap> = {};
  for (const row of data ?? []) {
    const id = String((row as { record_id: string }).record_id);
    const field = (row as { field: string }).field;
    const text = (row as { translated_text: string | null }).translated_text;
    if (!field || !text || !text.trim()) continue;
    (out[id] ??= {})[field] = text;
  }
  return out;
}

/** Translations for one record. Returns {} on English or on any miss. */
export function useContentTranslations(
  table: string,
  recordId: string | null | undefined,
): TranslationMap {
  const locale = useLocale();
  const enabled = locale !== "en" && !!recordId;

  const { data } = useQuery({
    queryKey: ["content-translations", table, recordId, locale],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const map = await fetchTranslations(table, [recordId as string], locale);
      return map[recordId as string] ?? {};
    },
  });

  return enabled ? data ?? {} : {};
}

/** Translations for many records of one table, keyed by record_id. */
export function useContentTranslationsMany(
  table: string,
  recordIds: string[],
): Record<string, TranslationMap> {
  const locale = useLocale();
  const ids = [...new Set(recordIds.filter(Boolean))].sort();
  const enabled = locale !== "en" && ids.length > 0;

  const { data } = useQuery({
    queryKey: ["content-translations-many", table, locale, ids.join(",")],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchTranslations(table, ids, locale),
  });

  return enabled ? data ?? {} : {};
}

/**
 * Returns a copy of `record` with translated fields replacing source fields.
 * A jsonb field (the source value is an object or array) holds its translation
 * as a JSON string; on any parse failure the source value is kept rather than
 * rendering a corrupted value. `only` restricts which fields may be replaced.
 */
export function overlay<T extends Record<string, unknown>>(
  record: T | null | undefined,
  map: TranslationMap,
  only?: string[],
): T | null | undefined {
  if (!record) return record;
  const keys = Object.keys(map);
  if (keys.length === 0) return record;

  const next: Record<string, unknown> = { ...record };
  let changed = false;

  for (const key of keys) {
    if (only && !only.includes(key)) continue;
    const value = map[key];
    if (!value || !value.trim()) continue;
    const current = next[key];
    if (current !== null && typeof current === "object") {
      try {
        next[key] = JSON.parse(value);
        changed = true;
      } catch {
        // keep the source value
      }
      continue;
    }
    next[key] = value;
    changed = true;
  }

  return changed ? (next as T) : record;
}
