import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FIELD_GUIDE } from '@/data/fieldGuide';

export function FieldGuideCard() {
  const trackClick = () => {
    const analytics = window as Window & { gtag?: (command: string, event: string) => void };
    if (typeof window !== 'undefined' && analytics.gtag) analytics.gtag('event', 'field_guide_cta_click');
  };
  return (
    <Card id={FIELD_GUIDE.id} className="flex flex-col p-6 md:p-8 rounded-2xl border border-border/60">
      <h3 className="font-serif text-2xl md:text-3xl leading-tight">{FIELD_GUIDE.name}</h3>
      <div className="mt-4 text-3xl font-black tabular-nums">{FIELD_GUIDE.price}</div>
      <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{FIELD_GUIDE.description}</p>
      <p className="mt-4 text-xs text-muted-foreground">Digital product. No shipping. Delivered by email after checkout. Sold by Meridian Optics Lab.</p>
      <div className="mt-auto pt-6">
        <Button asChild className="w-full"><a href={FIELD_GUIDE.cart} onClick={trackClick}>Buy. Secure Shopify checkout</a></Button>
        <p className="mt-2 text-xs text-muted-foreground">Digital downloads are not refundable once delivered.</p>
        <p className="mt-1 text-xs text-muted-foreground">Your card statement will read MERIDIAN OPTICS LAB.</p>
      </div>
    </Card>
  );
}

