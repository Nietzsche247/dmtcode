import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// The Science Room. The counterpart to the Theory Board at /theories: that page
// holds proposals, this page holds what has actually been measured. Nothing here
// is asserted by hand except the framing. Every study named below comes from the
// bibliography or the trials table, and a section with no records says so.
//
// The five section headings and their framing paragraphs are mirrored for
// crawlers by the research entry in netlify/edge-functions/content-prerender.ts.
// Edge functions run in Deno and cannot import from src/, so change both in the
// same commit.

type BibRow = {
  id: string;
  title: string;
  authors: string | null;
  journal: string | null;
  publication_date: string | null;
  doi: string | null;
  url: string | null;
  summary: string | null;
};

type TrialRow = {
  id: string;
  title: string;
  record_type: string;
  description: string | null;
};

// Record types that describe a direct test of the observation itself rather
// than a registered trial of a compound. Mirrors the typing published on /trials.
const DIRECT_TEST_TYPES = [
  'published_pilot_report',
  'community_experiment',
  'reported_replication',
  'citizen_science_project',
  'academic_experiment',
  'registered_observational_study',
];

const MECHANISM_TERMS = [
  'speckle', 'entoptic', 'phosphene', 'visual cortex', 'retinotop',
  'predictive processing', 'predictive coding', 'form constant', 'kluver',
  'geometric hallucination', 'turing pattern', 'psychophysic', 'diffraction',
];

const DMT_TERMS = [
  'dmt', 'dimethyltryptamine', 'ayahuasca', 'eeg', 'fmri', 'neuroimag',
  'pharmacokinet', '5-ht2a', 'receptor', 'phenomenolog',
];

const METHOD_TERMS = [
  'double-blind', 'double blind', 'placebo', 'preregist', 'pre-regist',
  'inter-rater', 'interrater', 'replicat', 'meta-analys', 'expectancy',
  'blinding', 'null result', 'effect size',
];

const haystack = (r: BibRow) =>
  `${r.title || ''} ${r.journal || ''} ${r.summary || ''}`.toLowerCase();

const match = (rows: BibRow[], terms: string[]) =>
  rows.filter((r) => terms.some((t) => haystack(r).includes(t)));

const yearOf = (d: string | null) => (d ? new Date(d).getFullYear() : null);

