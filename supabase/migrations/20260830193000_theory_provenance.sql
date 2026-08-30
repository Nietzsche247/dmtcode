-- Applied to production 2026-08-30 via the Lovable connector, then written here
-- so the repo and the database do not drift. Guarded, so re-application is a no-op.
--
-- Same root cause as 20260830190000: data-json.ts already selected seven
-- optional provenance columns on theories, already emitted them, already tallied
-- them in corpus_composition, and already documented every one of them in
-- field_definitions. None of the columns existed, so all seven were dropped and
-- the whole provenance layer was invisible. The code was finished; only the
-- schema was missing.
--
-- Why the layer matters: the legacy `proponent` field mixed the person who built
-- a framework with the person who pointed it at this phenomenon. That let
-- borrowed frameworks read as though their authors had endorsed the 650 nm laser
-- claim. Jung, Wheeler, Hoffman, Kastrup, Campbell, Strassman, McKenna,
-- Carhart-Harris, Friston, Kluver, Bressloff, Cowan, Shanon, Lewis-Williams and
-- Timmermann never wrote about it. Fifteen of the twenty theories are now marked
-- directly_addresses_dmt_laser = false for exactly that reason.

alter table public.theories add column if not exists theory_class text;
alter table public.theories add column if not exists framework_originator text;
alter table public.theories add column if not exists applied_to_dmtcode_by text;
alter table public.theories add column if not exists directly_addresses_dmt_laser boolean;
alter table public.theories add column if not exists original_publication_year integer;
alter table public.theories add column if not exists dmtcode_application_year integer;
alter table public.theories add column if not exists primary_source text;

alter table public.theories drop constraint if exists theories_class_vocab;
alter table public.theories add constraint theories_class_vocab
  check (
    theory_class is null
    or theory_class in (
      'deflationary',
      'neurocognitive',
      'psychological',
      'phenomenological',
      'ontological',
      'metaphysical',
      'cultural_historical'
    )
  );

-- original_publication_year is deliberately left null. Its own field definition
-- says null where it could not be established from a source that was actually
-- checked, and none were checked in this pass.
--
-- primary_source is also left null. Six theories still carry a Wikipedia
-- source_url (Terence McKenna, Bernardo Kastrup, Collective unconscious, The
-- Mind in the Cave, Benny Shanon, Hypnagogia). Wikipedia is not a primary source
-- for a framework its author published elsewhere, but inventing a publisher URL
-- to fill the gap would be worse than leaving it empty.
