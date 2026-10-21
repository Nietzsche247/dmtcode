// Labels and ordering mirror the symbols branch in netlify/edge-functions/content-prerender.ts.
export type SymbolRecord = {
  id: string; description: string | null; image_url: string | null;
  source_method: string | null; evidence_status: string | null;
  prior_exposure: string | null; is_curated_example: boolean | null; created_at: string;
};
export const SOURCE_METHOD_LABELS: Record<string, string> = {"laser_650nm": "650 nm laser", "closed_eye": "closed eye", "open_eye": "open eye", "other": "other"};
export const EVIDENCE_STATUS_LABELS: Record<string, string> = {"raw": "raw report", "eligible": "eligible for convergence analysis", "ineligible": "excluded from convergence analysis", "candidate_match": "candidate match, awaiting assessment", "reviewed_convergence": "reviewed convergence", "controlled_replication": "controlled replication"};
export const PRIOR_EXPOSURE_LABELS: Record<string, string> = { naive: 'naive', exposed: 'exposed' };
export const recordLabel = (labels: Record<string, string>, value: string | null) => value ? labels[value] ?? 'not stated' : 'not stated';
export const symbolRecordTitle = (row: SymbolRecord) => row.description?.slice(0, 80) || `Symbol ${row.id.slice(0, 8)}`;
export const sortSymbolRecords = (rows: SymbolRecord[]) => [...rows].sort((a, b) =>
  Number(b.source_method === 'laser_650nm') - Number(a.source_method === 'laser_650nm') || b.created_at.localeCompare(a.created_at));
