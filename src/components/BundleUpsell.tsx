import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Package, ArrowRight, Sparkles } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';

declare global {
  interface Window {
    posthog?: any;
  }
}

interface BundleUpsellProps {
  onClose?: () => void;
}

const JOURNAL_DISCOUNT_BUNDLE = {
  id: 'journal-addon',
  name: 'Research Journal',
  description: 'Add documentation journal to your laser + grating setup',
  discount: '20% OFF',
  originalPrice: 22,
  price: 17.60,
};

const PROTOCOL_STARTER_BUNDLE = {
  id: 'protocol-starter',
  name: 'Protocol Starter Kit',
  description: 'Complete 650nm laser + diffraction grating + research journal bundle',
  discount: '20% OFF',
  originalPrice: 85,
  price: 68,
};

export const BundleUpsell = ({ onClose }: BundleUpsellProps) => {
  const navigate = useNavigate();
  const items = useCartStore(state => state.items);
  const [showUpsell, setShowUpsell] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [upsellType, setUpsellType] = useState<'journal' | 'bundle'>('bundle');

  useEffect(() => {
    if (dismissed || items.length === 0) {
      setShowUpsell(false);
      return;
    }

    // Check cart contents for upsell eligibility
    const hasLaserProduct = items.some(item => {
      const title = item.product.node?.title?.toLowerCase() || '';
      return title.includes('laser') || 
             title.includes('650nm') || 
             title.includes('660nm') ||
             title.includes('red light');
    });

    const hasGrating = items.some(item => {
      const title = item.product.node?.title?.toLowerCase() || '';
      return title.includes('grating') || 
             title.includes('diffraction') ||
             title.includes('fractal');
    });

    const hasJournal = items.some(item => {
      const title = item.product.node?.title?.toLowerCase() || '';
      return title.includes('journal');
    });

    // Trigger logic: laser + grating present, but no journal = 20% journal discount
    if (hasLaserProduct && hasGrating && !hasJournal) {
      setShowUpsell(true);
      setUpsellType('journal');
      
      if (window.posthog) {
        window.posthog.capture('bundle_upsell_shown', {
          bundle_id: JOURNAL_DISCOUNT_BUNDLE.id,
          bundle_name: JOURNAL_DISCOUNT_BUNDLE.name,
          context: 'cart_drawer_journal_addon',
          cart_items: items.length,
          discount_applied: true,
        });
      }
      return;
    }

    // Alternative: has laser but nothing else = suggest full starter kit
    if (hasLaserProduct && !hasGrating && !hasJournal) {
      setShowUpsell(true);
      setUpsellType('bundle');
      
      if (window.posthog) {
        window.posthog.capture('bundle_upsell_shown', {
          bundle_id: PROTOCOL_STARTER_BUNDLE.id,
          bundle_name: PROTOCOL_STARTER_BUNDLE.name,
          context: 'cart_drawer_full_bundle',
          cart_items: items.length,
          discount_applied: false,
        });
      }
      return;
    }

    setShowUpsell(false);
  }, [items, dismissed]);

  const handleViewBundle = () => {
    const bundle = upsellType === 'journal' ? JOURNAL_DISCOUNT_BUNDLE : PROTOCOL_STARTER_BUNDLE;
    
    if (window.posthog) {
      window.posthog.capture('bundle_upsell_clicked', {
        bundle_id: bundle.id,
        bundle_name: bundle.name,
        upsell_type: upsellType,
      });
    }
    
    if (upsellType === 'journal') {
      // Navigate to tools page filtered to journals
      navigate('/tools?search=journal');
    } else {
      navigate('/bundles/starter');
    }
    onClose?.();
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowUpsell(false);
    
    const bundle = upsellType === 'journal' ? JOURNAL_DISCOUNT_BUNDLE : PROTOCOL_STARTER_BUNDLE;
    if (window.posthog) {
      window.posthog.capture('bundle_upsell_dismissed', {
        bundle_id: bundle.id,
        upsell_type: upsellType,
      });
    }
  };

  if (!showUpsell) return null;

  const bundle = upsellType === 'journal' ? JOURNAL_DISCOUNT_BUNDLE : PROTOCOL_STARTER_BUNDLE;

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 relative overflow-hidden animate-fade-in">
      {/* Beam underline effect */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
      
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-background/50 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Dismiss bundle suggestion"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-primary/20 flex-shrink-0">
          {upsellType === 'journal' ? (
            <Sparkles className="w-5 h-5 text-primary" />
          ) : (
            <Package className="w-5 h-5 text-primary" />
          )}
        </div>
        
        <div className="flex-1 space-y-3 pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-black text-sm tracking-tight">
              {upsellType === 'journal' ? 'Complete Your Setup' : 'Upgrade to Bundle'}
            </h4>
            <Badge className="bg-primary/20 text-primary text-xs font-semibold">
              {bundle.discount}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground font-light leading-relaxed">
            {bundle.description}
          </p>
          
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-primary">
              ${bundle.price.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground line-through font-light">
              ${bundle.originalPrice}
            </span>
          </div>
          
          <Button 
            size="sm" 
            className="w-full mt-2 rounded-full btn-lickable border-beam group touch-manipulation min-h-[44px]"
            onClick={handleViewBundle}
          >
            <span className="font-semibold">
              {upsellType === 'journal' ? 'Add Journal' : 'View Bundle'}
            </span>
            <ArrowRight className="w-3 h-3 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
