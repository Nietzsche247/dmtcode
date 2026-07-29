/**
 * Shared submission status helpers.
 *
 * These mirror, one for one, the logic in netlify/edge-functions/data-json.ts
 * so that what the site shows a human and what the corpus publishes to a
 * machine can never disagree. If you change one, change the other.
 */

export interface SubmissionStatusRow {
  image_url?: string | null;
  is_curated_example?: boolean | null;
  visibility_status?: string | null;
  moderation_status?: string | null;
  evidence_status?: string | null;
  review_due_at?: string | null;
}

/**
 * Curated examples are flagged by the is_curated_example column. The image_url
 * prefix check is kept as a fallback so the five original starter rows stay
 * classified correctly even where that column has not been selected.
 */
export const isCuratedExample = (r: SubmissionStatusRow | null | undefined): boolean => {
  if (!r) return false;
  if (r.is_curated_example === true) return true;
  return typeof r.image_url === 'string' && r.image_url.startsWith('/placeholder-symbol-');
};

/**
 * Overdue is never stored. It is derived at read time from moderation_status
 * and review_due_at, so it can never go stale. A symbol nobody reviewed inside
 * the 72 hour window is overdue, not approved.
 */
export const isReviewOverdue = (r: SubmissionStatusRow | null | undefined): boolean => {
  if (!r) return false;
  if (r.moderation_status !== 'unreviewed') return false;
  if (!r.review_due_at) return false;
  return new Date(r.review_due_at).getTime() < Date.now();
};

/** The notice that must appear wherever a curated example is shown to a reader. */
export const CURATED_EXAMPLE_NOTICE =
  'Curated example. Not an observer submission. Excluded from evidence and convergence totals.';

export type StatusTone = 'neutral' | 'positive' | 'caution' | 'negative';

/** Returns an empty string when unknown. Never render a placeholder word. */
export const visibilityLabel = (r: SubmissionStatusRow | null | undefined): string => {
  switch (r?.visibility_status) {
    case 'public':
      return 'Published';
    case 'private':
      return 'Private to the author';
    case 'hidden':
      return 'Withdrawn from public view';
    default:
      return '';
  }
};

/** Returns an empty string when unknown. Never render a placeholder word. */
export const moderationLabel = (r: SubmissionStatusRow | null | undefined): string => {
  if (isReviewOverdue(r)) return 'Not yet reviewed, past the 72 hour window';
  switch (r?.moderation_status) {
    case 'unreviewed':
      return 'Not yet reviewed';
    case 'reviewed':
      return 'Reviewed by a moderator';
    case 'denied':
      return 'Denied by a moderator';
    case 'reported':
      return 'Reported, awaiting a decision';
    default:
      return '';
  }
};

/** Returns an empty string when unknown. Never render a placeholder word. */
export const evidenceLabel = (r: SubmissionStatusRow | null | undefined): string => {
  switch (r?.evidence_status) {
    case 'raw':
      return 'Observer report, nothing established about it yet';
    case 'eligible':
      return 'Eligible for convergence analysis';
    case 'ineligible':
      return 'Excluded from convergence analysis';
    case 'candidate_match':
      return 'Candidate match, awaiting assessment';
    case 'reviewed_convergence':
      return 'Convergence assessed by a reviewer';
    case 'controlled_replication':
      return 'Arose from a controlled protocol';
    default:
      return '';
  }
};

export const moderationTone = (r: SubmissionStatusRow | null | undefined): StatusTone => {
  if (isReviewOverdue(r)) return 'caution';
  switch (r?.moderation_status) {
    case 'reviewed':
      return 'positive';
    case 'denied':
      return 'negative';
    case 'reported':
      return 'caution';
    default:
      return 'neutral';
  }
};
