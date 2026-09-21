import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { useLocale, localePath } from "@/i18n/LocaleProvider";

const SITE = "https://dmtcode.com";
const PATH = "/retreats/laser-protocol";

const TITLE = "Which retreats use a 650 nm laser protocol? (2026)";
const DESC =
  "As of 21 September 2026, no listed retreat is verified as running inhaled N,N-DMT with a 650 nm diffraction protocol. The checklist, with sources and last-verified dates.";
const ANSWER =
  "As of 21 September 2026, no listed retreat is verified as running inhaled N,N-DMT with a 650 nm diffraction protocol.";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Which retreats use a 650 nm laser protocol?",
    a: "As of 21 September 2026, none that this registry has verified. Every listed center reads No.",
  },
  {
    q: "Does the Code of Reality Retreat run the protocol?",
    a: "That is a dated third-party event, not a standing center. Its laser flag is Unverified and it is not a row in this table.",
  },
  {
    q: "How do I get a center added?",
    a: "A new row needs the same public-identity bar the existing list meets, plus a source URL if the laser cell is anything other than No.",
  },
];

interface Row {
  id: string;
  name: string;
  country: string | null;
  location: string;
  website_url: string | null;
  laser_protocol: string;
  laser_protocol_source: string | null;
  laser_protocol_last_verified: string | null;
}

const RetreatLaserProtocol = () => {
  const locale = useLocale();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("retreats")
        .select(
          "id,name,country,location,website_url,laser_protocol,laser_protocol_source,laser_protocol_last_verified",
        )
        .eq("is_approved", true);
      // A failed fetch stays null: the count line is omitted rather than
      // rendering a zero that could be read as a measured result.
      if (error || !data) return;
      setRows(data as Row[]);
    })();
  }, []);

  const sorted = useMemo(() => {
    if (!rows) return null;
    return [...rows].sort((a, b) => {
      const ca = (a.country || a.location || "").toLowerCase();
      const cb = (b.country || b.location || "").toLowerCase();
      if (ca !== cb) return ca < cb ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [rows]);

  const yesCount = rows ? rows.filter((r) => r.laser_protocol === "Yes").length : null;

  const jsonLd = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Retreat centers", item: `${SITE}/retreats` },
          { "@type": "ListItem", position: 3, name: TITLE, item: `${SITE}${PATH}` },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({
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
        <link rel="canonical" href={`${SITE}${localePath(locale, PATH)}`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESC} />
        <meta property="og:url" content={`${SITE}${localePath(locale, PATH)}`} />
        {jsonLd.map((ld, i) => (
          <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
        ))}
      </Helmet>

      <Navigation />

      <main id="main-content" className="container mx-auto px-4 max-w-5xl py-10" role="main">
        <Breadcrumb />

        <header className="mb-8 space-y-4 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{TITLE}</h1>
          <p className="text-base md:text-lg leading-relaxed">{ANSWER}</p>
          <p className="text-muted-foreground leading-relaxed">
            The table below is the checklist, not a ranking and not a booking engine.
          </p>
          {sorted && yesCount !== null ? (
            <p className="text-sm font-medium">
              {sorted.length} centers listed. {yesCount} verified Yes.
            </p>
          ) : null}
        </header>

        <div className="w-full overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">
              Listed retreat centers and whether each is verified as running a 650 nm laser
              diffraction protocol.
            </caption>
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th scope="col" className="px-4 py-3 font-semibold">Center</th>
                <th scope="col" className="px-4 py-3 font-semibold">Country</th>
                <th scope="col" className="px-4 py-3 font-semibold">Laser protocol</th>
                <th scope="col" className="px-4 py-3 font-semibold">Last verified</th>
                <th scope="col" className="px-4 py-3 font-semibold">Official source</th>
              </tr>
            </thead>
            <tbody>
              {(sorted ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.country || r.location}</td>
                  <td className="px-4 py-3">{r.laser_protocol}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.laser_protocol_last_verified || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.website_url ? (
                      <a
                        href={r.website_url}
                        target="_blank"
                        rel="nofollow noopener"
                        className="text-primary underline underline-offset-4 break-all"
                      >
                        Official site
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="mt-10 max-w-3xl space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">How a row becomes Yes</h2>
          <p className="text-muted-foreground leading-relaxed">
            Yes requires a source on this page: a public page, protocol PDF, or dated organizer
            statement that the retreat runs inhaled N,N-DMT with a specified 650 nm diffraction
            setup. Marketing language such as "laser experience", "code", or "matrix" is not
            enough. A past private experiment is not enough. A 5-MeO-DMT programme is not the
            protocol. Psilocybin is not the protocol. Default is No.
          </p>
        </section>

        <section className="mt-8 max-w-3xl space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">What this page is not</h2>
          <p className="text-muted-foreground leading-relaxed">
            It is not a "best DMT retreats" list. It does not rank safety, cuisine, or price. A
            listing is not an endorsement. These centers have not been inspected. Legal status is a
            country-level frame, not a license for any one operator. The Code of Reality Retreat
            2026 in Nosara is a dated third-party event, not a standing center, so it is not a row
            in this table.
          </p>
        </section>

        <section className="mt-8 max-w-3xl space-y-5">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Questions</h2>
          {FAQ.map((f) => (
            <div key={f.q} className="space-y-1">
              <h3 className="font-semibold">{f.q}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.a}</p>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RetreatLaserProtocol;
