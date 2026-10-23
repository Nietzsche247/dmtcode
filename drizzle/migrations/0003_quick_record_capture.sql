ALTER TABLE public.registry_glyphs ADD COLUMN stroke_data jsonb DEFAULT NULL;
ALTER TABLE public.registry_glyphs ADD COLUMN post_seal_details jsonb DEFAULT NULL;
ALTER TABLE public.symbol_submissions ADD COLUMN post_seal_details jsonb DEFAULT NULL;
ALTER TABLE public.voice_logs ADD COLUMN glyph_id uuid REFERENCES public.registry_glyphs(id) ON DELETE SET NULL;
ALTER TABLE public.registry_glyphs DROP CONSTRAINT registry_glyphs_capture_route_check;
ALTER TABLE public.registry_glyphs ADD CONSTRAINT registry_glyphs_capture_route_check CHECK (capture_route IS NULL OR capture_route IN ('capture_page', 'registry_page', 'record'));

CREATE OR REPLACE FUNCTION public.protect_sealed_registry_glyph()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
BEGIN
  IF OLD.sealed_at IS NULL THEN RETURN NEW; END IF;
  IF OLD.capture_route = 'record' THEN
    IF (public.registry_glyph_content(NEW::public.registry_glyphs) - 'post_seal_details')
       IS DISTINCT FROM (public.registry_glyph_content(OLD::public.registry_glyphs) - 'post_seal_details') THEN
      RAISE EXCEPTION 'This memory is sealed and cannot be altered. Add a dated annotation instead.';
    END IF;
    IF NEW.post_seal_details IS DISTINCT FROM OLD.post_seal_details THEN
      IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM OLD.user_id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION 'Only the owner can add details to this record.';
      END IF;
      NEW.post_seal_details := NEW.post_seal_details || jsonb_build_object('added_at', now());
    END IF;
  ELSIF public.registry_glyph_content(NEW::public.registry_glyphs)
     IS DISTINCT FROM public.registry_glyph_content(OLD::public.registry_glyphs) THEN
    RAISE EXCEPTION 'This memory is sealed and cannot be altered. Add a dated annotation instead.';
  END IF;
  NEW.sealed_at := OLD.sealed_at;
  NEW.original_record_hash := OLD.original_record_hash;
  NEW.capture_route := OLD.capture_route;
  RETURN NEW;
END;
$function$;

CREATE FUNCTION public.sync_record_details()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
BEGIN
  IF NEW.capture_route = 'record' AND NEW.post_seal_details IS DISTINCT FROM OLD.post_seal_details THEN
    UPDATE public.symbol_submissions SET post_seal_details = NEW.post_seal_details
    WHERE registry_glyph_id = NEW.id AND user_id = NEW.user_id;
    INSERT INTO public.glyph_annotations (glyph_id, user_id, body)
    VALUES (NEW.id, NEW.user_id, jsonb_build_object('kind', 'post_seal_details', 'details', NEW.post_seal_details)::text);
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER sync_record_details_trg AFTER UPDATE OF post_seal_details ON public.registry_glyphs
FOR EACH ROW EXECUTE FUNCTION public.sync_record_details();

CREATE FUNCTION public.validate_record_capture()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $function$
DECLARE stroke jsonb; point jsonb;
BEGIN
  IF NEW.capture_route IS DISTINCT FROM 'record' THEN RETURN NEW; END IF;
  IF NEW.user_id IS NULL THEN RAISE EXCEPTION 'An account is needed to seal a record.'; END IF;
  IF NOT coalesce(NEW.is_null_report, false) AND (NEW.stroke_data IS NULL OR jsonb_typeof(NEW.stroke_data) <> 'array' OR jsonb_array_length(NEW.stroke_data) = 0) THEN
    RAISE EXCEPTION 'A stroke is required to seal a drawn record.';
  END IF;
  IF NEW.stroke_data IS NOT NULL THEN
    IF jsonb_typeof(NEW.stroke_data) <> 'array' THEN RAISE EXCEPTION 'Stroke data must be an array.'; END IF;
    FOR stroke IN SELECT value FROM jsonb_array_elements(NEW.stroke_data) LOOP
      IF jsonb_typeof(stroke) <> 'array' OR jsonb_array_length(stroke) = 0 THEN RAISE EXCEPTION 'Each stroke must contain points.'; END IF;
      FOR point IN SELECT value FROM jsonb_array_elements(stroke) LOOP
        IF jsonb_typeof(point->'x') IS DISTINCT FROM 'number' OR jsonb_typeof(point->'y') IS DISTINCT FROM 'number' OR jsonb_typeof(point->'t') IS DISTINCT FROM 'number' THEN
          RAISE EXCEPTION 'Stroke points require numeric x, y and t.';
        END IF;
      END LOOP;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER validate_record_capture_trg BEFORE INSERT OR UPDATE ON public.registry_glyphs
FOR EACH ROW EXECUTE FUNCTION public.validate_record_capture();

CREATE POLICY voice_notes_select_owner ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY voice_notes_insert_owner ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text AND EXISTS (SELECT 1 FROM public.registry_glyphs g WHERE g.user_id = auth.uid() AND name = auth.uid()::text || '/' || g.id::text || '.webm'));
CREATE POLICY voice_notes_update_owner ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text AND EXISTS (SELECT 1 FROM public.registry_glyphs g WHERE g.user_id = auth.uid() AND name = auth.uid()::text || '/' || g.id::text || '.webm'));
CREATE POLICY voice_notes_delete_owner ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);