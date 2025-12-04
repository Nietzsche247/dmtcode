import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InventoryStatus {
  slug: string;
  inStock: boolean;
  quantity: number;
  soldOut: boolean;
}

// Map bundle item slugs to potential store_products handles/titles
const slugToProductMapping: Record<string, string[]> = {
  '650nm-laser-pointer': ['650nm-laser-pointer', '650nm 5mW Laser Pointer', 'laser-pointer-650nm'],
  'diffraction-grating': ['diffraction-grating', '500 lines/mm Diffraction Grating', 'diffraction-glasses'],
  'protocol-journal': ['protocol-journal', 'Protocol Documentation Journal', 'research-journal'],
  'lab-timer': ['lab-timer', 'Lab Session Timer'],
  'mitomat-yoga-mat': ['mitomat-yoga-mat', 'MitoMAT 660nm Red Light Mat', 'mitomat'],
  'quarton-laser-module': ['quarton-laser-module', 'Quarton VLM-650 Laser Module'],
  'znse-lens': ['znse-lens', 'ZnSe High-Index Lens'],
  'huepar-laser-level': ['huepar-laser-level', 'Huepar Self-Leveling Laser System'],
  'refraction-tank': ['refraction-tank', 'Refraction Analysis Tank'],
};

export const useInventoryStatus = (slugs: string[]) => {
  return useQuery({
    queryKey: ['inventory-status', slugs],
    queryFn: async () => {
      // Get all possible handles/titles to search for
      const searchTerms = slugs.flatMap(slug => slugToProductMapping[slug] || [slug]);
      
      const { data, error } = await supabase
        .from('store_products')
        .select('handle, title, inventory_quantity, sold_out')
        .or(
          searchTerms.map(term => `handle.ilike.%${term}%,title.ilike.%${term}%`).join(',')
        );

      if (error) {
        console.error('Error fetching inventory:', error);
        return {};
      }

      // Map results back to original slugs
      const inventoryMap: Record<string, InventoryStatus> = {};
      
      for (const slug of slugs) {
        const possibleMatches = slugToProductMapping[slug] || [slug];
        const matchedProduct = data?.find(product => 
          possibleMatches.some(match => 
            product.handle?.toLowerCase().includes(match.toLowerCase()) ||
            product.title?.toLowerCase().includes(match.toLowerCase())
          )
        );

        if (matchedProduct) {
          inventoryMap[slug] = {
            slug,
            inStock: !matchedProduct.sold_out && (matchedProduct.inventory_quantity ?? 0) > 0,
            quantity: matchedProduct.inventory_quantity ?? 0,
            soldOut: matchedProduct.sold_out ?? false,
          };
        } else {
          // Default to in-stock if not found in store_products
          inventoryMap[slug] = {
            slug,
            inStock: true,
            quantity: 100, // Default quantity
            soldOut: false,
          };
        }
      }

      return inventoryMap;
    },
    staleTime: 60000, // 1 minute cache
  });
};

export const useSingleInventoryStatus = (slug: string) => {
  const { data, isLoading, error } = useInventoryStatus([slug]);
  
  return {
    inventoryStatus: data?.[slug],
    isLoading,
    error,
  };
};
