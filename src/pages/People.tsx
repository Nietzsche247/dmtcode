import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { SEO } from '@/components/SEO';

const ITEM_LIST_LD = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "People",
  "itemListElement": [
    {
      "@type": "ListItem",
      position: 1,
      name: "Danny Goler",
      url: "https://dmtcode.com/people/danny-goler",
    },
  ],
};

const People = () => {
  return (
    <>
      <SEO uiKey="people" path="/people" />
      <Helmet>
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{JSON.stringify(ITEM_LIST_LD)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="px-4 sm:px-6 py-12 sm:py-16">
          <div className="mx-auto w-full max-w-[68ch]">
            <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              People
            </h1>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground">
              Entity profiles for the people whose work this record is built on.
            </p>
            <ul className="mt-10 space-y-4">
              <li>
                <a
                  href="/people/danny-goler"
                  className="block py-3 text-lg text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors"
                >
                  Danny Goler
                </a>
                <p className="text-sm text-muted-foreground">
                  Described the 650 nm laser observation in August 2020 and published the pilot
                  study in IPI Letters in 2025.
                </p>
              </li>
            </ul>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default People;
