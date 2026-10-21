// Source hashes establish currency. Hrefs establish completeness without translating identifiers.
export function currentStaticTranslation(
  rows: Array<{ locale: string; source_hash: string | null; translated_text: string }> | null,
  locale: string,
  requireHrefs: string[] = [],
): string | null {
  const english = rows?.find((row) => row.locale === 'en');
  const translated = rows?.find((row) => row.locale === locale);
  if (!english?.source_hash || !translated?.translated_text.trim() || english.source_hash !== translated.source_hash) return null;
  if (requireHrefs.some((href) => !translated.translated_text.includes(href))) return null;
  return translated.translated_text;
}