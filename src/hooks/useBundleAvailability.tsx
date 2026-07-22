import { useQuery } from '@tanstack/react-query';
import { storefrontApiRequest } from '@/lib/shopify';

// Shared source of truth for bundle availability so /tools and /bundles agree.
export const bundleShopifyHandles: Record<string, string> = {
  starter: 'fractal-starter-kit',
  gateway: 'gateway-research-kit',
  complete: 'complete-symbol-kit',
  ceremony: 'extended-ceremony-package',
};

const BUNDLE_AVAILABILITY_QUERY = `
  query BundleAvailability($handle: String!) {
    productByHandle(handle: $handle) {
      id
      variants(first: 1) {
        edges { node { id availableForSale } }
      }
    }
  }
`;

export interface BundleAvailability {
  handle: string;
  variantId: string | null;
  availableForSale: boolean;
  exists: boolean;
}

export const useBundleAvailability = () => {
  return useQuery({
    queryKey: ['bundle-availability', Object.values(bundleShopifyHandles)],
    queryFn: async (): Promise<Record<string, BundleAvailability>> => {
      const result: Record<string, BundleAvailability> = {};
      await Promise.all(
        Object.entries(bundleShopifyHandles).map(async ([bundleId, handle]) => {
          try {
            const data = await storefrontApiRequest(BUNDLE_AVAILABILITY_QUERY, { handle });
            const product = data?.data?.productByHandle;
            const variant = product?.variants?.edges?.[0]?.node;
            result[bundleId] = {
              handle,
              variantId: variant?.id ?? null,
              availableForSale: !!variant?.availableForSale,
              exists: !!product,
            };
          } catch {
            result[bundleId] = { handle, variantId: null, availableForSale: false, exists: false };
          }
        })
      );
      return result;
    },
    staleTime: 60_000,
  });
};
