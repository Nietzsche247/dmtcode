import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { bundleItems } from '@/data/bundleItems';

// Bundle definitions matching BundleDetail.tsx
const bundleData: Record<string, {
  id: string;
  name: string;
  items: Array<{ name: string; value: number; sku: string }>;
}> = {
  starter: {
    id: 'starter',
    name: 'Fractal Starter Kit',
    items: [
      { name: '650nm 5mW Laser Pointer', value: 28, sku: '650nm-laser-pointer' },
      { name: '500 lines/mm Diffraction Grating', value: 22, sku: 'diffraction-grating' },
      { name: 'Protocol Documentation Journal', value: 35, sku: 'protocol-journal' },
      { name: 'Lab Session Timer', value: 21, sku: 'lab-timer' },
    ],
  },
  gateway: {
    id: 'gateway',
    name: 'Gateway Research Kit',
    items: [
      { name: 'Quarton VLM-650 Laser Module', value: 650, sku: 'quarton-module' },
      { name: 'ZnSe High-Index Lens (RI 2.4)', value: 285, sku: 'znse-lens' },
      { name: '1000 lines/mm Diffraction Grating', value: 145, sku: 'diffraction-grating' },
      { name: 'Protocol Documentation Journal', value: 35, sku: 'protocol-journal' },
      { name: 'Precision Lab Timer', value: 42, sku: 'lab-timer' },
    ],
  },
  complete: {
    id: 'complete',
    name: 'Complete Symbol Kit',
    items: [
      { name: 'MitoMAT 660nm Red Light Mat', value: 1299, sku: 'mitomat' },
      { name: 'Quarton VLM-650 Laser Module', value: 650, sku: 'quarton-module' },
      { name: 'ZnSe High-Index Lens Set', value: 425, sku: 'znse-lens' },
      { name: 'Refraction Analysis Tank', value: 185, sku: 'refraction-tank' },
      { name: 'Protocol Documentation Journal', value: 35, sku: 'protocol-journal' },
    ],
  },
  ceremony: {
    id: 'ceremony',
    name: 'Extended Research Package',
    items: [
      { name: 'MitoMAT 660nm Red Light Mat', value: 1299, sku: 'mitomat' },
      { name: 'Huepar Self-Leveling Laser System', value: 895, sku: 'huepar-level' },
      { name: 'Quarton VLM-650 Laser Module', value: 650, sku: 'quarton-module' },
      { name: 'Complete ZnSe Lens Kit', value: 580, sku: 'znse-lens' },
      { name: 'Refraction Analysis Tank', value: 185, sku: 'refraction-tank' },
      { name: 'Extended Protocol Journal Set', value: 95, sku: 'protocol-journal' },
    ],
  },
};

// SKU to slug mapping
const skuToSlug: Record<string, string> = {
  '650nm-laser-pointer': '650nm-laser-pointer',
  'diffraction-grating': 'diffraction-grating',
  'protocol-journal': 'protocol-journal',
  'lab-timer': 'lab-timer',
  'mitomat': 'mitomat-yoga-mat',
  'quarton-module': 'quarton-laser-module',
  'znse-lens': 'znse-lens',
  'huepar-level': 'huepar-laser-level',
  'refraction-tank': 'refraction-tank',
};

interface RelatedBundleProductsProps {
  bundleId: string;
  currentProductSlug?: string;
}

export const RelatedBundleProducts = ({ bundleId, currentProductSlug }: RelatedBundleProductsProps) => {
  const bundle = bundleData[bundleId];
  
  if (!bundle) return null;
  
  // Filter out current product and get related items
  const relatedItems = bundle.items.filter(item => {
    const slug = skuToSlug[item.sku];
    return slug !== currentProductSlug;
  });
  
  if (relatedItems.length === 0) return null;
  
  return (
    <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Also in {bundle.name}</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {relatedItems.map((item) => {
          const slug = skuToSlug[item.sku];
          const bundleItem = bundleItems[slug];
          
          return (
            <Link
              key={item.sku}
              to={`/products/${slug}?from=${bundleId}`}
              className="group relative block"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-secondary/30 mb-2">
                {bundleItem?.image ? (
                  <img
                    src={bundleItem.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
              
              <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                {item.name}
              </p>
              <p className="text-xs text-muted-foreground">
                ${item.value}
              </p>
              
              {/* Hover underline effect */}
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </Link>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border/50">
        <Link
          to={`/bundles/${bundleId}`}
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          View full {bundle.name} →
        </Link>
      </div>
    </Card>
  );
};
