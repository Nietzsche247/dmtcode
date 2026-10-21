import { expect, test } from 'bun:test';
import { currentStaticTranslation } from '../../src/lib/staticTranslation';
import { sortSymbolRecords, type SymbolRecord } from '../../src/lib/symbolRecords';

const english = { locale: 'en', source_hash: 'current', translated_text: 'English source' };
test('stale locale hash falls back to English children', () => {
  expect(currentStaticTranslation([english, { locale: 'es', source_hash: 'old', translated_text: 'Texto' }], 'es')).toBeNull();
});
test('missing English source row falls back', () => {
  expect(currentStaticTranslation([{ locale: 'de', source_hash: 'current', translated_text: 'Text' }], 'de')).toBeNull();
});
test('all required href identifiers must survive translation', () => {
  const translated = { locale: 'es', source_hash: 'current', translated_text: '<a href="/prepare">Texto</a>' };
  expect(currentStaticTranslation([english, translated], 'es', ['/prepare', 'https://www.amazon.com/dp/B002GHBUTK/?tag=dmtcode-20'])).toBeNull();
  expect(currentStaticTranslation([english, translated], 'es', ['/prepare'])).toBe(translated.translated_text);
});
test('laser records come first and dates descend within each group', () => {
  const base = { description: null, image_url: null, evidence_status: 'raw', prior_exposure: null, is_curated_example: false };
  const rows: SymbolRecord[] = [
    { ...base, id: 'other-new', source_method: null, created_at: '2026-10-21' },
    { ...base, id: 'laser-old', source_method: 'laser_650nm', created_at: '2026-09-01' },
    { ...base, id: 'laser-new', source_method: 'laser_650nm', created_at: '2026-10-01' },
  ];
  expect(sortSymbolRecords(rows).map((row) => row.id)).toEqual(['laser-new', 'laser-old', 'other-new']);
});