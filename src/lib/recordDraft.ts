import { exposureFields, wavelengthInteger } from './observationRules';

export const RECORD_DRAFT_KEY = 'dmtcode-record-draft';
export const VOICE_NOTE_SECONDS = 60;
export type StrokePoint = { x: number; y: number; t: number };
export type RecordStroke = StrokePoint[];
export type KitSlug = 'solo' | 'dual' | 'triad' | 'circle';
export interface RecordDraft {
  version: 1;
  id: string;
  png: string;
  strokes: RecordStroke[];
  vector: string;
  kit: KitSlug | null;
  seen: boolean;
  exposed: boolean;
  substance: '' | 'yes' | 'no';
  source: string;
  wavelength: string;
  wavelengthOther: string;
  methodOther: string;
  nullReport: boolean;
  step: 1 | 2 | 3;
  pendingSeal: boolean;
}

export function kitSlug(value: string | null): KitSlug | null {
  return value === 'solo' || value === 'dual' || value === 'triad' || value === 'circle' ? value : null;
}

export function freshRecordDraft(search: string, seen: boolean): RecordDraft {
  return { version: 1, id: crypto.randomUUID(), png: '', strokes: [], vector: '', kit: kitSlug(new URLSearchParams(search).get('kit')), seen, exposed: seen, substance: '', source: '650nm_laser', wavelength: 'wavelength_650', wavelengthOther: '', methodOther: '', nullReport: false, step: 1, pendingSeal: false };
}

export function readRecordDraft(): RecordDraft | null {
  try {
    const draft = JSON.parse(localStorage.getItem(RECORD_DRAFT_KEY) || 'null');
    if (!draft || draft.version !== 1 || typeof draft.id !== 'string' || typeof draft.png !== 'string' || !Array.isArray(draft.strokes)) return null;
    return draft;
  } catch { return null; }
}

export function canSealRecord(draft: RecordDraft): boolean {
  return (draft.substance === 'yes' || draft.substance === 'no') && (draft.nullReport || (draft.strokes.length > 0 && !!draft.png));
}

export function recordPayload(draft: RecordDraft, userId: string, protocolId: string | null) {
  if (!userId || !canSealRecord(draft)) throw new Error('record-invalid');
  return {
    id: draft.id, user_id: userId, image_data: draft.nullReport ? '' : draft.png,
    stroke_data: draft.nullReport ? [] : draft.strokes.map(stroke => stroke.map(point => ({ ...point }))),
    source: draft.source, wavelength_nm: wavelengthInteger(draft.wavelength, draft.wavelengthOther),
    other_method_text: draft.methodOther || null, is_sober_baseline: draft.substance === 'no',
    is_null_report: draft.nullReport, ...exposureFields(draft.exposed ? 'priming_registry' : 'priming_none'),
    capture_route: 'record', protocol_id: protocolId, publication_consent: true,
    privacy_level: 'anonymous_matchable', motif_tags: draft.nullReport ? ['null_report'] : [],
  };
}