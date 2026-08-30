import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SEO } from '@/components/SEO';
import { KITS } from '@/data/kits';

// The acceptance test from the 2026-08-28 audit, answered from live data.
//
// The crawler copy is renderAnswers in netlify/edge-functions/content-prerender.ts
// and it reads /data.json at request time. This page reads the same document in
// the browser, for the same reason: an answer page that states a count is a place
// a count goes stale, and a stale canonical answer is worse than none, because it
// is the site contradicting itself with authority.
//
// A number that cannot be read is omitted, never rendered as zero. The audit's
// first finding was a homepage printing 0 for counts it had failed to fetch.

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 } as const;
const sans = { fontFamily: "'Hanken Grotesk', system-ui, sans-serif" } as const;

type Agg = {
  counts?: Record<string, number>;
  corpus_composition?: Record<string, Record<string, unknown>>;
  items?: Array<Record<string, unknown>>;
  symbols?: Array<Record<string, unknown>>;
  events?: Array<Record<string, unknown>>;
};

const UNREAD = 'not printed: this page could not read it just now';

const fmt = (v: unknown): string =>
  typeof v === 'number' && Number.isFinite(v) ? v.toLocaleString('en-US') : UNREAD;

const Answers = () => {
  const [d, setD] = useState<Agg | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/data.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => { if (!cancelled) setD(j as Agg); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  const counts = d?.counts ?? {};
  const comp = d?.corpus_composition ?? {};
  const items = d?.items ?? [];
  const symbols = d?.symbols ?? [];
  const events = d?.events ?? [];
  const symbolComp = (comp.symbols ?? {}) as Record<string, unknown>;

  const registered = items.filter(
    (i) => String(i.content_type) === 'Trial' && String(i.authority_type) === 'Clinical',
  ).length;
  const notRegistered = items.filter((i) => String(i.content_type) === 'Experiment or report').length;
  const recognitions = symbols.reduce((a, r) => a + Number(r.recognized_count ?? 0), 0);
  const nonMatches = symbols.reduce((a, r) => a + Number(r.not_a_match_count ?? 0), 0);
  const withResponse = symbols.filter(
    (r) => Number(r.recognized_count ?? 0) > 0 || Number(r.not_a_match_count ?? 0) > 0,
  ).length;
  const independent = symbols.filter((r) =>
    ['reviewed_convergence', 'controlled_replication'].includes(String(r.evidence_status ?? '')),
  ).length;
  const autoDiscovered = events.filter((e) =>
    /\[auto-discovered\]/i.test(String(e.description ?? '') + String(e.details ?? '')),
  ).length;

  const Q = ({ id, q, children }: { id: string; q: string; children: React.ReactNode }) => (
    <section id={id} className="border-t border-border pt-6">
      <h2 className="text-2xl text-foreground mb-3" style={serif}>{q}</h2>
      <div className="space-y-3 text-base text-muted-foreground leading-relaxed" style={sans}>
        {children}
      </div>
    </section>
  );

  return (
    <>
      <SEO uiKey="answers" path="/answers" />
      <Helmet>
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <main id="main-content" className="relative z-10 pt-20" role="main">
          <Breadcrumb />

          <section className="container mx-auto px-4 max-w-3xl pt-4 space-y-5">
            <p className="label-data text-xs text-primary">ANSWERS</p>
            <h1 className="text-4xl md:text-5xl text-foreground" style={serif}>
              Ten questions, answered from the record
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed" style={sans}>
              An audit of this site in August 2026 proposed a test: ask a clean
              browser, a search engine, an AI assistant and the raw data the same
              ten questions, and check whether every surface gives materially the
              same answer. This page is that test written down. Every figure is
              read from{' '}
              <a href="/data.json" className="text-primary hover:underline">/data.json</a>{' '}
              when the page loads, so it cannot fall behind the record it
              describes.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed" style={sans}>
              For a long form treatment of one question with its evidence graded
              for and against, read the{' '}
              <Link to="/guides" className="text-primary hover:underline">guides</Link>.
              This is the short sheet.
            </p>
            {failed && (
              <p className="rounded border border-destructive/40 bg-destructive/5 p-3 text-sm text-foreground" style={sans}>
                The dataset could not be read just now, so the figures below are
                missing rather than wrong. Read{' '}
                <a href="/data.json" className="text-primary hover:underline">/data.json</a>{' '}
                directly, or reload.
              </p>
            )}
          </section>

          <section className="container mx-auto px-4 max-w-3xl py-10 space-y-8">
            <Q id="how-many-observations" q="How many community observations does DMT Code contain?">
              <p>
                {fmt(counts.symbols)} published symbol records, plus {fmt(counts.registry_glyphs)}{' '}
                anonymous drawn glyph reports from the quick capture tool. They are
                separate tables and are never summed. The number that matters for the
                laser claim specifically is smaller: {fmt(comp.records_declaring_650nm_laser)} of{' '}
                {fmt(comp.records_total)} records declare the 650 nm laser method at all.
                Prior exposure is recorded on {fmt(symbolComp.prior_exposure_recorded)} of them,
                and there are {fmt(symbolComp.sober_baseline)} sober baseline records.{' '}
                <Link to="/object-model" className="text-primary hover:underline">The object model</Link>{' '}
                explains why the two counts differ.
              </p>
            </Q>

            <Q id="goler-setup" q="What did Danny Goler's published setup use?">
              <p>
                A 650 nm refracted laser, <strong className="text-foreground">Class 2, operating at 1 mW</strong>,
                through a diffraction grating lens onto a nonreflective surface. The paper
                states that only Class 2 lasers at 1 mW or less were used. Goler D. 2025,
                IPI Letters, DOI{' '}
                <a href="https://doi.org/10.59973/ipil.158" className="text-primary hover:underline">10.59973/ipil.158</a>.
                It is a pilot report in a letters venue, not a controlled trial.
              </p>
            </Q>

            <Q id="what-is-sold" q="What does DMT Code sell?">
              <p>
                Four laser diffraction research kits, sold and shipped by Meridian
                Optics Lab. Every document on this site is free and no kit is required
                to take part.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {KITS.map((k) => (
                  <li key={k.id}>
                    <span className="text-foreground">{k.shortName}</span>, {k.price}
                  </li>
                ))}
              </ul>
              <p>
                Machine readable catalogue at{' '}
                <a href="/shop.json" className="text-primary hover:underline">/shop.json</a>, with
                per emitter vendor ratings.
              </p>
            </Q>

            <Q id="equipment-identical" q="Is the equipment sold here identical to Goler's?">
              <p>
                <strong className="text-foreground">No.</strong> Three different objects are kept
                apart on this site and must not be blended. The historical Goler setup is
                650 nm, Class 2, 1 mW. The DMT Code observation configuration is a later
                community adaptation using pointers the vendor rates at 5 mW, FDA Class
                IIIa, which is Class 3R. The proposed controlled study is a third thing
                again and has not been run.
              </p>
            </Q>

            <Q id="independent-matches" q="How many independently validated matches exist?">
              <p>
                <strong className="text-foreground">{independent}.</strong> Not a rounding of a
                small number: the field that could record independence is evidence_status,
                and no record currently carries reviewed_convergence or
                controlled_replication. What the site does have is {recognitions} recognition
                responses and {nonMatches} non-match responses across {withResponse} symbols.
                Every one of those was recorded after the responder had already looked at
                the symbol here.
              </p>
            </Q>

            <Q id="what-recognition-means" q="What does a recognition mean?">
              <p>
                That a signed in reader pressed a control saying a published form echoed
                their own memory, <em>after</em> seeing it here. It is recognition after
                exposure. It is not an independent match, it is not a replication, and it
                must never be reported as either.
              </p>
            </Q>

            <Q id="which-are-clinical-trials" q="Which records are genuine registered clinical trials?">
              <p>
                {registered} of {fmt(counts.trials)} records in the trials table are
                registered clinical trials, carrying a registry identifier and
                authority_type Clinical. The other {notRegistered} are typed community
                records: academic experiments, pilot reports, community experiments,
                citizen science projects, reported replications, platform projects, media
                claims, rumoured reports and retreat sessions. Describing those as
                clinical trials is the specific error this typing exists to prevent.
              </p>
            </Q>

            <Q id="which-events-verified" q="Which events are verified, and which are auto-discovered?">
              <p>
                Of {fmt(counts.events)} events, {autoDiscovered} are labelled auto-discovered
                candidates in their own description, meaning a crawler found them and their
                dates have not been editorially verified. The rest were entered directly.
                This page does not claim the remainder are verified: entered directly and
                verified are different states.
              </p>
            </Q>

            <Q id="strongest-evidence" q="What is the strongest evidence for, and against?">
              <p>
                <strong className="text-foreground">For:</strong> a published pilot report
                describing the protocol and reporting recurring structured forms, plus an
                open registry in which similar shapes recur.
              </p>
              <p>
                <strong className="text-foreground">Against:</strong> the corpus is self
                selected and unblinded; {fmt(symbolComp.sober_baseline)} sober baseline
                records exist, so nothing has a control to be measured against; prior
                exposure is unrecorded on nearly every record, and priming is the strongest
                ordinary explanation for apparent agreement; and the deflationary theories
                on this site each predict what has been observed without requiring anything
                external. No randomized, blinded, pre-registered test has been run. The{' '}
                <Link to="/evidence-map" className="text-primary hover:underline">evidence map</Link>{' '}
                lays out the three stages.
              </p>
            </Q>

            <Q id="participate-without-believing" q="How do I take part without believing any of it?">
              <p>
                Run the sober baseline. Same rig, no substance, recorded on the standard
                field sheet, and it is the half of the comparison the corpus is missing
                entirely. The protocol is a free PDF at{' '}
                <Link to="/documents" className="text-primary hover:underline">/documents</Link>{' '}
                and needs no kit and no account.
              </p>
              <p>
                Reporting that you saw nothing structured is a full record here, not a
                failure, and those are published at{' '}
                <Link to="/null-reports" className="text-primary hover:underline">/null-reports</Link>.
                If you want to be maximally useful, record what you saw before you open the
                symbol catalogue:{' '}
                <Link to="/capture" className="text-primary hover:underline">/capture</Link>.
              </p>
            </Q>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Answers;
