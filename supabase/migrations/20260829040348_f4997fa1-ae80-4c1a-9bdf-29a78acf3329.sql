-- Repair Build 5, One Surface One Truth. Database side. Idempotent.

begin;

update public.clinical_trials set record_type = 'registered_clinical_trial'
 where record_type = 'registered_trial';
update public.clinical_trials set record_type = 'published_pilot_report'
 where record_type = 'internal_session' and title = 'Goler Pilot Study';
update public.clinical_trials set record_type = 'reported_replication'
 where record_type = 'internal_session' and title = 'First Cross-Session Symbol Match';
update public.clinical_trials set record_type = 'media_claim'
 where record_type = 'internal_session' and title = 'Chase Hughes Validation Session';
update public.clinical_trials set record_type = 'rumored_report'
 where record_type = 'internal_session' and (title ilike 'Podcast-Mentioned%' or confirmed_status = 'Rumored');
update public.clinical_trials set record_type = 'retreat_or_facilitated_session'
 where record_type in ('internal_session','rumored_report') and title ilike 'Retreat-Based Laser Session%';
update public.clinical_trials set record_type = 'platform_project'
 where record_type = 'internal_session' and (
   title in ('DMT Code Community Registry Launch','Null Report Tracking Programme','Ongoing DMT Code Registry Recruitment','Community Laser-Safety Working Group')
   or institution ilike 'DMT Code%');
update public.clinical_trials set record_type = 'community_experiment'
 where record_type = 'internal_session';

alter table public.clinical_trials drop constraint if exists clinical_trials_record_type_check;
alter table public.clinical_trials add constraint clinical_trials_record_type_check
  check (record_type in (
    'registered_clinical_trial','registered_observational_study','academic_experiment',
    'published_pilot_report','community_experiment','citizen_science_project','reported_replication',
    'platform_project','media_claim','rumored_report','retreat_or_facilitated_session'));

alter table public.clinical_trials drop constraint if exists clinical_trials_registered_needs_id;
alter table public.clinical_trials add constraint clinical_trials_registered_needs_id
  check (is_approved is not true or record_type <> 'registered_clinical_trial' or trial_registry_id is not null);

alter table public.events add column if not exists verification_status text;
alter table public.events add column if not exists relevance_type text;
update public.events set verification_status =
  case
    when event_status = 'cancelled' then 'cancelled'
    when vetting_status = 'reviewed' then 'verified'
    when description ilike '[Auto-discovered]%' or scraped_from is not null then 'auto_discovered_candidate'
    else 'unverified'
  end
 where verification_status is null;
update public.events set relevance_type =
  case
    when organizer ilike '%DMT Code%' or title ilike '%DMT Code%' then 'direct_dmtcode'
    when event_type in ('conference','webinar','public') then 'research'
    when event_type in ('workshop','training','screening') then 'educational'
    when event_type = 'meetup' then 'community'
    when event_type = 'festival' then 'cultural_adjacent'
    else 'community'
  end
 where relevance_type is null;
alter table public.events drop constraint if exists events_verification_status_check;
alter table public.events add constraint events_verification_status_check
  check (verification_status is null or verification_status in (
    'verified','organizer_confirmed','public_source_confirmed','auto_discovered_candidate',
    'unverified','cancelled','past_outcome_unknown'));
alter table public.events drop constraint if exists events_relevance_type_check;
alter table public.events add constraint events_relevance_type_check
  check (relevance_type is null or relevance_type in (
    'direct_dmtcode','research','educational','experiential','community','cultural_adjacent'));
alter table public.events alter column verification_status set default 'unverified';

update public.protocols set
  tagline = 'The 650 nm laser observation protocol: Goler''s 2025 reported setup, the DMT Code community observation configuration, and the proposed controlled study, kept separate',
  content_jsonb = jsonb_set(
    jsonb_set(
      jsonb_set(
        content_jsonb,
        '{citations}',
        (select jsonb_agg(case when c->>'doi' = '10.1001/archpsyc.1994.03950070052009'
                               then jsonb_build_object('doi','10.1001/archpsyc.1994.03950020022002','year',1994,'title','Dose-response study of N,N-dimethyltryptamine in humans. II. Subjective effects and preliminary results of a new rating scale (Strassman, Qualls, Uhlenhuth, Kellner; Arch Gen Psychiatry 51(2):98-108)')
                               else c end)
           from jsonb_array_elements(content_jsonb->'citations') c)
      ),
      '{preparation,set_setting}',
      to_jsonb('Dark or dim room. Goler''s 2025 paper used a 650 nm Class 2 laser at 1 mW on a tripod with a diffraction grating lens, projected onto a non-reflective surface at 4 to 6 feet. The DMT Code community configuration uses a red 650 nm pointer aimed at a matte, neutral surface such as a wall or ceiling; the kits sold on this site use pointers the vendor rates at 5 mW, FDA Class IIIa (Class 3R), which is a later adaptation and not the paper''s configuration. Never aim at faces, eyes, windows, or reflective surfaces. Observer seated or reclined at a comfortable distance. Recording equipment tested before the session.'::text)
    ),
    '{safety,monitoring}',
    to_jsonb('Sitter present for the entire session. Never look directly into the beam. Match your laser class to the configuration you are running: Class 2 at 1 mW for the reported Goler setup; the DMT Code kit pointers are vendor rated 5 mW, FDA Class IIIa (Class 3R), and need the same care. Observer remains seated or reclined for the duration.'::text)
  ) || jsonb_build_object(
    'three_objects_kept_separate', jsonb_build_object(
      'why', 'Three different things have been blended in the past. They are not the same object and this page keeps them apart.',
      'goler_2025_reported_setup', jsonb_build_object(
        'source', 'Goler, D. (2025). Detailing a Pilot Study: The Code of Reality Protocol. IPI Letters. DOI 10.59973/ipil.158',
        'laser', '650 nm refracted laser, Class 2, operating power 1 mW (12 x 35 mm). The paper states only Class 2 lasers at 1 mW or less were used.',
        'mount', 'Tripod',
        'optic', 'Diffraction grating lens',
        'surface', 'Non-reflective surface, for example a flat closet door or a concrete pole',
        'distance', '4 to 6 feet from surface',
        'substance_as_reported', 'Vape pen loaded with 1.0 g of N,N-DMT, 3.8 V or 4.8 V battery',
        'claimed_sample', 'The paper claims observations from more than 1,000 participants but publishes no participant-level dataset, recruitment description, null denominator or statistical recurrence analysis.'),
      'dmtcode_community_observation_configuration', jsonb_build_object(
        'what', 'The configuration described on /prepare and sold as kits. A later adaptation for home observation, not the configuration reported in the 2025 paper.',
        'laser', 'Red 650 nm pointer on a stand; the kit pointers are vendor rated 5 mW, FDA Class IIIa (Class 3R). The Triad and Circle ray box is under 1 mW. Ratings are listed per emitter on /prepare.',
        'optics', 'Three window diffraction grating (100, 300, 600 lines per mm), holographic gratings (500 and 1000 lines per mm), acrylic lens and prism set',
        'controls', 'Sober baseline first, naive first session, laser off intervals, surface swaps, draw before comparing, report nulls'),
      'proposed_controlled_study', jsonb_build_object(
        'what', 'Randomized, blinded, matched-control design with pre-registered outcomes, blinded scoring and a declared sample size. Designed, not yet run. Needs ethics review, a statistician and a qualified laser safety officer.',
        'where', 'https://dmtcode.com/methods'))
  ),
  updated_at = now()
where slug = 'dmt-laser';

commit;