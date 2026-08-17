import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';

const PERSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Chase Hughes",
  "description":
    "Chase Hughes is listed as a co-author, with Danny Goler, on the pilot study documenting 650nm red laser-induced visual patterns under DMT.",
  "sameAs": [],
};

const BREADCRUMB_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://dmtcode.com/" },
    { "@type": "ListItem", position: 2, name: "People", item: "https://dmtcode.com/people" },
    {
      "@type": "ListItem",
      position: 3,
      name: "Chase Hughes",
      item: "https://dmtcode.com/people/chase-hughes",
    },
  ],
};

const link =
  'text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors';

const PersonChaseHughes = () => {
  return (
    <>
      <Helmet>
        <title>Chase Hughes, co-author on the pilot study | DMT Code</title>
        <meta
          name="description"
          content="Chase Hughes is listed as a co-author, with Danny Goler, on the pilot study documenting 650nm laser-induced visual patterns under DMT."
        />
        <link rel="canonical" href="https://dmtcode.com/people/chase-hughes" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{JSON.stringify(PERSON_LD)}</script>
        <script type="application/ld+json">{JSON.stringify(BREADCRUMB_LD)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />

        <main className="px-4 sm:px-6 py-12 sm:py-16">
          <article className="mx-auto w-full max-w-[68ch]">
            <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
              <a href="/people" className="hover:text-foreground transition-colors py-2 inline-block">
                People
              </a>
            </nav>

            <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              Chase Hughes
            </h1>

            <div className="mt-8 space-y-6 text-base sm:text-lg leading-relaxed text-foreground/90">
              <p>
                Chase Hughes is listed as a co-author, with Danny Goler, on the pilot study
                "DMT Laser Experiment Pilot Study: Visual Pattern Recognition and Consistency,"
                which documents 650nm red laser-induced visual patterns under DMT and reports
                notable consistency across an independent replicator community.
              </p>
              <p>
                This site has not published independent, controlled, blinded replication of that
                consistency claim. That is a fact about the state of the field, not a charge
                against anyone. The paper is one entry among the sources this site tracks; it does
                not receive special treatment because of who is credited on it.
              </p>

              <h2 className="font-heading text-xl sm:text-2xl font-semibold pt-6 text-foreground">
                Where his claim stands today
              </h2>
              <p>
                Independent controlled replication that isolates the 650 nm wavelength as a
                variable has not been published. Results that cut against the claim are filed in
                the <a className={link} href="/null-reports">null reports</a> in the same place,
                under the same license, as the ones that support it. The competing readings of the
                underlying observation are set out on the{' '}
                <a className={link} href="/critiques">critiques page</a>.
              </p>

              <h2 className="font-heading text-xl sm:text-2xl font-semibold pt-6 text-foreground">
                Follow the record
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  The <a className={link} href="/registry">visual symbol registry</a> where
                  reported forms accumulate
                </li>
                <li>
                  The <a className={link} href="/protocol-guide">650 nm laser protocol guide</a>
                </li>
                <li>
                  The <a className={link} href="/null-reports">null reports</a>
                </li>
              </ul>
            </div>
          </article>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PersonChaseHughes;
