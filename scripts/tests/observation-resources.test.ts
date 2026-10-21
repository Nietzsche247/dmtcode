import { describe, expect, test } from 'bun:test';
import { FIELD_GUIDE, FIELD_GUIDE_LIVE } from '../../src/data/fieldGuide';
import { KIT_MIN_PRICE } from '../../src/data/kits';

describe('observation resource publication rules', () => {
  test('Field Guide is published at 15 dollars on its own cart variant', () => {
    expect(FIELD_GUIDE.price).toBe('$15');
    expect(FIELD_GUIDE.cart).toBe('https://shop.dmtcode.com/cart/67786715365686:1');
    expect(FIELD_GUIDE_LIVE).toBe(true);
  });
  test('entry supply price remains 199 dollars', () => {
    expect(KIT_MIN_PRICE).toBe(199);
  });
});
