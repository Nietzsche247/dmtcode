-- Add new metadata fields to registry_glyphs table
ALTER TABLE registry_glyphs
ADD COLUMN IF NOT EXISTS time_since_appearance text,
ADD COLUMN IF NOT EXISTS drawing_duration_seconds integer,
ADD COLUMN IF NOT EXISTS clarity_rating integer CHECK (clarity_rating >= 1 AND clarity_rating <= 5),
ADD COLUMN IF NOT EXISTS confidence_rating integer CHECK (confidence_rating >= 1 AND confidence_rating <= 5),
ADD COLUMN IF NOT EXISTS symbol_recurrence text,
ADD COLUMN IF NOT EXISTS lighting_conditions text,
ADD COLUMN IF NOT EXISTS body_position text;

-- Update surface_tags to add user_id for attribution
ALTER TABLE surface_tags
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_surface_tags_upvotes ON surface_tags(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_registry_glyphs_confirmation ON registry_glyphs(confirmation_count DESC);