-- D-08: drop forgeable badge INSERT policy; SELECT policies are untouched
drop policy if exists "Users can view their earned badges" on public.user_badges;

-- D-09: view must run with invoker rights so underlying RLS applies
alter view public.retreat_referral_stats set (security_invoker = on);
revoke select on public.retreat_referral_stats from anon;

-- D-12: drop blanket-authenticated read of the moderation trail
drop policy if exists "Authenticated read review activity" on public.review_activity;
-- explicit admin SELECT (own-row member policy already exists and is untouched)
drop policy if exists "Admins read review activity" on public.review_activity;
create policy "Admins read review activity"
  on public.review_activity for select to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

-- D-13: bind surface_tags attribution to the writer
drop policy if exists "Authenticated users can create tags" on public.surface_tags;
create policy "Authenticated users can create tags"
  on public.surface_tags for insert to authenticated
  with check (auth.uid() = user_id);

-- D-14: admin read access to scraper bookkeeping tables (no write policies)
grant select on public.festival_watchlist to authenticated;
grant select on public.festival_scrape_log to authenticated;
create policy "Admins read festival watchlist"
  on public.festival_watchlist for select to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));
create policy "Admins read festival scrape log"
  on public.festival_scrape_log for select to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

-- D-11: bound anon write sinks (all existing rows verified to pass)
alter table public.waitlist
  add constraint waitlist_email_check check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  add constraint waitlist_source_len check (length(source) <= 200);

alter table public.event_leads
  add constraint event_leads_email_check check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  add constraint event_leads_name_len check (length(name) <= 200),
  add constraint event_leads_message_len check (length(message) <= 2000),
  add constraint event_leads_source_path_len check (length(source_path) <= 2000);

alter table public.product_signups
  add constraint product_signups_email_check check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  add constraint product_signups_bundle_slug_len check (length(bundle_slug) <= 200);

-- D-10a: constrain crawler_hits shape
alter table public.crawler_hits
  add constraint crawler_hits_path_check check (path ~ '^/' and length(path) <= 512),
  add constraint crawler_hits_bot_name_len check (length(bot_name) <= 100),
  add constraint crawler_hits_bot_class_len check (length(bot_class) <= 100),
  add constraint crawler_hits_user_agent_len check (length(user_agent) <= 1000),
  add constraint crawler_hits_referer_len check (length(referer) <= 2000),
  add constraint crawler_hits_ip_len check (length(ip_address) <= 100);