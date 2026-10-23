import { describe, expect, test } from 'bun:test';
import { exposureFields, wavelengthInteger, stimulusPhotoError } from '../../src/lib/observationRules';

describe('observation capture rules', () => {
  test('650 wavelength writes integer 650', () => expect(wavelengthInteger('wavelength_650')).toBe(650));
  test('other wavelength writes a parsed integer or null', () => {
    expect(wavelengthInteger('wavelength_other', '532')).toBe(532);
    expect(wavelengthInteger('wavelength_other', '532.5')).toBeNull();
    expect(wavelengthInteger('wavelength_other', 'unknown')).toBeNull();
  });
  test('naive wizard response maps to false and priming_none', () => expect(exposureFields('naive')).toEqual({ prior_exposure: false, catalog_exposure_before_submission: 'priming_none' }));
  test('exposed wizard response maps to true and priming_registry', () => expect(exposureFields('exposed')).toEqual({ prior_exposure: true, catalog_exposure_before_submission: 'priming_registry' }));
  test('all four layered exposure choices survive mapping', () => {
    for (const choice of ['priming_none', 'priming_matrix_only', 'priming_laser_exposed', 'priming_registry']) {
      expect(exposureFields(choice).catalog_exposure_before_submission).toBe(choice);
      expect(exposureFields(choice).prior_exposure).toBe(choice !== 'priming_none');
    }
  });
  test('at most three stimulus photos are accepted', () => {
    const photo = { size: 100, type: 'image/png' };
    expect(stimulusPhotoError([photo, photo, photo])).toBeNull();
    expect(stimulusPhotoError([photo, photo, photo, photo])).toBe('photoCount');
  });
  test('each stimulus photo is limited to 10 MB', () => {
    expect(stimulusPhotoError([{ size: 10 * 1024 * 1024, type: 'image/jpeg' }])).toBeNull();
    expect(stimulusPhotoError([{ size: 10 * 1024 * 1024 + 1, type: 'image/jpeg' }])).toBe('photoSize');
  });
  test('only JPEG PNG and HEIC photos are accepted', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/heic']) expect(stimulusPhotoError([{ size: 100, type }])).toBeNull();
    expect(stimulusPhotoError([{ size: 100, type: 'image/gif' }])).toBe('photoType');
  });
});
