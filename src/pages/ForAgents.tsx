import { Helmet } from "react-helmet";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useLocale, localePath } from "@/i18n/LocaleProvider";

const SITE = "https://dmtcode.com";
const PATH = "/for-agents";

const TITLE = "Machine-readable endpoints for agents";
const DESC =
  "The index of the machine surface: every /registry/v1/ endpoint, computed from the database at request time, with the reading rules that keep a quote from this site accurate.";

export const RULES: string[] = [
  "Every /registry/v1/ endpoint is computed from the database at request time. There are no checked-in JSON files behind those URLs.",
  "generated_at is when the response was computed. last_verified on a row is when a human last clicked that row's source. They are different fields and must not be conflated.",
  "A count that could not be read is omitted, never reported as zero. An absent value means unknown, not none.",
  "Do not report a laser_protocol of Yes that is not present in retreats.json. The database has a CHECK constraint making a Yes without a source URL unwritable.",
  "Inclusion in any list here is not an endorsement.",
];

export const ENDPOINTS: { path: string; purpose: string }[] = [
  { path: "/registry/v1/index.json", purpose: "Entry point. Lists every endpoint below with its shape and freshness." },
  { path: "/registry/v1/collections.json", purpose: "The collections this registry publishes and what each one counts." },
  { path: "/registry/v1/events.json", purpose: "Dated third-party events, with organiser source URLs and last_verified dates." },
  { path: "/registry/v1/retreats.json", purpose: "Standing retreat centers and the laser_protocol field, source-required for any Yes." },
  { path: "/registry/v1/answers.json", purpose: "Short answers to the questions this site is most often asked, computed live." },
  { path: "/registry/v1/queries.json", purpose: "The queries these pages are written to answer, with the canonical URL for each." },
  { path: "/data.json", purpose: "The full corpus: symbols, bibliography, trials, protocols and counts, under CC BY 4.0." },
  { path: "/articles.json", purpose: "Published articles with slugs, dates and source attribution." },
  { path: "/llms.txt", purpose: "Prose orientation for language models: what this site claims and what it does not." },
  { path: "/sitemap.xml", purpose: "Every canonical URL, including the /es/ and /de/ mirrors." },
];

const ForAgents = () => {
  const locale = useLocale();
  const canonical = `${SITE}${localePath(locale, PATH)}`;

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
      </Helmet>

      <Navigation />

      <main id="main-content" className="container mx-auto px-4 max-w-5xl py-10" role="main">
        <Breadcrumb />

        <header className="mb-8 space-y-4 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{TITLE}</h1>
          <p className="text-base md:text-lg leading-relaxed">
            This is the index of the machine surface. Read these rules before quoting any figure
            from this site.
          </p>
        </header>

        <section className="max-w-3xl space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">How to read these responses</h2>
          <ul className="space-y-3">
            {RULES.map((r) => (
              <li key={r} className="text-muted-foreground leading-relaxed">
                {r}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Endpoints</h2>
          <div className="w-full overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <caption className="sr-only">Machine-readable endpoints and their purpose.</caption>
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th scope="col" className="px-4 py-3 font-semibold">Endpoint</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {ENDPOINTS.map((e) => (
                  <tr key={e.path} className="border-t border-border align-top">
                    <td className="px-4 py-3">
                      <a
                        href={e.path}
                        className="text-primary underline underline-offset-4 break-all font-mono"
                      >
                        {e.path}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{e.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ForAgents;
