import { useMemo } from "react";
import { Helmet } from "react-helmet";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useLocale, localePath } from "@/i18n/LocaleProvider";

const SITE = "https://dmtcode.com";
const PATH = "/events/boom-festival-2026";

const TITLE = "There is no Boom Festival in 2026";
const DESC =
  "Boom is biennial. The previous edition was 2025 and the next is 18 to 25 July 2027 at Boomland, Idanha-a-Nova, Portugal. Verified against boomfestival.org on 21 September 2026.";

export const BOOM_FAQ: { q: string; a: string }[] = [
  { q: "Is there a Boom Festival in 2026?", a: "No. Boom is biennial and 2026 is an off year." },
  {
    q: "When is the next Boom Festival?",
    a: "18 to 25 July 2027, Boomland, Idanha-a-Nova, Portugal. Confirm on boomfestival.org.",
  },
  {
    q: "Did anything happen at Boomland in 2026?",
    a: "Yes. Being Gathering, 1 to 5 July 2026, run by the same organisation on the same land. It was not a Boom Festival edition.",
  },
];

const EventBoom2026 = () => {
  const locale = useLocale();
  const canonical = `${SITE}${localePath(locale, PATH)}`;

  const jsonLd = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Events", item: `${SITE}/events` },
          { "@type": "ListItem", position: 3, name: TITLE, item: `${SITE}${PATH}` },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: BOOM_FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
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
        {jsonLd.map((ld, i) => (
          <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
        ))}
      </Helmet>

      <Navigation />

      <main id="main-content" className="container mx-auto px-4 max-w-3xl py-10" role="main">
        <Breadcrumb />

        <header className="mb-8 space-y-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{TITLE}</h1>
          <p className="text-base md:text-lg leading-relaxed">
            Boom is biennial. The previous edition was 2025, and the next is 18 to 25 July 2027 at
            Boomland, Idanha-a-Nova, Portugal. The official source is{" "}
            <a
              href="https://www.boomfestival.org/"
              target="_blank"
              rel="nofollow noopener"
              className="text-primary underline underline-offset-4"
            >
              boomfestival.org
            </a>
            .
          </p>
        </header>

        <section className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Boomland itself was not dark in 2026. The same organisation ran Being Gathering there
            from 1 to 5 July 2026, which was not a Boom Festival edition.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The European gathering that filled that summer slot was Ozora, 27 July to 4 August 2026
            at Dadpuszta, Hungary. That is a different organiser and a different site.
          </p>
          <p className="text-base md:text-lg font-semibold leading-relaxed">
            Buy nothing that claims to be Boom 2026.
          </p>
        </section>

        <section className="mt-10 space-y-5">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Questions</h2>
          {BOOM_FAQ.map((f) => (
            <div key={f.q} className="space-y-1">
              <h3 className="font-semibold">{f.q}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.a}</p>
            </div>
          ))}
        </section>

        <p className="mt-10 text-sm text-muted-foreground">
          <a
            href={localePath(locale, "/events/how-dates-are-checked")}
            className="text-primary underline underline-offset-4"
          >
            How these dates are checked
          </a>
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default EventBoom2026;
