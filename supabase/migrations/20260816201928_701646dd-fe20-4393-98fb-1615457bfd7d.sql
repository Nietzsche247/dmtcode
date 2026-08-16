create policy "Authenticated can view basic profile info"
on public.profiles
for select
to authenticated
using (true);