import { describe, expect, test } from 'bun:test';
import { approvalRelationPatch, BIBLIOGRAPHY_RELATIONS } from '../../supabase/functions/_shared/bibliographyRelation';

describe('bibliography approval relation rules', () => {
  test('each permitted relation is recorded on approval', () => {
    for (const relation of BIBLIOGRAPHY_RELATIONS) {
      expect(approvalRelationPatch('auto_approved', null, relation).relation_to_core_question).toBe(relation);
    }
  });
  test('missing relation defaults to adjacent with a note', () => {
    const patch = approvalRelationPatch('auto_approved', null, undefined);
    expect(patch.relation_to_core_question).toBe('adjacent');
    expect(patch.relation_note).toContain('defaulted');
  });
  test('invalid relation defaults to adjacent with a note', () => {
    const patch = approvalRelationPatch('auto_approved', null, 'confirmed');
    expect(patch.relation_to_core_question).toBe('adjacent');
    expect(patch.relation_note).toContain('defaulted');
  });
  test('direct_test requires human review without clearing approval', () => {
    const patch = { is_approved: true, ...approvalRelationPatch('auto_approved', null, 'direct_test') };
    expect(patch.triage_status).toBe('needs_review');
    expect(patch.relation_to_core_question).toBe('direct_test');
    expect(patch.is_approved).toBe(true);
  });
  test('historical requires human review without clearing approval', () => {
    const patch = { is_approved: true, ...approvalRelationPatch('auto_approved', null, 'historical') };
    expect(patch.triage_status).toBe('needs_review');
    expect(patch.relation_to_core_question).toBe('historical');
    expect(patch.is_approved).toBe(true);
  });
  test('existing non-null relation is never overwritten', () => {
    expect(approvalRelationPatch('auto_approved', 'comparison_condition', 'mechanistic')).not.toHaveProperty('relation_to_core_question');
  });
  test('needs_review records receive no relation changes', () => {
    expect(approvalRelationPatch('needs_review', null, 'mechanistic')).toEqual({});
  });
  test('auto_rejected records receive no relation changes', () => {
    expect(approvalRelationPatch('auto_rejected', null, 'adjacent')).toEqual({});
  });
});