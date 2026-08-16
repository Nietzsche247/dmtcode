import { useQuery } from '@tanstack/react-query';
import { storefrontApiRequest } from '@/lib/shopify';

// Shared source of truth for bundle availability, keyed by the Supabase bundle
// slug used on /prepare and mapped to the real live Shopify product handles.
export const bundleShopifyHandles: Record<string, string> = {
  solo: '650nm-laser-diffraction-research-kit-solo',
  triad: 'multi-wavelength-laser-diffraction-kit-triad',
  circle: 'multi-wavelength-laser-diffraction-kit-circle',
};

const BUNDLE_AVAILABILITY_QUERY = `
  query BundleAvailability($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      variants(first: 1) {
        edges {
          node {
            id
            availableForSale
            price { amount currencyCode }
          }
        }
      }
    }
  }
`;

export interface BundleAvailability {
  handle: string;
  variantId: string | null;
  availableForSale: boolean;
  exists: boolean;
  title: string | null;
  price: { amount: string; currencyCode: string } | null;
}

export const useBundleAvailability = () => {
  return useQuery({
    queryKey: ['bundle-availability', Object.values(bundleShopifyHandles)],
    queryFn: async (): Promise<Record<string, BundleAvailability>> => {
      const result: Record<string, BundleAvailability> = {};
      await Promise.all(
        Object.entries(bundleShopifyHandles).map(async ([bundleSlug, handle]) => {
          try {
            const data = await storefrontApiRequest(BUNDLE_AVAILABILITY_QUERY, { handle });
            const product = data?.data?.productByHandle;
            const variant = product?.variants?.edges?.[0]?.node;
            result[bundleSlug] = {
              handle,
              variantId: variant?.id ?? null,
              availableForSale: !!variant?.availableForSale,
              exists: !!product,
              title: product?.title ?? null,
              price: variant?.price ?? null,
            };
          } catch {
            result[bundleSlug] = {
              handle,
              variantId: null,
              availableForSale: false,
              exists: false,
              title: null,
              price: null,
            };
          }
        })
      );
      return result;
    },
    staleTime: 60_000,
  });
};
