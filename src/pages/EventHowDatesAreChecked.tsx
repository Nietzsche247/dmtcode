import { useMemo } from "react";
import { Helmet } from "react-helmet";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useLocale, localePath } from "@/i18n/LocaleProvider";

const SITE = "https://dmtcode.com";
const PATH = "/events/how-dates-are-checked";

const TITLE = "How these dates are checked";
const DESC =
  "The method behind every event date on this site: organiser sites only, a human last_verified date, and rows pulled when a source stops resolving. With the worked examples from the 21 September 2026 pass.";

export const METHOD_RULES: string[] = [
  "Every date is taken from the organiser's own site. Aggregators and ticket resellers are never the source of record.",
  "last_verified is the date a human opened that source, not the date the page was generated.",
  "A source that stops resolving means the row is marked TBA or pulled. Two rows were pulled on 2026-09-21 for exactly this reason.",
];

export const WORKED_EXAMPLES: string[] = [
  "A listed festival domain that no longer resolved at all.",
  "A festival domain that had been taken over by an unrelated content farm.",
  "Two events misattributed to the wrong organiser.",
  "Two festivals still listed as upcoming that had in fact been cancelled.",
];

const EventHowDatesAreChecked = () => {
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
            This is the method page for every event and retreat date published here.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">The rules</h2>
          <ul className="space-y-3">
            {METHOD_RULES.map((r) => (
              <li key={r} className="text-muted-foreground leading-relaxed">
                {r}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            What the 21 September 2026 pass found
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            These are the worked examples, listed because they are the proof the method is real:
          </p>
          <ul className="space-y-3">
            {WORKED_EXAMPLES.map((e) => (
              <li key={e} className="text-muted-foreground leading-relaxed">
                {e}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Corrections</h2>
          <p className="text-muted-foreground leading-relaxed">
            Corrections are welcome. If a date here disagrees with an organiser's own site,{" "}
            <a
              href={localePath(locale, "/join")}
              className="text-primary underline underline-offset-4"
            >
              tell us
            </a>{" "}
            and include the source URL.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default EventHowDatesAreChecked;
