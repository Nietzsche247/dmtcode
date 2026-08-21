create table public.trends_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null unique,
  received_at timestamptz not null default now(),
  summary jsonb,
  metrics_count int not null default 0,
  media_new int not null default 0,
  media_updated int not null default 0,
  media_total int not null default 0,
  source text not null default 'tracker'
);

create table public.trends_metrics (
  id bigserial primary key,
  run_id uuid not null references public.trends_runs(id) on delete cascade,
  run_date date not null,
  source text not null,
  keyword text not null,
  keyword_group text,
  last7 numeric,
  prior7 numeric,
  delta_pct numeric,
  anchor_ratio numeric,
  peak_date date,
  peak_val numeric,
  last28 numeric,
  prior28 numeric,
  delta28_pct numeric,
  unique (run_date, source, keyword)
);
create index on public.trends_metrics (keyword, run_date);

create table public.media_items (
  id text primary key,
  kind text not null,
  title text not null,
  channel text,
  published_raw text,
  published_date date,
  url text,
  views bigint,
  prior_views bigint,
  views_gain bigint generated always as (case when views is not null and prior_views is not null then views - prior_views else null end) stored,
  first_seen date not null,
  last_seen date not null,
  updated_at timestamptz not null default now()
);
create index on public.media_items (kind, first_seen desc);

grant select on public.trends_runs to authenticated;
grant select on public.trends_metrics to authenticated;
grant select on public.media_items to authenticated;
grant all on public.trends_runs to service_role;
grant all on public.trends_metrics to service_role;
grant all on public.media_items to service_role;
grant usage, select on sequence public.trends_metrics_id_seq to service_role;

alter table public.trends_runs enable row level security;
alter table public.trends_metrics enable row level security;
alter table public.media_items enable row level security;

create policy "Admins can view trends runs" on public.trends_runs
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::app_role));
create policy "Service role manages trends runs" on public.trends_runs
  for all to service_role using (true) with check (true);

create policy "Admins can view trends metrics" on public.trends_metrics
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::app_role));
create policy "Service role manages trends metrics" on public.trends_metrics
  for all to service_role using (true) with check (true);

create policy "Admins can view media items" on public.media_items
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::app_role));
create policy "Service role manages media items" on public.media_items
  for all to service_role using (true) with check (true);