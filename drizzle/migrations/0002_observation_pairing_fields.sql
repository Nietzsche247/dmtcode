ALTER TABLE public.registry_glyphs
  ADD COLUMN IF NOT EXISTS is_sober_baseline boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_null_report boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS time_since_observation text,
  ADD COLUMN IF NOT EXISTS stimulus_photo_paths text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS other_method_text text,
  ADD COLUMN IF NOT EXISTS context_note text,
  ADD COLUMN IF NOT EXISTS observation_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS wavelength_text text,
  ADD COLUMN IF NOT EXISTS svg_data text,
  ADD COLUMN IF NOT EXISTS vector_json jsonb;

ALTER TABLE public.symbol_submissions
  ADD COLUMN IF NOT EXISTS is_null_report boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS time_since_observation text,
  ADD COLUMN IF NOT EXISTS stimulus_photo_paths text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS catalog_exposure_before_submission text,
  ADD COLUMN IF NOT EXISTS other_method_text text;

ALTER TABLE public.registry_glyphs DROP CONSTRAINT registry_glyphs_catalog_exposure_check;
ALTER TABLE public.registry_glyphs ADD CONSTRAINT registry_glyphs_catalog_exposure_check
  CHECK (catalog_exposure_before_submission IS NULL OR catalog_exposure_before_submission IN
    ('priming_none', 'priming_matrix_only', 'priming_laser_exposed', 'priming_registry'));

CREATE OR REPLACE FUNCTION public.sync_symbol_submission_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  IF NEW.privacy_level = 'private' AND NEW.registry_glyph_id IS NOT NULL THEN
    NEW.status := 'pending';
    NEW.visibility_status := 'hidden';
    NEW.published_at := NULL;
    NEW.review_due_at := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.status = 'approved' THEN
      NEW.visibility_status := 'public';
    ELSIF NEW.status = 'rejected' THEN
      NEW.visibility_status := 'hidden';
    ELSE
      NEW.visibility_status := 'private';
    END IF;
  ELSE
    IF NEW.visibility_status IS DISTINCT FROM OLD.visibility_status THEN
      IF NEW.visibility_status = 'public' THEN
        NEW.status := 'approved';
      ELSIF NEW.visibility_status = 'hidden' THEN
        NEW.status := 'rejected';
      ELSE
        NEW.status := 'pending';
      END IF;
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'approved' THEN
        NEW.visibility_status := 'public';
      ELSIF NEW.status = 'rejected' THEN
        NEW.visibility_status := 'hidden';
      ELSE
        NEW.visibility_status := 'private';
      END IF;
    END IF;
    IF NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM NEW.status
       AND NEW.moderation_status IS NOT DISTINCT FROM OLD.moderation_status THEN
      NEW.moderation_status := 'denied';
    END IF;
    IF NEW.moderated_at IS NOT NULL AND OLD.moderated_at IS NULL
       AND NEW.moderation_status = 'unreviewed' THEN
      NEW.moderation_status := 'reviewed';
    END IF;
  END IF;
  IF NEW.visibility_status = 'public' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
    IF NOT NEW.is_curated_example THEN
      NEW.review_due_at := now() + interval '72 hours';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mirror_glyph_to_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  IF coalesce(length(btrim(NEW.image_data)), 0) = 0 AND NOT coalesce(NEW.is_null_report, false) THEN
    RAISE EXCEPTION 'A drawing is required unless this is a null report.';
  END IF;
  INSERT INTO public.symbol_submissions (
    registry_glyph_id, user_id, image_url, description, tags,
    source_method, surface_type, duration_seconds, emotional_valence,
    confidence_rating, symmetry, privacy_level, publication_consent,
    created_at, status, visibility_status, published_at, review_due_at, is_curated_example,
    prior_exposure, catalog_exposure_before_submission, wavelength,
    is_sober_baseline, is_null_report, time_since_observation, stimulus_photo_paths,
    other_method_text, context_note, dose_level, recurrence, svg_data, vector_json
  ) VALUES (
    NEW.id, NEW.user_id, coalesce(NEW.image_data, ''),
    nullif(btrim(coalesce(NEW.free_text_notes, '')), ''),
    CASE WHEN coalesce(NEW.is_null_report, false)
      THEN ARRAY(SELECT DISTINCT unnest(coalesce(NEW.motif_tags, '{}') || ARRAY['null_report']))
      ELSE coalesce(NEW.motif_tags, '{}') END,
    CASE NEW.source WHEN '650nm_laser' THEN 'laser_650nm'
      WHEN 'closed_eyes' THEN 'closed_eye' WHEN 'open_eyes' THEN 'open_eye' ELSE 'other' END,
    NEW.perceived_surface, coalesce(NEW.observation_duration_seconds, NEW.drawing_duration_seconds),
    CASE WHEN NEW.emotional_valence IN ('positive','neutral','negative','mixed')
      THEN NEW.emotional_valence ELSE NULL END,
    NEW.confidence_rating, NEW.symmetry, NEW.privacy_level, coalesce(NEW.publication_consent, false),
    NEW.created_at,
    CASE WHEN NEW.privacy_level = 'private' THEN 'pending' ELSE 'approved' END::public.submission_status,
    CASE WHEN NEW.privacy_level = 'private' THEN 'hidden' ELSE 'public' END::public.symbol_visibility_status,
    CASE WHEN NEW.privacy_level = 'private' THEN NULL ELSE now() END,
    CASE WHEN NEW.privacy_level = 'private' THEN NULL ELSE now() + interval '72 hours' END,
    false,
    CASE WHEN NEW.prior_exposure IS false THEN 'naive'
      WHEN NEW.prior_exposure IS true THEN 'exposed' ELSE NULL END,
    NEW.catalog_exposure_before_submission, coalesce(NEW.wavelength_text, NEW.wavelength_nm::text),
    coalesce(NEW.is_sober_baseline, false), coalesce(NEW.is_null_report, false),
    NEW.time_since_observation, coalesce(NEW.stimulus_photo_paths, '{}'),
    NEW.other_method_text, NEW.context_note, NEW.approximate_dose, NEW.symbol_recurrence,
    NEW.svg_data, NEW.vector_json
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_submission_image()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $function$
BEGIN
  IF NOT coalesce(NEW.is_null_report, false) AND coalesce(length(btrim(NEW.image_url)), 0) = 0 THEN
    RAISE EXCEPTION 'A drawing is required unless this is a null report.';
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER validate_submission_image_trg
  BEFORE INSERT OR UPDATE OF image_url, is_null_report ON public.symbol_submissions
  FOR EACH ROW EXECUTE FUNCTION public.validate_submission_image();

DO $backfill$
DECLARE updated_count integer;
BEGIN
  UPDATE public.symbol_submissions s
  SET prior_exposure = CASE WHEN g.prior_exposure IS false THEN 'naive'
        WHEN g.prior_exposure IS true THEN 'exposed' ELSE NULL END,
      catalog_exposure_before_submission = g.catalog_exposure_before_submission
  FROM public.registry_glyphs g
  WHERE s.registry_glyph_id = g.id AND s.prior_exposure IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Linked exposure backfill updated % rows', updated_count;
END;
$backfill$;

CREATE POLICY "Owners upload stimulus photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stimulus-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners read stimulus photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'stimulus-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners remove stimulus photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'stimulus-photos' AND (storage.foldername(name))[1] = auth.uid()::text);