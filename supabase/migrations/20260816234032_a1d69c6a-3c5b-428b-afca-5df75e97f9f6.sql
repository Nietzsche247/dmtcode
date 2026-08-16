create table public.translation_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  table_name text,
  locale text,
  checked int not null default 0,
  translated int not null default 0,
  skipped int not null default 0,
  errors int not null default 0,
  pending boolean not null default false,
  note text
);
grant select on public.translation_runs to authenticated;
grant all on public.translation_runs to service_role;
alter table public.translation_runs enable row level security;
create policy "Admins read translation runs" on public.translation_runs
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));