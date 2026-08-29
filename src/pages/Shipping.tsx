import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';

const Shipping = () => {
  return (
    <>
      <SEO uiKey="shipping" path="/shipping" />
      <Helmet>
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />

        <main id="main-content" className="relative z-10 pt-4" role="main">
          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Shipping Policy</h1>
            <p className="text-lg text-muted-foreground mb-10">These policies belong to Meridian Optics Lab, the store of record for DMT Code kits.</p>

            <div className="space-y-6 text-base leading-relaxed">
              <p>All kits ship free within the United States. Orders are processed within 2 business days and arrive within 7 to 10 business days of ordering.</p>
              <p>You will receive a shipping confirmation email with tracking when your order is on its way. Kits ship in plain packaging.</p>
              <p>If your order has not arrived within 10 business days, email info@dmtcode.com with your order number and we will investigate with the carrier.</p>
              <p>We also ship internationally to Canada, the United Kingdom, Ireland, most of the European Union, Norway, Switzerland, Israel, the United Arab Emirates, Japan, South Korea, Hong Kong, Singapore, Malaysia, Australia and New Zealand. International rates are carrier calculated (USPS or DHL Express) and shown at checkout before you pay. Delivery timelines vary by destination, and any customs duties or import taxes are the responsibility of the buyer. If your country is not offered at checkout, email info@dmtcode.com before ordering.</p>

              <p className="text-sm text-muted-foreground pt-6">
                Authoritative copy:{' '}
                <a
                  href="https://dmtcode-p4szt.myshopify.com/policies/shipping-policy"
                  target="_blank"
                  rel="noopener"
                  className="underline hover:text-foreground"
                >
                  Meridian Optics Lab Shipping Policy
                </a>
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Shipping;
