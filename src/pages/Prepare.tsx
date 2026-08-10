import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { PageHero } from '@/components/PageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, ShieldAlert, Users, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useBundleAvailability } from '@/hooks/useBundleAvailability';
import { useCartStore } from '@/stores/cartStore';

type Bundle = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  kind: 'kit' | 'group';
  tier: 'good' | 'better' | 'best' | 'complete';
  people: number;
  price_cents: number;
  parts_sum_cents: number;
  wave: number;
  ships_status: 'now' | 'preorder' | string;
  is_best: boolean;
  sort_order: number;
};

type BundleItem = {
  id: string;
  bundle_id: string;
  component_name: string;
  qty: number;
  is_shared: boolean;
  is_digital: boolean;
  sort_order: number;
};

const TIER_LABEL: Record<string, string> = {
  good: 'Good',
  better: 'Better',
  best: 'Best',
  complete: 'Complete',
};

const dollars = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const shipLabel = (b: Bundle) =>
  b.ships_status === 'now'
    ? 'Ships now'
    : 'Preorder. Opens when a source and date are confirmed.';

function NotifyInline({ slug, name, eyebrow }: { slug: string; name: string; eyebrow?: string }) {
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
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'prepare_notify_signup', {
        bundle_slug: slug,
        bundle_name: name,
        event_category: 'engagement',
      });
    }
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
        {eyebrow ?? 'Notify me when this ships'}
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

