import { useState } from "react";
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

// Bundle SKU prefixes to detect bundle purchases
const BUNDLE_SKU_PREFIXES = ['BUNDLE-STARTER', 'BUNDLE-GATEWAY', 'BUNDLE-COMPLETE', 'BUNDLE-CEREMONY'];
const BUNDLE_TYPE_MAP: Record<string, 'starter' | 'gateway' | 'complete' | 'ceremony'> = {
  'fractal-starter-kit': 'starter',
  'gateway-research-kit': 'gateway',
  'complete-symbol-kit': 'complete',
  'extended-ceremony-package': 'ceremony',
};

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

  // Check if cart contains any bundles
  const bundleInCart = items.find(item => {
    const handle = item.product.node?.handle || '';
    return Object.keys(BUNDLE_TYPE_MAP).includes(handle);
  });

  const getBundleType = (handle: string): 'starter' | 'gateway' | 'complete' | 'ceremony' | null => {
    return BUNDLE_TYPE_MAP[handle] || null;
  };

  const triggerEmailSequence = async (bundleType: 'starter' | 'gateway' | 'complete' | 'ceremony', orderId: string) => {
    if (!email) return;

    try {
      const { data, error } = await supabase.functions.invoke('bundle-purchase-emails', {
        body: {
          email,
          customerName: customerName || 'Researcher',
          bundleType,
          orderId,
        },
      });

      if (error) {
        console.error('Error triggering email sequence:', error);
      } else {
        console.log('Email sequence initiated:', data);
      }
    } catch (err) {
      console.error('Failed to trigger email sequence:', err);
    }
  };

  const handleCheckout = async () => {
    // Track checkout start
    if (window.posthog) {
      window.posthog.capture('checkout_started', {
        cart_value: totalPrice,
        item_count: totalItems,
        items: items.map(i => ({
          title: i.product.node?.title,
          price: i.price.amount,
          quantity: i.quantity,
        })),
        has_bundle: !!bundleInCart,
        email_captured: emailCaptured,
      });
    }

    try {
      await createCheckout();
      const checkoutUrl = useCartStore.getState().checkoutUrl;
      
      if (checkoutUrl) {
        // If bundle in cart and email captured, trigger email sequence
        if (bundleInCart && email) {
          const bundleHandle = bundleInCart.product.node?.handle || '';
          const bundleType = getBundleType(bundleHandle);
          
          if (bundleType) {
            const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            await triggerEmailSequence(bundleType, orderId);
            toast.success('Email sequence started!', {
              description: 'Check your inbox for onboarding instructions.',
            });
          }
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
