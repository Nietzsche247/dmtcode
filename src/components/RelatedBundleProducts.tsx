import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Sparkles, ArrowRight } from 'lucide-react';
import { bundleItems } from '@/data/bundleItems';

declare global {
  interface Window {
    posthog?: any;
  }
}

// Bundle definitions matching BundleDetail.tsx
const bundleData: Record<string, {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: string;
  items: Array<{ name: string; value: number; sku: string }>;
}> = {
  starter: {
    id: 'starter',
    name: 'Fractal Starter Kit',
    price: 85,
    originalPrice: 106,
    discount: '20% OFF',
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
    price: 1200,
    originalPrice: 1412,
    discount: '15% OFF',
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
    price: 2300,
    originalPrice: 2875,
    discount: '20% OFF',
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
    price: 3500,
    originalPrice: 4375,
    discount: '20% OFF',
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

// Slug to SKU reverse mapping
const slugToSku: Record<string, string> = Object.entries(skuToSlug).reduce(
  (acc, [sku, slug]) => ({ ...acc, [slug]: sku }),
  {} as Record<string, string>
);

interface RelatedBundleProductsProps {
  bundleId: string;
  currentProductSlug?: string;
}

export const RelatedBundleProducts = ({ bundleId, currentProductSlug }: RelatedBundleProductsProps) => {
  const navigate = useNavigate();
  const bundle = bundleData[bundleId];
  
  // Filter out current product and get related items
  const relatedItems = bundle?.items.filter(item => {
    const slug = skuToSlug[item.sku];
    return slug !== currentProductSlug;
  }) || [];
  
  // Track impression on mount
  useEffect(() => {
    if (bundle && relatedItems.length > 0) {
      window.posthog?.capture('bundle_related_products_shown', {
        bundle_id: bundleId,
        bundle_name: bundle.name,
        current_product: currentProductSlug,
        related_items_count: relatedItems.length,
        type: 'in_bundle_context',
      });
    }
  }, [bundleId, currentProductSlug, bundle, relatedItems.length]);
  
  if (!bundle || relatedItems.length === 0) return null;
  
  const handleItemClick = (itemSku: string, itemName: string) => {
    window.posthog?.capture('bundle_related_item_clicked', {
      bundle_id: bundleId,
      bundle_name: bundle.name,
      clicked_item_sku: itemSku,
      clicked_item_name: itemName,
      current_product: currentProductSlug,
      type: 'in_bundle_context',
    });
  };
  
  const handleViewBundleClick = () => {
    window.posthog?.capture('view_full_bundle_clicked', {
      bundle_id: bundleId,
      bundle_name: bundle.name,
      current_product: currentProductSlug,
      type: 'in_bundle_context',
    });
  };
  
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
              to={`/tools/${slug}?from=${bundleId}`}
              className="group relative block min-h-[44px]"
              onClick={() => handleItemClick(item.sku, item.name)}
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
              
              {/* 1px #C41E3A glowing beam underline on hover */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ 
                  backgroundColor: '#C41E3A',
                  boxShadow: '0 0 8px #C41E3A, 0 0 12px #C41E3A'
                }}
              />
            </Link>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border/50">
        <Link
          to={`/bundles/${bundleId}`}
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          onClick={handleViewBundleClick}
        >
          View full {bundle.name} →
        </Link>
      </div>
    </Card>
  );
};

// Complete the Bundle upsell component
interface CompleteBundleUpsellProps {
  currentProductSlug: string;
}

export const CompleteBundleUpsell = ({ currentProductSlug }: CompleteBundleUpsellProps) => {
  // Find bundles containing this product
  const currentSku = slugToSku[currentProductSlug];
  
  const matchingBundles = Object.values(bundleData).filter(bundle =>
    bundle.items.some(item => item.sku === currentSku || skuToSlug[item.sku] === currentProductSlug)
  );
  
  // Pick the most relevant bundle (starter for entry items, or first match)
  const suggestedBundle = matchingBundles[0];
  
  // Get other items in the bundle
  const otherItems = suggestedBundle?.items.filter(item => {
    const slug = skuToSlug[item.sku];
    return slug !== currentProductSlug && item.sku !== currentSku;
  }) || [];
  
  const savings = suggestedBundle ? suggestedBundle.originalPrice - suggestedBundle.price : 0;
  
  // Track impression on mount
  useEffect(() => {
    if (suggestedBundle && otherItems.length > 0) {
      window.posthog?.capture('bundle_upsell_shown', {
        bundle_id: suggestedBundle.id,
        bundle_name: suggestedBundle.name,
        bundle_price: suggestedBundle.price,
        bundle_savings: savings,
        current_product: currentProductSlug,
        upsell_items_count: otherItems.length,
        type: 'complete_the_bundle',
      });
    }
  }, [currentProductSlug, suggestedBundle, otherItems.length, savings]);
  
  if (!suggestedBundle || matchingBundles.length === 0 || otherItems.length === 0) return null;
  
  const handleItemClick = (itemSku: string, itemName: string) => {
    window.posthog?.capture('bundle_upsell_item_clicked', {
      bundle_id: suggestedBundle.id,
      bundle_name: suggestedBundle.name,
      clicked_item_sku: itemSku,
      clicked_item_name: itemName,
      current_product: currentProductSlug,
      type: 'complete_the_bundle',
    });
  };
  
  const handleViewBundleClick = () => {
    window.posthog?.capture('bundle_upsell_view_bundle_clicked', {
      bundle_id: suggestedBundle.id,
      bundle_name: suggestedBundle.name,
      bundle_price: suggestedBundle.price,
      bundle_savings: savings,
      current_product: currentProductSlug,
      type: 'complete_the_bundle',
    });
  };
  
  return (
    <Card className="p-6 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold">Complete the Bundle</h3>
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          Save ${savings}
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        This item is part of the <span className="text-foreground font-medium">{suggestedBundle.name}</span>. 
        Get the complete kit and save {suggestedBundle.discount}.
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {otherItems.slice(0, 3).map((item) => {
          const slug = skuToSlug[item.sku];
          const bundleItem = bundleItems[slug];
          
          return (
            <Link
              key={item.sku}
              to={`/tools/${slug}?from=${suggestedBundle.id}`}
              className="group relative block min-h-[44px]"
              onClick={() => handleItemClick(item.sku, item.name)}
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
                    <Package className="w-6 h-6" />
                  </div>
                )}
              </div>
              
              <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                {item.name}
              </p>
            </Link>
          );
        })}
      </div>
      
      {otherItems.length > 3 && (
        <p className="text-xs text-muted-foreground mb-4">
          +{otherItems.length - 3} more item{otherItems.length - 3 > 1 ? 's' : ''} included
        </p>
      )}
      
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div>
          <p className="text-2xl font-bold text-primary">${suggestedBundle.price}</p>
          <p className="text-sm text-muted-foreground line-through">${suggestedBundle.originalPrice}</p>
        </div>
        
        <Button asChild className="group" onClick={handleViewBundleClick}>
          <Link to={`/bundles/${suggestedBundle.id}`}>
            View Bundle
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </Card>
  );
};
