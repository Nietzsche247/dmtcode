import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';

const PERSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Chase Hughes",
  "description":
    "Chase Hughes has publicly described the 650 nm laser protocol as validated. This site has not been able to confirm a published, readable source for that claim.",
  "sameAs": ["https://dmtcode.com/bibliography/f0f66690-8508-493f-ba93-bdc2bf810261"],
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
        <title>Chase Hughes, popularizer of an unverified validation claim | DMT Code</title>
        <meta
          name="description"
          content="Chase Hughes has publicly described the 650 nm laser protocol as validated. This site has not been able to confirm a published, readable source for that claim."
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
                Chase Hughes is a podcaster and author who has publicly described the 650 nm
                laser protocol as validated, most visibly in interviews in 2025. This site has
                not been able to confirm a published, readable source for any validation he
                refers to, so the claim is listed as unverified in the bibliography (see the
                entry Chase Hughes Validation References). He is not an author of the pilot
                study, which is a single-author paper by Danny Goler (IPI Letters, 2025).
              </p>
              <p>
                That is a statement about the state of the record, not a charge against anyone.
                Where his account is discussed on this site, it carries the same caveat:
                recognition after seeing imagery is not replication, and no controlled, blinded
                replication has been published.
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
