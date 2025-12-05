import { useParams } from 'react-router-dom';
import { UnifiedProductDetail } from '@/components/UnifiedProductDetail';
import { getWooProduct, wooProducts } from '@/data/wooProducts';

const WooProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const item = slug ? getWooProduct(slug) : undefined;

  // Find related items (same category, excluding current)
  const relatedItems = item
    ? Object.values(wooProducts)
        .filter(i => i.category === item.category && i.slug !== item.slug)
        .slice(0, 3)
        .map(i => ({ slug: i.slug, title: i.title, price: i.price, image: i.image }))
    : [];

  return (
    <UnifiedProductDetail
      mode="woo"
      item={item}
      relatedItems={relatedItems}
    />
  );
};

export default WooProductDetail;
