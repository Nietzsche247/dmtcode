import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { ShopifyProduct } from '@/lib/shopify';
import { getPlaceholderImage } from '@/utils/placeholderImage';
import { ShareButtons } from '@/components/ShareButtons';

declare global {
  interface Window {
    posthog?: any;
  }
}

interface ProductCardProps {
  product: ShopifyProduct;
  onAddToCart: (product: ShopifyProduct) => void;
  onClick: (product: ShopifyProduct) => void;
}

export const ProductCard = ({ product, onAddToCart, onClick }: ProductCardProps) => {
  if (!product?.node) return null;
  
  const variant = product.node.variants?.edges?.[0]?.node;
  const image = product.node.images?.edges?.[0]?.node;
  const price = variant ? parseFloat(variant.price?.amount || '0') : 0;
  const title = product.node.title || 'Untitled Product';
  const description = product.node.description || '';
  const handle = product.node.handle || product.node.id;
  const imageUrl = image?.url || getPlaceholderImage(title, 'product');

  const handleClick = () => {
    // Track product view
    if (window.posthog) {
      window.posthog.capture('product_viewed', {
        product_id: product.node.id,
        product_title: title,
        product_price: price,
        product_handle: handle,
      });
    }
    onClick(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Track add to cart
    if (window.posthog) {
      window.posthog.capture('added_to_cart', {
        product_id: product.node.id,
        product_title: title,
        product_price: price,
        product_handle: handle,
        quantity: 1,
      });
    }
    
    onAddToCart(product);
  };

  return (
    <Card 
      className="group p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 space-y-4 cursor-pointer animate-fade-slide-up"
      itemScope
      itemType="https://schema.org/Product"
      onClick={handleClick}
    >
      <meta itemProp="name" content={title} />
      <meta itemProp="description" content={description} />
      {image && <meta itemProp="image" content={image.url} />}
      <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
        <meta itemProp="price" content={price.toString()} />
        <meta itemProp="priceCurrency" content={variant?.price?.currencyCode || 'USD'} />
        <meta itemProp="availability" content="https://schema.org/InStock" />
      </div>

      <div className="flex gap-4">
        <div className="w-32 h-32 flex-shrink-0 bg-secondary/20 rounded-lg overflow-hidden">
          <img 
            src={imageUrl} 
            alt={image?.altText || `${title} - 650nm laser research equipment for DMT protocol`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getPlaceholderImage(title, 'product');
            }}
          />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-black text-lg leading-tight line-clamp-2 tracking-tight">
              {title}
            </h3>
            <ShareButtons 
              title={title} 
              description={description?.slice(0, 100)} 
              url={`https://dmtcode.com/products/${handle}`}
            />
          </div>
          <p className="text-2xl font-black text-primary tracking-tight">
            ${price.toFixed(2)}
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground font-light leading-relaxed line-clamp-3">
        {description}
      </p>

      <div className="pt-2 relative">
        <Button 
          className="w-full bg-primary hover:bg-primary/90 rounded-full btn-lickable group/btn touch-manipulation min-h-[44px] font-semibold"
          onClick={handleAddToCart}
          aria-label={`Add ${title} to cart`}
          size="lg"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
        {/* Beam underline */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
      </div>
    </Card>
  );
};
