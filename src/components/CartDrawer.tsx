import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, ExternalLink, Loader2, Mail } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { BundleUpsell } from "./BundleUpsell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window {
    posthog?: any;
  }
}

// The three live Shopify kit handles.
const KIT_HANDLES = new Set([
  '650nm-laser-diffraction-research-kit-solo',
  'multi-wavelength-laser-diffraction-kit-triad',
  'multi-wavelength-laser-diffraction-kit-circle',
]);

export const CartDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [emailCaptured, setEmailCaptured] = useState(false);
  const { 
    items, 
    isLoading, 
    updateQuantity, 
    removeItem, 
    createCheckout 
  } = useCartStore();
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);

  // Check if cart contains any kit
  const bundleInCart = items.find(item => KIT_HANDLES.has(item.product.node?.handle || ''));

  const persistedRef = useRef(false);

  // Persist the captured address before any network side effect, so a failed
  // invoke or a closed drawer never loses it.
  const persistEmail = async () => {
    if (persistedRef.current || !email) return;
    persistedRef.current = true;
    const bundleSlug = bundleInCart?.product.node?.handle || '';
    try {
      if (bundleSlug) {
        await (supabase as any)
          .from('product_signups')
          .insert({ bundle_slug: bundleSlug, email });
      } else {
        const routeSource = window.location.pathname.replace(/^\/+|\/+$/g, '') || 'home';
        await (supabase as any)
          .from('waitlist')
          .insert({ email, source: routeSource });
      }
    } catch (err) {
      persistedRef.current = false;
      console.error('Failed to persist email:', err);
    }
  };

  const handleCheckout = async () => {
    const discountApplied = items.some(item => {
      const title = item.product.node?.title?.toLowerCase() || '';
      return title.includes('journal') && bundleInCart;
    });

    // Track checkout start with full PostHog events
    if (window.posthog) {
      window.posthog.capture('bundle_checkout_started', {
        cart_value: totalPrice,
        item_count: totalItems,
        items: items.map(i => ({
          title: i.product.node?.title,
          price: i.price.amount,
          quantity: i.quantity,
        })),
        has_bundle: !!bundleInCart,
        bundle_tier: bundleInCart?.product.node?.handle ?? null,
        price: totalPrice,
        email_captured: emailCaptured,
        discount_applied: discountApplied,
      });
    }

    try {
      await createCheckout();
      const checkoutUrl = useCartStore.getState().checkoutUrl;
      
      if (checkoutUrl) {
        // Track bundle purchased event (fired before redirect)
        if (window.posthog && bundleInCart) {
          window.posthog.capture('bundle_purchased', {
            bundle_tier: bundleInCart?.product.node?.handle ?? null,
            bundle_name: bundleInCart.product.node?.title,
            price: totalPrice,
            discount_applied: discountApplied,
            item_count: totalItems,
            email_captured: emailCaptured,
          });
        }

        // Record the email capture against the kit before redirecting.
        if (bundleInCart && email) {
          await persistEmail();
        }

        
        window.open(checkoutUrl, '_blank');
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error('Checkout failed', {
        description: 'Please try again.',
      });
    }
  };

  const handleRemoveItem = (variantId: string, title: string) => {
    if (window.posthog) {
      window.posthog.capture('removed_from_cart', {
        variant_id: variantId,
        product_title: title,
      });
    }
    removeItem(variantId);
  };

  const handleEmailCapture = () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    setEmailCaptured(true);
    void persistEmail();
    toast.success('Email saved!', {
      description: 'You\'ll receive onboarding emails after purchase.',
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative touch-manipulation"
          aria-label={`Shopping cart with ${totalItems} items`}
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Your cart is empty" : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`}
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex gap-3 p-2">
                      <div className="w-16 h-16 bg-secondary/20 rounded-md overflow-hidden flex-shrink-0">
                        {item.product.node?.images?.edges?.[0]?.node && (
                          <img
                            src={item.product.node.images.edges[0].node.url}
                            alt={`${item.product.node.title} - Research equipment`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate text-sm">{item.product.node?.title}</h4>
                        {item.selectedOptions.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {item.selectedOptions.map(option => option.value).join(' • ')}
                          </p>
                        )}
                        <p className="font-semibold text-sm mt-1">
                          ${parseFloat(item.price.amount).toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 touch-manipulation"
                          onClick={() => handleRemoveItem(item.variantId, item.product.node?.title || '')}
                          aria-label={`Remove ${item.product.node?.title} from cart`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 touch-manipulation"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 touch-manipulation"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Bundle Upsell */}
                <div className="mt-4">
                  <BundleUpsell onClose={() => setIsOpen(false)} />
                </div>

                {/* Email Capture for Bundle Purchases */}
                {bundleInCart && !emailCaptured && (
                  <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm font-medium">Get Onboarding Support</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter your email to receive research guides, protocol tips, and integration support after purchase.
                    </p>
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Your name (optional)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-9 text-sm flex-1"
                        />
                        <Button 
                          size="sm" 
                          onClick={handleEmailCapture}
                          className="h-9"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {bundleInCart && emailCaptured && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Email saved! You'll receive onboarding emails after checkout.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex-shrink-0 space-y-4 pt-4 border-t bg-background">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-xl font-bold">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                
                <Button 
                  onClick={handleCheckout}
                  className="w-full h-12 rounded-full btn-lickable touch-manipulation" 
                  size="lg"
                  disabled={items.length === 0 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Checkout...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Checkout with Shopify
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
