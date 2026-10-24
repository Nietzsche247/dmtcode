import { expect, test } from 'bun:test';
import { observationPackPath } from '../../src/lib/observationPack';

for (const kit of ['protocol', 'solo', 'dual', 'triad', 'circle']) {
  test(`${kit} selects its committed PDF`, () => {
    expect(observationPackPath(kit)).toBe(`/downloads/observation-pack/DMT_Code_Observation_Pack_${kit}.pdf`);
  });
}
test('missing kit selects generic PDF', () => {
  expect(observationPackPath(null)).toBe('/downloads/observation-pack/DMT_Code_Observation_Pack_generic.pdf');
});
test('unknown kit selects generic PDF', () => {
  expect(observationPackPath('../other')).toBe('/downloads/observation-pack/DMT_Code_Observation_Pack_generic.pdf');
});