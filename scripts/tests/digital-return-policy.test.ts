import { expect, test } from 'bun:test';

test('Field Guide disallows standard returns without changing the kits 30-day window', async () => {
  Object.assign(globalThis, { Netlify: { env: { get: () => undefined } } });
  const { default: prerender } = await import('../../netlify/edge-functions/content-prerender');
  const context = { next: async () => new Response('<html><head></head><body></body></html>') } as Parameters<typeof prerender>[1];
  const response = await prerender(new Request('https://dmtcode.com/prepare'), context);
  const html = await response.text();
  const nodes = Array.from(html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g), ([, text]) => JSON.parse(text));
  const products = nodes.filter((node) => node['@type'] === 'Product');
  const guide = products.find((node) => node['@id'] === 'https://dmtcode.com/prepare#field-guide');
  expect(guide?.offers.hasMerchantReturnPolicy).toEqual({
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'US',
    returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
  });
  const kits = products.filter((node) => node !== guide);
  expect(kits).toHaveLength(5);
  for (const kit of kits) {
    expect(kit.offers.hasMerchantReturnPolicy.returnPolicyCategory).toBe('https://schema.org/MerchantReturnFiniteReturnWindow');
    expect(kit.offers.hasMerchantReturnPolicy.merchantReturnDays).toBe(30);
  }
});