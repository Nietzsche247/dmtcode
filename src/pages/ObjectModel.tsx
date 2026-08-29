import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SEO } from '@/components/SEO';

// The published object model. The same seven levels are carried for crawlers by
// the object-model entry in netlify/edge-functions/content-prerender.ts and, in
// short form, by object_model_note in netlify/edge-functions/data-json.ts. Edge
// functions run in Deno and cannot import from src/, so all three are mirrored
// by hand. Change one and change the others in the same commit.

const LEVELS: Array<{ n: string; name: string; body: string }> = [
  {
    n: '01',
    name: 'Observation',
    body: "One person's experience on one occasion. It is the event, not the file. An observation with nothing recorded from it leaves no trace in the corpus.",
  },
  {
    n: '02',
    name: 'Artifact',
    body: 'Something produced from an observation: a drawing, a voice note, a written description, a field map. One observation can produce several artifacts, and an artifact can hold several forms at once.',
  },
  {
    n: '03',
    name: 'Glyph instance',
    body: 'One discrete form extracted from an observation. A single drawing showing three separate forms holds three glyph instances. This is the unit that gets compared.',
  },
  {
    n: '04',
    name: 'Public symbol record',
    body: 'A glyph instance exposed in the browseable registry, with its metadata, its tags and its recognition counts. Every public symbol record is a glyph instance; not every glyph instance is published.',
  },
  {
    n: '05',
    name: 'Motif cluster',
    body: 'Several glyph instances that may be related. A cluster is a hypothesis about similarity, not a finding, and grouping is only meaningful when the members were recorded independently.',
  },
  {
    n: '06',
    name: 'Canonical symbol candidate',
    body: 'A reviewed abstraction of a motif that keeps recurring. Candidate is the operative word. A candidate becomes a canonical symbol only if it survives a blinded test, and that test has not been run.',
  },
  {
    n: '07',
    name: 'Sequence',
    body: 'A reported relation or order between symbols: one form giving way to another, or forms reported together. Sequences are recorded as reports, not as structure.',
  },
];

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 } as const;
const sans = { fontFamily: "'Hanken Grotesk', system-ui, sans-serif" } as const;

