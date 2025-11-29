-- Fix security issue: Set search_path for update_tag_upvotes function
CREATE OR REPLACE FUNCTION update_tag_upvotes()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.symbol_tags
    SET upvotes = upvotes + 1
    WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.symbol_tags
    SET upvotes = upvotes - 1
    WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$;