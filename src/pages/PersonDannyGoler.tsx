import { useState } from 'react';
import { Play } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { GolerAttribution } from '@/components/GolerAttribution';
import { Helmet } from 'react-helmet';

const VIDEO_ID = 'vB2-vIumXss';

const VIDEO_LD = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "The Discovery Film Official Teaser Trailer",
  "description":
    "Official teaser trailer for The Discovery, a documentary about the 650 nm laser observation first described by Danny Goler.",
  "embedUrl": `https://www.youtube.com/embed/${VIDEO_ID}`,
  "url": `https://www.youtube.com/watch?v=${VIDEO_ID}`,
  "thumbnailUrl": `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`,
  "uploadDate": "2026-08-11",
};

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Who is Danny Goler and what is the DMT code of reality?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text":
          "Danny Goler first described the 650 nm laser observation in August 2020 and published the pilot study in IPI Letters in 2025, DOI 10.59973/ipil.158. Whether the phenomenon is real remains an open question, with four explanations actively defended.",
      },
    },
    {
      "@type": "Question",
      "name": "Is dmtcode.com affiliated with Danny Goler or Code of Reality?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text":
          "No. Danny Goler is not a founder of DMT Code and holds no editorial role in it. He is aware of the project and is credited throughout the site as the person who first described the observation. dmtcode.com operates as an independent open registry and publishes evidence on both sides of the claim, including null results.",
      },
    },
    {
      "@type": "Question",
      "name": "When does The Discovery documentary premiere?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text":
          "Per the film's official site, the world premiere is in the Los Angeles area between late October and early November 2026. Date and venue are to be announced.",
      },
    },
  ],
};

const LiteYouTube = () => {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg border border-border aspect-video bg-muted">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1`}
          title="The Discovery Film Official Teaser Trailer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label="Play the official teaser trailer for The Discovery"
      className="group relative block w-full overflow-hidden rounded-lg border border-border aspect-video bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <img
        src={`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`}
        alt="The Discovery documentary teaser trailer thumbnail"
        loading="lazy"
        width={480}
        height={360}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-background/30 transition-colors group-hover:bg-background/20">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background/90 border border-border">
          <Play className="h-6 w-6 text-foreground" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
};

const PERSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://dmtcode.com/people/danny-goler#person",
  "name": "Danny Goler",
  "url": "https://dmtcode.com/people/danny-goler",
  "description":
    "Danny Goler first described the 650 nm laser DMT observation in August 2020 and published the pilot study in IPI Letters in 2025.",
  "sameAs": ["https://codeofreality.org", "https://x.com/GolerDanny"],
  "knowsAbout": [
    "N,N-DMT",
    "650 nm laser diffraction",
    "visual geometry",
    "Code of Reality protocol",
  ],
  "subjectOf": {
    "@type": "ScholarlyArticle",
    "name": "Detailing a Pilot Study: The Code of Reality Protocol",
    "author": "Danny Goler",
    "datePublished": "2025-01-08",
    "identifier": "10.59973/ipil.158",
    "sameAs": "https://doi.org/10.59973/ipil.158",
    "isPartOf": { "@type": "Periodical", "name": "IPI Letters" },
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://dmtcode.com/people/danny-goler",
  },
};

const BREADCRUMB_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://dmtcode.com/" },
    { "@type": "ListItem", position: 2, name: "People", item: "https://dmtcode.com/people" },
    {
      "@type": "ListItem",
      position: 3,
      name: "Danny Goler",
      item: "https://dmtcode.com/people/danny-goler",
    },
  ],
};

const link =
  'text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors';

