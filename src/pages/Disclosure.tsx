import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';

const Disclosure = () => {
  return (
    <>
      <Helmet>
        <title>Disclosure | DMT Code</title>
        <meta name="description" content="How this project makes money, who we have relationships with, and where the conflicts are." />
        <link rel="canonical" href="https://dmtcode.com/disclosure" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Disclosure | DMT Code" />
        <meta property="og:description" content="How this project makes money, who we have relationships with, and where the conflicts are." />
        <meta property="og:url" content="https://dmtcode.com/disclosure" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />

        <main id="main-content" className="relative z-10 pt-4" role="main">
          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Disclosure</h1>
            <p className="text-lg text-muted-foreground mb-10">Effective 16 August 2026.</p>

            <div className="space-y-6 text-base leading-relaxed">
              <p>A site whose whole claim is that it can be trusted with a contested subject owes you a straight account of where its money comes from. This is that account.</p>

              <h2 className="text-2xl font-semibold mt-8">How this project pays for itself</h2>
              <p>One way.</p>
              <p><strong>Affiliate commissions.</strong> None at present. Earlier versions of this page named three affiliate products (a Bon Charge red light device, a MitoMAT red light mat, and a Peyote Way Church of God spirit walk). Those links have since been removed from the site and no affiliate relationship is currently active. If we add one, it will be named on this page before it goes live.</p>
              <p><strong>Direct sales.</strong> We sell equipment kits through our own Shopify store. When you buy a kit, we are the seller and the margin is ours.</p>
              <p>There is no venture funding, no pharmaceutical sponsorship, no paid placement, and nothing behind a paywall. The full dataset is free and openly licensed.</p>

              <h2 className="text-2xl font-semibold mt-8">Equipment we sell ourselves</h2>
              <p>We sell 650 nm laser kits and related equipment directly. This is a real commercial interest in the protocol this site documents, and it is the most obvious conflict in the project. We would rather state it in one sentence at the top of a page than have you find it.</p>
              <p>What we do about it: the protocol pages describe the equipment in generic terms, the specifications are published so you can buy the same parts elsewhere, and the critiques and null reports sections stay up regardless of what they do to sales.</p>

              <h2 className="text-2xl font-semibold mt-8">Our own event</h2>
              <p>The events list includes DMT Code Protocol Training, which is run by this project. It sits alongside events run by other people. It is ours and we are saying so.</p>

              <h2 className="text-2xl font-semibold mt-8">Editorial independence</h2>
              <p>Danny Goler first described the observation this project studies, and he is credited as its originator throughout the site. He is aware of the project but holds no editorial role in it. What gets published here, including the critiques and the null results, is decided independently, and the open dataset lets anyone check that policy against practice.</p>

              <h2 className="text-2xl font-semibold mt-8">Listings are not endorsements</h2>
              <p>Retreats, events and clinical trials are listed because they exist and are relevant, not because we vouch for them. We are not affiliated with the retreat centres we list, apart from the one named above, and we have not inspected any of them. Verify independently and get medical screening before booking anything.</p>

              <h2 className="text-2xl font-semibold mt-8">What we do not do</h2>
              <p>We do not accept payment for a listing, a favourable description, or a place in the registry. We do not sell, source or broker any controlled substance. We do not sell visitor data.</p>

              <h2 className="text-2xl font-semibold mt-8">Corrections</h2>
              <p>If you believe something on this page is incomplete, write to info@dmtcode.com and we will correct it.</p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Disclosure;
