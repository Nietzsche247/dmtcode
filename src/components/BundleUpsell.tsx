import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Package, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';

declare global {
  interface Window {
    posthog?: any;
  }
}

interface BundleUpsellProps {
  onClose?: () => void;
}

const PROTOCOL_STARTER_BUNDLE = {
  id: 'protocol-starter',
  name: 'Protocol Starter Kit',
  description: 'Complete 650nm laser + diffraction grating + research journal bundle at 20% off',
  discount: '20% OFF',
  originalPrice: 85,
  price: 68,
  requiredItems: ['laser', 'grating', 'journal'],
};

export const BundleUpsell = ({ onClose }: BundleUpsellProps) => {
  const navigate = useNavigate();
  const items = useCartStore(state => state.items);
  const [showUpsell, setShowUpsell] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if cart contains items that could benefit from bundle
    const hasLaserProduct = items.some(item => 
      item.product.node?.title?.toLowerCase().includes('laser') ||
      item.product.node?.title?.toLowerCase().includes('650nm')
    );

    const hasJournal = items.some(item =>
      item.product.node?.title?.toLowerCase().includes('journal')
    );

    // Show upsell if user has laser but not full bundle
    if (hasLaserProduct && !hasJournal && !dismissed) {
      setShowUpsell(true);
      
      // Track upsell shown
      if (window.posthog) {
        window.posthog.capture('bundle_upsell_shown', {
          bundle_id: PROTOCOL_STARTER_BUNDLE.id,
          bundle_name: PROTOCOL_STARTER_BUNDLE.name,
          context: 'cart_drawer',
          cart_items: items.length,
        });
      }
    }
  }, [items, dismissed]);

  const handleViewBundle = () => {
    if (window.posthog) {
      window.posthog.capture('bundle_upsell_clicked', {
        bundle_id: PROTOCOL_STARTER_BUNDLE.id,
        bundle_name: PROTOCOL_STARTER_BUNDLE.name,
      });
    }
    navigate('/bundles/starter');
    onClose?.();
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowUpsell(false);
    if (window.posthog) {
      window.posthog.capture('bundle_upsell_dismissed', {
        bundle_id: PROTOCOL_STARTER_BUNDLE.id,
      });
    }
  };

  if (!showUpsell) return null;

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 relative">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 transition-colors"
        aria-label="Dismiss bundle suggestion"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/20">
          <Package className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Complete Your Setup</h4>
            <Badge className="bg-primary/20 text-primary text-xs">
              {PROTOCOL_STARTER_BUNDLE.discount}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {PROTOCOL_STARTER_BUNDLE.description}
          </p>
          
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              ${PROTOCOL_STARTER_BUNDLE.price}
            </span>
            <span className="text-sm text-muted-foreground line-through">
              ${PROTOCOL_STARTER_BUNDLE.originalPrice}
            </span>
          </div>
          
          <Button 
            size="sm" 
            className="w-full mt-2 rounded-full btn-lickable"
            onClick={handleViewBundle}
          >
            View Bundle
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
