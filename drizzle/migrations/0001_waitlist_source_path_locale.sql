alter table public.waitlist add column if not exists source_path text;
alter table public.waitlist add column if not exists locale text;
alter table public.waitlist add constraint waitlist_source_path_len check (source_path is null or length(source_path) <= 200);
alter table public.waitlist add constraint waitlist_locale_len check (locale is null or length(locale) <= 8);
create unique index if not exists waitlist_email_lower_uidx on public.waitlist (lower(email));