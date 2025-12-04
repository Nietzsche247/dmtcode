import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight } from 'lucide-react';

declare global {
  interface Window {
    posthog?: any;
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
    // Track bundle view
    if (window.posthog) {
      window.posthog.capture('bundle_viewed', {
        bundle_id: id,
        bundle_name: name,
        bundle_price: price,
        bundle_tier: tier,
      });
    }
    onClick(id);
  };

  return (
    <Card 
      className={`relative p-8 bg-gradient-to-br ${color} ${borderColor} border-2 hover:scale-[1.02] transition-all duration-300 animate-fade-slide-up group`}
    >
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-semibold shadow-lg">
          Most Popular
        </Badge>
      )}
      
      <div className="space-y-6">
        {/* Bundle Image */}
        <div className="aspect-video rounded-lg overflow-hidden bg-background/50">
          <img 
            src={image} 
            alt={`${name} - Research equipment bundle containing ${items.map(i => i.name).join(', ')}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        
        <div>
          <Badge className={`${badgeColor} font-semibold`}>{discount}</Badge>
          <h2 className="text-2xl font-black mt-3 tracking-tight">{name}</h2>
          <p className="text-muted-foreground font-light">{tagline}</p>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black text-primary tracking-tight">${price}</span>
          <span className="text-lg text-muted-foreground line-through font-light">${originalPrice}</span>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Includes:</p>
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
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Features:</p>
          <ul className="space-y-1">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground font-light">
                <Check className="w-3 h-3 text-primary flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <Button 
            className="w-full h-12 rounded-full btn-lickable border-beam group/btn touch-manipulation font-semibold"
            onClick={handleClick}
          >
            {cta}
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
          {/* Beam underline */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
        </div>
      </div>
    </Card>
  );
};
