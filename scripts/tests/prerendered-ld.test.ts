import { expect, test } from 'bun:test';
import { matchesPrerenderedLd } from '../../src/lib/prerenderedLd';

test('product identity must match exactly', () => {
  const nodes = [{ '@type': 'Product', '@id': 'https://dmtcode.com/products/solo#product' }];
  expect(matchesPrerenderedLd(nodes, { id: 'https://dmtcode.com/products/solo#product' })).toBe(true);
  expect(matchesPrerenderedLd(nodes, { id: 'https://dmtcode.com/products/dual#product' })).toBe(false);
});

test('type matching supports arrays and does not inspect nested entities', () => {
  expect(matchesPrerenderedLd([{ '@type': ['Person', 'Thing'] }], { type: 'Person' })).toBe(true);
  expect(matchesPrerenderedLd([{ '@type': 'WebSite', '@graph': [{ '@type': 'Person' }] }], { type: 'Person' })).toBe(false);
  expect(matchesPrerenderedLd([{ '@type': 'Person' }], { type: 'BreadcrumbList' })).toBe(false);
});

test('SPA documents without prerendered nodes retain client metadata', () => {
  expect(matchesPrerenderedLd([], { type: 'Product' })).toBe(false);
});