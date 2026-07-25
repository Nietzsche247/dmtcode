create table public.follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('article','theory','protocol','retreat','event')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

grant select, insert, delete on public.follows to authenticated;
grant all on public.follows to service_role;

alter table public.follows enable row level security;

create policy "Users can view own follows" on public.follows for select using (auth.uid() = user_id);
create policy "Users can follow" on public.follows for insert with check (auth.uid() = user_id);
create policy "Users can unfollow" on public.follows for delete using (auth.uid() = user_id);

create index follows_user_created_idx on public.follows (user_id, created_at desc);