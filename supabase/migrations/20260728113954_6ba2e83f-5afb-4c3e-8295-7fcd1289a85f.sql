alter table public.registry_glyphs
  add column if not exists sealed_at timestamptz,
  add column if not exists original_record_hash text,
  add column if not exists capture_route text,
  add column if not exists catalog_exposure_before_submission text,
  add column if not exists privacy_level text not null default 'anonymous_matchable',
  add column if not exists publication_consent boolean not null default false,
  add column if not exists pseudonym text;

alter table public.registry_glyphs
  add constraint registry_glyphs_privacy_level_check
  check (privacy_level in ('private','anonymous_matchable','public_pseudonym','researcher_available'));

alter table public.registry_glyphs
  add constraint registry_glyphs_capture_route_check
  check (capture_route is null or capture_route in ('capture_page','registry_page'));

alter table public.registry_glyphs
  add constraint registry_glyphs_catalog_exposure_check
  check (catalog_exposure_before_submission is null or catalog_exposure_before_submission in ('priming_none','priming_matrix_only','priming_laser_exposed'));

alter table public.registry_glyphs
  add constraint registry_glyphs_private_requires_owner
  check (privacy_level <> 'private' or user_id is not null);

create or replace function public.seal_registry_glyph()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.sealed_at := now();
  new.original_record_hash := encode(
    sha256(convert_to(
      coalesce(new.image_data, '') || chr(31) ||
      coalesce(new.free_text_notes, '') || chr(31) ||
      coalesce(new.source, '') || chr(31) ||
      coalesce(new.perceived_surface, '') || chr(31) ||
      coalesce(new.depth, '') || chr(31) ||
      coalesce(new.motion, '') || chr(31) ||
      coalesce(new.symmetry, '') || chr(31) ||
      coalesce(new.emotional_valence, '') || chr(31) ||
      coalesce(new.communicative_intent, '') || chr(31) ||
      coalesce(new.symbol_recurrence, '') || chr(31) ||
      coalesce(new.lighting_conditions, '') || chr(31) ||
      coalesce(new.body_position, '') || chr(31) ||
      coalesce(new.time_since_appearance, '') || chr(31) ||
      coalesce(new.route_of_administration, '') || chr(31) ||
      coalesce(new.approximate_dose, '') || chr(31) ||
      coalesce(new.catalog_exposure_before_submission, '') || chr(31) ||
      coalesce(array_to_string(new.motif_tags, ','), '') || chr(31) ||
      coalesce(new.clarity_rating::text, '') || chr(31) ||
      coalesce(new.confidence_rating::text, ''),
      'UTF8')
    ), 'hex');
  return new;
end;
$$;

drop trigger if exists trg_seal_registry_glyph on public.registry_glyphs;
create trigger trg_seal_registry_glyph
  before insert on public.registry_glyphs
  for each row execute function public.seal_registry_glyph();

create or replace function public.protect_sealed_registry_glyph()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.sealed_at is null then
    return new;
  end if;
  if new.image_data is distinct from old.image_data
     or new.free_text_notes is distinct from old.free_text_notes
     or new.source is distinct from old.source
     or new.perceived_surface is distinct from old.perceived_surface
     or new.depth is distinct from old.depth
     or new.motion is distinct from old.motion
     or new.symmetry is distinct from old.symmetry
     or new.emotional_valence is distinct from old.emotional_valence
     or new.communicative_intent is distinct from old.communicative_intent
     or new.symbol_recurrence is distinct from old.symbol_recurrence
     or new.lighting_conditions is distinct from old.lighting_conditions
     or new.body_position is distinct from old.body_position
     or new.time_since_appearance is distinct from old.time_since_appearance
     or new.route_of_administration is distinct from old.route_of_administration
     or new.approximate_dose is distinct from old.approximate_dose
     or new.catalog_exposure_before_submission is distinct from old.catalog_exposure_before_submission
     or new.motif_tags is distinct from old.motif_tags
     or new.clarity_rating is distinct from old.clarity_rating
     or new.confidence_rating is distinct from old.confidence_rating
     or new.prior_exposure is distinct from old.prior_exposure
  then
    raise exception 'This memory is sealed and cannot be altered. Add a dated annotation instead.';
  end if;
  new.sealed_at := old.sealed_at;
  new.original_record_hash := old.original_record_hash;
  new.capture_route := old.capture_route;
  return new;
end;
$$;

drop trigger if exists trg_protect_sealed_registry_glyph on public.registry_glyphs;
create trigger trg_protect_sealed_registry_glyph
  before update on public.registry_glyphs
  for each row execute function public.protect_sealed_registry_glyph();

drop policy if exists "Registry glyphs are viewable by everyone" on public.registry_glyphs;
create policy "Sealed memories are viewable unless private"
  on public.registry_glyphs for select
  using (
    privacy_level <> 'private'
    or (user_id is not null and auth.uid() = user_id)
  );

create table if not exists public.glyph_annotations (
  id uuid primary key default gen_random_uuid(),
  glyph_id uuid not null references public.registry_glyphs(id) on delete cascade,
  user_id uuid,
  body text not null,
  created_at timestamptz not null default now()
);

grant select, insert on public.glyph_annotations to authenticated;
grant select on public.glyph_annotations to anon;
grant all on public.glyph_annotations to service_role;

alter table public.glyph_annotations enable row level security;

create index if not exists glyph_annotations_glyph_id_idx on public.glyph_annotations(glyph_id);

create policy "Annotations visible when the parent memory is visible"
  on public.glyph_annotations for select
  using (
    exists (
      select 1 from public.registry_glyphs g
      where g.id = glyph_annotations.glyph_id
        and (g.privacy_level <> 'private' or (g.user_id is not null and auth.uid() = g.user_id))
    )
  );

create policy "Owners can annotate their own memory"
  on public.glyph_annotations for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.registry_glyphs g
      where g.id = glyph_annotations.glyph_id
        and g.user_id is not null
        and g.user_id = auth.uid()
    )
  );