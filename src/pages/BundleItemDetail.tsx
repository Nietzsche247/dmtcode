import { useParams } from 'react-router-dom';
import { UnifiedProductDetail, BundleInfo } from '@/components/UnifiedProductDetail';
import { getBundleItem, bundleItems } from '@/data/bundleItems';

// Bundle definitions
const BUNDLES: BundleInfo[] = [
  { id: 'starter', name: 'Fractal Starter Kit', price: 85, items: ['650nm-laser-pointer', 'diffraction-grating'] },
  { id: 'gateway', name: 'Gateway Research Kit', price: 299, items: ['650nm-laser-pointer', 'diffraction-grating', 'protocol-journal', 'lab-timer'] },
  { id: 'complete', name: 'Complete Symbol Kit', price: 599, items: ['650nm-laser-pointer', 'diffraction-grating', 'protocol-journal', 'lab-timer', 'quarton-laser-module', 'znse-lens'] },
  { id: 'ceremony', name: 'Extended Ceremony Package', price: 1999, items: ['650nm-laser-pointer', 'diffraction-grating', 'protocol-journal', 'lab-timer', 'quarton-laser-module', 'znse-lens', 'mitomat-yoga-mat', 'huepar-laser-level', 'refraction-tank'] },
];

const BundleItemDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const item = slug ? getBundleItem(slug) : undefined;

  // Find related items (same category, excluding current)
  const relatedItems = item 
    ? Object.values(bundleItems)
        .filter(i => i.category === item.category && i.slug !== item.slug)
        .slice(0, 3)
        .map(i => ({ slug: i.slug, title: i.title, price: i.price, image: i.image }))
    : [];

  return (
    <UnifiedProductDetail
      mode="research"
      item={item}
      relatedItems={relatedItems}
      bundles={BUNDLES}
    />
  );
};

export default BundleItemDetail;
