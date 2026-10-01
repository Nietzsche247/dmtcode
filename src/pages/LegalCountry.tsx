import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useLocale, localePath } from "@/i18n/LocaleProvider";
import { INCB_BASELINE, LEGAL_COUNTRIES } from "@/data/legal";
import NotFound from "./NotFound";
import { LEGAL_STANDING_CAVEAT } from "./LegalIndex";

// Text mirrors renderLegalCountry in netlify/edge-functions/content-prerender.ts.
const SITE = "https://dmtcode.com";
const h2 = "text-xl md:text-2xl font-bold";
const link = "text-primary underline underline-offset-4 break-words";

const Paras = ({ ps }: { ps: string[] }) => (
  <>{ps.map((p, i) => <p key={i} className="leading-relaxed">{p}</p>)}</>
);

const LegalCountry = () => {
  const { slug = "" } = useParams();
  const locale = useLocale();
  const c = Object.prototype.hasOwnProperty.call(LEGAL_COUNTRIES, slug) ? LEGAL_COUNTRIES[slug] : undefined;
  if (!c) return <NotFound />;

  const title = `DMT and ayahuasca in ${c.name}: what the law actually says`;
  const canonical = `${SITE}/legal/${c.slug}`;
  const sources = [...c.sources, INCB_BASELINE.source];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={c.summary} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={c.summary} />
      </Helmet>
      <Navigation />
      <main id="main-content" className="container mx-auto px-4 max-w-4xl py-10" role="main">
        <Breadcrumb titleOverride={c.name} />
        <article data-prerender="legal-country" data-country={c.slug} className="space-y-8">
          <header className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">{title}</h1>
            <p className="text-base md:text-lg leading-relaxed"><strong>{c.verdict}</strong></p>
            <p className="leading-relaxed text-muted-foreground">{LEGAL_STANDING_CAVEAT}</p>
          </header>
          <section className="space-y-3"><h2 className={h2}>Is the molecule scheduled</h2><Paras ps={c.molecule} /></section>
          <section className="space-y-3"><h2 className={h2}>The brew and the molecule</h2><Paras ps={c.brew} /></section>
          <section className="space-y-3"><h2 className={h2}>Religious and traditional use</h2><Paras ps={c.exemption} /></section>
          <section className="space-y-3">
            <h2 className={h2}>What has actually happened</h2>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm md:text-base">
                <thead className="bg-muted/50 text-left">
                  <tr><th className="p-3 font-semibold">Date</th><th className="p-3 font-semibold">What</th></tr>
                </thead>
                <tbody>
                  {c.recent.map((e, i) => (
                    <tr key={i} className="border-t border-border align-top">
                      <td className="p-3 whitespace-nowrap">{e.date}</td>
                      <td className="p-3">
                        {e.what}{" "}
                        <a href={e.source.url} rel="nofollow noopener" className={link}>{e.source.label}</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="space-y-3"><h2 className={h2}>What this means in practice</h2><Paras ps={c.reality} /></section>
          <section className="space-y-3">
            <h2 className={h2}>The claim to be careful about</h2>
            <p className="leading-relaxed"><em>{c.wrongClaim.claim}</em></p>
            <p className="leading-relaxed">{c.wrongClaim.correction}</p>
          </section>
          {c.gaps.length > 0 && (
            <section className="space-y-3">
              <h2 className={h2}>What this page does not know</h2>
              <p className="leading-relaxed">These are the gaps in the sourcing, stated rather than smoothed over.</p>
              <ul className="list-disc pl-5 space-y-2">{c.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </section>
          )}
          <section className="space-y-3">
            <h2 className={h2}>The international baseline</h2>
            <p className="leading-relaxed">{INCB_BASELINE.text}</p>
            <p className="leading-relaxed">{INCB_BASELINE.caution}</p>
          </section>
          <section className="space-y-3">
            <h2 className={h2}>Sources</h2>
            <p className="leading-relaxed">Every source below was fetched and read on {c.verified}. That date is when a human last read them. It is not a computed timestamp and it does not refresh on its own.</p>
            <ul className="list-disc pl-5 space-y-2">
              {sources.map((s, i) => (
                <li key={i}><a href={s.url} rel="nofollow noopener" className={link}>{s.label}</a></li>
              ))}
            </ul>
          </section>
          <p><Link to={localePath(locale, "/legal")} className={link}>All country frames</Link></p>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default LegalCountry;
