import { describe, expect, test } from 'bun:test';
import { FIELD_GUIDE, FIELD_GUIDE_LIVE } from '../../src/data/fieldGuide';
import { KIT_MIN_PRICE } from '../../src/data/kits';

describe('observation resource publication rules', () => {
  test('Field Guide stays unpublished while its price and variant are placeholders', () => {
    expect(FIELD_GUIDE.price).toBe('{{FIELD_GUIDE_PRICE}}');
    expect(FIELD_GUIDE.cart).toBe('https://shop.dmtcode.com/cart/{{FIELD_GUIDE_VARIANT_ID}}:1');
    expect(FIELD_GUIDE_LIVE).toBe(false);
  });
  test('entry supply price remains 199 dollars', () => {
    expect(KIT_MIN_PRICE).toBe(199);
  });
});