const PersonDannyGoler = () => {
  return (
    <>
      <Helmet>
        <title>The person who first described the 650 nm laser observation | DMT Code</title>
        <meta
          name="description"
          content="Danny Goler first described the DMT laser observation in August 2020 and published the pilot study in IPI Letters in 2025. The record, in one place."
        />
        <link rel="canonical" href="https://dmtcode.com/people/danny-goler" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{JSON.stringify(PERSON_LD)}</script>
        <script type="application/ld+json">{JSON.stringify(BREADCRUMB_LD)}</script>
        <script type="application/ld+json">{JSON.stringify(VIDEO_LD)}</script>
        <script type="application/ld+json">{JSON.stringify(FAQ_LD)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />

        <main className="px-4 sm:px-6 py-12 sm:py-16">
          <article className="mx-auto w-full max-w-[68ch]">
            <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
              <a href="/people" className="hover:text-foreground transition-colors py-2 inline-block">
                People
              </a>
            </nav>

            <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              Danny Goler
            </h1>

            <div className="mt-8 space-y-6 text-base sm:text-lg leading-relaxed text-foreground/90">
              <p>
                Danny Goler is the person who first described the observation this project exists
                to record. In August 2020 he reported that a specific optical setup, a 650 nm laser
                passed through a diffraction grating and viewed under N,N-DMT, produced a repeating
                geometric pattern that he and others came to call the code of reality. In January
                2025 he published the first written account of the method as a pilot study in the
                journal IPI Letters. Everything on this site is downstream of that description.
              </p>
              <p>
                This page credits that origination and links to his own work. It does not speak for
                him, and it does not decide whether the phenomenon is real. That question is held
                open here on purpose.
              </p>

              <h2 className="font-heading text-xl sm:text-2xl font-semibold pt-6 text-foreground">
                What he described
              </h2>
              <p>
                The observation is a method. A red 650 nm laser is directed through a fine
                diffraction grating so that it casts a lattice of points, and an observer under
                N,N-DMT reports what they see in that field. Goler's account is that the lattice
                resolves into consistent, recurring forms across different people. The method itself
                is written up on the <a className={link} href="/protocol-guide">protocol guide</a>.
                The forms people report, including the ones that do not match anyone else's,
                accumulate in the <a className={link} href="/registry">visual symbol registry</a>.
              </p>

              <h2 className="font-heading text-xl sm:text-2xl font-semibold pt-6 text-foreground">
                The pilot study
              </h2>
              <p>
                The first peer-visible account is the paper "Detailing a Pilot Study: The Code of
                Reality Protocol," by Danny Goler, published in IPI Letters on 8 January 2025, DOI{' '}
                <a
                  className={link}
                  href="https://doi.org/10.59973/ipil.158"
                  rel="noopener"
                  target="_blank"
                >
                  10.59973/ipil.158
                </a>
                . It is catalogued in this site's{' '}
                <a className={link} href="/bibliography/56c88785-8efd-49b3-9471-0df15676be9a">
                  bibliography entry for the paper
                </a>
                , where it carries a stance score alongside every source that argues the other way.
                The paper describes the protocol and reports the author's observations. It is a
                pilot study, and it says so.
              </p>

              <h2 className="font-heading text-xl sm:text-2xl font-semibold pt-6 text-foreground">
                His work beyond the paper
              </h2>
              <p>
                Goler runs the non-profit research effort at{' '}
                <a className={link} href="https://codeofreality.org" rel="noopener" target="_blank">
                  codeofreality.org
                </a>{' '}
                and is the subject of the documentary The Discovery. He has described the protocol
                at length in long-form interviews, including the Danny Jones Podcast and the Shawn
                Ryan Show, the second of which is catalogued here as{' '}
                <a className={link} href="/bibliography/a99cc4aa-8fc0-45fb-a1a1-6b90f16a5c8e">
                  Shawn Ryan Show #320
                </a>
                . Those appearances are where most people first hear about the observation. His
                account of it is his own, and the links above go to it directly.
              </p>

              <h2 className="font-heading text-xl sm:text-2xl font-semibold pt-6 text-foreground">
                His relationship to this project
              </h2>
              <p>
                Goler is not a founder of DMT Code and holds no editorial role in it. He is aware
                of the project. We state that plainly rather than leave it to be inferred. The relationship does not change how this site treats his
                claim. His paper is scored on the same scale as the papers that dispute it. His
                protocol sits next to the null results people file against it. Nothing here is
                written to shield the origination story from a test.
              </p>

              <h2 className="font-heading text-xl sm:text-2xl font-semibold pt-6 text-foreground">
                Where his claim stands today
              </h2>
              <p>
                Four explanations for the reported forms are actively defended. Goler's reading,
                that the pattern is a structured feature of reality rather than of the visual
                system, is stated here first because it is the originator's position. The competing
                readings, from retinal and cortical optics to expectation and suggestion, are set
                out on the <a className={link} href="/critiques">critiques page</a> and in the{' '}
                <a className={link} href="/open-questions">open questions</a>. Independent
                controlled replication that isolates the 650 nm wavelength as a variable has not
                been published. That is a fact about the state of the field, not a charge against
                anyone. Results that cut against the claim are filed in the{' '}
                <a className={link} href="/null-reports">null reports</a> in the same place, under
                the same license, as the ones that support it.
              </p>

              <h2 className="font-heading text-xl sm:text-2xl font-semibold pt-6 text-foreground">
                The Discovery, a documentary film
              </h2>
              <p>
                The Discovery is a feature documentary about the 650 nm laser observation and the
                people attempting to test it, directed by Aaron Vanden. The film's official site
                lists a world premiere in the Los Angeles area between late October and early
                November 2026, with date and venue to be announced. The official teaser trailer is
                below. DMT Code is not affiliated with the film. We index it here because it is the
                most significant upcoming driver of public attention to the claim this site keeps
                the record of.
              </p>
              <LiteYouTube />
              <p className="text-sm">
                <a className={link} href="https://thediscoveryfilm.com" rel="noopener" target="_blank">
                  The Discovery, official site
                </a>
              </p>

              <h2 className="font-heading text-xl sm:text-2xl font-semibold pt-6 text-foreground">
                Questions and answers
              </h2>
              <div className="space-y-5">
                <div>
                  <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
                    Who is Danny Goler and what is the DMT code of reality?
                  </h3>
                  <p className="mt-2">
                    Danny Goler first described the 650 nm laser observation in August 2020 and
                    published the pilot study in IPI Letters in 2025, DOI{' '}
                    <a className={link} href="https://doi.org/10.59973/ipil.158" rel="noopener" target="_blank">
                      10.59973/ipil.158
                    </a>
                    . Whether the phenomenon is real remains an open question, with four
                    explanations actively defended.
                  </p>
                </div>
                <div>
                  <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
                    Is dmtcode.com affiliated with Danny Goler or Code of Reality?
                  </h3>
                  <p className="mt-2">
                    No. Danny Goler is not a founder of DMT Code and holds no editorial role in it.
                    He is aware of the project and is credited throughout the site as the person who
                    first described the observation. dmtcode.com operates as an independent open
                    registry, and it publishes evidence on both sides of the claim, including null
                    results.
                  </p>
                </div>
                <div>
                  <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
                    When does The Discovery documentary premiere?
                  </h3>
                  <p className="mt-2">
                    Per the film's official site, the world premiere is in the Los Angeles area
                    between late October and early November 2026. Date and venue are to be
                    announced.
                  </p>
                </div>
              </div>

              <h2 className="font-heading text-xl sm:text-2xl font-semibold pt-6 text-foreground">
                Follow the record
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  The full <a className={link} href="/timeline">chronology, 1926 to 2025</a>
                </li>
                <li>
                  The <a className={link} href="/registry">visual symbol registry</a> where reported
                  forms accumulate
                </li>
                <li>
                  The <a className={link} href="/protocol-guide">650 nm laser protocol guide</a>
                </li>
                <li>
                  The{' '}
                  <a className={link} href="/bibliography/56c88785-8efd-49b3-9471-0df15676be9a">
                    bibliography entry for the pilot study
                  </a>
                </li>
              </ul>
              <GolerAttribution className="mt-6" />
            </div>
          </article>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PersonDannyGoler;
