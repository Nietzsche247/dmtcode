create table if not exists public.symbol_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target text not null check (target in ('symbol_submission','registry_glyph')),
  target_id uuid not null,
  response_type text not null check (response_type in (
    'independent_prior_record',
    'same_location',
    'similar_without_laser',
    'contradictory_null',
    'field_note')),
  linked_glyph_id uuid references public.registry_glyphs(id) on delete set null,
  note text check (note is null or char_length(note) <= 2000),
  review_status text not null default 'unreviewed'
    check (review_status in ('unreviewed','candidate','reviewed_match','reviewed_not_match')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

grant select, insert, delete on public.symbol_responses to authenticated;
grant all on public.symbol_responses to service_role;

create unique index if not exists symbol_responses_one_per_type
  on public.symbol_responses (user_id, target, target_id, response_type)
  where response_type <> 'field_note';

create index if not exists symbol_responses_target_idx
  on public.symbol_responses (target, target_id);

alter table public.symbol_responses enable row level security;

create policy "Users read their own responses"
  on public.symbol_responses for select
  using (auth.uid() = user_id);

create policy "Users record their own responses"
  on public.symbol_responses for insert
  with check (
    auth.uid() = user_id
    and (response_type <> 'independent_prior_record' or linked_glyph_id is not null)
    and (response_type <> 'field_note' or (note is not null and char_length(btrim(note)) > 0))
  );

create policy "Users withdraw their own unreviewed responses"
  on public.symbol_responses for delete
  using (auth.uid() = user_id and review_status = 'unreviewed');

create or replace function public.validate_symbol_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  g_user uuid;
  g_sealed timestamptz;
begin
  if new.target = 'symbol_submission' then
    if not exists (select 1 from public.symbol_submissions where id = new.target_id) then
      raise exception 'That symbol does not exist.';
    end if;
  else
    if not exists (select 1 from public.registry_glyphs where id = new.target_id) then
      raise exception 'That symbol does not exist.';
    end if;
  end if;

  if new.response_type = 'independent_prior_record' then
    if new.linked_glyph_id is null then
      raise exception 'An independent prior record must point to a memory you sealed.';
    end if;
    select user_id, sealed_at into g_user, g_sealed
      from public.registry_glyphs where id = new.linked_glyph_id;
    if g_user is null or g_user <> new.user_id then
      raise exception 'You can only link a memory you sealed yourself.';
    end if;
    if g_sealed is null then
      raise exception 'That memory has not been sealed, so it cannot support an independent match.';
    end if;
  elsif new.linked_glyph_id is not null then
    raise exception 'Only an independent prior record can link to a sealed memory.';
  end if;

  return new;
end;
$fn$;

drop trigger if exists trg_validate_symbol_response on public.symbol_responses;
create trigger trg_validate_symbol_response
  before insert on public.symbol_responses
  for each row execute function public.validate_symbol_response();

create or replace function public.symbol_response_counts(p_target text, p_target_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $fn$
  select jsonb_build_object(
    'independent_prior_record',
      count(*) filter (where r.response_type = 'independent_prior_record'),
    'independent_prior_record_blind',
      count(*) filter (where r.response_type = 'independent_prior_record'
                         and g.capture_route = 'capture_page'
                         and g.prior_exposure is false),
    'candidate_match',
      count(*) filter (where r.response_type = 'independent_prior_record'
                         and r.review_status = 'candidate'),
    'reviewed_match',
      count(*) filter (where r.response_type = 'independent_prior_record'
                         and r.review_status = 'reviewed_match'),
    'same_location',      count(*) filter (where r.response_type = 'same_location'),
    'similar_without_laser', count(*) filter (where r.response_type = 'similar_without_laser'),
    'contradictory_null', count(*) filter (where r.response_type = 'contradictory_null'),
    'field_note',         count(*) filter (where r.response_type = 'field_note')
  )
  from public.symbol_responses r
  left join public.registry_glyphs g on g.id = r.linked_glyph_id
  where r.target = p_target and r.target_id = p_target_id;
$fn$;

grant execute on function public.symbol_response_counts(text, uuid) to anon, authenticated;