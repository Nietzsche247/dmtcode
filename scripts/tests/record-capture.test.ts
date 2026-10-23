import { describe, expect, test } from 'bun:test';
import { canSealRecord, freshRecordDraft, kitSlug, recordPayload, VOICE_NOTE_SECONDS } from '../../src/lib/recordDraft';

describe('quick capture rules', () => {
  const drawn = () => ({ ...freshRecordDraft('?kit=solo', false), png: 'data:image/png;base64,test', strokes: [[{ x: 0.2, y: 0.3, t: 123 }]], substance: 'no' as const });
  test('no substance answer is preselected', () => expect(freshRecordDraft('', false).substance).toBe(''));
  test('a drawn record needs a first stroke', () => expect(canSealRecord({ ...drawn(), strokes: [] })).toBe(false));
  test('null report requires no drawing', () => expect(canSealRecord({ ...drawn(), strokes: [], png: '', nullReport: true })).toBe(true));
  test('substance No maps to sober baseline', () => expect(recordPayload(drawn(), 'owner', null).is_sober_baseline).toBe(true));
  test('substance Yes maps to non-sober', () => expect(recordPayload({ ...drawn(), substance: 'yes' }, 'owner', null).is_sober_baseline).toBe(false));
  test('catalogue flag preselects exposed', () => expect(freshRecordDraft('?seen=catalogue', true).exposed).toBe(true));
  test('no catalogue flag preselects not exposed', () => expect(freshRecordDraft('', false).exposed).toBe(false));
  test('exposure Yes maps exactly to priming_registry', () => expect(recordPayload({ ...drawn(), exposed: true }, 'owner', null)).toMatchObject({ prior_exposure: true, catalog_exposure_before_submission: 'priming_registry' }));
  test('exposure No maps exactly to priming_none', () => expect(recordPayload(drawn(), 'owner', null)).toMatchObject({ prior_exposure: false, catalog_exposure_before_submission: 'priming_none' }));
  test('kit defaults to red laser and integer 650', () => expect(recordPayload(drawn(), 'owner', 'protocol')).toMatchObject({ source: '650nm_laser', wavelength_nm: 650, protocol_id: 'protocol', capture_route: 'record' }));
  test('only four named kit slugs are accepted', () => { for (const slug of ['solo', 'dual', 'triad', 'circle']) expect(kitSlug(slug)).toBe(slug); expect(kitSlug('protocol')).toBeNull(); });
  test('timed stroke points and pen-up boundaries survive payload mapping', () => {
    const strokes = [[{ x: 0, y: 0.5, t: 100 }], [{ x: 1, y: 0.3, t: 200 }]];
    expect(recordPayload({ ...drawn(), strokes }, 'owner', null).stroke_data).toEqual(strokes);
  });
  test('sealing cannot be anonymous', () => expect(() => recordPayload(drawn(), '', null)).toThrow());
  test('voice note limit is exactly 60 seconds', () => expect(VOICE_NOTE_SECONDS).toBe(60));
});