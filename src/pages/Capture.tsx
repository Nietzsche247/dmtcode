import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { LayeredSubmissionForm } from '@/components/registry/LayeredSubmissionForm';

const Capture = () => {
  return (
    <>
      <Helmet>
        <title>Capture a Memory | DMT Code</title>
        <meta
          name="description"
          content="Record and seal a first person account of a visual form seen during a DMT session, before viewing the catalogue."
        />
        <link rel="canonical" href="https://dmtcode.com/capture" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />

        <main id="main-content" className="relative z-10 pt-20" role="main">
          <Breadcrumb />

          <section className="container mx-auto px-4 py-12 max-w-3xl text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Have you seen something you cannot explain?
            </h1>
            <p className="text-muted-foreground text-lg">
              Describe it before you look at anyone else's. Your account is sealed and timestamped the moment you submit, so if it later turns out to match another report, the record shows your memory came first.
            </p>
          </section>

          <LayeredSubmissionForm captureRoute="capture_page" />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Capture;
