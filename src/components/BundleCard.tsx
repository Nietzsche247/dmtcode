import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight } from 'lucide-react';

declare global {
  interface Window {
    posthog?: any;
    gtag?: (...args: any[]) => void;
  }
}

interface BundleItem {
  name: string;
  value: number;
}

interface BundleCardProps {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice: number;
  discount: string;
  tier: string;
  popular?: boolean;
  image: string;
  items: BundleItem[];
  features: string[];
  cta: string;
  color: string;
  borderColor: string;
  badgeColor: string;
  onClick: (bundleId: string) => void;
}

export const BundleCard = ({
  id,
  name,
  tagline,
  price,
  originalPrice,
  discount,
  tier,
  popular,
  image,
  items,
  features,
  cta,
  color,
  borderColor,
  badgeColor,
  onClick,
}: BundleCardProps) => {
  const handleClick = () => {
    // GA4 conversion event for bundle CTA clicks
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'bundle_cta_click', {
        bundle_id: id,
        bundle_name: name,
        label: cta,
        value: price,
        currency: 'USD',
        send_to: 'G-CWVKJBDG7L',
      });
    }
    // Track bundle view with enhanced PostHog event
    if (window.posthog) {
      window.posthog.capture('bundle_viewed', {
        bundle_id: id,
        bundle_name: name,
        bundle_price: price,
        bundle_tier: tier,
        discount_applied: true,
        original_price: originalPrice,
        savings: originalPrice - price,
      });
    }
    onClick(id);
  };

  return (
    <Card 
      className={`relative p-8 bg-gradient-to-br ${color} ${borderColor} border-2 hover:scale-[1.02] transition-all duration-300 animate-fade-slide-up group cursor-pointer`}
      onClick={handleClick}
      role="article"
      aria-label={`${name} bundle - $${price}, ${discount}`}
    >
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-black shadow-lg z-10">
          Most Popular
        </Badge>
      )}
      
      <div className="space-y-6">
        {/* Bundle Image */}
        <div className="aspect-video rounded-lg overflow-hidden bg-background/50 relative">
          <img 
            src={image} 
            alt={`${name} - Research equipment bundle containing ${items.map(i => i.name).join(', ')}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            width={1200}
            height={675}
          />
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div>
          <Badge className={`${badgeColor} font-black text-xs`}>{discount}</Badge>
          {/* Inter Black title */}
          <h2 className="text-2xl font-black mt-3 tracking-tight leading-tight">{name}</h2>
          {/* Inter Light 300 description */}
          <p className="text-muted-foreground font-light text-sm mt-1">{tagline}</p>
        </div>

        {/* Price with Inter Black + Inter Light 300 */}
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black text-primary tracking-tight">${price}</span>
          <span className="text-lg text-muted-foreground line-through font-light">${originalPrice}</span>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">Includes:</p>
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground font-light ml-auto">${item.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 pt-4 border-t border-border/50">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">Features:</p>
          <ul className="space-y-1">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground font-light">
                <Check className="w-3 h-3 text-primary flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA with 44px touch target and beam underline */}
        <div className="relative">
          <Button 
            className="w-full h-12 min-h-[44px] rounded-full btn-lickable border-beam group/btn touch-manipulation font-black text-sm uppercase tracking-wide"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            {cta}
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
          {/* 1px #C41E3A glowing beam underline */}
          <div 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-[1px]"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)',
              boxShadow: '0 0 8px hsl(var(--primary) / 0.5), 0 0 16px hsl(var(--primary) / 0.3)',
            }}
          />
        </div>
      </div>
    </Card>
  );
};
