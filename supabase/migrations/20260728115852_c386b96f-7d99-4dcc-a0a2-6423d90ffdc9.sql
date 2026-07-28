alter table public.registry_glyphs
  add column if not exists field_x numeric,
  add column if not exists field_y numeric,
  add column if not exists field_band text,
  add column if not exists field_attachment text,
  add column if not exists field_anchoring text,
  add column if not exists field_locations text,
  add column if not exists orientation text,
  add column if not exists offline_captured_at timestamptz;

alter table public.registry_glyphs
  add constraint registry_glyphs_field_x_range
    check (field_x is null or (field_x >= 0 and field_x <= 1)),
  add constraint registry_glyphs_field_y_range
    check (field_y is null or (field_y >= 0 and field_y <= 1)),
  add constraint registry_glyphs_field_band_check
    check (field_band is null or field_band in ('inside_band','on_band','outside_band','unsure')),
  add constraint registry_glyphs_field_attachment_check
    check (field_attachment is null or field_attachment in ('on_surface','floating','recessed','layered','unsure')),
  add constraint registry_glyphs_field_anchoring_check
    check (field_anchoring is null or field_anchoring in ('fixed_in_space','moved_with_me','unsure')),
  add constraint registry_glyphs_field_locations_check
    check (field_locations is null or field_locations in ('one_place','several_places','everywhere','unsure')),
  add constraint registry_glyphs_orientation_check
    check (orientation is null or orientation in ('upright','inverted','rotated','no_clear_orientation','unsure'));

create or replace function public.registry_glyph_content(rec public.registry_glyphs)
returns jsonb
language sql
immutable
set search_path = public
as $fn$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
  from jsonb_each(to_jsonb(rec))
  where value <> 'null'::jsonb
    and key not in (
      'id','user_id','created_at','updated_at',
      'sealed_at','original_record_hash','capture_route',
      'confirmation_count','is_unique',
      'privacy_level','publication_consent','pseudonym',
      'orcid','protocol_id'
    );
$fn$;

create or replace function public.seal_registry_glyph()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  new.sealed_at := now();
  new.original_record_hash := encode(
    sha256(convert_to(public.registry_glyph_content(new::public.registry_glyphs)::text, 'UTF8')),
    'hex');
  return new;
end;
$fn$;

create or replace function public.protect_sealed_registry_glyph()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if old.sealed_at is null then
    return new;
  end if;
  if public.registry_glyph_content(new::public.registry_glyphs)
     is distinct from public.registry_glyph_content(old::public.registry_glyphs) then
    raise exception 'This memory is sealed and cannot be altered. Add a dated annotation instead.';
  end if;
  new.sealed_at := old.sealed_at;
  new.original_record_hash := old.original_record_hash;
  new.capture_route := old.capture_route;
  return new;
end;
$fn$;

drop trigger if exists trg_seal_registry_glyph on public.registry_glyphs;
create trigger trg_seal_registry_glyph
  before insert on public.registry_glyphs
  for each row execute function public.seal_registry_glyph();

drop trigger if exists trg_protect_sealed_registry_glyph on public.registry_glyphs;
create trigger trg_protect_sealed_registry_glyph
  before update on public.registry_glyphs
  for each row execute function public.protect_sealed_registry_glyph();