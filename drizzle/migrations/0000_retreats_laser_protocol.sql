ALTER TABLE public.retreats
  ADD COLUMN IF NOT EXISTS laser_protocol text NOT NULL DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS laser_protocol_source text,
  ADD COLUMN IF NOT EXISTS laser_protocol_last_verified date;

ALTER TABLE public.retreats
  ADD CONSTRAINT retreats_laser_protocol_values_chk
  CHECK (laser_protocol IN ('Yes','No','Unverified'));

ALTER TABLE public.retreats
  ADD CONSTRAINT retreats_laser_protocol_yes_needs_source_chk
  CHECK (laser_protocol <> 'Yes' OR laser_protocol_source IS NOT NULL);

UPDATE public.retreats
   SET laser_protocol = 'No',
       laser_protocol_last_verified = DATE '2026-09-21'
 WHERE laser_protocol_last_verified IS NULL;