// One source of truth for how a theory is attributed, shared by /theories, the
// theory detail page, the dashboard and the edge prerender.
//
// The legacy `proponent` column merged two different people: whoever built a
// framework, and whoever pointed that framework at the 650 nm laser phenomenon.
// Rendering "Proposed by Donald Hoffman" on a borrowed framework tells a reader,
// and every AI agent citing this site, that Hoffman proposed an explanation of
// the DMT-laser claim. He did not. Fifteen of the twenty curated theories are
// borrowed in exactly this way.
//
// The database now separates the two (framework_originator, applied_to_dmtcode_by)
// and states directly_addresses_dmt_laser. This module is how that reaches humans.

export type TheoryProvenance = {
  proponent?: string | null;
  theory_class?: string | null;
  framework_originator?: string | null;
  applied_to_dmtcode_by?: string | null;
  directly_addresses_dmt_laser?: boolean | null;
  original_publication_year?: number | null;
  primary_source?: string | null;
};

const CLASS_LABELS: Record<string, string> = {
  deflationary: 'Deflationary',
  neurocognitive: 'Neurocognitive',
  psychological: 'Psychological',
  phenomenological: 'Phenomenological',
  ontological: 'Ontological',
  metaphysical: 'Metaphysical',
  cultural_historical: 'Cultural / historical',
};

const CLASS_BLURBS: Record<string, string> = {
  deflationary: 'The forms come from the observer or the apparatus. Nothing external is required.',
  neurocognitive: 'A brain mechanism produces the recurring structure.',
  psychological: 'A shared feature of mind, not of the world.',
  phenomenological: 'A description of the structure of the experience, with no cause claimed.',
  ontological: 'The forms indicate something real outside the observer.',
  metaphysical: 'A claim about the nature of reality itself.',
  cultural_historical: 'The forms situated in a human record.',
};

export const theoryClassLabel = (v: string | null | undefined): string =>
  (v && CLASS_LABELS[v]) || '';

export const theoryClassBlurb = (v: string | null | undefined): string =>
  (v && CLASS_BLURBS[v]) || '';

export type Attribution = {
  mode: 'direct' | 'borrowed' | 'legacy';
  /** Main attribution line. Always safe to render on its own. */
  primary: string;
  /** Who pointed it at this phenomenon. Only set when mode is 'borrowed'. */
  secondary?: string;
  /** The explicit disclaimer. Only set when mode is 'borrowed'. */
  note?: string;
};

export function theoryAttribution(t: TheoryProvenance): Attribution | null {
  const originator = (t.framework_originator || '').trim();
  const applier = (t.applied_to_dmtcode_by || '').trim();
  const direct = t.directly_addresses_dmt_laser;

  // Fully migrated row: say exactly who did what.
  if (originator && direct === true) {
    return { mode: 'direct', primary: `Proposed for the DMT-laser phenomenon by ${originator}` };
  }
  if (originator && direct === false) {
    return {
      mode: 'borrowed',
      primary: `Framework by ${originator}`,
      secondary: applier
        ? `Applied to the DMT-laser question here by ${applier}`
        : 'Applied to the DMT-laser question here by DMT Code',
      note: `${originator} did not propose this as an explanation of the DMT-laser phenomenon.`,
    };
  }
  if (originator) {
    return { mode: 'legacy', primary: `Framework by ${originator}` };
  }

  // Un-migrated row. Deliberately does NOT say "Proposed by": the legacy column
  // cannot distinguish an originator from an applier, so it must not assert either.
  const legacy = (t.proponent || '').trim();
  if (legacy) return { mode: 'legacy', primary: `Associated with ${legacy}` };
  return null;
}

/**
 * Schema.org attribution. A borrowed framework must never set `author` to the
 * framework's originator, because on this page `author` would read as the author
 * of the DMT-laser application rather than of the original work.
 */
export function applyTheoryJsonLdAttribution(
  ld: Record<string, unknown>,
  t: TheoryProvenance,
): Record<string, unknown> {
  const originator = (t.framework_originator || '').trim();
  const applier = (t.applied_to_dmtcode_by || '').trim();
  const direct = t.directly_addresses_dmt_laser;
  const props: Array<Record<string, unknown>> = [];

  if (originator && direct === true) {
    ld.author = { '@type': 'Person', name: originator };
  } else if (originator) {
    // Borrowed: cite the original work, credit the application to whoever made it.
    ld.citation = t.primary_source
      ? { '@type': 'CreativeWork', name: `Framework by ${originator}`, url: t.primary_source }
      : `Framework by ${originator}`;
    ld.creator = { '@type': 'Organization', name: applier || 'DMT Code' };
    delete ld.author;
  }

  if (originator) props.push({ '@type': 'PropertyValue', name: 'framework_originator', value: originator });
  if (applier) props.push({ '@type': 'PropertyValue', name: 'applied_to_dmtcode_by', value: applier });
  if (typeof direct === 'boolean') {
    props.push({ '@type': 'PropertyValue', name: 'directly_addresses_dmt_laser', value: String(direct) });
  }
  if (t.theory_class) props.push({ '@type': 'PropertyValue', name: 'theory_class', value: t.theory_class });
  if (props.length) ld.additionalProperty = props;

  return ld;
}
