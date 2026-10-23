import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SEO } from '@/components/SEO';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GolerAttribution } from '@/components/GolerAttribution';
import { useLocale, localePath } from '@/i18n/LocaleProvider';
import { supabase } from '@/integrations/supabase/client';
import { ZENODO_CONCEPT_DOI, ZENODO_CONCEPT_URL } from '@/lib/constants';
import run from '../../public/analysis/run01.json';

// Pre-registration v1.0 DOI. Mirrored in content-prerender.ts.
export const PREREG_DOI = '10.5281/zenodo.23601628';
export const PREREG_DOI_URL: string | null = `https://doi.org/${PREREG_DOI}`;

// Pre-registered minimums. Mirrored in content-prerender.ts.
const NEED_CLEAN = 30;
const NEED_SOBER = 30;
const NEED_REPLICATED = 20;

// Same predicates as renderAnalysis in content-prerender.ts.
async function liveCounts() {
  const base = () =>
    supabase
      .from('symbol_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .eq('visibility_status', 'public')
      .eq('is_curated_example', false);
  const [a, b, c] = await Promise.all([
    base(),
    base().eq('is_sober_baseline', true),
    base().eq('is_null_report', true),
  ]);
  return {
    symbols: a.error ? null : a.count,
    sober: b.error ? null : b.count,
    nulls: c.error ? null : c.count,
  };
}

const Analysis = () => {
  const locale = useLocale();
  const { data: live } = useQuery({ queryKey: ['analysis-live-counts'], queryFn: liveCounts, staleTime: 300_000 });

  const symbols = live?.symbols ?? run.n_submissions;
  const sober = live?.sober ?? run.sober_baseline;
  const nulls = live?.nulls ?? run.null_reports;
  const clean = run.contributors.naive;
  const replicated = run.tiers.replicated;
  const prereg = PREREG_DOI_URL ?? localePath(locale, '/documents');

  const tiles: [number, string][] = [
    [symbols, 'public symbols'],
    [run.contributors.identified, 'identified contributors'],
    [clean, 'clean contributors (never saw the registry before drawing)'],
    [sober, 'sober baselines'],
    [nulls, 'null reports'],
    [run.n_primitives, 'separately drawn marks'],
    [run.n_clusters['0.9'], 'distinct forms at 90 percent similarity'],
    [replicated, 'forms drawn by 3 or more clean contributors'],
  ];
  const meters: [string, number, number][] = [
    ['Clean contributors', clean, NEED_CLEAN],
    ['Sober baselines', sober, NEED_SOBER],
    ['Replicated forms', replicated, NEED_REPLICATED],
  ];
  const curve = run.curve.map((p) => ({ n: p.n, observed: p.observed, median: p.median, band: [p.lo, p.hi] }));

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'DMT Code registry analysis, run01',
    description: 'Aggregate counts and a saturation curve computed from the DMT Code registry. Counts only, no similarity results.',
    url: 'https://dmtcode.com/analysis',
    identifier: `https://doi.org/${ZENODO_CONCEPT_DOI}`,
    isBasedOn: [ZENODO_CONCEPT_URL, `https://doi.org/${PREREG_DOI}`],
    citation: [`https://doi.org/${PREREG_DOI}`],
    license: 'https://creativecommons.org/licenses/by/4.0/',
    dateModified: run.extraction_date,
    distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: 'https://dmtcode.com/analysis/run01.json' }],
  };

  return (
    <>
      <SEO uiKey="analysis" path="/analysis" canonicalToEnglish />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(ld)}</script>
      </Helmet>
      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        <main lang="en" className="relative z-10 container mx-auto px-4 py-10 max-w-3xl space-y-12" data-analysis-run={run.run_id}>
          <section>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Analysis</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              This page reports what the registry can and cannot say yet. The tests were fixed in advance in a{' '}
              {PREREG_DOI_URL ? (
                <a href={prereg} className="text-primary hover:underline">pre-registration v1.0</a>
              ) : (
                <Link to={prereg} className="text-primary hover:underline">pre-registration v1.0</Link>
              )}
              , before the numbers below were computed. A null result is reported with the same weight as a positive one.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Where the registry stands</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {tiles.map(([v, label]) => (
                <Card key={label} className="p-4 bg-card border-border">
                  <div className="text-3xl font-black text-primary" data-stat={label}>{v}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug">{label}</div>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">How far from an answer</h2>
            <div className="space-y-4">
              {meters.map(([label, have, need]) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{label}</span>
                    <span className="text-muted-foreground">{have} of {need} needed</span>
                  </div>
                  <Progress value={Math.min(100, (have / need) * 100)} aria-label={`${label}: ${have} of ${need} needed`} />
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Until these minimums are met the site publishes counts only, no similarity results.
            </p>
            <Button asChild className="mt-4 min-h-11">
              <Link to={localePath(locale, '/record')}>Add a record</Link>
            </Button>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Is there an alphabet?</h2>
            <div className="h-72 w-full" role="img" aria-label="Distinct forms against submissions in order of arrival, observed and random orderings">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={curve} margin={{ top: 8, right: 8, bottom: 16, left: -12 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" />
                  <XAxis dataKey="n" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    label={{ value: 'Submissions, in order of arrival', position: 'insideBottom', offset: -8, fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                  <Area dataKey="band" name="2.5 to 97.5 percent band" stroke="none" fill="hsl(var(--muted-foreground))" fillOpacity={0.2} isAnimationActive={false} />
                  <Line dataKey="median" name="Median of 1,000 random orderings" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                  <Line dataKey="observed" name="Observed" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Each new drawing still adds new forms. If the registry is converging on a finite set of forms, this line will bend toward flat as it grows. At 79 drawings it has not.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">The three registered tests</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4">Test</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border align-top">
                    <td className="py-2 pr-4 font-semibold whitespace-nowrap">H1 Convergence</td>
                    <td className="py-2 text-muted-foreground">Waiting for 30 clean contributors and 30 sober baselines</td>
                  </tr>
                  <tr className="border-b border-border align-top">
                    <td className="py-2 pr-4 font-semibold whitespace-nowrap">H2 Known-script null</td>
                    <td className="py-2 text-muted-foreground">Pilot run October 2026: mean best match 84 percent against 93 percent for a real glyph; no script dominates. Method contributed by Jan Grube</td>
                  </tr>
                  <tr className="align-top">
                    <td className="py-2 pr-4 font-semibold whitespace-nowrap">H3 Protocol variables</td>
                    <td className="py-2 text-muted-foreground">Fields added to the capture form October 2026; waiting for 20 replicated forms</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Method, in brief</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>The unit is the separately drawn mark.</li>
              <li>Each mark is scaled to 32 pixels and compared by overlap (Dice).</li>
              <li>Forms are grouped at 90 percent similarity.</li>
              <li>A form counts as replicated when 3 or more clean contributors drew it.</li>
              <li>A junction-cut sensitivity run gave 1,283 fragments and only elementary strokes replicated. It is reported for transparency.</li>
            </ul>
            <p className="text-sm mt-3">
              <Link to={localePath(locale, '/documents')} className="text-primary hover:underline">Full method and code</Link>
              {' · '}
              <a href="/analysis/run01.json" className="text-primary hover:underline">run01.json</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Open data</h2>
            <p className="text-sm text-muted-foreground mb-4">The full DMT Code corpus is published as a machine-readable export under a Creative Commons Attribution 4.0 license. Researchers are welcome to build their own analyses and visualizations on top of it.</p>
            <ul className="space-y-3 text-sm">
              <li><a href="/data.json" className="text-primary hover:underline font-semibold">/data.json</a><span className="block text-muted-foreground">The complete export in JSON. A single file suitable for scripting, notebooks, and downstream analysis.</span></li>
              <li><a href="/llms.txt" className="text-primary hover:underline font-semibold">/llms.txt</a><span className="block text-muted-foreground">A machine-readable index of the site aimed at language models and research agents.</span></li>
              <li><a href="/dataset" className="text-primary hover:underline font-semibold">/dataset</a><span className="block text-muted-foreground">Dataset landing page with citation guidance and licensing details.</span></li>
              <li><a href="/analysis/run01.json" className="text-primary hover:underline font-semibold">/analysis/run01.json</a><span className="block text-muted-foreground">The frozen figures for analysis run01 shown on this page, in JSON.</span></li>
            </ul>
            <h3 className="text-lg font-semibold mt-6 mb-2">What the export contains</h3>
            <p className="text-sm text-muted-foreground mb-2">The corpus is organized as categories rather than fixed counts, since records are added and revised over time.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Clinical trial records tracked from public registries.</li>
              <li>Bibliography sources with DOIs and links to primary literature.</li>
              <li>Symbol submissions contributed by community observers.</li>
              <li>Open theories with attribution and provenance.</li>
              <li>Events and retreats relevant to the research programme.</li>
            </ul>
            <h3 className="text-lg font-semibold mt-6 mb-2">Roadmap: Clustering and similarity views</h3>
            <p className="text-sm text-muted-foreground">Dimensionality reduction and similarity visualizations are not built yet. They are planned as a follow-on once the symbol corpus is large enough to support them. Until then, the export above is the source of truth, and researchers are encouraged to prototype their own views on it.</p>
            <h3 className="text-lg font-semibold mt-6 mb-2">License</h3>
            <p className="text-sm text-muted-foreground">
              The DMT Code corpus is released under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Creative Commons Attribution 4.0 International</a>. You may share and adapt the data for any purpose, including commercial use, provided you attribute the source.
            </p>
          </section>

          <section className="border-t border-border pt-6 space-y-3">
            <p className="text-xs text-muted-foreground">
              Shape comparison method: Jan Grube, October 2026. Analysis code: DMT Code. Dataset: concept DOI{' '}
              <a href={ZENODO_CONCEPT_URL} className="text-primary hover:underline">{ZENODO_CONCEPT_DOI}</a>.
              Pre-registration: DOI{' '}
              <a href={`https://doi.org/${PREREG_DOI}`} className="text-primary hover:underline">{PREREG_DOI}</a>.
            </p>
            <GolerAttribution />
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Analysis;
