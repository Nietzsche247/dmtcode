export const RELATION_TO_CORE_QUESTION_DEFINITION = "On a bibliography record: how the source relates to the convergence claim, not how strong the source is. direct_test = it tests or attempts to falsify the claim or the 650 nm protocol itself. mechanistic = it proposes or evidences a mechanism that could produce recurring visual FORM. phenomenological_baseline = it describes what the experience contains as people report it. comparison_condition = a non-DMT state producing comparable visuals, which bears on whether the forms are specific to this protocol. methodological = how to run, blind, score or report such research. historical = the documented record and lineage of this specific claim. adjacent = real psychedelic literature that does not bear on the question. adjacent is the default and is the correct answer for most of this corpus. Read the by_relation_to_core_question tally in corpus_composition before treating the bibliography total as a body of evidence for the claim.";

export const BIBLIOGRAPHY_RELATIONS = [
  'direct_test', 'mechanistic', 'phenomenological_baseline',
  'comparison_condition', 'methodological', 'historical', 'adjacent',
] as const;

export function approvalRelationPatch(status: string, existing: string | null | undefined, proposed: unknown) {
  if (status !== 'auto_approved') return {};
  const valid = typeof proposed === 'string' && BIBLIOGRAPHY_RELATIONS.some((value) => value === proposed);
  const relation = valid ? proposed : 'adjacent';
  return {
    ...(existing == null ? { relation_to_core_question: relation } : {}),
    ...(relation === 'direct_test' || relation === 'historical' ? { triage_status: 'needs_review' } : {}),
    ...(existing == null && !valid ? { relation_note: '[relation defaulted to adjacent: missing or invalid model value]' } : {}),
  };
}