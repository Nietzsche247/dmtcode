-- Applied to production 2026-08-30 via the Lovable connector, then written here
-- so the repo and the database do not drift. Every statement is guarded, so
-- re-application is a no-op.
--
-- Why this exists: netlify/edge-functions/data-json.ts listed
-- relation_to_core_question as an optional column on the bibliography select.
-- The column was never created. PostgREST rejects a select naming an unknown
-- column with 400 for the whole query, and fetchAll dropped ALL optional columns
-- on that failure. The result was that publication_status,
-- online_publication_date and issue_date were absent from all 236 bibliography
-- rows in /data.json even though the database held them. The export looked
-- healthy and told machines nothing.

alter table public.bibliography
  add column if not exists relation_to_core_question text;

alter table public.bibliography
  drop constraint if exists bibliography_relation_vocab;
alter table public.bibliography
  add constraint bibliography_relation_vocab
  check (
    relation_to_core_question is null
    or relation_to_core_question in (
      'direct_test',
      'mechanistic',
      'phenomenological_baseline',
      'comparison_condition',
      'methodological',
      'historical',
      'adjacent'
    )
  );

-- A principal investigator is a sourced role on a registered trial or a
-- published pilot report. On a media claim it invents an authority the source
-- does not establish. content-prerender.ts mirrors this in piMayRender().
alter table public.clinical_trials
  drop constraint if exists trials_pi_only_on_sourced_types;
alter table public.clinical_trials
  add constraint trials_pi_only_on_sourced_types
  check (
    principal_investigator is null
    or record_type in (
      'registered_clinical_trial',
      'registered_observational_study',
      'published_pilot_report'
    )
  );

-- Scoped to approved rows because the invariant is about what the public sees.
-- One unapproved legacy draft (110298e2-e36f-45a3-84f5-7e52171cadfd) has no
-- registry id and is deliberately left untouched pending review.
alter table public.clinical_trials
  drop constraint if exists trials_registered_needs_registry_id;
alter table public.clinical_trials
  add constraint trials_registered_needs_registry_id
  check (
    is_approved is not true
    or record_type <> 'registered_clinical_trial'
    or trial_registry_id is not null
  );