const ObjectModel = () => (
  <>
    <SEO uiKey="object-model" path="/object-model" />
    <Helmet>
      <meta name="robots" content="index, follow" />
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dmtcode.com/' },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Object model',
              item: 'https://dmtcode.com/object-model',
            },
          ],
        })}
      </script>
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'DefinedTermSet',
          '@id': 'https://dmtcode.com/object-model#termset',
          name: 'DMT Code object model',
          url: 'https://dmtcode.com/object-model',
          license: 'https://creativecommons.org/licenses/by/4.0/',
          hasDefinedTerm: LEVELS.map((l) => ({
            '@type': 'DefinedTerm',
            name: l.name,
            description: l.body,
            inDefinedTermSet: 'https://dmtcode.com/object-model#termset',
          })),
        })}
      </script>
    </Helmet>

    <div className="relative min-h-screen bg-background">
      <Navigation />
      <main id="main-content" className="relative z-10 pt-20" role="main">
        <Breadcrumb />

        <section className="container mx-auto px-4 max-w-3xl pt-4 space-y-5">
          <p className="label-data text-xs text-primary">THE OBJECT MODEL</p>
          <h1 className="text-4xl md:text-5xl text-foreground" style={serif}>
            How one experience becomes a record
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed" style={sans}>
            This page defines the vocabulary the rest of the site uses. It exists
            because two counts published at{' '}
            <a href="/data.json" className="text-primary hover:underline">
              /data.json
            </a>{' '}
            are read as synonyms by people and by machines, and they are not
            synonyms. Nothing is summed across them.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed" style={sans}>
            The model runs from one person's experience up to a reviewed
            abstraction. Each level is a different kind of object with a
            different evidential weight, and moving up a level is a claim that
            has to be earned.
          </p>
        </section>

        <section className="container mx-auto px-4 max-w-3xl py-10" aria-labelledby="levels-h">
          <h2 id="levels-h" className="text-2xl md:text-3xl text-foreground mb-6" style={serif}>
            The seven levels
          </h2>
          <ol className="space-y-4">
            {LEVELS.map((l) => (
              <li key={l.n} className="rounded-sm border border-border bg-card p-5">
                <p className="label-data text-[10px] text-primary mb-1">{l.n}</p>
                <h3 className="text-xl text-foreground mb-2" style={serif}>
                  {l.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed" style={sans}>
                  {l.body}
                </p>
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted-foreground leading-relaxed mt-6" style={sans}>
            Levels one to four are published today. Levels five to seven are the
            vocabulary the analysis will use; they are not published as their own
            collections at /data.json, and nothing on this site presents a
            canonical symbol as settled.
          </p>
        </section>

        <section
          className="container mx-auto px-4 max-w-3xl py-10 border-t border-border/40"
          aria-labelledby="counts-h"
        >
          <h2 id="counts-h" className="text-2xl md:text-3xl text-foreground mb-4" style={serif}>
            Why the two counts differ
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-4" style={sans}>
            The corpus publishes two separate symbol counts, and they count
            different objects that arrived through different doors.
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground mb-4" style={sans}>
            <li>
              <strong className="text-foreground">counts.symbols</strong> covers
              symbols[]: account backed submissions to the registry, one public
              symbol record per submission, each carrying a description, tags,
              contextual metadata and recognition counts.
            </li>
            <li>
              <strong className="text-foreground">counts.registry_glyphs</strong>{' '}
              covers registry_glyphs[]: anonymous freehand drawings made with the
              quick capture tool. No account, no metadata beyond the source and
              the date, a separate table.
            </li>
          </ul>
          <p className="text-base text-muted-foreground leading-relaxed mb-4" style={sans}>
            They never overlap, because a row can only exist in one of the two
            tables, and they are never summed, because adding an identified
            submission to an anonymous drawing produces a number that means
            nothing. Anyone reporting a single total for this project is reading
            the corpus wrong. Take counts.symbols and counts.registry_glyphs
            separately, or read the field definitions on the{' '}
            <Link to="/dataset" className="text-primary hover:underline">
              dataset page
            </Link>
            .
          </p>
          <p className="text-base text-muted-foreground leading-relaxed" style={sans}>
            A third number appears on the{' '}
            <Link to="/registry" className="text-primary hover:underline">
              registry
            </Link>{' '}
            itself: the count of published records shown there is higher than the
            count exported at /data.json, because the export includes only
            records whose contributor granted publication consent.
          </p>
        </section>

        <section
          className="container mx-auto px-4 max-w-3xl py-10 border-t border-border/40"
          aria-labelledby="why-h"
        >
          <h2 id="why-h" className="text-2xl md:text-3xl text-foreground mb-4" style={serif}>
            Why the levels matter
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-4" style={sans}>
            The whole question this project exists to answer is whether
            independent people report the same form. That question only has
            meaning at the glyph instance level, compared across observations
            that were recorded before the observer saw the catalogue. Counting
            submissions does not answer it. Counting drawings does not answer it.
            Collapsing the levels is the most common way to make this record look
            like it says more than it does.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-6" style={sans}>
            Stage one is screening: open, self selected, unblinded, with priming
            not ruled out. Stage two captures the memory before exposure to the
            catalogue. Stage three is a randomized blinded arm, designed and not
            run.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link to="/capture" className="text-primary hover:underline">
              Record before you browse
            </Link>
            <Link to="/registry" className="text-primary hover:underline">
              Browse the registry
            </Link>
            <a href="/data.json" className="text-primary hover:underline">
              Machine readable corpus
            </a>
            <Link to="/research" className="text-primary hover:underline">
              What has actually been measured
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  </>
);

export default ObjectModel;
