import { memo } from 'react';

// Monoline geometric badge marks. Same visual language as AvatarGlyph:
// strokes only, no fills, no gradients, no letters, no emoji.
// Keyed off badges.name. The badges.icon column is deliberately ignored.

export type BadgeIconName =
  | 'first_recognition'
  | 'primacy_validated'
  | 'skeptic_contributor'
  | 'pattern_hunter'
  | 'precision'
  | 'trailblazer'
  | 'spectrum_hunter'
  | 'colorist'
  | 'curator'
  | 'methodologist'
  | 'archive_builder'
  | 'contributor'
  | 'data_scientist'
  | 'first_symbol'
  | 'pattern_master'
  | 'researcher'
  | 'tag_master'
  | 'expert_tagger'
  | 'validator';

const HEX = 'M12 2.6 20.1 7.3 20.1 16.7 12 21.4 3.9 16.7 3.9 7.3Z';
const HEX_SM = 'M12 6.4 16.9 9.2 16.9 14.8 12 17.6 7.1 14.8 7.1 9.2Z';

const MARKS: Record<string, JSX.Element> = {
  // six-point radial star of strokes
  first_recognition: (
    <>
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
    </>
  ),
  // laurel-less primacy: circle with a leading vertical stroke and a top arc
  primacy_validated: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 12V5" />
      <path d="M6.5 8.5A7 7 0 0 1 17.5 8.5" />
    </>
  ),
  // question of doubt: circle bisected by an offset stroke
  skeptic_contributor: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M6 16 18 8" />
      <path d="M12 12h6" />
    </>
  ),
  // nested hexagons
  pattern_hunter: (
    <>
      <path d={HEX} />
      <path d={HEX_SM} />
    </>
  ),
  // circle with center dot and crosshair ticks
  precision: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="1" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  // arrow breaking a horizon line
  trailblazer: (
    <>
      <path d="M3 18h18" />
      <path d="M6 14 12 4l6 10" />
      <path d="M9 14h6" />
    </>
  ),
  // three concentric arcs
  spectrum_hunter: (
    <>
      <path d="M4 16a8 8 0 0 1 16 0" />
      <path d="M7 16a5 5 0 0 1 10 0" />
      <path d="M10 16a2 2 0 0 1 4 0" />
    </>
  ),
  // circle split into three wedges
  colorist: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 12V4M12 12l7 4M12 12l-7 4" />
    </>
  ),
  // hexagon with inner triangle
  curator: (
    <>
      <path d={HEX} />
      <path d="M12 8.2 16 15.2H8Z" />
    </>
  ),
  // square frame with measured internal steps
  methodologist: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="M8 16v-3h3v-3h3V7" />
    </>
  ),
  // stacked strata
  archive_builder: (
    <>
      <path d="M4 8h16M4 12h16M4 16h16" />
      <path d="M8 4v16M16 4v16" />
    </>
  ),
  // upward stroke into a circle node
  contributor: (
    <>
      <circle cx="12" cy="7" r="3" />
      <path d="M12 10v11M7 21h10" />
    </>
  ),
  // three vertical strokes of varying height inside a frame
  data_scientist: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="1" />
      <path d="M8 16V9M12 16v-4M16 16V7" />
    </>
  ),
  // single triangle inside a circle
  first_symbol: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.5 16.2 15H7.8Z" />
    </>
  ),
  // interlocking lattice of diamonds
  pattern_master: (
    <>
      <path d="M12 3 16 8l-4 5-4-5Z" />
      <path d="M12 11 16 16l-4 5-4-5Z" />
      <path d="M4 12h4M16 12h4" />
    </>
  ),
  // lens: circle on a stem
  researcher: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </>
  ),
  // tag outline with a node
  tag_master: (
    <>
      <path d="M4 10.5 10.5 4H19a1 1 0 0 1 1 1v8.5L13.5 20a1 1 0 0 1-1.4 0L4 11.9a1 1 0 0 1 0-1.4Z" />
      <circle cx="15.5" cy="8.5" r="1.4" />
    </>
  ),
  // two tags overlapping
  expert_tagger: (
    <>
      <path d="M3 11 9 5h6l6 6-8 8Z" />
      <path d="M8 9.5h.01" />
      <path d="M9 19l7-7" />
    </>
  ),
  // circle with an inscribed check drawn as two strokes
  validator: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.2 12.2 11 15" />
      <path d="M11 15l5-5.4" />
    </>
  ),
};

const FALLBACK = (
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v8M8 12h8" />
  </>
);

interface BadgeIconProps {
  name: string;
  size?: number;
  className?: string;
}

export const BadgeIcon = memo(({ name, size = 24, className = '' }: BadgeIconProps) => {
  const mark = MARKS[String(name || '').toLowerCase()] ?? FALLBACK;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {mark}
    </svg>
  );
});

BadgeIcon.displayName = 'BadgeIcon';
