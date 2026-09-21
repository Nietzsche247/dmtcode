import { useMemo } from "react";
import { Helmet } from "react-helmet";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useLocale, localePath } from "@/i18n/LocaleProvider";

const SITE = "https://dmtcode.com";
const PATH = "/events/ozora-vs-boom-2026";

const TITLE = "Ozora vs Boom in 2026";
const DESC =
  "They are not the same gathering and only one of them happened. Ozora ran 27 July to 4 August 2026 in Hungary. Boom had no 2026 edition; the next is 18 to 25 July 2027 in Portugal.";

const EventOzoraVsBoom2026 = () => {
  const locale = useLocale();
  const canonical = `${SITE}${localePath(locale, PATH)}`;

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Events", item: `${SITE}/events` },
        { "@type": "ListItem", position: 3, name: TITLE, item: `${SITE}${PATH}` },
      ],
    }),
    [],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESC} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESC} />
        <meta property="og:url" content={canonical} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Navigation />

      <main id="main-content" className="container mx-auto px-4 max-w-3xl py-10" role="main">
        <Breadcrumb />

        <header className="mb-8 space-y-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{TITLE}</h1>
          <p className="text-base md:text-lg leading-relaxed">
            They are not the same gathering, and only one of them happened.
          </p>
        </header>

        <section className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Ozora 2026 ran 27 July to 4 August at Dadpuszta, Hungary. Boom had no 2026 edition; the
            next one is 18 to 25 July 2027 at Boomland, Idanha-a-Nova, Portugal.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Two organisers, two countries, two sites. A page selling "Boom 2026" tickets is wrong.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Neither gathering is verified as running a 650 nm protocol.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Sources</h2>
          <ul className="space-y-2">
            <li>
              <a
                href="https://ozorafestival.eu/"
                target="_blank"
                rel="nofollow noopener"
                className="text-primary underline underline-offset-4 break-all"
              >
                ozorafestival.eu
              </a>
            </li>
            <li>
              <a
                href="https://www.boomfestival.org/"
                target="_blank"
                rel="nofollow noopener"
                className="text-primary underline underline-offset-4 break-all"
              >
                boomfestival.org
              </a>
            </li>
            <li>
              <a
                href={localePath(locale, "/retreats/laser-protocol")}
                className="text-primary underline underline-offset-4"
              >
                Which retreats use a 650 nm laser protocol?
              </a>
            </li>
            <li>
              <a
                href={localePath(locale, "/events/boom-festival-2026")}
                className="text-primary underline underline-offset-4"
              >
                There is no Boom Festival in 2026
              </a>
            </li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default EventOzoraVsBoom2026;
