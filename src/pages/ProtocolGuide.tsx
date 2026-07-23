import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Link } from 'react-router-dom';

const TITLE = '650 nm Laser Protocol Guide | DMT Code';
const DESCRIPTION =
  'Neutral overview of the 650 nm laser observation protocol: equipment, safety, and how independent observations are recorded so they can be compared.';

const ProtocolGuide = () => {
  return (
    <>
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href="https://dmtcode.com/protocol-guide" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content="https://dmtcode.com/protocol-guide" />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />

        <main id="main-content" className="relative z-10 pt-4" role="main">
          <article className="container mx-auto px-4 py-16 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">650 nm Laser Protocol Guide</h1>

            <p className="text-lg text-muted-foreground mb-10">
              This page describes, at a high level and neutrally, the equipment-and-observation
              protocol that participants use to record what they see, so that independent
              observations can be compared. We are not claiming the forms are a message. We are
              measuring whether independent people report the same shapes. This page does not tell
              anyone what to expect.
            </p>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">Equipment</h2>
              <p className="mb-4">
                The apparatus, described in general terms, consists of:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li>A verified 650 nm red laser at the correct optical density.</li>
                <li>Appropriate laser-safety eyewear rated for the wavelength and power in use.</li>
                <li>A diffraction or refraction element used to structure the beam.</li>
                <li>An observation journal for recording what was seen.</li>
                <li>A screening card for the pre-observation self-check.</li>
              </ul>
              <p className="mt-4">
                Kit options are listed on the <Link to="/prepare" className="text-gold hover:underline">prepare</Link> page.
                We do not link to third-party products from this guide.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">Safety first</h2>
              <p className="mb-4">
                A laser is not a toy. Use the correct optical density and eyewear exactly as
                described in the equipment documentation, and keep the apparatus away from children.
                This protocol is intended for adults 18 and older.
              </p>
              <p className="mb-4">
                Before considering anything further, speak with a qualified prescriber about your
                medications (including MAOIs, SSRIs, and related compounds), any cardiac history,
                and any personal or family history of psychosis.
              </p>
              <p>
                We deliberately do not publish medication timing windows. We do not sell, source, or
                explain how to obtain any controlled substance.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">How the observation is recorded</h2>
              <p className="mb-4">
                Participants record what they saw before viewing the existing catalogue. A match
                only counts as convergence when two strangers, working independently and without
                seeing each other's drawings first, land on the same form.
              </p>
              <p>
                Observations are submitted to the <Link to="/registry" className="text-gold hover:underline">registry</Link>{' '}
                where other participants can confirm or dispute each entry. Convergence only counts
                when it is earned that way.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">Take part</h2>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li>Browse the <Link to="/registry" className="text-gold hover:underline">registry</Link> of submitted observations.</li>
                <li>Read the <Link to="/methods" className="text-gold hover:underline">method</Link> and the underlying <Link to="/dataset" className="text-gold hover:underline">data</Link>.</li>
                <li>See kit options on <Link to="/prepare" className="text-gold hover:underline">prepare</Link>.</li>
              </ul>
              <p className="mt-4 text-muted-foreground">
                Participation does not require buying a kit or taking any substance. Reading the
                registry and evaluating the data is participation.
              </p>
            </section>

            <div className="mt-12 p-6 bg-muted/30 border border-border rounded-lg text-sm text-muted-foreground">
              <p className="mb-2 font-semibold text-foreground">Disclaimer</p>
              <p>
                Adults 18 and older only. This page is not medical, legal, or clinical advice, and
                nothing on it should be read as an instruction to take any substance. Consult a
                qualified professional before making decisions about your health.
              </p>
              <p className="mt-3">Last updated: 2026-07-23</p>
            </div>
          </article>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ProtocolGuide;
