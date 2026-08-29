import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';

const Returns = () => {
  return (
    <>
      <SEO uiKey="returns" path="/returns" />
      <Helmet>
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />

        <main id="main-content" className="relative z-10 pt-4" role="main">
          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Returns and Refunds</h1>
            <p className="text-lg text-muted-foreground mb-10">These policies belong to Meridian Optics Lab, the store of record for DMT Code kits.</p>

            <div className="space-y-6 text-base leading-relaxed">
              <p>Meridian Optics Lab accepts returns of unopened, unused optical research kits within 30 days of delivery.</p>

              <h2 className="text-2xl font-semibold mt-8">Eligibility</h2>
              <p>Items must be unopened, unused, and in original packaging with all components included. Opened laser modules are not eligible for return. These are precision optical instruments and personal safety items; once opened, we cannot verify their calibration or hygiene and cannot resell them. Kits with broken factory seals on the laser module compartment are treated as opened.</p>

              <h2 className="text-2xl font-semibold mt-8">How to start a return</h2>
              <p>Email info@dmtcode.com with your order number. We will confirm eligibility and provide the return address. Return shipping is paid by the buyer. We recommend a tracked service; lost return shipments are the sender's responsibility.</p>

              <h2 className="text-2xl font-semibold mt-8">Refunds</h2>
              <p>Once the returned kit is received and inspected, approved refunds are issued to the original payment method within 10 business days. Original shipping charges, where applicable, are not refunded.</p>

              <h2 className="text-2xl font-semibold mt-8">Damaged or defective items</h2>
              <p>If your kit arrives damaged or a component is defective, email info@dmtcode.com within 7 days of delivery with photos of the damage and packaging. We will replace the affected component or the full kit at no cost to you. Defective claims do not require returning the original item unless we request it.</p>

              <h2 className="text-2xl font-semibold mt-8">Exchanges</h2>
              <p>We do not offer direct exchanges. Return the eligible item for a refund and place a new order.</p>

              <p>This policy is governed by the laws of the State of Arizona, United States.</p>

              <p className="text-sm text-muted-foreground pt-6">
                Authoritative copy:{' '}
                <a
                  href="https://dmtcode-p4szt.myshopify.com/policies/refund-policy"
                  target="_blank"
                  rel="noopener"
                  className="underline hover:text-foreground"
                >
                  Meridian Optics Lab Refund Policy
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

export default Returns;