function BundleCard({
  bundle,
  items,
  perspective,
}: {
  bundle: Bundle;
  items: BundleItem[];
  perspective: 'kit' | 'group';
}) {
  const diff = bundle.price_cents - bundle.parts_sum_cents;
  const shared = items.filter((i) => i.is_shared);
  const perPerson = items.filter((i) => !i.is_shared);
  const perPersonPrice = Math.round(bundle.price_cents / bundle.people);

  const { data: availability } = useBundleAvailability();
  const addItem = useCartStore((s) => s.addItem);
  const shopify = availability?.[bundle.slug];
  const canBuy =
    bundle.ships_status === 'now' && !!shopify?.availableForSale && !!shopify?.variantId;

  const handleAddToCart = () => {
    if (!shopify?.variantId) return;
    const price = shopify.price ?? {
      amount: (bundle.price_cents / 100).toFixed(2),
      currencyCode: 'USD',
    };
    addItem({
      product: {
        node: {
          id: bundle.id,
          title: bundle.name,
          description: bundle.tagline ?? '',
          handle: shopify.handle,
          priceRange: { minVariantPrice: price },
          images: { edges: [] },
          variants: {
            edges: [
              {
                node: {
                  id: shopify.variantId,
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
      variantId: shopify.variantId,
      variantTitle: 'Default Title',
      price,
      quantity: 1,
      selectedOptions: [],
    });
    toast.success('Added to cart', { description: bundle.name });
  };



  return (
    <Card
      className={`relative p-6 md:p-8 rounded-2xl border transition-all ${
        bundle.is_best
          ? 'border-primary/60 shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]'
          : 'border-border/60'
      }`}
    >
      {bundle.is_best && (
        <Badge className="absolute -top-3 left-6 rounded-full px-3 py-1 text-[10px] tracking-[0.2em] uppercase">
          Recommended
        </Badge>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {TIER_LABEL[bundle.tier] ?? bundle.tier}
            {perspective === 'group' && ` . ${bundle.people} people`}
          </div>
          <h3 className="font-serif text-3xl md:text-4xl mt-1">{bundle.name}</h3>
          {bundle.tagline && (
            <p className="text-sm text-muted-foreground mt-1 max-w-md">{bundle.tagline}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-3xl font-black tracking-tight">{dollars(bundle.price_cents)}</div>
          {perspective === 'group' ? (
            <div className="text-xs text-muted-foreground mt-1">
              {dollars(perPersonPrice)} per person
            </div>
          ) : (
            <div className="text-xs text-muted-foreground mt-1">
              {dollars(bundle.price_cents)}. That is {dollars(Math.abs(diff))}{' '}
              {diff >= 0 ? 'more than' : 'less than'} sourcing the parts yourself.
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">{shipLabel(bundle)}</div>

      {perspective === 'group' ? (
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Per person
            </div>
            <ul className="text-sm space-y-1.5">
              {perPerson.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span>{i.component_name}</span>
                  <span className="text-muted-foreground">x{i.qty}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Shared (amortized)
            </div>
            {shared.length ? (
              <ul className="text-sm space-y-1.5">
                {shared.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span>{i.component_name}</span>
                    <span className="text-muted-foreground">x{i.qty}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No shared items. Facilitator guide and group agreements are not included at this
                size.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            What is inside
          </div>
          <ul className="text-sm space-y-1.5">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span>{i.component_name}</span>
                <span className="text-muted-foreground">x{i.qty}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canBuy ? (
        <>
          <Button
            className="w-full h-11 rounded-lg mt-4 font-black"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {`Add to cart — ${dollars(bundle.price_cents)}`}
          </Button>
          <NotifyInline
            slug={bundle.slug}
            name={bundle.name}
            eyebrow="Get research updates for this kit"
          />
        </>
      ) : (
        <NotifyInline slug={bundle.slug} name={bundle.name} />
      )}
    </Card>
  );
}

const Prepare = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [items, setItems] = useState<BundleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: b }, { data: i }] = await Promise.all([
        (supabase as any).from('bundles').select('*').eq('is_published', true).order('sort_order'),
        (supabase as any).from('bundle_items').select('*').order('sort_order'),
      ]);
      setBundles((b as Bundle[]) ?? []);
      setItems((i as BundleItem[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const kits = bundles.filter((b) => b.kind === 'kit');
  const groups = bundles.filter((b) => b.kind === 'group');
  const itemsFor = (id: string) => items.filter((i) => i.bundle_id === id);

  return (
    <>
      <Helmet>
        <title>Prepare. Kits and group bundles for careful practice.</title>
        <meta
          name="description"
          content="Kits and group bundles for careful practice. The two kits that ship now are printed material only. Everything with a 650 nm module is preorder."
        />
        <link rel="canonical" href="https://dmtcode.com/prepare" />
      </Helmet>

      <div className="relative min-h-screen">
        <main className="relative z-10">
          <Navigation />
          <Breadcrumb />

          <PageHero
            eyebrow="Prepare"
            title="Careful preparation"
            titleAccent="over careless purchase"
            subtitle="Kits for one observer. Group bundles for two, three, or five. Every bill of materials is listed in full. Kits that ship now can be added to your cart and checked out directly. Preorder cards record interest and nothing else."
          />

          {/* SAFETY */}
          <section className="max-w-4xl mx-auto px-4 -mt-6">
            <Card className="p-6 md:p-8 rounded-2xl border-destructive/40 bg-destructive/5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 mt-1 text-destructive shrink-0" />
                <div className="space-y-3">
                  <h2 className="font-serif text-2xl">Before you go further</h2>
                  <p className="text-sm">
                    This page is for adults 18 and older. Raise the following with a qualified
                    prescriber before any consideration of practice:
                  </p>
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    <li>MAOIs, current or recent</li>
                    <li>SSRIs and related serotonergic medications</li>
                    <li>Cardiac history</li>
                    <li>Personal or family history of psychosis</li>
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    We publish no discontinuation windows. Timing decisions belong to a clinician
                    who knows your history.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Every bundle that contains a 650 nm optical module also contains eyewear marked
                    Safety Eyewear OD2+. We have not published the measured output of that module,
                    its laser classification, or the optical density curve of that eyewear. Until
                    we do, do not look into the beam, do not aim it at anyone, and treat every
                    reflective surface in the room as part of the beam path.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* KIT LADDER */}
          <section className="max-w-6xl mx-auto px-4 mt-20">
            <header className="mb-8">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Kit ladder
              </div>
              <h2 className="font-serif text-3xl md:text-4xl mt-2">For one observer</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Four tiers, each a superset of the last. Observer and Practitioner are printed
                material only. The 650 nm optical module, the diffraction grating set and the
                OD2+ safety eyewear first appear in the Instrument tier.
              </p>
            </header>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading catalog...</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {kits.map((b) => (
                  <BundleCard key={b.id} bundle={b} items={itemsFor(b.id)} perspective="kit" />
                ))}
              </div>
            )}
          </section>

          {/* GROUP LADDER */}
          <section className="max-w-6xl mx-auto px-4 mt-20">
            <header className="mb-8">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Group ladder
              </div>
              <h2 className="font-serif text-3xl md:text-4xl mt-2">Two, three, or five together</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Per person cost falls as the circle grows because shared instruments amortize. The
                Triad and Circle include a Facilitator Guide and Group Agreements Card. The Pair
                does not.
              </p>
            </header>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading catalog...</p>
            ) : (
              <div className="grid gap-6">
                {groups.map((b) => (
                  <BundleCard key={b.id} bundle={b} items={itemsFor(b.id)} perspective="group" />
                ))}
              </div>
            )}
          </section>

          {/* GUARANTEE */}
          <section className="max-w-4xl mx-auto px-4 mt-24">
            <Card className="p-8 rounded-2xl border-border/60">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                What we can say today
              </div>
              <h2 className="font-serif text-3xl mt-2 mb-6">What is settled and what is not</h2>
              <div className="space-y-4 text-sm leading-relaxed">
                <p>
                  <strong>The bill of materials is the whole bill.</strong> Every component of
                  every kit is listed on this page with its quantity. Nothing is held back for a
                  later upsell.
                </p>
                <p>
                  <strong>The price sits above the parts total, not below it.</strong> Every kit
                  and bundle on this page costs more than sourcing the same parts yourself, and
                  each kit card prints that difference in dollars. You are paying for assembly and
                  for the printed material, not for a discount.
                </p>
                <p>
                  <strong>Two kits can be produced now. Five bundles cannot.</strong> Observer and
                  Practitioner are printed material and are marked as shipping now. Every bundle
                  that contains a 650 nm optical module is preorder, and preorder here means no
                  source and no date have been confirmed.
                </p>
                <p>
                  <strong>Checkout is open only for kits marked ships now.</strong> Preorder cards
                  cannot be paid for; the notify form records interest and nothing else.
                </p>
                <p>
                  <strong>The optical specifications are not published.</strong> We have not
                  published a manufacturer, a model, a measured wavelength, a measured output, a
                  laser classification, a grating line density, or an optical density curve for the
                  eyewear. Until those are published, treat the optical components on this page as
                  unspecified.
                </p>
              </div>
            </Card>
          </section>

          {/* OPEN DATA */}
          <section className="max-w-4xl mx-auto px-4 mt-16">
            <Card className="p-6 md:p-8 rounded-2xl border-border/60">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                The open data behind this
              </div>
              <h2 className="font-serif text-2xl mt-2 mb-3">Verify us</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Everything on this page sits on top of an open, community maintained record. Browse
                the <a href="/registry" className="underline hover:text-foreground">convergence registry</a>, read the machine
                readable corpus at <a href="/dataset" className="underline hover:text-foreground">/dataset</a>, or fetch{' '}
                <a href="/data.json" className="underline hover:text-foreground">/data.json</a> directly. CC-BY-4.0.
                Common questions are answered at <a href="/faq" className="underline hover:text-foreground">/faq</a>.
              </p>
            </Card>
          </section>

          {/* DISCLAIMER */}
          <section className="max-w-4xl mx-auto px-4 mt-16 mb-24">
            <p className="text-xs text-muted-foreground leading-relaxed">
              For educational and harm reduction purposes only. Does not encourage or condone use
              of any illegal substance. Not medical or legal advice. Not intended to diagnose,
              treat, cure, or prevent any disease. Consult a qualified healthcare provider. Must
              be 18 or older.
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Prepare;
