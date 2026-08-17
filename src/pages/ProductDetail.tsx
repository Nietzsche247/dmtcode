import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Check, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { storefrontApiRequest } from '@/lib/shopify';
import { bundleShopifyHandles } from '@/hooks/useBundleAvailability';
import { useCartStore } from '@/stores/cartStore';
import NotFound from './NotFound';

const PRODUCT_QUERY = `
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
      descriptionHtml
      images(first: 6) { edges { node { url altText } } }
      variants(first: 1) {
        edges {
          node { id availableForSale price { amount currencyCode } }
        }
      }
    }
  }
`;

type Bundle = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  kind: string;
  people: number;
  price_cents: number;
  wave: number;
  ships_status: string;
};

type BundleItem = {
  id: string;
  component_name: string;
  qty: number;
  is_shared: boolean;
  sort_order: number;
};

const dollars = (amount: string, currency = 'USD') =>
  `${currency === 'USD' ? '$' : ''}${Number(amount).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;

const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

function NotifyInline({ slug, name }: { slug: string; name: string }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid email');
      return;
    }
    setBusy(true);
    const { error } = await (supabase as any)
      .from('product_signups')
      .insert({ bundle_slug: slug, email });
    if (error) {
      toast.error('Could not save your email. Please try again.');
      setBusy(false);
      return;
    }
    toast.success('You will hear from us before it opens.');
    setEmail('');
    setDone(true);
    setBusy(false);
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground border-t border-border/40 pt-4 mt-4">
        <Check className="w-4 h-4 text-primary" />
        You are on the list for {name}.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border-t border-border/40 pt-4 mt-4 space-y-2">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Bell className="w-3.5 h-3.5" />
        Notify me when this ships
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          aria-label={`Notify email for ${name}`}
          className="h-10 rounded-lg"
        />
        <Button type="submit" disabled={busy} className="h-10 rounded-lg">
          {busy ? '...' : 'Notify me'}
        </Button>
      </div>
    </form>
  );
}

const ProductDetail = () => {
  const { handle = '' } = useParams();
  const addItem = useCartStore((s) => s.addItem);
  const [activeImage, setActiveImage] = useState(0);

  const bundleSlug = Object.entries(bundleShopifyHandles).find(
    ([, h]) => h === handle
  )?.[0];

  const productQuery = useQuery({
    queryKey: ['product-detail', handle],
    enabled: !!handle,
    queryFn: async () => {
      const data = await storefrontApiRequest(PRODUCT_QUERY, { handle });
      return data?.data?.productByHandle ?? null;
    },
  });

  const bundleQuery = useQuery({
    queryKey: ['product-bundle', bundleSlug],
    enabled: !!bundleSlug,
    queryFn: async () => {
      const { data: bundle } = await (supabase as any)
        .from('bundles')
        .select('*')
        .eq('slug', bundleSlug)
        .maybeSingle();
      if (!bundle) return null;
      const { data: items } = await (supabase as any)
        .from('bundle_items')
        .select('*')
        .eq('bundle_id', bundle.id)
        .order('sort_order');
      return { bundle: bundle as Bundle, items: (items ?? []) as BundleItem[] };
    },
  });

  if (productQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-24 text-muted-foreground">Loading instrument…</div>
        <Footer />
      </div>
    );
  }

  const product = productQuery.data;
  if (!product) return <NotFound />;

  const images: Array<{ url: string; altText: string | null }> =
    product.images?.edges?.map((e: any) => e.node) ?? [];
  const variant = product.variants?.edges?.[0]?.node;
  const price = variant?.price;
  const bundle = bundleQuery.data?.bundle;
  const items = bundleQuery.data?.items ?? [];
  const shared = items.filter((i) => i.is_shared);
  const perPerson = items.filter((i) => !i.is_shared);

  const buyable =
    !!variant?.availableForSale && (!bundle || bundle.ships_status === 'now');

  const isMulti = handle.includes('multi-wavelength');
  const specParts = [
    isMulti ? 'Multi-wavelength' : '650 nm',
    'Class 3R, under 5 mW',
    bundle
      ? `${bundle.people} ${bundle.people === 1 ? 'observer' : 'observers'}`
      : null,
    bundle
      ? bundle.ships_status === 'now'
        ? 'Ships now'
        : `Preorder · Wave ${bundle.wave}`
      : variant?.availableForSale
      ? 'In stock'
      : 'Unavailable',
  ].filter(Boolean) as string[];

  const plain = stripHtml(product.descriptionHtml || '');
  const metaDescription = plain.slice(0, 155);
  const canonical = `https://dmtcode.com/products/${handle}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: images.map((i) => i.url),
    description: plain,
    url: canonical,
    ...(price
      ? {
          offers: {
            '@type': 'Offer',
            price: price.amount,
            priceCurrency: price.currencyCode,
            availability: variant?.availableForSale
              ? 'https://schema.org/InStock'
              : 'https://schema.org/PreOrder',
            url: canonical,
          },
        }
      : {}),
  };

  const handleAddToCart = () => {
    if (!variant?.id || !price) return;
    addItem({
      product: {
        node: {
          id: product.id,
          title: product.title,
          description: plain,
          handle: product.handle,
          priceRange: { minVariantPrice: price },
          images: { edges: images.map((n) => ({ node: n })) },
          variants: {
            edges: [
              {
                node: {
                  id: variant.id,
                  title: 'Default Title',
                  price,
                  availableForSale: true,
                  selectedOptions: [],
                },
              },
            ],
          },
          options: [],
        },
      } as any,
      variantId: variant.id,
      variantTitle: 'Default Title',
      price,
      quantity: 1,
      selectedOptions: [],
    });
    toast.success('Added to cart', { description: product.title });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${product.title} — DMT Code`}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${product.title} — DMT Code`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="product" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Navigation />
      <Breadcrumb titleOverride={product.title} />

      <main className="container mx-auto px-4 pb-24 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div>
            {images.length > 0 && (
              <>
                <div className="aspect-square rounded-2xl overflow-hidden border border-border/60 bg-muted/20">
                  <img
                    src={images[activeImage]?.url}
                    alt={images[activeImage]?.altText || `${product.title} product image`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {images.map((img, i) => (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => setActiveImage(i)}
                        aria-label={`View image ${i + 1} of ${product.title}`}
                        className={`aspect-square rounded-lg overflow-hidden border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          i === activeImage ? 'border-primary' : 'border-border/60 hover:border-primary/50'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.altText || `${product.title} thumbnail ${i + 1}`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Datasheet */}
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">{product.title}</h1>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-3">
              {specParts.join(' · ')}
            </div>
            {price && (
              <div className="text-3xl font-black tracking-tight tabular-nums mt-5">
                {dollars(price.amount, price.currencyCode)}
              </div>
            )}

            {product.descriptionHtml && (
              <div
                className="prose prose-invert prose-sm md:prose-base max-w-none mt-6 text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            )}

            {bundle && items.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">
                  Bill of materials
                </h2>
                {shared.length > 0 && (
                  <ul className="divide-y divide-border/30 text-sm">
                    {shared.map((i) => (
                      <li key={i.id} className="flex justify-between py-2">
                        <span className="text-foreground">{i.component_name}</span>
                        <span className="text-muted-foreground tabular-nums">{i.qty}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {perPerson.length > 0 && (
                  <>
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-mono mt-5 mb-3">
                      Per person
                    </h3>
                    <ul className="divide-y divide-border/30 text-sm">
                      {perPerson.map((i) => (
                        <li key={i.id} className="flex justify-between py-2">
                          <span className="text-foreground">{i.component_name}</span>
                          <span className="text-muted-foreground tabular-nums">{i.qty}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <p className="text-xs text-muted-foreground mt-4">
                  {bundle.ships_status === 'now'
                    ? 'Ships now.'
                    : 'Preorder. Opens when a source and date are confirmed.'}
                </p>
              </div>
            )}

            <div className="mt-8">
              {buyable && price ? (
                <Button
                  onClick={handleAddToCart}
                  className="w-full h-12 rounded-lg text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to cart — {dollars(price.amount, price.currencyCode)}
                </Button>
              ) : bundle ? (
                <NotifyInline slug={bundle.slug} name={bundle.name} />
              ) : (
                <Button disabled className="w-full h-12 rounded-lg text-base">
                  Unavailable
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
