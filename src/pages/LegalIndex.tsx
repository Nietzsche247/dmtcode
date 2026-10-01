import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useLocale, localePath } from "@/i18n/LocaleProvider";
import { INCB_BASELINE, LEGAL_COUNTRIES, LEGAL_SLUGS } from "@/data/legal";

// Text mirrors renderLegalIndex in netlify/edge-functions/content-prerender.ts.
const SITE = "https://dmtcode.com";
export const LEGAL_INDEX_TITLE = "Legal status by country";
export const LEGAL_STANDING_CAVEAT =
  "This is a country-level frame. It is not legal advice, it is not a licence for any operator, and it does not " +
  "make any listing on this site an endorsement. Laws change and enforcement changes faster. Check your own " +
  "jurisdiction, and check it again before you act on anything here.";
const DESC =
  "Where DMT and ayahuasca stand in six countries, with the statute behind each answer and the gaps named. " +
  "A country frame, not legal advice.";

const LegalIndex = () => {
  const locale = useLocale();
  // Untranslated under /es and /de: canonical points at English, as the prerender does.
  const canonical = `${SITE}/legal`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{LEGAL_INDEX_TITLE}</title>
        <meta name="description" content={DESC} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={LEGAL_INDEX_TITLE} />
        <meta property="og:description" content={DESC} />
      </Helmet>
      <Navigation />
      <main id="main-content" className="container mx-auto px-4 max-w-4xl py-10" role="main">
        <Breadcrumb titleOverride={LEGAL_INDEX_TITLE} />
        <article data-prerender="legal-index" className="space-y-8">
          <header className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">{LEGAL_INDEX_TITLE}</h1>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">{LEGAL_STANDING_CAVEAT}</p>
          </header>
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold">The international baseline</h2>
            <p className="leading-relaxed">{INCB_BASELINE.text}</p>
            <p className="leading-relaxed">{INCB_BASELINE.caution}</p>
            <p>
              <a href={INCB_BASELINE.source.url} rel="nofollow noopener" className="text-primary underline underline-offset-4 break-words">
                {INCB_BASELINE.source.label}
              </a>
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold">Countries</h2>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm md:text-base">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3 font-semibold">Country</th>
                    <th className="p-3 font-semibold">Where it stands</th>
                    <th className="p-3 font-semibold">Sources last read</th>
                  </tr>
                </thead>
                <tbody>
                  {LEGAL_SLUGS.map((slug) => {
                    const c = LEGAL_COUNTRIES[slug];
                    return (
                      <tr key={slug} className="border-t border-border align-top">
                        <td className="p-3">
                          <Link to={localePath(locale, `/legal/${c.slug}`)} className="text-primary underline underline-offset-4">
                            {c.name}
                          </Link>
                        </td>
                        <td className="p-3">{c.stanceLabel}</td>
                        <td className="p-3 whitespace-nowrap">{c.verified}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold">How to read these pages</h2>
            <p className="leading-relaxed">Each page states the statute that schedules the molecule, how the brew is treated as something separate from the molecule where it is, whether any religious or traditional exemption exists, what has actually happened in the last few years, and what that means in practice.</p>
            <p className="leading-relaxed">Where sources disagree, the page says so and names both. Where a document could not be obtained, the page says that too rather than filling the gap. A claim with no source behind it does not appear.</p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default LegalIndex;