const CitationList = ({ rows, limit = 6 }: { rows: BibRow[]; limit?: number }) => (
  <ul className="space-y-3">
    {rows.slice(0, limit).map((r) => (
      <li key={r.id} className="text-sm">
        <Link to={`/bibliography/${r.id}`} className="text-foreground hover:underline">
          {r.title}
        </Link>
        <span className="text-muted-foreground">
          {r.authors ? ` ${r.authors}.` : ''}
          {yearOf(r.publication_date) ? ` ${yearOf(r.publication_date)}.` : ''}
          {r.journal ? ` ${r.journal}.` : ''}
        </span>
        {r.doi ? (
          <a
            href={r.url ?? `https://doi.org/${r.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center gap-1 text-primary hover:underline"
          >
            DOI
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : null}
      </li>
    ))}
  </ul>
);

const Section = ({
  id,
  n,
  title,
  lede,
  children,
}: {
  id: string;
  n: string;
  title: string;
  lede: string;
  children: ReactNode;
}) => (
  <section id={id} className="border-t border-border/40 py-10" aria-labelledby={`${id}-h`}>
    <p className="label-data text-xs text-primary mb-3">{n}</p>
    <h2
      id={`${id}-h`}
      className="text-2xl md:text-3xl text-foreground mb-3"
      style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
    >
      {title}
    </h2>
    <p
      className="text-base text-muted-foreground leading-relaxed max-w-3xl mb-6"
      style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
    >
      {lede}
    </p>
    {children}
  </section>
);

const Empty = ({ what }: { what: string }) => (
  <p className="text-sm text-muted-foreground">
    The library holds no record indexed under {what} yet. That is a gap in the
    library, not a finding. If you know of one,{' '}
    <a href="mailto:info@dmtcode.com" className="text-primary hover:underline">
      send it to us
    </a>{' '}
    and it will be added with its stance score.
  </p>
);

export const ScienceRoom = () => {
  const [bib, setBib] = useState<BibRow[]>([]);
  const [direct, setDirect] = useState<TrialRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [bibRes, trialRes] = await Promise.all([
        supabase
          .from('bibliography')
          .select('id, title, authors, journal, publication_date, doi, url, summary')
          .eq('is_approved', true)
          .order('publication_date', { ascending: false, nullsFirst: false })
          .limit(400),
        supabase
          .from('clinical_trials')
          .select('id, title, record_type, description')
          .eq('is_approved', true)
          .in('record_type', DIRECT_TEST_TYPES)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      if (!active) return;
      setBib((bibRes.data as BibRow[]) ?? []);
      setDirect((trialRes.data as TrialRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const mechanism = match(bib, MECHANISM_TERMS);
  const dmt = match(bib, DMT_TERMS);
  const method = match(bib, METHOD_TERMS);

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <Section
        id="direct-tests"
        n="01"
        title="Direct tests"
        lede="Work that tested the observation itself rather than the compound. Every record is typed, so a pilot report is never mistaken for a registered clinical trial. Stage one of this project is screening, not the experiment: open, self selected, unblinded, with priming not ruled out. Stage two captures the memory before the observer sees the catalogue. Stage three is a randomized blinded arm, designed and not run."
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading records...</p>
        ) : direct.length === 0 ? (
          <Empty what="a direct test of the laser observation" />
        ) : (
          <ul className="space-y-3">
            {direct.map((t) => (
              <li key={t.id} className="text-sm">
                <Link to={`/trials/${t.id}`} className="text-foreground hover:underline">
                  {t.title}
                </Link>
                <span className="label-data ml-2 text-[10px] text-muted-foreground">
                  {t.record_type.replace(/_/g, ' ')}
                </span>
                {t.description ? (
                  <p className="text-muted-foreground mt-1">{t.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-muted-foreground mt-5">
          Read these in context on the{' '}
          <Link to="/trials" className="text-primary hover:underline">
            trials index
          </Link>{' '}
          and against the{' '}
          <Link to="/critiques" className="text-primary hover:underline">
            critiques
          </Link>
          .
        </p>
      </Section>

      <Section
        id="mechanistic-science"
        n="02"
        title="Mechanistic science"
        lede="What optics and vision science already know that could produce a repeatable form without anything exotic: laser speckle, the geometry of the visual cortex, predictive processing, and the classic hallucinatory form constants. If one of these accounts for the reports, that is the answer, and it would be a real one."
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading records...</p>
        ) : mechanism.length === 0 ? (
          <Empty what="laser speckle, cortical geometry or predictive processing" />
        ) : (
          <>
            <CitationList rows={mechanism} />
            <p className="text-sm text-muted-foreground mt-4">
              {mechanism.length} of {bib.length} indexed records touch this
              strand. Additions here are the ones most worth having, since a
              conventional optical or cortical account would settle the
              question.
            </p>
          </>
        )}
      </Section>

      <Section
        id="dmt-science"
        n="03"
        title="DMT science"
        lede="What has been measured about the compound itself: EEG and fMRI during the experience, pharmacology and receptor work, and the phenomenological literature that tries to describe what people report."
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading records...</p>
        ) : dmt.length === 0 ? (
          <Empty what="EEG, fMRI, pharmacology or phenomenology" />
        ) : (
          <>
            <CitationList rows={dmt} limit={8} />
            <p className="text-sm text-muted-foreground mt-4">
              {dmt.length} of {bib.length} indexed records sit in this strand.{' '}
              <Link to="/bibliography" className="text-primary hover:underline">
                Browse the full library
              </Link>{' '}
              to filter by stance, authority and year.
            </p>
          </>
        )}
      </Section>

      <Section
        id="methodology"
        n="04"
        title="Methodology"
        lede="How a claim like this would be tested properly: blinded matching, similarity scoring that survives rotation and stroke width, preregistration of the outcome before recruitment begins, and honest handling of null results. The draft study design is published in full, including the sample size correction that followed an error in an earlier version."
      >
        <ul className="space-y-2 text-sm mb-6">
          <li>
            <Link to="/methods" className="text-primary hover:underline">
              Methods
            </Link>{' '}
            carries the blinding design, the control conditions, the sample size
            calculation and the limits of similarity scoring.
          </li>
          <li>
            <Link to="/null-reports" className="text-primary hover:underline">
              Null reports
            </Link>{' '}
            publishes the reports of seeing nothing alongside the positive ones.
          </li>
          <li>
            <Link to="/critiques" className="text-primary hover:underline">
              Critiques
            </Link>{' '}
            collects the case against, so it can be read before the case for.
          </li>
          <li>
            <Link to="/protocol-guide" className="text-primary hover:underline">
              Protocol guide
            </Link>{' '}
            states the reported equipment, including the laser class the pilot
            actually used.
          </li>
        </ul>
        {loading ? null : method.length === 0 ? (
          <Empty what="blinding, preregistration or null handling" />
        ) : (
          <>
            <p className="label-data text-xs text-muted-foreground mb-3">
              METHODOLOGY RECORDS IN THE LIBRARY
            </p>
            <CitationList rows={method} />
          </>
        )}
      </Section>

      <Section
        id="open-projects"
        n="05"
        title="Open projects"
        lede="What is open to work on right now. Collaborations are listed on this page as they are agreed, with the collaborator named, and not before."
      >
        <ul className="space-y-3 text-sm">
          <li>
            <strong className="text-foreground">Proposed studies.</strong> The
            blinded arm is designed and unfunded. The design is public on{' '}
            <Link to="/methods" className="text-primary hover:underline">
              Methods
            </Link>
            , and the questions it would settle are tracked on{' '}
            <Link to="/open-questions" className="text-primary hover:underline">
              open questions
            </Link>
            .
          </li>
          <li>
            <strong className="text-foreground">Research recruitment.</strong>{' '}
            Analysts, recorders and translators can volunteer through{' '}
            <Link to="/join" className="text-primary hover:underline">
              join
            </Link>
            . Observers who want to record before browsing start at{' '}
            <Link to="/capture" className="text-primary hover:underline">
              capture
            </Link>
            .
          </li>
          <li>
            <strong className="text-foreground">Datasets needing analysis.</strong>{' '}
            The corpus is downloadable at{' '}
            <a href="/data.json" className="text-primary hover:underline">
              /data.json
            </a>{' '}
            under CC-BY-4.0, with field definitions and counts explained on{' '}
            <Link to="/dataset" className="text-primary hover:underline">
              dataset
            </Link>
            . The two symbol counts are not synonyms; the{' '}
            <Link to="/object-model" className="text-primary hover:underline">
              object model
            </Link>{' '}
            explains what each one counts.
          </li>
          <li>
            <strong className="text-foreground">Active collaborations.</strong>{' '}
            Listed here as they are agreed. Researchers who want to use the
            corpus or run a study with it can write to{' '}
            <a href="mailto:info@dmtcode.com" className="text-primary hover:underline">
              info@dmtcode.com
            </a>
            . The licence is CC-BY-4.0, so nothing here needs our permission.
          </li>
        </ul>
      </Section>
    </div>
  );
};

export default ScienceRoom;
