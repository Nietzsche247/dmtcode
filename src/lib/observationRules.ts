export const MAX_STIMULUS_PHOTOS = 3;
export const MAX_STIMULUS_BYTES = 10 * 1024 * 1024;
export const STIMULUS_TYPES = ['image/jpeg', 'image/png', 'image/heic'];

export function stimulusPhotoError(files: Pick<File, 'size' | 'type'>[]): 'photoCount' | 'photoType' | 'photoSize' | null {
  if (files.length > MAX_STIMULUS_PHOTOS) return 'photoCount';
  if (files.some(file => !STIMULUS_TYPES.includes(file.type))) return 'photoType';
  if (files.some(file => file.size > MAX_STIMULUS_BYTES)) return 'photoSize';
  return null;
}

export function wavelengthInteger(answer: string, other = ''): number | null {
  if (answer === 'wavelength_650') return 650;
  const text = (other || answer).trim().replace(/\s*nm$/i, '');
  if (!/^[+-]?\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isInteger(value) && value >= -2147483648 && value <= 2147483647 ? value : null;
}

export function exposureFields(answer: string) {
  return {
    prior_exposure: answer === 'naive' || answer === 'priming_none' ? false : true,
    catalog_exposure_before_submission: answer === 'naive' ? 'priming_none' : answer === 'exposed' ? 'priming_registry' : answer,
  };
}
