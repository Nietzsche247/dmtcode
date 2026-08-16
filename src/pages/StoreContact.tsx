import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';

const StoreContact = () => {
  return (
    <>
      <Helmet>
        <title>Contact Information | Meridian Optics Lab via DMT Code</title>
        <meta name="description" content="Contact details and response times for Meridian Optics Lab, the store of record for DMT Code kits." />
        <link rel="canonical" href="https://dmtcode.com/store-contact" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Contact Information | Meridian Optics Lab via DMT Code" />
        <meta property="og:description" content="Contact details and response times for Meridian Optics Lab, the store of record for DMT Code kits." />
        <meta property="og:url" content="https://dmtcode.com/store-contact" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />

        <main id="main-content" className="relative z-10 pt-4" role="main">
          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Information</h1>
            <p className="text-lg text-muted-foreground mb-10">These policies belong to Meridian Optics Lab, the store of record for DMT Code kits.</p>

            <div className="space-y-6 text-base leading-relaxed">
              <p>Meridian Optics Lab</p>
              <p>Tucson, Arizona, United States</p>
              <p>
                Email:{' '}
                <a href="mailto:info@dmtcode.com" className="underline hover:text-foreground">
                  info@dmtcode.com
                </a>
              </p>
              <p>We respond to order and product inquiries within 2 business days. For return requests, include your order number in the subject line.</p>

              <p className="text-sm text-muted-foreground pt-6">
                Authoritative copy:{' '}
                <a
                  href="https://dmtcode-p4szt.myshopify.com/policies/contact-information"
                  target="_blank"
                  rel="noopener"
                  className="underline hover:text-foreground"
                >
                  Meridian Optics Lab Contact Information
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

export default StoreContact;
