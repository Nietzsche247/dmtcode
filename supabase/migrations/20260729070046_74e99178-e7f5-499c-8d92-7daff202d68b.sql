drop policy if exists "Users submit own or anonymous registry glyphs" on public.registry_glyphs;
create policy "Signed in users submit their own registry glyphs"
  on public.registry_glyphs
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "Users create own or anonymous voice logs" on public.voice_logs;
create policy "Signed in users create their own voice logs"
  on public.voice_logs
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());