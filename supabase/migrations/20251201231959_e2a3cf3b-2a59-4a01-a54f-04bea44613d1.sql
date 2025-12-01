CREATE POLICY "events_select_approved" ON public.events FOR SELECT USING (is_approved = true OR auth.uid() = submitted_by);
CREATE POLICY "events_insert_auth" ON public.events FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "events_update_admin" ON public.events FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "trials_select_approved" ON public.clinical_trials FOR SELECT USING (is_approved = true OR auth.uid() = submitted_by);
CREATE POLICY "trials_insert_auth" ON public.clinical_trials FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "trials_update_admin" ON public.clinical_trials FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "retreats_select_approved" ON public.retreats FOR SELECT USING (is_approved = true OR auth.uid() = submitted_by);
CREATE POLICY "retreats_insert_auth" ON public.retreats FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "retreats_update_admin" ON public.retreats FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "notes_select_approved" ON public.community_notes FOR SELECT USING (is_approved = true OR auth.uid() = author_id);
CREATE POLICY "notes_insert_auth" ON public.community_notes FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "notes_update_admin" ON public.community_notes FOR UPDATE USING (has_role(auth.uid(), 'admin'));