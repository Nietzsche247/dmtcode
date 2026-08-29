import { Link } from 'react-router-dom';

// Nine step journey strip. Every destination is a route that already exists in
// src/AppRoutes.tsx. The same nine steps are rendered for crawlers by the
// home entry in netlify/edge-functions/content-prerender.ts. Edge functions run
// in Deno and cannot import from src/, so the two lists are mirrored by hand.
// If you change a label, a line or a route here, change it there in the same
// commit or the two surfaces tell different stories.
const STEPS: Array<{ n: string; label: string; line: string; to: string }> = [
  { n: '01', label: 'Understand', line: 'What this is, and what it is not.', to: '/about' },
  { n: '02', label: 'Story', line: 'How the observation began, dated and sourced.', to: '/timeline' },
  { n: '03', label: 'Evidence', line: 'What has been reported, and how much it carries.', to: '/evidence-map' },
  { n: '04', label: 'Theories', line: 'Proposed explanations, held as hypotheses.', to: '/theories' },
  { n: '05', label: 'Science', line: 'What has actually been measured, and by whom.', to: '/research' },
  { n: '06', label: 'Participate', line: 'Events, experiments and trials you can join.', to: '/events' },
  { n: '07', label: 'Prepare', line: 'Build the rig yourself, or buy a kit.', to: '/prepare' },
  { n: '08', label: 'Record', line: 'Describe what you saw before you browse.', to: '/capture' },
  { n: '09', label: 'Decode', line: 'Compare your memory against other recollections.', to: '/co-witnesses' },
];

export const ExpeditionStrip = () => (
  <section
    aria-label="The expedition, nine steps"
    className="container mx-auto px-4 py-8 max-w-6xl border-t border-border/30"
  >
    <p className="label-data text-xs text-primary mb-2">THE EXPEDITION</p>
    <h2
      className="text-2xl md:text-3xl text-foreground mb-5"
      style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
    >
      Nine steps through the record
    </h2>
    <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {STEPS.map((s) => (
        <li key={s.n}>
          <Link
            to={s.to}
            className="group flex h-full flex-col gap-1 rounded-sm border border-border bg-card p-3 transition-colors hover:border-primary/60"
          >
            <span className="label-data text-[10px] text-primary">{s.n}</span>
            <span className="text-base text-foreground group-hover:underline">{s.label}</span>
            <span
              className="text-xs text-muted-foreground leading-snug"
              style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
            >
              {s.line}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  </section>
);

export default ExpeditionStrip;
