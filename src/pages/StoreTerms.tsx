import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';

const StoreTerms = () => {
  return (
    <>
      <SEO uiKey="store-terms" path="/store-terms" />
      <Helmet>
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />

        <main id="main-content" className="relative z-10 pt-4" role="main">
          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
            <p className="text-lg text-muted-foreground mb-10">These policies belong to Meridian Optics Lab, the store of record for DMT Code kits.</p>

            <div className="space-y-6 text-base leading-relaxed">
              <p>These terms govern purchases from Meridian Optics Lab, an online retailer of educational optical research equipment based in Tucson, Arizona, United States. By placing an order you agree to these terms.</p>

              <h2 className="text-2xl font-semibold mt-8">Products</h2>
              <p>We sell 650 nm laser diffraction and refraction observation kits and related optical components intended for educational and observational research use by adults. Products are laboratory and classroom style equipment. They are not toys, not medical devices, and are not intended to diagnose, treat, cure, or prevent any condition.</p>

              <h2 className="text-2xl font-semibold mt-8">Age requirement</h2>
              <p>You must be at least 18 years old to purchase. Laser devices should be used by, or under the direct supervision of, an adult.</p>

              <h2 className="text-2xl font-semibold mt-8">Laser safety</h2>
              <p>Kits contain low power visible laser modules that comply with applicable United States FDA CDRH requirements for consumer laser products. Never point a laser at eyes, faces, people, animals, vehicles, or aircraft. Never view the beam directly or through magnifying optics. Read all included safety documentation before use. You are responsible for using the equipment safely and in compliance with the laws of your jurisdiction.</p>

              <h2 className="text-2xl font-semibold mt-8">Orders and pricing</h2>
              <p>All prices are in US dollars. We reserve the right to refuse or cancel any order, including where a product listing contains a pricing or descriptive error. If we cancel a paid order you receive a full refund.</p>

              <h2 className="text-2xl font-semibold mt-8">Shipping</h2>
              <p>Shipping terms, timelines, and destinations are described in our Shipping Policy at checkout.</p>

              <h2 className="text-2xl font-semibold mt-8">Intellectual property</h2>
              <p>Product photography and kit materials are the property of Meridian Optics Lab or its licensors and may not be reproduced for commercial purposes without written permission. The protocol documents are published free under CC-BY-4.0 at dmtcode.com/prepare.</p>

              <h2 className="text-2xl font-semibold mt-8">Limitation of liability</h2>
              <p>To the maximum extent permitted by law, Meridian Optics Lab is not liable for indirect, incidental, or consequential damages arising from the use or misuse of purchased equipment. Our total liability for any claim is limited to the amount you paid for the product giving rise to the claim. Nothing in these terms limits liability that cannot be limited under applicable law.</p>

              <h2 className="text-2xl font-semibold mt-8">Governing law</h2>
              <p>These terms are governed by the laws of the State of Arizona, United States, without regard to conflict of law principles. Any dispute will be resolved in the state or federal courts located in Pima County, Arizona.</p>

              <h2 className="text-2xl font-semibold mt-8">Contact</h2>
              <p>Questions about these terms: info@dmtcode.com</p>

              <p className="text-sm text-muted-foreground pt-6">
                Authoritative copy:{' '}
                <a
                  href="https://dmtcode-p4szt.myshopify.com/policies/terms-of-service"
                  target="_blank"
                  rel="noopener"
                  className="underline hover:text-foreground"
                >
                  Meridian Optics Lab Terms of Service
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

export default StoreTerms;
